const express = require("express");
const Stripe = require("stripe");
const db = require("../db");
const { asyncHandler } = require("../middleware/error");
const stripe = require("../services/integrations/stripe");
const config = require("../config");
const billing = require("../services/billing");

const router = express.Router();

/**
 * Stripe calls this URL when events happen (payment succeeded, etc.).
 * Each org gets its own path so we can verify against that org's webhook secret:
 *   https://your-api.com/webhooks/stripe/<orgId>
 * The raw body is required for signature verification, so this route uses
 * express.raw (mounted before the global JSON parser in server.js).
 */
router.post(
  "/stripe/:orgId",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    const signature = req.headers["stripe-signature"];
    let event;
    try {
      event = await stripe.constructEvent(req.params.orgId, req.body, signature);
    } catch (err) {
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        // TODO: mark the matching approval/payment as paid using event.data.object.metadata
        break;
      case "payment_intent.payment_failed":
        // TODO: flag the payment as failed and notify the manager
        break;
      default:
        break;
    }

    res.json({ received: true });
  })
);

/*
 * PLATFORM billing webhook — Stripe tells us when a client org subscribes,
 * renews, or cancels. Updates the unified subscription state. Point your
 * platform Stripe account's webhook at:  /webhooks/stripe-billing
 */
router.post(
  "/stripe-billing",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    if (!config.billing.platformStripeSecret || !config.billing.platformStripeWebhookSecret) {
      return res.status(400).json({ error: "Platform billing not configured" });
    }
    const client = Stripe(config.billing.platformStripeSecret);
    let event;
    try {
      event = client.webhooks.constructEvent(req.body, req.headers["stripe-signature"], config.billing.platformStripeWebhookSecret);
    } catch (err) {
      return res.status(400).json({ error: `Signature verification failed: ${err.message}` });
    }

    const obj = event.data.object;
    const orgId = obj.metadata?.org_id || obj.client_reference_id;
    try {
      switch (event.type) {
        case "checkout.session.completed":
          if (orgId) {
            await billing.setSubscription(orgId, {
              status: "active",
              provider: "stripe",
              plan_code: obj.metadata?.plan_code,
              stripe_customer_id: obj.customer,
              stripe_subscription_id: obj.subscription,
            });
          }
          break;
        case "customer.subscription.updated":
        case "customer.subscription.created": {
          const org = await db("organizations").where({ stripe_customer_id: obj.customer }).first();
          if (org) {
            const status = obj.status === "active" || obj.status === "trialing" ? "active" : obj.status === "past_due" ? "past_due" : "canceled";
            await billing.setSubscription(org.id, { status, provider: "stripe", current_period_end: obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : undefined, stripe_subscription_id: obj.id });
          }
          break;
        }
        case "customer.subscription.deleted": {
          const org = await db("organizations").where({ stripe_customer_id: obj.customer }).first();
          if (org) await billing.setSubscription(org.id, { status: "canceled", provider: "none" });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("billing webhook handling error", err);
    }
    res.json({ received: true });
  })
);

module.exports = router;