const crypto = require("crypto");
const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { insertId } = require("../utils/insert-id");
const config = require("../config");
const stripe = require("../services/integrations/stripe");
const { due } = require("../services/vendor-notifications");

const router = express.Router();
const key = () => crypto.randomBytes(18).toString("base64url");
const subscribeSchema = z
  .object({
    name: z.string().max(160).optional().default(""),
    email: z.string().email().optional().or(z.literal("")).default(""),
    phone: z.string().min(7).max(40).optional().or(z.literal("")).default(""),
  })
  .refine((value) => value.email || value.phone, {
    message: "An email address or phone number is required",
  });
async function paymentForKey(key) {
  return db("approvals as a")
    .join("vendors as v", "v.id", "a.vendor_id")
    .join("markets as m", "m.id", "a.market_id")
    .join("market_dates as d", "d.id", "a.market_date_id")
    .where("a.payment_key", key)
    .select(
      "a.*",
      "v.business_name",
      "v.contact_name",
      "m.name as market_name",
      "m.payment_methods",
      "d.event_date",
    )
    .first();
}
const paymentMethods = (market) => {
  try {
    return Array.isArray(market.payment_methods)
      ? market.payment_methods
      : JSON.parse(market.payment_methods || "[]");
  } catch {
    return ["cash"];
  }
};

router.get(
  "/event-board/:key",
  asyncHandler(async (req, res) => {
    const marketDate = await db("market_dates")
      .where({ manager_board_key: req.params.key })
      .first();
    if (!marketDate)
      throw new ApiError(404, "This event board link is unavailable");
    const market = await db("markets")
      .where({ id: marketDate.market_id, org_id: marketDate.org_id })
      .first();
    const layout = await db("booth_layouts")
      .where({ market_date_id: marketDate.id })
      .first();
    const spots = layout
      ? await db("booth_spots")
          .where({ layout_id: layout.id })
          .select("vendor_id", "code", "kind")
          .orderBy("sort_order")
      : [];
    const spotsByVendor = new Map();
    for (const spot of spots)
      if (spot.vendor_id)
        spotsByVendor.set(spot.vendor_id, [
          ...(spotsByVendor.get(spot.vendor_id) || []),
          spot,
        ]);
    const approvals = await db("approvals as a")
      .join("vendors as v", "v.id", "a.vendor_id")
      .where({
        "a.market_date_id": marketDate.id,
        "a.org_id": marketDate.org_id,
      })
      .select("a.*", "v.business_name", "v.contact_name", "v.booth_type")
      .orderBy("v.business_name");
    const assignments = approvals.map((approval) => ({
      id: approval.id,
      business_name: approval.business_name,
      contact_name: approval.contact_name,
      booth_type: approval.booth_type,
      spots: spotsByVendor.get(approval.vendor_id) || [],
      status: approval.status,
      amount_due_cents: due(approval),
      needs_payment: ["pending", "awaiting_payment", "held"].includes(
        approval.status,
      ),
    }));
    res.json({
      market: { name: market.name, location: market.location || "" },
      event_date: marketDate.event_date,
      assignments,
      updated_at: new Date().toISOString(),
    });
  }),
);

router.get(
  "/subscribe/:key",
  asyncHandler(async (req, res) => {
    const organization = await db("organizations")
      .where({ public_subscribe_key: req.params.key })
      .first();
    if (!organization)
      throw new ApiError(404, "This customer signup link is unavailable");
    res.json({ organization: { name: organization.name } });
  }),
);
router.post(
  "/subscribe/:key",
  validate(subscribeSchema),
  asyncHandler(async (req, res) => {
    const organization = await db("organizations")
      .where({ public_subscribe_key: req.params.key })
      .first();
    if (!organization)
      throw new ApiError(404, "This customer signup link is unavailable");
    const id = await insertId(db, "newsletter_subscribers", {
      ...req.body,
      org_id: organization.id,
      active: true,
    });
    res.status(201).json({
      subscriber: await db("newsletter_subscribers").where({ id }).first(),
    });
  }),
);

router.get(
  "/payment/:key",
  asyncHandler(async (req, res) => {
    const approval = await paymentForKey(req.params.key);
    if (!approval) throw new ApiError(404, "This payment link is unavailable");
    res.json({
      payment: {
        business_name: approval.business_name,
        contact_name: approval.contact_name,
        market_name: approval.market_name,
        event_date: approval.event_date,
        amount_due_cents: due(approval),
        status: approval.status,
        payment_methods: [...new Set([...paymentMethods(approval), "cash"])],
        payment_method: approval.payment_method || "",
        processing_fee_cents: ["cash", "zelle", "venmo"].includes(
          approval.payment_method,
        )
          ? 0
          : Math.round(Number(due(approval) || 0) * 0.035),
        online_checkout_available: ["awaiting_payment", "held"].includes(
          approval.status,
        ),
      },
    });
  }),
);
router.post(
  "/payment/:key/checkout",
  asyncHandler(async (req, res) => {
    const approval = await paymentForKey(req.params.key);
    if (!approval) throw new ApiError(404, "This payment link is unavailable");
    if (approval.status === "paid")
      throw new ApiError(400, "This market fee has already been paid");
    if (!["awaiting_payment", "held"].includes(approval.status))
      throw new ApiError(400, "This payment link is not currently active");
    const amountCents = due(approval);
    if (!amountCents)
      throw new ApiError(400, "No payment is due for this approval");
    const base = config.appBaseUrl.replace(/\/$/, "");
    const session = await stripe.createCheckoutSession(approval.org_id, {
      amountCents,
      name: `${approval.market_name} vendor fee`,
      successUrl: `${base}/#/payment/${req.params.key}?success=1`,
      cancelUrl: `${base}/#/payment/${req.params.key}?cancelled=1`,
      metadata: {
        approval_id: String(approval.id),
        org_id: String(approval.org_id),
      },
    });
    res.json({ checkout_url: session.url });
  }),
);
router.post(
  "/payment/:key/method",
  validate(
    z.object({
      payment_method: z.enum(["paypal", "venmo", "zelle", "cash", "other"]),
    }),
  ),
  asyncHandler(async (req, res) => {
    const approval = await paymentForKey(req.params.key);
    if (!approval) throw new ApiError(404, "This payment link is unavailable");
    if (
      !paymentMethods(approval).includes(req.body.payment_method) &&
      req.body.payment_method !== "cash"
    )
      throw new ApiError(
        400,
        "This payment method is not enabled for this market",
      );
    if (!["awaiting_payment", "held"].includes(approval.status))
      throw new ApiError(400, "This payment link is not currently active");
    await db("approvals")
      .where({ id: approval.id })
      .update({
        payment_method: req.body.payment_method,
        notes: `${approval.notes || ""}${approval.notes ? "\n" : ""}Vendor selected ${req.body.payment_method} payment on ${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      });
    res.json({
      ok: true,
      message: `Your ${req.body.payment_method} payment selection was sent to the market team.`,
    });
  }),
);

module.exports = { router, key };
