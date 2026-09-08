const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { requireActiveSubscription } = require("../middleware/subscription");
const { insertId } = require("../utils/insert-id");
const sendgrid = require("../services/integrations/sendgrid");
const twilio = require("../services/integrations/twilio");

const router = express.Router();
router.use(requireAuth, requireActiveSubscription);
const canWrite = requireRole("owner", "manager", "staff");
const channels = ["email", "sms", "whatsapp"];
const stepSchema = z.object({ channel: z.enum(channels), subject: z.string().max(300).optional().default(""), body: z.string().min(1).max(6000), delay_hours: z.number().int().min(0).max(8760).default(0) });
const campaignSchema = z.object({ name: z.string().min(2).max(160), audience: z.enum(["vendors", "customers", "all"]), market_id: z.number().int().positive().nullable().optional(), steps: z.array(stepSchema).min(1).max(8) });
const subscriberSchema = z.object({ name: z.string().max(160).optional().default(""), email: z.string().email().optional().or(z.literal("")).default(""), phone: z.string().min(7).max(40).optional().or(z.literal("")).default("") }).refine((value) => value.email || value.phone, { message: "An email address or phone number is required" });
const parseSteps = (campaign) => { try { return JSON.parse(campaign.steps || "[]"); } catch { return []; } };
const publicCampaign = (campaign) => ({ ...campaign, steps: parseSteps(campaign) });

async function recipients(orgId, audience, marketId) {
  const rows = [];
  if (audience === "vendors" || audience === "all") {
    const vendors = marketId
      ? await db("vendors as v").join("vendor_markets as vm", "vm.vendor_id", "v.id").where({ "v.org_id": orgId, "vm.org_id": orgId, "vm.market_id": marketId }).select("v.business_name as name", "v.email", "v.phone")
      : await db("vendors").where({ org_id: orgId }).select("business_name as name", "email", "phone");
    rows.push(...vendors);
  }
  if (audience === "customers" || audience === "all") rows.push(...await db("newsletter_subscribers").where({ org_id: orgId, active: true }).select("name", "email", "phone"));
  const seen = new Set();
  return rows.filter((row) => { const key = `${row.email || ""}:${row.phone || ""}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

router.get("/", asyncHandler(async (req, res) => {
  const campaigns = await db("campaigns").where({ org_id: req.user.org_id }).orderBy("created_at", "desc");
  const ids = campaigns.map((campaign) => campaign.id);
  const messages = ids.length ? await db("campaign_messages").whereIn("campaign_id", ids).select("campaign_id", "status") : [];
  const counts = new Map();
  for (const message of messages) counts.set(message.campaign_id, { ...(counts.get(message.campaign_id) || {}), [message.status]: (counts.get(message.campaign_id)?.[message.status] || 0) + 1 });
  res.json({ campaigns: campaigns.map((campaign) => ({ ...publicCampaign(campaign), delivery_counts: counts.get(campaign.id) || {} })) });
}));

router.post("/", canWrite, validate(campaignSchema), asyncHandler(async (req, res) => {
  if (req.body.market_id) { const market = await db("markets").where({ id: req.body.market_id, org_id: req.user.org_id }).first(); if (!market) throw new ApiError(404, "Market not found"); }
  const id = await insertId(db, "campaigns", { org_id: req.user.org_id, name: req.body.name, audience: req.body.audience, market_id: req.body.market_id || null, status: "draft", steps: JSON.stringify(req.body.steps) });
  const campaign = await db("campaigns").where({ id }).first();
  res.status(201).json({ campaign: publicCampaign(campaign) });
}));

router.get("/subscribers", asyncHandler(async (req, res) => res.json({ subscribers: await db("newsletter_subscribers").where({ org_id: req.user.org_id }).orderBy("created_at", "desc") })));
router.post("/subscribers", canWrite, validate(subscriberSchema), asyncHandler(async (req, res) => {
  const id = await insertId(db, "newsletter_subscribers", { ...req.body, org_id: req.user.org_id });
  res.status(201).json({ subscriber: await db("newsletter_subscribers").where({ id }).first() });
}));
router.delete("/subscribers/:id", canWrite, asyncHandler(async (req, res) => { const count = await db("newsletter_subscribers").where({ id: req.params.id, org_id: req.user.org_id }).del(); if (!count) throw new ApiError(404, "Subscriber not found"); res.json({ ok: true }); }));

router.post("/:id/launch", canWrite, asyncHandler(async (req, res) => {
  const campaign = await db("campaigns").where({ id: req.params.id, org_id: req.user.org_id }).first();
  if (!campaign) throw new ApiError(404, "Campaign not found");
  const steps = parseSteps(campaign); if (!steps.length) throw new ApiError(400, "Campaign has no message steps");
  const marketId = req.query.market_id ? Number(req.query.market_id) : campaign.market_id || null;
  const audience = await recipients(req.user.org_id, campaign.audience, marketId);
  const now = Date.now(); const messages = [];
  for (const step of steps) for (const recipient of audience) messages.push({ org_id: req.user.org_id, campaign_id: campaign.id, recipient_name: recipient.name || "", recipient_email: recipient.email || "", recipient_phone: recipient.phone || "", channel: step.channel, subject: step.subject || "", body: step.body, scheduled_at: new Date(now + step.delay_hours * 3600000).toISOString() });
  if (messages.length) await db("campaign_messages").insert(messages);
  await db("campaigns").where({ id: campaign.id }).update({ status: "active", updated_at: new Date().toISOString() });
  res.json({ queued: messages.length, campaign: publicCampaign(await db("campaigns").where({ id: campaign.id }).first()) });
}));

async function processDueCampaigns() {
  const due = await db("campaign_messages").where({ status: "queued" }).where("scheduled_at", "<=", new Date().toISOString()).orderBy("scheduled_at").limit(50);
  for (const message of due) {
    await db("campaign_messages").where({ id: message.id, status: "queued" }).update({ status: "sending" });
    try {
      if (message.channel === "email") { if (!message.recipient_email) throw new Error("No email address"); await sendgrid.send(message.org_id, { to: message.recipient_email, subject: message.subject || "MarketHub update", text: message.body, html: `<p>${message.body.replace(/\n/g, "<br>")}</p>` }); }
      else if (message.channel === "sms") { if (!message.recipient_phone) throw new Error("No mobile number"); await twilio.send(message.org_id, { to: message.recipient_phone, body: message.body }); }
      else { if (!message.recipient_phone) throw new Error("No mobile number"); await twilio.send(message.org_id, { to: message.recipient_phone, body: message.body, whatsapp: true }); }
      await db("campaign_messages").where({ id: message.id }).update({ status: "sent", sent_at: new Date().toISOString() });
    } catch (error) { await db("campaign_messages").where({ id: message.id }).update({ status: "failed", error: error.message.slice(0, 1000) }); }
  }
}

module.exports = { router, processDueCampaigns };
