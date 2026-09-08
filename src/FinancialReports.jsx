import React, { useEffect, useMemo, useState } from "react";
import { Download, Loader2, ReceiptText } from "lucide-react";
import { api } from "./api";
import { C, FD } from "./theme";

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const statusLabel = (status) =>
  ({
    pending: "Pending",
    awaiting_payment: "Unpaid",
    held: "Unpaid · held",
    paid: "Paid",
    waived: "Waived",
    rejected: "Rejected",
    released: "Released",
  })[status] || status.replaceAll("_", " ");
const statusTone = (status) =>
  status === "paid" || status === "waived"
    ? { background: C.sageSoft, color: C.pine }
    : status === "rejected"
      ? { background: C.dangerSoft, color: C.danger }
      : status === "held"
        ? { background: C.berrySoft, color: C.berry }
        : { background: C.honeySoft, color: C.honeyDeep };
const isoDate = (date) => date.toISOString().slice(0, 10);
const today = () => isoDate(new Date());
const dateRange = (period, anchor) => {
  const d = new Date(`${anchor}T12:00:00`);
  const year = d.getFullYear();
  if (period === "week") {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from_date: isoDate(start), to_date: isoDate(end) };
  }
  if (period === "month")
    return {
      from_date: `${anchor.slice(0, 7)}-01`,
      to_date: isoDate(new Date(year, d.getMonth() + 1, 0)),
    };
  if (period === "year")
    return { from_date: `${year}-01-01`, to_date: `${year}-12-31` };
  return { from_date: `${year}-01-01`, to_date: anchor };
};

function Bars({ title, rows }) {
  const highest = Math.max(
    ...rows.map((row) => Number(row.collected_cents || 0)),
    1,
  );
  return (
    <section
      style={{ background: C.card, border: `1px solid ${C.line}` }}
      className="rounded-2xl p-4"
    >
      <p style={{ fontFamily: FD }} className="text-[18px] font-semibold">
        {title}
      </p>
      <div className="flex flex-col gap-3 mt-4">
        {rows.length === 0 && (
          <p style={{ color: C.faint }} className="text-[12px]">
            No paid transactions in this view yet.
          </p>
        )}
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between gap-3 text-[12px] mb-1">
              <span className="font-semibold capitalize truncate">
                {row.label}
              </span>
              <span style={{ color: C.pine }} className="font-bold">
                {money(row.collected_cents)}
              </span>
            </div>
            <div
              style={{ background: C.paper2 }}
              className="h-2 rounded-full overflow-hidden"
            >
              <div
                style={{
                  width: `${Math.max(3, (Number(row.collected_cents || 0) / highest) * 100)}%`,
                  background: C.pine,
                }}
                className="h-full rounded-full"
              />
            </div>
            <p style={{ color: C.sub }} className="text-[10.5px] mt-1">
              {row.transactions} payment{row.transactions === 1 ? "" : "s"} ·{" "}
              {money(row.processing_fees_cents)} fees ·{" "}
              {money(row.net_payout_cents)} net
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FinancialReports({ notify }) {
  const [markets, setMarkets] = useState([]);
  const [marketId, setMarketId] = useState("");
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState("ytd");
  const [anchor, setAnchor] = useState(today());
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const range = useMemo(
    () =>
      period === "custom"
        ? { from_date: customFrom, to_date: customTo }
        : dateRange(period, anchor),
    [period, anchor, customFrom, customTo],
  );
  const load = async (id = marketId, nextRange = range) => {
    try {
      setReport(null);
      const [marketResult, reportResult] = await Promise.all([
        api.getMarkets(),
        api.getFinancialReport({ market_id: id || undefined, ...nextRange }),
      ]);
      setMarkets(marketResult.markets.filter((market) => !market.archived));
      setReport(reportResult);
    } catch (error) {
      notify(error.message, "err");
    }
  };
  useEffect(() => {
    load("");
  }, []);
  useEffect(() => {
    if (markets.length || marketId) load(marketId);
  }, [marketId, range.from_date, range.to_date]);
  const exportCsv = () => {
    if (!report) return;
    const header = [
      "Vendor",
      "Market",
      "Event date",
      "Base",
      "Discount",
      "Collected",
      "Processing fee",
      "Net payout",
      "Payment method",
      "Status",
    ];
    const records = report.transactions.map((item) => [
      item.business_name,
      item.market_name,
      item.event_date,
      (item.base_cents / 100).toFixed(2),
      (item.discount_cents / 100).toFixed(2),
      (item.amount_due_cents / 100).toFixed(2),
      (item.processing_fee_cents / 100).toFixed(2),
      (item.net_payout_cents / 100).toFixed(2),
      item.payment_method || "",
      item.status,
    ]);
    const blob = new Blob(
      [
        [header, ...records]
          .map((row) => row.map(csvValue).join(","))
          .join("\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `markethub-financial-report${marketId ? `-${marketId}` : ""}-${range.from_date || "all"}-to-${range.to_date || "all"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Financial CSV exported");
  };
  const totals = report?.totals;
  const statusCounts =
    report?.transactions.reduce(
      (counts, item) => ({
        ...counts,
        [item.status]: (counts[item.status] || 0) + 1,
      }),
      {},
    ) || {};
  const periodLabel = `${range.from_date || "All time"}${range.to_date ? ` – ${range.to_date}` : ""}`;
  return (
    <div className="flex flex-col gap-4">
      <section
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        className="rounded-2xl p-4 flex flex-wrap gap-2 items-center"
      >
        <div className="flex-1">
          <p
            style={{ color: C.faint }}
            className="text-[10.5px] font-bold uppercase tracking-wide"
          >
            Financial reporting
          </p>
          <p style={{ color: C.sub }} className="text-[12px]">
            Payment performance, processing costs, and every vendor transaction.
          </p>
        </div>
        <select
          value={marketId}
          onChange={(event) => setMarketId(event.target.value)}
          style={inp}
          className="px-3 py-2 rounded-lg text-[12px] font-semibold outline-none"
        >
          <option value="">All markets</option>
          {markets.map((market) => (
            <option key={market.id} value={market.id}>
              {market.name}
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          style={inp}
          className="px-3 py-2 rounded-lg text-[12px] font-semibold outline-none"
        >
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
          <option value="ytd">YTD</option>
          <option value="custom">Custom range</option>
        </select>
        {period === "custom" ? (
          <>
            <input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              style={inp}
              className="px-3 py-2 rounded-lg text-[12px] outline-none"
            />
            <input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              style={inp}
              className="px-3 py-2 rounded-lg text-[12px] outline-none"
            />
          </>
        ) : (
          <input
            type="date"
            value={anchor}
            onChange={(event) => setAnchor(event.target.value || today())}
            title="Choose a date within the reporting period"
            style={inp}
            className="px-3 py-2 rounded-lg text-[12px] outline-none"
          />
        )}
        <button
          onClick={exportCsv}
          disabled={!report}
          style={{
            background: C.pine,
            color: "#fff",
            opacity: report ? 1 : 0.55,
          }}
          className="px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
        >
          <Download size={14} /> Export CSV
        </button>
      </section>
      {!report ? (
        <div style={{ color: C.sub }} className="py-8 text-[13px]">
          <Loader2 size={15} className="inline animate-spin mr-2" />
          Loading financials…
        </div>
      ) : (
        <>
          <p style={{ color: C.sub }} className="-mt-2 text-[11.5px]">
            Reporting period:{" "}
            <span className="font-semibold">{periodLabel}</span>
          </p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {[
              ["Collected", totals.collected_cents, C.pine],
              ["Outstanding", totals.outstanding_cents, C.honeyDeep],
              ["Discounts given", totals.discounts_cents, C.berry],
              ["Processing fees", totals.processing_fees_cents, C.danger],
              ["Net payout", totals.net_payout_cents, C.ink],
            ].map(([label, value, tone]) => (
              <div
                key={label}
                style={{ background: C.card, border: `1px solid ${C.line}` }}
                className="rounded-2xl p-4"
              >
                <p
                  style={{ color: tone, fontFamily: FD }}
                  className="text-[23px] font-semibold"
                >
                  {money(value)}
                </p>
                <p style={{ color: C.sub }} className="text-[12px] mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Bars title="Collected by market" rows={report.by_market} />
            <Bars
              title="Collected by payment method"
              rows={report.by_payment_method}
            />
          </div>
          <section
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            className="rounded-2xl p-4"
          >
            <p style={{ fontFamily: FD }} className="text-[17px] font-semibold">
              Transactions by status
            </p>
            <p style={{ color: C.sub }} className="text-[11.5px] mt-1">
              Pending, unpaid, waived, and rejected records remain in the report
              and CSV.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <span
                  key={status}
                  style={statusTone(status)}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-bold"
                >
                  {statusLabel(status)} · {count}
                </span>
              ))}
              {Object.keys(statusCounts).length === 0 && (
                <span style={{ color: C.faint }} className="text-[12px]">
                  No transactions in this period.
                </span>
              )}
            </div>
          </section>
          <section
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            className="rounded-2xl overflow-hidden"
          >
            <div className="p-4 flex items-center gap-2">
              <ReceiptText size={18} color={C.pine} />
              <div>
                <p
                  style={{ fontFamily: FD }}
                  className="text-[18px] font-semibold"
                >
                  Transactions
                </p>
                <p style={{ color: C.sub }} className="text-[11.5px]">
                  {report.transactions.length} vendor payment record
                  {report.transactions.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left">
                <thead
                  style={{ background: C.paper2, color: C.sub }}
                  className="text-[10.5px] uppercase tracking-wide"
                >
                  <tr>
                    {[
                      "Vendor",
                      "Market",
                      "Base",
                      "Discount",
                      "Fee",
                      "Method / status",
                      "Net payout",
                    ].map((label) => (
                      <th key={label} className="px-4 py-3 font-bold">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderTop: `1px solid ${C.line}` }}
                      className="text-[12px]"
                    >
                      <td className="px-4 py-3 font-semibold">
                        {item.business_name}
                      </td>
                      <td className="px-4 py-3">
                        <p>{item.market_name}</p>
                        <p style={{ color: C.faint }} className="text-[10.5px]">
                          {item.event_date}
                        </p>
                      </td>
                      <td className="px-4 py-3">{money(item.base_cents)}</td>
                      <td className="px-4 py-3" style={{ color: C.berry }}>
                        {item.discount_cents
                          ? `−${money(item.discount_cents)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.danger }}>
                        {item.status === "paid"
                          ? money(item.processing_fee_cents)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="capitalize">
                          {item.payment_method || "Not recorded"}
                        </p>
                        <span
                          style={statusTone(item.status)}
                          className="capitalize px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        >
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 font-bold"
                        style={{ color: C.pine }}
                      >
                        {item.status === "paid"
                          ? money(item.net_payout_cents)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {report.transactions.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ color: C.faint }}
                        className="px-4 py-8 text-center"
                      >
                        No transactions match this market and date filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
