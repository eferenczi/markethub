const crypto = require("crypto");
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
const imageData = z
  .string()
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/)
  .max(3_000_000);
const stepSchema = z.object({
  channel: z.enum(channels),
  subject: z.string().max(300).optional().default(""),
  body: z.string().min(1).max(6000),
  delay_hours: z.number().int().min(0).max(8760).default(0),
  design: z
    .object({
      heading: z.string().max(200).optional().default(""),
      accent_color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional()
        .default("#1f5a4c"),
      cta_label: z.string().max(80).optional().default(""),
      cta_url: z.string().url().optional().or(z.literal("")).default(""),
      logo_data: imageData.optional().or(z.literal("")).default(""),
      image_data: imageData.optional().or(z.literal("")).default(""),
    })
    .optional(),
});
const campaignSchema = z.object({
  name: z.string().min(2).max(160),
  audience: z.enum([
    "vendors",
    "market_participants",
    "customers",
    "all",
    "category",
    "specific_vendor",
  ]),
  market_id: z.number().int().positive().nullable().optional(),
  audience_config: z
    .object({
      category: z.string().max(120).optional().default(""),
      vendor_ids: z
        .array(z.number().int().positive())
        .max(100)
        .optional()
        .default([]),
    })
    .optional()
    .default({}),
  steps: z.array(stepSchema).min(1).max(8),
});
const subscriberSchema = z
  .object({
    name: z.string().max(160).optional().default(""),
    email: z.string().email().optional().or(z.literal("")).default(""),
    phone: z.string().min(7).max(40).optional().or(z.literal("")).default(""),
  })
  .refine((value) => value.email || value.phone, {
    message: "An email address or phone number is required",
  });
const parseSteps = (campaign) => {
  try {
    return JSON.parse(campaign.steps || "[]");
  } catch {
    return [];
  }
};
const publicCampaign = (campaign) => ({
  ...campaign,
  steps: parseSteps(campaign),
  audience_config: (() => {
    try {
      return JSON.parse(campaign.audience_config || "{}");
    } catch {
      return {};
    }
  })(),
});
const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
const newsletterHtml = (step) => {
  if (!step.design) return "";
  const accent = step.design.accent_color || "#1f5a4c";
  const heading = escapeHtml(
    step.design.heading || step.subject || "MarketHub update",
  );
  const body = escapeHtml(step.body).replace(/\n/g, "<br>");
  const cta =
    step.design.cta_label && step.design.cta_url
      ? `<p style=\"margin:28px 0 0\"><a href=\"${escapeHtml(step.design.cta_url)}\" style=\"display:inline-block;background:${accent};color:#ffffff;padding:12px 18px;border-radius:7px;text-decoration:none;font-weight:700\">${escapeHtml(step.design.cta_label)}</a></p>`
      : "";
  const logo = step.design.logo_data
    ? `<img src=\"${step.design.logo_data}\" alt=\"Logo\" style=\"display:block;max-height:56px;max-width:220px;margin:0 0 22px\">`
    : "";
  const image = step.design.image_data
    ? `<img src=\"${step.design.image_data}\" alt=\"Newsletter image\" style=\"display:block;width:100%;max-height:300px;object-fit:cover;margin:22px 0;border-radius:8px\">`
    : "";
  return `<div style=\"background:#f6f3ed;padding:28px 12px;font-family:Arial,sans-serif;color:#17372f\"><main style=\"max-width:620px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden\"><div style=\"height:10px;background:${accent}\"></div><div style=\"padding:34px\">${logo}<h1 style=\"font-size:25px;line-height:1.2;margin:0 0 16px\">${heading}</h1><div style=\"font-size:16px;line-height:1.6\">${body}</div>${image}${cta}</div></main></div>`;
};

async function recipients(orgId, audience, marketId, audienceConfig = {}) {
  const rows = [];
  if (audience === "market_participants") {
    if (!marketId)
      throw new ApiError(400, "Choose a market for market participants");
    rows.push(
      ...(await db("approvals as a")
        .join("vendors as v", "v.id", "a.vendor_id")
        .where({ "a.org_id": orgId, "a.market_id": marketId })
        .whereNot("a.status", "rejected")
        .select("v.business_name as name", "v.email", "v.phone")),
    );
  } else if (audience === "category") {
    if (!audienceConfig.category)
      throw new ApiError(400, "Choose a vendor category");
    rows.push(
      ...(await db("vendors")
        .where({ org_id: orgId, category: audienceConfig.category })
        .select("business_name as name", "email", "phone")),
    );
  } else if (audience === "specific_vendor") {
    if (!audienceConfig.vendor_ids?.length)
      throw new ApiError(400, "Choose at least one vendor contact");
    rows.push(
      ...(await db("vendors")
        .where({ org_id: orgId })
        .whereIn("id", audienceConfig.vendor_ids)
        .select("business_name as name", "email", "phone")),
    );
  } else if (audience === "vendors" || audience === "all") {
    const vendors = marketId
      ? await db("vendors as v")
          .join("vendor_markets as vm", "vm.vendor_id", "v.id")
          .where({
            "v.org_id": orgId,
            "vm.org_id": orgId,
            "vm.market_id": marketId,
          })
          .select("v.business_name as name", "v.email", "v.phone")
      : await db("vendors")
          .where({ org_id: orgId })
          .select("business_name as name", "email", "phone");
    rows.push(...vendors);
  }
  if (audience === "customers" || audience === "all")
    rows.push(
      ...(await db("newsletter_subscribers")
        .where({ org_id: orgId, active: true })
        .select("name", "email", "phone")),
    );
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.email || ""}:${row.phone || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const campaigns = await db("campaigns")
      .where({ org_id: req.user.org_id })
      .orderBy("created_at", "desc");
    const ids = campaigns.map((campaign) => campaign.id);
    const messages = ids.length
      ? await db("campaign_messages")
          .whereIn("campaign_id", ids)
          .select("campaign_id", "status")
      : [];
    const counts = new Map();
    for (const message of messages)
      counts.set(message.campaign_id, {
        ...(counts.get(message.campaign_id) || {}),
        [message.status]:
          (counts.get(message.campaign_id)?.[message.status] || 0) + 1,
      });
    res.json({
      campaigns: campaigns.map((campaign) => ({
        ...publicCampaign(campaign),
        delivery_counts: counts.get(campaign.id) || {},
      })),
    });
  }),
);

router.get(
  "/public-links",
  canWrite,
  asyncHandler(async (req, res) => {
    const organization = await db("organizations")
      .where({ id: req.user.org_id })
      .first();
    const public_subscribe_key =
      organization.public_subscribe_key ||
      crypto.randomBytes(18).toString("base64url");
    if (!organization.public_subscribe_key)
      await db("organizations")
        .where({ id: organization.id })
        .update({ public_subscribe_key });
    res.json({
      vendor_key: organization.public_apply_key,
      subscribe_key: public_subscribe_key,
    });
  }),
);

router.post(
  "/",
  canWrite,
  validate(campaignSchema),
  asyncHandler(async (req, res) => {
    if (req.body.market_id) {
      const market = await db("markets")
        .where({ id: req.body.market_id, org_id: req.user.org_id })
        .first();
      if (!market) throw new ApiError(404, "Market not found");
    }
    const id = await insertId(db, "campaigns", {
      org_id: req.user.org_id,
      name: req.body.name,
      audience: req.body.audience,
      market_id: req.body.market_id || null,
      status: "draft",
      steps: JSON.stringify(req.body.steps),
      audience_config: JSON.stringify(req.body.audience_config || {}),
    });
    const campaign = await db("campaigns").where({ id }).first();
    res.status(201).json({ campaign: publicCampaign(campaign) });
  }),
);

router.get(
  "/subscribers",
  asyncHandler(async (req, res) =>
    res.json({
      subscribers: await db("newsletter_subscribers")
        .where({ org_id: req.user.org_id })
        .orderBy("created_at", "desc"),
    }),
  ),
);
router.post(
  "/subscribers",
  canWrite,
  validate(subscriberSchema),
  asyncHandler(async (req, res) => {
    const id = await insertId(db, "newsletter_subscribers", {
      ...req.body,
      org_id: req.user.org_id,
    });
    res.status(201).json({
      subscriber: await db("newsletter_subscribers").where({ id }).first(),
    });
  }),
);
router.delete(
  "/subscribers/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const count = await db("newsletter_subscribers")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .del();
    if (!count) throw new ApiError(404, "Subscriber not found");
    res.json({ ok: true });
  }),
);
router.patch(
  "/subscribers/:id",
  canWrite,
  validate(
    z
      .object({
        name: z.string().max(160).optional(),
        email: z.string().email().or(z.literal("")).optional(),
        phone: z.string().min(7).max(40).or(z.literal("")).optional(),
      })
      .refine((value) => Object.keys(value).length > 0),
  ),
  asyncHandler(async (req, res) => {
    const existing = await db("newsletter_subscribers")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .first();
    if (!existing) throw new ApiError(404, "Customer not found");
    const patch = { ...req.body };
    if (patch.email === undefined) delete patch.email;
    if (patch.phone === undefined) delete patch.phone;
    if (patch.name === undefined) delete patch.name;
    await db("newsletter_subscribers").where({ id: existing.id }).update(patch);
    res.json({
      subscriber: await db("newsletter_subscribers")
        .where({ id: existing.id })
        .first(),
    });
  }),
);

router.post(
  "/:id/launch",
  canWrite,
  asyncHandler(async (req, res) => {
    const campaign = await db("campaigns")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .first();
    if (!campaign) throw new ApiError(404, "Campaign not found");
    const steps = parseSteps(campaign);
    if (!steps.length) throw new ApiError(400, "Campaign has no message steps");
    const marketId = req.query.market_id
      ? Number(req.query.market_id)
      : campaign.market_id || null;
    const audience = await recipients(
      req.user.org_id,
      campaign.audience,
      marketId,
      (() => {
        try {
          return JSON.parse(campaign.audience_config || "{}");
        } catch {
          return {};
        }
      })(),
    );
    const now = Date.now();
    const messages = [];
    for (const step of steps)
      for (const recipient of audience)
        messages.push({
          org_id: req.user.org_id,
          campaign_id: campaign.id,
          recipient_name: recipient.name || "",
          recipient_email: recipient.email || "",
          recipient_phone: recipient.phone || "",
          channel: step.channel,
          subject: step.subject || "",
          body: step.body,
          html: step.channel === "email" ? newsletterHtml(step) : "",
          scheduled_at: new Date(
            now + step.delay_hours * 3600000,
          ).toISOString(),
        });
    if (messages.length) await db("campaign_messages").insert(messages);
    await db("campaigns")
      .where({ id: campaign.id })
      .update({ status: "active", updated_at: new Date().toISOString() });
    res.json({
      queued: messages.length,
      campaign: publicCampaign(
        await db("campaigns").where({ id: campaign.id }).first(),
      ),
    });
  }),
);

async function processDueCampaigns() {
  const due = await db("campaign_messages")
    .where({ status: "queued" })
    .where("scheduled_at", "<=", new Date().toISOString())
    .orderBy("scheduled_at")
    .limit(50);
  for (const message of due) {
    await db("campaign_messages")
      .where({ id: message.id, status: "queued" })
      .update({ status: "sending" });
    try {
      if (message.channel === "email") {
        if (!message.recipient_email) throw new Error("No email address");
        await sendgrid.send(message.org_id, {
          to: message.recipient_email,
          subject: message.subject || "MarketHub update",
          text: message.body,
          html:
            message.html ||
            `<p>${escapeHtml(message.body).replace(/\n/g, "<br>")}</p>`,
        });
      } else if (message.channel === "sms") {
        if (!message.recipient_phone) throw new Error("No mobile number");
        await twilio.send(message.org_id, {
          to: message.recipient_phone,
          body: message.body,
        });
      } else {
        if (!message.recipient_phone) throw new Error("No mobile number");
        await twilio.send(message.org_id, {
          to: message.recipient_phone,
          body: message.body,
          whatsapp: true,
        });
      }
      await db("campaign_messages")
        .where({ id: message.id })
        .update({ status: "sent", sent_at: new Date().toISOString() });
    } catch (error) {
      await db("campaign_messages")
        .where({ id: message.id })
        .update({ status: "failed", error: error.message.slice(0, 1000) });
    }
  }
}

module.exports = { router, processDueCampaigns };
