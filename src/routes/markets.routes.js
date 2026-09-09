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
const seasonalRateSchema = z.object({
  label: z.string().max(120).optional().default(""),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  booth_fee: z.number().nonnegative(),
  truck_fee: z.number().nonnegative(),
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
  venue_contact_name: z.string().max(160).optional().default(""),
  venue_contact_phone: z.string().max(40).optional().default(""),
  venue_contact_email: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .default(""),
  map_url: z.string().url().optional().or(z.literal("")).default(""),
  seasonal_rates: z.array(seasonalRateSchema).max(24).optional().default([]),
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
  let seasonal_rates = [];
  try {
    seasonal_rates = Array.isArray(market.seasonal_rates)
      ? market.seasonal_rates
      : JSON.parse(market.seasonal_rates || "[]");
  } catch {
    seasonal_rates = [];
  }
  return {
    ...market,
    payment_methods: [...new Set([...(payment_methods || []), "cash"])],
    vendor_details,
    seasonal_rates,
  };
}
function marketValues(values) {
  const next = { ...values };
  if (Array.isArray(next.payment_methods))
    next.payment_methods = JSON.stringify([
      ...new Set([...next.payment_methods, "cash"]),
    ]);
  if (next.vendor_details && typeof next.vendor_details === "object")
    next.vendor_details = JSON.stringify(next.vendor_details);
  if (Array.isArray(next.seasonal_rates))
    next.seasonal_rates = JSON.stringify(next.seasonal_rates);
  return next;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const markets = await db("markets")
      .where({ org_id: req.user.org_id })
      .orderBy("sort_order")
      .orderBy("created_at");
    res.json({ markets: markets.map(marketForClient) });
  }),
);

router.post(
  "/",
  canWrite,
  validate(marketSchema),
  asyncHandler(async (req, res) => {
    const last = await db("markets")
      .where({ org_id: req.user.org_id })
      .max("sort_order as maximum")
      .first();
    const id = await insertId(db, "markets", {
      ...marketValues(req.body),
      org_id: req.user.org_id,
      sort_order: Number(last?.maximum || 0) + 1,
    });
    const market = await db("markets").where({ id }).first();
    res.status(201).json({ market: marketForClient(market) });
  }),
);

router.put(
  "/order",
  canWrite,
  validate(z.object({ ids: z.array(z.number().int().positive()).min(1) })),
  asyncHandler(async (req, res) => {
    const markets = await db("markets")
      .where({ org_id: req.user.org_id })
      .whereIn("id", req.body.ids)
      .select("id");
    if (markets.length !== req.body.ids.length)
      throw new ApiError(400, "All markets must belong to this organization");
    await db.transaction(async (trx) => {
      for (const [index, id] of req.body.ids.entries())
        await trx("markets")
          .where({ id })
          .update({ sort_order: index + 1 });
    });
    res.json({ ok: true });
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
