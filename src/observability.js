const config = require("./config");

let sentry = null;

// Report a captured error as structured JSON (and to Sentry if configured).
function captureError(err, context) {
  const payload = {
    level: "error",
    context: context || "app",
    message: err && err.message,
    stack: err && err.stack,
    time: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(payload));
  if (sentry) {
    try { sentry.captureException(err); } catch { /* ignore */ }
  }
}

// Wire process-level safety nets and optional Sentry. Call once at startup.
function initObservability() {
  if (process.env.SENTRY_DSN) {
    try {
      // Optional dependency: only used if you install it and set SENTRY_DSN.
      // eslint-disable-next-line global-require, import/no-unresolved
      sentry = require("@sentry/node");
      sentry.init({ dsn: process.env.SENTRY_DSN, environment: config.env });
    } catch {
      // eslint-disable-next-line no-console
      console.warn("[observability] SENTRY_DSN is set but @sentry/node isn't installed. Run: npm i @sentry/node");
      sentry = null;
    }
  }
  process.on("unhandledRejection", (err) => captureError(err, "unhandledRejection"));
  process.on("uncaughtException", (err) => {
    captureError(err, "uncaughtException");
    // An uncaught exception leaves the process in an unknown state; exit so the
    // host (Render/systemd/etc.) restarts a clean instance.
    setTimeout(() => process.exit(1), 100).unref();
  });
}

module.exports = { initObservability, captureError };
