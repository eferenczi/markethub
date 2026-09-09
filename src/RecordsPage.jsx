import React, { useEffect, useState } from "react";
import {
  Building2,
  Store,
  Plus,
  Trash2,
  Loader2,
  Check,
  X,
  ArrowLeft,
  Pencil,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Users,
  ClipboardList,
  MapPinned,
  Send,
  ReceiptText,
  Layers3,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import { api } from "./api";
import { C, FD, FB } from "./theme";
import ApplicationsTab from "./ApplicationsTab.jsx";
import EventHub from "./EventHub.jsx";
import CampaignsTab from "./CampaignsTab.jsx";
import FinancialReports from "./FinancialReports.jsx";
import TemplatesPage from "./TemplatesPage.jsx";
import VendorProfileCard from "./VendorProfileCard.jsx";

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
const emptyVendorDetails = {
  event_overview: "",
  schedule: "",
  arrival_instructions: "",
  parking_loadin: "",
  rules: "",
  contact: "",
};
const splitTags = (value) => [
  ...new Set(
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  ),
];

function MarketDetailsCard({ market, canWrite, onClose, onSave, notify }) {
  const [description, setDescription] = useState(market.description || "");
  const [mapUrl, setMapUrl] = useState(market.map_url || "");
  const [venueContact, setVenueContact] = useState({
    name: market.venue_contact_name || "",
    phone: market.venue_contact_phone || "",
    email: market.venue_contact_email || "",
  });
  const [seasonalRates, setSeasonalRates] = useState(
    market.seasonal_rates || [],
  );
  const [details, setDetails] = useState({
    ...emptyVendorDetails,
    ...(market.vendor_details || {}),
  });
  const [busy, setBusy] = useState(false);
  const setDetail = (key, value) =>
    setDetails((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setBusy(true);
    try {
      await api.updateMarket(market.id, {
        description,
        vendor_details: details,
        map_url: mapUrl,
        venue_contact_name: venueContact.name,
        venue_contact_phone: venueContact.phone,
        venue_contact_email: venueContact.email,
        seasonal_rates: seasonalRates.map((rate) => ({
          ...rate,
          booth_fee: Number(rate.booth_fee || 0),
          truck_fee: Number(rate.truck_fee || 0),
        })),
      });
      await onSave();
      notify("Vendor-facing market details saved");
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setBusy(false);
    }
  };
  const fields = [
    [
      "event_overview",
      "Event overview",
      "What makes this market special? Include the audience, atmosphere, and what vendors should expect.",
    ],
    [
      "schedule",
      "Schedule & event hours",
      "Example: Market 10 AM–4 PM. Vendor check-in 8:15–9:15 AM.",
    ],
    [
      "arrival_instructions",
      "Arrival & check-in",
      "Where vendors enter, who to check in with, and booth setup timing.",
    ],
    [
      "parking_loadin",
      "Parking & load-in",
      "Parking location, unloading route, vehicle rules, and move-out guidance.",
    ],
    [
      "rules",
      "Vendor rules & requirements",
      "Power, tent weights, permits, insurance, trash, and other important instructions.",
    ],
    [
      "contact",
      "Day-of contact",
      "Name, phone number, radio channel, or other help information.",
    ],
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/35 p-3 sm:p-7 overflow-y-auto">
      <section
        style={{
          background: C.card,
          color: C.ink,
          maxWidth: 800,
          margin: "0 auto",
        }}
        className="rounded-2xl shadow-2xl p-5 sm:p-6"
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <p
              style={{ color: C.faint }}
              className="text-[10px] font-bold uppercase tracking-wide"
            >
              Market information
            </p>
            <h2
              style={{ fontFamily: FD }}
              className="text-[25px] font-semibold mt-1"
            >
              {market.name}
            </h2>
            <p style={{ color: C.sub }} className="text-[12.5px] mt-1">
              This is the information vendors can read when choosing or applying
              to this market.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: C.sub }}
            className="p-1 self-start"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <div>
            <label style={{ color: C.sub }} className="text-[11px] font-bold">
              SHORT MARKET DESCRIPTION
            </label>
            <textarea
              value={description}
              readOnly={!canWrite}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="A short public description for the market."
              style={inp}
              className="mt-1 w-full px-3 py-2.5 rounded-lg text-[13px] outline-none resize-y"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            <input
              value={venueContact.name}
              readOnly={!canWrite}
              onChange={(event) =>
                setVenueContact((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Venue contact name"
              style={inp}
              className="px-3 py-2.5 rounded-lg text-[13px] outline-none"
            />
            <input
              value={venueContact.phone}
              readOnly={!canWrite}
              onChange={(event) =>
                setVenueContact((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder="Venue contact phone"
              style={inp}
              className="px-3 py-2.5 rounded-lg text-[13px] outline-none"
            />
            <input
              value={venueContact.email}
              readOnly={!canWrite}
              onChange={(event) =>
                setVenueContact((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="Venue contact email"
              type="email"
              style={inp}
              className="px-3 py-2.5 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div>
            <label
              style={{ color: C.sub }}
              className="text-[11px] font-bold uppercase"
            >
              Clickable venue map link
            </label>
            <div className="flex gap-2 mt-1">
              <input
                value={mapUrl}
                readOnly={!canWrite}
                onChange={(event) => setMapUrl(event.target.value)}
                placeholder="https://maps.google.com/..."
                type="url"
                style={inp}
                className="flex-1 px-3 py-2.5 rounded-lg text-[13px] outline-none"
              />
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: C.paper2, color: C.pine }}
                  className="px-3 py-2.5 rounded-lg text-[12px] font-bold flex items-center gap-1"
                >
                  <ExternalLink size={14} /> Open
                </a>
              )}
            </div>
          </div>
          <section
            style={{ background: C.paper2, border: `1px solid ${C.line}` }}
            className="rounded-xl p-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-[12px] font-bold">Seasonal rates</p>
                <p style={{ color: C.sub }} className="text-[11px]">
                  These override the normal booth and truck prices for matching
                  event dates.
                </p>
              </div>
              {canWrite && (
                <button
                  onClick={() =>
                    setSeasonalRates((rates) => [
                      ...rates,
                      {
                        label: "",
                        start_date: "",
                        end_date: "",
                        booth_fee: "",
                        truck_fee: "",
                      },
                    ])
                  }
                  style={{ color: C.pine }}
                  className="text-[11px] font-bold"
                >
                  + Add rate
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {seasonalRates.map((rate, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr_.8fr_.8fr_auto] gap-1.5"
                >
                  {[
                    ["label", "Label", "text"],
                    ["start_date", "Starts", "date"],
                    ["end_date", "Ends", "date"],
                    ["booth_fee", "Booth $", "number"],
                    ["truck_fee", "Truck $", "number"],
                  ].map(([key, placeholder, type]) => (
                    <input
                      key={key}
                      value={rate[key]}
                      readOnly={!canWrite}
                      onChange={(event) =>
                        setSeasonalRates((rates) =>
                          rates.map((item, position) =>
                            position === index
                              ? { ...item, [key]: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder={placeholder}
                      type={type}
                      style={inp}
                      className="px-2 py-1.5 rounded text-[11px] outline-none"
                    />
                  ))}
                  {canWrite && (
                    <button
                      onClick={() =>
                        setSeasonalRates((rates) =>
                          rates.filter((_, position) => position !== index),
                        )
                      }
                      style={{ color: C.danger }}
                      className="p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {!seasonalRates.length && (
                <p style={{ color: C.faint }} className="text-[11px]">
                  No seasonal overrides — standard market prices will apply.
                </p>
              )}
            </div>
          </section>
          {fields.map(([key, label, hint]) => (
            <div key={key}>
              <label
                style={{ color: C.sub }}
                className="text-[11px] font-bold uppercase"
              >
                {label}
              </label>
              <textarea
                value={details[key]}
                readOnly={!canWrite}
                onChange={(event) => setDetail(key, event.target.value)}
                rows={key === "rules" ? 4 : 3}
                placeholder={hint}
                style={inp}
                className="mt-1 w-full px-3 py-2.5 rounded-lg text-[13px] outline-none resize-y"
              />
            </div>
          ))}
        </div>
        {canWrite && (
          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              style={{ background: C.paper2, color: C.sub }}
              className="px-3 py-2 rounded-lg text-[12px] font-bold"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              style={{
                background: C.pine,
                color: "#fff",
                opacity: busy ? 0.6 : 1,
              }}
              className="px-3 py-2 rounded-lg text-[12px] font-bold"
            >
              {busy ? "Saving…" : "Save market information"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed left-0 right-0 bottom-6 flex justify-center pointer-events-none">
      <div
        style={{
          background: toast.kind === "err" ? C.danger : C.ink,
          color: "#fff",
        }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium shadow-xl"
      >
        {toast.kind === "err" ? (
          <X size={14} />
        ) : (
          <Check size={14} color={C.sage} />
        )}{" "}
        {toast.msg}
      </div>
    </div>
  );
}

/* ---------------- Markets ---------------- */
function MarketsTab({ canWrite, notify }) {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({
    name: "",
    short_name: "",
    location: "",
    booth_fee: "",
    truck_fee: "",
    app_fee: "",
    venue_contact_name: "",
    venue_contact_phone: "",
    venue_contact_email: "",
    map_url: "",
    payment_methods: [
      "stripe",
      "applepay",
      "googlepay",
      "paypal",
      "venmo",
      "zelle",
      "cash",
    ],
  });
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = () =>
    api
      .getMarkets()
      .then((r) => setRows(r.markets))
      .catch((e) => notify(e.message, "err"));
  useEffect(() => {
    load();
  }, []);

  const num = (v) => (v === "" || v == null ? 0 : Number(v));
  const add = async () => {
    if (!form.name.trim()) return notify("Market name is required", "err");
    setBusy(true);
    try {
      await api.createMarket({
        name: form.name.trim(),
        short_name: form.short_name.trim(),
        location: form.location.trim(),
        booth_fee: num(form.booth_fee),
        truck_fee: num(form.truck_fee),
        app_fee: num(form.app_fee),
        venue_contact_name: form.venue_contact_name.trim(),
        venue_contact_phone: form.venue_contact_phone.trim(),
        venue_contact_email: form.venue_contact_email.trim(),
        map_url: form.map_url.trim(),
        payment_methods: form.payment_methods,
      });
      setForm({
        name: "",
        short_name: "",
        location: "",
        booth_fee: "",
        truck_fee: "",
        app_fee: "",
        venue_contact_name: "",
        venue_contact_phone: "",
        venue_contact_email: "",
        map_url: "",
        payment_methods: [
          "stripe",
          "applepay",
          "googlepay",
          "paypal",
          "venmo",
          "zelle",
          "cash",
        ],
      });
      notify("Market saved");
      load();
    } catch (e) {
      notify(e.message, "err");
    } finally {
      setBusy(false);
    }
  };
  const saveEdit = async (m) => {
    try {
      await api.updateMarket(m.id, {
        name: m.name,
        short_name: m.short_name,
        location: m.location,
        booth_fee: num(m.booth_fee),
        truck_fee: num(m.truck_fee),
        app_fee: num(m.app_fee),
        payment_methods: m.payment_methods || [],
      });
      setEditing(null);
      notify("Updated");
      load();
    } catch (e) {
      notify(e.message, "err");
    }
  };
  const del = async (m) => {
    try {
      await api.deleteMarket(m.id);
      notify("Deleted");
      load();
    } catch (e) {
      notify(e.message, "err");
    }
  };
  const reorder = async (targetId) => {
    if (!draggedId || draggedId === targetId) return setDraggedId(null);
    const from = rows.findIndex((market) => market.id === draggedId);
    const to = rows.findIndex((market) => market.id === targetId);
    if (from < 0 || to < 0) return setDraggedId(null);
    const next = [...rows];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setRows(next);
    setDraggedId(null);
    try {
      await api.reorderMarkets(next.map((market) => market.id));
      notify("Market order saved");
    } catch (error) {
      notify(error.message, "err");
      load();
    }
  };

  if (!rows) return <Loading />;
  return (
    <div>
      {canWrite && (
        <div
          style={{ background: C.card, border: `1px solid ${C.line}` }}
          className="rounded-2xl p-4 mb-4"
        >
          <p
            style={{ color: C.faint }}
            className="text-[10.5px] font-bold uppercase tracking-wide mb-2"
          >
            Add a market
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Name *"
              style={inp}
              className="col-span-2 sm:col-span-1 px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.short_name}
              onChange={(e) => set("short_name", e.target.value)}
              placeholder="Short name"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Location"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.booth_fee}
              onChange={(e) => set("booth_fee", e.target.value)}
              placeholder="Booth $"
              type="number"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.truck_fee}
              onChange={(e) => set("truck_fee", e.target.value)}
              placeholder="Truck $"
              type="number"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.app_fee}
              onChange={(e) => set("app_fee", e.target.value)}
              placeholder="App $"
              type="number"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-2 mt-2">
            <input
              value={form.venue_contact_name}
              onChange={(e) => set("venue_contact_name", e.target.value)}
              placeholder="Venue contact name"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.venue_contact_phone}
              onChange={(e) => set("venue_contact_phone", e.target.value)}
              placeholder="Venue contact phone"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.venue_contact_email}
              onChange={(e) => set("venue_contact_email", e.target.value)}
              placeholder="Venue contact email"
              type="email"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.map_url}
              onChange={(e) => set("map_url", e.target.value)}
              placeholder="Venue map link (https://...)"
              type="url"
              style={inp}
              className="sm:col-span-3 px-3 py-2 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              "stripe",
              "applepay",
              "googlepay",
              "paypal",
              "venmo",
              "zelle",
              "cash",
            ].map((method) => (
              <label
                key={method}
                style={{ background: C.paper2, color: C.sub }}
                className="px-2.5 py-1.5 rounded-full text-[11.5px] font-semibold flex items-center gap-1.5"
              >
                <input
                  type="checkbox"
                  checked={form.payment_methods.includes(method)}
                  disabled={method === "cash"}
                  onChange={(event) =>
                    set(
                      "payment_methods",
                      event.target.checked
                        ? [...form.payment_methods, method]
                        : method === "cash"
                          ? form.payment_methods
                          : form.payment_methods.filter(
                              (item) => item !== method,
                            ),
                    )
                  }
                />{" "}
                {method}
              </label>
            ))}
          </div>
          <button
            onClick={add}
            disabled={busy}
            style={{
              background: C.pine,
              color: "#fff",
              opacity: busy ? 0.6 : 1,
            }}
            className="mt-3 px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}{" "}
            Add market
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {rows.length === 0 && <Empty label="No markets yet." />}
        {rows.map((m) => (
          <div
            key={m.id}
            draggable={canWrite && editing !== m.id}
            onDragStart={() => setDraggedId(m.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => reorder(m.id)}
            onClick={() => editing !== m.id && setDetailId(m.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") setDetailId(m.id);
            }}
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              cursor: editing === m.id ? "default" : "pointer",
            }}
            className="rounded-xl p-3 flex items-center gap-3 hover:brightness-[.98]"
          >
            {canWrite && (
              <GripVertical
                size={17}
                style={{ color: C.faint }}
                className="cursor-grab flex-shrink-0"
                title="Drag to reorder markets"
              />
            )}
            <div
              style={{ background: C.pine }}
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <Building2 size={16} color={C.honey} />
            </div>
            {editing === m.id ? (
              <div
                onClick={(event) => event.stopPropagation()}
                className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-1.5"
              >
                <input
                  defaultValue={m.name}
                  onChange={(e) => (m.name = e.target.value)}
                  style={inp}
                  className="px-2 py-1.5 rounded text-[13px] outline-none"
                />
                <input
                  defaultValue={m.location || ""}
                  onChange={(e) => (m.location = e.target.value)}
                  placeholder="Location"
                  style={inp}
                  className="px-2 py-1.5 rounded text-[13px] outline-none"
                />
                <input
                  defaultValue={m.booth_fee}
                  onChange={(e) => (m.booth_fee = e.target.value)}
                  placeholder="Booth $"
                  type="number"
                  style={inp}
                  className="px-2 py-1.5 rounded text-[13px] outline-none"
                />
                <input
                  defaultValue={m.truck_fee}
                  onChange={(e) => (m.truck_fee = e.target.value)}
                  placeholder="Truck $"
                  type="number"
                  style={inp}
                  className="px-2 py-1.5 rounded text-[13px] outline-none"
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold truncate">{m.name}</p>
                <p style={{ color: C.sub }} className="text-[11.5px] truncate">
                  {m.location || "—"} · booth ${m.booth_fee} · truck $
                  {m.truck_fee}
                </p>
                <p
                  style={{ color: C.faint }}
                  className="text-[10.5px] truncate"
                >
                  {(m.payment_methods || []).join(" · ") ||
                    "No payment methods selected"}{" "}
                  · Click for vendor event details
                </p>
              </div>
            )}
            {canWrite &&
              (editing === m.id ? (
                <>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      saveEdit(m);
                    }}
                    style={{ color: C.pine }}
                    className="p-1.5"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditing(null);
                    }}
                    style={{ color: C.sub }}
                    className="p-1.5"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditing(m.id);
                    }}
                    style={{ color: C.sub }}
                    className="p-1.5"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      del(m);
                    }}
                    style={{ color: C.danger }}
                    className="p-1.5"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ))}
          </div>
        ))}
      </div>
      {detailId && rows.find((market) => market.id === detailId) && (
        <MarketDetailsCard
          market={rows.find((market) => market.id === detailId)}
          canWrite={canWrite}
          onClose={() => setDetailId(null)}
          onSave={async () => {
            setDetailId(null);
            load();
          }}
          notify={notify}
        />
      )}
    </div>
  );
}

/* ---------------- Vendors ---------------- */
function VendorsTab({ canWrite, notify }) {
  const [rows, setRows] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    email: "",
    category: "",
    booth_type: "tent",
    tags: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = () =>
    api
      .getVendors()
      .then((r) => setRows(r.vendors))
      .catch((e) => notify(e.message, "err"));
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!form.business_name.trim())
      return notify("Business name is required", "err");
    setBusy(true);
    try {
      await api.createVendor({
        ...form,
        business_name: form.business_name.trim(),
        tags: splitTags(form.tags),
      });
      setForm({
        business_name: "",
        contact_name: "",
        phone: "",
        email: "",
        category: "",
        booth_type: "tent",
        tags: "",
      });
      notify("Vendor saved");
      load();
    } catch (e) {
      notify(e.message, "err");
    } finally {
      setBusy(false);
    }
  };
  const del = async (v) => {
    try {
      await api.deleteVendor(v.id);
      notify("Deleted");
      load();
    } catch (e) {
      notify(e.message, "err");
    }
  };
  const setStage = async (v, stage) => {
    try {
      await api.updateVendor(v.id, { stage });
      load();
    } catch (e) {
      notify(e.message, "err");
    }
  };

  if (!rows) return <Loading />;
  const STAGES = ["Lead", "Applied", "Approved", "Active", "Lapsed"];
  const query = search.trim().toLowerCase();
  const filteredRows = rows.filter((vendor) =>
    [
      vendor.business_name,
      vendor.contact_name,
      vendor.category,
      vendor.phone,
      vendor.email,
      ...(vendor.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
  return (
    <div>
      {canWrite && (
        <div
          style={{ background: C.card, border: `1px solid ${C.line}` }}
          className="rounded-2xl p-4 mb-4"
        >
          <p
            style={{ color: C.faint }}
            className="text-[10.5px] font-bold uppercase tracking-wide mb-2"
          >
            Add a vendor
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              placeholder="Business name *"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.contact_name}
              onChange={(e) => set("contact_name", e.target.value)}
              placeholder="Contact name"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="Phone"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="Email"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Category"
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] outline-none"
            />
            <select
              value={form.booth_type}
              onChange={(e) => set("booth_type", e.target.value)}
              style={inp}
              className="px-3 py-2 rounded-lg text-[13px] font-semibold outline-none"
            >
              <option value="tent">Tent</option>
              <option value="truck">Truck</option>
            </select>
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="Tags (comma separated)"
              style={inp}
              className="col-span-2 px-3 py-2 rounded-lg text-[13px] outline-none"
            />
          </div>
          <button
            onClick={add}
            disabled={busy}
            style={{
              background: C.pine,
              color: "#fff",
              opacity: busy ? 0.6 : 1,
            }}
            className="mt-3 px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}{" "}
            Add vendor
          </button>
        </div>
      )}
      <div
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        className="rounded-xl p-3 mb-3 flex gap-2 items-center"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, business, category, tags, phone, or email…"
          style={inp}
          className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
        />
        <span
          style={{ color: C.sub }}
          className="text-[11.5px] font-semibold whitespace-nowrap"
        >
          {filteredRows.length} of {rows.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 && <Empty label="No vendors yet." />}
        {rows.length > 0 && filteredRows.length === 0 && (
          <Empty label="No vendors match that search." />
        )}
        {filteredRows.map((v) => (
          <div
            key={v.id}
            onClick={() => setProfileId(v.id)}
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              cursor: "pointer",
            }}
            className="rounded-xl p-3 flex items-center gap-3 hover:brightness-[.98]"
          >
            <div
              style={{ background: C.berry }}
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <Store size={16} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold truncate">
                {v.business_name}
              </p>
              <p style={{ color: C.sub }} className="text-[11.5px] truncate">
                {[v.contact_name, v.category, v.booth_type]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
              {(v.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {v.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{ background: C.sageSoft, color: C.pine }}
                      className="px-1.5 py-0.5 rounded text-[9.5px] font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {canWrite ? (
              <select
                value={v.stage}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setStage(v, e.target.value)}
                style={inp}
                className="px-2 py-1.5 rounded-lg text-[12px] font-semibold outline-none"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <span
                style={{ background: C.paper2, color: C.sub }}
                className="text-[11px] font-bold px-2 py-1 rounded-full"
              >
                {v.stage}
              </span>
            )}
            {canWrite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  del(v);
                }}
                style={{ color: C.danger }}
                className="p-1.5"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {profileId && (
        <VendorProfileCard
          vendorId={profileId}
          canWrite={canWrite}
          onClose={() => setProfileId(null)}
          notify={notify}
        />
      )}
    </div>
  );
}

/* ---------------- Live event operations ---------------- */
function OperationsTab({ canWrite, notify }) {
  const [markets, setMarkets] = useState(null);
  const [vendors, setVendors] = useState(null);
  const [marketId, setMarketId] = useState("");
  const [dates, setDates] = useState([]);
  const [dateId, setDateId] = useState("");
  const [approvals, setApprovals] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [busy, setBusy] = useState(false);

  const loadDates = async (id, preferredDateId) => {
    if (!id) {
      setDates([]);
      setDateId("");
      setApprovals([]);
      return;
    }
    try {
      const r = await api.getMarketDates(id);
      setDates(r.market_dates);
      const next =
        preferredDateId ||
        r.market_dates.find((d) => d.status !== "skipped")?.id ||
        "";
      setDateId(String(next));
    } catch (e) {
      notify(e.message, "err");
    }
  };
  const loadApprovals = async (id) => {
    if (!id) {
      setApprovals([]);
      return;
    }
    try {
      setApprovals((await api.getApprovals({ market_date_id: id })).approvals);
    } catch (e) {
      notify(e.message, "err");
    }
  };

  useEffect(() => {
    Promise.all([api.getMarkets(), api.getVendors()])
      .then(([m, v]) => {
        setMarkets(m.markets.filter((x) => !x.archived));
        setVendors(v.vendors);
        if (m.markets.find((x) => !x.archived))
          setMarketId(String(m.markets.find((x) => !x.archived).id));
      })
      .catch((e) => notify(e.message, "err"));
  }, []);
  useEffect(() => {
    loadDates(marketId);
  }, [marketId]);
  useEffect(() => {
    loadApprovals(dateId);
  }, [dateId]);

  const addDate = async () => {
    if (!newDate) return notify("Choose an event date", "err");
    setBusy(true);
    try {
      const r = await api.createMarketDate({
        market_id: Number(marketId),
        event_date: newDate,
      });
      setNewDate("");
      await loadDates(marketId, r.market_date.id);
      notify("Market date created");
    } catch (e) {
      notify(e.message, "err");
    } finally {
      setBusy(false);
    }
  };
  const addApproval = async () => {
    if (!vendorId) return notify("Choose a vendor", "err");
    setBusy(true);
    try {
      await api.createApproval({
        vendor_id: Number(vendorId),
        market_date_id: Number(dateId),
      });
      setVendorId("");
      await loadApprovals(dateId);
      notify("Vendor added as an application");
    } catch (e) {
      notify(e.message, "err");
    } finally {
      setBusy(false);
    }
  };
  const approve = async (approval) => {
    try {
      await api.approveApplication(approval.id);
      await loadApprovals(dateId);
      notify("Approved; 24-hour payment window started");
    } catch (e) {
      notify(e.message, "err");
    }
  };
  const paid = async (approval) => {
    try {
      await api.recordPayment(approval.id, "cash");
      await loadApprovals(dateId);
      notify("Payment recorded");
    } catch (e) {
      notify(e.message, "err");
    }
  };

  if (!markets || !vendors) return <Loading />;
  const selectedDate = dates.find((d) => String(d.id) === String(dateId));
  const dollars = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
  const status = (value) =>
    ({
      pending: "Application",
      awaiting_payment: "Awaiting payment",
      held: "Held",
      paid: "Paid",
      released: "Released",
    })[value] || value;

  return (
    <div className="flex flex-col gap-4">
      <div
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        className="rounded-2xl p-4"
      >
        <p
          style={{ color: C.faint }}
          className="text-[10.5px] font-bold uppercase tracking-wide mb-2"
        >
          Market event
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          <select
            value={marketId}
            onChange={(e) => setMarketId(e.target.value)}
            style={inp}
            className="px-3 py-2 rounded-lg text-[13px] font-semibold outline-none"
          >
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {canWrite && (
            <div className="flex gap-2">
              <input
                value={newDate}
                type="date"
                onChange={(e) => setNewDate(e.target.value)}
                style={inp}
                className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
              />
              <button
                onClick={addDate}
                disabled={busy}
                style={{ background: C.pine, color: "#fff" }}
                className="px-3 py-2 rounded-lg text-[13px] font-bold"
              >
                <Plus size={15} />
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {dates.map((d) => (
            <button
              key={d.id}
              onClick={() => setDateId(String(d.id))}
              style={{
                background: String(d.id) === String(dateId) ? C.pine : C.paper2,
                color: String(d.id) === String(dateId) ? "#fff" : C.sub,
              }}
              className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
            >
              {d.event_date}
              {d.status === "skipped" ? " · skipped" : ""}
            </button>
          ))}
          {dates.length === 0 && (
            <span style={{ color: C.faint }} className="text-[12.5px]">
              Add your first scheduled event date.
            </span>
          )}
        </div>
      </div>

      {selectedDate && (
        <>
          <div
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            className="rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={16} color={C.pine} />
              <div>
                <p className="text-[13.5px] font-semibold">
                  {selectedDate.event_date}
                </p>
                <p style={{ color: C.sub }} className="text-[11.5px]">
                  Add vendors, approve them, and record offline payments.
                </p>
              </div>
            </div>
            {canWrite && (
              <div className="flex gap-2">
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  style={inp}
                  className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
                >
                  <option value="">Choose vendor…</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.business_name}
                      {v.booth_type === "truck" ? " · truck" : ""}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addApproval}
                  disabled={busy}
                  style={{ background: C.honey, color: C.pineDeep }}
                  className="px-3 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1"
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {approvals.length === 0 && (
              <Empty label="No vendor applications for this event yet." />
            )}
            {approvals.map((a) => (
              <div
                key={a.id}
                style={{ background: C.card, border: `1px solid ${C.line}` }}
                className="rounded-xl p-3 flex items-center gap-3"
              >
                <div
                  style={{ background: C.berry }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                >
                  <Store size={16} color="#fff" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold truncate">
                    {a.business_name}
                  </p>
                  <p style={{ color: C.sub }} className="text-[11.5px]">
                    {a.booth_type} · due {dollars(a.amount_due_cents)} ·{" "}
                    {status(a.status)}
                  </p>
                </div>
                {canWrite && a.status === "pending" && (
                  <button
                    onClick={() => approve(a)}
                    style={{ background: C.pine, color: "#fff" }}
                    className="px-3 py-2 rounded-lg text-[12px] font-bold"
                  >
                    <Check size={14} />
                  </button>
                )}
                {canWrite &&
                  ["awaiting_payment", "held"].includes(a.status) && (
                    <button
                      onClick={() => paid(a)}
                      style={{ background: C.honey, color: C.pineDeep }}
                      className="px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
                    >
                      <CreditCard size={13} /> Cash paid
                    </button>
                  )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div
      style={{ color: C.sub }}
      className="flex items-center gap-2 text-[13px] py-8"
    >
      <Loader2 size={16} className="animate-spin" /> Loading…
    </div>
  );
}
function Empty({ label }) {
  return (
    <p style={{ color: C.faint }} className="text-[13px] py-6 text-center">
      {label}
    </p>
  );
}

function DashboardTab({ go, notify }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    Promise.all([api.getMarkets(), api.getVendors(), api.getApplications()])
      .then(([markets, vendors, applications]) =>
        setData({
          markets: markets.markets,
          vendors: vendors.vendors,
          applications: applications.applications,
        }),
      )
      .catch((error) => notify(error.message, "err"));
  }, []);
  if (!data) return <Loading />;
  const review = data.applications.filter(
    (application) => application.status === "under_review",
  ).length;
  const approved = data.applications.filter(
    (application) => application.status === "approved",
  ).length;
  const cards = [
    {
      label: "Active markets",
      value: data.markets.filter((market) => !market.archived).length,
      icon: Building2,
      tone: C.pine,
      tab: "markets",
    },
    {
      label: "Vendor contacts",
      value: data.vendors.length,
      icon: Users,
      tone: C.berry,
      tab: "vendors",
    },
    {
      label: "Needs review",
      value: review,
      icon: ClipboardList,
      tone: C.honeyDeep,
      tab: "applications",
    },
    {
      label: "Approved applications",
      value: approved,
      icon: Check,
      tone: C.pine,
      tab: "applications",
    },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div
        style={{
          background: `linear-gradient(135deg, ${C.pineDeep}, ${C.pine})`,
        }}
        className="rounded-2xl p-6 text-white overflow-hidden relative"
      >
        <div className="relative">
          <p className="text-white/70 text-[11px] font-bold uppercase tracking-wide">
            Organizer workspace
          </p>
          <h2
            style={{ fontFamily: FD }}
            className="text-[28px] font-semibold mt-1"
          >
            Everything important, in one place.
          </h2>
          <p className="text-white/75 text-[13.5px] mt-2 max-w-xl">
            Your vendors, markets, applications and event-day operations are
            saved securely to your organization’s live database.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={() => go("applications")}
              style={{ background: C.honey, color: C.pineDeep }}
              className="px-4 py-2 rounded-full text-[12.5px] font-bold"
            >
              Review vendor applications
            </button>
            <button
              onClick={() => go("markets")}
              className="px-4 py-2 rounded-full text-[12.5px] font-bold border border-white/30 text-white"
            >
              Manage markets
            </button>
          </div>
        </div>
        <MapPinned
          size={190}
          className="absolute -right-8 -bottom-14 text-white/10"
        />
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => go(card.tab)}
              style={{ background: C.card, border: `1px solid ${C.line}` }}
              className="rounded-2xl p-4 text-left hover:shadow-md transition-shadow"
            >
              <div
                style={{ background: C.paper2 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              >
                <Icon size={17} color={card.tone} />
              </div>
              <p
                style={{ fontFamily: FD, color: card.tone }}
                className="text-[25px] font-semibold leading-none"
              >
                {card.value}
              </p>
              <p style={{ color: C.sub }} className="text-[12.5px] mt-1">
                {card.label}
              </p>
            </button>
          );
        })}
      </div>
      <div
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        className="rounded-2xl p-5"
      >
        <p style={{ fontFamily: FD }} className="text-[19px] font-semibold">
          Pilot setup
        </p>
        <p style={{ color: C.sub }} className="text-[13px] mt-1">
          For your first market-manager test: add the markets, copy the
          application link, then invite a small group of vendors before
          importing the full list.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {[
            [
              "1",
              "Set up markets",
              "Add your five markets and booth fees.",
              "markets",
            ],
            [
              "2",
              "Share application",
              "Copy the vendor link and collect insurance/photos.",
              "applications",
            ],
            [
              "3",
              "Run event day",
              "Assign vendors and track payment status.",
              "operations",
            ],
          ].map(([number, title, detail, tab]) => (
            <button
              key={number}
              onClick={() => go(tab)}
              style={{ background: C.paper2 }}
              className="rounded-xl p-3 text-left"
            >
              <span
                style={{ background: C.pine, color: "#fff" }}
                className="inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-bold"
              >
                {number}
              </span>
              <p className="text-[13px] font-bold mt-2">{title}</p>
              <p style={{ color: C.sub }} className="text-[11.5px] mt-1">
                {detail}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RecordsPage({ user, onClose }) {
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const notify = (msg, kind) => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  };
  const canWrite = ["owner", "manager", "staff"].includes(user.role);

  return (
    <div
      style={{
        background: C.paper2,
        minHeight: "100vh",
        fontFamily: FB,
        color: C.ink,
      }}
      className="p-3 sm:p-5"
    >
      <div
        style={{
          maxWidth: 1260,
          margin: "0 auto",
          background: C.card,
          border: `1px solid ${C.line}`,
        }}
        className="rounded-2xl overflow-hidden shadow-xl shadow-black/5 flex min-h-[760px]"
      >
        <aside
          style={{ background: C.pineDeep, width: 230 }}
          className="hidden md:flex flex-col p-3 text-white"
        >
          <div className="flex items-center gap-2 px-2 py-3 mb-4">
            <div
              style={{ background: "rgba(255,255,255,.13)" }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
            >
              <Store size={18} color={C.honey} />
            </div>
            <div>
              <p
                style={{ fontFamily: FD }}
                className="text-[17px] font-semibold leading-none"
              >
                MarketHub
              </p>
              <p className="text-white/50 text-[10px] mt-1">
                Organizer console
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            {[
              ["dashboard", "Dashboard", LayoutDashboard],
              ["markets", "Markets", Building2],
              ["vendors", "Vendors", Users],
              ["applications", "Applications", ClipboardList],
              ["operations", "Event operations", CalendarDays],
              ["templates", "Templates", Layers3],
              ["financials", "Financial reports", ReceiptText],
              ["campaigns", "Campaigns", Send],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  background:
                    tab === key ? "rgba(255,255,255,.13)" : "transparent",
                  color: tab === key ? "#fff" : "rgba(255,255,255,.65)",
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-left"
              >
                <Icon size={17} /> {label}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-white/10">
            <p className="px-3 text-white/45 text-[10px]">
              Live data · private organization
            </p>
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <div
            style={{ borderBottom: `1px solid ${C.line}`, background: C.card }}
            className="px-5 sm:px-7 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p
                  style={{ color: C.faint }}
                  className="text-[10px] font-bold uppercase tracking-wide"
                >
                  Organizer console
                </p>
                <h1
                  style={{ fontFamily: FD }}
                  className="text-[23px] font-semibold"
                >
                  {
                    {
                      dashboard: "Dashboard",
                      markets: "Markets & pricing",
                      vendors: "Vendor CRM",
                      applications: "Vendor applications",
                      operations: "Event operations",
                      templates: "Templates",
                      financials: "Financial reports",
                      campaigns: "Campaigns & newsletter",
                    }[tab]
                  }
                </h1>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  style={{ color: C.sub }}
                  className="text-[12px] font-semibold flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
            </div>
            <div className="md:hidden flex gap-2 overflow-x-auto mt-3 pb-1">
              {[
                ["dashboard", "Dashboard"],
                ["markets", "Markets"],
                ["vendors", "Vendors"],
                ["applications", "Applications"],
                ["operations", "Events"],
                ["templates", "Templates"],
                ["financials", "Financials"],
                ["campaigns", "Campaigns"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    background: tab === key ? C.pine : C.paper2,
                    color: tab === key ? "#fff" : C.sub,
                  }}
                  className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 sm:p-7 max-w-6xl">
            {tab === "dashboard" ? (
              <DashboardTab go={setTab} notify={notify} />
            ) : tab === "markets" ? (
              <MarketsTab canWrite={canWrite} notify={notify} />
            ) : tab === "vendors" ? (
              <VendorsTab canWrite={canWrite} notify={notify} />
            ) : tab === "applications" ? (
              <ApplicationsTab
                user={user}
                canWrite={canWrite}
                notify={notify}
              />
            ) : tab === "campaigns" ? (
              <CampaignsTab canWrite={canWrite} notify={notify} />
            ) : tab === "templates" ? (
              <TemplatesPage canWrite={canWrite} notify={notify} />
            ) : tab === "financials" ? (
              <FinancialReports notify={notify} />
            ) : (
              <EventHub canWrite={canWrite} notify={notify} />
            )}
          </div>
        </main>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
