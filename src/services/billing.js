const db = require("../db");
const config = require("../config");

// Is the org currently allowed to use paid features?
function isActive(org) {
  if (!org) return false;
  const now = Date.now();
  if (org.subscription_status === "active") {
    // If we have a period end, honor it; otherwise treat active as active.
    return !org.current_period_end || new Date(org.current_period_end).getTime() > now;
  }
  if (org.subscription_status === "trialing") {
    return org.trial_ends_at && new Date(org.trial_ends_at).getTime() > now;
  }
  return false;
}

async function getOrg(orgId) {
  return db("organizations").where({ id: orgId }).first();
}

async function listPlans() {
  const plans = await db("plans").orderBy("sort");
  return plans.map((p) => ({ ...p, features: safeParse(p.features) }));
}

function safeParse(s) {
  try { return JSON.parse(s) || []; } catch { return []; }
}

// A client-safe summary of the org's subscription.
async function summary(orgId) {
  const org = await getOrg(orgId);
  const plans = await listPlans();
  const active = isActive(org);
  let daysLeft = null;
  if (org.subscription_status === "trialing" && org.trial_ends_at) {
    daysLeft = Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000));
  }
  return {
    status: org.subscription_status,
    provider: org.subscription_provider,
    plan_code: org.plan_code,
    trial_ends_at: org.trial_ends_at,
    current_period_end: org.current_period_end,
    active,
    trial_days_left: daysLeft,
    plans,
  };
}

// Apply a subscription result from any channel to the org (source of truth).
async function setSubscription(orgId, { status, provider, plan_code, current_period_end, stripe_customer_id, stripe_subscription_id }) {
  const patch = { subscription_status: status, subscription_provider: provider };
  if (plan_code !== undefined) patch.plan_code = plan_code;
  if (current_period_end !== undefined) patch.current_period_end = current_period_end;
  if (stripe_customer_id !== undefined) patch.stripe_customer_id = stripe_customer_id;
  if (stripe_subscription_id !== undefined) patch.stripe_subscription_id = stripe_subscription_id;
  await db("organizations").where({ id: orgId }).update(patch);
}

// Start a trial for a newly-registered org.
function trialFields() {
  const ends = new Date(Date.now() + config.billing.trialDays * 86400000).toISOString();
  return { subscription_status: "trialing", subscription_provider: "none", trial_ends_at: ends };
}

module.exports = { isActive, getOrg, listPlans, summary, setSubscription, trialFields };
