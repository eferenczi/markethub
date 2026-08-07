const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const config = require("./config");
const db = require("./db");
const { initObservability } = require("./observability");
const { notFound, errorHandler } = require("./middleware/error");

const authRoutes = require("./routes/auth.routes");
const orgRoutes = require("./routes/org.routes");
const settingsRoutes = require("./routes/settings.routes");
const billingRoutes = require("./routes/billing.routes");
const marketRoutes = require("./routes/markets.routes");
const vendorRoutes = require("./routes/vendors.routes");
const webhookRoutes = require("./routes/webhooks.routes");

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
// Native (Capacitor) apps send these origins; allow them alongside your web URLs.
const NATIVE_ORIGINS = ["capacitor://localhost", "ionic://localhost", "http://localhost", "https://localhost"];
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin/no-origin (curl, mobile apps) and configured front-ends.
      if (!origin || config.corsOrigins.includes(origin) || NATIVE_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
if (config.env !== "test") app.use(morgan("dev"));

// Rate limiting protects against brute-force and abuse. Disabled under test.
const skipInTest = () => config.env === "test";
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false, skip: skipInTest });
app.use(globalLimiter);

// Webhooks need the raw body, so mount them BEFORE the JSON body parser.
app.use("/webhooks", webhookRoutes);

// JSON for everything else.
app.use(express.json({ limit: "1mb" }));

// Throttle auth endpoints harder to slow down credential-stuffing.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false, skip: skipInTest });

// Liveness: is the process up? Readiness: can it reach the database?
app.get("/health", (req, res) => res.json({ ok: true, service: "markethub-api", time: new Date().toISOString() }));
app.get("/ready", async (req, res) => {
  try {
    await db.raw("select 1");
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

app.use("/auth", authLimiter, authRoutes);
app.use("/org", orgRoutes);
app.use("/settings", settingsRoutes);
app.use("/billing", billingRoutes);
app.use("/markets", marketRoutes);
app.use("/vendors", vendorRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  initObservability();
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`MarketHub API listening on http://localhost:${config.port} (${config.env})`);
  });

  // Graceful shutdown: stop accepting connections, close the DB, then exit.
  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — shutting down gracefully…`);
    server.close(() => {
      db.destroy().finally(() => process.exit(0));
    });
    // Force-exit if connections don't drain in time.
    setTimeout(() => process.exit(1), 10000).unref();
  };
  ["SIGTERM", "SIGINT"].forEach((s) => process.on(s, () => shutdown(s)));
}

module.exports = app;
