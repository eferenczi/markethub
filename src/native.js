import { Capacitor } from "@capacitor/core";

// True when running inside the iOS/Android app (not a plain web browser).
export function isNative() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function platform() {
  try {
    return Capacitor.getPlatform(); // "ios" | "android" | "web"
  } catch {
    return "web";
  }
}

/*
 * In-app purchase entry point (hybrid billing, mobile side).
 *
 * Apple and Google require that subscriptions sold inside the app go through
 * their in-app purchase systems — you may NOT send iOS users to Stripe web
 * checkout. This is where that runs. To complete it in Step 3 you will:
 *   1. Add an IAP plugin (e.g. RevenueCat's @revenuecat/purchases-capacitor,
 *      or @capacitor-community/in-app-purchases).
 *   2. Create matching subscription products in App Store Connect + Play Console
 *      using the same plan codes ("starter", "pro").
 *   3. Run the native purchase here, then POST the receipt/token to the backend
 *      (/billing/iap/apple or /billing/iap/google) so it verifies and unlocks
 *      the org's subscription — the same unified state Stripe uses.
 */
export async function purchaseSubscription(planCode) {
  throw new Error(
    "In-app purchase isn't wired up yet. Add an IAP plugin and store products (Step 3), then this unlocks purchasing inside the app."
  );
}
