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
const DATE_STATUS = ["published", "tentative", "skipped"];
const APPROVAL_STATUS = ["pending", "awaiting_payment", "held", "paid", "released"];

const optionalId = (value) => (value === undefined ? undefined : Number(value));

async function marketForOrg(orgId, marketId) {
  const market = await db("markets").where({ id: marketId, org_id: orgId }).first();
  if (!market) throw new ApiError(404, "Market not found");
  return market;
}

async function vendorForOrg(orgId, vendorId) {
  const vendor = await db("vendors").where({ id: vendorId, org_id: orgId }).first();
  if (!vendor) throw new ApiError(404, "Vendor not found");
  return vendor;
}

async function dateForOrg(orgId, marketDateId) {
  const date = await db("market_dates").where({ id: marketDateId, org_id: orgId }).first();
  if (!date) throw new ApiError(404, "Market date not found");
  return date;
}

async function approvalForOrg(orgId, approvalId) {
  const approval = await db("approvals").where({ id: approvalId, org_id: orgId }).first();
  if (!approval) throw new ApiError(404, "Approval not found");
  return approval;
}

function approvalSummary(row) {
  const fee = Number(row.fee_cents || 0);
  const discount = row.discount_type === "amount"
    ? Math.min(fee, Number(row.discount_value || 0))
    : row.discount_type === "percent"
      ? Math.round(fee * Math.min(100, Number(row.discount_value || 0)) / 100)
      : 0;
  return { ...row, amount_due_cents: Math.max(0, fee - discount) };
}

function layoutWithSpots(layout) {
  return db("booth_spots").where({ layout_id: layout.id }).orderBy("sort_order").then((spots) => ({ ...layout, spots }));
}

// ---- market dates -------------------------------------------------------
router.get(
  "/market-dates",
  asyncHandler(async (req, res) => {
    const marketId = optionalId(req.query.market_id);
    if (marketId !== undefined) await marketForOrg(req.user.org_id, marketId);
    const query = db("market_dates").where({ org_id: req.user.org_id });
    if (marketId !== undefined) query.andWhere({ market_id: marketId });
    res.json({ market_dates: await query.orderBy("event_date") });
  })
);

router.post(
  "/market-dates",
  canWrite,
  validate(z.object({ market_id: z.number().int().positive(), event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(DATE_STATUS).optional().default("published") })),
  asyncHandler(async (req, res) => {
    await marketForOrg(req.user.org_id, req.body.market_id);
    const existing = await db("market_dates").where({ market_id: req.body.market_id, event_date: req.body.event_date }).first();
    if (existing) throw new ApiError(409, "That market date already exists");
    const id = await insertId(db, "market_dates", { ...req.body, org_id: req.user.org_id });
    const market_date = await db("market_dates").where({ id }).first();
    res.status(201).json({ market_date });
  })
);

router.patch(
  "/market-dates/:id",
  canWrite,
  validate(z.object({ status: z.enum(DATE_STATUS).optional(), event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).refine((v) => Object.keys(v).length > 0)),
  asyncHandler(async (req, res) => {
    const market_date = await dateForOrg(req.user.org_id, req.params.id);
    if (req.body.event_date && req.body.event_date !== market_date.event_date) {
      const exists = await db("market_dates").where({ market_id: market_date.market_id, event_date: req.body.event_date }).first();
      if (exists) throw new ApiError(409, "That market date already exists");
    }
    await db("market_dates").where({ id: market_date.id }).update(req.body);
    res.json({ market_date: await db("market_dates").where({ id: market_date.id }).first() });
  })
);

// ---- vendor ↔ market CRM links ----------------------------------------
router.get(
  "/vendor-markets",
  asyncHandler(async (req, res) => {
    const vendorId = optionalId(req.query.vendor_id);
    const marketId = optionalId(req.query.market_id);
    if (vendorId !== undefined) await vendorForOrg(req.user.org_id, vendorId);
    if (marketId !== undefined) await marketForOrg(req.user.org_id, marketId);
    const query = db("vendor_markets").where({ org_id: req.user.org_id });
    if (vendorId !== undefined) query.andWhere({ vendor_id: vendorId });
    if (marketId !== undefined) query.andWhere({ market_id: marketId });
    res.json({ vendor_markets: await query.orderBy("created_at", "desc") });
  })
);

router.put(
  "/vendor-markets/:vendorId/:marketId",
  canWrite,
  validate(z.object({ stage_override: z.enum(["Lead", "Applied", "Approved", "Active", "Lapsed"]).nullable().optional(), notes: z.string().max(10000).nullable().optional() })),
  asyncHandler(async (req, res) => {
    await vendorForOrg(req.user.org_id, req.params.vendorId);
    await marketForOrg(req.user.org_id, req.params.marketId);
    const key = { org_id: req.user.org_id, vendor_id: Number(req.params.vendorId), market_id: Number(req.params.marketId) };
    const existing = await db("vendor_markets").where(key).first();
    if (existing) await db("vendor_markets").where({ id: existing.id }).update(req.body);
    else await db("vendor_markets").insert({ ...key, ...req.body });
    res.json({ vendor_market: await db("vendor_markets").where(key).first() });
  })
);

router.delete(
  "/vendor-markets/:vendorId/:marketId",
  canWrite,
  asyncHandler(async (req, res) => {
    const count = await db("vendor_markets").where({ org_id: req.user.org_id, vendor_id: req.params.vendorId, market_id: req.params.marketId }).del();
    if (!count) throw new ApiError(404, "Vendor-market link not found");
    res.json({ ok: true });
  })
);

// ---- approvals and manual payment state --------------------------------
router.get(
  "/approvals",
  asyncHandler(async (req, res) => {
    const marketId = optionalId(req.query.market_id);
    const marketDateId = optionalId(req.query.market_date_id);
    const vendorId = optionalId(req.query.vendor_id);
    const query = db("approvals as a")
      .join("vendors as v", "v.id", "a.vendor_id")
      .join("markets as m", "m.id", "a.market_id")
      .join("market_dates as d", "d.id", "a.market_date_id")
      .where("a.org_id", req.user.org_id)
      .select("a.*", "v.business_name", "v.contact_name", "v.email", "v.phone", "m.name as market_name", "d.event_date");
    if (marketId !== undefined) query.andWhere("a.market_id", marketId);
    if (marketDateId !== undefined) query.andWhere("a.market_date_id", marketDateId);
    if (vendorId !== undefined) query.andWhere("a.vendor_id", vendorId);
    const approvals = (await query.orderBy("d.event_date").orderBy("v.business_name")).map(approvalSummary);
    res.json({ approvals });
  })
);

router.post(
  "/approvals",
  canWrite,
  validate(z.object({ vendor_id: z.number().int().positive(), market_date_id: z.number().int().positive(), booth_type: z.enum(["tent", "truck"]).optional(), fee_cents: z.number().int().nonnegative().optional(), notes: z.string().max(10000).optional().default("") })),
  asyncHandler(async (req, res) => {
    const vendor = await vendorForOrg(req.user.org_id, req.body.vendor_id);
    const market_date = await dateForOrg(req.user.org_id, req.body.market_date_id);
    const market = await marketForOrg(req.user.org_id, market_date.market_id);
    const booth_type = req.body.booth_type || vendor.booth_type || "tent";
    const fee_cents = req.body.fee_cents === undefined
      ? Math.round(Number(booth_type === "truck" ? market.truck_fee : market.booth_fee) * 100)
      : req.body.fee_cents;
    const existing = await db("approvals").where({ vendor_id: vendor.id, market_date_id: market_date.id }).first();
    if (existing) throw new ApiError(409, "This vendor already has an approval for that market date");
    const id = await insertId(db, "approvals", { org_id: req.user.org_id, vendor_id: vendor.id, market_id: market.id, market_date_id: market_date.id, booth_type, fee_cents, notes: req.body.notes });
    res.status(201).json({ approval: approvalSummary(await db("approvals").where({ id }).first()) });
  })
);

router.patch(
  "/approvals/:id",
  canWrite,
  validate(z.object({ status: z.enum(APPROVAL_STATUS).optional(), discount_type: z.enum(["none", "amount", "percent"]).optional(), discount_value: z.number().int().nonnegative().optional(), fee_cents: z.number().int().nonnegative().optional(), notes: z.string().max(10000).optional(), payment_deadline_at: z.string().datetime().nullable().optional() }).refine((v) => Object.keys(v).length > 0)),
  asyncHandler(async (req, res) => {
    const approval = await approvalForOrg(req.user.org_id, req.params.id);
    const patch = { ...req.body, updated_at: new Date().toISOString() };
    if (patch.status === "paid") {
      patch.paid_at = new Date().toISOString();
      patch.payment_deadline_at = null;
    }
    await db("approvals").where({ id: approval.id }).update(patch);
    res.json({ approval: approvalSummary(await db("approvals").where({ id: approval.id }).first()) });
  })
);

router.post(
  "/approvals/:id/approve",
  canWrite,
  asyncHandler(async (req, res) => {
    const approval = await approvalForOrg(req.user.org_id, req.params.id);
    const payment_deadline_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await db("approvals").where({ id: approval.id }).update({ status: "awaiting_payment", payment_deadline_at, updated_at: new Date().toISOString() });
    res.json({ approval: approvalSummary(await db("approvals").where({ id: approval.id }).first()) });
  })
);

router.post(
  "/approvals/:id/reminder",
  canWrite,
  asyncHandler(async (req, res) => {
    const approval = await approvalForOrg(req.user.org_id, req.params.id);
    if (!["awaiting_payment", "held"].includes(approval.status)) throw new ApiError(400, "A reminder can only be sent for an unpaid approval");
    await db("approvals").where({ id: approval.id }).increment("reminder_count", 1).update({ updated_at: new Date().toISOString() });
    res.json({ approval: approvalSummary(await db("approvals").where({ id: approval.id }).first()) });
  })
);

router.post(
  "/approvals/:id/record-payment",
  canWrite,
  validate(z.object({ payment_method: z.enum(["stripe", "applepay", "googlepay", "paypal", "venmo", "zelle", "cash", "other"]) })),
  asyncHandler(async (req, res) => {
    const approval = await approvalForOrg(req.user.org_id, req.params.id);
    await db("approvals").where({ id: approval.id }).update({ status: "paid", payment_method: req.body.payment_method, paid_at: new Date().toISOString(), payment_deadline_at: null, updated_at: new Date().toISOString() });
    res.json({ approval: approvalSummary(await db("approvals").where({ id: approval.id }).first()) });
  })
);

// ---- booth maps ---------------------------------------------------------
const spotSchema = z.object({ code: z.string().min(1).max(32), kind: z.enum(["tent", "truck"]), vendor_id: z.number().int().positive().nullable().optional(), x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive(), rotation: z.number().optional().default(0), sort_order: z.number().int().nonnegative().optional().default(0) });

router.get(
  "/layouts",
  asyncHandler(async (req, res) => {
    const marketDateId = optionalId(req.query.market_date_id);
    if (marketDateId === undefined) throw new ApiError(400, "market_date_id is required");
    await dateForOrg(req.user.org_id, marketDateId);
    const layouts = await db("booth_layouts").where({ org_id: req.user.org_id, market_date_id: marketDateId }).orderBy("created_at", "desc");
    res.json({ layouts: await Promise.all(layouts.map(layoutWithSpots)) });
  })
);

router.post(
  "/layouts",
  canWrite,
  validate(z.object({ market_date_id: z.number().int().positive(), name: z.string().min(1).max(120), venue_image: z.string().max(5_000_000).nullable().optional(), spots: z.array(spotSchema).max(500).default([]) })),
  asyncHandler(async (req, res) => {
    const market_date = await dateForOrg(req.user.org_id, req.body.market_date_id);
    const duplicate = await db("booth_layouts").where({ market_date_id: market_date.id, name: req.body.name }).first();
    if (duplicate) throw new ApiError(409, "A layout with that name already exists for this date");
    for (const spot of req.body.spots) if (spot.vendor_id) await vendorForOrg(req.user.org_id, spot.vendor_id);
    const layout = await db.transaction(async (trx) => {
      const layoutId = await insertId(trx, "booth_layouts", { org_id: req.user.org_id, market_id: market_date.market_id, market_date_id: market_date.id, name: req.body.name, venue_image: req.body.venue_image || null });
      if (req.body.spots.length) await trx("booth_spots").insert(req.body.spots.map((spot) => ({ ...spot, layout_id: layoutId })));
      return trx("booth_layouts").where({ id: layoutId }).first();
    });
    res.status(201).json({ layout: await layoutWithSpots(layout) });
  })
);

router.put(
  "/layouts/:id",
  canWrite,
  validate(z.object({ name: z.string().min(1).max(120).optional(), venue_image: z.string().max(5_000_000).nullable().optional(), spots: z.array(spotSchema).max(500).optional() }).refine((v) => Object.keys(v).length > 0)),
  asyncHandler(async (req, res) => {
    const layout = await db("booth_layouts").where({ id: req.params.id, org_id: req.user.org_id }).first();
    if (!layout) throw new ApiError(404, "Layout not found");
    for (const spot of req.body.spots || []) if (spot.vendor_id) await vendorForOrg(req.user.org_id, spot.vendor_id);
    await db.transaction(async (trx) => {
      const { spots, ...patch } = req.body;
      if (Object.keys(patch).length) await trx("booth_layouts").where({ id: layout.id }).update({ ...patch, updated_at: new Date().toISOString() });
      if (spots) {
        await trx("booth_spots").where({ layout_id: layout.id }).del();
        if (spots.length) await trx("booth_spots").insert(spots.map((spot) => ({ ...spot, layout_id: layout.id })));
      }
    });
    res.json({ layout: await layoutWithSpots(await db("booth_layouts").where({ id: layout.id }).first()) });
  })
);

module.exports = router;
