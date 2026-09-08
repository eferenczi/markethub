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
const APPROVAL_STATUS = [
  "pending",
  "awaiting_payment",
  "held",
  "paid",
  "waived",
  "rejected",
  "released",
];
const PROCESSING_RATES = {
  stripe: { percent: 2.9, fixed: 30 },
  applepay: { percent: 2.9, fixed: 30 },
  googlepay: { percent: 2.9, fixed: 30 },
  paypal: { percent: 2.99, fixed: 49 },
  venmo: { percent: 1.9, fixed: 10 },
  zelle: { percent: 0, fixed: 0 },
  cash: { percent: 0, fixed: 0 },
  other: { percent: 0, fixed: 0 },
};

const optionalId = (value) => (value === undefined ? undefined : Number(value));

async function marketForOrg(orgId, marketId) {
  const market = await db("markets")
    .where({ id: marketId, org_id: orgId })
    .first();
  if (!market) throw new ApiError(404, "Market not found");
  return market;
}

async function vendorForOrg(orgId, vendorId) {
  const vendor = await db("vendors")
    .where({ id: vendorId, org_id: orgId })
    .first();
  if (!vendor) throw new ApiError(404, "Vendor not found");
  return vendor;
}

async function dateForOrg(orgId, marketDateId) {
  const date = await db("market_dates")
    .where({ id: marketDateId, org_id: orgId })
    .first();
  if (!date) throw new ApiError(404, "Market date not found");
  return date;
}

async function approvalForOrg(orgId, approvalId) {
  const approval = await db("approvals")
    .where({ id: approvalId, org_id: orgId })
    .first();
  if (!approval) throw new ApiError(404, "Approval not found");
  return approval;
}

function approvalSummary(row) {
  const fee = Number(row.fee_cents || 0);
  if (row.status === "waived") return { ...row, amount_due_cents: 0 };
  const discount =
    row.discount_type === "amount"
      ? Math.min(fee, Number(row.discount_value || 0))
      : row.discount_type === "percent"
        ? Math.round(
            (fee * Math.min(100, Number(row.discount_value || 0))) / 100,
          )
        : 0;
  return { ...row, amount_due_cents: Math.max(0, fee - discount) };
}

function layoutWithSpots(layout) {
  return db("booth_spots")
    .where({ layout_id: layout.id })
    .orderBy("sort_order")
    .then((spots) => ({ ...layout, spots }));
}

function templateWithSpots(template) {
  return db("booth_template_spots")
    .where({ template_id: template.id })
    .orderBy("sort_order")
    .then((spots) => ({ ...template, spots }));
}

function processingFee(method, amountCents) {
  const rate = PROCESSING_RATES[method] || PROCESSING_RATES.other;
  return (
    Math.round((Number(amountCents || 0) * rate.percent) / 100) + rate.fixed
  );
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
  }),
);

router.post(
  "/market-dates",
  canWrite,
  validate(
    z.object({
      market_id: z.number().int().positive(),
      event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      status: z.enum(DATE_STATUS).optional().default("published"),
    }),
  ),
  asyncHandler(async (req, res) => {
    const market = await marketForOrg(req.user.org_id, req.body.market_id);
    const existing = await db("market_dates")
      .where({ market_id: req.body.market_id, event_date: req.body.event_date })
      .first();
    if (existing) throw new ApiError(409, "That market date already exists");
    const id = await insertId(db, "market_dates", {
      ...req.body,
      org_id: req.user.org_id,
    });
    // The most recently updated template is the market's default floor plan.
    // Copy it into the new event so later edits do not alter past maps.
    const template = await db("booth_templates")
      .where({ org_id: req.user.org_id, market_id: market.id })
      .orderBy("updated_at", "desc")
      .first();
    if (template) {
      const spots = await db("booth_template_spots")
        .where({ template_id: template.id })
        .orderBy("sort_order");
      await db.transaction(async (trx) => {
        const layoutId = await insertId(trx, "booth_layouts", {
          org_id: req.user.org_id,
          market_id: market.id,
          market_date_id: id,
          name: "Floor plan",
          venue_image: template.venue_image,
        });
        if (spots.length)
          await trx("booth_spots").insert(
            spots.map(({ id: _id, template_id: _templateId, ...spot }) => ({
              ...spot,
              layout_id: layoutId,
              vendor_id: null,
            })),
          );
      });
    }
    const market_date = await db("market_dates").where({ id }).first();
    res.status(201).json({ market_date });
  }),
);

router.patch(
  "/market-dates/:id",
  canWrite,
  validate(
    z
      .object({
        status: z.enum(DATE_STATUS).optional(),
        event_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
      .refine((v) => Object.keys(v).length > 0),
  ),
  asyncHandler(async (req, res) => {
    const market_date = await dateForOrg(req.user.org_id, req.params.id);
    if (req.body.event_date && req.body.event_date !== market_date.event_date) {
      const exists = await db("market_dates")
        .where({
          market_id: market_date.market_id,
          event_date: req.body.event_date,
        })
        .first();
      if (exists) throw new ApiError(409, "That market date already exists");
    }
    await db("market_dates").where({ id: market_date.id }).update(req.body);
    res.json({
      market_date: await db("market_dates")
        .where({ id: market_date.id })
        .first(),
    });
  }),
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
  }),
);

router.put(
  "/vendor-markets/:vendorId/:marketId",
  canWrite,
  validate(
    z.object({
      stage_override: z
        .enum(["Lead", "Applied", "Approved", "Active", "Lapsed"])
        .nullable()
        .optional(),
      notes: z.string().max(10000).nullable().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    await vendorForOrg(req.user.org_id, req.params.vendorId);
    await marketForOrg(req.user.org_id, req.params.marketId);
    const key = {
      org_id: req.user.org_id,
      vendor_id: Number(req.params.vendorId),
      market_id: Number(req.params.marketId),
    };
    const existing = await db("vendor_markets").where(key).first();
    if (existing)
      await db("vendor_markets").where({ id: existing.id }).update(req.body);
    else await db("vendor_markets").insert({ ...key, ...req.body });
    res.json({ vendor_market: await db("vendor_markets").where(key).first() });
  }),
);

router.delete(
  "/vendor-markets/:vendorId/:marketId",
  canWrite,
  asyncHandler(async (req, res) => {
    const count = await db("vendor_markets")
      .where({
        org_id: req.user.org_id,
        vendor_id: req.params.vendorId,
        market_id: req.params.marketId,
      })
      .del();
    if (!count) throw new ApiError(404, "Vendor-market link not found");
    res.json({ ok: true });
  }),
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
      .select(
        "a.*",
        "v.business_name",
        "v.contact_name",
        "v.email",
        "v.phone",
        "m.name as market_name",
        "d.event_date",
      );
    if (marketId !== undefined) query.andWhere("a.market_id", marketId);
    if (marketDateId !== undefined)
      query.andWhere("a.market_date_id", marketDateId);
    if (vendorId !== undefined) query.andWhere("a.vendor_id", vendorId);
    const approvals = (
      await query.orderBy("d.event_date").orderBy("v.business_name")
    ).map(approvalSummary);
    res.json({ approvals });
  }),
);

router.post(
  "/approvals",
  canWrite,
  validate(
    z.object({
      vendor_id: z.number().int().positive(),
      market_date_id: z.number().int().positive(),
      booth_type: z.enum(["tent", "truck"]).optional(),
      fee_cents: z.number().int().nonnegative().optional(),
      notes: z.string().max(10000).optional().default(""),
    }),
  ),
  asyncHandler(async (req, res) => {
    const vendor = await vendorForOrg(req.user.org_id, req.body.vendor_id);
    const market_date = await dateForOrg(
      req.user.org_id,
      req.body.market_date_id,
    );
    const market = await marketForOrg(req.user.org_id, market_date.market_id);
    const booth_type = req.body.booth_type || vendor.booth_type || "tent";
    const fee_cents =
      req.body.fee_cents === undefined
        ? Math.round(
            Number(
              booth_type === "truck" ? market.truck_fee : market.booth_fee,
            ) * 100,
          )
        : req.body.fee_cents;
    const existing = await db("approvals")
      .where({ vendor_id: vendor.id, market_date_id: market_date.id })
      .first();
    if (existing)
      throw new ApiError(
        409,
        "This vendor already has an approval for that market date",
      );
    const id = await insertId(db, "approvals", {
      org_id: req.user.org_id,
      vendor_id: vendor.id,
      market_id: market.id,
      market_date_id: market_date.id,
      booth_type,
      fee_cents,
      notes: req.body.notes,
    });
    // An event enrollment also makes this vendor available in the market CRM.
    // The same vendor can therefore be enrolled and charged independently at
    // any number of the organizer's markets.
    const link = {
      org_id: req.user.org_id,
      vendor_id: vendor.id,
      market_id: market.id,
    };
    if (!(await db("vendor_markets").where(link).first())) {
      await db("vendor_markets").insert({ ...link, stage_override: "Applied" });
    }
    res.status(201).json({
      approval: approvalSummary(await db("approvals").where({ id }).first()),
    });
  }),
);

router.patch(
  "/approvals/:id",
  canWrite,
  validate(
    z
      .object({
        status: z.enum(APPROVAL_STATUS).optional(),
        discount_type: z.enum(["none", "amount", "percent"]).optional(),
        discount_value: z.number().int().nonnegative().optional(),
        fee_cents: z.number().int().nonnegative().optional(),
        notes: z.string().max(10000).optional(),
        payment_deadline_at: z.string().datetime().nullable().optional(),
      })
      .refine((v) => Object.keys(v).length > 0),
  ),
  asyncHandler(async (req, res) => {
    const approval = await approvalForOrg(req.user.org_id, req.params.id);
    const patch = { ...req.body, updated_at: new Date().toISOString() };
    if (patch.status === "paid") {
      patch.paid_at = new Date().toISOString();
      patch.payment_deadline_at = null;
    }
    await db("approvals").where({ id: approval.id }).update(patch);
    res.json({
      approval: approvalSummary(
        await db("approvals").where({ id: approval.id }).first(),
      ),
    });
  }),
);

router.post(
  "/approvals/:id/approve",
  canWrite,
  asyncHandler(async (req, res) => {
    const approval = await approvalForOrg(req.user.org_id, req.params.id);
    const payment_deadline_at = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();
    await db("approvals").where({ id: approval.id }).update({
      status: "awaiting_payment",
      payment_deadline_at,
      updated_at: new Date().toISOString(),
    });
    res.json({
      approval: approvalSummary(
        await db("approvals").where({ id: approval.id }).first(),
      ),
    });
  }),
);

router.post(
  "/approvals/:id/reminder",
  canWrite,
  asyncHandler(async (req, res) => {
    const approval = await approvalForOrg(req.user.org_id, req.params.id);
    if (!["awaiting_payment", "held"].includes(approval.status))
      throw new ApiError(
        400,
        "A reminder can only be sent for an unpaid approval",
      );
    await db("approvals")
      .where({ id: approval.id })
      .increment("reminder_count", 1)
      .update({ updated_at: new Date().toISOString() });
    res.json({
      approval: approvalSummary(
        await db("approvals").where({ id: approval.id }).first(),
      ),
    });
  }),
);

router.post(
  "/approvals/:id/record-payment",
  canWrite,
  validate(
    z.object({
      payment_method: z.enum([
        "stripe",
        "applepay",
        "googlepay",
        "paypal",
        "venmo",
        "zelle",
        "cash",
        "other",
      ]),
      processing_fee_cents: z.number().int().nonnegative().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const approval = await approvalForOrg(req.user.org_id, req.params.id);
    if (["waived", "rejected"].includes(approval.status)) {
      throw new ApiError(
        400,
        "A waived or rejected approval cannot be recorded as paid",
      );
    }
    const amount_due_cents = approvalSummary(approval).amount_due_cents;
    const processing_fee_cents =
      req.body.processing_fee_cents === undefined
        ? processingFee(req.body.payment_method, amount_due_cents)
        : req.body.processing_fee_cents;
    await db("approvals").where({ id: approval.id }).update({
      status: "paid",
      payment_method: req.body.payment_method,
      processing_fee_cents,
      paid_at: new Date().toISOString(),
      payment_deadline_at: null,
      updated_at: new Date().toISOString(),
    });
    res.json({
      approval: approvalSummary(
        await db("approvals").where({ id: approval.id }).first(),
      ),
    });
  }),
);

router.get(
  "/financial-report",
  asyncHandler(async (req, res) => {
    const marketId = optionalId(req.query.market_id);
    const fromDate = req.query.from_date;
    const toDate = req.query.to_date;
    if (marketId !== undefined) await marketForOrg(req.user.org_id, marketId);
    if (fromDate && !/^\d{4}-\d{2}-\d{2}$/.test(fromDate))
      throw new ApiError(400, "from_date must use YYYY-MM-DD");
    if (toDate && !/^\d{4}-\d{2}-\d{2}$/.test(toDate))
      throw new ApiError(400, "to_date must use YYYY-MM-DD");
    if (fromDate && toDate && fromDate > toDate)
      throw new ApiError(400, "The start date must be before the end date");
    const query = db("approvals as a")
      .join("vendors as v", "v.id", "a.vendor_id")
      .join("markets as m", "m.id", "a.market_id")
      .join("market_dates as d", "d.id", "a.market_date_id")
      .where("a.org_id", req.user.org_id)
      .select(
        "a.*",
        "v.business_name",
        "m.name as market_name",
        "d.event_date",
      );
    if (marketId !== undefined) query.andWhere("a.market_id", marketId);
    if (fromDate) query.andWhere("d.event_date", ">=", fromDate);
    if (toDate) query.andWhere("d.event_date", "<=", toDate);
    const transactions = (
      await query.orderBy("d.event_date", "desc").orderBy("a.id", "desc")
    ).map((row) => {
      const summary = approvalSummary(row);
      const discount_cents =
        Number(row.fee_cents || 0) - summary.amount_due_cents;
      return {
        ...summary,
        base_cents: Number(row.fee_cents || 0),
        discount_cents,
        processing_fee_cents: Number(row.processing_fee_cents || 0),
        net_payout_cents:
          row.status === "paid"
            ? summary.amount_due_cents - Number(row.processing_fee_cents || 0)
            : 0,
      };
    });
    const paid = transactions.filter(
      (transaction) => transaction.status === "paid",
    );
    const totals = {
      collected_cents: paid.reduce(
        (sum, transaction) => sum + transaction.amount_due_cents,
        0,
      ),
      outstanding_cents: transactions
        .filter((transaction) =>
          ["pending", "awaiting_payment", "held"].includes(transaction.status),
        )
        .reduce((sum, transaction) => sum + transaction.amount_due_cents, 0),
      discounts_cents: transactions.reduce(
        (sum, transaction) => sum + transaction.discount_cents,
        0,
      ),
      processing_fees_cents: paid.reduce(
        (sum, transaction) => sum + transaction.processing_fee_cents,
        0,
      ),
    };
    totals.net_payout_cents =
      totals.collected_cents - totals.processing_fees_cents;
    const group = (key) =>
      Object.values(
        paid.reduce((groups, transaction) => {
          const name = transaction[key] || "Unspecified";
          if (!groups[name])
            groups[name] = {
              label: name,
              collected_cents: 0,
              processing_fees_cents: 0,
              net_payout_cents: 0,
              transactions: 0,
            };
          groups[name].collected_cents += transaction.amount_due_cents;
          groups[name].processing_fees_cents +=
            transaction.processing_fee_cents;
          groups[name].net_payout_cents += transaction.net_payout_cents;
          groups[name].transactions += 1;
          return groups;
        }, {}),
      ).sort((a, b) => b.collected_cents - a.collected_cents);
    res.json({
      period: { from_date: fromDate || null, to_date: toDate || null },
      totals,
      by_market: group("market_name"),
      by_payment_method: group("payment_method"),
      transactions,
    });
  }),
);

// ---- expense ledger and financial reporting ----------------------------
router.get(
  "/expenses",
  asyncHandler(async (req, res) => {
    const marketId = optionalId(req.query.market_id);
    if (marketId !== undefined) await marketForOrg(req.user.org_id, marketId);
    const query = db("market_expenses").where({ org_id: req.user.org_id });
    if (marketId !== undefined) query.andWhere({ market_id: marketId });
    res.json({
      expenses: await query
        .orderBy("expense_date", "desc")
        .orderBy("id", "desc"),
    });
  }),
);

router.post(
  "/expenses",
  canWrite,
  validate(
    z.object({
      market_id: z.number().int().positive(),
      market_date_id: z.number().int().positive().nullable().optional(),
      category: z.string().min(1).max(120),
      amount_cents: z.number().int().positive(),
      note: z.string().max(2000).optional().default(""),
      expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  ),
  asyncHandler(async (req, res) => {
    await marketForOrg(req.user.org_id, req.body.market_id);
    if (req.body.market_date_id) {
      const event = await dateForOrg(req.user.org_id, req.body.market_date_id);
      if (event.market_id !== req.body.market_id)
        throw new ApiError(400, "The event date belongs to a different market");
    }
    const id = await insertId(db, "market_expenses", {
      ...req.body,
      org_id: req.user.org_id,
    });
    res
      .status(201)
      .json({ expense: await db("market_expenses").where({ id }).first() });
  }),
);

router.delete(
  "/expenses/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const count = await db("market_expenses")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .del();
    if (!count) throw new ApiError(404, "Expense not found");
    res.json({ ok: true });
  }),
);

// ---- booth maps ---------------------------------------------------------
const spotSchema = z.object({
  code: z.string().min(1).max(32),
  kind: z.enum(["tent", "truck"]),
  vendor_id: z.number().int().positive().nullable().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().optional().default(0),
  sort_order: z.number().int().nonnegative().optional().default(0),
});

router.get(
  "/layouts",
  asyncHandler(async (req, res) => {
    const marketDateId = optionalId(req.query.market_date_id);
    if (marketDateId === undefined)
      throw new ApiError(400, "market_date_id is required");
    await dateForOrg(req.user.org_id, marketDateId);
    const layouts = await db("booth_layouts")
      .where({ org_id: req.user.org_id, market_date_id: marketDateId })
      .orderBy("created_at", "desc");
    res.json({ layouts: await Promise.all(layouts.map(layoutWithSpots)) });
  }),
);

router.post(
  "/layouts",
  canWrite,
  validate(
    z.object({
      market_date_id: z.number().int().positive(),
      name: z.string().min(1).max(120),
      venue_image: z.string().max(5_000_000).nullable().optional(),
      spots: z.array(spotSchema).max(500).default([]),
    }),
  ),
  asyncHandler(async (req, res) => {
    const market_date = await dateForOrg(
      req.user.org_id,
      req.body.market_date_id,
    );
    const duplicate = await db("booth_layouts")
      .where({ market_date_id: market_date.id, name: req.body.name })
      .first();
    if (duplicate)
      throw new ApiError(
        409,
        "A layout with that name already exists for this date",
      );
    for (const spot of req.body.spots)
      if (spot.vendor_id) await vendorForOrg(req.user.org_id, spot.vendor_id);
    const layout = await db.transaction(async (trx) => {
      const layoutId = await insertId(trx, "booth_layouts", {
        org_id: req.user.org_id,
        market_id: market_date.market_id,
        market_date_id: market_date.id,
        name: req.body.name,
        venue_image: req.body.venue_image || null,
      });
      if (req.body.spots.length)
        await trx("booth_spots").insert(
          req.body.spots.map((spot) => ({ ...spot, layout_id: layoutId })),
        );
      return trx("booth_layouts").where({ id: layoutId }).first();
    });
    res.status(201).json({ layout: await layoutWithSpots(layout) });
  }),
);

router.put(
  "/layouts/:id",
  canWrite,
  validate(
    z
      .object({
        name: z.string().min(1).max(120).optional(),
        venue_image: z.string().max(5_000_000).nullable().optional(),
        spots: z.array(spotSchema).max(500).optional(),
      })
      .refine((v) => Object.keys(v).length > 0),
  ),
  asyncHandler(async (req, res) => {
    const layout = await db("booth_layouts")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .first();
    if (!layout) throw new ApiError(404, "Layout not found");
    for (const spot of req.body.spots || [])
      if (spot.vendor_id) await vendorForOrg(req.user.org_id, spot.vendor_id);
    await db.transaction(async (trx) => {
      const { spots, ...patch } = req.body;
      if (Object.keys(patch).length)
        await trx("booth_layouts")
          .where({ id: layout.id })
          .update({ ...patch, updated_at: new Date().toISOString() });
      if (spots) {
        await trx("booth_spots").where({ layout_id: layout.id }).del();
        if (spots.length)
          await trx("booth_spots").insert(
            spots.map((spot) => ({ ...spot, layout_id: layout.id })),
          );
      }
    });
    res.json({
      layout: await layoutWithSpots(
        await db("booth_layouts").where({ id: layout.id }).first(),
      ),
    });
  }),
);

// ---- reusable market map templates -------------------------------------
const templateSpotSchema = spotSchema.omit({ vendor_id: true });
const templateSchema = z.object({
  market_id: z.number().int().positive(),
  name: z.string().min(1).max(120),
  venue_image: z.string().max(5_000_000).nullable().optional(),
  spots: z.array(templateSpotSchema).max(500).default([]),
});

router.get(
  "/layout-templates",
  asyncHandler(async (req, res) => {
    const marketId = optionalId(req.query.market_id);
    if (marketId === undefined)
      throw new ApiError(400, "market_id is required");
    await marketForOrg(req.user.org_id, marketId);
    const templates = await db("booth_templates")
      .where({ org_id: req.user.org_id, market_id: marketId })
      .orderBy("updated_at", "desc");
    res.json({
      templates: await Promise.all(templates.map(templateWithSpots)),
    });
  }),
);

router.post(
  "/layout-templates",
  canWrite,
  validate(templateSchema),
  asyncHandler(async (req, res) => {
    await marketForOrg(req.user.org_id, req.body.market_id);
    const duplicate = await db("booth_templates")
      .where({ market_id: req.body.market_id, name: req.body.name })
      .first();
    if (duplicate)
      throw new ApiError(
        409,
        "A template with that name already exists for this market",
      );
    const template = await db.transaction(async (trx) => {
      const id = await insertId(trx, "booth_templates", {
        org_id: req.user.org_id,
        market_id: req.body.market_id,
        name: req.body.name,
        venue_image: req.body.venue_image || null,
      });
      if (req.body.spots.length)
        await trx("booth_template_spots").insert(
          req.body.spots.map((spot) => ({ ...spot, template_id: id })),
        );
      return trx("booth_templates").where({ id }).first();
    });
    res.status(201).json({ template: await templateWithSpots(template) });
  }),
);

router.put(
  "/layout-templates/:id",
  canWrite,
  validate(
    templateSchema
      .omit({ market_id: true })
      .partial()
      .refine((value) => Object.keys(value).length > 0),
  ),
  asyncHandler(async (req, res) => {
    const template = await db("booth_templates")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .first();
    if (!template) throw new ApiError(404, "Map template not found");
    await db.transaction(async (trx) => {
      const { spots, ...patch } = req.body;
      if (Object.keys(patch).length)
        await trx("booth_templates")
          .where({ id: template.id })
          .update({ ...patch, updated_at: new Date().toISOString() });
      if (spots) {
        await trx("booth_template_spots")
          .where({ template_id: template.id })
          .del();
        if (spots.length)
          await trx("booth_template_spots").insert(
            spots.map((spot) => ({ ...spot, template_id: template.id })),
          );
      }
    });
    res.json({
      template: await templateWithSpots(
        await db("booth_templates").where({ id: template.id }).first(),
      ),
    });
  }),
);

router.post(
  "/layout-templates/:id/apply",
  canWrite,
  validate(z.object({ market_date_id: z.number().int().positive() })),
  asyncHandler(async (req, res) => {
    const template = await db("booth_templates")
      .where({ id: req.params.id, org_id: req.user.org_id })
      .first();
    if (!template) throw new ApiError(404, "Map template not found");
    const marketDate = await dateForOrg(
      req.user.org_id,
      req.body.market_date_id,
    );
    if (marketDate.market_id !== template.market_id)
      throw new ApiError(400, "This template belongs to a different market");
    const templateSpots = await db("booth_template_spots")
      .where({ template_id: template.id })
      .orderBy("sort_order");
    const layout = await db.transaction(async (trx) => {
      const existing = await trx("booth_layouts")
        .where({ market_date_id: marketDate.id, name: "Floor plan" })
        .first();
      const values = {
        venue_image: template.venue_image,
        updated_at: new Date().toISOString(),
      };
      const id = existing
        ? existing.id
        : await insertId(trx, "booth_layouts", {
            org_id: req.user.org_id,
            market_id: marketDate.market_id,
            market_date_id: marketDate.id,
            name: "Floor plan",
            venue_image: template.venue_image,
          });
      if (existing) await trx("booth_layouts").where({ id }).update(values);
      await trx("booth_spots").where({ layout_id: id }).del();
      if (templateSpots.length)
        await trx("booth_spots").insert(
          templateSpots.map(
            ({ id: _id, template_id: _templateId, ...spot }) => ({
              ...spot,
              layout_id: id,
              vendor_id: null,
            }),
          ),
        );
      return trx("booth_layouts").where({ id }).first();
    });
    res.json({ layout: await layoutWithSpots(layout) });
  }),
);

module.exports = router;
