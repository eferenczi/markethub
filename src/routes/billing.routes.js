const express = require("express");
const { z } = require("zod");
const Stripe = require("stripe");
const db = require("../db");
const config = require("../config");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const billing = require("../services/billing");

const router = express.Router();
router.use(requireAuth);

// Current subscription status + available plans.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await billing.summary(req.user.org_id));
  })
);

// WEB channel: create a Stripe Checkout session for a plan.
router.post(
  "/checkout",
  requireRole("owner", "manager"),
  validate(z.object({ plan_code: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    if (!config.billing.platformStripeSecret) {
      throw new ApiError(400, "Platform billing isn't configured yet. Set PLATFORM_STRIPE_SECRET on the server.");
    }
    const plan = await db("plans").where({ code: req.body.plan_code }).first();
    if (!plan) throw new ApiError(404, "Unknown plan");
    if (!plan.stripe_price_id) throw new ApiError(400, `Plan "${plan.code}" has no Stripe price ID configured`);

    const stripe = Stripe(config.billing.platformStripeSecret);
    const org = await billing.getOrg(req.user.org_id);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      customer: org.stripe_customer_id || undefined,
      customer_email: org.stripe_customer_id ? undefined : req.user.email,
      client_reference_id: String(org.id),
      metadata: { org_id: String(org.id), plan_code: plan.code },
      subscription_data: { metadata: { org_id: String(org.id), plan_code: plan.code } },
      success_url: config.billing.successUrl,
      cancel_url: config.billing.cancelUrl,
    });
    res.json({ url: session.url });
  })
);

// TESTING / COMPING: activate a plan without real payment (owner only).
// Disabled automatically in production unless ALLOW_MANUAL_BILLING=true.
router.post(
  "/activate",
  requireRole("owner"),
  validate(z.object({ plan_code: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    if (!config.billing.allowManual) throw new ApiError(403, "Manual activation is disabled");
    const plan = await db("plans").where({ code: req.body.plan_code }).first();
    if (!plan) throw new ApiError(404, "Unknown plan");
    const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
    await billing.setSubscription(req.user.org_id, { status: "active", provider: "manual", plan_code: plan.code, current_period_end: periodEnd });
    res.json(await billing.summary(req.user.org_id));
  })
);

// Cancel (owner). For manual/testing; real Stripe cancels flow through webhooks.
router.post(
  "/cancel",
  requireRole("owner"),
  asyncHandler(async (req, res) => {
    await billing.setSubscription(req.user.org_id, { status: "canceled", provider: "none" });
    res.json(await billing.summary(req.user.org_id));
  })
);

/*
 * MOBILE channels (Apple / Google in-app purchase).
 * These are the hybrid adapters. They're wired but return 501 until Step 3:
 * the native apps must send a real transaction, and you must configure
 * server-side verification (App Store Server API / Google Play Developer API)
 * plus create the matching subscription products in App Store Connect / Play
 * Console. When verified, they call billing.setSubscription() exactly like the
 * Stripe webhook, so the rest of the app is already ready.
 */
router.post(
  "/iap/apple",
  requireRole("owner", "manager"),
  asyncHandler(async () => {
    throw new ApiError(501, "Apple in-app purchase verification isn't configured yet (completed in Step 3 with your App Store account).");
  })
);
router.post(
  "/iap/google",
  requireRole("owner", "manager"),
  asyncHandler(async () => {
    throw new ApiError(501, "Google Play billing verification isn't configured yet (completed in Step 3 with your Play Console account).");
  })
);

module.exports = router;
