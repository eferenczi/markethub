# MarketHub — market-management web and mobile app

This repository contains both the React/Vite front end and the Node/Express API:

- **Login / register / forgot / reset** — real accounts, gated at the door.
- **Manager console** at `/` once signed in.
- **Settings page** (owner/manager) — connect your own Stripe / SendGrid / Twilio
  keys and manage team members and roles. Talks to the backend.
- **Vendor + manager mobile app** at `/#/app`.

Payments/email/SMS run through *your* connected accounts on the backend. The
domain screens (markets, booths, CRM) remain the interactive prototype until
they're wired to the API — see `MarketHub_Build_Spec.md`.

---

## Run it locally

The front-end reads the API URL from `VITE_API_URL`.

    cp .env.example .env
    # .env:  VITE_API_URL=http://localhost:4000   (your markethub-api URL)

Install dependencies, initialize the local database, and run both services:

    npm install
    cp .env.example .env
    npm run db:migrate
    npm run db:seed
    npm run dev

The web app opens at `http://localhost:5173`; the API runs at
`http://localhost:4000`. The front end defaults to that API URL, or you can
set `VITE_API_URL` in `.env`.

Sign in with the backend's seeded account: demo@markethub.test / password123

---

## Build & deploy

    npm run build    # outputs dist/

- Netlify (no coding): drag the `dist` folder onto https://app.netlify.com/drop
- Vercel/Netlify from GitHub: import the repo (Vite is auto-detected). Set
  `VITE_API_URL` to your deployed API URL in the project's environment variables,
  and add the deployed front-end URL to the backend's `CORS_ORIGINS`.

`vercel.json` / `netlify.toml` handle SPA routing so `/reset-password` and refreshes work.

For the production Render release (React app, API, and Postgres together),
follow [DEPLOYMENT.md](DEPLOYMENT.md). The checked-in `render.yaml` is the
source of truth for that deployment.

---

## How the pieces fit

    src/
      main.jsx              gate: reset route -> auth -> app; adds account bar + settings
      auth.jsx              AuthProvider/useAuth, login/register/forgot/reset, account bar
      SettingsPage.jsx      integrations (Stripe/SendGrid/Twilio) + team members
      api.js                fetch client + token storage (VITE_API_URL)
      theme.js              shared design tokens
      MarketHub_ManagerWeb.jsx   manager console (prototype)
      MarketHub.jsx              vendor + manager mobile app (prototype)
      server.js             Express API entry point
      routes/               authenticated API endpoints
      migrations/           database schema migrations

- Password-reset links from email open `/reset-password?token=...`.
- The token is stored in localStorage and sent as `Authorization: Bearer ...`.
- Roles come from the backend; the Settings button only shows for owner/manager.

## Shared operations data

The `/operations` API contains the working data layer for the manager console:

- **Market dates** — each actual event date is stored separately from its recurring market.
- **Vendor-market links** — tracks eligibility and any intentional market-specific CRM-stage override.
- **Approvals** — one vendor approval per market date, including fee, discount, hold/deadline, reminders, and payment state.
- **Booth layouts** — versioned per market date, with assigned tents/trucks and printable booth codes.

Approvals are deliberately **per market date**, rather than per market. A vendor’s
payment for October 3rd cannot accidentally confirm a booth on October 10th.
All values are organization-scoped and protected by the authenticated API.
