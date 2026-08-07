import React, { useState } from "react";
import { Check, Loader2, ArrowLeft, Sparkles, X, LogOut } from "lucide-react";
import { api } from "./api";
import { isNative, platform, purchaseSubscription } from "./native";
import { C, FD, FB } from "./theme";

function money(cents) {
  return "$" + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

export default function BillingPage({ user, summary, onRefresh, onClose, blocking, logout }) {
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState(null);
  const notify = (msg, kind) => { setToast({ msg, kind }); setTimeout(() => setToast(null), 3500); };
  const isOwner = user.role === "owner";
  const native = isNative();

  const subscribe = async (code) => {
    setBusy("sub:" + code);
    try {
      if (native) {
        // Mobile: must use Apple/Google in-app purchase (not Stripe web checkout).
        await purchaseSubscription(code);
        notify("Purchase complete");
        onRefresh && onRefresh();
      } else {
        const { url } = await api.checkout(code);
        window.location.href = url; // Stripe Checkout on web
      }
    } catch (e) {
      notify(e.message || "Couldn't start checkout", "err");
    } finally {
      setBusy("");
    }
  };

  const activate = async (code) => {
    setBusy("act:" + code);
    try {
      await api.activatePlan(code);
      notify("Plan activated");
      onRefresh && onRefresh();
    } catch (e) {
      notify(e.message || "Activation failed", "err");
    } finally {
      setBusy("");
    }
  };

  const statusLine = () => {
    if (!summary) return null;
    if (summary.status === "trialing") return `Free trial — ${summary.trial_days_left} day${summary.trial_days_left === 1 ? "" : "s"} left`;
    if (summary.status === "active") return `Active${summary.plan_code ? " · " + summary.plan_code : ""}`;
    if (summary.status === "past_due") return "Payment past due";
    if (summary.status === "canceled") return "Canceled";
    return "No active subscription";
  };
  const bannerTone = summary?.active ? [C.sageSoft, C.pine] : [C.honeySoft, C.honeyDeep];

  const plans = summary?.plans || [];

  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: FB, color: C.ink }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }} className="px-4 py-6">
        {!blocking && onClose && (
          <button onClick={onClose} style={{ color: C.sub }} className="text-[13px] font-semibold flex items-center gap-1.5 mb-4"><ArrowLeft size={15} /> Back to console</button>
        )}
        <div className="flex items-center gap-2 mb-1">
          <h1 style={{ fontFamily: FD, fontWeight: 600 }} className="text-[26px]">{blocking ? "Choose a plan" : "Billing"}</h1>
        </div>
        <p style={{ color: C.sub }} className="text-[13.5px] mb-4">
          {blocking ? "Your trial has ended. Pick a plan to keep using MarketHub." : "Manage your MarketHub subscription."}
        </p>

        <div style={{ background: bannerTone[0], color: bannerTone[1] }} className="rounded-xl px-4 py-2.5 text-[13px] font-semibold mb-6 inline-flex items-center gap-2">
          <Sparkles size={15} /> {statusLine()}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map((p) => {
            const current = summary?.plan_code === p.code && summary?.status === "active";
            return (
              <div key={p.code} style={{ background: C.card, border: `1.5px solid ${current ? C.pine : C.line}` }} className="rounded-2xl p-5">
                <div className="flex items-baseline justify-between mb-1">
                  <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[18px]">{p.name}</p>
                  {current && <span style={{ background: C.sageSoft, color: C.pine }} className="text-[10.5px] font-bold px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <p className="text-[22px] font-bold mb-3" style={{ color: C.ink }}>{money(p.price_cents)}<span style={{ color: C.sub }} className="text-[13px] font-medium">/{p.interval}</span></p>
                <ul className="flex flex-col gap-1.5 mb-4">
                  {(p.features || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.sub }}><Check size={14} color={C.pine} className="mt-0.5 flex-shrink-0" /> {f}</li>
                  ))}
                </ul>
                <button onClick={() => subscribe(p.code)} disabled={busy || current} style={{ background: current ? C.paper2 : C.pine, color: current ? C.sub : "#fff", opacity: busy ? 0.6 : 1 }} className="w-full py-2.5 rounded-lg text-[13.5px] font-bold flex items-center justify-center gap-2">
                  {busy === "sub:" + p.code ? <Loader2 size={15} className="animate-spin" /> : null}
                  {current ? "Current plan" : "Subscribe"}
                </button>
                {isOwner && !current && (
                  <button onClick={() => activate(p.code)} disabled={busy} style={{ color: C.faint }} className="w-full mt-2 text-[11.5px] font-semibold">
                    {busy === "act:" + p.code ? "Activating…" : "Activate without payment (testing)"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ color: C.faint }} className="text-[11.5px] mt-6 leading-relaxed">
          {native
            ? `On ${platform() === "ios" ? "iOS" : "Android"}, subscriptions are purchased through ${platform() === "ios" ? "the App Store" : "Google Play"} and unlock on every device.`
            : "On the web, subscriptions are billed through Stripe. In the iOS and Android apps, the same plans are purchased through Apple / Google in-app purchase, and your subscription unlocks on every device."}
        </p>

        {blocking && (
          <button onClick={logout} style={{ color: C.danger }} className="mt-6 text-[13px] font-semibold flex items-center gap-1.5"><LogOut size={14} /> Log out</button>
        )}
      </div>

      {toast && (
        <div className="fixed left-0 right-0 bottom-6 flex justify-center pointer-events-none">
          <div style={{ background: toast.kind === "err" ? C.danger : C.ink, color: "#fff" }} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium shadow-xl">
            {toast.kind === "err" ? <X size={14} /> : <Check size={14} color={C.sage} />} {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
