import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, Store } from "lucide-react";
import { api } from "./api";
import { C, FD, FB } from "./theme";

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
export default function SubscribePage({ subscribeKey }) {
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interested_market_ids: [],
  });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .getPublicSubscribe(subscribeKey)
      .then(setInfo)
      .catch((err) => setError(err.message));
  }, [subscribeKey]);
  const submit = async () => {
    if (!form.email && !form.phone)
      return setError("Enter an email address or mobile number.");
    setBusy(true);
    setError("");
    try {
      await api.submitPublicSubscribe(subscribeKey, form);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  if (done)
    return (
      <div
        style={{ background: C.paper, minHeight: "100vh", fontFamily: FB }}
        className="flex items-center justify-center p-5"
      >
        <div
          style={{ background: C.card, border: `1px solid ${C.line}` }}
          className="rounded-2xl p-8 text-center max-w-md"
        >
          <CheckCircle2 size={46} color={C.pine} className="mx-auto mb-3" />
          <h1 style={{ fontFamily: FD }} className="text-[26px] font-semibold">
            You’re on the list
          </h1>
          <p style={{ color: C.sub }} className="text-[14px] mt-2">
            We’ll send market news, event updates, and special announcements.
          </p>
        </div>
      </div>
    );
  if (!info && !error)
    return (
      <div
        style={{ background: C.paper, minHeight: "100vh", color: C.sub }}
        className="flex items-center justify-center gap-2"
      >
        <Loader2 size={18} className="animate-spin" /> Loading signup…
      </div>
    );
  if (!info)
    return (
      <div
        style={{ background: C.paper, minHeight: "100vh", color: C.danger }}
        className="flex items-center justify-center p-5"
      >
        {error}
      </div>
    );
  return (
    <main
      style={{
        background: C.paper,
        minHeight: "100vh",
        fontFamily: FB,
        color: C.ink,
      }}
      className="flex items-center justify-center p-4"
    >
      <section
        style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          maxWidth: 520,
        }}
        className="w-full rounded-2xl p-6 sm:p-8"
      >
        <div
          style={{ background: C.pine }}
          className="w-11 h-11 rounded-xl flex items-center justify-center"
        >
          <Store size={22} color={C.honey} />
        </div>
        <h1
          style={{ fontFamily: FD }}
          className="text-[28px] font-semibold mt-4"
        >
          Stay in the market loop
        </h1>
        <p style={{ color: C.sub }} className="text-[14px] mt-2">
          Sign up for {info.organization.name} news, events, and vendor
          highlights.
        </p>
        {error && (
          <p style={{ color: C.danger }} className="text-[12px] mt-3">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3 mt-5">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Your name"
            style={inp}
            className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
          />
          <input
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="Email address"
            type="email"
            style={inp}
            className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
          />
          <input
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="Mobile number (optional)"
            style={inp}
            className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
          />
          {(info.markets || []).length > 0 && (
            <fieldset>
              <legend
                style={{ color: C.faint }}
                className="text-[10.5px] font-bold uppercase tracking-wide"
              >
                Markets you’re interested in
              </legend>
              <p style={{ color: C.sub }} className="mt-1 text-[11.5px]">
                Choose any markets you’d like to hear about.
              </p>
              <div
                style={{ background: C.paper2, border: `1px solid ${C.line}` }}
                className="mt-2 grid gap-1.5 rounded-xl p-2"
              >
                {info.markets.map((market) => (
                  <label
                    key={market.id}
                    style={{ background: C.card, color: C.sub }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-semibold cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.interested_market_ids.includes(market.id)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          interested_market_ids:
                            current.interested_market_ids.includes(market.id)
                              ? current.interested_market_ids.filter(
                                  (id) => id !== market.id,
                                )
                              : [...current.interested_market_ids, market.id],
                        }))
                      }
                    />
                    <span>
                      {market.name}
                      {market.location ? ` — ${market.location}` : ""}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <button
            onClick={submit}
            disabled={busy}
            style={{
              background: C.pine,
              color: "#fff",
              opacity: busy ? 0.6 : 1,
            }}
            className="py-3 rounded-lg text-[14px] font-bold flex items-center justify-center gap-2"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Mail size={16} />
            )}{" "}
            Subscribe
          </button>
        </div>
      </section>
    </main>
  );
}
