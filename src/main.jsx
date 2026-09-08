import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { Loader2 } from "lucide-react";
import "./index.css";
import Console from "./MarketHub_ManagerWeb.jsx";
import MobileApp from "./MarketHub.jsx";
import { AuthProvider, useAuth, AuthScreens, ResetPassword, AccountBar } from "./auth.jsx";
import SettingsPage from "./SettingsPage.jsx";
import RecordsPage from "./RecordsPage.jsx";
import ApplicationPage from "./ApplicationPage.jsx";
import AcknowledgmentPage from "./AcknowledgmentPage.jsx";
import BillingPage from "./BillingPage.jsx";
import { api } from "./api";
import { isNative } from "./native";
import { C, FB } from "./theme";

// Native (iOS/Android) startup: style the status bar, hide the splash, and mark
// the body so we can apply safe-area padding. No-ops on the web.
async function initNative() {
  if (!isNative()) return;
  document.body.classList.add("native");
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    await SplashScreen.hide().catch(() => {});
  } catch {
    /* plugins only present in the native build */
  }
}
initNative();

/*
 * window.storage shim — provided by the Claude artifact runtime, absent on a
 * real host. Backed by localStorage so saved booth layouts persist.
 */
if (typeof window !== "undefined" && !window.storage) {
  const P = "mh:";
  const ls = (() => {
    try {
      window.localStorage.setItem("__mh_probe__", "1");
      window.localStorage.removeItem("__mh_probe__");
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  const mem = {};
  window.storage = {
    async get(key) {
      const v = ls ? ls.getItem(P + key) : key in mem ? mem[key] : null;
      return v == null ? null : { key, value: v, shared: false };
    },
    async set(key, value) {
      const v = String(value);
      if (ls) ls.setItem(P + key, v); else mem[key] = v;
      return { key, value: v, shared: false };
    },
    async delete(key) {
      if (ls) ls.removeItem(P + key); else delete mem[key];
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const keys = [];
      if (ls) { for (let i = 0; i < ls.length; i++) { const kk = ls.key(i); if (kk && kk.startsWith(P + prefix)) keys.push(kk.slice(P.length)); } }
      else { for (const kk of Object.keys(mem)) if (kk.startsWith(prefix)) keys.push(kk); }
      return { keys, prefix, shared: false };
    },
  };
}

function Splash() {
  return (
    <div style={{ background: C.paper, minHeight: "100vh", color: C.sub, fontFamily: FB }} className="flex items-center justify-center gap-2 text-[14px]">
      <Loader2 size={18} className="animate-spin" /> Loading…
    </div>
  );
}

function Root() {
  const { user, loading, logout, pilot: pilotMode } = useAuth();
  const [view, setView] = useState(null); // null | "settings" | "records" | "billing"
  const [billing, setBilling] = useState(undefined); // undefined=loading, null=error, object

  const path = window.location.pathname.replace(/\/+$/, "");
  const isReset = path.endsWith("/reset-password") || path === "/reset-password";
  const hash = (window.location.hash || "").replace(/^#/, "").replace(/^\//, "");
  const applicationKey = hash.startsWith("apply/") ? hash.slice("apply/".length).split("/")[0] : "";
  const acknowledgmentKey = hash.startsWith("ack/") ? hash.slice("ack/".length).split("/")[0] : "";

  if (applicationKey) return <ApplicationPage applicationKey={applicationKey} />;
  if (acknowledgmentKey) return <AcknowledgmentPage acknowledgmentKey={acknowledgmentKey} />;

  const loadBilling = useCallback(async () => {
    try {
      setBilling(await api.getBilling());
    } catch {
      setBilling(null);
    }
  }, []);

  useEffect(() => {
    if (user && !isReset && !pilotMode) loadBilling();
  }, [user, isReset, pilotMode, loadBilling]);

  if (isReset) {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    return <ResetPassword token={token} />;
  }

  if (loading) return <Splash />;
  if (!user) return pilotMode ? <Splash /> : <AuthScreens />;
  // Private organizer pilot: direct access to the shared workspace. The
  // account/billing chrome and all sign-in routes stay out of the way until
  // authentication is deliberately re-enabled for the public launch.
  if (pilotMode) return <RecordsPage user={user} />;
  if (billing === undefined) return <Splash />;

  // Explicit billing view (from the account bar).
  if (view === "billing") return <BillingPage user={user} summary={billing} onRefresh={loadBilling} onClose={() => setView(null)} />;

  // Paywall: no active subscription/trial -> must choose a plan.
  if (billing && billing.active === false) {
    return <BillingPage user={user} summary={billing} onRefresh={loadBilling} blocking logout={logout} />;
  }

  if (view === "settings") return <SettingsPage user={user} onClose={() => setView(null)} />;
  if (view === "records") return <RecordsPage user={user} onClose={() => setView(null)} />;

  // #/app -> mobile app, otherwise the manager console.
  const isApp = hash.toLowerCase().startsWith("app");
  const AppView = isApp ? MobileApp : null;

  return (
    <div>
      <AccountBar
        user={user}
        billing={billing}
        onSettings={() => setView("settings")}
        onRecords={() => setView("records")}
        onBilling={() => setView("billing")}
        onLogout={logout}
      />
      {AppView ? <AppView /> : <RecordsPage user={user} />}
    </div>
  );
}

// Switching the #/app hash reloads so each demo app starts clean.
window.addEventListener("hashchange", () => window.location.reload());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>
);
