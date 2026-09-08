import React, { useEffect, useState } from "react";
import { Loader2, MapPinned, Store } from "lucide-react";
import { api } from "./api";
import { C, FD, FB } from "./theme";

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
const label = (status) =>
  ({
    pending: "Pending",
    awaiting_payment: "Payment due",
    held: "Payment due · held",
    paid: "Paid",
    waived: "Waived",
    rejected: "Rejected",
  })[status] || status;

export default function EventBoardPage({ boardKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = () =>
    api
      .getPublicEventBoard(boardKey)
      .then(setData)
      .catch((err) => setError(err.message));
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 20_000);
    return () => window.clearInterval(timer);
  }, [boardKey]);
  if (!data && !error)
    return (
      <div
        style={{ background: C.paper, minHeight: "100vh", color: C.sub }}
        className="flex items-center justify-center gap-2"
      >
        <Loader2 size={18} className="animate-spin" /> Loading live event board…
      </div>
    );
  if (!data)
    return (
      <div
        style={{
          background: C.paper,
          minHeight: "100vh",
          color: C.danger,
          fontFamily: FB,
        }}
        className="flex items-center justify-center p-5"
      >
        {error}
      </div>
    );
  const open = data.assignments.filter((item) => item.needs_payment).length;
  return (
    <main
      style={{
        background: C.paper,
        minHeight: "100vh",
        color: C.ink,
        fontFamily: FB,
      }}
      className="p-4 sm:p-7"
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div className="flex gap-3 items-start">
          <div
            style={{ background: C.pine }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
          >
            <Store size={20} color={C.honey} />
          </div>
          <div className="flex-1">
            <p
              style={{ color: C.faint }}
              className="text-[10px] font-bold uppercase tracking-wide"
            >
              Live team event board
            </p>
            <h1
              style={{ fontFamily: FD }}
              className="text-[26px] font-semibold"
            >
              {data.market.name}
            </h1>
            <p style={{ color: C.sub }} className="text-[13px]">
              {data.event_date}
              {data.market.location ? ` · ${data.market.location}` : ""} ·
              refreshes automatically
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <div
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            className="rounded-xl p-3"
          >
            <p style={{ fontFamily: FD }} className="text-[22px]">
              {data.assignments.length}
            </p>
            <p style={{ color: C.sub }} className="text-[11px]">
              Vendor assignments
            </p>
          </div>
          <div
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            className="rounded-xl p-3"
          >
            <p
              style={{ fontFamily: FD, color: C.honeyDeep }}
              className="text-[22px]"
            >
              {open}
            </p>
            <p style={{ color: C.sub }} className="text-[11px]">
              Need payment follow-up
            </p>
          </div>
          <div
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            className="rounded-xl p-3"
          >
            <p style={{ fontFamily: FD }} className="text-[22px]">
              {data.assignments.filter((item) => item.spots.length).length}
            </p>
            <p style={{ color: C.sub }} className="text-[11px]">
              With booth/food-truck spot
            </p>
          </div>
        </div>
        <section
          style={{ background: C.card, border: `1px solid ${C.line}` }}
          className="rounded-2xl overflow-hidden mt-4"
        >
          <div className="p-4 flex gap-2 items-center">
            <MapPinned size={18} color={C.pine} />
            <div>
              <p
                style={{ fontFamily: FD }}
                className="text-[18px] font-semibold"
              >
                Booth assignments & collections
              </p>
              <p style={{ color: C.sub }} className="text-[11.5px]">
                Share this live board with your on-site management team.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-[12px]">
              <thead
                style={{ background: C.paper2, color: C.sub }}
                className="text-[10px] uppercase"
              >
                <tr>
                  {["Vendor", "Setup", "Spot", "Payment"].map((item) => (
                    <th key={item} className="px-4 py-3">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.assignments.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderTop: `1px solid ${C.line}` }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold">{item.business_name}</p>
                      <p style={{ color: C.sub }}>{item.contact_name || "—"}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{item.booth_type}</td>
                    <td className="px-4 py-3">
                      {item.spots.length ? (
                        item.spots
                          .map((spot) => `${spot.code} (${spot.kind})`)
                          .join(", ")
                      ) : (
                        <span style={{ color: C.honeyDeep }}>Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">
                        {item.status === "waived"
                          ? "Waived"
                          : money(item.amount_due_cents)}
                      </p>
                      <span
                        style={{
                          color: item.needs_payment
                            ? C.honeyDeep
                            : item.status === "paid"
                              ? C.pine
                              : C.sub,
                        }}
                        className="font-semibold"
                      >
                        {label(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.assignments.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ color: C.faint }}
                      className="px-4 py-8 text-center"
                    >
                      No vendor assignments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
