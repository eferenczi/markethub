import React, { useEffect, useState } from "react";
import {
  Building2, Store, Plus, Trash2, Loader2, Check, X, ArrowLeft, Pencil,
} from "lucide-react";
import { api } from "./api";
import { C, FD, FB } from "./theme";

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed left-0 right-0 bottom-6 flex justify-center pointer-events-none">
      <div style={{ background: toast.kind === "err" ? C.danger : C.ink, color: "#fff" }} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium shadow-xl">
        {toast.kind === "err" ? <X size={14} /> : <Check size={14} color={C.sage} />} {toast.msg}
      </div>
    </div>
  );
}

/* ---------------- Markets ---------------- */
function MarketsTab({ canWrite, notify }) {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ name: "", short_name: "", location: "", booth_fee: "", truck_fee: "", app_fee: "" });
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = () => api.getMarkets().then((r) => setRows(r.markets)).catch((e) => notify(e.message, "err"));
  useEffect(() => { load(); }, []);

  const num = (v) => (v === "" || v == null ? 0 : Number(v));
  const add = async () => {
    if (!form.name.trim()) return notify("Market name is required", "err");
    setBusy(true);
    try {
      await api.createMarket({ name: form.name.trim(), short_name: form.short_name.trim(), location: form.location.trim(), booth_fee: num(form.booth_fee), truck_fee: num(form.truck_fee), app_fee: num(form.app_fee) });
      setForm({ name: "", short_name: "", location: "", booth_fee: "", truck_fee: "", app_fee: "" });
      notify("Market saved");
      load();
    } catch (e) { notify(e.message, "err"); } finally { setBusy(false); }
  };
  const saveEdit = async (m) => {
    try { await api.updateMarket(m.id, { name: m.name, short_name: m.short_name, location: m.location, booth_fee: num(m.booth_fee), truck_fee: num(m.truck_fee), app_fee: num(m.app_fee) }); setEditing(null); notify("Updated"); load(); }
    catch (e) { notify(e.message, "err"); }
  };
  const del = async (m) => { try { await api.deleteMarket(m.id); notify("Deleted"); load(); } catch (e) { notify(e.message, "err"); } };

  if (!rows) return <Loading />;
  return (
    <div>
      {canWrite && (
        <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4 mb-4">
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-2">Add a market</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Name *" style={inp} className="col-span-2 sm:col-span-1 px-3 py-2 rounded-lg text-[13px] outline-none" />
            <input value={form.short_name} onChange={(e) => set("short_name", e.target.value)} placeholder="Short name" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Location" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
            <input value={form.booth_fee} onChange={(e) => set("booth_fee", e.target.value)} placeholder="Booth $" type="number" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
            <input value={form.truck_fee} onChange={(e) => set("truck_fee", e.target.value)} placeholder="Truck $" type="number" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
            <input value={form.app_fee} onChange={(e) => set("app_fee", e.target.value)} placeholder="App $" type="number" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
          </div>
          <button onClick={add} disabled={busy} style={{ background: C.pine, color: "#fff", opacity: busy ? 0.6 : 1 }} className="mt-3 px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add market
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {rows.length === 0 && <Empty label="No markets yet." />}
        {rows.map((m) => (
          <div key={m.id} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-xl p-3 flex items-center gap-3">
            <div style={{ background: C.pine }} className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"><Building2 size={16} color={C.honey} /></div>
            {editing === m.id ? (
              <div className="flex-1 grid grid-cols-2 gap-1.5">
                <input defaultValue={m.name} onChange={(e) => (m.name = e.target.value)} style={inp} className="px-2 py-1.5 rounded text-[13px] outline-none" />
                <input defaultValue={m.location || ""} onChange={(e) => (m.location = e.target.value)} placeholder="Location" style={inp} className="px-2 py-1.5 rounded text-[13px] outline-none" />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold truncate">{m.name}</p>
                <p style={{ color: C.sub }} className="text-[11.5px] truncate">{m.location || "—"} · booth ${m.booth_fee}</p>
              </div>
            )}
            {canWrite && (editing === m.id ? (
              <>
                <button onClick={() => saveEdit(m)} style={{ color: C.pine }} className="p-1.5"><Check size={16} /></button>
                <button onClick={() => setEditing(null)} style={{ color: C.sub }} className="p-1.5"><X size={16} /></button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(m.id)} style={{ color: C.sub }} className="p-1.5"><Pencil size={14} /></button>
                <button onClick={() => del(m)} style={{ color: C.danger }} className="p-1.5"><Trash2 size={14} /></button>
              </>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Vendors ---------------- */
function VendorsTab({ canWrite, notify }) {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ business_name: "", contact_name: "", phone: "", email: "", category: "", booth_type: "tent" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = () => api.getVendors().then((r) => setRows(r.vendors)).catch((e) => notify(e.message, "err"));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.business_name.trim()) return notify("Business name is required", "err");
    setBusy(true);
    try {
      await api.createVendor({ ...form, business_name: form.business_name.trim() });
      setForm({ business_name: "", contact_name: "", phone: "", email: "", category: "", booth_type: "tent" });
      notify("Vendor saved");
      load();
    } catch (e) { notify(e.message, "err"); } finally { setBusy(false); }
  };
  const del = async (v) => { try { await api.deleteVendor(v.id); notify("Deleted"); load(); } catch (e) { notify(e.message, "err"); } };
  const setStage = async (v, stage) => { try { await api.updateVendor(v.id, { stage }); load(); } catch (e) { notify(e.message, "err"); } };

  if (!rows) return <Loading />;
  const STAGES = ["Lead", "Applied", "Approved", "Active", "Lapsed"];
  return (
    <div>
      {canWrite && (
        <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4 mb-4">
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-2">Add a vendor</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Business name *" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
            <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Contact name" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
            <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
            <input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Category" style={inp} className="px-3 py-2 rounded-lg text-[13px] outline-none" />
            <select value={form.booth_type} onChange={(e) => set("booth_type", e.target.value)} style={inp} className="px-3 py-2 rounded-lg text-[13px] font-semibold outline-none">
              <option value="tent">Tent</option>
              <option value="truck">Truck</option>
            </select>
          </div>
          <button onClick={add} disabled={busy} style={{ background: C.pine, color: "#fff", opacity: busy ? 0.6 : 1 }} className="mt-3 px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add vendor
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {rows.length === 0 && <Empty label="No vendors yet." />}
        {rows.map((v) => (
          <div key={v.id} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-xl p-3 flex items-center gap-3">
            <div style={{ background: C.berry }} className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"><Store size={16} color="#fff" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold truncate">{v.business_name}</p>
              <p style={{ color: C.sub }} className="text-[11.5px] truncate">{[v.contact_name, v.category, v.booth_type].filter(Boolean).join(" · ") || "—"}</p>
            </div>
            {canWrite ? (
              <select value={v.stage} onChange={(e) => setStage(v, e.target.value)} style={inp} className="px-2 py-1.5 rounded-lg text-[12px] font-semibold outline-none">
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <span style={{ background: C.paper2, color: C.sub }} className="text-[11px] font-bold px-2 py-1 rounded-full">{v.stage}</span>
            )}
            {canWrite && <button onClick={() => del(v)} style={{ color: C.danger }} className="p-1.5"><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Loading() {
  return <div style={{ color: C.sub }} className="flex items-center gap-2 text-[13px] py-8"><Loader2 size={16} className="animate-spin" /> Loading…</div>;
}
function Empty({ label }) {
  return <p style={{ color: C.faint }} className="text-[13px] py-6 text-center">{label}</p>;
}

export default function RecordsPage({ user, onClose }) {
  const [tab, setTab] = useState("markets");
  const [toast, setToast] = useState(null);
  const notify = (msg, kind) => { setToast({ msg, kind }); setTimeout(() => setToast(null), 3000); };
  const canWrite = ["owner", "manager", "staff"].includes(user.role);

  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: FB, color: C.ink }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }} className="px-4 py-6">
        <button onClick={onClose} style={{ color: C.sub }} className="text-[13px] font-semibold flex items-center gap-1.5 mb-4"><ArrowLeft size={15} /> Back to console</button>
        <h1 style={{ fontFamily: FD, fontWeight: 600 }} className="text-[26px] mb-1">Records</h1>
        <p style={{ color: C.sub }} className="text-[13.5px] mb-5">Live data saved to your organization's database. Everything here persists and is private to your org.</p>
        <div style={{ background: C.paper2 }} className="p-1 rounded-full inline-flex mb-5">
          {[["markets", "Markets"], ["vendors", "Vendors"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ background: tab === k ? C.card : "transparent", color: tab === k ? C.ink : C.sub }} className="px-5 py-1.5 rounded-full text-[13px] font-semibold">{l}</button>
          ))}
        </div>
        {tab === "markets" ? <MarketsTab canWrite={canWrite} notify={notify} /> : <VendorsTab canWrite={canWrite} notify={notify} />}
      </div>
      <Toast toast={toast} />
    </div>
  );
}
