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
const APPLICATION_STATUSES = ["under_review", "approved", "unapproved", "withdrawn"];
const ASSET_KINDS = ["insurance", "booth_photo", "product_photo"];
const dataUrl = z.string().regex(/^data:[^;,]+;base64,[A-Za-z0-9+/=]+$/).max(7_000_000);
const assetSchema = z.object({
  kind: z.enum(ASSET_KINDS),
  file_name: z.string().min(1).max(240),
  mime_type: z.string().regex(/^(application\/pdf|image\/(jpeg|png|webp))$/),
  data: dataUrl,
});
const publicApplicationSchema = z.object({
  market_id: z.number().int().positive(),
  business_name: z.string().min(2).max(160),
  contact_name: z.string().min(2).max(160),
  phone: z.string().min(7).max(40),
  email: z.string().email(),
  city: z.string().max(120).optional().default(""),
  category: z.string().max(120).optional().default(""),
  booth_type: z.enum(["tent", "truck"]).default("tent"),
  booth_size: z.string().max(80).optional().default(""),
  power_needed: z.boolean().default(false),
  instagram: z.string().max(200).optional().default(""),
  tiktok: z.string().max(200).optional().default(""),
  facebook: z.string().max(300).optional().default(""),
  website: z.string().max(500).optional().default(""),
  description: z.string().max(6000).optional().default(""),
  assets: z.array(assetSchema).max(7).default([]),
});

const publicKey = () => crypto.randomBytes(18).toString("base64url");
const assetInfo = ({ data, ...asset }) => asset;
const stageForStatus = (status) => ({ under_review: "Applied", approved: "Approved", unapproved: "Lapsed", withdrawn: "Lapsed" }[status]);

async function organizationForKey(key) {
  const organization = await db("organizations").where({ public_apply_key: key }).first();
  if (!organization) throw new ApiError(404, "This application link is no longer available");
  return organization;
}

async function applicationForOrg(orgId, id) {
  const application = await db("vendor_applications").where({ id, org_id: orgId }).first();
  if (!application) throw new ApiError(404, "Application not found");
  return application;
}

// Public form configuration: only the business name and active markets are exposed.
router.get("/public/:key", asyncHandler(async (req, res) => {
  const organization = await organizationForKey(req.params.key);
  const markets = await db("markets").where({ org_id: organization.id, archived: false }).select("id", "name", "location").orderBy("name");
  res.json({ organization: { name: organization.name }, markets });
}));

// Vendor-facing application. Creates or updates the CRM contact, then creates a
// separate immutable application record for the selected market.
router.post("/public/:key", validate(publicApplicationSchema), asyncHandler(async (req, res) => {
  const organization = await organizationForKey(req.params.key);
  const market = await db("markets").where({ id: req.body.market_id, org_id: organization.id, archived: false }).first();
  if (!market) throw new ApiError(400, "Choose an active market");

  const application = await db.transaction(async (trx) => {
    const existingVendor = await trx("vendors").where({ org_id: organization.id }).whereRaw("lower(email) = ?", [req.body.email.toLowerCase()]).first();
    const vendorValues = {
      business_name: req.body.business_name, contact_name: req.body.contact_name, phone: req.body.phone, email: req.body.email,
      city: req.body.city, category: req.body.category, booth_type: req.body.booth_type,
      instagram: req.body.instagram, tiktok: req.body.tiktok, facebook: req.body.facebook, stage: "Applied",
    };
    const vendorId = existingVendor ? existingVendor.id : await insertId(trx, "vendors", { ...vendorValues, org_id: organization.id });
    if (existingVendor) await trx("vendors").where({ id: vendorId }).update(vendorValues);

    const vendorMarketKey = { org_id: organization.id, vendor_id: vendorId, market_id: market.id };
    const link = await trx("vendor_markets").where(vendorMarketKey).first();
    if (link) await trx("vendor_markets").where({ id: link.id }).update({ stage_override: "Applied" });
    else await trx("vendor_markets").insert({ ...vendorMarketKey, stage_override: "Applied" });

    const applicationId = await insertId(trx, "vendor_applications", {
      org_id: organization.id, vendor_id: vendorId, market_id: market.id,
      business_name: req.body.business_name, contact_name: req.body.contact_name, phone: req.body.phone, email: req.body.email,
      city: req.body.city, category: req.body.category, booth_type: req.body.booth_type, booth_size: req.body.booth_size,
      power_needed: req.body.power_needed, instagram: req.body.instagram, tiktok: req.body.tiktok, facebook: req.body.facebook,
      website: req.body.website, description: req.body.description,
    });
    if (req.body.assets.length) {
      await trx("application_assets").insert(req.body.assets.map((asset) => ({
        org_id: organization.id, application_id: applicationId, kind: asset.kind, file_name: asset.file_name,
        mime_type: asset.mime_type, size_bytes: Buffer.byteLength(asset.data), data: asset.data,
      })));
    }
    return trx("vendor_applications").where({ id: applicationId }).first();
  });

  res.status(201).json({ application: { id: application.id, status: application.status, submitted_at: application.submitted_at } });
}));

router.use(requireAuth, requireActiveSubscription);

router.get("/", asyncHandler(async (req, res) => {
  const status = req.query.status;
  if (status && !APPLICATION_STATUSES.includes(status)) throw new ApiError(400, "Invalid application status");
  const query = db("vendor_applications as a")
    .join("markets as m", "m.id", "a.market_id")
    .join("vendors as v", "v.id", "a.vendor_id")
    .where("a.org_id", req.user.org_id)
    .select("a.*", "m.name as market_name", "v.stage as crm_stage");
  if (status) query.andWhere("a.status", status);
  const applications = await query.orderBy("a.submitted_at", "desc");
  const ids = applications.map((application) => application.id);
  const assets = ids.length ? await db("application_assets").whereIn("application_id", ids).select("id", "application_id", "kind", "file_name", "mime_type", "size_bytes", "created_at") : [];
  const byApplication = new Map();
  for (const asset of assets) byApplication.set(asset.application_id, [...(byApplication.get(asset.application_id) || []), asset]);
  res.json({ applications: applications.map((application) => ({ ...application, assets: byApplication.get(application.id) || [] })) });
}));

router.patch("/:id", requireRole("owner", "manager", "staff"), validate(z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  review_notes: z.string().max(6000).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0)), asyncHandler(async (req, res) => {
  const application = await applicationForOrg(req.user.org_id, req.params.id);
  const patch = { ...req.body, updated_at: new Date().toISOString() };
  await db.transaction(async (trx) => {
    await trx("vendor_applications").where({ id: application.id }).update(patch);
    if (req.body.status) {
      const stage = stageForStatus(req.body.status);
      await trx("vendors").where({ id: application.vendor_id }).update({ stage });
      const link = await trx("vendor_markets").where({ org_id: application.org_id, vendor_id: application.vendor_id, market_id: application.market_id }).first();
      if (link) await trx("vendor_markets").where({ id: link.id }).update({ stage_override: stage });
    }
  });
  const updated = await db("vendor_applications").where({ id: application.id }).first();
  res.json({ application: updated });
}));

router.get("/:id/assets/:assetId", asyncHandler(async (req, res) => {
  const application = await applicationForOrg(req.user.org_id, req.params.id);
  const asset = await db("application_assets").where({ id: req.params.assetId, application_id: application.id, org_id: req.user.org_id }).first();
  if (!asset) throw new ApiError(404, "File not found");
  const payload = asset.data.slice(asset.data.indexOf(",") + 1);
  res.type(asset.mime_type);
  res.setHeader("Content-Disposition", `inline; filename="${asset.file_name.replace(/[\\\"]+/g, "_")}"`);
  res.send(Buffer.from(payload, "base64"));
}));

// An owner can rotate a leaked application link without changing their data.
router.post("/application-link/rotate", requireRole("owner"), asyncHandler(async (req, res) => {
  const key = publicKey();
  await db("organizations").where({ id: req.user.org_id }).update({ public_apply_key: key });
  res.json({ key });
}));

module.exports = router;
