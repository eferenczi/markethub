import React, { useEffect, useState } from "react";
import {
  CreditCard, Mail, MessageSquare, Check, X, Loader2, Trash2, Plus,
  ShieldCheck, AlertTriangle, Users, ArrowLeft,
} from "lucide-react";
import { api } from "./api";
import { C, FD, FB } from "./theme";

const PROVIDERS = [
  {
    id: "stripe", name: "Stripe", Icon: CreditCard, tone: C.pine,
    blurb: "Collect booth fees by card, Apple Pay, and Google Pay.",
    fields: [
      { key: "publishable_key", label: "Publishable key", placeholder: "pk_live_…" },
      { key: "secret_key", label: "Secret key", placeholder: "sk_live_…", secret: true, required: true },
      { key: "webhook_secret", label: "Webhook signing secret", placeholder: "whsec_…", secret: true },
    ],
  },
  {
    id: "sendgrid", name: "SendGrid", Icon: Mail, tone: C.berry,
    blurb: "Send vendor invitations and campaign emails.",
    fields: [
      { key: "api_key", label: "API key", placeholder: "SG.…", secret: true, required: true },
      { key: "from_email", label: "From email", placeholder: "markets@yourdomain.com" },
    ],
  },
  {
    id: "twilio", name: "Twilio", Icon: MessageSquare, tone: C.honeyDeep,
    blurb: "Send SMS reminders and day-of alerts.",
    fields: [
      { key: "account_sid", label: "Account SID", placeholder: "AC…", required: true },
      { key: "auth_token", label: "Auth token", placeholder: "your auth token", secret: true, required: true },
      { key: "from_number", label: "From number", placeholder: "+13055550100" },
    ],
  },
];

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };

function Pill({ bg, fg, children }) {
  return <span style={{ background: bg, color: fg }} className="text-[11px] font-bold px-2 py-0.5 rounded-full">{children}</span>;
}

/* ---- one integration card ---- */
function IntegrationCard({ meta, state, onSaved, onDeleted, notify }) {
  const configured = state?.configured;
  const [form, setForm] = useState(() => {
    const init = {};
    for (const fdef of meta.fields) init[fdef.key] = fdef.secret ? "" : (state?.fields?.[fdef.key] || "");
    return init;
  });
  const [busy, setBusy] = useState("");
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy("save");
    try {
      const body = {};
      for (const fdef of meta.fields) if (form[fdef.key]) body[fdef.key] = form[fdef.key];
      const { integration } = await api.saveIntegration(meta.id, body);
      onSaved(integration);
      // clear secrets from the form after saving
      setForm((p) => { const n = { ...p }; meta.fields.forEach((f) => f.secret && (n[f.key] = "")); return n; });
      notify(`${meta.name} saved`, "ok");
    } catch (e) {
      notify(e.message || "Save failed", "err");
    } finally {
      setBusy("");
    }
  };

  const test = async () => {
    setBusy("test");
    try {
      const r = await api.testIntegration(meta.id);
      notify(r.detail || `${meta.name} connected`, "ok");
    } catch (e) {
      notify(e.message || "Connection test failed", "err");
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    setBusy("del");
    try {
      await api.deleteIntegration(meta.id);
      onDeleted();
      notify(`${meta.name} removed`, "ok");
    } catch (e) {
      notify(e.message || "Remove failed", "err");
    } finally {
      setBusy("");
    }
  };

  const { Icon } = meta;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-1">
        <div style={{ background: meta.tone }} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"><Icon size={18} color="#fff" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[16px]">{meta.name}</p>
            {configured ? <Pill bg={C.sageSoft} fg={C.pine}>Connected</Pill> : <Pill bg={C.paper2} fg={C.sub}>Not connected</Pill>}
          </div>
          <p style={{ color: C.sub }} className="text-[12px]">{meta.blurb}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mt-3">
        {meta.fields.map((fdef) => (
          <label key={fdef.key} className="block">
            <span style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">
              {fdef.label}{fdef.required ? " *" : ""}
              {fdef.secret && configured && state?.fields?.[fdef.key] ? `  · saved ${state.fields[fdef.key]}` : ""}
            </span>
            <input
              type={fdef.secret ? "password" : "text"}
              value={form[fdef.key]}
              onChange={(e) => set(fdef.key, e.target.value)}
              placeholder={fdef.secret && configured ? "•••••• (enter to replace)" : fdef.placeholder}
              style={inp}
              className="w-full mt-1 px-3.5 py-2.5 rounded-lg text-[13.5px] outline-none"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button onClick={save} disabled={busy} style={{ background: C.pine, color: "#fff", opacity: busy ? 0.6 : 1 }} className="px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5">
          {busy === "save" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
        </button>
        {configured && (
          <button onClick={test} disabled={busy} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} className="px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5">
            {busy === "test" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Test connection
          </button>
        )}
        <div className="flex-1" />
        {configured && (
          <button onClick={remove} disabled={busy} style={{ background: C.card, border: `1px solid ${C.line}`, color: C.danger }} className="px-3 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5">
            {busy === "del" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Remove
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- team members ---- */
function TeamSection({ user, notify }) {
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [inv, setInv] = useState({ name: "", email: "", role: "staff" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setInv((p) => ({ ...p, [k]: v }));

  const load = async () => {
    try {
      const { org, members } = await api.getOrg();
      setOrg(org);
      setMembers(members);
    } catch (e) {
      notify(e.message, "err");
    }
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!inv.name || !inv.email) return notify("Name and email required", "err");
    setBusy(true);
    try {
      await api.addMember(inv);
      setInv({ name: "", email: "", role: "staff" });
      notify(`Invite sent to ${inv.email}`, "ok");
      load();
    } catch (e) {
      notify(e.message, "err");
    } finally {
      setBusy(false);
    }
  };
  const changeRole = async (m, role) => {
    try { await api.setMemberRole(m.id, role); load(); } catch (e) { notify(e.message, "err"); }
  };
  const remove = async (m) => {
    try { await api.removeMember(m.id); load(); notify(`${m.email} removed`, "ok"); } catch (e) { notify(e.message, "err"); }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Users size={17} color={C.pine} />
        <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[16px]">Team</p>
      </div>
      <div className="flex flex-col gap-1.5 mb-4">
        {members.map((m) => (
          <div key={m.id} style={{ background: C.panel }} className="flex items-center gap-2 px-3 py-2 rounded-lg">
            <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold truncate">{m.name} {!m.active && <span style={{ color: C.faint }} className="font-normal">· invite pending</span>}</p><p style={{ color: C.sub }} className="text-[11.5px] truncate">{m.email}</p></div>
            {m.role === "owner" || m.id === user.id ? (
              <Pill bg={C.paper2} fg={C.sub}>{m.role}</Pill>
            ) : (
              <>
                <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} style={inp} className="px-2 py-1.5 rounded-lg text-[12px] font-semibold outline-none">
                  <option value="manager">manager</option>
                  <option value="staff">staff</option>
                  <option value="vendor">vendor</option>
                </select>
                <button onClick={() => remove(m)} style={{ color: C.danger }} className="p-1.5"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        ))}
      </div>
      <p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide mb-2">Invite a member</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={inv.name} onChange={(e) => set("name", e.target.value)} placeholder="Name" style={inp} className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none" />
        <input value={inv.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" style={inp} className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none" />
        <select value={inv.role} onChange={(e) => set("role", e.target.value)} style={inp} className="px-2 py-2 rounded-lg text-[13px] font-semibold outline-none">
          <option value="manager">manager</option>
          <option value="staff">staff</option>
          <option value="vendor">vendor</option>
        </select>
        <button onClick={invite} disabled={busy} style={{ background: C.pine, color: "#fff", opacity: busy ? 0.6 : 1 }} className="px-4 py-2 rounded-lg text-[13px] font-bold flex items-center justify-center gap-1.5">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Invite
        </button>
      </div>
    </div>
  );
}

/* ---- page ---- */
export default function SettingsPage({ user, onClose }) {
  const [integrations, setIntegrations] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [toast, setToast] = useState(null);

  const notify = (msg, kind) => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3200);
  };

  const load = async () => {
    try {
      const { integrations } = await api.getIntegrations();
      setIntegrations(integrations);
    } catch (e) {
      setLoadErr(e.message || "Couldn't load settings");
    }
  };
  useEffect(() => { load(); }, []);

  const byId = Object.fromEntries((integrations || []).map((i) => [i.provider, i]));

  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: FB, color: C.ink }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }} className="px-4 py-6">
        <button onClick={onClose} style={{ color: C.sub }} className="text-[13px] font-semibold flex items-center gap-1.5 mb-4"><ArrowLeft size={15} /> Back to console</button>
        <h1 style={{ fontFamily: FD, fontWeight: 600 }} className="text-[26px] mb-1">Settings</h1>
        <p style={{ color: C.sub }} className="text-[13.5px] mb-6">Connect your own payment and messaging accounts. Keys are encrypted and never shown again after saving.</p>

        {loadErr && (
          <div style={{ background: C.dangerSoft, color: C.danger }} className="rounded-lg px-4 py-3 text-[13px] mb-4 flex items-center gap-2"><AlertTriangle size={16} /> {loadErr}</div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <p style={{ fontFamily: FD, fontWeight: 600 }} className="text-[17px]">Integrations</p>
        </div>

        {!integrations && !loadErr ? (
          <div style={{ color: C.sub }} className="flex items-center gap-2 text-[13px] py-8"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : (
          <div className="flex flex-col gap-4">
            {PROVIDERS.map((meta) => (
              <IntegrationCard
                key={meta.id}
                meta={meta}
                state={byId[meta.id]}
                notify={notify}
                onSaved={(integration) => setIntegrations((list) => list.map((i) => (i.provider === meta.id ? integration : i)))}
                onDeleted={() => setIntegrations((list) => list.map((i) => (i.provider === meta.id ? { provider: meta.id, configured: false, fields: {}, updated_at: null } : i)))}
              />
            ))}
          </div>
        )}

        <div className="mt-6">
          <TeamSection user={user} notify={notify} />
        </div>

        <p style={{ color: C.faint }} className="text-[11.5px] mt-6 leading-relaxed">
          For real payment volume, Stripe recommends Stripe Connect (organizers authorize your platform instead of pasting a secret key). This settings model stores each org's own keys, encrypted.
        </p>
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
