const Stripe = require("stripe");
const { getCredentials } = require("../credentials");
const { ApiError } = require("../../middleware/error");

async function clientFor(orgId) {
  const creds = await getCredentials(orgId, "stripe");
  if (!creds || !creds.secret_key) {
    throw new ApiError(400, "Stripe is not configured for this organization");
  }
  return { stripe: Stripe(creds.secret_key), creds };
}

// Used by the Settings "Test connection" button.
async function test(orgId) {
  const { stripe } = await clientFor(orgId);
  const account = await stripe.accounts.retrieve();
  return { ok: true, detail: `Connected to Stripe account ${account.id}` };
}

// Example: create a PaymentIntent for a booth fee (amount in dollars).
async function createPaymentIntent(orgId, amountDollars, metadata = {}) {
  const { stripe } = await clientFor(orgId);
  return stripe.paymentIntents.create({
    amount: Math.round(amountDollars * 100),
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata,
  });
}

// Verify an incoming webhook using the org's stored webhook secret.
async function constructEvent(orgId, rawBody, signature) {
  const creds = await getCredentials(orgId, "stripe");
  if (!creds || !creds.webhook_secret) throw new ApiError(400, "No Stripe webhook secret configured");
  const stripe = Stripe(creds.secret_key || "sk_placeholder");
  return stripe.webhooks.constructEvent(rawBody, signature, creds.webhook_secret);
}

module.exports = { test, createPaymentIntent, constructEvent };
