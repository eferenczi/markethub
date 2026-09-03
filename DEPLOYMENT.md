# Deploy MarketHub on Render

This repository deploys as one Render web service. The Express server serves
both the API and the compiled React app, so the browser and API share the same
HTTPS domain.

## What the Blueprint creates

`render.yaml` creates:

- `markethub` — a paid Render web service with a `/ready` health check.
- `markethub-db` — a managed Postgres database.

The release process builds the React bundle, removes build-only dependencies,
runs migrations before traffic switches, and then starts the server.

## Required Render environment values

After Render creates the web service, set these values in **Environment** and
redeploy once. Do not place them in GitHub or `.env` committed files.

| Key | Value |
| --- | --- |
| `APP_BASE_URL` | The exact public URL of the service, e.g. `https://markethub.onrender.com` |
| `CORS_ORIGINS` | The same public URL; add comma-separated custom domains later if needed |
| `PLATFORM_SENDGRID_API_KEY` | A SendGrid API key with permission to send mail |
| `PLATFORM_SENDGRID_FROM_EMAIL` | A verified SendGrid sender address |

Render generates `JWT_SECRET` and `APP_ENCRYPTION_KEY` automatically and wires
`DATABASE_URL` to Postgres. Leave `DB_CLIENT=pg` and `DB_SSL=false` unchanged
for the Render private database URL.

## First live sign-in

Open the public URL and register the first organization. That account becomes
the owner. New organizations receive the built-in 14-day trial; enable Stripe
platform billing later when you are ready to sell subscriptions.

## Integrations after launch

The owner or a manager can open **Settings** and save organization-specific
Stripe, SendGrid, and Twilio credentials. Those credentials are encrypted in
the database and are never returned to the browser in plain text.

To use live account emails immediately, verify the SendGrid sender and set the
two required platform email values above. Stripe subscription checkout and
Twilio/SMS sending remain optional until their real account credentials and
webhook endpoints are configured.

## Before inviting real users

- Publish Privacy Policy and Terms of Service pages for the business.
- Verify the SendGrid sender domain and test password reset delivery.
- Add any custom domain in Render and include it in `APP_BASE_URL` and
  `CORS_ORIGINS`.
- Create Stripe products/prices and the webhook only when platform subscription
  billing is ready. Do not enable it with test credentials.
