require("dotenv").config();

function req(name, fallback) {
  const v = process.env[name];
  if (v && v.length) return v;
  if (fallback !== undefined) {
    if (process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.warn(`[config] WARNING: ${name} is not set; using an insecure fallback. Set it in your environment.`);
    }
    return fallback;
  }
  throw new Error(`[config] Missing required env var: ${name}`);
}

const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (!corsOrigins.includes(appBaseUrl)) corsOrigins.push(appBaseUrl);

const config = {
  env: process.env.NODE_ENV || "development",
  // Private organizer pilot only. Leave this false for public web and native
  // releases so the normal authentication flow remains enforced.
  pilotMode: process.env.PILOT_MODE === "true",
  port: parseInt(process.env.PORT || "4000", 10),
  corsOrigins,
  jwtSecret: req("JWT_SECRET", "dev-insecure-jwt-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  encryptionKey: req("APP_ENCRYPTION_KEY", "dev-insecure-encryption-key-change-me"),
  appBaseUrl,
  platformSendgrid: {
    apiKey: process.env.PLATFORM_SENDGRID_API_KEY || "",
    from: process.env.PLATFORM_SENDGRID_FROM_EMAIL || "",
  },
  billing: {
    trialDays: parseInt(process.env.TRIAL_DAYS || "14", 10),
    // PLATFORM Stripe = you charging your client orgs (separate from the org's
    // own Stripe keys in Settings, which are your clients charging their vendors).
    platformStripeSecret: process.env.PLATFORM_STRIPE_SECRET || "",
    platformStripeWebhookSecret: process.env.PLATFORM_STRIPE_WEBHOOK_SECRET || "",
    successUrl: process.env.BILLING_SUCCESS_URL || (process.env.APP_BASE_URL || "http://localhost:5173") + "/?billing=success",
    cancelUrl: process.env.BILLING_CANCEL_URL || (process.env.APP_BASE_URL || "http://localhost:5173") + "/?billing=cancel",
    // Allow owner to activate a plan without real payment (testing/comping).
    // On by default outside production.
    allowManual: process.env.ALLOW_MANUAL_BILLING === "true" || process.env.NODE_ENV !== "production",
  },
};

module.exports = config;

// Fail fast in production rather than booting with insecure fallback secrets.
if (config.env === "production") {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!process.env.APP_ENCRYPTION_KEY) missing.push("APP_ENCRYPTION_KEY");
  if (missing.length) {
    throw new Error(`Refusing to start in production without secure secrets: ${missing.join(", ")}. Set them in the environment.`);
  }
  if (!config.platformSendgrid.apiKey) {
    throw new Error("Refusing to start in production without PLATFORM_SENDGRID_API_KEY so password resets and invitations can be delivered.");
  }
  if (config.platformSendgrid.apiKey && !config.platformSendgrid.from) {
    throw new Error("PLATFORM_SENDGRID_FROM_EMAIL is required when PLATFORM_SENDGRID_API_KEY is set.");
  }
}
