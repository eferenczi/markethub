const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { requireActiveSubscription } = require("../middleware/subscription");
const { insertId } = require("../utils/insert-id");

const router = express.Router();
router.use(requireAuth, requireActiveSubscription);

const canWrite = requireRole("owner", "manager", "staff");

const vendorSchema = z.object({
  business_name: z.string().min(1),
  contact_name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  city: z.string().optional().default(""),
  category: z.string().optional().default(""),
  booth_type: z.enum(["tent", "truck"]).optional().default("tent"),
  instagram: z.string().optional().default(""),
  tiktok: z.string().optional().default(""),
  facebook: z.string().optional().default(""),
  stage: z
    .enum(["Lead", "Applied", "Approved", "Active", "Lapsed"])
    .optional()
    .default("Lead"),
  notes: z.string().optional().default(""),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const vendors = await db("vendors")
      .where({ org_id: req.user.org_id })
      .orderBy("business_name");
    res.json({ vendors });
  }),
);

router.get(
  "/:id/profile",
  asyncHandler(async (req, res) => {
    const vendor = await db("vendors")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .first();
    if (!vendor) throw new ApiError(404, "Vendor not found");
    const approvals = await db("approvals as a")
      .join("markets as m", "m.id", "a.market_id")
      .join("market_dates as d", "d.id", "a.market_date_id")
      .where({ "a.vendor_id": vendor.id, "a.org_id": req.user.org_id })
      .select("a.*", "m.name as market_name", "d.event_date")
      .orderBy("d.event_date", "desc");
    const applications = await db("vendor_applications as a")
      .join("markets as m", "m.id", "a.market_id")
      .where({ "a.vendor_id": vendor.id, "a.org_id": req.user.org_id })
      .select("a.*", "m.name as market_name")
      .orderBy("a.submitted_at", "desc");
    const applicationAssets = applications.length
      ? await db("application_assets")
          .where({ org_id: req.user.org_id })
          .whereIn(
            "application_id",
            applications.map((application) => application.id),
          )
          .select(
            "id",
            "application_id",
            "kind",
            "file_name",
            "mime_type",
            "size_bytes",
            "created_at",
          )
      : [];
    const assetsByApplication = new Map();
    for (const asset of applicationAssets)
      assetsByApplication.set(asset.application_id, [
        ...(assetsByApplication.get(asset.application_id) || []),
        asset,
      ]);
    const markets = await db("vendor_markets as vm")
      .join("markets as m", "m.id", "vm.market_id")
      .where({ "vm.vendor_id": vendor.id, "vm.org_id": req.user.org_id })
      .select("vm.*", "m.name as market_name")
      .orderBy("m.name");
    const payment_history = approvals.map((approval) => {
      const base = Number(approval.fee_cents || 0);
      const discount =
        approval.discount_type === "amount"
          ? Math.min(base, Number(approval.discount_value || 0))
          : approval.discount_type === "percent"
            ? Math.round(
                (base * Math.min(100, Number(approval.discount_value || 0))) /
                  100,
              )
            : 0;
      return {
        ...approval,
        base_cents: base,
        discount_cents: discount,
        amount_due_cents: base - discount,
      };
    });
    res.json({
      vendor,
      markets,
      applications: applications.map((application) => ({
        ...application,
        assets: assetsByApplication.get(application.id) || [],
      })),
      approvals: payment_history,
    });
  }),
);

router.post(
  "/",
  canWrite,
  validate(vendorSchema),
  asyncHandler(async (req, res) => {
    const id = await insertId(db, "vendors", {
      ...req.body,
      org_id: req.user.org_id,
    });
    res.status(201).json({ vendor: await db("vendors").where({ id }).first() });
  }),
);

router.patch(
  "/:id",
  canWrite,
  validate(vendorSchema.partial()),
  asyncHandler(async (req, res) => {
    const vendor = await db("vendors")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .first();
    if (!vendor) throw new ApiError(404, "Vendor not found");
    await db("vendors").where({ id: vendor.id }).update(req.body);
    res.json({ vendor: await db("vendors").where({ id: vendor.id }).first() });
  }),
);

router.delete(
  "/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const count = await db("vendors")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .del();
    if (!count) throw new ApiError(404, "Vendor not found");
    res.json({ ok: true });
  }),
);

module.exports = router;
