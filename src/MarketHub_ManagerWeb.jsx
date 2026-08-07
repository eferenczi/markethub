import React, { useState, useRef, useEffect } from "react";
import {
  Store, LayoutDashboard, Map as MapIcon, Users, CreditCard, Megaphone, LogOut,
  Plus, Upload, Tent, Truck, Trash2, X, Check, ChevronRight, ChevronDown, Mail,
  MessageSquare, Clock, DollarSign, Copy, Send, Sparkles, BadgeCheck, AlertTriangle,
  Search, Eye, ArrowRight, Calendar, Bell, BellRing, Play, Save, Lock, GripVertical,
  Move, Minus, ZoomIn, ZoomOut, Maximize2, RotateCw, RotateCcw, BarChart3, Download,
  Percent, PauseCircle, Settings, Building2, Wallet, TrendingUp, Layers, FolderOpen, Ban, Pencil, Archive, ArchiveRestore, Printer, Phone, ExternalLink, StickyNote,
} from "lucide-react";

/* ================================================================== */
/*  Tokens                                                             */
/* ================================================================== */
const C = {
  paper: "#F4F1E8", paper2: "#ECE7D8", card: "#FFFFFF", panel: "#FBFAF5",
  ink: "#18211C", sub: "#5E665D", faint: "#8B9188", line: "#E2DCCB",
  pine: "#234C3A", pineDeep: "#173525", sage: "#7FA98C", sageSoft: "#E4EDE4",
  honey: "#DE9A32", honeyDeep: "#B87A1E", honeySoft: "#F7E9CC",
  berry: "#8A3A5B", berrySoft: "#F1E1E7", danger: "#B4482F", dangerSoft: "#F6E2DC",
};
const FD = "'Fraunces', Georgia, serif";
const FB = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const audColor = (a) => (a === "Vendors" ? C.pine : a === "Shoppers" ? C.berry : C.honeyDeep);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const money = (n) => "$" + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

const DEFAULT = { tent: { w: 66, h: 58 }, truck: { w: 120, h: 74 } };
const MINS = { tent: { w: 28, h: 24 }, truck: { w: 52, h: 36 } };
const MAXDIM = 340;
const PLATFORM_FEE = 1.99;
const HOLD_MS = 24 * 60 * 60 * 1000;

/* payment methods (brand marks are placeholders — swap real logos in production) */
const METHOD_META = {
  stripe: { label: "Card", color: "#635BFF", kind: "instant" },
  applepay: { label: "Apple Pay", color: "#111111", kind: "instant" },
  googlepay: { label: "Google Pay", color: "#1A73E8", kind: "instant" },
  paypal: { label: "PayPal", color: "#003087", kind: "instant" },
  venmo: { label: "Venmo", color: "#3D95CE", kind: "handle", handle: "@central-makers" },
  zelle: { label: "Zelle", color: "#6D1ED4", kind: "handle", handle: "pay@central-makers.com" },
};
const METHOD_ORDER = ["stripe", "applepay", "googlepay", "paypal", "venmo", "zelle"];

/* ================================================================== */
/*  Data                                                               */
/* ================================================================== */
const VENDORS = {
  v1: { id: "v1", name: "Rosalind Candle Co.", contact: "Rosalind Vega", phone: "(305) 555-0142", email: "rosalind@rosalindcandle.co", city: "Miami", cat: "Candles & Home", emoji: "🕯️", rep: 96, tags: ["Top Seller", "Reliable"], g1: "#8A5A2B", g2: "#DE9A32" },
  v4: { id: "v4", name: "La Ventana Coffee", contact: "Andrés Cruz", phone: "(305) 555-0188", email: "andres@laventana.coffee", city: "Little Havana", cat: "Coffee & Drinks", emoji: "☕", rep: 93, tags: ["Top Seller"], g1: "#5A3A24", g2: "#8A5A2B" },
  v2: { id: "v2", name: "Papi's Hot Sauce", contact: "Luis Pardo", phone: "(786) 555-0119", email: "luis@papishotsauce.com", city: "Hialeah", cat: "Packaged Food", emoji: "🌶️", rep: 91, tags: ["Crowd Draw"], g1: "#9B2F24", g2: "#D9603F" },
  v6: { id: "v6", name: "Sweet Palm Bakery", contact: "Nadia Palm", phone: "(305) 555-0170", email: "nadia@sweetpalm.bakery", city: "Kendall", cat: "Bakery", emoji: "🥐", rep: 90, tags: ["Reliable"], g1: "#8A6A2B", g2: "#C99A5B" },
  v3: { id: "v3", name: "Bloom & Fern", contact: "Jess Romero", phone: "(954) 555-0133", email: "jess@bloomandfern.co", city: "Coral Springs", cat: "Plants & Florals", emoji: "🪴", rep: 88, tags: ["New"], g1: "#2F6B4F", g2: "#5FA07C" },
  v8: { id: "v8", name: "Sol Jewelry", contact: "Sol Marín", phone: "(305) 555-0164", email: "sol@soljewelry.studio", city: "Wynwood", cat: "Jewelry", emoji: "💍", rep: 87, tags: ["Handmade"], g1: "#5B3A66", g2: "#8A5A96" },
  v5: { id: "v5", name: "Coral Reef Ceramics", contact: "Wendy Ho", phone: "(786) 555-0155", email: "wendy@coralreefceramics.com", city: "Miami Beach", cat: "Art & Craft", emoji: "🐚", rep: 85, tags: ["Handmade"], g1: "#245A6B", g2: "#4E93A6" },
  v9: { id: "v9", name: "Taco Libre Truck", contact: "Marco Díaz", phone: "(305) 555-0177", email: "marco@tacolibre.truck", city: "Doral", cat: "Food Truck", emoji: "🌮", rep: 89, tags: ["Crowd Draw"], g1: "#9B6A24", g2: "#D9A03F" },
  v10: { id: "v10", name: "Kona Ice Truck", contact: "Kai Nunes", phone: "(786) 555-0102", email: "kai@konaice.truck", city: "Miami", cat: "Food Truck", emoji: "🍧", rep: 84, tags: ["New"], g1: "#245A6B", g2: "#4E93A6" },
};
const isTruckV = (v) => v.cat === "Food Truck";
const LEADS = [
  { id: "l1", name: "Delgado Empanadas", emoji: "🥟", g1: "#9B2F24", g2: "#D9603F" },
  { id: "l2", name: "Brew & Bloom Co.", emoji: "🌸", g1: "#5B3A66", g2: "#8A5A96" },
  { id: "l3", name: "Herrera Woodcraft", emoji: "🪵", g1: "#5A3A24", g2: "#8A5A2B" },
  { id: "l4", name: "Sunny Groves Citrus", emoji: "🍊", g1: "#8A6A2B", g2: "#DE9A32" },
  { id: "l5", name: "Tidepool Soap Co.", emoji: "🧼", g1: "#245A6B", g2: "#4E93A6" },
];

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d) => `${WD[d.getDay()]} · ${MO[d.getMonth()]} ${d.getDate()}`;
const FREQ_LABEL = { weekly: "Weekly", biweekly: "Every 2 weeks", monthly: "Monthly", custom: "Custom dates" };
const freqLabel = (f) => FREQ_LABEL[f] || "Weekly";
const nthWeekdayOfMonth = (year, month, weekday, nth) => { const days = []; const dd = new Date(year, month, 1, 12); while (dd.getMonth() === month) { if (dd.getDay() === weekday) days.push(new Date(dd)); dd.setDate(dd.getDate() + 1); } return days[Math.min(nth, days.length) - 1]; };
const stepDate = (d, freq) => { if (freq === "monthly") return nthWeekdayOfMonth(d.getFullYear(), d.getMonth() + 1, d.getDay(), Math.ceil(d.getDate() / 7)); const nd = new Date(d); nd.setDate(d.getDate() + (freq === "biweekly" ? 14 : 7)); return nd; };
const mkDateObj = (d, status = "generated") => ({ id: "d" + d.getTime(), iso: d.toISOString().slice(0, 10), label: fmtDate(d), status });
const genDates = (startIso, freq, n = 3) => { const start = new Date(startIso + "T12:00:00"); if (freq === "custom") return [mkDateObj(start, "published")]; const out = []; let d = start; for (let i = 0; i < n; i++) { out.push(mkDateObj(d, i === 0 ? "published" : "generated")); d = stepDate(d, freq); } return out; };

const MARKETS_BASE = [
  { id: "m1", name: "Central Makers — Sanford", short: "Sanford", location: "Palmetto Ave, Sanford", start: "2026-08-16", freq: "weekly", boothFee: 65, truckFee: 120, appFee: 10, methods: ["stripe", "applepay", "googlepay", "paypal", "venmo", "zelle"], description: "A weekly makers market in historic downtown Sanford drawing 1,800+ weekend shoppers, with live music and a curated mix of handmade goods, food, and local art." },
  { id: "m2", name: "Wynwood Makers Market", short: "Wynwood", location: "NW 2nd Ave, Wynwood, Miami", start: "2026-08-09", freq: "biweekly", boothFee: 85, truckFee: 150, appFee: 15, methods: ["stripe", "applepay", "googlepay", "paypal"], description: "A biweekly market in the heart of Miami's Wynwood arts district — 2,500+ visitors, heavy foot traffic, and a creative, design-forward crowd." },
  { id: "m3", name: "Mount Dora Craft Fair", short: "Mount Dora", location: "Donnelly St, Mount Dora", start: "2026-08-01", freq: "monthly", boothFee: 70, truckFee: 130, appFee: 10, methods: ["stripe", "paypal", "venmo", "zelle"], description: "A monthly craft fair in charming Mount Dora that draws 3,000+ attendees from across Central Florida for handmade, home, and candle goods." },
  { id: "m4", name: "Coral Gables Farmers Market", short: "Coral Gables", location: "Le Jeune Rd, Coral Gables", start: "2026-08-15", freq: "weekly", boothFee: 60, truckFee: 110, appFee: 0, methods: ["stripe", "applepay", "googlepay"], description: "A weekly farmers market in Coral Gables with a loyal, upscale shopper base and strong demand for produce, bakery, and specialty foods." },
];
const MARKETS = MARKETS_BASE.map((m) => { const dates = genDates(m.start, m.freq); return { ...m, dates, date: dates[0].label }; });

const seedApprovals = (t0) => [
  { id: "a1", vId: "v1", marketId: "m1", status: "Paid", deadline: null, method: "stripe", discType: "none", discVal: 0, reminders: 0 },
  { id: "a2", vId: "v4", marketId: "m1", status: "Paid", deadline: null, method: "applepay", discType: "none", discVal: 0, reminders: 0 },
  { id: "a3", vId: "v2", marketId: "m1", status: "AwaitingPayment", deadline: t0 + HOLD_MS - 10 * 60000, method: null, discType: "none", discVal: 0, reminders: 1 },
  { id: "a4", vId: "v9", marketId: "m1", status: "AwaitingPayment", deadline: t0 + HOLD_MS - 52 * 60000, method: null, discType: "percent", discVal: 20, reminders: 0 },
  { id: "a5", vId: "v3", marketId: "m1", status: "Pending", deadline: null, method: null, discType: "none", discVal: 0, reminders: 0 },
  { id: "a6", vId: "v5", marketId: "m1", status: "Pending", deadline: null, method: null, discType: "amount", discVal: 15, reminders: 0 },
  { id: "a11", vId: "v6", marketId: "m1", status: "Held", deadline: null, method: null, discType: "none", discVal: 0, reminders: 1 },
  { id: "a7", vId: "v1", marketId: "m2", status: "AwaitingPayment", deadline: t0 + HOLD_MS - 120 * 60000, method: null, discType: "none", discVal: 0, reminders: 2 },
  { id: "a8", vId: "v8", marketId: "m2", status: "Pending", deadline: null, method: null, discType: "none", discVal: 0, reminders: 0 },
  { id: "a9", vId: "v2", marketId: "m3", status: "Pending", deadline: null, method: null, discType: "none", discVal: 0, reminders: 0 },
  { id: "a10", vId: "v10", marketId: "m4", status: "Pending", deadline: null, method: null, discType: "none", discVal: 0, reminders: 0 },
];

const SEED_SPOTS = {
  m1: [
    { id: "s1", type: "tent", x: 8, y: 18, vId: "v1", w: 66, h: 58, rot: 0 },
    { id: "s2", type: "tent", x: 26, y: 18, vId: "v4", w: 66, h: 58, rot: 0 },
    { id: "s3", type: "tent", x: 44, y: 18, vId: "v2", w: 66, h: 58, rot: 0 },
    { id: "s4", type: "tent", x: 8, y: 50, vId: "v6", w: 66, h: 58, rot: 0 },
    { id: "s5", type: "tent", x: 26, y: 50, vId: null, w: 66, h: 58, rot: 0 },
    { id: "s6", type: "truck", x: 58, y: 60, vId: "v9", w: 120, h: 74, rot: 0 },
  ],
  m2: [
    { id: "s7", type: "tent", x: 14, y: 24, vId: "v1", w: 66, h: 58, rot: 0 },
    { id: "s8", type: "tent", x: 34, y: 24, vId: null, w: 66, h: 58, rot: 0 },
  ],
  m3: [], m4: [],
};

const SEED_CAMPAIGNS = [
  { id: "cp1", name: "New Vendor Welcome", audience: "Vendors", status: "Active", steps: [
    { id: "st1", ch: "email", delay: "Day 0", subject: "Welcome to Central Makers 🎉", body: "You're in! Here's everything you need for your first market day." },
    { id: "st2", ch: "email", delay: "+2 days", subject: "Your booth-day checklist", body: "Tent, table, float, permits — the setup essentials in one list." },
    { id: "st3", ch: "sms", delay: "+5 days", subject: "", body: "See you Saturday! Load-in opens 7am on Palmetto Ave." }] },
  { id: "cp2", name: "Unpaid Booth Reminder", audience: "Vendors", status: "Active", steps: [
    { id: "st4", ch: "email", delay: "Day 0", subject: "Your booth fee is due", body: "You've been approved! Pay within 24 hours to keep your spot: {pay_link}" },
    { id: "st5", ch: "sms", delay: "+12 hours", subject: "", body: "Reminder: your booth for {market} is unpaid. Pay here to keep it: {pay_link}" }] },
];

/* fee helpers */
const baseFee = (a, m) => (isTruckV(VENDORS[a.vId]) ? m.truckFee : m.boothFee);
const discAmount = (a, base) => (a.discType === "amount" ? Math.min(base, a.discVal || 0) : a.discType === "percent" ? base * Math.min(100, a.discVal || 0) / 100 : 0);
const feeOf = (a, m) => Math.max(0, Math.round((baseFee(a, m) - discAmount(a, baseFee(a, m))) * 100) / 100);

const STAGES = ["Lead", "Applied", "Approved", "Active", "Lapsed"];
const CAT_OPTIONS = ["Sweets", "Lemonade", "Coffee & Drinks", "Bakery", "Packaged Food", "Prepared Food", "Candles & Home", "Plants & Florals", "Jewelry", "Art & Craft", "Apparel", "Food Truck", "Other"];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const stageMeta = { Lead: [C.paper2, C.sub], Applied: [C.honeySoft, C.honeyDeep], Approved: [C.sageSoft, C.pine], Active: [C.pine, "#fff"], Lapsed: [C.dangerSoft, C.danger] };
const deriveStage = (vId, approvals) => { const rows = approvals.filter((a) => a.vId === vId); if (rows.some((a) => a.status === "Paid")) return "Active"; if (rows.some((a) => a.status === "AwaitingPayment" || a.status === "Held")) return "Approved"; if (rows.some((a) => a.status === "Pending")) return "Applied"; return "Lead"; };

/* ================================================================== */
/*  Atoms                                                              */
/* ================================================================== */
function VAvatar({ v, size = 34, r = 10 }) {
  return <div style={{ width: size, height: size, borderRadius: r, background: `linear-gradient(135deg, ${v.g1}, ${v.g2})`, fontSize: size * 0.5 }} className="flex items-center justify-center flex-shrink-0">{v.emoji}</div>;
}
function RepDot({ rep, size = 30 }) {
  return <div style={{ width: size, height: size, background: C.honeySoft, border: `1.5px solid ${C.honey}`, color: C.pine, fontFamily: FD }} className="rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0">{rep}</div>;
}
function Pill({ children, bg, fg }) {
  return <span style={{ background: bg, color: fg }} className="text-[11px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 whitespace-nowrap">{children}</span>;
}
function fmtRemaining(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(sec)}`;
}
function MethodMark({ id, size = 26, r = 7 }) {
  const meta = METHOD_META[id];
  const letters = { applepay: "", googlepay: "G", paypal: "P", venmo: "V", zelle: "Z" };
  return (
    <div style={{ width: size, height: size, borderRadius: r, background: meta.color }} className="flex items-center justify-center flex-shrink-0">
      {id === "stripe" ? <CreditCard size={size * 0.55} color="#fff" /> : <span style={{ color: "#fff", fontSize: size * 0.42, fontWeight: 800, fontFamily: FB }}>{letters[id]}</span>}
    </div>
  );
}

/* ================================================================== */
/*  Tent + Truck graphics                                              */
/* ================================================================== */
function TentSVG() {
  return (
    <svg viewBox="0 0 72 58" width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <g stroke="#AEB4AC" strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke"><line x1="21" y1="28" x2="21" y2="48" /><line x1="51" y1="28" x2="51" y2="48" /><line x1="11" y1="31" x2="11" y2="53" /><line x1="61" y1="31" x2="61" y2="53" /></g>
      <polygon points="6,31 36,10 66,31" fill="#FFFFFF" stroke="#D3D0C2" strokeWidth="1.3" strokeLinejoin="round" />
      <polygon points="36,10 66,31 36,31" fill="#F0EEE7" /><line x1="36" y1="10" x2="36" y2="31" stroke="#E5E2D7" strokeWidth="1" /><circle cx="36" cy="10" r="1.9" fill={C.pine} />
      <path d="M6,31 L66,31 L66,37 q-5,5 -10,0 q-5,5 -10,0 q-5,5 -10,0 q-5,5 -10,0 q-5,5 -10,0 q-5,5 -10,0 Z" fill="#FFFFFF" stroke="#D3D0C2" strokeWidth="1.1" strokeLinejoin="round" />
      <line x1="6" y1="31" x2="66" y2="31" stroke={C.pine} strokeWidth="1.6" />
    </svg>
  );
}
function TruckSVG() {
  const stripes = [0, 2, 4, 6];
  return (
    <svg viewBox="0 0 124 76" width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <ellipse cx="62" cy="70" rx="52" ry="4.5" fill="rgba(0,0,0,.12)" />
      <circle cx="36" cy="62" r="10" fill="#24251F" /><circle cx="36" cy="62" r="4.3" fill="#9AA096" /><circle cx="92" cy="62" r="10" fill="#24251F" /><circle cx="92" cy="62" r="4.3" fill="#9AA096" />
      <rect x="8" y="22" width="108" height="34" rx="7" fill="#FFFFFF" stroke="#CFC9B8" strokeWidth="1.6" /><rect x="8" y="49" width="108" height="7" rx="3" fill={C.honey} opacity="0.92" />
      <path d="M12,30 L26,30 L26,42 L10,42 L10,34 Q10,30 12,30 Z" fill="#C6D8DF" stroke="#B4C4CB" strokeWidth="0.8" /><circle cx="11" cy="46" r="2" fill={C.honey} />
      <rect x="42" y="27" width="64" height="15" rx="2" fill="#2B3A32" /><rect x="40" y="44" width="68" height="3.5" rx="1.5" fill="#C99A5B" />
      <rect x="40" y="16" width="68" height="8" fill={C.honey} />{stripes.map((i) => <rect key={i} x={40 + i * 9.7} y="16" width="9.7" height="8" fill="#FFFFFF" opacity="0.85" />)}
      <path d="M40,24 q4.85,5 9.7,0 q4.85,5 9.7,0 q4.85,5 9.7,0 q4.85,5 9.7,0 q4.85,5 9.7,0 q4.85,5 9.7,0 q4.85,5 9.7,0" fill={C.honey} />
      <rect x="46" y="30" width="15" height="9" rx="1.5" fill="#1E2A25" /><g stroke="#5A6B60" strokeWidth="1"><line x1="49" y1="33" x2="58" y2="33" /><line x1="49" y1="36" x2="56" y2="36" /></g>
    </svg>
  );
}
function SampleVenue() {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width="800" height="500" fill="#DCE6D2" /><rect y="360" width="800" height="140" fill="#C9D9BD" /><rect x="0" y="150" width="800" height="70" fill="#B9C4AE" />
      <text x="24" y="140" fill="#7C8A70" fontFamily={FB} fontSize="15" fontWeight="700" opacity="0.8">PALMETTO AVE</text>
      {[120, 300, 470, 640].map((x) => (<g key={x}><circle cx={x} cy={410} r="26" fill="#8FB07C" /><rect x={x - 4} y={410} width="8" height="26" fill="#8A6A4A" /></g>))}
      <rect x="600" y="250" width="150" height="90" rx="8" fill="#CBBBA3" opacity="0.7" /><text x="675" y="300" textAnchor="middle" fill="#8A7A62" fontFamily={FB} fontSize="12" fontWeight="700">STAGE</text>
      <rect x="40" y="250" width="120" height="70" rx="8" fill="#CBBBA3" opacity="0.5" /><text x="100" y="290" textAnchor="middle" fill="#8A7A62" fontFamily={FB} fontSize="11" fontWeight="700">ENTRANCE</text>
    </svg>
  );
}

/* ================================================================== */
/*  Booth Map                                                          */
/* ================================================================== */
function BoothMapView({ spots, setSpots, venueImage, setVenueImage, approvedVendors, toast, marketName, savedLayouts, onSaveLayout, onLoadLayout, onDeleteLayout, onCheckIn }) {
  const canvasRef = useRef(null); const fileRef = useRef(null); const dragRef = useRef(null);
  const [interacting, setInteracting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const [layoutsOpen, setLayoutsOpen] = useState(false);
  const [layoutName, setLayoutName] = useState("");
  const viewRef = useRef(view); viewRef.current = view;
  const getRect = () => canvasRef.current.getBoundingClientRect();

  useEffect(() => {
    const el = canvasRef.current; if (!el) return;
    const onWheel = (e) => { e.preventDefault(); const rect = el.getBoundingClientRect(); const vr = viewRef.current; const cx = e.clientX - rect.left, cy = e.clientY - rect.top; const ns = clamp(vr.scale * (e.deltaY < 0 ? 1.12 : 0.893), 0.4, 5); setView({ scale: ns, tx: cx - ((cx - vr.tx) / vr.scale) * ns, ty: cy - ((cy - vr.ty) / vr.scale) * ns }); };
    el.addEventListener("wheel", onWheel, { passive: false }); return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (!interacting) return;
    const move = (e) => {
      const d = dragRef.current; if (!d) return; const rect = getRect(); const vr = viewRef.current;
      if (d.mode === "pan") { if (Math.abs(e.clientX - d.startClientX) > 3 || Math.abs(e.clientY - d.startClientY) > 3) d.moved = true; setView((v) => ({ ...v, tx: d.startTx + (e.clientX - d.startClientX), ty: d.startTy + (e.clientY - d.startClientY) })); return; }
      if (d.mode === "move") { const lx = (e.clientX - rect.left - vr.tx) / vr.scale, ly = (e.clientY - rect.top - vr.ty) / vr.scale; if (Math.abs(e.clientX - d.startClientX) > 3 || Math.abs(e.clientY - d.startClientY) > 3) d.moved = true; setSpots((ss) => ss.map((s) => (s.id === d.id ? { ...s, x: clamp(((lx - d.offX) / rect.width) * 100, -30, 125), y: clamp(((ly - d.offY) / rect.height) * 100, -30, 125) } : s))); return; }
      if (d.mode === "resize") { const dx = (e.clientX - d.startClientX) / vr.scale, dy = (e.clientY - d.startClientY) / vr.scale; const ldx = dx * Math.cos(d.rot) + dy * Math.sin(d.rot); const ldy = -dx * Math.sin(d.rot) + dy * Math.cos(d.rot); let nw = d.startW, nh = d.startH; if (d.axis !== "y") nw = clamp(d.startW + 2 * ldx, d.minW, MAXDIM); if (d.axis !== "x") nh = clamp(d.startH + 2 * ldy, d.minH, MAXDIM); setSpots((ss) => ss.map((s) => (s.id === d.id ? { ...s, w: Math.round(nw), h: Math.round(nh), x: ((d.cx - nw / 2) / rect.width) * 100, y: ((d.cy - nh / 2) / rect.height) * 100 } : s))); return; }
      if (d.mode === "rotate") { let ang = Math.atan2(e.clientY - d.csy, e.clientX - d.csx) * 180 / Math.PI + 90; ang = ((ang % 360) + 360) % 360; const near = Math.round(ang / 15) * 15; if (Math.abs(near - ang) < 4) ang = near % 360; setSpots((ss) => ss.map((s) => (s.id === d.id ? { ...s, rot: Math.round(ang) } : s))); }
    };
    const up = () => { const d = dragRef.current; if (d && d.mode === "move" && !d.moved) setSelectedId(d.id); if (d && d.mode === "pan" && !d.moved) setSelectedId(null); dragRef.current = null; setInteracting(false); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [interacting, setSpots]);

  const startPan = (e) => { dragRef.current = { mode: "pan", startTx: view.tx, startTy: view.ty, startClientX: e.clientX, startClientY: e.clientY, moved: false }; setInteracting(true); };
  const down = (e, s) => { e.stopPropagation(); const rect = getRect(); const vr = viewRef.current; const lx = (e.clientX - rect.left - vr.tx) / vr.scale, ly = (e.clientY - rect.top - vr.ty) / vr.scale; dragRef.current = { mode: "move", id: s.id, offX: lx - (s.x / 100) * rect.width, offY: ly - (s.y / 100) * rect.height, startClientX: e.clientX, startClientY: e.clientY, moved: false }; setInteracting(true); };
  const startResize = (e, s, axis) => { e.stopPropagation(); const rect = getRect(); dragRef.current = { mode: "resize", id: s.id, axis, startW: s.w, startH: s.h, rot: (s.rot || 0) * Math.PI / 180, cx: (s.x / 100) * rect.width + s.w / 2, cy: (s.y / 100) * rect.height + s.h / 2, minW: MINS[s.type].w, minH: MINS[s.type].h, startClientX: e.clientX, startClientY: e.clientY }; setInteracting(true); };
  const startRotate = (e, s) => { e.stopPropagation(); const rect = getRect(); const vr = viewRef.current; const cxL = (s.x / 100) * rect.width + s.w / 2, cyL = (s.y / 100) * rect.height + s.h / 2; dragRef.current = { mode: "rotate", id: s.id, csx: rect.left + vr.tx + cxL * vr.scale, csy: rect.top + vr.ty + cyL * vr.scale }; setInteracting(true); };
  const setDim = (id, key, delta) => setSpots((ss) => ss.map((s) => (s.id === id ? { ...s, [key]: clamp(s[key] + delta, MINS[s.type][key], MAXDIM) } : s)));
  const rotateBy = (id, d) => setSpots((ss) => ss.map((s) => (s.id === id ? { ...s, rot: (((s.rot || 0) + d) % 360 + 360) % 360 } : s)));
  const setRot = (id, v) => setSpots((ss) => ss.map((s) => (s.id === id ? { ...s, rot: v } : s)));
  const addSpot = (type) => { const id = "s" + Date.now(); const n = spots.filter((s) => s.type === type).length; setSpots((ss) => [...ss, { id, type, x: 42 + (n % 3) * 6, y: 32 + (n % 3) * 6, vId: null, w: DEFAULT[type].w, h: DEFAULT[type].h, rot: 0 }]); setSelectedId(id); toast(type === "tent" ? "Tent added" : "Truck added"); };
  const removeSpot = (id) => { setSpots((ss) => ss.filter((s) => s.id !== id)); setSelectedId(null); };
  const assign = (spotId, vId) => { setSpots((ss) => ss.map((s) => (s.vId === vId ? { ...s, vId: null } : s)).map((s) => (s.id === spotId ? { ...s, vId } : s))); toast("Vendor assigned"); };
  const unassign = (spotId) => setSpots((ss) => ss.map((s) => (s.id === spotId ? { ...s, vId: null } : s)));
  const onUpload = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { setVenueImage(r.result); setView({ scale: 1, tx: 0, ty: 0 }); toast("Map uploaded — scroll to zoom, drag to move"); }; r.readAsDataURL(f); };
  const zoomBtn = (dir) => { const rect = getRect(); const vr = viewRef.current; const cx = rect.width / 2, cy = rect.height / 2; const ns = clamp(vr.scale * (dir > 0 ? 1.2 : 0.833), 0.4, 5); setView({ scale: ns, tx: cx - ((cx - vr.tx) / vr.scale) * ns, ty: cy - ((cy - vr.ty) / vr.scale) * ns }); };
  const resetView = () => setView({ scale: 1, tx: 0, ty: 0 });

  const codes = {}; let bt = 0, ft = 0; spots.forEach((s) => { codes[s.id] = s.type === "tent" ? "B" + (++bt) : "F" + (++ft); });
  const selected = spots.find((s) => s.id === selectedId);
  const handleStyle = (cursor, pos) => ({ position: "absolute", width: 13, height: 13, background: C.honey, border: "2px solid #fff", borderRadius: 4, cursor, boxShadow: "0 1px 3px rgba(0,0,0,.35)", zIndex: 6, ...pos });

  return (
    <div className="flex gap-5 h-full">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button onClick={() => fileRef.current?.click()} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:shadow-sm"><Upload size={15} /> Upload map</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
          <button onClick={() => addSpot("tent")} style={{ background: C.pine, color: "#fff" }} className="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-90"><Tent size={15} /> Add tent</button>
          <button onClick={() => addSpot("truck")} style={{ background: C.honey, color: C.pineDeep }} className="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-90"><Truck size={15} /> Add truck</button>
          <button onClick={onCheckIn} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:shadow-sm"><Printer size={15} /> Check-in sheet</button>
          <div className="flex-1" />
          <div className="relative">
            <button onClick={() => setLayoutsOpen((o) => !o)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:shadow-sm"><Layers size={15} /> Layouts{savedLayouts.length > 0 && <span style={{ background: C.pine, color: "#fff" }} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full">{savedLayouts.length}</span>}</button>
            {layoutsOpen && (<>
              <div className="fixed inset-0 z-10" onClick={() => setLayoutsOpen(false)} />
              <div style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 16px 40px -16px rgba(0,0,0,.35)", width: 300 }} className="absolute right-0 mt-1 rounded-xl p-3 z-20">
                <p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide mb-1.5">Save current setup</p>
                <div className="flex gap-2 mb-3">
                  <input value={layoutName} onChange={(e) => setLayoutName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && layoutName.trim()) { onSaveLayout(layoutName.trim()); setLayoutName(""); } }} placeholder="e.g. Standard Saturday" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none" />
                  <button onClick={() => { if (!layoutName.trim()) return; onSaveLayout(layoutName.trim()); setLayoutName(""); }} style={{ background: C.honey, color: C.pineDeep }} className="px-3 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1"><Save size={14} /> Save</button>
                </div>
                <p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide mb-1.5">Saved layouts · {marketName}</p>
                {savedLayouts.length === 0 ? <p style={{ color: C.faint }} className="text-[12px] py-1 leading-relaxed">None yet — save this setup to reuse it next week.</p> : (
                  <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 220 }}>
                    {savedLayouts.map((l) => (
                      <div key={l.id} style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-lg p-2 flex items-center gap-2">
                        <div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold truncate">{l.name}</p><p style={{ color: C.faint }} className="text-[10.5px]">{l.spots.length} spots · {new Date(l.savedAt).toLocaleDateString()}</p></div>
                        <button onClick={() => { onLoadLayout(l.id); setLayoutsOpen(false); }} style={{ background: C.pine, color: "#fff" }} className="px-2.5 py-1.5 rounded-md text-[11.5px] font-bold flex items-center gap-1 hover:opacity-90"><FolderOpen size={12} /> Load</button>
                        <button onClick={() => onDeleteLayout(l.id)} style={{ color: C.danger }} className="p-1.5 rounded-md hover:bg-white"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>)}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-lg flex items-center overflow-hidden">
            <button onClick={() => zoomBtn(-1)} className="px-2.5 py-2 hover:bg-black/5"><ZoomOut size={15} color={C.ink} /></button>
            <span style={{ borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }} className="px-2 text-[12px] font-bold w-[52px] text-center">{Math.round(view.scale * 100)}%</span>
            <button onClick={() => zoomBtn(1)} className="px-2.5 py-2 hover:bg-black/5"><ZoomIn size={15} color={C.ink} /></button>
            <button onClick={resetView} style={{ borderLeft: `1px solid ${C.line}` }} className="px-2.5 py-2 hover:bg-black/5"><Maximize2 size={14} color={C.ink} /></button>
          </div>
          {venueImage && <button onClick={() => { setVenueImage(null); resetView(); }} style={{ color: C.sub }} className="text-[12px] font-semibold px-1 py-2 hover:underline">Remove map</button>}
        </div>

        <div ref={canvasRef} onPointerDown={startPan} style={{ background: C.paper2, border: `1px solid ${C.line}`, position: "relative", flex: 1, minHeight: 440, borderRadius: 16, overflow: "hidden", touchAction: "none", cursor: "grab" }}>
          <div style={{ position: "absolute", inset: 0, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: "0 0" }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{venueImage ? <img src={venueImage} draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }} /> : <SampleVenue />}</div>
            {spots.map((s) => {
              const v = s.vId ? approvedVendors.find((x) => x.id === s.vId) : null; const isTruck = s.type === "truck"; const isSel = s.id === selectedId; const accent = isTruck ? C.honey : C.pine;
              return (
                <div key={s.id} onPointerDown={(e) => down(e, s)} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.w, height: s.h, transform: `rotate(${s.rot || 0}deg)`, transformOrigin: "center", cursor: "grab", userSelect: "none", touchAction: "none", outline: isSel ? `2px dashed ${C.honey}` : "none", outlineOffset: 3, zIndex: isSel ? 5 : 1 }}>
                  {isTruck ? <TruckSVG /> : <TentSVG />}
                  <span style={{ position: "absolute", top: -7, left: -4, background: accent, color: "#fff", fontSize: 8.5, fontWeight: 800, padding: "1px 5px", borderRadius: 6, boxShadow: "0 1px 2px rgba(0,0,0,.25)", pointerEvents: "none" }}>{codes[s.id]}</span>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", paddingTop: isTruck ? 4 : 8 }}>
                    {v ? (<><div style={{ background: "rgba(255,255,255,.96)", borderRadius: 8, padding: "1px 5px", boxShadow: "0 1px 3px rgba(0,0,0,.22)", lineHeight: 1 }}><span style={{ fontSize: clamp(Math.min(s.w, s.h) * 0.34, 12, 26) }}>{v.emoji}</span></div>{s.w >= 58 && s.h >= 40 && <span style={{ marginTop: 2, background: C.pineDeep, color: "#fff", fontSize: 8.5, fontWeight: 700, padding: "1px 5px", borderRadius: 6, maxWidth: s.w - 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name.split(" ")[0]}</span>}</>) : <span style={{ background: "rgba(255,255,255,.9)", color: C.faint, fontSize: 8.5, fontWeight: 700, padding: "1px 6px", borderRadius: 6 }}>Open</span>}
                  </div>
                  {isSel && (<>
                    <div onPointerDown={(e) => startRotate(e, s)} style={{ position: "absolute", left: "50%", top: -26, transform: "translateX(-50%)", zIndex: 6 }}><div style={{ width: 2, height: 18, background: C.honey, margin: "0 auto" }} /><div style={{ width: 15, height: 15, background: C.card, border: `2px solid ${C.honey}`, borderRadius: "50%", cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center", marginTop: -1 }}><RotateCw size={9} color={C.honeyDeep} /></div></div>
                    <div onPointerDown={(e) => startResize(e, s, "x")} style={handleStyle("ew-resize", { right: -8, top: "50%", marginTop: -6 })} />
                    <div onPointerDown={(e) => startResize(e, s, "y")} style={handleStyle("ns-resize", { bottom: -8, left: "50%", marginLeft: -6 })} />
                    <div onPointerDown={(e) => startResize(e, s, "xy")} style={handleStyle("nwse-resize", { right: -8, bottom: -8 })} />
                  </>)}
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(255,255,255,.92)", border: `1px solid ${C.line}` }} className="rounded-lg px-3 py-2 flex items-center gap-3 text-[11px] font-semibold"><span className="flex items-center gap-1.5" style={{ color: C.sub }}><Tent size={13} color={C.pine} /> Tent</span><span className="flex items-center gap-1.5" style={{ color: C.sub }}><Truck size={13} color={C.honeyDeep} /> Truck</span></div>
        </div>
        <p style={{ color: C.faint }} className="text-[11.5px] mt-2 flex items-center gap-1.5"><Move size={12} /> Drag to pan · scroll to zoom · click a spot to resize (edges) & rotate (top handle). <b style={{ color: C.sub }}>&nbsp;{marketName}</b>&nbsp;· new dates reuse this layout with vendors cleared.</p>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, width: 296 }} className="rounded-2xl p-4 flex flex-col flex-shrink-0">
        {selected ? (<>
          <div className="flex items-center justify-between mb-3"><span style={{ fontFamily: FD, fontWeight: 600 }} className="text-[16px] flex items-center gap-2">{selected.type === "truck" ? <Truck size={17} color={C.honey} /> : <Tent size={17} color={C.pine} />} Spot {codes[selected.id]}</span><button onClick={() => removeSpot(selected.id)} style={{ color: C.danger }} className="p-1.5 rounded-lg hover:bg-white"><Trash2 size={16} /></button></div>
          <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-xl p-3 mb-3">
            <p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide mb-2">Size & rotation</p>
            {[["Width", "w"], ["Height", "h"]].map(([label, key]) => (<div key={key} className="flex items-center gap-2 mb-2"><span style={{ color: C.sub }} className="text-[12px] font-semibold w-12">{label}</span><button onClick={() => setDim(selected.id, key, -8)} style={{ background: C.paper2 }} className="w-6 h-6 rounded-md flex items-center justify-center"><Minus size={12} color={C.ink} /></button><span style={{ fontFamily: FD, flex: 1, textAlign: "center" }} className="text-[13px] font-semibold">{selected[key]} px</span><button onClick={() => setDim(selected.id, key, 8)} style={{ background: C.paper2 }} className="w-6 h-6 rounded-md flex items-center justify-center"><Plus size={12} color={C.ink} /></button></div>))}
            <div className="flex items-center gap-2 pt-1" style={{ borderTop: `1px solid ${C.line}` }}><span style={{ color: C.sub }} className="text-[12px] font-semibold w-12 mt-2">Rotate</span><button onClick={() => rotateBy(selected.id, -15)} style={{ background: C.paper2 }} className="w-6 h-6 rounded-md flex items-center justify-center mt-2"><RotateCcw size={12} color={C.ink} /></button><span style={{ fontFamily: FD, flex: 1, textAlign: "center" }} className="text-[13px] font-semibold mt-2">{Math.round(selected.rot || 0)}°</span><button onClick={() => rotateBy(selected.id, 15)} style={{ background: C.paper2 }} className="w-6 h-6 rounded-md flex items-center justify-center mt-2"><RotateCw size={12} color={C.ink} /></button><button onClick={() => setRot(selected.id, 0)} style={{ background: C.paper2, color: C.sub }} className="text-[10px] font-bold px-2 h-6 rounded-md mt-2">0°</button></div>
          </div>
          {selected.vId ? (<div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-xl p-3 mb-3">{(() => { const v = approvedVendors.find((x) => x.id === selected.vId); return v ? <div className="flex items-center gap-2"><VAvatar v={v} /><div className="flex-1 min-w-0"><p className="text-[13px] font-semibold truncate">{v.name}</p><p style={{ color: C.sub }} className="text-[11px] truncate">{v.cat}</p></div><button onClick={() => unassign(selected.id)} style={{ color: C.sub }} className="text-[11px] font-bold hover:underline">Remove</button></div> : null; })()}</div>) : <p style={{ color: C.sub }} className="text-[12.5px] mb-3">Assign an approved vendor:</p>}
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-2">Approved for this market</p>
          <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 200 }}>
            {approvedVendors.length === 0 && <p style={{ color: C.faint }} className="text-[12px]">Approve vendors in Payments to place them here.</p>}
            {approvedVendors.map((v) => { const here = selected.vId === v.id; const elsewhere = spots.some((s) => s.vId === v.id && s.id !== selected.id); return (<button key={v.id} onClick={() => assign(selected.id, v.id)} disabled={here} style={{ background: here ? C.sageSoft : C.card, border: `1px solid ${C.line}` }} className="rounded-lg p-2 flex items-center gap-2 text-left hover:shadow-sm"><VAvatar v={v} size={30} /><div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold truncate">{v.name}</p><p style={{ color: C.faint }} className="text-[10.5px] truncate">{elsewhere ? "Placed elsewhere — moves here" : v.cat}</p></div>{here ? <Check size={15} color={C.pine} /> : <Plus size={15} color={C.faint} />}</button>); })}
          </div>
        </>) : (<div className="flex flex-col items-center text-center justify-center flex-1 px-2"><div style={{ background: C.paper2 }} className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"><MapIcon size={22} color={C.faint} /></div><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px]">Build your layout</p><p style={{ color: C.sub }} className="text-[12px] mt-1 leading-relaxed">Upload the venue, drop tents & trucks, resize and rotate, then assign vendors approved for this market.</p></div>)}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Approvals & Payments                                               */
/* ================================================================== */
function ApprovalRow({ a, market, now, approve, setDisc, remind, hold, unhold, openPay, release }) {
  const v = VENDORS[a.vId]; const base = baseFee(a, market); const fee = feeOf(a, market);
  const remaining = a.deadline ? a.deadline - now : 0; const overdue = a.status === "AwaitingPayment" && remaining <= 0;
  const showDisc = a.status === "Pending" || a.status === "AwaitingPayment" || a.status === "Held";
  const setType = (t) => setDisc(a.id, { discType: a.discType === t ? "none" : t, discVal: a.discType === t ? 0 : (a.discVal || (t === "percent" ? 10 : 10)) });
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-xl p-3">
      <div className="flex items-center gap-3">
        <VAvatar v={v} size={38} r={11} />
        <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><p className="text-[13.5px] font-semibold truncate">{v.name}</p><BadgeCheck size={13} color={C.pine} /></div><p style={{ color: C.sub }} className="text-[11.5px] truncate">{v.cat} · {isTruckV(v) ? "Food truck" : "10×10 tent"}{a.reminders > 0 && <span> · {a.reminders} reminder{a.reminders > 1 ? "s" : ""} sent</span>}</p></div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {a.status === "Pending" && <button onClick={() => approve(a.id)} style={{ background: C.pine, color: "#fff" }} className="px-4 py-2 rounded-full text-[12.5px] font-bold flex items-center gap-1.5 hover:opacity-90"><Check size={14} /> Approve</button>}
          {a.status === "AwaitingPayment" && !overdue && <Pill bg={C.honeySoft} fg={C.honeyDeep}><Clock size={12} /> {fmtRemaining(remaining)}</Pill>}
          {a.status === "AwaitingPayment" && overdue && <Pill bg={C.dangerSoft} fg={C.danger}><AlertTriangle size={12} /> Overdue</Pill>}
          {a.status === "Held" && <Pill bg={C.berrySoft} fg={C.berry}><PauseCircle size={12} /> Held</Pill>}
          {a.status === "Paid" && <Pill bg={C.sageSoft} fg={C.pine}><Check size={12} /> Paid · {METHOD_META[a.method]?.label || "—"}</Pill>}
          {a.status === "Released" && <Pill bg={C.paper2} fg={C.sub}>Released</Pill>}
          {(a.status === "AwaitingPayment" || a.status === "Held") && (<>
            <button onClick={() => remind(a.id)} title="Send reminder" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.honeyDeep }} className="px-2.5 py-2 rounded-full text-[12px] font-bold flex items-center gap-1 hover:shadow-sm"><BellRing size={13} /></button>
            {a.status === "AwaitingPayment" ? <button onClick={() => hold(a.id)} title="Hold spot" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.berry }} className="px-2.5 py-2 rounded-full text-[12px] font-bold flex items-center gap-1 hover:shadow-sm"><PauseCircle size={13} /> Hold</button>
              : <button onClick={() => unhold(a.id)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.pine }} className="px-2.5 py-2 rounded-full text-[12px] font-bold hover:shadow-sm">Release hold</button>}
            <button onClick={() => openPay(a.vId)} style={{ background: C.honey, color: C.pineDeep }} className="px-3.5 py-2 rounded-full text-[12.5px] font-bold flex items-center gap-1.5"><Eye size={13} /> Pay page</button>
          </>)}
        </div>
      </div>
      {showDisc && (
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 flex-wrap" style={{ borderTop: `1px solid ${C.line}` }}>
          <span style={{ color: C.faint }} className="text-[11px] font-bold uppercase tracking-wide">Fee</span>
          {a.discType !== "none" && <span style={{ color: C.faint, textDecoration: "line-through" }} className="text-[12px]">{money(base)}</span>}
          <span style={{ fontFamily: FD }} className="text-[15px] font-bold">{money(fee)}</span>
          <div className="flex-1" />
          <span style={{ color: C.sub }} className="text-[11px] font-semibold">Discount:</span>
          <div style={{ background: C.paper2 }} className="p-0.5 rounded-lg flex">
            <button onClick={() => setType("amount")} style={{ background: a.discType === "amount" ? C.card : "transparent", color: a.discType === "amount" ? C.ink : C.sub }} className="px-2 py-1 rounded-md text-[12px] font-bold flex items-center gap-0.5"><DollarSign size={11} /></button>
            <button onClick={() => setType("percent")} style={{ background: a.discType === "percent" ? C.card : "transparent", color: a.discType === "percent" ? C.ink : C.sub }} className="px-2 py-1 rounded-md text-[12px] font-bold flex items-center gap-0.5"><Percent size={11} /></button>
          </div>
          <input type="number" min="0" value={a.discVal || 0} onChange={(e) => setDisc(a.id, { discVal: parseFloat(e.target.value) || 0, discType: a.discType === "none" ? "amount" : a.discType })} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, width: 60 }} className="px-2 py-1.5 rounded-lg text-[12.5px] font-semibold outline-none text-center" />
          {a.discType !== "none" && <button onClick={() => setDisc(a.id, { discType: "none", discVal: 0 })} style={{ color: C.faint }} className="p-1"><X size={13} /></button>}
        </div>
      )}
    </div>
  );
}
function PaymentsView({ approvals, market, now, approve, setDisc, remind, hold, unhold, openPay, release, remindAll, toast }) {
  const rows = approvals;
  const paid = rows.filter((a) => a.status === "Paid");
  const collected = paid.reduce((s, a) => s + feeOf(a, market), 0);
  const awaiting = rows.filter((a) => a.status === "AwaitingPayment");
  const held = rows.filter((a) => a.status === "Held");
  const pending = rows.filter((a) => a.status === "Pending");
  const settled = rows.filter((a) => a.status === "Paid" || a.status === "Released");
  const stat = (label, val, tone) => <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4"><p style={{ fontFamily: FD, fontWeight: 600, color: tone }} className="text-[23px] leading-none">{val}</p><p style={{ color: C.sub }} className="text-[12px] mt-1">{label}</p></div>;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">{stat("Collected", money(collected), C.pine)}{stat("Awaiting payment", awaiting.length, C.honeyDeep)}{stat("Held", held.length, C.berry)}{stat("Applications", pending.length, C.pine)}</div>
      <div style={{ background: C.honeySoft, border: `1px solid ${C.honey}` }} className="rounded-2xl p-4 flex items-center gap-3">
        <Clock size={20} color={C.honeyDeep} />
        <div className="flex-1"><p style={{ color: C.honeyDeep }} className="text-[13px] font-bold">Approve → payment link → 24-hour hold</p><p style={{ color: C.honeyDeep }} className="text-[12px]">Reminders nudge unpaid vendors. Manually <b>Hold</b> a spot to keep it past the deadline. Otherwise unpaid spots return to rotation.</p></div>
        {awaiting.length > 0 && <button onClick={remindAll} style={{ background: C.card, border: `1px solid ${C.honey}`, color: C.honeyDeep }} className="px-3 py-2 rounded-full text-[11.5px] font-bold whitespace-nowrap hover:bg-white flex items-center gap-1"><BellRing size={13} /> Remind all</button>}
        <button onClick={release} style={{ background: C.card, border: `1px solid ${C.honey}`, color: C.honeyDeep }} className="px-3 py-2 rounded-full text-[11.5px] font-bold whitespace-nowrap hover:bg-white">Simulate 24h lapse</button>
      </div>
      {pending.length > 0 && <Section label="New applications · approve to send payment link">{pending.map((a) => <ApprovalRow key={a.id} {...{ a, market, now, approve, setDisc, remind, hold, unhold, openPay, release }} />)}</Section>}
      {awaiting.length > 0 && <Section label="Awaiting payment · hold active">{awaiting.map((a) => <ApprovalRow key={a.id} {...{ a, market, now, approve, setDisc, remind, hold, unhold, openPay, release }} />)}</Section>}
      {held.length > 0 && <Section label="Held by you · spot reserved">{held.map((a) => <ApprovalRow key={a.id} {...{ a, market, now, approve, setDisc, remind, hold, unhold, openPay, release }} />)}</Section>}
      {settled.length > 0 && <Section label="Settled">{settled.map((a) => <ApprovalRow key={a.id} {...{ a, market, now, approve, setDisc, remind, hold, unhold, openPay, release }} />)}</Section>}
    </div>
  );
}
function Section({ label, children }) {
  return <div><p style={{ color: C.faint }} className="text-[11px] font-bold uppercase tracking-wide mb-2">{label}</p><div className="flex flex-col gap-2.5">{children}</div></div>;
}

/* ================================================================== */
/*  Vendor checkout (multi-market, multi-method)                       */
/* ================================================================== */
function PaymentModal({ vId, approvals, marketsById, now, onPay, onClose }) {
  const vendor = VENDORS[vId];
  const owed = approvals.filter((a) => a.vId === vId && (a.status === "AwaitingPayment" || a.status === "Held"));
  const [selected, setSelected] = useState(() => owed.map((a) => a.id));
  const acceptedUnion = Array.from(new Set(owed.filter((a) => selected.includes(a.id)).flatMap((a) => marketsById[a.marketId].methods)));
  const methods = METHOD_ORDER.filter((m) => acceptedUnion.includes(m));
  const [method, setMethod] = useState(methods[0] || "stripe");
  useEffect(() => { if (!methods.includes(method)) setMethod(methods[0] || "stripe"); }, [selected.length]);

  const chosen = owed.filter((a) => selected.includes(a.id));
  const subtotal = chosen.reduce((s, a) => s + feeOf(a, marketsById[a.marketId]), 0);
  const platform = chosen.length * PLATFORM_FEE;
  const total = subtotal + platform;
  const meta = METHOD_META[method];
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,32,28,.55)", zIndex: 60 }} className="flex items-center justify-center p-4 overflow-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, width: 480, maxWidth: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 70px -20px rgba(0,0,0,.5)", margin: "auto" }}>
        <div style={{ background: C.pineDeep }} className="px-5 py-4 flex items-center justify-between"><div className="flex items-center gap-2"><div style={{ background: "rgba(255,255,255,.14)" }} className="w-7 h-7 rounded-lg flex items-center justify-center"><Store size={15} color={C.honey} /></div><span style={{ fontFamily: FD, fontWeight: 600 }} className="text-white text-[15px]">MarketHub Checkout</span></div><button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button></div>
        <div className="p-5">
          {owed.length === 0 ? (
            <div className="text-center py-6"><div style={{ background: C.sageSoft }} className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"><Check size={28} color={C.pine} /></div><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[19px]">All paid up</p><p style={{ color: C.sub }} className="text-[13px] mt-1">{vendor.name} has no outstanding booth fees.</p></div>
          ) : (<>
            <div className="flex items-center gap-2.5 mb-3"><VAvatar v={vendor} size={40} r={12} /><div><p className="text-[15px] font-semibold">{vendor.name}</p><p style={{ color: C.sub }} className="text-[11.5px]">Choose which markets to pay for</p></div></div>
            <div className="flex flex-col gap-2 mb-4">
              {owed.map((a) => { const m = marketsById[a.marketId]; const on = selected.includes(a.id); const fee = feeOf(a, m); const rem = a.deadline ? a.deadline - now : null; return (
                <button key={a.id} onClick={() => toggle(a.id)} style={{ background: on ? C.panel : C.card, border: `1.5px solid ${on ? C.pine : C.line}` }} className="rounded-xl p-3 flex items-center gap-3 text-left">
                  <div style={{ background: on ? C.pine : C.card, border: `1.5px solid ${on ? C.pine : C.line}` }} className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0">{on && <Check size={13} color="#fff" />}</div>
                  <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold truncate">{m.name}</p><p style={{ color: C.sub }} className="text-[11px]">{m.date} · {isTruckV(vendor) ? "Food truck" : "10×10 tent"}{a.status === "Held" ? " · held for you" : rem != null && rem > 0 ? ` · ${fmtRemaining(rem)} left` : ""}</p></div>
                  <span style={{ fontFamily: FD }} className="text-[14px] font-bold">{money(fee)}</span>
                </button>); })}
            </div>
            <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-2">Payment method</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {methods.map((m) => { const on = method === m; return (<button key={m} onClick={() => setMethod(m)} style={{ background: on ? C.panel : C.card, border: `1.5px solid ${on ? C.pine : C.line}` }} className="rounded-xl p-2.5 flex flex-col items-center gap-1 hover:shadow-sm"><MethodMark id={m} size={26} /><span className="text-[11px] font-semibold">{METHOD_META[m].label}</span></button>); })}
            </div>
            {meta?.kind === "handle" && <div style={{ background: C.honeySoft, border: `1px solid ${C.honey}` }} className="rounded-lg p-2.5 mb-3 text-[11.5px] flex items-center gap-2" ><Wallet size={14} color={C.honeyDeep} /><span style={{ color: C.honeyDeep }}>Send {money(total)} via {meta.label} to <b>{meta.handle}</b>, then confirm below.</span></div>}
            <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-xl p-3 mb-4 text-[13px] flex flex-col gap-1.5">
              <div className="flex justify-between"><span style={{ color: C.sub }}>Booth fees ({chosen.length})</span><span className="font-semibold">{money(subtotal)}</span></div>
              <div className="flex justify-between"><span style={{ color: C.sub }}>Platform fees</span><span className="font-semibold">{money(platform)}</span></div>
              <div className="flex justify-between pt-1.5" style={{ borderTop: `1px solid ${C.line}` }}><span className="font-bold">Total</span><span style={{ fontFamily: FD }} className="text-[16px] font-bold">{money(total)}</span></div>
            </div>
            <button onClick={() => onPay(selected, method)} disabled={chosen.length === 0} style={{ background: chosen.length ? C.honey : C.paper2, color: chosen.length ? C.pineDeep : C.faint }} className="w-full rounded-full py-3.5 font-bold text-[15px] flex items-center justify-center gap-2 hover:opacity-90">{meta?.kind === "handle" ? `Confirm ${meta.label} payment` : `Pay ${money(total)} with ${meta?.label}`} <ArrowRight size={17} /></button>
            <p style={{ color: C.faint }} className="text-[11px] text-center mt-2">Secured by MarketHub · demo checkout</p>
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Reports (financials)                                               */
/* ================================================================== */
function ReportsView({ approvals, markets, marketsById, toast }) {
  const [filter, setFilter] = useState("all");
  const rows = filter === "all" ? approvals : approvals.filter((a) => a.marketId === filter);
  const paid = rows.filter((a) => a.status === "Paid");
  const collected = paid.reduce((s, a) => s + feeOf(a, marketsById[a.marketId]), 0);
  const outstanding = rows.filter((a) => a.status === "AwaitingPayment" || a.status === "Held").reduce((s, a) => s + feeOf(a, marketsById[a.marketId]), 0);
  const discounts = rows.filter((a) => a.discType !== "none" && a.status !== "Released").reduce((s, a) => { const m = marketsById[a.marketId]; return s + discAmount(a, baseFee(a, m)); }, 0);
  const platform = paid.length * PLATFORM_FEE;
  const net = collected - platform;

  const byMarket = markets.map((m) => ({ m, val: approvals.filter((a) => a.marketId === m.id && a.status === "Paid").reduce((s, a) => s + feeOf(a, m), 0) })).filter((x) => filter === "all" || x.m.id === filter);
  const maxMarket = Math.max(1, ...byMarket.map((x) => x.val));
  const byMethod = METHOD_ORDER.map((mid) => ({ mid, val: paid.filter((a) => a.method === mid).reduce((s, a) => s + feeOf(a, marketsById[a.marketId]), 0) })).filter((x) => x.val > 0);
  const maxMethod = Math.max(1, ...byMethod.map((x) => x.val));

  const card = (label, val, tone, Icon) => <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4"><div style={{ background: C.paper2 }} className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"><Icon size={16} color={tone} /></div><p style={{ fontFamily: FD, fontWeight: 600, color: tone }} className="text-[22px] leading-none">{val}</p><p style={{ color: C.sub }} className="text-[12px] mt-1">{label}</p></div>;
  const statusPill = (st) => { const map = { Paid: [C.sageSoft, C.pine], AwaitingPayment: [C.honeySoft, C.honeyDeep], Held: [C.berrySoft, C.berry], Released: [C.paper2, C.sub], Pending: [C.paper2, C.sub] }; const [bg, fg] = map[st] || map.Pending; return <Pill bg={bg} fg={fg}>{st === "AwaitingPayment" ? "Awaiting" : st}</Pill>; };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilter("all")} style={{ background: filter === "all" ? C.pine : C.card, color: filter === "all" ? "#fff" : C.sub, border: `1px solid ${filter === "all" ? C.pine : C.line}` }} className="text-[12px] font-semibold px-3 py-1.5 rounded-full">All markets</button>
        {markets.map((m) => <button key={m.id} onClick={() => setFilter(m.id)} style={{ background: filter === m.id ? C.pine : C.card, color: filter === m.id ? "#fff" : C.sub, border: `1px solid ${filter === m.id ? C.pine : C.line}` }} className="text-[12px] font-semibold px-3 py-1.5 rounded-full">{m.short}</button>)}
        <div className="flex-1" />
        <button onClick={() => toast("Financials exported to CSV")} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3.5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:shadow-sm"><Download size={15} /> Export CSV</button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {card("Collected", money(collected), C.pine, DollarSign)}
        {card("Outstanding", money(outstanding), C.honeyDeep, Clock)}
        {card("Discounts given", money(discounts), C.berry, Percent)}
        {card("Processing fees", money(platform), C.sub, CreditCard)}
        {card("Net payout", money(net), C.pine, TrendingUp)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
          <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] mb-3 flex items-center gap-2"><BarChart3 size={16} color={C.pine} /> Collected by market</p>
          <div className="flex flex-col gap-2.5">{byMarket.map(({ m, val }) => (<div key={m.id}><div className="flex justify-between text-[12px] mb-1"><span className="font-semibold">{m.short}</span><span style={{ color: C.sub }}>{money(val)}</span></div><div style={{ background: C.paper2 }} className="h-2.5 rounded-full overflow-hidden"><div style={{ width: `${val / maxMarket * 100}%`, background: C.pine }} className="h-full rounded-full" /></div></div>))}</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
          <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] mb-3 flex items-center gap-2"><Wallet size={16} color={C.pine} /> Collected by method</p>
          {byMethod.length === 0 ? <p style={{ color: C.faint }} className="text-[12.5px]">No payments recorded yet for this view.</p> : <div className="flex flex-col gap-2.5">{byMethod.map(({ mid, val }) => (<div key={mid}><div className="flex justify-between items-center text-[12px] mb-1"><span className="font-semibold flex items-center gap-1.5"><MethodMark id={mid} size={18} r={5} /> {METHOD_META[mid].label}</span><span style={{ color: C.sub }}>{money(val)}</span></div><div style={{ background: C.paper2 }} className="h-2.5 rounded-full overflow-hidden"><div style={{ width: `${val / maxMethod * 100}%`, background: METHOD_META[mid].color }} className="h-full rounded-full" /></div></div>))}</div>}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
        <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] mb-3">Transactions</p>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 620 }}>
            <div className="grid text-[10.5px] font-bold uppercase tracking-wide pb-2" style={{ gridTemplateColumns: "1.6fr 1.2fr .8fr .9fr 1fr 1fr", color: C.faint, borderBottom: `1px solid ${C.line}` }}><span>Vendor</span><span>Market</span><span>Base</span><span>Discount</span><span>Fee</span><span>Method / status</span></div>
            {rows.map((a) => { const m = marketsById[a.marketId]; const v = VENDORS[a.vId]; const base = baseFee(a, m); const d = discAmount(a, base); return (
              <div key={a.id} className="grid items-center text-[12.5px] py-2" style={{ gridTemplateColumns: "1.6fr 1.2fr .8fr .9fr 1fr 1fr", borderBottom: `1px solid ${C.line}` }}>
                <span className="flex items-center gap-2 min-w-0"><VAvatar v={v} size={24} r={7} /><span className="truncate font-semibold">{v.name}</span></span>
                <span style={{ color: C.sub }} className="truncate">{m.short}</span>
                <span style={{ color: C.sub }}>{money(base)}</span>
                <span style={{ color: d > 0 ? C.berry : C.faint }}>{d > 0 ? "−" + money(d) : "—"}</span>
                <span className="font-semibold">{money(feeOf(a, m))}</span>
                <span>{a.status === "Paid" ? <span className="flex items-center gap-1.5"><MethodMark id={a.method} size={18} r={5} /><span style={{ color: C.pine }} className="text-[11px] font-bold">Paid</span></span> : statusPill(a.status)}</span>
              </div>); })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Markets settings (default pricing + accepted methods)              */
/* ================================================================== */
function CreateMarketModal({ onClose, onCreate }) {
  const [f, setF] = useState({ name: "", short: "", location: "", description: "", freq: "weekly", start: "", boothFee: "65", truckFee: "120", appFee: "10", methods: [...METHOD_ORDER] });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (m) => setF((p) => ({ ...p, methods: p.methods.includes(m) ? p.methods.filter((x) => x !== m) : [...p.methods, m] }));
  const ready = f.name.trim() && f.start;
  const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,32,28,.55)", zIndex: 60 }} className="flex items-center justify-center p-4 overflow-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, width: 540, maxWidth: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 70px -20px rgba(0,0,0,.5)", margin: "auto" }}>
        <div style={{ background: C.pineDeep }} className="px-5 py-4 flex items-center justify-between"><div className="flex items-center gap-2"><div style={{ background: "rgba(255,255,255,.14)" }} className="w-7 h-7 rounded-lg flex items-center justify-center"><Building2 size={15} color={C.honey} /></div><span style={{ fontFamily: FD, fontWeight: 600 }} className="text-white text-[15px]">New market</span></div><button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button></div>
        <div className="p-5 flex flex-col gap-3.5">
          <div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Market name</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Downtown Night Market — Orlando" style={inp} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[14px] outline-none" /></div>
          <div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Description</label><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="What makes this market great — attendance, vibe, location. Included in vendor invitation emails." style={{ ...inp, resize: "none" }} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[13.5px] leading-relaxed outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Short name</label><input value={f.short} onChange={(e) => set("short", e.target.value)} placeholder="Orlando" style={inp} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[14px] outline-none" /></div>
            <div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Location</label><input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Church St, Orlando" style={inp} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[14px] outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Schedule</label><select value={f.freq} onChange={(e) => set("freq", e.target.value)} style={inp} className="w-full mt-1 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold outline-none"><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option><option value="custom">Custom dates</option></select></div>
            <div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">First date</label><input type="date" value={f.start} onChange={(e) => set("start", e.target.value)} style={inp} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[13.5px] outline-none" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["Booth fee ($)", "boothFee"], ["Truck fee ($)", "truckFee"], ["Application ($)", "appFee"]].map(([label, key]) => (<div key={key}><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">{label}</label><input type="number" value={f[key]} onChange={(e) => set(key, e.target.value)} style={inp} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[14px] outline-none" /></div>))}
          </div>
          <div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Accepted payment methods</label>
            <div className="flex flex-wrap gap-2 mt-2">{METHOD_ORDER.map((m) => { const on = f.methods.includes(m); return (<button key={m} onClick={() => toggle(m)} style={{ background: on ? C.card : C.paper2, border: `1.5px solid ${on ? C.pine : C.line}`, opacity: on ? 1 : 0.55 }} className="rounded-lg px-2 py-1.5 flex items-center gap-1.5 hover:shadow-sm"><MethodMark id={m} size={20} r={6} /><span className="text-[11.5px] font-semibold">{METHOD_META[m].label}</span>{on && <Check size={13} color={C.pine} />}</button>); })}</div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, background: C.panel }} className="px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-4 py-2.5 rounded-lg text-[13px] font-semibold">Cancel</button>
          <button onClick={() => ready && onCreate(f)} disabled={!ready} style={{ background: ready ? C.honey : C.paper2, color: ready ? C.pineDeep : C.faint }} className="px-4 py-2.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5"><Check size={15} /> Create market</button>
        </div>
      </div>
    </div>
  );
}
function EditMarketModal({ market, onClose, onSave }) {
  const [f, setF] = useState({ name: market.name, short: market.short, location: market.location || "", description: market.description || "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,32,28,.55)", zIndex: 60 }} className="flex items-center justify-center p-4 overflow-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, width: 500, maxWidth: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 70px -20px rgba(0,0,0,.5)", margin: "auto" }}>
        <div style={{ background: C.pineDeep }} className="px-5 py-4 flex items-center justify-between"><div className="flex items-center gap-2"><div style={{ background: "rgba(255,255,255,.14)" }} className="w-7 h-7 rounded-lg flex items-center justify-center"><Pencil size={14} color={C.honey} /></div><span style={{ fontFamily: FD, fontWeight: 600 }} className="text-white text-[15px]">Edit market</span></div><button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button></div>
        <div className="p-5 flex flex-col gap-3.5">
          <div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Market name</label><input value={f.name} onChange={(e) => set("name", e.target.value)} style={inp} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[14px] outline-none" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Short name</label><input value={f.short} onChange={(e) => set("short", e.target.value)} style={inp} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[14px] outline-none" /></div><div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Location</label><input value={f.location} onChange={(e) => set("location", e.target.value)} style={inp} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[14px] outline-none" /></div></div>
          <div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Description</label><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ ...inp, resize: "none" }} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[13.5px] leading-relaxed outline-none" /></div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, background: C.panel }} className="px-5 py-3 flex justify-end gap-2"><button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-4 py-2.5 rounded-lg text-[13px] font-semibold">Cancel</button><button onClick={() => f.name.trim() && onSave({ name: f.name.trim(), short: f.short.trim() || f.name.trim(), location: f.location.trim(), description: f.description.trim() })} disabled={!f.name.trim()} style={{ background: f.name.trim() ? C.honey : C.paper2, color: f.name.trim() ? C.pineDeep : C.faint }} className="px-4 py-2.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5"><Check size={15} /> Save changes</button></div>
      </div>
    </div>
  );
}
function InviteVendorsModal({ market, onClose, toast }) {
  const nextDate = market.dates.find((d) => d.status !== "skipped") || market.dates[0];
  const [audience, setAudience] = useState("current");
  const currentList = Object.values(VENDORS).map((v) => ({ id: v.id, name: v.name, emoji: v.emoji, g1: v.g1, g2: v.g2 }));
  const list = audience === "current" ? currentList : LEADS;
  const [sel, setSel] = useState(() => new Set(currentList.map((x) => x.id)));
  useEffect(() => { setSel(new Set((audience === "current" ? currentList : LEADS).map((x) => x.id))); }, [audience]);
  const subject = `You're invited to sell at ${market.name} — ${nextDate.label}`;
  const bodyDefault = `Hi {first_name},\n\nWe'd love to have you as a vendor at ${market.name}${market.location ? ` (${market.location})` : ""} on ${nextDate.label}.\n\n${market.description || ""}\n\nBooth details:\n• 10×10 booth: ${money(market.boothFee)}   • Food truck: ${money(market.truckFee)}   • Application fee: ${money(market.appFee)}\n• Schedule: ${freqLabel(market.freq)}\n\nInterested? Apply in two minutes here: {apply_link}\n\n— Central Makers Markets`;
  const [body, setBody] = useState(bodyDefault);
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = list.length > 0 && list.every((x) => sel.has(x.id));
  const toggleAll = () => setSel(allOn ? new Set() : new Set(list.map((x) => x.id)));
  const count = list.filter((x) => sel.has(x.id)).length;
  const send = () => { toast(`Invitations sent to ${count} ${audience === "current" ? "vendors" : "leads"}`, "send"); onClose(); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,32,28,.55)", zIndex: 60 }} className="flex items-center justify-center p-4 overflow-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, width: 720, maxWidth: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 70px -20px rgba(0,0,0,.5)", margin: "auto" }}>
        <div style={{ background: C.pineDeep }} className="px-5 py-4 flex items-center justify-between"><div className="flex items-center gap-2"><div style={{ background: "rgba(255,255,255,.14)" }} className="w-7 h-7 rounded-lg flex items-center justify-center"><Mail size={14} color={C.honey} /></div><span style={{ fontFamily: FD, fontWeight: 600 }} className="text-white text-[15px]">Invite vendors — {market.short}</span></div><button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button></div>
        <div className="flex" style={{ maxHeight: 460 }}>
          {/* recipients */}
          <div style={{ borderRight: `1px solid ${C.line}`, width: 268 }} className="p-4 flex flex-col flex-shrink-0">
            <div style={{ background: C.paper2 }} className="p-1 rounded-full flex mb-3">{[["current", "Current vendors"], ["new", "New leads"]].map(([k, l]) => <button key={k} onClick={() => setAudience(k)} style={{ background: audience === k ? C.card : "transparent", color: audience === k ? C.ink : C.sub }} className="flex-1 py-1.5 rounded-full text-[12px] font-semibold">{l}</button>)}</div>
            <button onClick={toggleAll} style={{ color: C.pine }} className="text-[11.5px] font-bold text-left mb-2">{allOn ? "Clear all" : "Select all"} · {count} selected</button>
            <div className="flex flex-col gap-1.5 overflow-y-auto">{list.map((v) => { const on = sel.has(v.id); return (<button key={v.id} onClick={() => toggle(v.id)} style={{ background: on ? C.sageSoft : C.card, border: `1px solid ${C.line}` }} className="rounded-lg p-2 flex items-center gap-2 text-left"><div style={{ background: on ? C.pine : C.card, border: `1.5px solid ${on ? C.pine : C.line}` }} className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0">{on && <Check size={11} color="#fff" />}</div><VAvatar v={v} size={26} r={8} /><span className="text-[12px] font-semibold truncate">{v.name}</span></button>); })}</div>
          </div>
          {/* composer */}
          <div className="p-4 flex-1 min-w-0 flex flex-col overflow-y-auto">
            <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-xl p-3 mb-3">
              <p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide mb-1">Market details included</p>
              <p className="text-[12px]"><b>{market.name}</b> · {nextDate.label}{market.location ? ` · ${market.location}` : ""}</p>
              <p style={{ color: C.sub }} className="text-[11.5px] mt-1">Booth {money(market.boothFee)} · Truck {money(market.truckFee)} · App {money(market.appFee)} · {freqLabel(market.freq)}</p>
            </div>
            <label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Subject</label>
            <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-lg px-3 py-2.5 text-[13.5px] font-semibold mt-1 mb-3 truncate">{subject}</div>
            <label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Message</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, resize: "none", minHeight: 180 }} className="w-full mt-1 px-3.5 py-3 rounded-lg text-[13px] leading-relaxed outline-none flex-1" />
            <p style={{ color: C.faint }} className="text-[10.5px] mt-2">Tokens like {"{first_name}"} and {"{apply_link}"} are filled per recipient.</p>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, background: C.panel }} className="px-5 py-3 flex justify-end gap-2"><button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-4 py-2.5 rounded-lg text-[13px] font-semibold">Cancel</button><button onClick={send} disabled={count === 0} style={{ background: count ? C.honey : C.paper2, color: count ? C.pineDeep : C.faint }} className="px-4 py-2.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5"><Send size={15} /> Send to {count} {audience === "current" ? "vendors" : "leads"}</button></div>
      </div>
    </div>
  );
}
function MarketsView({ markets, setMarkets, onSetFreq, onCreateMarket, onUpdateMarket, onArchive, onUnarchive, onOpenDetail, toast }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [inviting, setInviting] = useState(null);
  const archived = markets.filter((m) => m.archived);
  const setFee = (id, key, delta) => setMarkets((ms) => ms.map((m) => (m.id === id ? { ...m, [key]: Math.max(0, m[key] + delta) } : m)));
  const toggleMethod = (id, mid) => setMarkets((ms) => ms.map((m) => (m.id === id ? { ...m, methods: m.methods.includes(mid) ? m.methods.filter((x) => x !== mid) : [...m.methods, mid] } : m)));
  const feeRow = (m, label, key) => (<div className="flex items-center gap-2"><span style={{ color: C.sub }} className="text-[12px] font-semibold flex-1">{label}</span><button onClick={() => setFee(m.id, key, -5)} style={{ background: C.paper2 }} className="w-6 h-6 rounded-md flex items-center justify-center"><Minus size={12} color={C.ink} /></button><span style={{ fontFamily: FD, width: 54, textAlign: "center" }} className="text-[13px] font-semibold">{money(m[key])}</span><button onClick={() => setFee(m.id, key, 5)} style={{ background: C.paper2 }} className="w-6 h-6 rounded-md flex items-center justify-center"><Plus size={12} color={C.ink} /></button></div>);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p style={{ color: C.sub }} className="text-[13px] flex-1">Create markets and set each one's recurring schedule, default pricing, and accepted payment methods. New dates reuse the market's booth layout with vendors cleared; new approvals inherit the default pricing.</p>
        <button onClick={() => setCreateOpen(true)} style={{ background: C.honey, color: C.pineDeep }} className="px-4 py-2.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5 hover:opacity-90 flex-shrink-0"><Plus size={16} /> New market</button>
      </div>
      {createOpen && <CreateMarketModal onClose={() => setCreateOpen(false)} onCreate={(f) => { onCreateMarket(f); setCreateOpen(false); }} />}
      <div className="grid grid-cols-2 gap-4">
        {markets.filter((m) => !m.archived).map((m) => (
          <div key={m.id} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2"><div style={{ background: C.pine }} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"><Building2 size={17} color={C.honey} /></div><button onClick={() => onOpenDetail(m.id)} className="flex-1 min-w-0 text-left group"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] truncate group-hover:underline">{m.name}</p><p style={{ color: C.sub }} className="text-[11.5px] truncate">{freqLabel(m.freq)} · next {m.dates[0]?.label.replace(/^.*· /, "")}{m.location ? " · " + m.location : ""}</p></button>
              <button onClick={() => onOpenDetail(m.id)} title="View details" style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:shadow-sm flex-shrink-0"><ExternalLink size={14} color={C.pine} /></button>
              <button onClick={() => setInviting(m)} title="Invite vendors" style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:shadow-sm flex-shrink-0"><Mail size={14} color={C.pine} /></button>
              <button onClick={() => setEditing(m)} title="Edit" style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:shadow-sm flex-shrink-0"><Pencil size={14} color={C.sub} /></button>
              <button onClick={() => onArchive(m.id)} title="Archive market" style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:shadow-sm flex-shrink-0"><Archive size={14} color={C.sub} /></button>
            </div>
            {m.description && <p style={{ color: C.sub }} className="text-[11.5px] mb-3 leading-relaxed" title={m.description}>{m.description.length > 128 ? m.description.slice(0, 128) + "…" : m.description}</p>}
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: C.sub }} className="text-[12px] font-semibold flex items-center gap-1"><RotateCw size={13} color={C.pine} /> Schedule</span>
              <select value={m.freq} onChange={(e) => onSetFreq(m.id, e.target.value)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-2.5 py-1.5 rounded-lg text-[12.5px] font-semibold outline-none"><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option><option value="custom">Custom dates</option></select>
              <span style={{ color: C.faint }} className="text-[11px] flex-1 text-right truncate">{m.dates.slice(0, 3).map((d) => d.label.replace(/^.*· /, "")).join(", ")}</span>
            </div>
            <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-xl p-3 flex flex-col gap-2 mb-3">
              <p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide">Default pricing</p>
              {feeRow(m, "10×10 booth", "boothFee")}
              {feeRow(m, "Food truck", "truckFee")}
              {feeRow(m, "Application", "appFee")}
            </div>
            <p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide mb-2">Accepted payment methods</p>
            <div className="flex flex-wrap gap-2">
              {METHOD_ORDER.map((mid) => { const on = m.methods.includes(mid); return (<button key={mid} onClick={() => toggleMethod(m.id, mid)} style={{ background: on ? C.card : C.paper2, border: `1.5px solid ${on ? C.pine : C.line}`, opacity: on ? 1 : 0.55 }} className="rounded-lg px-2 py-1.5 flex items-center gap-1.5 hover:shadow-sm"><MethodMark id={mid} size={20} r={6} /><span className="text-[11.5px] font-semibold">{METHOD_META[mid].label}</span>{on && <Check size={13} color={C.pine} />}</button>); })}
            </div>
          </div>
        ))}
      </div>
      {archived.length > 0 && (
        <div>
          <p style={{ color: C.faint }} className="text-[11px] font-bold uppercase tracking-wide mb-2 mt-1">Archived / retired</p>
          <div className="grid grid-cols-2 gap-3">
            {archived.map((m) => (
              <div key={m.id} style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-2xl p-4 flex items-center gap-3">
                <div style={{ background: C.paper2 }} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"><Archive size={16} color={C.faint} /></div>
                <div className="flex-1 min-w-0"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14px] truncate">{m.name}</p><p style={{ color: C.faint }} className="text-[11px]">Retired · {freqLabel(m.freq)}</p></div>
                <button onClick={() => setEditing(m)} title="Edit" style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"><Pencil size={14} color={C.sub} /></button>
                <button onClick={() => onUnarchive(m.id)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.pine }} className="px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5 flex-shrink-0"><ArchiveRestore size={14} /> Restore</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {editing && <EditMarketModal market={editing} onClose={() => setEditing(null)} onSave={(patch) => { onUpdateMarket(editing.id, patch); setEditing(null); }} />}
      {inviting && <InviteVendorsModal market={inviting} onClose={() => setInviting(null)} toast={toast} />}
    </div>
  );
}

/* ================================================================== */
/*  Campaigns / Drip                                                   */
/* ================================================================== */
function CampaignsView({ campaigns, setCampaigns, editingId, setEditingId, toast }) {
  if (editingId) { const camp = campaigns.find((c) => c.id === editingId); if (camp) return <DripEditor camp={camp} update={(fn) => setCampaigns((cs) => cs.map((c) => (c.id === editingId ? fn(c) : c)))} onBack={() => setEditingId(null)} toast={toast} />; }
  const newCampaign = () => { const id = "cp" + Date.now(); setCampaigns((cs) => [{ id, name: "Untitled campaign", audience: "Vendors", status: "Draft", steps: [{ id: "s" + Date.now(), ch: "email", delay: "Day 0", subject: "Subject line", body: "Write your message…" }] }, ...cs]); setEditingId(id); };
  return (
    <div>
      <div className="flex justify-between items-center mb-4"><p style={{ color: C.sub }} className="text-[13px]">Build multi-step email & SMS drips (including unpaid-booth reminders). Drag to reorder, edit copy, then launch.</p><button onClick={newCampaign} style={{ background: C.honey, color: C.pineDeep }} className="px-4 py-2.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5 hover:opacity-90"><Plus size={16} /> New campaign</button></div>
      <div className="grid grid-cols-2 gap-4">{campaigns.map((c) => (<button key={c.id} onClick={() => setEditingId(c.id)} style={{ background: C.card, border: `1px solid ${C.line}` }} className="text-left rounded-2xl p-4 hover:shadow-md transition-shadow"><div className="flex items-center gap-3 mb-3"><div style={{ background: audColor(c.audience) }} className="w-10 h-10 rounded-xl flex items-center justify-center"><Megaphone size={18} color="#fff" /></div><div className="flex-1 min-w-0"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] truncate">{c.name}</p><p style={{ color: C.sub }} className="text-[11.5px]">{c.audience} · {c.steps.length} steps</p></div>{c.status === "Active" ? <Pill bg={C.sageSoft} fg={C.pine}><Play size={10} /> Active</Pill> : <Pill bg={C.paper2} fg={C.sub}>Draft</Pill>}</div><div className="flex items-center gap-1.5">{c.steps.map((s, i) => <React.Fragment key={s.id}>{i > 0 && <div style={{ width: 14, height: 2, background: C.line }} />}<div style={{ background: s.ch === "sms" ? C.honeySoft : C.sageSoft }} className="w-7 h-7 rounded-full flex items-center justify-center">{s.ch === "sms" ? <MessageSquare size={13} color={C.honeyDeep} /> : <Mail size={13} color={C.pine} />}</div></React.Fragment>)}</div></button>))}</div>
    </div>
  );
}
function DripEditor({ camp, update, onBack, toast }) {
  const [selId, setSelId] = useState(camp.steps[0]?.id); const dragIdx = useRef(null);
  const step = camp.steps.find((s) => s.id === selId) || camp.steps[0];
  const setSteps = (steps) => update((c) => ({ ...c, steps }));
  const editStep = (patch) => setSteps(camp.steps.map((s) => (s.id === step.id ? { ...s, ...patch } : s)));
  const addStep = (ch) => { const id = "s" + Date.now(); setSteps([...camp.steps, { id, ch, delay: "+2 days", subject: ch === "email" ? "New subject" : "", body: ch === "email" ? "Write your email…" : "Write your text…" }]); setSelId(id); };
  const delStep = (id) => { const ns = camp.steps.filter((s) => s.id !== id); setSteps(ns); if (selId === id) setSelId(ns[0]?.id); };
  const reorder = (to) => { const from = dragIdx.current; if (from == null || from === to) return; const ns = [...camp.steps]; const [m] = ns.splice(from, 1); ns.splice(to, 0, m); setSteps(ns); dragIdx.current = null; };
  return (
    <div>
      <div className="flex items-center gap-3 mb-4"><button onClick={onBack} style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-9 h-9 rounded-lg flex items-center justify-center hover:shadow-sm"><ChevronRight size={18} color={C.ink} style={{ transform: "rotate(180deg)" }} /></button><input value={camp.name} onChange={(e) => update((c) => ({ ...c, name: e.target.value }))} style={{ fontFamily: FD, color: C.ink, background: "transparent" }} className="text-[22px] font-semibold flex-1 outline-none" /><select value={camp.audience} onChange={(e) => update((c) => ({ ...c, audience: e.target.value }))} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3 py-2 rounded-lg text-[13px] font-semibold outline-none"><option>Vendors</option><option>Leads</option><option>Shoppers</option></select><button onClick={() => toast("Draft saved")} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:shadow-sm"><Save size={15} /> Save</button><button onClick={() => { update((c) => ({ ...c, status: "Active" })); toast(`${camp.name} launched`, "sparkle"); onBack(); }} style={{ background: C.honey, color: C.pineDeep }} className="px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5 hover:opacity-90"><Play size={15} /> Launch</button></div>
      <div className="flex gap-5">
        <div style={{ width: 320 }} className="flex-shrink-0">
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-2">Sequence · drag to reorder</p>
          <div className="flex flex-col">{camp.steps.map((s, i) => { const sel = s.id === step.id; return (<div key={s.id} className="flex gap-2.5"><div className="flex flex-col items-center"><div style={{ background: s.ch === "sms" ? C.honey : C.pine }} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">{s.ch === "sms" ? <MessageSquare size={14} color="#fff" /> : <Mail size={14} color="#fff" />}</div>{i < camp.steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 14, background: C.line }} />}</div><div draggable onDragStart={() => (dragIdx.current = i)} onDragOver={(e) => e.preventDefault()} onDrop={() => reorder(i)} onClick={() => setSelId(s.id)} style={{ background: sel ? C.panel : C.card, border: `1.5px solid ${sel ? C.honey : C.line}` }} className="flex-1 rounded-xl p-2.5 mb-2.5 cursor-pointer flex items-center gap-2 hover:shadow-sm"><GripVertical size={15} color={C.faint} className="cursor-grab flex-shrink-0" /><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span style={{ background: C.paper2, color: C.sub }} className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full">{s.delay}</span><span style={{ color: C.faint }} className="text-[9.5px] font-bold uppercase">{s.ch}</span></div><p className="text-[12.5px] font-semibold truncate mt-0.5">{s.ch === "email" ? s.subject : s.body}</p></div><button onClick={(e) => { e.stopPropagation(); delStep(s.id); }} style={{ color: C.faint }} className="p-1 hover:text-red-600 flex-shrink-0"><Trash2 size={14} /></button></div></div>); })}</div>
          <div className="flex gap-2 mt-1"><button onClick={() => addStep("email")} style={{ background: C.sageSoft, color: C.pine }} className="flex-1 rounded-lg py-2.5 text-[12.5px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90"><Mail size={14} /> Add email</button><button onClick={() => addStep("sms")} style={{ background: C.honeySoft, color: C.honeyDeep }} className="flex-1 rounded-lg py-2.5 text-[12.5px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90"><MessageSquare size={14} /> Add SMS</button></div>
        </div>
        {step && (<div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="flex-1 rounded-2xl p-5"><div className="flex items-center justify-between mb-4"><div style={{ background: C.paper2 }} className="p-1 rounded-full flex">{["email", "sms"].map((ch) => <button key={ch} onClick={() => editStep({ ch })} style={{ background: step.ch === ch ? C.card : "transparent", color: step.ch === ch ? C.ink : C.sub }} className="px-4 py-1.5 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5">{ch === "email" ? <Mail size={13} /> : <MessageSquare size={13} />} {ch === "email" ? "Email" : "SMS"}</button>)}</div><div className="flex items-center gap-2"><span style={{ color: C.faint }} className="text-[11px] font-bold uppercase">Send</span><input value={step.delay} onChange={(e) => editStep({ delay: e.target.value })} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, width: 110 }} className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold outline-none text-center" /></div></div>{step.ch === "email" && <div className="mb-3"><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Subject line</label><input value={step.subject} onChange={(e) => editStep({ subject: e.target.value })} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[14px] outline-none" /></div>}<div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">{step.ch === "email" ? "Body" : "Message"}</label><textarea value={step.body} onChange={(e) => editStep({ body: e.target.value })} rows={8} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, resize: "none" }} className="w-full mt-1 px-3.5 py-3 rounded-lg text-[13.5px] leading-relaxed outline-none" /></div><div className="flex items-center gap-2 mt-3 flex-wrap">{["{first_name}", "{market}", "{booth}", "{pay_link}"].map((tok) => <button key={tok} onClick={() => editStep({ body: step.body + " " + tok })} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.pine }} className="text-[11px] font-semibold px-2 py-1 rounded-full hover:shadow-sm">{tok}</button>)}</div></div>)}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shell                                                              */
/* ================================================================== */
function Sidebar({ active, onNav, onLogout }) {
  const items = [["overview", "Overview", LayoutDashboard], ["markets", "Markets & pricing", Building2], ["map", "Booth map", MapIcon], ["payments", "Approvals & payments", CreditCard], ["reports", "Reports", BarChart3], ["campaigns", "Campaigns", Megaphone], ["vendors", "Vendors", Users]];
  return (
    <div style={{ background: C.pineDeep, width: 228 }} className="flex-shrink-0 flex flex-col p-3">
      <div className="flex items-center gap-2 px-2 py-3 mb-2"><div style={{ background: "rgba(255,255,255,.12)" }} className="w-8 h-8 rounded-[10px] flex items-center justify-center"><Store size={17} color={C.honey} /></div><div><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-white text-[16px] leading-none">MarketHub</p><p className="text-white/50 text-[10px] mt-0.5">Organizer console</p></div></div>
      <div className="flex flex-col gap-1 flex-1">{items.map(([key, label, Icon]) => { const on = active === key; return <button key={key} onClick={() => onNav(key)} style={{ background: on ? "rgba(255,255,255,.12)" : "transparent", color: on ? "#fff" : "rgba(255,255,255,.65)" }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-left hover:bg-white/5"><Icon size={17} /> {label}</button>; })}</div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,.1)" }} className="pt-3 mt-2"><div className="flex items-center gap-2 px-2 mb-2"><div style={{ background: C.honey }} className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold">CM</div><div className="min-w-0"><p className="text-white text-[12.5px] font-semibold truncate">Central Makers</p><p className="text-white/50 text-[10.5px] truncate">4 markets</p></div></div><button onClick={onLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold text-white/60 hover:bg-white/5 w-full"><LogOut size={15} /> Log out</button></div>
    </div>
  );
}
function MarketSwitcher({ markets, mkt, setMkt }) {
  const [open, setOpen] = useState(false);
  const cur = markets.find((m) => m.id === mkt);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} style={{ background: C.paper2 }} className="rounded-lg flex items-center gap-2 px-3 py-2 hover:brightness-95"><Calendar size={14} color={C.pine} /><span className="text-[12.5px] font-semibold">{cur.name}</span><ChevronDown size={14} color={C.faint} /></button>
      {open && (<>
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
        <div style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 16px 40px -16px rgba(0,0,0,.35)" }} className="absolute right-0 mt-1 rounded-xl p-1.5 z-20 w-64">
          {markets.map((m) => (<button key={m.id} onClick={() => { setMkt(m.id); setOpen(false); }} style={{ background: m.id === mkt ? C.sageSoft : "transparent" }} className="w-full text-left rounded-lg px-3 py-2 hover:bg-black/5 flex items-center justify-between"><div><p className="text-[13px] font-semibold">{m.name}</p><p style={{ color: C.sub }} className="text-[11px]">{m.date}</p></div>{m.id === mkt && <Check size={15} color={C.pine} />}</button>))}
        </div>
      </>)}
    </div>
  );
}
function DateSwitcher({ market, activeDate, onPick, onAdd, onAddCustom, onSetStatus }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const cur = market.dates.find((d) => d.id === activeDate) || market.dates[0];
  const word = market.freq === "monthly" ? "month" : market.freq === "biweekly" ? "2 weeks" : "week";
  const tag = (st) => { const map = { published: [C.sageSoft, C.pine, "Published"], generated: [C.paper2, C.sub, "Tentative"], skipped: [C.dangerSoft, C.danger, "Skipped"] }; const [bg, fg, t] = map[st] || map.generated; return <span style={{ background: bg, color: fg }} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full">{t}</span>; };
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} style={{ background: C.paper2 }} className="rounded-lg flex items-center gap-2 px-3 py-2 hover:brightness-95"><Calendar size={14} color={C.honeyDeep} /><span className="text-[12.5px] font-semibold" style={{ textDecoration: cur.status === "skipped" ? "line-through" : "none" }}>{cur.label}</span><ChevronDown size={14} color={C.faint} /></button>
      {open && (<>
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
        <div style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 16px 40px -16px rgba(0,0,0,.35)", width: 272 }} className="absolute right-0 mt-1 rounded-xl p-1.5 z-20">
          <p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide px-2 pt-1 pb-1.5">{market.short} · {freqLabel(market.freq)}</p>
          <div className="max-h-[210px] overflow-y-auto flex flex-col gap-0.5">
            {market.dates.map((d) => { const st = d.status || "generated"; const on = d.id === activeDate; return (
              <div key={d.id} style={{ background: on ? C.sageSoft : "transparent" }} className="rounded-lg pl-3 pr-1.5 py-1.5 flex items-center gap-1.5">
                <button onClick={() => { onPick(d.id); setOpen(false); }} className="flex-1 min-w-0 text-left flex items-center gap-1.5"><span className="text-[13px] font-semibold" style={{ textDecoration: st === "skipped" ? "line-through" : "none", color: st === "skipped" ? C.faint : C.ink }}>{d.label}</span>{tag(st)}</button>
                <div className="flex items-center gap-0.5">
                  {st === "generated" && <button title="Publish" onClick={() => onSetStatus(d.id, "published")} className="p-1 rounded hover:bg-black/10"><Check size={13} color={C.pine} /></button>}
                  {st !== "skipped" ? <button title="Skip this date" onClick={() => onSetStatus(d.id, "skipped")} className="p-1 rounded hover:bg-black/10"><Ban size={13} color={C.danger} /></button>
                    : <button title="Restore" onClick={() => onSetStatus(d.id, "generated")} className="p-1 rounded hover:bg-black/10"><RotateCcw size={13} color={C.sub} /></button>}
                </div>
              </div>); })}
          </div>
          {market.freq !== "custom" && <button onClick={() => { onAdd(); setOpen(false); }} style={{ color: C.pine, borderTop: `1px solid ${C.line}` }} className="w-full text-left rounded-lg px-3 py-2 mt-1 hover:bg-black/5 flex items-center gap-1.5 text-[13px] font-bold"><Plus size={14} /> Add next {word}</button>}
          <div style={{ borderTop: `1px solid ${C.line}` }} className="mt-1 pt-2 px-2 pb-1">
            <p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide mb-1">Add a specific date</p>
            <div className="flex gap-1.5"><input type="date" value={custom} onChange={(e) => setCustom(e.target.value)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="flex-1 px-2 py-1.5 rounded-lg text-[12px] outline-none" /><button onClick={() => { if (custom) { onAddCustom(custom); setCustom(""); setOpen(false); } }} style={{ background: C.honey, color: C.pineDeep }} className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold">Add</button></div>
          </div>
        </div>
      </>)}
    </div>
  );
}
function LoginWeb({ onAuth }) {
  return (
    <div style={{ background: `linear-gradient(140deg, ${C.pineDeep}, ${C.pine})`, minHeight: 620 }} className="flex items-center justify-center p-6">
      <div style={{ background: C.card, width: 400, borderRadius: 22, boxShadow: "0 30px 70px -20px rgba(0,0,0,.5)" }} className="p-7">
        <div className="flex items-center gap-2 mb-5"><div style={{ background: C.pine }} className="w-9 h-9 rounded-[10px] flex items-center justify-center"><Store size={18} color={C.honey} /></div><span style={{ fontFamily: FD, fontWeight: 600 }} className="text-[20px]">MarketHub</span></div>
        <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[22px] mb-1">Organizer sign in</p><p style={{ color: C.sub }} className="text-[13px] mb-5">Applications, booth maps, payments, reporting & marketing.</p>
        <div className="flex flex-col gap-3"><div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Email</label><div style={{ background: C.card, border: `1px solid ${C.line}` }} className="mt-1 rounded-lg flex items-center gap-2 px-3"><Mail size={15} color={C.faint} /><input placeholder="you@central-makers.com" className="flex-1 py-2.5 text-[14px] outline-none bg-transparent" /></div></div><div><label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Password</label><div style={{ background: C.card, border: `1px solid ${C.line}` }} className="mt-1 rounded-lg flex items-center gap-2 px-3"><Lock size={15} color={C.faint} /><input type="password" placeholder="••••••••" className="flex-1 py-2.5 text-[14px] outline-none bg-transparent" /></div></div></div>
        <button onClick={onAuth} style={{ background: C.honey, color: C.pineDeep }} className="w-full mt-5 rounded-full py-3 font-bold text-[15px] flex items-center justify-center gap-2 hover:opacity-90">Sign in <ArrowRight size={17} /></button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  App                                                                */
/* ================================================================== */
export default function App() {
  const t0 = useRef(Date.now()).current;
  const [authed, setAuthed] = useState(true);
  const [active, setActive] = useState("payments");
  const [now, setNow] = useState(Date.now());
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const toast = (msg, icon = "check") => { const id = ++toastId.current; setToasts((t) => [...t, { id, msg, icon }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400); };
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv); }, []);

  const [markets, setMarkets] = useState(MARKETS);
  const [mkt, setMkt] = useState("m1");
  const [approvals, setApprovals] = useState(() => seedApprovals(t0));
  const [activeDateByMarket, setActiveDateByMarket] = useState(() => Object.fromEntries(MARKETS.map((m) => [m.id, m.dates[0].id])));
  const [spotsByOcc, setSpotsByOcc] = useState(() => Object.fromEntries(MARKETS.map((m) => [`${m.id}:${m.dates[0].id}`, (SEED_SPOTS[m.id] || []).map((s) => ({ ...s }))])));
  const [marketTemplate, setMarketTemplate] = useState(() => Object.fromEntries(MARKETS.map((m) => [m.id, (SEED_SPOTS[m.id] || []).map((s) => ({ ...s, vId: null }))])));
  const [imgByMarket, setImgByMarket] = useState({});
  const [campaigns, setCampaigns] = useState(SEED_CAMPAIGNS);
  const [editingId, setEditingId] = useState(null);
  const [payVId, setPayVId] = useState(null);
  const [layouts, setLayouts] = useState({});
  const [detailMarketId, setDetailMarketId] = useState(null);
  const [checkIn, setCheckIn] = useState(null);
  const [vendorMeta, setVendorMeta] = useState({});

  const marketsById = Object.fromEntries(markets.map((m) => [m.id, m]));
  const market = marketsById[mkt];
  const liveMarkets = markets.filter((m) => !m.archived);
  const activeDate = activeDateByMarket[mkt] || market.dates[0].id;
  const curKey = `${mkt}:${activeDate}`;
  const curSpots = spotsByOcc[curKey] || [];
  const marketApprovals = approvals.filter((a) => a.marketId === mkt);
  const approvedVendors = marketApprovals.filter((a) => ["Paid", "AwaitingPayment", "Held"].includes(a.status)).map((a) => VENDORS[a.vId]);

  // A new market date reuses the market's last layout with vendor assignments cleared
  useEffect(() => {
    const key = `${mkt}:${activeDateByMarket[mkt] || marketsById[mkt].dates[0].id}`;
    setSpotsByOcc((prev) => (prev[key] ? prev : { ...prev, [key]: (marketTemplate[mkt] || []).map((s) => ({ ...s, vId: null })) }));
  }, [mkt, activeDateByMarket]);

  const setSpots = (updater) => {
    const key = `${mkt}:${activeDate}`;
    const next = updater(spotsByOcc[key] || []);
    setSpotsByOcc((prev) => ({ ...prev, [key]: next }));
    setMarketTemplate((prev) => ({ ...prev, [mkt]: next.map((s) => ({ ...s, vId: null })) }));
  };
  const setVenueImage = (img) => setImgByMarket((prev) => ({ ...prev, [mkt]: img }));

  const approve = (id) => { setApprovals((as) => as.map((a) => (a.id === id ? { ...a, status: "AwaitingPayment", deadline: Date.now() + HOLD_MS } : a))); toast("Approved — payment link sent · 24h hold started", "send"); };
  const setDisc = (id, patch) => setApprovals((as) => as.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remind = (id) => { setApprovals((as) => as.map((a) => (a.id === id ? { ...a, reminders: (a.reminders || 0) + 1 } : a))); toast("Reminder sent to vendor", "send"); };
  const remindAll = () => { setApprovals((as) => as.map((a) => (a.marketId === mkt && a.status === "AwaitingPayment" ? { ...a, reminders: (a.reminders || 0) + 1 } : a))); toast("Reminder sent to all unpaid vendors", "send"); };
  const hold = (id) => { setApprovals((as) => as.map((a) => (a.id === id ? { ...a, status: "Held", deadline: null } : a))); toast("Spot held — kept out of rotation"); };
  const unhold = (id) => { setApprovals((as) => as.map((a) => (a.id === id ? { ...a, status: "AwaitingPayment", deadline: Date.now() + HOLD_MS } : a))); toast("Hold released — 24h window restarted"); };
  const releaseUnpaid = () => {
    const targets = approvals.filter((a) => a.marketId === mkt && a.status === "AwaitingPayment");
    const vids = targets.map((a) => a.vId);
    setApprovals((as) => as.map((a) => (a.marketId === mkt && a.status === "AwaitingPayment" ? { ...a, status: "Released", deadline: null } : a)));
    setSpotsByOcc((prev) => ({ ...prev, [`${mkt}:${activeDate}`]: (prev[`${mkt}:${activeDate}`] || []).map((s) => (vids.includes(s.vId) ? { ...s, vId: null } : s)) }));
    toast("Unpaid holds expired — spots back in rotation");
  };
  const pay = (ids, method) => { setApprovals((as) => as.map((a) => (ids.includes(a.id) ? { ...a, status: "Paid", method, deadline: null } : a))); toast("Payment received — booth(s) confirmed"); setPayVId(null); };

  // Booth layouts — persisted per market (falls back to in-memory if storage is unavailable)
  useEffect(() => { (async () => { if (typeof window === "undefined" || !window.storage) return; try { const r = await window.storage.get("booth_layouts"); if (r && r.value) setLayouts(JSON.parse(r.value)); } catch (e) {} })(); }, []);
  const persistLayouts = (next) => { setLayouts(next); if (typeof window !== "undefined" && window.storage) { (async () => { try { await window.storage.set("booth_layouts", JSON.stringify(next)); } catch (e) {} })(); } };
  const saveLayout = (name) => { const layout = { id: "ly" + Date.now(), name, savedAt: Date.now(), spots: curSpots.map((s) => ({ ...s })) }; persistLayouts({ ...layouts, [mkt]: [layout, ...(layouts[mkt] || [])] }); toast(`Layout "${name}" saved`); };
  const loadLayout = (id) => { const l = (layouts[mkt] || []).find((x) => x.id === id); if (l) { const key = `${mkt}:${activeDate}`; const ns = l.spots.map((s) => ({ ...s })); setSpotsByOcc((prev) => ({ ...prev, [key]: ns })); setMarketTemplate((prev) => ({ ...prev, [mkt]: ns.map((s) => ({ ...s, vId: null })) })); toast(`Loaded "${l.name}"`); } };
  const deleteLayout = (id) => { persistLayouts({ ...layouts, [mkt]: (layouts[mkt] || []).filter((x) => x.id !== id) }); toast("Layout deleted"); };

  const pickDate = (dateId) => setActiveDateByMarket((prev) => ({ ...prev, [mkt]: dateId }));
  const setDateStatus = (dateId, status) => setMarkets((ms) => ms.map((m) => (m.id === mkt ? { ...m, dates: m.dates.map((d) => (d.id === dateId ? { ...d, status } : d)) } : m)));
  const addMarketDate = () => { const m = marketsById[mkt]; const last = m.dates[m.dates.length - 1]; const nd = mkDateObj(stepDate(new Date(last.iso + "T12:00:00"), m.freq), "published"); setMarkets((ms) => ms.map((x) => (x.id === mkt ? { ...x, dates: [...x.dates, nd] } : x))); setActiveDateByMarket((prev) => ({ ...prev, [mkt]: nd.id })); toast(`Added ${nd.label} — layout carried over, vendors reset`); };
  const addCustomDate = (iso) => { if (!iso) return; const nd = mkDateObj(new Date(iso + "T12:00:00"), "published"); setMarkets((ms) => ms.map((x) => (x.id === mkt ? { ...x, dates: [...x.dates.filter((d) => d.iso !== nd.iso), nd].sort((a, b) => a.iso.localeCompare(b.iso)) } : x))); setActiveDateByMarket((prev) => ({ ...prev, [mkt]: nd.id })); toast(`Added ${nd.label}`); };
  const setFreq = (id, freq) => { const m = marketsById[id]; if (!m) return; const anchor = m.dates[0]?.iso || m.start; const dates = genDates(anchor, freq); setMarkets((ms) => ms.map((x) => (x.id === id ? { ...x, freq, dates, date: dates[0].label } : x))); setActiveDateByMarket((prev) => ({ ...prev, [id]: dates[0].id })); toast(`${m.short} set to ${freqLabel(freq)}`); };
  const createMarket = (f) => {
    const id = "m" + Date.now();
    const n = (v, d) => { const x = parseInt(v, 10); return isNaN(x) ? d : x; };
    const dates = genDates(f.start, f.freq);
    const market = { id, name: f.name.trim(), short: (f.short.trim() || f.name.trim()), location: f.location.trim(), description: (f.description || "").trim(), start: f.start, freq: f.freq, boothFee: n(f.boothFee, 65), truckFee: n(f.truckFee, 120), appFee: n(f.appFee, 0), methods: f.methods.length ? f.methods : ["stripe"], dates, date: dates[0].label };
    setMarkets((ms) => [...ms, market]);
    setActiveDateByMarket((prev) => ({ ...prev, [id]: dates[0].id }));
    setSpotsByOcc((prev) => ({ ...prev, [`${id}:${dates[0].id}`]: [] }));
    setMarketTemplate((prev) => ({ ...prev, [id]: [] }));
    setMkt(id);
    toast(`Market "${market.name}" created`, "sparkle");
  };
  const updateMarket = (id, patch) => { setMarkets((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m))); toast("Market updated"); };
  const archiveMarket = (id) => { setMarkets((ms) => ms.map((m) => (m.id === id ? { ...m, archived: true } : m))); if (id === mkt) { const fl = markets.find((m) => m.id !== id && !m.archived); if (fl) setMkt(fl.id); } toast("Market archived"); };
  const unarchiveMarket = (id) => { setMarkets((ms) => ms.map((m) => (m.id === id ? { ...m, archived: false } : m))); toast("Market restored"); };
  const openDetail = (id) => { setDetailMarketId(id); setActive("marketDetail"); };
  const openCheckIn = (marketId, dateId) => { const m = marketsById[marketId]; const spots = spotsByOcc[`${marketId}:${dateId}`] || []; let bt = 0, ft = 0; const rows = []; spots.forEach((s) => { const code = s.type === "tent" ? "B" + (++bt) : "F" + (++ft); if (s.vId) { const v = VENDORS[s.vId]; const paid = approvals.some((a) => a.vId === s.vId && a.marketId === marketId && a.status === "Paid"); rows.push({ code, name: v.name, contact: v.contact, phone: v.phone, paid }); } }); rows.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })); setCheckIn({ market: m, dateLabel: m.dates.find((d) => d.id === dateId)?.label || "", rows }); };
  const updateVendorMeta = (vId, patch) => setVendorMeta((prev) => ({ ...prev, [vId]: { ...prev[vId], ...patch } }));

  const logout = () => { if (typeof window !== "undefined" && window.__mhLogout) window.__mhLogout(); else setAuthed(false); };

  if (!authed) return <Shell><LoginWeb onAuth={() => setAuthed(true)} /></Shell>;

  const titles = {
    overview: ["Overview", "Across all your markets"], markets: ["Markets & pricing", "Set defaults and accepted payment methods per market"],
    map: ["Booth map", "Position the venue, place tents & trucks, assign vendors"], payments: ["Approvals & payments", "Approve, adjust fees, remind, hold, and collect"],
    reports: ["Reports", "Every financial aspect, across markets"], campaigns: ["Campaigns", "Drip email & SMS marketing"], vendors: ["Vendors", "Your vendor network"],
  };
  const [title, sub] = active === "marketDetail" && detailMarketId ? [marketsById[detailMarketId]?.name || "Market", "Market details"] : titles[active];
  const perMarket = active === "map" || active === "payments";

  return (
    <Shell>
      <div className="flex" style={{ minHeight: 640 }}>
        <Sidebar active={active === "marketDetail" ? "markets" : active} onNav={(k) => { setActive(k); setEditingId(null); }} onLogout={logout} />
        <div className="flex-1 min-w-0 flex flex-col" style={{ background: C.paper }}>
          <div style={{ background: C.card, borderBottom: `1px solid ${C.line}` }} className="px-6 py-3.5 flex items-center gap-4">
            <div className="flex-1"><h1 style={{ fontFamily: FD, fontWeight: 600 }} className="text-[20px] leading-tight">{title}</h1><p style={{ color: C.sub }} className="text-[12px]">{sub}</p></div>
            {perMarket && <MarketSwitcher markets={liveMarkets} mkt={mkt} setMkt={setMkt} />}
            {active === "map" && <DateSwitcher market={market} activeDate={activeDate} onPick={pickDate} onAdd={addMarketDate} onAddCustom={addCustomDate} onSetStatus={setDateStatus} />}
            <button style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-9 h-9 rounded-lg flex items-center justify-center relative"><Bell size={17} color={C.ink} /><span style={{ background: C.honey }} className="absolute top-2 right-2 w-2 h-2 rounded-full" /></button>
          </div>
          <div className="p-6 flex-1 overflow-auto" style={{ maxHeight: 760 }}>
            {active === "overview" && <Overview approvals={approvals} markets={liveMarkets} marketsById={marketsById} spotsByOcc={spotsByOcc} activeDateByMarket={activeDateByMarket} marketTemplate={marketTemplate} campaigns={campaigns} go={setActive} onOpenDetail={openDetail} />}
            {active === "markets" && <MarketsView markets={markets} setMarkets={setMarkets} onSetFreq={setFreq} onCreateMarket={createMarket} onUpdateMarket={updateMarket} onArchive={archiveMarket} onUnarchive={unarchiveMarket} onOpenDetail={openDetail} toast={toast} />}
            {active === "marketDetail" && detailMarketId && <MarketDetailView market={marketsById[detailMarketId]} approvals={approvals} spotsByOcc={spotsByOcc} activeDateByMarket={activeDateByMarket} onBack={() => setActive("markets")} goSection={(sec) => { setMkt(detailMarketId); setActive(sec); }} onCheckIn={openCheckIn} onUpdateMarket={updateMarket} onArchive={(id) => { archiveMarket(id); setActive("markets"); }} toast={toast} />}
            {active === "map" && <BoothMapView spots={curSpots} setSpots={setSpots} venueImage={imgByMarket[mkt] || null} setVenueImage={setVenueImage} approvedVendors={approvedVendors} toast={toast} marketName={`${market.name} · ${market.dates.find((d) => d.id === activeDate)?.label || ""}`} savedLayouts={layouts[mkt] || []} onSaveLayout={saveLayout} onLoadLayout={loadLayout} onDeleteLayout={deleteLayout} onCheckIn={() => openCheckIn(mkt, activeDate)} />}
            {active === "payments" && <PaymentsView approvals={marketApprovals} market={market} now={now} approve={approve} setDisc={setDisc} remind={remind} hold={hold} unhold={unhold} openPay={setPayVId} release={releaseUnpaid} remindAll={remindAll} toast={toast} />}
            {active === "reports" && <ReportsView approvals={approvals} markets={markets} marketsById={marketsById} toast={toast} />}
            {active === "campaigns" && <CampaignsView campaigns={campaigns} setCampaigns={setCampaigns} editingId={editingId} setEditingId={setEditingId} toast={toast} />}
            {active === "vendors" && <VendorsView approvals={approvals} markets={markets} marketsById={marketsById} campaigns={campaigns} vendorMeta={vendorMeta} onUpdateMeta={updateVendorMeta} toast={toast} />}
          </div>
        </div>
      </div>
      {payVId && <PaymentModal vId={payVId} approvals={approvals} marketsById={marketsById} now={now} onPay={pay} onClose={() => setPayVId(null)} />}
      {checkIn && <CheckInReport market={checkIn.market} dateLabel={checkIn.dateLabel} rows={checkIn.rows} onClose={() => setCheckIn(null)} />}
      <div className="mh-toasts fixed left-0 right-0 bottom-6 flex flex-col items-center gap-2 pointer-events-none z-[70]">{toasts.map((t) => <div key={t.id} style={{ background: C.ink, color: "#fff" }} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium shadow-xl">{t.icon === "send" ? <Send size={14} color={C.honey} /> : t.icon === "sparkle" ? <Sparkles size={14} color={C.honey} /> : <Check size={14} color={C.sage} />}{t.msg}</div>)}</div>
    </Shell>
  );
}
function Shell({ children }) {
  return (
    <div style={{ background: C.paper2, fontFamily: FB, color: C.ink, minHeight: "100vh" }} className="w-full flex justify-center p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-thumb { background: #D8D2C0; border-radius: 8px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        button { font-family: ${FB}; }
        @media print {
          body * { visibility: hidden !important; }
          .mh-print, .mh-print * { visibility: visible !important; }
          .mh-print { position: absolute !important; left: 0; top: 0; width: 100%; background: #fff !important; }
          .mh-print .mh-no-print { display: none !important; }
          .mh-print > div { margin: 0 !important; max-width: 100% !important; box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, width: "100%", maxWidth: 1260, borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px -24px rgba(23,53,37,.4)" }}>{children}</div>
    </div>
  );
}
function Overview({ approvals, markets, marketsById, spotsByOcc, activeDateByMarket, marketTemplate, campaigns, go, onOpenDetail }) {
  const paid = approvals.filter((a) => a.status === "Paid");
  const collected = paid.reduce((s, a) => s + feeOf(a, marketsById[a.marketId]), 0);
  const outstanding = approvals.filter((a) => a.status === "AwaitingPayment" || a.status === "Held").reduce((s, a) => s + feeOf(a, marketsById[a.marketId]), 0);
  const unpaid = approvals.filter((a) => a.status === "AwaitingPayment").length;
  const cards = [
    { label: "Markets", val: markets.length, Icon: Building2, tone: C.pine, go: "markets" },
    { label: "Collected", val: money(collected), Icon: DollarSign, tone: C.pine, go: "reports" },
    { label: "Outstanding", val: money(outstanding), Icon: Clock, tone: C.honeyDeep, go: "payments" },
    { label: "Awaiting payment", val: unpaid, Icon: BellRing, tone: C.berry, go: "payments" },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">{cards.map((c) => <button key={c.label} onClick={() => go(c.go)} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4 text-left hover:shadow-md transition-shadow"><div style={{ background: C.paper2 }} className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"><c.Icon size={17} color={c.tone} /></div><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[24px] leading-none">{c.val}</p><p style={{ color: C.sub }} className="text-[12px] mt-1">{c.label}</p></button>)}</div>
      <div><p style={{ color: C.faint }} className="text-[11px] font-bold uppercase tracking-wide mb-2">Your markets</p><div className="grid grid-cols-2 gap-4">{markets.map((m) => { const spots = spotsByOcc[`${m.id}:${activeDateByMarket[m.id]}`] || marketTemplate[m.id] || []; const assigned = spots.filter((s) => s.vId).length; const coll = approvals.filter((a) => a.marketId === m.id && a.status === "Paid").reduce((s, a) => s + feeOf(a, m), 0); const wait = approvals.filter((a) => a.marketId === m.id && a.status === "AwaitingPayment").length; return (<button key={m.id} onClick={() => onOpenDetail(m.id)} style={{ background: C.card, border: `1px solid ${C.line}` }} className="text-left rounded-2xl p-4 hover:shadow-md"><div className="flex items-center gap-2 mb-2"><div style={{ background: C.pine }} className="w-8 h-8 rounded-lg flex items-center justify-center"><Store size={15} color={C.honey} /></div><div className="flex-1 min-w-0"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14px] truncate">{m.name}</p><p style={{ color: C.sub }} className="text-[11px]">{m.date}</p></div><ChevronRight size={16} color={C.faint} /></div><div className="flex items-center gap-2 text-[11.5px]"><Pill bg={C.sageSoft} fg={C.pine}>{money(coll)} collected</Pill>{wait > 0 && <Pill bg={C.honeySoft} fg={C.honeyDeep}>{wait} unpaid</Pill>}<Pill bg={C.paper2} fg={C.sub}>{assigned}/{spots.length} booths</Pill></div></button>); })}</div></div>
    </div>
  );
}
function SocialBadge({ kind }) {
  const meta = { instagram: ["IG", "#C13584"], tiktok: ["TT", "#111111"], facebook: ["FB", "#1877F2"] };
  const [t, c] = meta[kind] || ["?", C.sub];
  return <span style={{ background: c, color: "#fff", fontSize: 9.5, fontWeight: 800 }} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">{t}</span>;
}
function VendorsView({ approvals, markets, marketsById, campaigns, vendorMeta, onUpdateMeta, toast }) {
  const all = Object.values(VENDORS);
  const stageOf = (v) => vendorMeta[v.id]?.stage || deriveStage(v.id, approvals);
  const [q, setQ] = useState("");
  const [stageF, setStageF] = useState("All");
  const [selId, setSelId] = useState(all[0].id);
  const filtered = all.filter((v) => (stageF === "All" || stageOf(v) === stageF) && (q === "" || (v.name + v.contact + v.cat + v.city).toLowerCase().includes(q.toLowerCase())));
  const sel = VENDORS[selId];
  const selStage = stageOf(sel);
  const selApprovals = approvals.filter((a) => a.vId === sel.id);
  const meta = vendorMeta[sel.id] || {};
  const notes = meta.notes || "";
  const effCat = meta.cat || sel.cat;
  const effBooth = meta.booth || (isTruckV(sel) ? "truck" : "tent");
  const derivedMarkets = Array.from(new Set(selApprovals.map((a) => a.marketId)));
  const selMarkets = meta.markets || derivedMarkets;
  const selCampaigns = meta.campaigns || [];
  const catOptions = Array.from(new Set([...CAT_OPTIONS, effCat]));
  const toggleMarket = (id) => onUpdateMeta(sel.id, { markets: selMarkets.includes(id) ? selMarkets.filter((x) => x !== id) : [...selMarkets, id] });
  const toggleCampaign = (id) => onUpdateMeta(sel.id, { campaigns: selCampaigns.includes(id) ? selCampaigns.filter((x) => x !== id) : [...selCampaigns, id] });
  const setSocial = (k, v) => onUpdateMeta(sel.id, { social: { ...(meta.social || {}), [k]: v } });
  const pill = (st) => { const [bg, fg] = stageMeta[st] || stageMeta.Lead; return <span style={{ background: bg, color: fg }} className="text-[10px] font-bold px-2 py-0.5 rounded-full">{st}</span>; };
  const statusPill = (s) => { const map = { Paid: [C.sageSoft, C.pine, "Paid"], AwaitingPayment: [C.honeySoft, C.honeyDeep, "Awaiting"], Held: [C.berrySoft, C.berry, "Held"], Pending: [C.paper2, C.sub, "Applied"], Released: [C.paper2, C.sub, "Released"] }; const [bg, fg, t] = map[s] || map.Pending; return <Pill bg={bg} fg={fg}>{t}</Pill>; };
  return (
    <div className="flex flex-col gap-3" style={{ minHeight: 560 }}>
      <div className="flex items-center gap-2 flex-wrap">
        <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-full flex items-center gap-2 px-4 py-2 flex-1 min-w-[220px] max-w-md"><Search size={16} color={C.faint} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, contact, category, city…" className="flex-1 text-[13px] outline-none bg-transparent" /></div>
        {["All", ...STAGES].map((s) => <button key={s} onClick={() => setStageF(s)} style={{ background: stageF === s ? C.pine : C.card, color: stageF === s ? "#fff" : C.sub, border: `1px solid ${stageF === s ? C.pine : C.line}` }} className="text-[12px] font-semibold px-3 py-1.5 rounded-full">{s}</button>)}
      </div>
      <div className="flex gap-4 flex-1">
        {/* list */}
        <div style={{ width: 320 }} className="flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto" >
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">{filtered.length} contacts</p>
          {filtered.map((v) => { const on = v.id === selId; return (
            <button key={v.id} onClick={() => setSelId(v.id)} style={{ background: on ? C.panel : C.card, border: `1.5px solid ${on ? C.pine : C.line}` }} className="rounded-xl p-2.5 flex items-center gap-2.5 text-left hover:shadow-sm">
              <VAvatar v={v} size={38} r={11} />
              <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold truncate">{v.name}</p><p style={{ color: C.sub }} className="text-[11px] truncate">{v.contact} · {v.city}</p></div>
              {pill(stageOf(v))}
            </button>); })}
          {filtered.length === 0 && <p style={{ color: C.faint }} className="text-[12.5px] p-2">No contacts match.</p>}
        </div>
        {/* detail */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="flex-1 min-w-0 rounded-2xl p-5 overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <VAvatar v={sel} size={52} r={15} />
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[19px] truncate">{sel.name}</p><BadgeCheck size={16} color={C.pine} /></div><p style={{ color: C.sub }} className="text-[12.5px]">{sel.contact} · {sel.cat} · {sel.city}</p></div>
            <RepDot rep={sel.rep} size={40} />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-xl px-3 py-2.5 flex items-center gap-2"><Phone size={15} color={C.pine} /><span className="text-[13px] font-semibold">{sel.phone}</span></div>
            <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-xl px-3 py-2.5 flex items-center gap-2 min-w-0"><Mail size={15} color={C.pine} /><span className="text-[13px] truncate">{sel.email}</span></div>
          </div>
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5">Pipeline stage</p>
          <div className="flex flex-wrap gap-1.5 mb-4">{STAGES.map((s) => { const on = selStage === s; const [bg, fg] = stageMeta[s]; return <button key={s} onClick={() => onUpdateMeta(sel.id, { stage: s })} style={{ background: on ? bg : C.card, color: on ? fg : C.sub, border: `1.5px solid ${on ? "transparent" : C.line}` }} className="text-[12px] font-bold px-3 py-1.5 rounded-full">{s}</button>; })}</div>
          {sel.tags?.length > 0 && <div className="flex flex-wrap gap-1.5 mb-4">{sel.tags.map((t) => <Pill key={t} bg={C.honeySoft} fg={C.honeyDeep}>{t}</Pill>)}</div>}
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5">Category & booth type</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            <select value={effCat} onChange={(e) => onUpdateMeta(sel.id, { cat: e.target.value })} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3 py-2 rounded-lg text-[12.5px] font-semibold outline-none">{catOptions.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <div style={{ background: C.paper2 }} className="p-1 rounded-lg flex">{[["tent", "Tent", Tent], ["truck", "Truck", Truck]].map(([k, l, Icon]) => <button key={k} onClick={() => onUpdateMeta(sel.id, { booth: k })} style={{ background: effBooth === k ? C.card : "transparent", color: effBooth === k ? C.ink : C.sub }} className="px-3 py-1.5 rounded-md text-[12px] font-semibold flex items-center gap-1.5"><Icon size={13} /> {l}</button>)}</div>
          </div>
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5">Markets · tap to assign</p>
          <div className="flex flex-wrap gap-1.5 mb-4">{markets.filter((m) => !m.archived).map((m) => { const on = selMarkets.includes(m.id); return <button key={m.id} onClick={() => toggleMarket(m.id)} style={{ background: on ? C.pine : C.card, color: on ? "#fff" : C.sub, border: `1.5px solid ${on ? C.pine : C.line}` }} className="text-[12px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">{on && <Check size={11} />}{m.short}</button>; })}</div>
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5">Campaigns · tap to enroll</p>
          <div className="flex flex-wrap gap-1.5 mb-4">{campaigns.length === 0 && <span style={{ color: C.faint }} className="text-[12px]">No campaigns yet.</span>}{campaigns.map((c) => { const on = selCampaigns.includes(c.id); return <button key={c.id} onClick={() => toggleCampaign(c.id)} style={{ background: on ? C.berry : C.card, color: on ? "#fff" : C.sub, border: `1.5px solid ${on ? C.berry : C.line}` }} className="text-[12px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">{on ? <Check size={11} /> : <Megaphone size={11} />}{c.name}</button>; })}</div>
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5">Social</p>
          <div className="flex flex-col gap-2 mb-4">{[["instagram", "@handle"], ["tiktok", "@handle"], ["facebook", "page name or URL"]].map(([k, ph]) => (<div key={k} className="flex items-center gap-2"><SocialBadge kind={k} /><input value={meta.social?.[k] ?? (k === "instagram" ? `@${slug(sel.name)}` : "")} onChange={(e) => setSocial(k, e.target.value)} placeholder={ph} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="flex-1 px-3 py-2 rounded-lg text-[12.5px] outline-none" /></div>))}</div>
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5">Payment history</p>
          <div className="flex flex-col gap-1.5 mb-4">
            {selApprovals.length === 0 && <p style={{ color: C.faint }} className="text-[12.5px]">No market history yet.</p>}
            {selApprovals.map((a) => { const m = marketsById[a.marketId]; return (<div key={a.id} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-lg px-3 py-2 flex items-center gap-2"><Store size={14} color={C.pine} /><span className="text-[12.5px] font-semibold flex-1 truncate">{m?.name}</span><span style={{ color: C.sub }} className="text-[12px]">{money(feeOf(a, m))}</span>{statusPill(a.status)}</div>); })}
          </div>
          <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><StickyNote size={13} /> Notes</p>
          <textarea value={notes} onChange={(e) => onUpdateMeta(sel.id, { notes: e.target.value })} rows={3} placeholder="Private notes about this vendor…" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, resize: "none" }} className="w-full px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed outline-none mb-4" />
          <div className="flex gap-2">
            <button onClick={() => toast("Message drafted")} style={{ background: C.pine, color: "#fff" }} className="px-3.5 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5"><MessageSquare size={14} /> Message</button>
            <button onClick={() => toast("Added to campaign")} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3.5 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5"><Megaphone size={14} /> Add to campaign</button>
            <button onClick={() => toast("Invitation drafted")} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3.5 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5"><Mail size={14} /> Invite</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckInReport({ market, dateLabel, rows, onClose }) {
  const th = { textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", color: "#5E665D", borderBottom: "2px solid #234C3A" };
  const td = { padding: "9px 10px", fontSize: 13, borderBottom: "1px solid #E2DCCB", verticalAlign: "middle" };
  return (
    <div className="mh-print" style={{ position: "fixed", inset: 0, background: "rgba(23,32,28,.55)", zIndex: 80, overflowY: "auto" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", maxWidth: 820, margin: "24px auto", borderRadius: 12, overflow: "hidden", boxShadow: "0 30px 70px -20px rgba(0,0,0,.5)" }}>
        <div className="mh-no-print" style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }} data-role="toolbar"><div className="px-5 py-3 flex items-center justify-between"><span style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] flex items-center gap-2"><ClipboardIcon /> Check-in sheet</span><div className="flex gap-2"><button onClick={() => window.print()} style={{ background: C.honey, color: C.pineDeep }} className="px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5"><Printer size={15} /> Print</button><button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3 py-2 rounded-lg text-[13px] font-semibold">Close</button></div></div></div>
        <div style={{ padding: "28px 32px" }}>
          <div className="flex items-start justify-between mb-1"><h1 style={{ fontFamily: FD, fontWeight: 600, fontSize: 26, color: C.ink }}>{market.name}</h1><div style={{ textAlign: "right" }}><p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{dateLabel}</p><p style={{ fontSize: 12, color: C.sub }}>Vendor check-in sheet</p></div></div>
          {market.location && <p style={{ fontSize: 12.5, color: C.sub, marginBottom: 4 }}>{market.location}</p>}
          <p style={{ fontSize: 12.5, color: C.sub, marginBottom: 18 }}>{rows.length} vendors · {rows.filter((r) => r.paid).length} paid · {rows.filter((r) => !r.paid).length} unpaid</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={{ ...th, width: 58 }}>Booth</th><th style={th}>Business</th><th style={th}>Contact</th><th style={th}>Phone</th><th style={{ ...th, width: 56, textAlign: "center" }}>Paid</th><th style={{ ...th, width: 74, textAlign: "center" }}>Checked in</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td style={{ ...td, color: C.faint }} colSpan={6}>No vendors assigned for this date yet. Assign booths on the map, then reprint.</td></tr>}
              {rows.map((r, i) => (<tr key={i}><td style={{ ...td, fontWeight: 800, color: C.pine }}>{r.code}</td><td style={{ ...td, fontWeight: 600 }}>{r.name}</td><td style={td}>{r.contact}</td><td style={td}>{r.phone}</td><td style={{ ...td, textAlign: "center", fontWeight: 800, color: r.paid ? C.pine : C.danger }}>{r.paid ? "Y" : "N"}</td><td style={{ ...td, textAlign: "center" }}><span style={{ display: "inline-block", width: 16, height: 16, border: `1.5px solid ${C.sub}`, borderRadius: 4 }} /></td></tr>))}
            </tbody>
          </table>
          <p style={{ fontSize: 11, color: C.faint, marginTop: 20 }}>Generated by MarketHub · staff copy</p>
        </div>
      </div>
    </div>
  );
}
function ClipboardIcon() { return <Printer size={16} color={C.pine} />; }

function MarketDetailView({ market, approvals, spotsByOcc, activeDateByMarket, onBack, goSection, onCheckIn, onUpdateMarket, onArchive, toast }) {
  const [editing, setEditing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const firstLive = market.dates.find((d) => d.status !== "skipped") || market.dates[0];
  const [ciDate, setCiDate] = useState(firstLive.id);
  const mAppr = approvals.filter((a) => a.marketId === market.id);
  const approved = mAppr.filter((a) => ["Paid", "AwaitingPayment", "Held"].includes(a.status));
  const collected = mAppr.filter((a) => a.status === "Paid").reduce((s, a) => s + feeOf(a, market), 0);
  const outstanding = mAppr.filter((a) => a.status === "AwaitingPayment" || a.status === "Held").reduce((s, a) => s + feeOf(a, market), 0);
  const activeDate = activeDateByMarket[market.id] || market.dates[0].id;
  const spots = spotsByOcc[`${market.id}:${activeDate}`] || [];
  const assigned = spots.filter((s) => s.vId).length;
  const upcoming = market.dates.filter((d) => d.status !== "skipped").length;
  const stat = (label, val, tone) => <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3.5"><p style={{ fontFamily: FD, fontWeight: 600, color: tone }} className="text-[20px] leading-none">{val}</p><p style={{ color: C.sub }} className="text-[11.5px] mt-1">{label}</p></div>;
  const dtag = (st) => { const map = { published: [C.sageSoft, C.pine, "Published"], generated: [C.paper2, C.sub, "Tentative"], skipped: [C.dangerSoft, C.danger, "Skipped"] }; const [bg, fg, t] = map[st] || map.generated; return <Pill bg={bg} fg={fg}>{t}</Pill>; };
  const spill = (s) => { const map = { Paid: [C.sageSoft, C.pine, "Paid"], AwaitingPayment: [C.honeySoft, C.honeyDeep, "Awaiting"], Held: [C.berrySoft, C.berry, "Held"], Pending: [C.paper2, C.sub, "Applied"] }; const [bg, fg, t] = map[s] || map.Pending; return <Pill bg={bg} fg={fg}>{t}</Pill>; };
  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} style={{ color: C.sub }} className="text-[13px] font-semibold flex items-center gap-1.5 hover:underline w-fit"><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> All markets</button>
      <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div style={{ background: C.pine }} className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"><Building2 size={20} color={C.honey} /></div>
          <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><h2 style={{ fontFamily: FD, fontWeight: 600 }} className="text-[20px]">{market.name}</h2>{market.archived && <Pill bg={C.paper2} fg={C.sub}>Archived</Pill>}</div><p style={{ color: C.sub }} className="text-[12.5px] mt-0.5">{freqLabel(market.freq)} · next {firstLive.label}{market.location ? " · " + market.location : ""}</p></div>
          <button onClick={() => setInviting(true)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.pine }} className="px-3 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5"><Mail size={14} /> Invite</button>
          <button onClick={() => setEditing(true)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5"><Pencil size={14} /> Edit</button>
          <button onClick={() => onArchive(market.id)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.sub }} className="w-9 h-9 rounded-lg flex items-center justify-center"><Archive size={15} /></button>
        </div>
        {market.description && <p style={{ color: C.sub }} className="text-[13px] leading-relaxed mt-3">{market.description}</p>}
      </div>
      <div className="grid grid-cols-5 gap-3">{stat("Upcoming dates", upcoming, C.pine)}{stat("Booths assigned", `${assigned}/${spots.length}`, C.pine)}{stat("Vendors approved", approved.length, C.pine)}{stat("Collected", money(collected), C.pine)}{stat("Outstanding", money(outstanding), C.honeyDeep)}</div>
      <div style={{ background: C.panel, border: `1px solid ${C.line}` }} className="rounded-2xl p-4 flex items-center gap-2 flex-wrap">
        <button onClick={() => goSection("map")} style={{ background: C.pine, color: "#fff" }} className="px-3.5 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5"><MapIcon size={15} /> Booth map</button>
        <button onClick={() => goSection("payments")} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-3.5 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5"><CreditCard size={15} /> Approvals & payments</button>
        <div className="flex-1" />
        <span style={{ color: C.sub }} className="text-[12px] font-semibold">Check-in sheet for</span>
        <select value={ciDate} onChange={(e) => setCiDate(e.target.value)} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-2.5 py-2 rounded-lg text-[12.5px] font-semibold outline-none">{market.dates.filter((d) => d.status !== "skipped").map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>
        <button onClick={() => onCheckIn(market.id, ciDate)} style={{ background: C.honey, color: C.pineDeep }} className="px-3.5 py-2 rounded-lg text-[12.5px] font-bold flex items-center gap-1.5"><Printer size={15} /> Print check-in sheet</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
          <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] mb-3">Upcoming dates</p>
          <div className="flex flex-col gap-1.5">{market.dates.map((d) => (<div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: C.panel }}><span className="text-[13px] font-semibold" style={{ textDecoration: d.status === "skipped" ? "line-through" : "none", color: d.status === "skipped" ? C.faint : C.ink }}>{d.label}</span>{dtag(d.status || "generated")}</div>))}</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
          <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] mb-3">Approved vendors</p>
          <div className="flex flex-col gap-1.5">
            {approved.length === 0 && <p style={{ color: C.faint }} className="text-[12.5px]">No approved vendors yet.</p>}
            {approved.map((a) => { const v = VENDORS[a.vId]; return (<div key={a.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: C.panel }}><VAvatar v={v} size={32} r={9} /><div className="flex-1 min-w-0"><p className="text-[12.5px] font-semibold truncate">{v.name}</p><p style={{ color: C.sub }} className="text-[11px] truncate">{v.contact} · {v.phone}</p></div><span style={{ color: C.sub }} className="text-[12px]">{money(feeOf(a, market))}</span>{spill(a.status)}</div>); })}
          </div>
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
        <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] mb-3">Pricing & payments</p>
        <div className="flex items-center gap-2 flex-wrap"><Pill bg={C.paper2} fg={C.sub}>Booth {money(market.boothFee)}</Pill><Pill bg={C.paper2} fg={C.sub}>Truck {money(market.truckFee)}</Pill><Pill bg={C.paper2} fg={C.sub}>Application {money(market.appFee)}</Pill><span style={{ color: C.faint }} className="text-[12px] mx-1">·</span>{METHOD_ORDER.filter((m) => market.methods.includes(m)).map((m) => <span key={m} className="flex items-center gap-1"><MethodMark id={m} size={18} r={5} /></span>)}</div>
      </div>
      {editing && <EditMarketModal market={market} onClose={() => setEditing(false)} onSave={(patch) => { onUpdateMarket(market.id, patch); setEditing(false); }} />}
      {inviting && <InviteVendorsModal market={market} onClose={() => setInviting(false)} toast={toast} />}
    </div>
  );
}
