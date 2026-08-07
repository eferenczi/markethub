const billing = require("../services/billing");
const { ApiError } = require("./error");

// Blocks paid features when the org has no active subscription/trial.
// Returns 402 Payment Required with a machine-readable code the UI uses to
// show a paywall.
async function requireActiveSubscription(req, res, next) {
  try {
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
