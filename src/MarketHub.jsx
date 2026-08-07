import React, { useState, useRef } from "react";
import {
  Home, Search, FileText, User, CalendarDays, Users, Inbox, Store, MapPin,
  Star, ChevronLeft, ChevronRight, Check, Clock, Plus, Sparkles, TrendingUp,
  DollarSign, Send, Filter, X, Bell, Heart, BadgeCheck, Zap, Crown, Calendar,
  Layers, ArrowRight, Wand2, Mail, MessageSquare, Megaphone, UserPlus, Lock,
  LogOut, Repeat, Eye, Play, CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Brand tokens                                                       */
/* ------------------------------------------------------------------ */
const C = {
  paper: "#F4F1E8", paper2: "#ECE7D8", card: "#FFFFFF",
  ink: "#18211C", sub: "#5E665D", faint: "#8B9188", line: "#E2DCCB",
  pine: "#234C3A", pineDeep: "#173525", sage: "#7FA98C",
  sageSoft: "#E4EDE4", honey: "#DE9A32", honeyDeep: "#B87A1E",
  honeySoft: "#F7E9CC", berry: "#8A3A5B", berrySoft: "#F1E1E7", danger: "#B4482F",
};
const FD = "'Fraunces', Georgia, serif";
const FB = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/* colour code: pine = operations, honey = action/reputation, berry = marketing/CRM */
const audColor = (a) => (a === "Vendors" || a === "Vendor" ? C.pine : a === "Shoppers" || a === "Shopper" ? C.berry : C.honeyDeep);

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */
const MARKETS = [
  { id: "m5", name: "Central Makers — Sanford", city: "Sanford, FL", date: "Sat · Aug 16", emoji: "🧵", cats: ["Craft", "Art", "Handmade"], booth: "10×10", fee: 65, match: 97, att: "1,800+", g1: "#234C3A", g2: "#3E7256" },
  { id: "m1", name: "Wynwood Makers Market", city: "Wynwood, Miami", date: "Sat · Aug 9", emoji: "🎨", cats: ["Craft", "Art", "Jewelry"], booth: "10×10", fee: 85, match: 94, att: "2,500+", g1: "#5B3A66", g2: "#8A5A96" },
  { id: "m2", name: "Coral Gables Farmers Market", city: "Coral Gables", date: "Sun · Aug 10", emoji: "🥬", cats: ["Produce", "Food", "Bakery"], booth: "8×8", fee: 60, match: 82, att: "1,200+", g1: "#2F6B4F", g2: "#5FA07C" },
  { id: "m6", name: "Mount Dora Craft Fair", city: "Mount Dora, FL", date: "Sat · Aug 23", emoji: "🕯️", cats: ["Craft", "Home", "Candles"], booth: "10×10", fee: 70, match: 91, att: "3,000+", g1: "#8A5A2B", g2: "#C99A5B" },
  { id: "m3", name: "Las Olas Sunday Market", city: "Fort Lauderdale", date: "Sun · Aug 17", emoji: "🌊", cats: ["Food", "Craft", "Wellness"], booth: "8×8", fee: 55, match: 76, att: "900+", g1: "#245A6B", g2: "#4E93A6" },
  { id: "m4", name: "Delray GreenMarket", city: "Delray Beach", date: "Sat · Aug 30", emoji: "🌿", cats: ["Produce", "Plants", "Food"], booth: "10×10", fee: 50, match: 69, att: "1,500+", g1: "#3A6B3A", g2: "#6FA65B" },
];

const VENDORS = [
  { id: "v1", name: "Rosalind Candle Co.", cat: "Candles & Home", city: "Miami", rating: 4.9, rep: 96, emoji: "🕯️", tags: ["Top Seller", "Reliable"], events: 42, g1: "#8A5A2B", g2: "#DE9A32" },
  { id: "v2", name: "Papi's Hot Sauce", cat: "Packaged Food", city: "Hialeah", rating: 4.8, rep: 91, emoji: "🌶️", tags: ["Crowd Draw"], events: 28, g1: "#9B2F24", g2: "#D9603F" },
  { id: "v4", name: "La Ventana Coffee", cat: "Coffee & Drinks", city: "Little Havana", rating: 4.9, rep: 93, emoji: "☕", tags: ["Top Seller"], events: 51, g1: "#5A3A24", g2: "#8A5A2B" },
  { id: "v6", name: "Sweet Palm Bakery", cat: "Bakery", city: "Kendall", rating: 4.7, rep: 90, emoji: "🥐", tags: ["Reliable"], events: 33, g1: "#8A6A2B", g2: "#C99A5B" },
  { id: "v3", name: "Bloom & Fern", cat: "Plants & Florals", city: "Coral Springs", rating: 4.6, rep: 88, emoji: "🪴", tags: ["New"], events: 12, g1: "#2F6B4F", g2: "#5FA07C" },
  { id: "v8", name: "Sol Jewelry", cat: "Jewelry", city: "Wynwood", rating: 4.7, rep: 87, emoji: "💍", tags: ["Handmade"], events: 24, g1: "#5B3A66", g2: "#8A5A96" },
  { id: "v5", name: "Coral Reef Ceramics", cat: "Art & Craft", city: "Miami Beach", rating: 4.5, rep: 85, emoji: "🐚", tags: ["Handmade"], events: 19, g1: "#245A6B", g2: "#4E93A6" },
  { id: "v7", name: "Vero Leather Goods", cat: "Leather & Craft", city: "Doral", rating: 4.4, rep: 82, emoji: "👜", tags: ["New"], events: 9, g1: "#5A3A24", g2: "#8A5A2B" },
];
const ME = VENDORS[0];
const ME_PRODUCTS = [
  { name: "Sea Salt & Sage", emoji: "🕯️", price: "$28" },
  { name: "Cuban Coffee Candle", emoji: "☕", price: "$26" },
  { name: "Mango Grove", emoji: "🥭", price: "$24" },
  { name: "Travel Tin Set", emoji: "🎁", price: "$45" },
];
const ME_REVIEWS = [
  { by: "Wynwood Makers Market", stars: 5, text: "Booth always looks incredible and she sells out by noon. First pick every time." },
  { by: "Coral Gables Market", stars: 5, text: "On time, professional, permits always in order. A dream vendor." },
];

const MY_EVENTS = [
  { id: "e1", name: "Wynwood Makers Market", date: "Sat · Aug 9", city: "Wynwood", status: "Open", applicants: 12, booked: 18, capacity: 24, fee: 85, collected: 1190 },
  { id: "e2", name: "Coral Gables Farmers Market", date: "Sun · Aug 10", city: "Coral Gables", status: "Filling", applicants: 7, booked: 22, capacity: 30, fee: 60, collected: 1140 },
  { id: "e3", name: "Central Makers — Sanford", date: "Sat · Aug 16", city: "Sanford", status: "Draft", applicants: 0, booked: 0, capacity: 40, fee: 65, collected: 0 },
];
const CATS = ["All", "Candles & Home", "Packaged Food", "Coffee & Drinks", "Bakery", "Plants & Florals", "Jewelry", "Art & Craft"];

/* CRM */
const CONTACTS = [
  { id: "c1", name: "Rosalind Candle Co.", type: "Vendor", emoji: "🕯️", tags: ["Top Seller"], last: "Paid booth · Wynwood · 2h", camps: ["New Vendor Welcome"], g1: "#8A5A2B", g2: "#DE9A32" },
  { id: "c2", name: "La Ventana Coffee", type: "Vendor", emoji: "☕", tags: ["Regular"], last: "Applied · Coral Gables · 5h", camps: ["New Vendor Welcome", "Post-Market Thank You"], g1: "#5A3A24", g2: "#8A5A2B" },
  { id: "c5", name: "Sweet Palm Bakery", type: "Vendor", emoji: "🥐", tags: ["Fee due"], last: "Booth fee due Fri", camps: ["Invoice & Fee Reminders"], g1: "#8A6A2B", g2: "#C99A5B" },
  { id: "c3", name: "Maria Delgado", type: "Lead", emoji: "👩‍🍳", tags: ["Warm"], last: "Opened recruitment email · 1d", camps: ["Vendor Recruitment"], g1: "#9B2F24", g2: "#D9603F" },
  { id: "c4", name: "Brew & Bloom Co.", type: "Lead", emoji: "🌸", tags: ["New"], last: "Downloaded vendor guide · 2d", camps: ["Vendor Recruitment"], g1: "#5B3A66", g2: "#8A5A96" },
  { id: "c7", name: "Diego Herrera", type: "Lead", emoji: "🧵", tags: ["Cold"], last: "Imported from craft-fair list", camps: [], g1: "#245A6B", g2: "#4E93A6" },
  { id: "c6", name: "Sanford Shoppers", type: "Shopper", emoji: "🛍️", tags: ["1,240 people"], last: "Weekly buzz · 38% open", camps: ["Shopper Weekly Buzz"], g1: "#2F6B4F", g2: "#5FA07C" },
];

const TEMPLATES = [
  { id: "t1", name: "New Vendor Welcome", goal: "Onboard accepted vendors", audience: "Vendors", icon: Store,
    steps: [
      { ch: "email", delay: "Day 0", title: "Welcome to Central Makers 🎉", preview: "You're in! Here's everything you need for your first market day." },
      { ch: "email", delay: "+2 days", title: "Your booth-day checklist", preview: "Tent, table, float, permits — the setup essentials in one list." },
      { ch: "sms", delay: "+5 days", title: "See you Saturday", preview: "Load-in opens 7am on Palmetto Ave. Reply with questions." },
    ] },
  { id: "t2", name: "Vendor Recruitment", goal: "Turn leads into applications", audience: "Leads", icon: Sparkles,
    steps: [
      { ch: "email", delay: "Day 0", title: "Sell with us this season", preview: "1,800 shoppers every Saturday in Sanford. Booths from $65." },
      { ch: "email", delay: "+3 days", title: "3 vendors who sold out", preview: "Real numbers from candle, coffee, and hot-sauce makers." },
      { ch: "sms", delay: "+6 days", title: "Spots filling for August", preview: "Apply in 2 minutes — link inside. Reply STOP to opt out." },
      { ch: "email", delay: "+9 days", title: "Last call this month", preview: "Applications close Friday. Reserve your booth today." },
    ] },
  { id: "t3", name: "Win-Back Lapsed Vendors", goal: "Re-engage vendors who drifted", audience: "Vendors", icon: Heart,
    steps: [
      { ch: "email", delay: "Day 0", title: "We miss you at the market", preview: "It's been a while — here's what's new this season." },
      { ch: "email", delay: "+4 days", title: "A booth, on us", preview: "Come back with 50% off your next application fee." },
      { ch: "sms", delay: "+8 days", title: "Save your old spot?", preview: "Booth 14 is open this Saturday if you want it back." },
    ] },
  { id: "t4", name: "Shopper Weekly Buzz", goal: "Drive foot traffic", audience: "Shoppers", icon: TrendingUp,
    steps: [
      { ch: "email", delay: "Every Thu", title: "This weekend at the market 🌻", preview: "New vendors, live music, and what's fresh this week." },
      { ch: "sms", delay: "Sat 8am", title: "We're open!", preview: "Live til 1pm on Palmetto Ave. Bring a tote and an appetite." },
    ] },
  { id: "t5", name: "Post-Market Thank You", goal: "Collect reviews & rebook", audience: "Vendors", icon: Star,
    steps: [
      { ch: "email", delay: "Sun 10am", title: "Thanks for a great market!", preview: "Rate your day and rebook for next week in one tap." },
      { ch: "email", delay: "+2 days", title: "Your sales-day recap", preview: "Foot traffic, peak hours, and tips for an even better next time." },
    ] },
  { id: "t6", name: "Invoice & Fee Reminders", goal: "Get booths paid on time", audience: "Vendors", icon: DollarSign,
    steps: [
      { ch: "email", delay: "Day 0", title: "Booth fee due Friday", preview: "Your $65 booth fee for Aug 16 is ready to pay." },
      { ch: "sms", delay: "+3 days", title: "Reminder: fee due tomorrow", preview: "Tap to pay and lock in your booth. Receipt auto-sent." },
    ] },
];

const SEED_CAMPAIGNS = [
  { id: "cp1", name: "Vendor Recruitment", audience: "Leads", status: "Active", enrolled: 88, sent: 264, open: "42%" },
  { id: "cp2", name: "Shopper Weekly Buzz", audience: "Shoppers", status: "Active", enrolled: 1240, sent: 3720, open: "38%" },
  { id: "cp3", name: "New Vendor Welcome", audience: "Vendors", status: "Active", enrolled: 34, sent: 102, open: "61%" },
];

/* ------------------------------------------------------------------ */
/*  Shared atoms (module scope = stable, safe for inputs)              */
/* ------------------------------------------------------------------ */
function RepSeal({ score, size = 72 }) {
  const ticks = Array.from({ length: 40 });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
      <circle cx="50" cy="50" r="47" fill={C.honeySoft} stroke={C.honey} strokeWidth="1.5" />
      {ticks.map((_, i) => {
        const a = (i / ticks.length) * Math.PI * 2;
        return <line key={i} x1={50 + Math.cos(a) * 43.5} y1={50 + Math.sin(a) * 43.5} x2={50 + Math.cos(a) * 47} y2={50 + Math.sin(a) * 47} stroke={C.honeyDeep} strokeWidth={i % 4 === 0 ? 1.6 : 0.7} opacity="0.65" />;
      })}
      <circle cx="50" cy="50" r="37" fill={C.card} stroke={C.honey} strokeWidth="0.75" />
      <text x="50" y="49" textAnchor="middle" fontFamily={FD} fontSize="27" fontWeight="600" fill={C.pine}>{score}</text>
      <text x="50" y="64" textAnchor="middle" fontFamily={FB} fontSize="7.5" letterSpacing="2" fill={C.faint}>SCORE</text>
    </svg>
  );
}
function Tile({ g1, g2, emoji, size = 56, radius = 14, fs = 26 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, background: `linear-gradient(135deg, ${g1}, ${g2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: fs, boxShadow: "inset 0 -8px 18px rgba(0,0,0,0.12)" }}>
      <span>{emoji}</span>
    </div>
  );
}
function Chip({ children, tone = "sage" }) {
  const map = { sage: { bg: C.sageSoft, fg: C.pine }, honey: { bg: C.honeySoft, fg: C.honeyDeep }, berry: { bg: C.berrySoft, fg: C.berry }, line: { bg: C.paper2, fg: C.sub } };
  const t = map[tone] || map.sage;
  return <span style={{ background: t.bg, color: t.fg, fontFamily: FB }} className="text-[10.5px] font-semibold px-2 py-[3px] rounded-full whitespace-nowrap">{children}</span>;
}
function MatchChip({ pct }) {
  const strong = pct >= 90;
  return <span style={{ background: strong ? C.pine : C.sageSoft, color: strong ? "#fff" : C.pine, fontFamily: FB }} className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"><Sparkles size={11} /> {pct}% match</span>;
}
function Stars({ n, size = 12 }) {
  return <span className="inline-flex" style={{ color: C.honey }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={size} fill={i < Math.round(n) ? C.honey : "none"} strokeWidth={1.5} />)}</span>;
}
function SectionLabel({ children, right }) {
  return <div className="flex items-end justify-between mb-2 mt-1"><span style={{ fontFamily: FB, color: C.faint, letterSpacing: "1.5px" }} className="text-[10.5px] font-bold uppercase">{children}</span>{right}</div>;
}
function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}
        className="w-full mt-1 rounded-xl px-3.5 py-3 text-[14px] outline-none" />
    </div>
  );
}
function ChannelDot({ ch, color }) {
  const Icon = ch === "sms" ? MessageSquare : Mail;
  const c = ch === "sms" ? C.honey : color;
  return <div style={{ background: c }} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"><Icon size={15} color="#fff" /></div>;
}
function DripTimeline({ steps, color }) {
  return (
    <div className="flex flex-col">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <ChannelDot ch={s.ch} color={color} />
            {i < steps.length - 1 && <div style={{ background: C.line, width: 2, flex: 1, minHeight: 18 }} />}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ background: C.paper2, color: C.sub }} className="text-[10px] font-bold px-2 py-0.5 rounded-full">{s.delay}</span>
              <span style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide">{s.ch === "sms" ? "SMS" : "Email"}</span>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-xl p-3">
              <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[13.5px] leading-tight">{s.title}</p>
              <p style={{ color: C.sub }} className="text-[12px] mt-0.5 leading-snug">{s.preview}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Login (stable component, own hooks OK)                             */
/* ------------------------------------------------------------------ */
function Login({ role, onAuth }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState("login");
  const organizer = role === "manager";
  return (
    <div className="mh-screen h-full flex flex-col" style={{ background: `linear-gradient(180deg, ${C.pineDeep} 0%, ${C.pine} 42%, ${C.paper} 42%)` }}>
      <div className="px-6 pt-10 pb-6 text-center">
        <div style={{ background: "rgba(255,255,255,.14)" }} className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Store size={26} color={C.honey} />
        </div>
        <h1 style={{ fontFamily: FD, fontWeight: 600 }} className="text-white text-[26px] tracking-tight">MarketHub</h1>
        <p className="text-white/75 text-[13px] mt-1">{organizer ? "Run your markets in one place" : "One profile. Every market."}</p>
      </div>

      <div className="flex-1 px-6">
        <div style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 16px 40px -20px rgba(0,0,0,.4)" }} className="rounded-3xl p-5">
          <div style={{ background: C.paper2 }} className="p-1 rounded-full flex mb-4">
            {[["login", "Log in"], ["signup", "Sign up"]].map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)} style={{ background: mode === k ? C.card : "transparent", color: mode === k ? C.ink : C.sub }} className="flex-1 py-2 rounded-full text-[13px] font-semibold">{l}</button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {mode === "signup" && <Field label={organizer ? "Organization" : "Business name"} value={name} onChange={setName} placeholder={organizer ? "Central Makers Markets" : "Your booth name"} />}
            <div>
              <label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Email</label>
              <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="mt-1 rounded-xl flex items-center gap-2 px-3">
                <Mail size={15} color={C.faint} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={{ color: C.ink }} className="flex-1 py-3 text-[14px] outline-none bg-transparent" />
              </div>
            </div>
            <div>
              <label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Password</label>
              <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="mt-1 rounded-xl flex items-center gap-2 px-3">
                <Lock size={15} color={C.faint} />
                <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="••••••••" style={{ color: C.ink }} className="flex-1 py-3 text-[14px] outline-none bg-transparent" />
              </div>
            </div>
          </div>

          <button onClick={onAuth} style={{ background: C.honey, color: C.pineDeep }} className="w-full mt-4 rounded-full py-3.5 font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[.98] transition-transform">
            {mode === "login" ? "Log in" : "Create account"} <ArrowRight size={17} />
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: C.line }} />
            <span style={{ color: C.faint }} className="text-[11px]">or</span>
            <div className="flex-1 h-px" style={{ background: C.line }} />
          </div>
          <div className="flex flex-col gap-2">
            {[["Continue with Google", "G"], ["Continue with Apple", ""]].map(([l, g]) => (
              <button key={l} onClick={onAuth} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="w-full rounded-full py-3 font-semibold text-[13.5px] flex items-center justify-center gap-2">
                <span style={{ fontFamily: FD }} className="text-[15px]">{g}</span>{l}
              </button>
            ))}
          </div>
        </div>
        <p style={{ color: C.faint }} className="text-center text-[11px] mt-4">Demo — enter anything, or tap Log in to continue.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav + empty                                                        */
/* ------------------------------------------------------------------ */
function BottomNav({ items, active, onTab, badge = {} }) {
  return (
    <div style={{ background: C.card, borderTop: `1px solid ${C.line}` }} className="flex items-stretch px-1 pt-1.5 pb-4">
      {items.map(([key, label, Icon]) => {
        const on = active === key;
        const b = badge[key];
        return (
          <button key={key} onClick={() => onTab(key)} className="flex-1 flex flex-col items-center gap-0.5 py-1.5">
            <div className="relative">
              <Icon size={20} color={on ? C.pine : C.faint} strokeWidth={on ? 2.4 : 1.9} />
              {b ? <span style={{ background: C.honey, color: C.pineDeep }} className="absolute -top-1.5 -right-2 text-[9px] font-bold px-1.5 py-[1px] rounded-full">{b}</span> : null}
            </div>
            <span style={{ color: on ? C.pine : C.faint, fontFamily: FB }} className="text-[9.5px] font-semibold">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div style={{ background: C.paper2 }} className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"><Icon size={24} color={C.faint} /></div>
      <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[16px]">{title}</p>
      <p style={{ color: C.sub }} className="text-[12.5px] mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

/* ================================================================== */
/*  App                                                                */
/* ================================================================== */
export default function App() {
  const [role, setRole] = useState("vendor");
  const [authed, setAuthed] = useState(true);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const toast = (msg, icon = "check") => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  /* vendor state */
  const [vStack, setVStack] = useState([{ name: "discover" }]);
  const vScreen = vStack[vStack.length - 1];
  const pushV = (s) => setVStack((st) => [...st, s]);
  const backV = () => setVStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  const vTab = (name) => setVStack([{ name }]);
  const [apps, setApps] = useState([{ marketId: "m1", status: "Accepted" }]);
  const [plan, setPlan] = useState("free");
  const [saved, setSaved] = useState([]);
  const [bio, setBio] = useState("Hand-poured soy candles made in small batches in Miami. Coconut wax, cotton wicks, scents inspired by South Florida.");
  const [polishing, setPolishing] = useState(false);

  /* manager state */
  const [mStack, setMStack] = useState([{ name: "dashboard" }]);
  const mScreen = mStack[mStack.length - 1];
  const pushM = (s) => setMStack((st) => [...st, s]);
  const backM = () => setMStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  const mTab = (name) => setMStack([{ name }]);
  const [events, setEvents] = useState(MY_EVENTS);
  const [applicantStatus, setApplicantStatus] = useState({});
  const [checkedIn, setCheckedIn] = useState({});
  const [invites, setInvites] = useState([]);
  const [vendorFilter, setVendorFilter] = useState("All");
  const [campaigns, setCampaigns] = useState(SEED_CAMPAIGNS);
  const [crmTab, setCrmTab] = useState("campaigns");
  const [crmSeg, setCrmSeg] = useState("All");
  const [evTab, setEvTab] = useState("applicants");
  const defForm = { name: "", city: "", date: "", cap: "30", fee: "65", appFee: "10", repeat: false, cats: ["Craft"] };
  const [evForm, setEvForm] = useState(defForm);

  /* actions */
  const logout = () => { setAuthed(false); setVStack([{ name: "discover" }]); setMStack([{ name: "dashboard" }]); };
  const applyToMarket = (m) => {
    if (apps.find((a) => a.marketId === m.id)) { toast("Already applied to this market"); return; }
    setApps((a) => [...a, { marketId: m.id, status: "Pending" }]);
    toast("Application sent — one tap, done");
  };
  const inviteVendor = (v) => {
    if (invites.find((i) => i.id === v.id)) { toast("Invite already sent"); return; }
    setInvites((i) => [...i, { id: v.id, name: v.name, emoji: v.emoji, when: "just now" }]);
    toast(`Invite sent to ${v.name}`, "send");
  };
  const setStatus = (vid, status) => { setApplicantStatus((s) => ({ ...s, [vid]: status })); toast(status === "Booked" ? "Vendor booked" : status === "Waitlist" ? "Moved to waitlist" : "Declined"); };
  const polish = () => {
    setPolishing(true);
    setTimeout(() => {
      setBio("Small-batch, hand-poured coconut-wax candles crafted in Miami. Clean cotton wicks and true-to-life scents drawn from South Florida — sea salt, café cubano, and ripe mango. A boutique booth that turns browsers into regulars.");
      setPolishing(false); toast("Description polished with AI", "sparkle");
    }, 1100);
  };
  const launchTemplate = (tpl) => {
    if (campaigns.find((c) => c.name === tpl.name)) { toast("Campaign already active"); return; }
    setCampaigns((c) => [{ id: "cp" + Date.now(), name: tpl.name, audience: tpl.audience, status: "Active", enrolled: 0, sent: 0, open: "—" }, ...c]);
    toast(`${tpl.name} launched`, "sparkle");
  };

  const vendorNav = [["discover", "Discover", Search], ["applications", "Applied", FileText], ["profile", "Profile", User], ["plans", "Upgrade", Crown]];
  const managerNav = [["dashboard", "Home", Home], ["events", "Events", CalendarDays], ["crm", "CRM", Megaphone], ["vendors", "Vendors", Users], ["inbox", "Inbox", Inbox]];

  return (
    <div style={{ background: `radial-gradient(120% 90% at 50% 0%, ${C.paper2} 0%, ${C.paper} 55%)`, fontFamily: FB, color: C.ink, minHeight: "100vh" }} className="w-full flex flex-col items-center py-6 px-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        .mh-scroll::-webkit-scrollbar { width:0; height:0; } .mh-scroll { scrollbar-width:none; }
        @keyframes mh-in { from {opacity:0; transform:translateY(8px);} to {opacity:1; transform:none;} }
        @keyframes mh-toast { from {opacity:0; transform:translateY(10px) scale(.96);} to {opacity:1; transform:none;} }
        @keyframes mh-shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
        .mh-screen { animation: mh-in .28s ease; } button { font-family:${FB}; }
      `}</style>

      {/* brand + role switch */}
      <div className="w-full max-w-[400px] mb-4">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <div style={{ background: C.pine }} className="w-8 h-8 rounded-[10px] flex items-center justify-center"><Store size={17} color={C.honey} /></div>
          <span style={{ fontFamily: FD, fontWeight: 600 }} className="text-[22px] tracking-tight">MarketHub</span>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="p-1 rounded-full flex shadow-sm">
          {[["vendor", "Vendor app", Store], ["manager", "Market Manager", Megaphone]].map(([key, label, Icon]) => {
            const on = role === key;
            return <button key={key} onClick={() => setRole(key)} style={{ background: on ? C.pine : "transparent", color: on ? "#fff" : C.sub }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[13px] font-semibold transition-colors"><Icon size={15} /> {label}</button>;
          })}
        </div>
        <p style={{ color: C.faint }} className="text-center text-[11px] mt-2">{authed ? "Flip sides anytime — this is a tappable demo." : "Log in below, then flip sides to see both apps."}</p>
      </div>

      {/* phone */}
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, boxShadow: "0 24px 60px -20px rgba(23,53,37,.45), 0 8px 24px -12px rgba(0,0,0,.2)" }} className="w-full max-w-[400px] rounded-[38px] overflow-hidden relative">
        <div style={{ background: C.pineDeep, color: "#fff" }} className="flex items-center justify-between px-6 pt-2.5 pb-1.5 text-[11px] font-semibold">
          <span>9:41</span><div className="flex items-center gap-1"><span>●●●</span><span className="opacity-70">◧</span><span>▮</span></div>
        </div>

        <div className="mh-scroll" style={{ height: 660, overflowY: "auto", background: C.paper }}>
          {!authed ? <Login role={role} onAuth={() => setAuthed(true)} /> : role === "vendor" ? renderVendor() : renderManager()}
        </div>

        {authed && (role === "vendor"
          ? <BottomNav items={vendorNav} active={vScreen.name} onTab={vTab} />
          : <BottomNav items={managerNav} active={mScreen.name} onTab={mTab} badge={{ inbox: invites.length || null }} />)}
      </div>

      {/* toasts */}
      <div className="fixed left-0 right-0 bottom-6 flex flex-col items-center gap-2 pointer-events-none z-50">
        {toasts.map((t) => (
          <div key={t.id} style={{ background: C.ink, color: "#fff", animation: "mh-toast .3s ease" }} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium shadow-xl">
            {t.icon === "send" ? <Send size={14} color={C.honey} /> : t.icon === "sparkle" ? <Sparkles size={14} color={C.honey} /> : <Check size={14} color={C.sage} />}{t.msg}
          </div>
        ))}
      </div>

      <p style={{ color: C.faint }} className="text-[11px] mt-5 max-w-[400px] text-center leading-relaxed">Prototype for demonstration. Data is simulated. Rebuild the screens you like in Bubble or FlutterFlow — this is your interaction spec.</p>
    </div>
  );

  /* ============================ VENDOR ============================== */
  function renderVendor() {
    if (vScreen.name === "discover") return VDiscover();
    if (vScreen.name === "market") return VMarketDetail(vScreen.market);
    if (vScreen.name === "applications") return VApplications();
    if (vScreen.name === "profile") return VProfile();
    if (vScreen.name === "plans") return VPlans();
  }
  function VHeader({ title, sub, back, action }) {
    return (
      <div style={{ background: C.paper, borderBottom: `1px solid ${C.line}` }} className="sticky top-0 z-20 px-5 pt-3 pb-3">
        <div className="flex items-center gap-2">
          {back && <button onClick={backV} style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-8 h-8 rounded-full flex items-center justify-center"><ChevronLeft size={18} color={C.ink} /></button>}
          <div className="flex-1 min-w-0"><h1 style={{ fontFamily: FD, fontWeight: 600 }} className="text-[21px] leading-tight tracking-tight truncate">{title}</h1>{sub && <p style={{ color: C.sub }} className="text-[12px] truncate">{sub}</p>}</div>
          {action}
        </div>
      </div>
    );
  }
  function VDiscover() {
    return (
      <div className="mh-screen pb-6">
        <VHeader title="Good morning, Rosalind" sub="Markets near Miami that fit your booth"
          action={<button style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-9 h-9 rounded-full flex items-center justify-center relative"><Bell size={17} color={C.ink} /><span style={{ background: C.honey }} className="absolute top-2 right-2 w-2 h-2 rounded-full" /></button>} />
        <div className="px-5 pt-4">
          <div style={{ background: `linear-gradient(120deg, ${C.pine}, ${C.pineDeep})` }} className="rounded-2xl p-4 text-white">
            <div className="flex items-center gap-1.5 mb-1"><Wand2 size={14} color={C.honey} /><span style={{ color: C.honeySoft }} className="text-[10.5px] font-bold uppercase tracking-wider">AI Match</span></div>
            <p style={{ fontFamily: FD, fontWeight: 500 }} className="text-[17px] leading-snug mb-1">6 markets are looking for candle vendors this month</p>
            <p className="text-[12px] opacity-80">Ranked by fit, distance, fees, and how your booth performed at similar events.</p>
          </div>
        </div>
        <div className="px-5 pt-5">
          <SectionLabel right={<span style={{ color: C.honey }} className="text-[11px] font-semibold">Best fit first</span>}>Recommended for you</SectionLabel>
          <div className="flex flex-col gap-3">
            {MARKETS.map((m) => {
              const applied = apps.find((a) => a.marketId === m.id);
              return (
                <button key={m.id} onClick={() => pushV({ name: "market", market: m })} style={{ background: C.card, border: `1px solid ${C.line}` }} className="text-left rounded-2xl p-3 flex gap-3 items-center active:scale-[.99] transition-transform">
                  <Tile g1={m.g1} g2={m.g2} emoji={m.emoji} size={62} radius={16} fs={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5"><MatchChip pct={m.match} />{applied && <Chip tone={applied.status === "Accepted" ? "sage" : "honey"}>{applied.status}</Chip>}</div>
                    <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] leading-tight truncate">{m.name}</p>
                    <p style={{ color: C.sub }} className="text-[12px] flex items-center gap-1 mt-0.5 truncate"><MapPin size={12} /> {m.city} · {m.date}</p>
                  </div>
                  <ChevronRight size={18} color={C.faint} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  function VMarketDetail(m) {
    const applied = apps.find((a) => a.marketId === m.id);
    const isSaved = saved.includes(m.id);
    return (
      <div className="mh-screen pb-28">
        <div style={{ background: `linear-gradient(140deg, ${m.g1}, ${m.g2})` }} className="relative px-5 pt-3 pb-6">
          <div className="flex items-center justify-between">
            <button onClick={backV} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.2)" }}><ChevronLeft size={20} color="#fff" /></button>
            <button onClick={() => { setSaved((s) => isSaved ? s.filter((x) => x !== m.id) : [...s, m.id]); toast(isSaved ? "Removed from saved" : "Saved to your list"); }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.2)" }}><Heart size={18} color="#fff" fill={isSaved ? "#fff" : "none"} /></button>
          </div>
          <div className="mt-4 flex items-end gap-3"><div className="text-[46px] leading-none">{m.emoji}</div><div className="pb-1"><MatchChip pct={m.match} /></div></div>
          <h1 style={{ fontFamily: FD, fontWeight: 600 }} className="text-white text-[24px] leading-tight mt-2">{m.name}</h1>
          <p className="text-white/85 text-[13px] flex items-center gap-1 mt-1"><MapPin size={13} /> {m.city}</p>
        </div>
        <div className="px-5 -mt-4">
          <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4 grid grid-cols-3 gap-2">
            {[["Date", m.date.replace(" · ", "\n")], ["Booth", m.booth], ["Fee", "$" + m.fee]].map(([k, v]) => (
              <div key={k} className="text-center"><p style={{ color: C.faint }} className="text-[10px] font-bold uppercase tracking-wide">{k}</p><p style={{ fontFamily: FD }} className="text-[15px] font-semibold whitespace-pre-line leading-tight mt-0.5">{v}</p></div>
            ))}
          </div>
        </div>
        <div className="px-5 pt-5">
          <SectionLabel>Why this fits you</SectionLabel>
          <div style={{ background: C.sageSoft, border: `1px solid ${C.line}` }} className="rounded-2xl p-3.5 flex flex-col gap-2">
            {["Your category (Candles) is on the wanted list", `${m.att} expected attendance — high foot traffic`, "14 mi from your saved home base"].map((t, i) => (
              <div key={i} className="flex items-center gap-2"><div style={{ background: C.pine }} className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"><Check size={11} color="#fff" /></div><span className="text-[12.5px]">{t}</span></div>
            ))}
          </div>
          <SectionLabel>Categories wanted</SectionLabel>
          <div className="flex flex-wrap gap-2">{m.cats.map((c) => <Chip key={c} tone="honey">{c}</Chip>)}</div>
          <SectionLabel>Organizer</SectionLabel>
          <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3 flex items-center gap-3">
            <div style={{ background: C.pine }} className="w-10 h-10 rounded-full flex items-center justify-center"><Store size={18} color={C.honey} /></div>
            <div className="flex-1"><p className="text-[13.5px] font-semibold">Central Makers Markets</p><p style={{ color: C.sub }} className="text-[11.5px] flex items-center gap-1"><BadgeCheck size={12} color={C.pine} /> Verified organizer · 4.8 avg</p></div>
          </div>
        </div>
        <div style={{ background: C.paper, borderTop: `1px solid ${C.line}` }} className="absolute bottom-0 left-0 right-0 px-5 py-3">
          {applied ? (
            <div style={{ background: applied.status === "Accepted" ? C.sageSoft : C.honeySoft, color: applied.status === "Accepted" ? C.pine : C.honeyDeep }} className="w-full rounded-full py-3.5 flex items-center justify-center gap-2 font-semibold text-[14px]">{applied.status === "Accepted" ? <BadgeCheck size={17} /> : <Clock size={16} />}{applied.status === "Accepted" ? "You're booked for this market" : "Application pending review"}</div>
          ) : (
            <button onClick={() => applyToMarket(m)} style={{ background: C.honey, color: C.pineDeep }} className="w-full rounded-full py-3.5 flex items-center justify-center gap-2 font-bold text-[15px] active:scale-[.98] transition-transform">Apply with one tap <ArrowRight size={17} /></button>
          )}
        </div>
      </div>
    );
  }
  function VApplications() {
    const rows = apps.map((a) => ({ ...a, m: MARKETS.find((x) => x.id === a.marketId) })).filter((r) => r.m);
    const savedRows = MARKETS.filter((m) => saved.includes(m.id));
    return (
      <div className="mh-screen pb-6">
        <VHeader title="Your applications" sub={`${rows.length} active · ${rows.filter((r) => r.status === "Accepted").length} confirmed`} />
        <div className="px-5 pt-4 flex flex-col gap-3">
          {rows.length === 0 && <EmptyState icon={FileText} title="No applications yet" body="Find a market in Discover and apply with one tap." />}
          {rows.map((r) => (
            <div key={r.marketId} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3 flex items-center gap-3">
              <Tile g1={r.m.g1} g2={r.m.g2} emoji={r.m.emoji} size={48} radius={13} fs={22} />
              <div className="flex-1 min-w-0"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14px] truncate">{r.m.name}</p><p style={{ color: C.sub }} className="text-[11.5px]">{r.m.date}</p></div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>
        {savedRows.length > 0 && (
          <div className="px-5 pt-6"><SectionLabel>Saved for later</SectionLabel><div className="flex flex-col gap-3">
            {savedRows.map((m) => (
              <button key={m.id} onClick={() => pushV({ name: "market", market: m })} style={{ background: C.card, border: `1px dashed ${C.line}` }} className="rounded-2xl p-3 flex items-center gap-3 text-left"><Tile g1={m.g1} g2={m.g2} emoji={m.emoji} size={44} radius={12} fs={20} /><div className="flex-1 min-w-0"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[13.5px] truncate">{m.name}</p><p style={{ color: C.sub }} className="text-[11px]">{m.date}</p></div><ChevronRight size={16} color={C.faint} /></button>
            ))}
          </div></div>
        )}
      </div>
    );
  }
  function StatusPill({ status }) {
    const map = { Accepted: { bg: C.sageSoft, fg: C.pine, Icon: BadgeCheck }, Pending: { bg: C.honeySoft, fg: C.honeyDeep, Icon: Clock }, Waitlisted: { bg: C.paper2, fg: C.sub, Icon: Layers } };
    const t = map[status] || map.Pending;
    return <span style={{ background: t.bg, color: t.fg }} className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full"><t.Icon size={12} /> {status}</span>;
  }
  function VProfile() {
    return (
      <div className="mh-screen pb-6">
        <VHeader title="Your profile" sub="This is what market managers see"
          action={<button onClick={() => vTab("plans")} style={{ background: plan === "free" ? C.honey : C.pine, color: plan === "free" ? C.pineDeep : "#fff" }} className="px-3 py-2 rounded-full text-[12px] font-bold flex items-center gap-1"><Crown size={13} /> {plan === "free" ? "Upgrade" : plan[0].toUpperCase() + plan.slice(1)}</button>} />
        <div className="px-5 pt-4">
          <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Tile g1={ME.g1} g2={ME.g2} emoji={ME.emoji} size={64} radius={18} fs={30} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[17px] truncate">{ME.name}</p><BadgeCheck size={16} color={C.pine} /></div>
                <p style={{ color: C.sub }} className="text-[12px]">{ME.cat} · {ME.city}</p>
                <div className="flex items-center gap-1.5 mt-1"><Stars n={ME.rating} /> <span className="text-[12px] font-semibold">{ME.rating}</span><span style={{ color: C.faint }} className="text-[11.5px]">· {ME.events} events</span></div>
              </div>
              <RepSeal score={ME.rep} size={66} />
            </div>
            <div className="flex gap-2 mt-3">{ME.tags.map((t) => <Chip key={t} tone="honey">🏅 {t}</Chip>)}<Chip tone="sage">Insured</Chip></div>
          </div>
        </div>
        <div className="px-5 pt-5">
          <SectionLabel right={<button onClick={polish} disabled={plan === "free" || polishing} style={{ background: plan === "free" ? C.paper2 : C.pine, color: plan === "free" ? C.faint : "#fff", opacity: polishing ? .7 : 1 }} className="text-[11px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1"><Sparkles size={12} /> {plan === "free" ? "AI (Pro)" : polishing ? "Polishing…" : "Polish with AI"}</button>}>About</SectionLabel>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, position: "relative", overflow: "hidden" }} className="rounded-2xl p-3.5">
            {polishing && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent, ${C.honeySoft}, transparent)`, backgroundSize: "200% 100%", animation: "mh-shimmer 1.1s linear infinite" }} />}
            <p style={{ color: C.ink, position: "relative" }} className="text-[13px] leading-relaxed">{bio}</p>
          </div>
        </div>
        <div className="px-5 pt-5">
          <SectionLabel right={<button onClick={() => toast("Add product — demo")} style={{ color: C.pine }} className="text-[11px] font-bold flex items-center gap-1"><Plus size={13} /> Add</button>}>Products</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {ME_PRODUCTS.map((p) => (
              <div key={p.name} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3"><div style={{ background: C.honeySoft }} className="h-16 rounded-xl flex items-center justify-center text-[30px] mb-2">{p.emoji}</div><p className="text-[12.5px] font-semibold leading-tight">{p.name}</p><p style={{ color: C.honeyDeep }} className="text-[12px] font-bold">{p.price}</p></div>
            ))}
          </div>
        </div>
        <div className="px-5 pt-5">
          <SectionLabel>Reviews from managers</SectionLabel>
          <div className="flex flex-col gap-3">
            {ME_REVIEWS.map((r, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3.5"><div className="flex items-center justify-between mb-1"><span className="text-[12.5px] font-semibold flex items-center gap-1"><Store size={13} color={C.pine} /> {r.by}</span><Stars n={r.stars} size={12} /></div><p style={{ color: C.sub }} className="text-[12.5px] leading-relaxed">"{r.text}"</p></div>
            ))}
          </div>
          <button onClick={logout} style={{ color: C.sub, border: `1px solid ${C.line}`, background: C.card }} className="w-full mt-5 rounded-full py-3 text-[13px] font-semibold flex items-center justify-center gap-2"><LogOut size={15} /> Log out</button>
        </div>
      </div>
    );
  }
  function VPlans() {
    const tiers = [
      { key: "free", name: "Free", price: "$0", tag: "", color: C.sub, feats: ["1 live profile", "3 applications / month", "Basic reputation score"] },
      { key: "premium", name: "Premium", price: "$14.99", per: "/mo", tag: "Most popular", color: C.pine, feats: ["Unlimited applications", "AI profile polish", "Analytics dashboard", "Event reminders", "Digital business card"] },
      { key: "pro", name: "Pro", price: "$29.99", per: "/mo", tag: "Best for full-timers", color: C.berry, feats: ["Everything in Premium", "Featured placement", "Priority in AI matching", "Early access to markets", "Sales performance insights"] },
    ];
    return (
      <div className="mh-screen pb-6">
        <VHeader title="Grow your booth" sub="One profile. Every market. Less admin." />
        <div className="px-5 pt-4 flex flex-col gap-3.5">
          {tiers.map((t) => {
            const current = plan === t.key;
            return (
              <div key={t.key} style={{ background: C.card, border: `1.5px solid ${current ? t.color : C.line}` }} className="rounded-2xl p-4 relative">
                {t.tag && <span style={{ background: t.color, color: "#fff" }} className="absolute -top-2.5 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full">{t.tag}</span>}
                <div className="flex items-end justify-between"><div><p style={{ fontFamily: FD, fontWeight: 600, color: t.color }} className="text-[19px]">{t.name}</p><p className="text-[22px] font-bold">{t.price}<span style={{ color: C.faint }} className="text-[12px] font-medium">{t.per || ""}</span></p></div>{t.key !== "free" && (t.key === "pro" ? <Crown size={26} color={t.color} /> : <Zap size={26} color={t.color} />)}</div>
                <div className="flex flex-col gap-1.5 mt-3">{t.feats.map((f) => <div key={f} className="flex items-center gap-2"><Check size={14} color={t.color} strokeWidth={2.5} /><span className="text-[12.5px]">{f}</span></div>)}</div>
                <button onClick={() => { setPlan(t.key); toast(t.key === "free" ? "Switched to Free" : `${t.name} unlocked`, "sparkle"); }} disabled={current} style={{ background: current ? C.paper2 : t.color, color: current ? C.sub : "#fff" }} className="w-full mt-3.5 rounded-full py-3 font-bold text-[14px] active:scale-[.98] transition-transform">{current ? "Current plan" : t.key === "free" ? "Downgrade" : `Choose ${t.name}`}</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ============================ MANAGER ============================= */
  function renderManager() {
    if (mScreen.name === "dashboard") return MDashboard();
    if (mScreen.name === "events") return MEvents();
    if (mScreen.name === "create") return MCreate();
    if (mScreen.name === "event") return MEventDetail(mScreen.event);
    if (mScreen.name === "crm") return MCRM();
    if (mScreen.name === "template") return MTemplateDetail(mScreen.tpl);
    if (mScreen.name === "contact") return MContactDetail(mScreen.contact);
    if (mScreen.name === "vendors") return MVendors();
    if (mScreen.name === "vendor") return MVendorDetail(mScreen.vendor);
    if (mScreen.name === "inbox") return MInbox();
  }
  function MHeader({ title, sub, back, action }) {
    return (
      <div style={{ background: C.pineDeep }} className="sticky top-0 z-20 px-5 pt-3 pb-4">
        <div className="flex items-center gap-2">
          {back && <button onClick={backM} style={{ background: "rgba(255,255,255,.15)" }} className="w-8 h-8 rounded-full flex items-center justify-center"><ChevronLeft size={18} color="#fff" /></button>}
          <div className="flex-1 min-w-0"><h1 style={{ fontFamily: FD, fontWeight: 600 }} className="text-[21px] leading-tight tracking-tight text-white truncate">{title}</h1>{sub && <p className="text-[12px] text-white/70 truncate">{sub}</p>}</div>
          {action}
        </div>
      </div>
    );
  }
  function MDashboard() {
    const stats = [
      { label: "Active events", value: events.filter((e) => e.status !== "Draft").length, Icon: CalendarDays, tone: C.pine },
      { label: "Pending apps", value: 19, Icon: FileText, tone: C.honeyDeep },
      { label: "Fees collected", value: "$2,330", Icon: DollarSign, tone: C.pine },
      { label: "In campaigns", value: "1.3k", Icon: Megaphone, tone: C.berry },
    ];
    return (
      <div className="mh-screen pb-6">
        <MHeader title="Central Makers" sub="Sunday · 4 markets running this month"
          action={<button onClick={logout} style={{ background: "rgba(255,255,255,.15)" }} className="w-9 h-9 rounded-full flex items-center justify-center"><LogOut size={16} color="#fff" /></button>} />
        <div className="px-5 pt-4 grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3.5"><div style={{ background: C.paper2 }} className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"><s.Icon size={16} color={s.tone} /></div><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[24px] leading-none">{s.value}</p><p style={{ color: C.sub }} className="text-[11.5px] mt-1">{s.label}</p></div>
          ))}
        </div>
        <div className="px-5 pt-5">
          <SectionLabel right={<button onClick={() => mTab("events")} style={{ color: C.pine }} className="text-[11px] font-bold">All events</button>}>Next up</SectionLabel>
          <button onClick={() => { setEvTab("applicants"); pushM({ name: "event", event: events[0] }); }} style={{ background: `linear-gradient(135deg, ${C.pine}, ${C.pineDeep})` }} className="w-full text-left rounded-2xl p-4 text-white active:scale-[.99] transition-transform">
            <div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wide opacity-80">{events[0].date}</span><span style={{ background: C.honey, color: C.pineDeep }} className="text-[10.5px] font-bold px-2 py-1 rounded-full">{events[0].booked}/{events[0].capacity} booths</span></div>
            <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[19px] mt-1.5">{events[0].name}</p>
            <p className="text-[12px] opacity-80 flex items-center gap-1 mt-0.5"><MapPin size={12} /> {events[0].city}</p>
            <div className="flex items-center gap-2 mt-3"><div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden"><div style={{ width: `${events[0].booked / events[0].capacity * 100}%`, background: C.honey }} className="h-full rounded-full" /></div><span className="text-[11px] font-semibold">{events[0].applicants} new applicants</span></div>
          </button>
        </div>
        <div className="px-5 pt-5">
          <SectionLabel right={<button onClick={() => mTab("crm")} style={{ color: C.berry }} className="text-[11px] font-bold">Open CRM</button>}>Marketing at a glance</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {campaigns.slice(0, 3).map((c) => (
              <button key={c.id} onClick={() => mTab("crm")} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3 flex items-center gap-3 text-left">
                <div style={{ background: audColor(c.audience) }} className="w-9 h-9 rounded-xl flex items-center justify-center"><Megaphone size={16} color="#fff" /></div>
                <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold truncate">{c.name}</p><p style={{ color: C.sub }} className="text-[11px]">{c.audience} · {c.enrolled.toLocaleString()} enrolled</p></div>
                <div className="text-right"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14px]">{c.open}</p><p style={{ color: C.faint }} className="text-[9.5px] uppercase font-bold">open</p></div>
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 pt-5">
          <SectionLabel right={<span style={{ color: C.honey }} className="text-[11px] font-semibold flex items-center gap-1"><Sparkles size={12} /> AI picks</span>}>Fill your open booths</SectionLabel>
          <div className="flex gap-3 overflow-x-auto mh-scroll pb-1 -mx-5 px-5">
            {VENDORS.slice(0, 5).map((v) => (
              <button key={v.id} onClick={() => pushM({ name: "vendor", vendor: v })} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3 w-[130px] flex-shrink-0 text-left"><div className="flex justify-between items-start"><Tile g1={v.g1} g2={v.g2} emoji={v.emoji} size={40} radius={12} fs={19} /><RepSeal score={v.rep} size={40} /></div><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[12.5px] leading-tight mt-2 truncate">{v.name}</p><p style={{ color: C.sub }} className="text-[10.5px] truncate">{v.cat}</p></button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  function EventStatus({ status }) {
    const map = { Open: { bg: C.sageSoft, fg: C.pine }, Filling: { bg: C.honeySoft, fg: C.honeyDeep }, Draft: { bg: C.paper2, fg: C.sub } };
    const t = map[status] || map.Open;
    return <span style={{ background: t.bg, color: t.fg }} className="text-[10.5px] font-bold px-2 py-1 rounded-full">{status}</span>;
  }
  function MEvents() {
    return (
      <div className="mh-screen pb-6">
        <MHeader title="Your events" sub={`${events.length} markets`} action={<button onClick={() => { setEvForm(defForm); pushM({ name: "create" }); }} style={{ background: C.honey }} className="w-9 h-9 rounded-full flex items-center justify-center"><Plus size={20} color={C.pineDeep} /></button>} />
        <div className="px-5 pt-4 flex flex-col gap-3">
          {events.map((e) => (
            <button key={e.id} onClick={() => { setEvTab("applicants"); pushM({ name: "event", event: e }); }} style={{ background: C.card, border: `1px solid ${C.line}` }} className="text-left rounded-2xl p-4 active:scale-[.99] transition-transform">
              <div className="flex items-center justify-between mb-1.5"><span style={{ color: C.sub }} className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1"><Calendar size={12} /> {e.date}</span><EventStatus status={e.status} /></div>
              <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[16px] leading-tight">{e.name}</p>
              <p style={{ color: C.sub }} className="text-[12px] flex items-center gap-1 mt-0.5"><MapPin size={12} /> {e.city}</p>
              <div className="flex items-center gap-3 mt-3"><div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.paper2 }}><div style={{ width: `${e.capacity ? e.booked / e.capacity * 100 : 0}%`, background: C.pine }} className="h-full rounded-full" /></div><span style={{ color: C.sub }} className="text-[11px] font-semibold">{e.booked}/{e.capacity} booths</span>{e.applicants > 0 && <span style={{ background: C.honeySoft, color: C.honeyDeep }} className="text-[10.5px] font-bold px-2 py-0.5 rounded-full">{e.applicants} new</span>}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }
  function MCreate() {
    const ready = evForm.name && evForm.city && evForm.date;
    const opts = ["Produce", "Craft", "Food", "Bakery", "Coffee", "Plants", "Jewelry", "Art", "Wellness"];
    const create = () => {
      setEvents((ev) => [{ id: "e" + Date.now(), name: evForm.name, city: evForm.city, date: evForm.date, status: "Open", applicants: 0, booked: 0, capacity: parseInt(evForm.cap) || 30, fee: parseInt(evForm.fee) || 60, collected: 0 }, ...ev]);
      toast(evForm.repeat ? "Recurring market created" : "Market created — now open for vendors", "sparkle");
      backM();
    };
    return (
      <div className="mh-screen pb-28">
        <MHeader title="New market" back />
        <div className="px-5 pt-4 flex flex-col gap-3.5">
          <Field label="Market name" value={evForm.name} onChange={(v) => setEvForm((f) => ({ ...f, name: v }))} placeholder="e.g. Downtown Night Market" />
          <Field label="Location" value={evForm.city} onChange={(v) => setEvForm((f) => ({ ...f, city: v }))} placeholder="e.g. Sanford, FL" />
          <div className="grid grid-cols-2 gap-3"><Field label="Date" value={evForm.date} onChange={(v) => setEvForm((f) => ({ ...f, date: v }))} placeholder="Sat · Sep 6" /><Field label="Booths" value={evForm.cap} onChange={(v) => setEvForm((f) => ({ ...f, cap: v }))} placeholder="30" /></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Booth fee ($)" value={evForm.fee} onChange={(v) => setEvForm((f) => ({ ...f, fee: v }))} placeholder="65" /><Field label="Application fee ($)" value={evForm.appFee} onChange={(v) => setEvForm((f) => ({ ...f, appFee: v }))} placeholder="10" /></div>
          <button onClick={() => setEvForm((f) => ({ ...f, repeat: !f.repeat }))} style={{ background: C.card, border: `1px solid ${evForm.repeat ? C.pine : C.line}` }} className="rounded-xl px-3.5 py-3 flex items-center gap-2.5">
            <div style={{ background: evForm.repeat ? C.pine : C.paper2 }} className="w-5 h-5 rounded-md flex items-center justify-center">{evForm.repeat && <Check size={13} color="#fff" />}</div>
            <div className="flex-1 text-left"><p className="text-[13px] font-semibold flex items-center gap-1.5"><Repeat size={13} color={C.pine} /> Repeat weekly</p><p style={{ color: C.faint }} className="text-[11px]">Auto-clone booths & reminders each week</p></div>
          </button>
          <div>
            <label style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Vendor categories wanted</label>
            <div className="flex flex-wrap gap-2 mt-2">{opts.map((o) => { const on = evForm.cats.includes(o); return <button key={o} onClick={() => setEvForm((f) => ({ ...f, cats: on ? f.cats.filter((x) => x !== o) : [...f.cats, o] }))} style={{ background: on ? C.pine : C.card, color: on ? "#fff" : C.sub, border: `1px solid ${on ? C.pine : C.line}` }} className="text-[12px] font-semibold px-3 py-2 rounded-full">{o}</button>; })}</div>
          </div>
        </div>
        <div style={{ background: C.paper, borderTop: `1px solid ${C.line}` }} className="absolute bottom-0 left-0 right-0 px-5 py-3"><button onClick={create} disabled={!ready} style={{ background: ready ? C.honey : C.paper2, color: ready ? C.pineDeep : C.faint }} className="w-full rounded-full py-3.5 font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[.98] transition-transform">Publish market <ArrowRight size={17} /></button></div>
      </div>
    );
  }
  function MEventDetail(e) {
    const applicants = VENDORS.slice(0, 5);
    const recs = VENDORS.slice(5);
    const list = evTab === "applicants" ? applicants : recs;
    return (
      <div className="mh-screen pb-6">
        <MHeader title={e.name} sub={`${e.date} · ${e.city}`} back action={<EventStatus status={e.status} />} />
        {/* fees */}
        <div className="px-5 pt-4">
          <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2"><span style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px] flex items-center gap-1.5"><DollarSign size={16} color={C.pine} /> Booth fees</span><span style={{ color: C.sub }} className="text-[12px] font-semibold">${e.collected} / ${e.capacity * e.fee}</span></div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: C.paper2 }}><div style={{ width: `${e.capacity ? e.collected / (e.capacity * e.fee) * 100 : 0}%`, background: C.pine }} className="h-full rounded-full" /></div>
            <div className="flex gap-2 mt-3"><span style={{ background: C.sageSoft, color: C.pine }} className="text-[10.5px] font-bold px-2 py-1 rounded-full">Auto-invoiced</span><span style={{ background: C.honeySoft, color: C.honeyDeep }} className="text-[10.5px] font-bold px-2 py-1 rounded-full">3 unpaid</span></div>
          </div>
        </div>
        {/* booth map */}
        <div className="px-5 pt-4">
          <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2"><span style={{ fontFamily: FD, fontWeight: 600 }} className="text-[15px]">Booth map</span><span style={{ color: C.sub }} className="text-[12px] font-semibold">{e.booked}/{e.capacity} filled</span></div>
            <div className="grid grid-cols-8 gap-1.5">{Array.from({ length: Math.min(e.capacity, 24) }).map((_, i) => { const filled = i < e.booked; return <div key={i} style={{ background: filled ? C.pine : C.paper2, border: `1px solid ${filled ? C.pine : C.line}` }} className="aspect-square rounded-[5px]" />; })}</div>
            <div className="flex items-center gap-4 mt-3"><span className="flex items-center gap-1.5 text-[11px]" style={{ color: C.sub }}><span style={{ background: C.pine }} className="w-3 h-3 rounded-[3px]" /> Booked</span><span className="flex items-center gap-1.5 text-[11px]" style={{ color: C.sub }}><span style={{ background: C.paper2, border: `1px solid ${C.line}` }} className="w-3 h-3 rounded-[3px]" /> Open</span></div>
          </div>
        </div>
        {/* broadcast */}
        <div className="px-5 pt-3">
          <button onClick={() => toast("Reminder broadcast to 18 vendors", "send")} style={{ background: C.berrySoft, border: `1px solid ${C.line}` }} className="w-full rounded-2xl p-3 flex items-center gap-3"><div style={{ background: C.berry }} className="w-9 h-9 rounded-xl flex items-center justify-center"><Megaphone size={16} color="#fff" /></div><div className="flex-1 text-left"><p className="text-[13px] font-semibold">Broadcast to all vendors</p><p style={{ color: C.sub }} className="text-[11px]">Weather, setup notes, last-minute changes</p></div><Send size={16} color={C.berry} /></button>
        </div>
        {/* tabs */}
        <div className="px-5 pt-4"><div style={{ background: C.paper2 }} className="p-1 rounded-full flex">{[["applicants", `Applicants · ${applicants.length}`], ["recs", "AI recommended"]].map(([k, l]) => <button key={k} onClick={() => setEvTab(k)} style={{ background: evTab === k ? C.card : "transparent", color: evTab === k ? C.ink : C.sub }} className="flex-1 py-2 rounded-full text-[12.5px] font-semibold">{l}</button>)}</div></div>
        <div className="px-5 pt-4 flex flex-col gap-3">
          {list.map((v) => {
            const st = applicantStatus[v.id];
            const ci = checkedIn[v.id];
            return (
              <div key={v.id} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  <Tile g1={v.g1} g2={v.g2} emoji={v.emoji} size={46} radius={13} fs={21} />
                  <button onClick={() => pushM({ name: "vendor", vendor: v })} className="flex-1 min-w-0 text-left"><div className="flex items-center gap-1.5"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14px] truncate">{v.name}</p><BadgeCheck size={13} color={C.pine} /></div><p style={{ color: C.sub }} className="text-[11.5px] truncate">{v.cat} · {v.city}</p><div className="flex items-center gap-1 mt-0.5"><FileText size={11} color={C.faint} /><span style={{ color: C.faint }} className="text-[10.5px]">Permit + COI on file</span></div></button>
                  <RepSeal score={v.rep} size={42} />
                </div>
                {st === "Booked" ? (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span style={{ background: C.sageSoft, color: C.pine }} className="flex-1 rounded-full py-2 text-center text-[12px] font-bold flex items-center justify-center gap-1.5"><BadgeCheck size={14} /> Booked · Fee paid</span>
                    <button onClick={() => { setCheckedIn((c) => ({ ...c, [v.id]: !c[v.id] })); toast(ci ? "Check-in undone" : "Checked in for market day"); }} style={{ background: ci ? C.pine : C.card, color: ci ? "#fff" : C.pine, border: `1px solid ${ci ? C.pine : C.line}` }} className="rounded-full px-3 py-2 text-[12px] font-bold flex items-center gap-1">{ci ? <CheckCircle2 size={14} /> : <Check size={14} />} {ci ? "In" : "Check in"}</button>
                  </div>
                ) : st ? (
                  <div style={{ background: st === "Waitlist" ? C.honeySoft : C.paper2, color: st === "Waitlist" ? C.honeyDeep : C.sub }} className="mt-2.5 rounded-full py-2 text-center text-[12px] font-bold flex items-center justify-center gap-1.5">{st === "Waitlist" ? <Layers size={13} /> : <X size={13} />} {st === "Waitlist" ? "On waitlist" : "Declined"}</div>
                ) : (
                  <div className="flex gap-2 mt-2.5"><button onClick={() => setStatus(v.id, "Booked")} style={{ background: C.pine, color: "#fff" }} className="flex-1 rounded-full py-2 text-[12.5px] font-bold flex items-center justify-center gap-1"><Check size={14} /> Book</button><button onClick={() => setStatus(v.id, "Waitlist")} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.sub }} className="rounded-full px-4 py-2 text-[12.5px] font-semibold">Waitlist</button><button onClick={() => setStatus(v.id, "Declined")} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.sub }} className="rounded-full px-3 py-2"><X size={15} /></button></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---- CRM ---- */
  function MCRM() {
    const segs = ["All", "Vendor", "Lead", "Shopper"];
    const contacts = crmSeg === "All" ? CONTACTS : CONTACTS.filter((c) => c.type === crmSeg);
    return (
      <div className="mh-screen pb-6">
        <MHeader title="Marketing CRM" sub="Contacts, campaigns & drip templates"
          action={<button onClick={() => { setCrmTab("templates"); toast("Pick a template to launch"); }} style={{ background: C.honey }} className="w-9 h-9 rounded-full flex items-center justify-center"><Plus size={20} color={C.pineDeep} /></button>} />
        <div className="px-5 pt-4"><div style={{ background: C.paper2 }} className="p-1 rounded-full flex">{[["campaigns", "Campaigns"], ["templates", "Templates"], ["contacts", "Contacts"]].map(([k, l]) => <button key={k} onClick={() => setCrmTab(k)} style={{ background: crmTab === k ? C.card : "transparent", color: crmTab === k ? C.ink : C.sub }} className="flex-1 py-2 rounded-full text-[12.5px] font-semibold">{l}</button>)}</div></div>

        {crmTab === "campaigns" && (
          <div className="px-5 pt-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[["Active", campaigns.length], ["Reached", "1.4k"], ["Avg open", "44%"]].map(([k, v]) => <div key={k} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-xl p-3 text-center"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[18px]">{v}</p><p style={{ color: C.faint }} className="text-[9.5px] uppercase font-bold tracking-wide mt-0.5">{k}</p></div>)}
            </div>
            <div className="flex flex-col gap-3">
              {campaigns.map((c) => (
                <div key={c.id} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div style={{ background: audColor(c.audience) }} className="w-10 h-10 rounded-xl flex items-center justify-center"><Megaphone size={18} color="#fff" /></div>
                    <div className="flex-1 min-w-0"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14.5px] truncate">{c.name}</p><div className="flex items-center gap-1.5 mt-0.5"><span style={{ background: C.sageSoft, color: C.pine }} className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1"><Play size={9} /> {c.status}</span><span style={{ color: C.sub }} className="text-[11px]">{c.audience}</span></div></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                    {[["Enrolled", c.enrolled.toLocaleString()], ["Sent", c.sent.toLocaleString()], ["Open rate", c.open]].map(([k, v]) => <div key={k} className="text-center"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14px]">{v}</p><p style={{ color: C.faint }} className="text-[9.5px] uppercase font-bold">{k}</p></div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {crmTab === "templates" && (
          <div className="px-5 pt-4">
            <p style={{ color: C.sub }} className="text-[12px] mb-3 leading-relaxed">Prebuilt drip sequences for markets. Tap to preview the emails & texts, then launch in one tap.</p>
            <div className="flex flex-col gap-3">
              {TEMPLATES.map((t) => {
                const live = campaigns.find((c) => c.name === t.name);
                const col = audColor(t.audience);
                return (
                  <button key={t.id} onClick={() => pushM({ name: "template", tpl: t })} style={{ background: C.card, border: `1px solid ${C.line}` }} className="text-left rounded-2xl p-4 active:scale-[.99] transition-transform">
                    <div className="flex items-center gap-3">
                      <div style={{ background: col }} className="w-10 h-10 rounded-xl flex items-center justify-center"><t.icon size={18} color="#fff" /></div>
                      <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14.5px] truncate">{t.name}</p>{live && <span style={{ background: C.sageSoft, color: C.pine }} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full">LIVE</span>}</div><p style={{ color: C.sub }} className="text-[11.5px] truncate">{t.goal}</p></div>
                      <ChevronRight size={18} color={C.faint} />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span style={{ background: C.berrySoft, color: col }} className="text-[10px] font-bold px-2 py-1 rounded-full">{t.audience}</span>
                      <span style={{ color: C.faint }} className="text-[11px] flex items-center gap-1">{t.steps.filter((s) => s.ch === "email").length > 0 && <><Mail size={12} /> {t.steps.filter((s) => s.ch === "email").length}</>}{t.steps.some((s) => s.ch === "sms") && <span className="flex items-center gap-1 ml-1"><MessageSquare size={12} /> {t.steps.filter((s) => s.ch === "sms").length}</span>}</span>
                      <span style={{ color: C.faint }} className="text-[11px]">· {t.steps.length} steps</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {crmTab === "contacts" && (
          <div className="px-5 pt-4">
            <div className="flex gap-2 mb-3 overflow-x-auto mh-scroll">{segs.map((s) => { const n = s === "All" ? CONTACTS.length : CONTACTS.filter((c) => c.type === s).length; return <button key={s} onClick={() => setCrmSeg(s)} style={{ background: crmSeg === s ? C.pine : C.card, color: crmSeg === s ? "#fff" : C.sub, border: `1px solid ${crmSeg === s ? C.pine : C.line}` }} className="text-[12px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">{s === "All" ? "All" : s + "s"} · {n}</button>; })}</div>
            <div className="flex flex-col gap-2.5">
              {contacts.map((c) => (
                <button key={c.id} onClick={() => pushM({ name: "contact", contact: c })} style={{ background: C.card, border: `1px solid ${C.line}` }} className="text-left rounded-2xl p-3 flex items-center gap-3">
                  <Tile g1={c.g1} g2={c.g2} emoji={c.emoji} size={44} radius={13} fs={20} />
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[13.5px] truncate">{c.name}</p><span style={{ background: C.berrySoft, color: audColor(c.type) }} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full">{c.type}</span></div><p style={{ color: C.sub }} className="text-[11px] truncate mt-0.5">{c.last}</p></div>
                  <ChevronRight size={16} color={C.faint} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  function MTemplateDetail(t) {
    const col = audColor(t.audience);
    const live = campaigns.find((c) => c.name === t.name);
    return (
      <div className="mh-screen pb-28">
        <MHeader title={t.name} sub={t.goal} back />
        <div className="px-5 pt-4">
          <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4 flex items-center gap-3 mb-4">
            <div style={{ background: col }} className="w-11 h-11 rounded-xl flex items-center justify-center"><t.icon size={20} color="#fff" /></div>
            <div className="flex-1"><div className="flex gap-2"><span style={{ background: C.berrySoft, color: col }} className="text-[10px] font-bold px-2 py-1 rounded-full">{t.audience}</span><span style={{ background: C.paper2, color: C.sub }} className="text-[10px] font-bold px-2 py-1 rounded-full">{t.steps.length} steps</span></div><p style={{ color: C.sub }} className="text-[11.5px] mt-1.5">Fully editable after you launch it.</p></div>
          </div>
          <SectionLabel>The sequence</SectionLabel>
          <DripTimeline steps={t.steps} color={col} />
        </div>
        <div style={{ background: C.paper, borderTop: `1px solid ${C.line}` }} className="absolute bottom-0 left-0 right-0 px-5 py-3 flex gap-2">
          <button onClick={() => toast("Opening editor — demo")} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.pine }} className="rounded-full px-5 py-3.5 font-semibold text-[14px] flex items-center gap-1.5"><Eye size={16} /> Edit</button>
          <button onClick={() => { launchTemplate(t); backM(); }} disabled={!!live} style={{ background: live ? C.paper2 : C.honey, color: live ? C.sub : C.pineDeep }} className="flex-1 rounded-full py-3.5 font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[.98] transition-transform">{live ? "Already live" : <>Launch campaign <Play size={16} /></>}</button>
        </div>
      </div>
    );
  }
  function MContactDetail(c) {
    const timeline = [
      { icon: Mail, text: "Opened “This weekend at the market”", when: "2h ago", color: C.berry },
      { icon: MessageSquare, text: "Received market-day SMS", when: "1d ago", color: C.honey },
      { icon: DollarSign, text: c.type === "Vendor" ? "Paid booth fee — $65" : "Enrolled in campaign", when: "3d ago", color: C.pine },
      { icon: UserPlus, text: "Added to CRM", when: "2 wk ago", color: C.sub },
    ];
    return (
      <div className="mh-screen pb-6">
        <MHeader title={c.name} sub={c.type} back />
        <div className="px-5 pt-4">
          <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4 flex items-center gap-3">
            <Tile g1={c.g1} g2={c.g2} emoji={c.emoji} size={56} radius={16} fs={26} />
            <div className="flex-1"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[16px]">{c.name}</p><div className="flex gap-1.5 mt-1">{c.tags.map((t) => <Chip key={t} tone="line">{t}</Chip>)}</div></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => toast("Message drafted — demo")} style={{ background: C.pine, color: "#fff" }} className="flex-1 rounded-full py-2.5 text-[13px] font-bold flex items-center justify-center gap-1.5"><Send size={14} /> Message</button>
            <button onClick={() => toast(`Added to a campaign`, "sparkle")} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.berry }} className="flex-1 rounded-full py-2.5 text-[13px] font-bold flex items-center justify-center gap-1.5"><Megaphone size={14} /> Add to drip</button>
          </div>
          {c.camps.length > 0 && (<><SectionLabel>In campaigns</SectionLabel><div className="flex flex-wrap gap-2">{c.camps.map((cp) => <span key={cp} style={{ background: C.berrySoft, color: C.berry }} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full flex items-center gap-1"><Megaphone size={11} /> {cp}</span>)}</div></>)}
          <SectionLabel>Activity</SectionLabel>
          <div className="flex flex-col">
            {timeline.map((a, i) => (
              <div key={i} className="flex gap-3"><div className="flex flex-col items-center"><div style={{ background: a.color }} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"><a.icon size={13} color="#fff" /></div>{i < timeline.length - 1 && <div style={{ background: C.line, width: 2, flex: 1, minHeight: 14 }} />}</div><div className="flex-1 pb-3"><p className="text-[12.5px]">{a.text}</p><p style={{ color: C.faint }} className="text-[10.5px]">{a.when}</p></div></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function MVendors() {
    const list = vendorFilter === "All" ? VENDORS : VENDORS.filter((v) => v.cat === vendorFilter);
    return (
      <div className="mh-screen pb-6">
        <MHeader title="Discover vendors" sub={`${VENDORS.length} in your network`} action={<div style={{ background: "rgba(255,255,255,.15)" }} className="w-9 h-9 rounded-full flex items-center justify-center"><Filter size={17} color="#fff" /></div>} />
        <div className="px-5 pt-4"><div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-full flex items-center gap-2 px-4 py-3"><Search size={17} color={C.faint} /><span style={{ color: C.faint }} className="text-[13px]">Search vendors, products, cities…</span></div></div>
        <div className="pt-3 pb-1 flex gap-2 overflow-x-auto mh-scroll px-5">{CATS.map((c) => <button key={c} onClick={() => setVendorFilter(c)} style={{ background: vendorFilter === c ? C.pine : C.card, color: vendorFilter === c ? "#fff" : C.sub, border: `1px solid ${vendorFilter === c ? C.pine : C.line}` }} className="text-[12px] font-semibold px-3.5 py-2 rounded-full whitespace-nowrap flex-shrink-0">{c}</button>)}</div>
        <div className="px-5 pt-3 flex flex-col gap-3">
          {list.map((v) => {
            const invited = invites.find((i) => i.id === v.id);
            return (
              <div key={v.id} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-3 flex items-center gap-3">
                <button onClick={() => pushM({ name: "vendor", vendor: v })} className="flex items-center gap-3 flex-1 min-w-0 text-left"><Tile g1={v.g1} g2={v.g2} emoji={v.emoji} size={50} radius={14} fs={23} /><div className="flex-1 min-w-0"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14px] truncate">{v.name}</p><p style={{ color: C.sub }} className="text-[11.5px] truncate">{v.cat} · {v.city}</p><div className="flex gap-1 mt-1">{v.tags.map((t) => <Chip key={t} tone="line">{t}</Chip>)}</div></div></button>
                <div className="flex flex-col items-center gap-1.5"><RepSeal score={v.rep} size={44} /><button onClick={() => inviteVendor(v)} disabled={!!invited} style={{ background: invited ? C.sageSoft : C.honey, color: invited ? C.pine : C.pineDeep }} className="text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">{invited ? <><Check size={12} /> Sent</> : <><Send size={12} /> Invite</>}</button></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  function MVendorDetail(v) {
    const invited = invites.find((i) => i.id === v.id);
    return (
      <div className="mh-screen pb-28">
        <div style={{ background: `linear-gradient(140deg, ${v.g1}, ${v.g2})` }} className="px-5 pt-3 pb-6 relative">
          <button onClick={backM} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,.2)" }}><ChevronLeft size={20} color="#fff" /></button>
          <div className="flex items-center gap-4 mt-4"><Tile g1="rgba(255,255,255,.25)" g2="rgba(255,255,255,.1)" emoji={v.emoji} size={72} radius={20} fs={34} /><div className="flex-1"><div className="flex items-center gap-1.5"><h1 style={{ fontFamily: FD, fontWeight: 600 }} className="text-white text-[21px] leading-tight">{v.name}</h1><BadgeCheck size={17} color="#fff" /></div><p className="text-white/85 text-[12.5px]">{v.cat} · {v.city}</p><div className="flex items-center gap-1.5 mt-1"><Stars n={v.rating} /><span className="text-white text-[12px] font-semibold">{v.rating}</span></div></div></div>
        </div>
        <div className="px-5 -mt-4"><div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4 flex items-center justify-between"><div className="text-center flex-1"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[19px]">{v.events}</p><p style={{ color: C.faint }} className="text-[10.5px] uppercase font-bold tracking-wide">Events</p></div><div className="w-px h-9" style={{ background: C.line }} /><div className="text-center flex-1 flex flex-col items-center"><RepSeal score={v.rep} size={54} /></div><div className="w-px h-9" style={{ background: C.line }} /><div className="text-center flex-1"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[19px]">98%</p><p style={{ color: C.faint }} className="text-[10.5px] uppercase font-bold tracking-wide">Show rate</p></div></div></div>
        <div className="px-5 pt-5">
          <SectionLabel>Badges</SectionLabel><div className="flex flex-wrap gap-2">{v.tags.map((t) => <Chip key={t} tone="honey">🏅 {t}</Chip>)}<Chip tone="sage">Insured</Chip><Chip tone="sage">Permits on file</Chip></div>
          <SectionLabel>Why the AI recommends them</SectionLabel>
          <div style={{ background: C.sageSoft, border: `1px solid ${C.line}` }} className="rounded-2xl p-3.5 flex flex-col gap-2">{["Category matches 2 of your open markets", "Strong crowd draw at similar events", "98% show rate over " + v.events + " bookings"].map((t, i) => <div key={i} className="flex items-center gap-2"><div style={{ background: C.pine }} className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"><Check size={11} color="#fff" /></div><span className="text-[12.5px]">{t}</span></div>)}</div>
        </div>
        <div style={{ background: C.paper, borderTop: `1px solid ${C.line}` }} className="absolute bottom-0 left-0 right-0 px-5 py-3 flex gap-2"><button onClick={() => inviteVendor(v)} disabled={!!invited} style={{ background: invited ? C.sageSoft : C.honey, color: invited ? C.pine : C.pineDeep }} className="flex-1 rounded-full py-3.5 font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[.98] transition-transform">{invited ? <><Check size={17} /> Invite sent</> : <><Send size={16} /> Invite to a market</>}</button><button onClick={() => toast("Message thread opened — demo")} style={{ background: C.card, border: `1px solid ${C.line}` }} className="w-14 rounded-full flex items-center justify-center"><Inbox size={19} color={C.pine} /></button></div>
      </div>
    );
  }
  function MInbox() {
    const threads = [
      { name: "Rosalind Candle Co.", emoji: "🕯️", last: "Confirmed for Wynwood — see you Sat!", when: "2h", unread: true, g1: ME.g1, g2: ME.g2 },
      { name: "La Ventana Coffee", emoji: "☕", last: "Do you have power hookups at the Gables market?", when: "5h", unread: false, g1: "#5A3A24", g2: "#8A5A2B" },
      ...invites.map((i) => ({ name: i.name, emoji: i.emoji, last: "Invite sent · awaiting reply", when: i.when, unread: true, g1: "#2F6B4F", g2: "#5FA07C" })),
    ];
    return (
      <div className="mh-screen pb-6">
        <MHeader title="Inbox" sub={`${threads.filter((t) => t.unread).length} unread`} />
        <div className="px-5 pt-4 flex flex-col gap-2">{threads.map((t, i) => <button key={i} onClick={() => toast("Thread opened — demo")} style={{ background: C.card, border: `1px solid ${C.line}` }} className="text-left rounded-2xl p-3 flex items-center gap-3"><Tile g1={t.g1} g2={t.g2} emoji={t.emoji} size={46} radius={13} fs={21} /><div className="flex-1 min-w-0"><div className="flex items-center justify-between"><p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[14px] truncate">{t.name}</p><span style={{ color: C.faint }} className="text-[11px]">{t.when}</span></div><p style={{ color: t.unread ? C.ink : C.sub, fontWeight: t.unread ? 600 : 400 }} className="text-[12px] truncate">{t.last}</p></div>{t.unread && <span style={{ background: C.honey }} className="w-2.5 h-2.5 rounded-full flex-shrink-0" />}</button>)}</div>
      </div>
    );
  }
}
