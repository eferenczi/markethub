# MarketHub — web app (console + mobile) with real auth

The MarketHub front-end, now wired to the backend API (`markethub-api`):

- **Login / register / forgot / reset** — real accounts, gated at the door.
- **Manager console** at `/` once signed in.
- **Settings page** (owner/manager) — connect your own Stripe / SendGrid / Twilio
  keys and manage team members and roles. Talks to the backend.
- **Vendor + manager mobile app** at `/#/app`.

Payments/email/SMS run through *your* connected accounts on the backend. The
domain screens (markets, booths, CRM) remain the interactive prototype until
they're wired to the API — see `MarketHub_Build_Spec.md`.

---

## Connect it to the backend

The front-end reads the API URL from `VITE_API_URL`.

    cp .env.example .env
    # .env:  VITE_API_URL=http://localhost:4000   (your markethub-api URL)

Run the backend first (see the `markethub-api` README), then:

    npm install
    npm run dev      # http://localhost:5173

The backend's `CORS_ORIGINS` must include this front-end's URL
(`http://localhost:5173` is allowed by default).

Sign in with the backend's seeded account: demo@markethub.test / password123

---

## Build & deploy

    npm run build    # outputs dist/

- Netlify (no coding): drag the `dist` folder onto https://app.netlify.com/drop
- Vercel/Netlify from GitHub: import the repo (Vite is auto-detected). Set
  `VITE_API_URL` to your deployed API URL in the project's environment variables,
  and add the deployed front-end URL to the backend's `CORS_ORIGINS`.

`vercel.json` / `netlify.toml` handle SPA routing so `/reset-password` and refreshes work.

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

- Password-reset links from email open `/reset-password?token=...`.
- The token is stored in localStorage and sent as `Authorization: Bearer ...`.
- Roles come from the backend; the Settings button only shows for owner/manager.
