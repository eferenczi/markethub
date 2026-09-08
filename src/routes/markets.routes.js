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
const PAYMENT_METHODS = [
  "stripe",
  "applepay",
  "googlepay",
  "paypal",
  "venmo",
  "zelle",
  "cash",
  "other",
];
const vendorDetailsSchema = z.object({
  event_overview: z.string().max(6000).optional().default(""),
  schedule: z.string().max(3000).optional().default(""),
  arrival_instructions: z.string().max(6000).optional().default(""),
  parking_loadin: z.string().max(6000).optional().default(""),
  rules: z.string().max(6000).optional().default(""),
  contact: z.string().max(3000).optional().default(""),
});

const marketSchema = z.object({
  name: z.string().min(1),
  short_name: z.string().optional().default(""),
  location: z.string().optional().default(""),
  description: z.string().optional().default(""),
  booth_fee: z.number().nonnegative().optional().default(0),
  truck_fee: z.number().nonnegative().optional().default(0),
  app_fee: z.number().nonnegative().optional().default(0),
  payment_methods: z.array(z.enum(PAYMENT_METHODS)).optional(),
  frequency: z.enum(["weekly", "biweekly", "monthly", "custom"]).optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  vendor_details: vendorDetailsSchema.optional(),
  archived: z.boolean().optional().default(false),
});

function marketForClient(market) {
  let payment_methods = [];
  try {
    payment_methods = Array.isArray(market.payment_methods)
      ? market.payment_methods
      : JSON.parse(market.payment_methods || "[]");
  } catch {
    payment_methods = [];
  }
  let vendor_details = {};
  try {
    vendor_details =
      typeof market.vendor_details === "object"
        ? market.vendor_details
        : JSON.parse(market.vendor_details || "{}");
  } catch {
    vendor_details = {};
  }
  return { ...market, payment_methods, vendor_details };
}
function marketValues(values) {
  const next = { ...values };
  if (Array.isArray(next.payment_methods))
    next.payment_methods = JSON.stringify(next.payment_methods);
  if (next.vendor_details && typeof next.vendor_details === "object")
    next.vendor_details = JSON.stringify(next.vendor_details);
  return next;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const markets = await db("markets")
      .where({ org_id: req.user.org_id })
      .orderBy("created_at", "desc");
    res.json({ markets: markets.map(marketForClient) });
  }),
);

router.post(
  "/",
  canWrite,
  validate(marketSchema),
  asyncHandler(async (req, res) => {
    const id = await insertId(db, "markets", {
      ...marketValues(req.body),
      org_id: req.user.org_id,
    });
    const market = await db("markets").where({ id }).first();
    res.status(201).json({ market: marketForClient(market) });
  }),
);

router.patch(
  "/:id",
  canWrite,
  validate(marketSchema.partial()),
  asyncHandler(async (req, res) => {
    const market = await db("markets")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .first();
    if (!market) throw new ApiError(404, "Market not found");
    await db("markets").where({ id: market.id }).update(marketValues(req.body));
    res.json({
      market: marketForClient(
        await db("markets").where({ id: market.id }).first(),
      ),
    });
  }),
);

router.delete(
  "/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const count = await db("markets")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .del();
    if (!count) throw new ApiError(404, "Market not found");
    res.json({ ok: true });
  }),
);

module.exports = router;
