# Building & shipping the mobile apps (iOS + Android)

MarketHub is wrapped with **Capacitor**, which packages the same web app into
native iOS and Android apps. This guide takes you from this project to apps in
the App Store and Google Play.

> These steps run on **your** machine with **your** developer accounts. iOS
> builds require a **Mac with Xcode**. There is no way around that — Apple only
> allows iOS builds on macOS.

---

## 0. One-time prerequisites

- **Node.js 18+** (already needed for the web app).
- **iOS:** a Mac, **Xcode** (App Store), **CocoaPods** (`sudo gem install cocoapods`),
  and an **Apple Developer account** ($99/yr).
- **Android:** **Android Studio** (includes the SDK + JDK), and a **Google Play
  Developer account** ($25 one-time).

## 1. Point the app at your live API

On a phone, `localhost` is the phone itself — it can't reach your dev backend.
Set the API URL to your **deployed** backend and rebuild:

    # .env
    VITE_API_URL=https://your-api.onrender.com

    npm run build

Your API must be served over **HTTPS**. The backend already allows the app's
origins (`capacitor://localhost`, `https://localhost`) through CORS.

## 2. Set your app identity

Edit `capacitor.config.json`:

    "appId": "com.yourcompany.markethub",   // your reverse-domain, cannot change after publishing
    "appName": "MarketHub"

## 3. Add the native platforms (once)

    npx cap add ios
    npx cap add android

This generates `ios/` (an Xcode project) and `android/` (an Android Studio
project). Commit them or keep them local — either works.

## 4. Build, sync, and open

Every time you change the web app, rebuild and sync:

    npm run cap:sync          # build + copy web assets into both native projects

Then open each platform:

    npx cap open ios          # opens Xcode      -> Run on a simulator/device
    npx cap open android      # opens Android Studio -> Run

## 5. App icon & splash screen

Put a 1024×1024 `icon.png` (and optional `splash.png`) in a `resources/` folder, then:

    npm i -D @capacitor/assets
    npx @capacitor/assets generate

This generates every icon/splash size for both platforms.

---

## 6. Finish hybrid billing (the in-app-purchase half)

The web already sells subscriptions via Stripe. For the apps, Apple and Google
require **in-app purchase** for digital subscriptions — you may **not** send iOS
users to Stripe web checkout (the app already routes native users to IAP instead).

To complete it:

1. Add an IAP plugin — **RevenueCat** is the easiest:
   `npm i @revenuecat/purchases-capacitor` (or `@capacitor-community/in-app-purchases`).
2. In **App Store Connect** and **Play Console**, create auto-renewing
   subscription products using the same plan codes: `starter`, `pro`.
3. In `src/native.js`, implement `purchaseSubscription(planCode)` to run the
   native purchase, then `POST` the receipt/token to the backend
   (`/billing/iap/apple` or `/billing/iap/google`). Implement server-side
   verification in `src/routes/billing.routes.js` (the endpoints are stubbed and
   ready) so the org's subscription unlocks — the same unified state Stripe uses.

---

## 7. Submission checklist

Both stores require:

- **Privacy Policy URL** (public web page) and **Terms of Service**.
- **Data-safety / App-Privacy declarations** — what data you collect (accounts,
  usage) and why.
- **Screenshots** for required device sizes, an app description, and keywords.
- **A demo/review account** (e.g. `demo@markethub.test`) so reviewers can log in.
- **Signing:** iOS uses Xcode "Automatic signing" with your Apple team; Android
  needs an **upload keystore** (Android Studio → Generate Signed Bundle).
- **Build artifacts:** iOS `.ipa` via Xcode → Product → Archive → distribute to
  App Store Connect; Android `.aab` via Android Studio → Generate Signed Bundle,
  uploaded in the Play Console.

Then submit for review. First review typically takes 1–3 days (Apple) and hours
to a day (Google). Rejections are normal on the first try — usually privacy
declarations or IAP configuration; fix and resubmit.

---

## Quick reference

    npm run build          # build web
    npm run cap:sync       # build + sync to iOS & Android
    npm run cap:ios        # build + sync + open Xcode
    npm run cap:android    # build + sync + open Android Studio
