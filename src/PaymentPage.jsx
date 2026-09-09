import React, { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { api } from "./api";
import { C, FD } from "./theme";

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
const labels = {
  stripe: "Credit/debit card, Apple Pay or Google Pay",
  applepay: "Apple Pay",
  googlepay: "Google Pay",
  paypal: "PayPal",
  venmo: "Venmo",
  zelle: "Zelle",
  cash: "Cash",
  other: "Other payment method",
};

export default function PaymentPage({ paymentKey }) {
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [chosen, setChosen] = useState("");
  const load = async () => {
    try {
      const result = await api.getPublicPayment(paymentKey);
      setPayment(result.payment);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => {
    load();
  }, [paymentKey]);
  const checkout = async () => {
    setBusy(true);
    try {
      const result = await api.createPublicCheckout(paymentKey);
      window.location.assign(result.checkout_url);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  const chooseMethod = async (method) => {
    setBusy(true);
    try {
      const result = await api.choosePublicPaymentMethod(paymentKey, method);
      setChosen(result.message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  if (error)
    return (
      <main
        style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}
        className="p-6 flex justify-center"
      >
        <section
          style={{ background: C.card, border: `1px solid ${C.line}` }}
          className="mt-16 max-w-md h-fit w-full rounded-2xl p-6"
        >
          <p style={{ fontFamily: FD }} className="text-xl font-semibold">
            Payment link unavailable
          </p>
          <p style={{ color: C.sub }} className="mt-2 text-sm">
            {error}
          </p>
        </section>
      </main>
    );
  if (!payment)
    return (
      <main
        style={{ background: C.paper, color: C.sub, minHeight: "100vh" }}
        className="p-6 flex items-center justify-center"
      >
        <Loader2 className="animate-spin" size={20} />{" "}
        <span className="ml-2">Loading secure payment…</span>
      </main>
    );
  const paid = payment.status === "paid";
  const manual = (payment.payment_methods || []).filter(
    (method) =>
      method !== "stripe" && method !== "applepay" && method !== "googlepay",
  );
  return (
    <main
      style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}
      className="p-4 sm:p-8 flex justify-center"
    >
      <section
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        className="w-full max-w-lg h-fit rounded-2xl overflow-hidden shadow-sm"
      >
        <div style={{ background: C.pine }} className="px-6 py-7 text-white">
          <p className="text-xs font-bold uppercase tracking-wider opacity-75">
            Vendor market payment
          </p>
          <h1
            style={{ fontFamily: FD }}
            className="mt-1 text-3xl font-semibold"
          >
            {payment.market_name}
          </h1>
          <p className="mt-2 text-sm opacity-90">
            {new Date(
              `${String(payment.event_date).slice(0, 10)}T12:00:00`,
            ).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="p-6">
          {paid ? (
            <div
              style={{ background: C.sageSoft, color: C.pine }}
              className="rounded-xl p-4 flex gap-3 items-center"
            >
              <CheckCircle2 size={23} />
              <div>
                <p className="font-bold">Payment received</p>
                <p className="text-sm">
                  Thank you — your vendor space is confirmed.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p style={{ color: C.sub }} className="text-sm">
                {payment.business_name} · Booth fee due
              </p>
              <p
                style={{ fontFamily: FD }}
                className="mt-1 text-4xl font-semibold"
              >
                {money(payment.amount_due_cents)}
              </p>
              <p style={{ color: C.sub }} className="mt-2 text-xs">
                Your market fee is not increased. The organizer absorbs the 3.5%
                processor deduction for online card and wallet payments; cash,
                Zelle, and Venmo have no processing fee.
              </p>
              {payment.online_checkout_available && (
                <button
                  onClick={checkout}
                  disabled={busy}
                  style={{ background: C.pine, color: "#fff" }}
                  className="mt-6 w-full rounded-xl py-3 font-bold flex gap-2 justify-center items-center"
                >
                  {busy ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CreditCard size={18} />
                  )}
                  Pay securely by card
                </button>
              )}
              <p style={{ color: C.sub }} className="mt-3 text-center text-xs">
                Secure checkout accepts cards and, when supported on the device,
                Apple Pay or Google Pay.
              </p>
              {(manual.length > 0 ||
                payment.payment_methods?.includes("cash")) && (
                <div
                  style={{
                    background: C.paper2,
                    border: `1px solid ${C.line}`,
                  }}
                  className="mt-5 rounded-xl p-4"
                >
                  <p className="text-sm font-bold">Other accepted methods</p>
                  <p style={{ color: C.sub }} className="mt-1 text-xs">
                    Choose a method to let the market team know. They will
                    confirm manual payments after receipt.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[...new Set([...manual, "cash"])].map((method) => (
                      <button
                        key={method}
                        onClick={() => chooseMethod(method)}
                        disabled={busy}
                        style={{
                          background: C.card,
                          border: `1px solid ${C.line}`,
                          color: C.pine,
                        }}
                        className="px-3 py-2 rounded-lg text-[11px] font-bold"
                      >
                        {labels[method] || method}
                      </button>
                    ))}
                  </div>
                  {chosen && (
                    <p
                      style={{ color: C.pine }}
                      className="mt-3 text-xs font-semibold"
                    >
                      {chosen}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
