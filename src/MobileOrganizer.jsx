import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Home,
  Loader2,
  MapPin,
  Megaphone,
  Plus,
  Search,
  Send,
  Store,
  Users,
  X,
} from "lucide-react";
import { api } from "./api";
import { C, FD, FB } from "./theme";

const panel = { background: C.card, border: `1px solid ${C.line}` };
const input = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
const currency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
const dateLabel = (value) => {
  if (!value) return "Date to be scheduled";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function Initial({ name, color = C.pine }) {
  return (
    <span
      style={{ background: color, color: "#fff", fontFamily: FD }}
      className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] font-semibold shrink-0"
    >
      {(name || "M").trim().charAt(0).toUpperCase()}
    </span>
  );
}

function Empty({ icon: Icon, title, detail, action }) {
  return (
    <div style={panel} className="rounded-2xl p-5 text-center">
      <span style={{ background: C.paper2, color: C.pine }} className="mx-auto w-11 h-11 rounded-xl flex items-center justify-center">
        <Icon size={20} />
      </span>
      <p style={{ fontFamily: FD }} className="mt-3 text-[17px] font-semibold">{title}</p>
      <p style={{ color: C.sub }} className="mt-1 text-[12.5px] leading-relaxed">{detail}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-2.5">
      <h2 style={{ fontFamily: FD }} className="text-[18px] font-semibold">{children}</h2>
      {action}
    </div>
  );
}

function AddVendorSheet({ onClose, onSaved }) {
  const [form, setForm] = useState({ business_name: "", contact_name: "", email: "", phone: "", category: "", booth_type: "tent" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.business_name.trim()) return setError("Business name is required.");
    setBusy(true); setError("");
    try { await api.createVendor(form); await onSaved(); onClose(); }
    catch (err) { setError(err.message || "Could not save vendor."); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-end" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} style={{ background: C.card, color: C.ink, fontFamily: FB }} className="w-full rounded-t-[28px] p-5 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5"><div><p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide">Central CRM</p><h2 style={{ fontFamily: FD }} className="text-[22px] font-semibold">Add vendor</h2></div><button type="button" onClick={onClose} style={{ background: C.paper2, color: C.sub }} className="w-9 h-9 rounded-full flex items-center justify-center"><X size={18} /></button></div>
        <div className="grid gap-3">
          <input autoFocus value={form.business_name} onChange={(event) => set("business_name", event.target.value)} placeholder="Business name *" style={input} className="w-full px-3.5 py-3 rounded-xl text-[14px] outline-none" />
          <input value={form.contact_name} onChange={(event) => set("contact_name", event.target.value)} placeholder="Contact name" style={input} className="w-full px-3.5 py-3 rounded-xl text-[14px] outline-none" />
          <div className="grid grid-cols-2 gap-3"><input value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="Phone" style={input} className="min-w-0 px-3.5 py-3 rounded-xl text-[14px] outline-none" /><input value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="Email" type="email" style={input} className="min-w-0 px-3.5 py-3 rounded-xl text-[14px] outline-none" /></div>
          <div className="grid grid-cols-2 gap-3"><input value={form.category} onChange={(event) => set("category", event.target.value)} placeholder="Category" style={input} className="min-w-0 px-3.5 py-3 rounded-xl text-[14px] outline-none" /><select value={form.booth_type} onChange={(event) => set("booth_type", event.target.value)} style={input} className="min-w-0 px-3.5 py-3 rounded-xl text-[14px] outline-none"><option value="tent">Tent</option><option value="truck">Food truck</option></select></div>
        </div>
        {error && <p style={{ color: C.danger, background: C.dangerSoft }} className="mt-3 rounded-lg p-2.5 text-[12px] font-medium">{error}</p>}
        <button disabled={busy} style={{ background: C.pine, color: "#fff", opacity: busy ? .65 : 1 }} className="mt-5 w-full rounded-xl py-3.5 text-[14px] font-bold flex items-center justify-center gap-2">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Saving…" : "Save vendor"}</button>
      </form>
    </div>
  );
}

function AddMarketSheet({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", location: "", booth_fee: "", truck_fee: "", frequency: "weekly" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Market name is required.");
    setBusy(true); setError("");
    try { await api.createMarket({ ...form, booth_fee: Number(form.booth_fee || 0), truck_fee: Number(form.truck_fee || 0) }); await onSaved(); onClose(); }
    catch (err) { setError(err.message || "Could not save market."); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-end" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} style={{ background: C.card, color: C.ink, fontFamily: FB }} className="w-full rounded-t-[28px] p-5 pb-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5"><div><p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide">Organizer console</p><h2 style={{ fontFamily: FD }} className="text-[22px] font-semibold">Add market</h2></div><button type="button" onClick={onClose} style={{ background: C.paper2, color: C.sub }} className="w-9 h-9 rounded-full flex items-center justify-center"><X size={18} /></button></div>
        <div className="grid gap-3"><input autoFocus value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Market name *" style={input} className="w-full px-3.5 py-3 rounded-xl text-[14px] outline-none" /><input value={form.location} onChange={(event) => set("location", event.target.value)} placeholder="Location" style={input} className="w-full px-3.5 py-3 rounded-xl text-[14px] outline-none" /><div className="grid grid-cols-2 gap-3"><input value={form.booth_fee} onChange={(event) => set("booth_fee", event.target.value)} placeholder="Tent fee" type="number" min="0" style={input} className="min-w-0 px-3.5 py-3 rounded-xl text-[14px] outline-none" /><input value={form.truck_fee} onChange={(event) => set("truck_fee", event.target.value)} placeholder="Truck fee" type="number" min="0" style={input} className="min-w-0 px-3.5 py-3 rounded-xl text-[14px] outline-none" /></div><select value={form.frequency} onChange={(event) => set("frequency", event.target.value)} style={input} className="px-3.5 py-3 rounded-xl text-[14px] outline-none"><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option><option value="custom">Custom dates</option></select></div>
        {error && <p style={{ color: C.danger, background: C.dangerSoft }} className="mt-3 rounded-lg p-2.5 text-[12px] font-medium">{error}</p>}
        <button disabled={busy} style={{ background: C.pine, color: "#fff", opacity: busy ? .65 : 1 }} className="mt-5 w-full rounded-xl py-3.5 text-[14px] font-bold flex items-center justify-center gap-2">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Saving…" : "Save market"}</button>
      </form>
    </div>
  );
}

export default function MobileOrganizer({ user }) {
  const [tab, setTab] = useState("home");
  const [data, setData] = useState({ markets: [], vendors: [], applications: [], dates: [], campaigns: [], customers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [crmType, setCrmType] = useState("vendors");
  const [sheet, setSheet] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [markets, vendors, applications, dates, campaigns, customers] = await Promise.all([
        api.getMarkets(), api.getVendors(), api.getApplications(), api.getMarketDates(), api.getCampaigns(), api.getSubscribers(),
      ]);
      setData({
        markets: markets.markets || [], vendors: vendors.vendors || [], applications: applications.applications || [],
        dates: dates.market_dates || dates.dates || [], campaigns: campaigns.campaigns || [], customers: customers.subscribers || customers.customers || [],
      });
    } catch (err) { setError(err.message || "Could not load your MarketHub data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const canWrite = ["owner", "manager", "staff"].includes(user?.role);
  const q = query.trim().toLowerCase();
  const filteredVendors = useMemo(() => data.vendors.filter((vendor) => !q || [vendor.business_name, vendor.contact_name, vendor.category, vendor.city].filter(Boolean).join(" ").toLowerCase().includes(q)), [data.vendors, q]);
  const filteredCustomers = useMemo(() => data.customers.filter((customer) => !q || [customer.name, customer.email, customer.phone].filter(Boolean).join(" ").toLowerCase().includes(q)), [data.customers, q]);
  const openApplications = data.applications.filter((item) => item.status === "under_review");
  const activeMarkets = data.markets.filter((market) => !market.archived);
  const nav = [
    ["home", "Home", Home], ["markets", "Markets", Building2], ["crm", "CRM", Users], ["operations", "Ops", ClipboardList], ["more", "More", Store],
  ];

  const header = (eyebrow, title, right) => <header className="px-5 pt-5 pb-3 flex items-start gap-3"><div className="flex-1 min-w-0"><p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-[.11em]">{eyebrow}</p><h1 style={{ fontFamily: FD }} className="mt-1 text-[27px] leading-none font-semibold truncate">{title}</h1></div>{right}</header>;
  const quick = (Icon, label, tone, onClick) => <button onClick={onClick} style={{ background: tone.bg, color: tone.fg, border: `1px solid ${tone.border || tone.bg}` }} className="rounded-2xl px-3 py-3.5 text-left flex flex-col gap-2 min-h-[92px]"><Icon size={19} /><span className="text-[11.5px] font-bold leading-tight">{label}</span></button>;

  if (loading) return <div style={{ background: C.paper, color: C.sub, fontFamily: FB, minHeight: "100vh" }} className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Loading your markets…</div>;

  const HomeView = () => <>
    {header("Organizer console", `Hi, ${(user?.name || "there").split(" ")[0]}`, <button onClick={load} style={{ background: C.paper2, color: C.pine }} className="w-10 h-10 rounded-full flex items-center justify-center"><Bell size={18} /></button>)}
    <section className="px-5"><div style={{ background: `linear-gradient(135deg, ${C.pineDeep}, ${C.pine})` }} className="rounded-3xl p-5 text-white overflow-hidden relative"><p className="text-white/65 text-[11px] font-bold uppercase tracking-wide">Today at a glance</p><div className="grid grid-cols-2 gap-4 mt-3"><div><p style={{ fontFamily: FD }} className="text-[29px] leading-none">{activeMarkets.length}</p><p className="text-white/70 text-[11px] mt-1">Active markets</p></div><div><p style={{ fontFamily: FD }} className="text-[29px] leading-none">{openApplications.length}</p><p className="text-white/70 text-[11px] mt-1">Need review</p></div></div><div className="absolute -right-5 -bottom-8 w-28 h-28 rounded-full border-[18px] border-white/10" /></div></section>
    <section className="px-5 grid grid-cols-2 gap-3 mt-4">{quick(Plus, "Add market", { bg: C.honeySoft, fg: C.honeyDeep, border: C.honeySoft }, () => setSheet("market"))}{quick(Users, "Add vendor", { bg: C.sageSoft, fg: C.pine }, () => setSheet("vendor"))}{quick(ClipboardList, "Review applications", { bg: C.berrySoft, fg: C.berry }, () => setTab("operations"))}{quick(Megaphone, "Campaigns", { bg: C.paper2, fg: C.pine }, () => setTab("more"))}</section>
    <section className="px-5"><SectionTitle action={<button onClick={() => setTab("operations")} style={{ color: C.pine }} className="text-[12px] font-bold">View all</button>}>Needs attention</SectionTitle>{openApplications.slice(0, 3).map((item) => <button key={item.id} onClick={() => setTab("operations")} style={panel} className="w-full rounded-2xl px-3.5 py-3 flex items-center gap-3 text-left mb-2"><Initial name={item.business_name} color={C.honeyDeep} /><div className="flex-1 min-w-0"><p className="text-[13.5px] font-bold truncate">{item.business_name}</p><p style={{ color: C.sub }} className="text-[11.5px] truncate">{item.market_name || "New application"}</p></div><ChevronRight size={17} color={C.faint} /></button>)}{!openApplications.length && <Empty icon={CheckCircle2} title="You’re caught up" detail="New vendor applications will show up here." />}</section>
    <section className="px-5 pb-28"><SectionTitle action={<button onClick={() => setTab("markets")} style={{ color: C.pine }} className="text-[12px] font-bold">Markets</button>}>Your markets</SectionTitle>{activeMarkets.slice(0, 3).map((market) => <button key={market.id} onClick={() => setTab("markets")} style={panel} className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-left mb-2"><Initial name={market.name} /><div className="flex-1 min-w-0"><p className="text-[13.5px] font-bold truncate">{market.name}</p><p style={{ color: C.sub }} className="text-[11.5px] truncate flex items-center gap-1"><MapPin size={11} /> {market.location || "Location to be added"}</p></div><span style={{ background: C.sageSoft, color: C.pine }} className="text-[10px] font-bold px-2 py-1 rounded-full">Live</span></button>)}</section>
  </>;

  const MarketsView = () => <><>{header("Organizer console", "Markets", canWrite && <button onClick={() => setSheet("market")} style={{ background: C.pine, color: "#fff" }} className="w-10 h-10 rounded-full flex items-center justify-center"><Plus size={19} /></button>)}</><section className="px-5 pb-28">{activeMarkets.map((market) => <article key={market.id} style={panel} className="rounded-3xl p-4 mb-3"><div className="flex gap-3"><Initial name={market.name} /><div className="flex-1 min-w-0"><p style={{ fontFamily: FD }} className="text-[17px] font-semibold truncate">{market.name}</p><p style={{ color: C.sub }} className="text-[12px] mt-1 flex items-center gap-1"><MapPin size={12} /> {market.location || "Location to be added"}</p></div><span style={{ background: C.sageSoft, color: C.pine }} className="h-fit text-[10px] font-bold px-2 py-1 rounded-full">Active</span></div><div style={{ borderTop: `1px solid ${C.line}` }} className="mt-4 pt-3 grid grid-cols-3 gap-2"><div><p style={{ color: C.faint }} className="text-[9px] font-bold uppercase">Tent</p><p className="text-[13px] font-bold mt-0.5">{currency(market.booth_fee)}</p></div><div><p style={{ color: C.faint }} className="text-[9px] font-bold uppercase">Truck</p><p className="text-[13px] font-bold mt-0.5">{currency(market.truck_fee)}</p></div><div><p style={{ color: C.faint }} className="text-[9px] font-bold uppercase">Schedule</p><p className="text-[13px] font-bold mt-0.5 capitalize">{market.frequency || "Custom"}</p></div></div></article>)}{!activeMarkets.length && <Empty icon={Building2} title="No markets yet" detail="Create your first market to begin taking vendor applications." action={canWrite && <button onClick={() => setSheet("market")} style={{ background: C.pine, color: "#fff" }} className="px-4 py-2.5 rounded-xl text-[12px] font-bold">Add market</button>} />}</section></>;

  const CRMView = () => { const people = crmType === "vendors" ? filteredVendors : filteredCustomers; return <><>{header("Central CRM", crmType === "vendors" ? "Vendors" : "Customers", crmType === "vendors" && canWrite && <button onClick={() => setSheet("vendor")} style={{ background: C.pine, color: "#fff" }} className="w-10 h-10 rounded-full flex items-center justify-center"><Plus size={19} /></button>)}</><section className="px-5 pb-28"><div style={{ background: C.paper2 }} className="rounded-xl p-1 grid grid-cols-2 mb-3"><button onClick={() => setCrmType("vendors")} style={{ background: crmType === "vendors" ? C.card : "transparent", color: crmType === "vendors" ? C.pine : C.sub }} className="rounded-lg py-2 text-[12px] font-bold">Vendors · {data.vendors.length}</button><button onClick={() => setCrmType("customers")} style={{ background: crmType === "customers" ? C.card : "transparent", color: crmType === "customers" ? C.pine : C.sub }} className="rounded-lg py-2 text-[12px] font-bold">Customers · {data.customers.length}</button></div><label style={panel} className="rounded-xl px-3 py-2.5 flex items-center gap-2"><Search size={16} color={C.faint} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${crmType}`} className="bg-transparent outline-none text-[13px] w-full" /></label><div className="mt-3">{people.map((person) => <article key={person.id} style={panel} className="rounded-2xl p-3 flex items-center gap-3 mb-2"><Initial name={person.business_name || person.name} color={crmType === "vendors" ? C.pine : C.berry} /><div className="flex-1 min-w-0"><p className="text-[13.5px] font-bold truncate">{person.business_name || person.name || "Customer"}</p><p style={{ color: C.sub }} className="text-[11.5px] truncate">{crmType === "vendors" ? [person.category, person.city].filter(Boolean).join(" · ") || "Vendor" : person.email || person.phone || "Customer"}</p></div>{crmType === "vendors" && <span style={{ background: C.paper2, color: C.sub }} className="text-[9px] font-bold px-2 py-1 rounded-full">{person.stage || "Lead"}</span>}</article>)}{!people.length && <Empty icon={Users} title={`No ${crmType} found`} detail={query ? "Try a different search." : `New ${crmType} will appear here.`} />}</div></section></> };

  const OperationsView = () => <><>{header("Event operations", "Operations")}</><section className="px-5 pb-28"><SectionTitle>Applications</SectionTitle>{data.applications.map((item) => <article key={item.id} style={panel} className="rounded-2xl p-3.5 flex items-center gap-3 mb-2"><Initial name={item.business_name} color={item.status === "under_review" ? C.honeyDeep : C.pine} /><div className="flex-1 min-w-0"><p className="text-[13.5px] font-bold truncate">{item.business_name}</p><p style={{ color: C.sub }} className="text-[11.5px] truncate">{item.market_name || "Market application"}</p></div><span style={{ background: item.status === "approved" ? C.sageSoft : C.honeySoft, color: item.status === "approved" ? C.pine : C.honeyDeep }} className="text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap">{String(item.status || "under_review").replaceAll("_", " ")}</span></article>)}{!data.applications.length && <Empty icon={ClipboardList} title="No applications" detail="Applications from your public link will arrive here." />}<SectionTitle>Upcoming dates</SectionTitle>{data.dates.slice(0, 5).map((date) => <article key={date.id} style={panel} className="rounded-2xl p-3.5 flex items-center gap-3 mb-2"><span style={{ background: C.berrySoft, color: C.berry, fontFamily: FD }} className="w-11 h-11 rounded-xl flex items-center justify-center text-[12px] text-center leading-tight font-semibold">{dateLabel(date.event_date)}</span><div className="flex-1 min-w-0"><p className="text-[13.5px] font-bold truncate">{date.market_name || "Market date"}</p><p style={{ color: C.sub }} className="text-[11.5px] capitalize">{date.status || "Scheduled"}</p></div><CalendarDays size={17} color={C.faint} /></article>)}</section></>;

  const MoreView = () => <><>{header("Organizer console", "More")}</><section className="px-5 pb-28"><SectionTitle>Campaigns</SectionTitle>{data.campaigns.map((campaign) => <article key={campaign.id} style={panel} className="rounded-2xl p-3.5 flex items-center gap-3 mb-2"><span style={{ background: C.berrySoft, color: C.berry }} className="w-10 h-10 rounded-xl flex items-center justify-center"><Send size={17} /></span><div className="flex-1 min-w-0"><p className="text-[13.5px] font-bold truncate">{campaign.name}</p><p style={{ color: C.sub }} className="text-[11.5px] capitalize">{campaign.audience || "Campaign"}</p></div><span style={{ background: C.sageSoft, color: C.pine }} className="text-[9px] font-bold px-2 py-1 rounded-full">{campaign.status || "Draft"}</span></article>)}{!data.campaigns.length && <Empty icon={Megaphone} title="No campaigns yet" detail="Build email and text campaigns from the desktop console." />}<SectionTitle>Account</SectionTitle><div style={panel} className="rounded-2xl p-3.5 flex items-center gap-3"><Initial name={user?.name} /><div className="flex-1"><p className="text-[13.5px] font-bold">{user?.name || "Organizer"}</p><p style={{ color: C.sub }} className="text-[11.5px] capitalize">{user?.role || "manager"} access</p></div></div></section></>;

  const view = { home: <HomeView />, markets: <MarketsView />, crm: <CRMView />, operations: <OperationsView />, more: <MoreView /> }[tab];
  return <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: FB }} className="max-w-[520px] mx-auto relative">{error && <div style={{ background: C.dangerSoft, color: C.danger }} className="mx-5 mt-4 rounded-xl p-3 text-[12px] font-medium">{error}</div>}{view}<nav style={{ background: "rgba(255,255,255,.96)", borderTop: `1px solid ${C.line}`, backdropFilter: "blur(12px)" }} className="fixed bottom-0 left-0 right-0 z-40"><div className="max-w-[520px] mx-auto px-2 py-2 grid grid-cols-5">{nav.map(([key, label, Icon]) => <button key={key} onClick={() => setTab(key)} style={{ color: tab === key ? C.pine : C.faint }} className="py-1.5 flex flex-col gap-1 items-center"><span style={{ background: tab === key ? C.sageSoft : "transparent" }} className="w-9 h-7 rounded-lg flex items-center justify-center"><Icon size={18} strokeWidth={tab === key ? 2.4 : 1.8} /></span><span className="text-[9.5px] font-bold">{label}</span></button>)}</div></nav>{sheet === "vendor" && <AddVendorSheet onClose={() => setSheet("")} onSaved={load} />}{sheet === "market" && <AddMarketSheet onClose={() => setSheet("")} onSaved={load} />}</div>;
}
