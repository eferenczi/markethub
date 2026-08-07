const express = require("express");
const { z } = require("zod");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const creds = require("../services/credentials");
const stripe = require("../services/integrations/stripe");
const sendgrid = require("../services/integrations/sendgrid");
const twilio = require("../services/integrations/twilio");

const router = express.Router();
router.use(requireAuth, requireRole("owner", "manager"));

const schemas = {
  stripe: z.object({
    publishable_key: z.string().optional().default(""),
    secret_key: z.string().min(1),
    webhook_secret: z.string().optional().default(""),
  }),
  sendgrid: z.object({
    api_key: z.string().min(1),
    from_email: z.string().email().optional().or(z.literal("")).default(""),
  }),
  twilio: z.object({
    account_sid: z.string().min(1),
    auth_token: z.string().min(1),
    from_number: z.string().optional().default(""),
  }),
};

const testers = { stripe: stripe.test, sendgrid: sendgrid.test, twilio: twilio.test };

// List configured integrations (secrets masked).
router.get(
  "/integrations",
  asyncHandler(async (req, res) => {
    res.json({ integrations: await creds.listMasked(req.user.org_id) });
  })
);

// Save/update a provider's keys.
router.put(
  "/integrations/:provider",
  asyncHandler(async (req, res, next) => {
    const { provider } = req.params;
    if (!creds.PROVIDERS.includes(provider)) throw new ApiError(404, "Unknown provider");
    validate(schemas[provider])(req, res, async () => {
      await creds.saveCredentials(req.user.org_id, provider, req.body);
      const list = await creds.listMasked(req.user.org_id);
      res.json({ integration: list.find((i) => i.provider === provider) });
    });
  })
);

// Test a saved connection with a live call.
router.post(
  "/integrations/:provider/test",
  asyncHandler(async (req, res) => {
    const { provider } = req.params;
    if (!testers[provider]) throw new ApiError(404, "Unknown provider");
    try {
      const result = await testers[provider](req.user.org_id);
      res.json(result);
    } catch (err) {
      // Surface integration failures as a clean 400 with the provider's reason.
      throw new ApiError(err.status || 400, err.message || "Connection test failed", err.details);
    }
  })
);

// Remove a provider's keys.
router.delete(
  "/integrations/:provider",
  asyncHandler(async (req, res) => {
    const { provider } = req.params;
    if (!creds.PROVIDERS.includes(provider)) throw new ApiError(404, "Unknown provider");
    await creds.deleteCredentials(req.user.org_id, provider);
    res.json({ ok: true });
  })
);

module.exports = router;
