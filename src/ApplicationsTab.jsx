import React, { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, ExternalLink, FileText, Image, Loader2, RefreshCw, X } from "lucide-react";
import { api } from "./api";
import { C, FD } from "./theme";

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
const STATUSES = ["under_review", "approved", "unapproved", "withdrawn"];
const statusLabel = (status) => ({ under_review: "Under review", approved: "Approved", unapproved: "Unapproved", withdrawn: "Withdrawn" }[status] || status);
const statusStyle = (status) => ({
  under_review: { background: C.honeySoft, color: C.honeyDeep },
  approved: { background: C.sageSoft, color: C.pine },
  unapproved: { background: C.dangerSoft, color: C.danger },
  withdrawn: { background: C.paper2, color: C.sub },
}[status] || { background: C.paper2, color: C.sub });

function StatusPill({ status }) {
  return <span style={statusStyle(status)} className="text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap">{statusLabel(status)}</span>;
}

export default function ApplicationsTab({ user, canWrite, notify }) {
  const [applications, setApplications] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState("");

  const load = async () => {
    try {
      const [apps, org] = await Promise.all([api.getApplications(), api.getOrg()]);
      setApplications(apps.applications);
      setOrganization(org.org);
      setNotes(Object.fromEntries(apps.applications.map((application) => [application.id, application.review_notes || ""])));
    } catch (error) { notify(error.message, "err"); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => (applications || []).filter((application) => filter === "all" || application.status === filter), [applications, filter]);
  const applicationUrl = organization?.public_apply_key ? `${window.location.origin}/#/apply/${organization.public_apply_key}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(applicationUrl);
      notify("Vendor application link copied");
    } catch { notify("Copy the link from the box below", "err"); }
  };
  const rotateLink = async () => {
    if (!window.confirm("Replace the current vendor application link? The old link will stop working.")) return;
    setBusy("rotate");
    try {
      const result = await api.rotateApplicationLink();
      setOrganization((previous) => ({ ...previous, public_apply_key: result.key }));
      notify("New application link created");
    } catch (error) { notify(error.message, "err"); } finally { setBusy(""); }
  };
  const update = async (application, status = application.status) => {
    setBusy(String(application.id));
    try {
      await api.updateApplication(application.id, { status, review_notes: notes[application.id] || null });
      notify(`Application marked ${statusLabel(status).toLowerCase()}`);
      await load();
    } catch (error) { notify(error.message, "err"); } finally { setBusy(""); }
  };
  const openAsset = async (application, asset) => {
    try {
      const blob = await api.getApplicationAsset(application.id, asset.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) { notify(error.message, "err"); }
  };

  if (!applications || !organization) return <div style={{ color: C.sub }} className="flex items-center gap-2 text-[13px] py-8"><Loader2 size={16} className="animate-spin" /> Loading applications…</div>;
  return (
    <div className="flex flex-col gap-4">
      <section style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
        <div className="flex items-start gap-3"><div className="flex-1"><p style={{ color: C.faint }} className="text-[10.5px] font-bold uppercase tracking-wide">Vendor application link</p><p style={{ color: C.sub }} className="text-[12px] mt-1">Share this with vendors. Contact details are required; social handles, insurance, and product or booth photos are optional and saved to your private CRM when provided.</p></div><button onClick={load} title="Refresh applications" style={{ color: C.sub }} className="p-1"><RefreshCw size={16} /></button></div>
        <div className="flex gap-2 mt-3"><input readOnly value={applicationUrl} style={inp} className="flex-1 min-w-0 px-3 py-2 rounded-lg text-[12px] outline-none" /><button onClick={copyLink} style={{ background: C.pine, color: "#fff" }} className="px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5"><Clipboard size={14} /> Copy</button></div>
        {user.role === "owner" && <button onClick={rotateLink} disabled={busy === "rotate"} style={{ color: C.sub }} className="mt-2 text-[11.5px] font-semibold">{busy === "rotate" ? "Creating a new link…" : "Replace application link"}</button>}
      </section>

      <div className="flex gap-2 flex-wrap">
        {["all", ...STATUSES].map((status) => <button key={status} onClick={() => setFilter(status)} style={{ background: filter === status ? C.pine : C.card, color: filter === status ? "#fff" : C.sub, border: `1px solid ${filter === status ? C.pine : C.line}` }} className="px-3 py-1.5 rounded-full text-[12px] font-semibold">{status === "all" ? `All (${applications.length})` : statusLabel(status)}</button>)}
      </div>

      {filtered.length === 0 && <p style={{ color: C.faint }} className="text-[13px] py-8 text-center">No applications in this view yet.</p>}
      {filtered.map((application) => {
        const insurance = application.assets.find((asset) => asset.kind === "insurance");
        const photos = application.assets.filter((asset) => asset.kind !== "insurance");
        return <article key={application.id} style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-4">
          <div className="flex gap-3"><div style={{ background: C.berry }} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"><Image size={17} color="#fff" /></div><div className="flex-1 min-w-0"><div className="flex gap-2 items-center flex-wrap"><p style={{ fontFamily: FD }} className="text-[18px] font-semibold truncate">{application.business_name}</p><StatusPill status={application.status} /></div><p style={{ color: C.sub }} className="text-[12px] mt-0.5">{application.market_name} · submitted {new Date(application.submitted_at).toLocaleDateString()}</p><p style={{ color: C.sub }} className="text-[12px] mt-1">{application.contact_name} · {application.phone} · {application.email}</p></div></div>
          <div className="grid sm:grid-cols-2 gap-2 mt-3 text-[12px]"><div style={{ background: C.paper2 }} className="rounded-lg p-2.5"><b>Setup:</b> {application.booth_type}{application.booth_size ? ` · ${application.booth_size}` : ""}{application.power_needed ? " · power needed" : ""}<br /><b>Category:</b> {application.category || "Not provided"}</div><div style={{ background: C.paper2 }} className="rounded-lg p-2.5"><b>Social:</b> {[application.instagram, application.tiktok, application.facebook].filter(Boolean).join(" · ") || "Not provided"}<br />{application.website && <><b>Website:</b> {application.website}</>}</div></div>
          {application.description && <p style={{ color: C.sub }} className="text-[12.5px] mt-3 leading-relaxed">{application.description}</p>}
          <div className="flex flex-wrap gap-2 mt-3">{insurance && <button onClick={() => openAsset(application, insurance)} style={{ background: C.honeySoft, color: C.honeyDeep }} className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold flex items-center gap-1"><FileText size={14} /> Insurance <ExternalLink size={12} /></button>}{photos.map((asset) => <button key={asset.id} onClick={() => openAsset(application, asset)} style={{ background: C.paper2, color: C.sub }} className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold flex items-center gap-1"><Image size={14} /> {asset.file_name} <ExternalLink size={12} /></button>)}</div>
          {canWrite && <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}><textarea value={notes[application.id] || ""} onChange={(event) => setNotes((previous) => ({ ...previous, [application.id]: event.target.value }))} placeholder="Private review notes" rows={2} style={inp} className="w-full px-3 py-2 rounded-lg text-[12.5px] outline-none resize-y" /><div className="flex gap-2 flex-wrap mt-2">{STATUSES.map((status) => <button key={status} onClick={() => update(application, status)} disabled={busy === String(application.id)} style={status === "approved" ? { background: C.pine, color: "#fff" } : status === "unapproved" ? { background: C.dangerSoft, color: C.danger } : { background: C.paper2, color: C.sub }} className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold">{busy === String(application.id) ? "Saving…" : statusLabel(status)}</button>)}</div></div>}
        </article>;
      })}
    </div>
  );
}
