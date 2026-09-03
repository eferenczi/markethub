# Production hardening checklist

What the code already does, and what you configure per environment.

## Built in (in this repo)

- **Fail-fast secrets** — in production the API refuses to boot without
  `JWT_SECRET` and `APP_ENCRYPTION_KEY` (no insecure fallbacks).
- **Rate limiting** — a global limiter plus a stricter limiter on `/auth`.
- **Security headers** — `helmet` on the API; header rules for the web host
  (`markethub-web/public/_headers` and `vercel.json`).
- **Health & readiness** — `GET /health` (liveness) and `GET /ready` (checks the
  database). Point your host's health check at `/ready`.
- **Graceful shutdown** — closes connections and the DB on SIGTERM/SIGINT.
- **Structured error capture** — 500s and unhandled errors log as JSON and can
  forward to Sentry (set `SENTRY_DSN` and `npm i @sentry/node`).
- **CORS allowlist** — only your configured web origins + the native app origins.
- **Automated tests + CI** — `npm test` runs on every push/PR via GitHub Actions
  (`.github/workflows/ci.yml`).
- **Tenant isolation** — verified by tests: one org can't see another's data.

## You configure (per deploy)

1. **Secrets** — set strong `JWT_SECRET` and `APP_ENCRYPTION_KEY`
   (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
   Never commit them. If you rotate `APP_ENCRYPTION_KEY`, stored integration
   keys must be re-entered.
2. **HTTPS everywhere** — API and web both over TLS (Render/Vercel/Netlify give
   free certs).
3. **Managed database + backups** — production uses the Render Postgres service
   defined in `render.yaml`. Enable its backups/retention level appropriate to
   your plan and test a restore before relying on it for event records.
4. **Error tracking** — create a Sentry project, set `SENTRY_DSN`, install
   `@sentry/node`.
5. **Uptime monitoring** — a monitor (e.g. UptimeRobot/BetterStack) hitting
   `/ready` with alerts.
6. **Staging environment** — a second deploy with its own DB and
   `NODE_ENV=production`, for testing releases before production.
7. **Log retention** — keep your host's logs; ship to a log service if needed.
8. **CORS** — set `APP_BASE_URL` and `CORS_ORIGINS` to the exact live web
   domain. The production server serves both the React app and API from that
   same domain.
9. **Platform Stripe** — real product/price IDs, live webhook secret, and set
   `ALLOW_MANUAL_BILLING` unset (so test activation is off in production).
10. **Dependency updates** — enable Dependabot/`npm audit` in CI over time.

## Legal / store requirements (not code)

- Hosted **Privacy Policy** and **Terms of Service** URLs.
- App-store **data-safety / privacy** declarations.
- A business entity + bank for Stripe payouts.
