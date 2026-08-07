const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { requireActiveSubscription } = require("../middleware/subscription");

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
  stage: z.enum(["Lead", "Applied", "Approved", "Active", "Lapsed"]).optional().default("Lead"),
  notes: z.string().optional().default(""),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const vendors = await db("vendors").where({ org_id: req.user.org_id }).orderBy("business_name");
    res.json({ vendors });
  })
);

router.post(
  "/",
  canWrite,
  validate(vendorSchema),
  asyncHandler(async (req, res) => {
    const [idRaw] = await db("vendors").insert({ ...req.body, org_id: req.user.org_id });
    const id = typeof idRaw === "object" ? idRaw.id : idRaw;
    res.status(201).json({ vendor: await db("vendors").where({ id }).first() });
  })
);

router.patch(
  "/:id",
  canWrite,
  validate(vendorSchema.partial()),
  asyncHandler(async (req, res) => {
    const vendor = await db("vendors").where({ id: req.params.id, org_id: req.user.org_id }).first();
    if (!vendor) throw new ApiError(404, "Vendor not found");
    await db("vendors").where({ id: vendor.id }).update(req.body);
    res.json({ vendor: await db("vendors").where({ id: vendor.id }).first() });
  })
);

router.delete(
  "/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const count = await db("vendors").where({ id: req.params.id, org_id: req.user.org_id }).del();
    if (!count) throw new ApiError(404, "Vendor not found");
    res.json({ ok: true });
  })
);

module.exports = router;
