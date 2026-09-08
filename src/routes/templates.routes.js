const crypto = require("crypto");
const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { requireActiveSubscription } = require("../middleware/subscription");
const { insertId } = require("../utils/insert-id");

const router = express.Router();
const TYPES = ["onboarding", "categories_spaces", "required_documents"];
const publicKey = () => crypto.randomBytes(18).toString("base64url");
const clientTemplate = (row) => ({ ...row, config: typeof row.config === "string" ? JSON.parse(row.config || "{}") : row.config });
const templateSchema = z.object({ type: z.enum(TYPES), name: z.string().min(2).max(120), config: z.record(z.any()).default({}) });

async function marketForOrg(orgId, marketId) { const row = await db("markets").where({ id: marketId, org_id: orgId }).first(); if (!row) throw new ApiError(404, "Market not found"); return row; }
async function dateForOrg(orgId, id) { const row = await db("market_dates").where({ id, org_id: orgId }).first(); if (!row) throw new ApiError(404, "Market date not found"); return row; }

router.get("/public/questions/:key", asyncHandler(async (req, res) => {
  const approval = await db("approvals as a").join("vendors as v", "v.id", "a.vendor_id").join("markets as m", "m.id", "a.market_id").join("market_dates as d", "d.id", "a.market_date_id").where("a.acknowledgment_key", req.params.key).select("a.*", "v.business_name", "m.name as market_name", "d.event_date").first();
  if (!approval) throw new ApiError(404, "This acknowledgment link is not available");
  const assignment = await db("market_template_assignments as a").join("organizer_templates as t", "t.id", "a.template_id").where({ "a.market_date_id": approval.market_date_id, "t.type": "onboarding" }).select("t.*", "a.id as assignment_id").orderBy("a.id", "desc").first();
  if (!assignment) throw new ApiError(404, "No vendor questions are assigned to this event");
  const existing = await db("vendor_acknowledgments").where({ approval_id: approval.id, template_id: assignment.id }).first();
  res.json({ approval: { business_name: approval.business_name, market_name: approval.market_name, event_date: approval.event_date }, template: clientTemplate(assignment), acknowledged: Boolean(existing) });
}));

router.post("/public/questions/:key", validate(z.object({ answers: z.record(z.any()).default({}) })), asyncHandler(async (req, res) => {
  const approval = await db("approvals").where({ acknowledgment_key: req.params.key }).first();
  if (!approval) throw new ApiError(404, "This acknowledgment link is not available");
  const assignment = await db("market_template_assignments as a").join("organizer_templates as t", "t.id", "a.template_id").where({ "a.market_date_id": approval.market_date_id, "t.type": "onboarding" }).select("t.id").orderBy("a.id", "desc").first();
  if (!assignment) throw new ApiError(404, "No vendor questions are assigned to this event");
  const existing = await db("vendor_acknowledgments").where({ approval_id: approval.id, template_id: assignment.id }).first();
  const values = { answers: JSON.stringify(req.body.answers), acknowledged_at: new Date().toISOString() };
  if (existing) await db("vendor_acknowledgments").where({ id: existing.id }).update(values);
  else await db("vendor_acknowledgments").insert({ org_id: approval.org_id, approval_id: approval.id, template_id: assignment.id, ...values });
  res.json({ ok: true });
}));

router.use(requireAuth, requireActiveSubscription);
router.get("/", asyncHandler(async (req, res) => {
  const type = req.query.type;
  if (type && !TYPES.includes(type)) throw new ApiError(400, "Invalid template type");
  const query = db("organizer_templates").where({ org_id: req.user.org_id }); if (type) query.andWhere({ type });
  const templates = await query.orderBy("updated_at", "desc");
  const ids = templates.map((template) => template.id);
  const assignments = ids.length ? await db("market_template_assignments").whereIn("template_id", ids).orderBy("id", "desc") : [];
  res.json({ templates: templates.map(clientTemplate), assignments });
}));
router.post("/", requireRole("owner", "manager", "staff"), validate(templateSchema), asyncHandler(async (req, res) => {
  const id = await insertId(db, "organizer_templates", { org_id: req.user.org_id, type: req.body.type, name: req.body.name, config: JSON.stringify(req.body.config) });
  res.status(201).json({ template: clientTemplate(await db("organizer_templates").where({ id }).first()) });
}));
router.put("/:id", requireRole("owner", "manager", "staff"), validate(templateSchema.partial().refine((value) => Object.keys(value).length > 0)), asyncHandler(async (req, res) => {
  const template = await db("organizer_templates").where({ id: req.params.id, org_id: req.user.org_id }).first(); if (!template) throw new ApiError(404, "Template not found");
  const patch = { ...req.body, updated_at: new Date().toISOString() }; if (patch.config) patch.config = JSON.stringify(patch.config);
  await db("organizer_templates").where({ id: template.id }).update(patch); res.json({ template: clientTemplate(await db("organizer_templates").where({ id: template.id }).first()) });
}));
router.put("/:id/assign", requireRole("owner", "manager", "staff"), validate(z.object({ market_id: z.number().int().positive(), market_date_id: z.number().int().positive().nullable().optional() })), asyncHandler(async (req, res) => {
  const template = await db("organizer_templates").where({ id: req.params.id, org_id: req.user.org_id }).first(); if (!template) throw new ApiError(404, "Template not found");
  await marketForOrg(req.user.org_id, req.body.market_id); if (req.body.market_date_id) { const date = await dateForOrg(req.user.org_id, req.body.market_date_id); if (date.market_id !== req.body.market_id) throw new ApiError(400, "Event date belongs to a different market"); }
  const key = { org_id: req.user.org_id, template_id: template.id, market_id: req.body.market_id, market_date_id: req.body.market_date_id || null };
  const existing = await db("market_template_assignments").where(key).first(); if (!existing) await db("market_template_assignments").insert(key);
  res.json({ ok: true });
}));
router.get("/event-questions", asyncHandler(async (req, res) => {
  const dateId = Number(req.query.market_date_id); const date = await dateForOrg(req.user.org_id, dateId);
  const assignment = await db("market_template_assignments as a").join("organizer_templates as t", "t.id", "a.template_id").where({ "a.market_date_id": date.id, "t.type": "onboarding" }).select("t.*").orderBy("a.id", "desc").first();
  const approvals = await db("approvals as a").join("vendors as v", "v.id", "a.vendor_id").leftJoin("vendor_acknowledgments as va", "va.approval_id", "a.id").where({ "a.org_id": req.user.org_id, "a.market_date_id": date.id }).select("a.id", "a.status", "a.acknowledgment_key", "v.business_name", "va.acknowledged_at", "va.template_id as acknowledged_template_id").orderBy("v.business_name");
  res.json({ template: assignment ? clientTemplate(assignment) : null, approvals });
}));
router.post("/event-questions/:approvalId/link", requireRole("owner", "manager", "staff"), asyncHandler(async (req, res) => {
  const approval = await db("approvals").where({ id: req.params.approvalId, org_id: req.user.org_id }).first(); if (!approval) throw new ApiError(404, "Vendor event record not found");
  const key = approval.acknowledgment_key || publicKey(); if (!approval.acknowledgment_key) await db("approvals").where({ id: approval.id }).update({ acknowledgment_key: key });
  res.json({ key });
}));
module.exports = router;
