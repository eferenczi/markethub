const crypto = require("crypto");
const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { insertId } = require("../utils/insert-id");

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
const due = (approval) => {
  const fee = Number(approval.fee_cents || 0);
  if (approval.status === "waived") return 0;
  const discount =
    approval.discount_type === "amount"
      ? Math.min(fee, Number(approval.discount_value || 0))
      : approval.discount_type === "percent"
        ? Math.round((fee * Number(approval.discount_value || 0)) / 100)
        : 0;
  return Math.max(0, fee - discount);
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

module.exports = { router, key };
