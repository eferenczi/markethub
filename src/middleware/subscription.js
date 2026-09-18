const billing = require("../services/billing");
const config = require("../config");
const { ApiError } = require("./error");

// Blocks paid features when the org has no active subscription/trial.
// Returns 402 Payment Required with a machine-readable code the UI uses to
// show a paywall.
async function requireActiveSubscription(req, res, next) {
  try {
    // The private staging pilot has no billing flow. Its sole organizer
    // workspace is intentionally open until the public launch enables login
    // and subscriptions again.
    if (config.pilotMode) return next();
    const org = await billing.getOrg(req.user.org_id);
    if (!billing.isActive(org)) {
      throw new ApiError(402, "An active subscription is required to use this feature", { code: "subscription_required" });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireActiveSubscription };
