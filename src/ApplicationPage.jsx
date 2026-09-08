import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, ImagePlus, Loader2, Store, Upload } from "lucide-react";
import { api } from "./api";
import { C, FD, FB } from "./theme";

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
const blank = {
  market_id: "", business_name: "", contact_name: "", phone: "", email: "", city: "", category: "", booth_type: "tent",
  booth_size: "", power_needed: false, instagram: "", tiktok: "", facebook: "", website: "", description: "",
};
const MAX_INSURANCE = 5 * 1024 * 1024;
const MAX_PHOTO = 2 * 1024 * 1024;

function FilePicker({ label, help, accept, multiple, onAdd, icon: Icon }) {
  const choose = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    try { await onAdd(files); } catch (error) { window.alert(error.message); }
  };
  return <label style={{ border: `1.5px dashed ${C.line}`, background: C.paper2 }} className="rounded-xl p-4 cursor-pointer flex items-center gap-3 hover:brightness-95">
    <Icon size={20} color={C.pine} />
    <span className="flex-1"><span className="block text-[13px] font-bold">{label}</span><span style={{ color: C.sub }} className="block text-[11.5px] mt-0.5">{help}</span></span>
    <Upload size={17} color={C.sub} />
    <input type="file" className="hidden" accept={accept} multiple={multiple} onChange={choose} />
  </label>;
}

async function toAsset(file, kind) {
  const max = kind === "insurance" ? MAX_INSURANCE : MAX_PHOTO;
  if (file.size > max) throw new Error(`${file.name} is too large. ${kind === "insurance" ? "Insurance files must be 5 MB or smaller." : "Photos must be 2 MB or smaller."}`);
  const allowed = kind === "insurance" ? ["application/pdf", "image/jpeg", "image/png", "image/webp"] : ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) throw new Error(`${file.name} is not an accepted file type.`);
  const data = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
  return { kind, file_name: file.name, mime_type: file.type, data };
}

export default function ApplicationPage({ applicationKey }) {
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState(blank);
  const [insurance, setInsurance] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  useEffect(() => {
    api.getPublicApplication(applicationKey).then((result) => {
      setInfo(result);
      if (result.markets.length === 1) set("market_id", String(result.markets[0].id));
    }).catch((err) => setError(err.message));
  }, [applicationKey]);

  const assets = useMemo(() => [...(insurance ? [insurance] : []), ...photos], [insurance, photos]);
  const selectedTemplates = useMemo(() => (info?.market_templates || []).filter((item) => String(item.market_id) === String(form.market_id)), [info, form.market_id]);
  const categoryOptions = selectedTemplates.find((item) => item.type === "categories_spaces")?.config?.items || [];
  const requestedDocuments = selectedTemplates.find((item) => item.type === "required_documents")?.config?.items || [];
  const addInsurance = async (files) => {
    if (files.length !== 1) throw new Error("Please choose one insurance document.");
    setInsurance(await toAsset(files[0], "insurance"));
  };
  const addPhotos = async (files) => {
    const additions = await Promise.all(files.slice(0, 4).map((file) => toAsset(file, "product_photo")));
    setPhotos((previous) => [...previous, ...additions].slice(0, 4));
  };
  const submit = async () => {
    setError("");
    if (!form.market_id || !form.business_name || !form.contact_name || !form.phone || !form.email) return setError("Please complete the required contact and market fields.");
    setBusy(true);
    try {
      await api.submitPublicApplication(applicationKey, { ...form, market_id: Number(form.market_id), assets });
      setDone(true);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  if (done) return <div style={{ background: C.paper, minHeight: "100vh", fontFamily: FB, color: C.ink }} className="flex items-center justify-center p-5"><div style={{ background: C.card, border: `1px solid ${C.line}`, maxWidth: 520 }} className="rounded-2xl p-8 text-center"><CheckCircle2 size={46} color={C.pine} className="mx-auto mb-3" /><h1 style={{ fontFamily: FD }} className="text-[26px] font-semibold">Application received</h1><p style={{ color: C.sub }} className="mt-2 text-[14px]">Thank you. The market team will review your information and contact you using the details you provided.</p></div></div>;
  if (!info && !error) return <div style={{ background: C.paper, minHeight: "100vh", color: C.sub }} className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Loading application…</div>;
  if (!info) return <div style={{ background: C.paper, minHeight: "100vh", fontFamily: FB }} className="flex items-center justify-center p-5"><p style={{ color: C.danger }} className="text-[14px]">{error}</p></div>;

  return <div style={{ background: C.paper, minHeight: "100vh", fontFamily: FB, color: C.ink }} className="py-8 px-4"><main style={{ maxWidth: 720, margin: "0 auto" }}><div className="text-center mb-7"><div style={{ background: C.pine }} className="w-11 h-11 rounded-xl inline-flex items-center justify-center mb-3"><Store size={22} color={C.honey} /></div><h1 style={{ fontFamily: FD }} className="text-[29px] font-semibold">Vendor application</h1><p style={{ color: C.sub }} className="text-[14px] mt-1">Apply to {info.organization.name}</p></div>
    <div style={{ background: C.card, border: `1px solid ${C.line}` }} className="rounded-2xl p-5 sm:p-7 flex flex-col gap-5">
      {error && <p style={{ background: C.dangerSoft, color: C.danger }} className="rounded-lg px-3 py-2.5 text-[13px]">{error}</p>}
      <section><h2 style={{ fontFamily: FD }} className="text-[19px] font-semibold mb-3">Business and contact</h2><div className="grid sm:grid-cols-2 gap-3"><input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Business name *" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" /><input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Your full name *" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" /><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone *" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" /><input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email *" type="email" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" /><input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" />{categoryOptions.length ? <select value={form.category} onChange={(e) => set("category", e.target.value)} style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none"><option value="">Choose category / cuisine</option>{categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select> : <input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Product category / cuisine" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" />}</div></section>
      <section><h2 style={{ fontFamily: FD }} className="text-[19px] font-semibold mb-3">Requested market and setup</h2><div className="grid sm:grid-cols-2 gap-3"><select value={form.market_id} onChange={(e) => set("market_id", e.target.value)} style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none"><option value="">Choose a market *</option>{info.markets.map((market) => <option key={market.id} value={market.id}>{market.name}{market.location ? ` — ${market.location}` : ""}</option>)}</select><select value={form.booth_type} onChange={(e) => set("booth_type", e.target.value)} style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none"><option value="tent">Tent / booth</option><option value="truck">Food truck</option></select><input value={form.booth_size} onChange={(e) => set("booth_size", e.target.value)} placeholder="Booth or truck size (e.g. 10×10)" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" /><label style={inp} className="px-3 py-2.5 rounded-lg text-[14px] flex items-center gap-2"><input checked={form.power_needed} onChange={(e) => set("power_needed", e.target.checked)} type="checkbox" /> I need electrical power</label></div></section>
      <section><h2 style={{ fontFamily: FD }} className="text-[19px] font-semibold mb-3">Social media</h2><p style={{ color: C.sub }} className="text-[12px] mb-2">Optional, but helpful when reviewing your application.</p><div className="grid sm:grid-cols-3 gap-3"><input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="Instagram" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" /><input value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="TikTok" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" /><input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="Facebook" style={inp} className="px-3 py-2.5 rounded-lg text-[14px] outline-none" /></div><input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="Website (optional)" style={inp} className="mt-3 w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" /></section>
      <section><h2 style={{ fontFamily: FD }} className="text-[19px] font-semibold mb-3">Insurance and photos</h2><p style={{ color: C.sub }} className="text-[12px] mb-3">Optional now—you can request them later if needed.</p>{requestedDocuments.length > 0 && <p style={{ background: C.honeySoft, color: C.honeyDeep }} className="rounded-lg px-3 py-2 text-[12px] mb-3">This market requests: {requestedDocuments.join(" · ")}</p>}<div className="flex flex-col gap-3"><FilePicker label="Insurance certificate" help="PDF, JPG, PNG, or WebP · up to 5 MB" accept="application/pdf,image/jpeg,image/png,image/webp" onAdd={addInsurance} icon={FileText} />{insurance && <p style={{ color: C.pine }} className="text-[12.5px] font-semibold">✓ {insurance.file_name}</p>}<FilePicker label="Booth or product photos" help="JPG, PNG, or WebP · up to 2 MB each · up to 4 photos" accept="image/jpeg,image/png,image/webp" multiple onAdd={addPhotos} icon={ImagePlus} />{photos.length > 0 && <p style={{ color: C.pine }} className="text-[12.5px] font-semibold">✓ {photos.map((photo) => photo.file_name).join(", ")}</p>}</div></section>
      <section><h2 style={{ fontFamily: FD }} className="text-[19px] font-semibold mb-3">Tell us about your business</h2><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="What do you sell? Include anything helpful for the review team." style={inp} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-y" /></section>
      <button onClick={submit} disabled={busy} style={{ background: C.pine, color: "#fff", opacity: busy ? 0.65 : 1 }} className="w-full py-3 rounded-lg text-[15px] font-bold flex items-center justify-center gap-2">{busy ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />} Submit application</button>
    </div></main></div>;
}
