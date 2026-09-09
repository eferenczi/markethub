import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { api } from "./api";
import { C, FD } from "./theme";

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
const assetLabel = (asset) =>
  ({
    insurance: "Insurance",
    booth_photo: "Booth photo",
    product_photo: "Product photo",
  })[asset.kind] || "Uploaded file";
const phoneDigits = (phone) => String(phone || "").replace(/\D/g, "");
const socialUrl = (type, handle) => {
  if (!handle) return "";
  if (/^https?:\/\//i.test(handle)) return handle;
  const clean = handle.replace(/^@/, "");
  return type === "instagram"
    ? `https://instagram.com/${clean}`
    : type === "tiktok"
      ? `https://www.tiktok.com/@${clean}`
      : `https://www.facebook.com/${clean}`;
};

function ContactActions({ vendor }) {
  const phone = phoneDigits(vendor.phone);
  const links = [
    vendor.email && {
      href: `mailto:${vendor.email}`,
      label: "Email",
      Icon: Mail,
    },
    phone && { href: `tel:${phone}`, label: "Call", Icon: Phone },
    phone && { href: `sms:${phone}`, label: "Text", Icon: MessageSquare },
    phone && {
      href: `https://wa.me/${phone}`,
      label: "WhatsApp",
      Icon: MessageCircle,
      external: true,
    },
    vendor.instagram && {
      href: socialUrl("instagram", vendor.instagram),
      label: "Instagram",
      Icon: ExternalLink,
      external: true,
    },
    vendor.tiktok && {
      href: socialUrl("tiktok", vendor.tiktok),
      label: "TikTok",
      Icon: ExternalLink,
      external: true,
    },
    vendor.facebook && {
      href: socialUrl("facebook", vendor.facebook),
      label: "Facebook",
      Icon: ExternalLink,
      external: true,
    },
  ].filter(Boolean);
  if (!links.length) return null;
  return (
    <section style={{ background: C.paper2 }} className="rounded-xl p-3 mt-4">
      <p style={{ color: C.faint }} className="text-[10px] font-bold uppercase">
        Contact this vendor
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {links.map(({ href, label, Icon, external }) => (
          <a
            key={label}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            style={{
              background: C.card,
              color: C.pine,
              border: `1px solid ${C.line}`,
            }}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
          >
            <Icon size={13} /> {label}
          </a>
        ))}
      </div>
    </section>
  );
}

export default function VendorProfileCard({
  vendorId,
  canWrite,
  onClose,
  notify,
}) {
  const [data, setData] = useState(null);
  const [tagText, setTagText] = useState("");
  const [savingTags, setSavingTags] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => {
    api
      .getVendorProfile(vendorId)
      .then(setData)
      .catch((error) => notify(error.message, "err"));
  }, [vendorId]);
  useEffect(() => {
    if (data) {
      setTagText((data.vendor.tags || []).join(", "));
      setDraft({ ...data.vendor });
    }
  }, [data]);
  const openAsset = async (applicationId, asset) => {
    try {
      const blob = await api.getApplicationAsset(applicationId, asset.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      notify(error.message, "err");
    }
  };
  if (!data)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
        <div
          style={{ background: C.card }}
          className="rounded-2xl px-6 py-5 text-[13px]"
        >
          <Loader2 size={16} className="inline animate-spin mr-2" />
          Loading vendor profile…
        </div>
      </div>
    );
  const { vendor, approvals, applications, markets } = data;
  const saveTags = async () => {
    setSavingTags(true);
    try {
      const result = await api.updateVendor(vendor.id, {
        tags: [
          ...new Set(
            tagText
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          ),
        ],
      });
      setData((current) => ({ ...current, vendor: result.vendor }));
      notify("Vendor tags saved");
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setSavingTags(false);
    }
  };
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const result = await api.updateVendor(vendor.id, {
        business_name: draft.business_name || "",
        contact_name: draft.contact_name || "",
        phone: draft.phone || "",
        email: draft.email || "",
        city: draft.city || "",
        category: draft.category || "",
        booth_type: draft.booth_type || "tent",
        instagram: draft.instagram || "",
        tiktok: draft.tiktok || "",
        facebook: draft.facebook || "",
        notes: draft.notes || "",
      });
      setData((current) => ({ ...current, vendor: result.vendor }));
      setEditing(false);
      notify("Vendor profile and manager notes saved");
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setSavingProfile(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/35 p-3 sm:p-7 overflow-y-auto">
      <section
        style={{
          background: C.card,
          color: C.ink,
          maxWidth: 880,
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
              Vendor CRM profile
            </p>
            <h2
              style={{ fontFamily: FD }}
              className="text-[25px] font-semibold mt-1"
            >
              {vendor.business_name}
            </h2>
            <p style={{ color: C.sub }} className="text-[12.5px] mt-1">
              {[
                vendor.contact_name,
                vendor.category,
                vendor.booth_type === "truck" ? "Food truck" : "10×10 tent",
              ]
                .filter(Boolean)
                .join(" · ")}
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
        {canWrite && (
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setEditing((value) => !value)}
              style={{ color: C.pine, background: C.paper2 }}
              className="px-3 py-2 rounded-lg text-[11.5px] font-bold flex items-center gap-1"
            >
              <Pencil size={13} /> {editing ? "Close editor" : "Edit vendor"}
            </button>
          </div>
        )}
        {editing && canWrite && (
          <section
            style={{ background: C.paper2, border: `1px solid ${C.line}` }}
            className="rounded-xl p-3 mt-3"
          >
            <p
              style={{ color: C.faint }}
              className="text-[10px] font-bold uppercase"
            >
              Edit CRM contact
            </p>
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              {[
                ["business_name", "Business name", "text"],
                ["contact_name", "Contact name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["city", "City", "text"],
                ["category", "Vendor category", "text"],
                ["instagram", "Instagram handle", "text"],
                ["tiktok", "TikTok handle", "text"],
                ["facebook", "Facebook page", "text"],
              ].map(([key, placeholder, type]) => (
                <input
                  key={key}
                  value={draft[key] || ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={placeholder}
                  type={type}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.line}`,
                    color: C.ink,
                  }}
                  className="px-2.5 py-2 rounded-lg text-[12px] outline-none"
                />
              ))}
              <select
                value={draft.booth_type || "tent"}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    booth_type: event.target.value,
                  }))
                }
                style={{
                  background: C.card,
                  border: `1px solid ${C.line}`,
                  color: C.ink,
                }}
                className="px-2.5 py-2 rounded-lg text-[12px] outline-none"
              >
                <option value="tent">10×10 canopy tent</option>
                <option value="truck">Food truck</option>
              </select>
            </div>
            <label
              style={{ color: C.sub }}
              className="block mt-3 text-[10px] font-bold uppercase"
            >
              Manager-only notes
            </label>
            <textarea
              value={draft.notes || ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={4}
              placeholder="Private notes for managers and staff. Vendors cannot see these notes."
              style={{
                background: C.card,
                border: `1px solid ${C.line}`,
                color: C.ink,
              }}
              className="mt-1 w-full px-2.5 py-2 rounded-lg text-[12px] outline-none resize-y"
            />
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              style={{
                background: C.pine,
                color: "#fff",
                opacity: savingProfile ? 0.6 : 1,
              }}
              className="mt-2 px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1"
            >
              <Save size={12} /> {savingProfile ? "Saving…" : "Save contact"}
            </button>
          </section>
        )}
        <div
          style={{ background: C.paper2 }}
          className="grid sm:grid-cols-3 gap-3 rounded-xl p-3 mt-4 text-[12px]"
        >
          <div>
            <p
              style={{ color: C.faint }}
              className="text-[10px] font-bold uppercase"
            >
              Contact
            </p>
            <p className="font-semibold mt-1">{vendor.contact_name || "—"}</p>
            {vendor.email ? (
              <a
                href={`mailto:${vendor.email}`}
                style={{ color: C.pine }}
                className="block hover:underline"
              >
                {vendor.email}
              </a>
            ) : (
              <p style={{ color: C.sub }}>No email</p>
            )}
            {vendor.phone ? (
              <a
                href={`tel:${phoneDigits(vendor.phone)}`}
                style={{ color: C.pine }}
                className="block hover:underline"
              >
                {vendor.phone}
              </a>
            ) : (
              <p style={{ color: C.sub }}>No phone</p>
            )}
          </div>
          <div>
            <p
              style={{ color: C.faint }}
              className="text-[10px] font-bold uppercase"
            >
              Setup
            </p>
            <p className="font-semibold mt-1 capitalize">
              {vendor.booth_type || "tent"}
            </p>
            <p style={{ color: C.sub }}>{vendor.category || "No category"}</p>
            <p style={{ color: C.sub }}>Stage: {vendor.stage}</p>
          </div>
          <div>
            <p
              style={{ color: C.faint }}
              className="text-[10px] font-bold uppercase"
            >
              Social
            </p>
            {vendor.instagram ? (
              <a
                href={socialUrl("instagram", vendor.instagram)}
                target="_blank"
                rel="noreferrer"
                style={{ color: C.pine }}
                className="block mt-1 hover:underline"
              >
                {vendor.instagram}
              </a>
            ) : (
              <p className="mt-1">—</p>
            )}
            {vendor.tiktok && (
              <a
                href={socialUrl("tiktok", vendor.tiktok)}
                target="_blank"
                rel="noreferrer"
                style={{ color: C.pine }}
                className="block hover:underline"
              >
                {vendor.tiktok}
              </a>
            )}
            {vendor.facebook && (
              <a
                href={socialUrl("facebook", vendor.facebook)}
                target="_blank"
                rel="noreferrer"
                style={{ color: C.pine }}
                className="block hover:underline"
              >
                {vendor.facebook}
              </a>
            )}
          </div>
        </div>
        <section
          style={{ border: `1px solid ${C.line}` }}
          className="rounded-xl p-3 mt-4"
        >
          <p
            style={{ color: C.faint }}
            className="text-[10px] font-bold uppercase"
          >
            Vendor tags
          </p>
          {canWrite ? (
            <div className="flex gap-2 mt-2">
              <input
                value={tagText}
                onChange={(event) => setTagText(event.target.value)}
                placeholder="e.g. food truck, vegan, priority"
                style={{
                  background: C.paper2,
                  border: `1px solid ${C.line}`,
                  color: C.ink,
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-[12px] outline-none"
              />
              <button
                onClick={saveTags}
                disabled={savingTags}
                style={{
                  background: C.pine,
                  color: "#fff",
                  opacity: savingTags ? 0.6 : 1,
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
              >
                <Save size={12} /> Save
              </button>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(vendor.tags || []).map((tag) => (
              <span
                key={tag}
                style={{ background: C.sageSoft, color: C.pine }}
                className="px-2 py-1 rounded-full text-[10.5px] font-bold"
              >
                {tag}
              </span>
            ))}
            {(vendor.tags || []).length === 0 && !canWrite && (
              <span style={{ color: C.faint }} className="text-[11px]">
                No tags yet.
              </span>
            )}
          </div>
        </section>
        <ContactActions vendor={vendor} />
        {canWrite && vendor.notes && !editing && (
          <section
            style={{ background: C.honeySoft, border: `1px solid ${C.line}` }}
            className="rounded-xl p-3 mt-4"
          >
            <p
              style={{ color: C.faint }}
              className="text-[10px] font-bold uppercase"
            >
              Manager-only notes
            </p>
            <p
              style={{ color: C.sub, whiteSpace: "pre-wrap" }}
              className="mt-1 text-[12px]"
            >
              {vendor.notes}
            </p>
          </section>
        )}
        <div className="grid lg:grid-cols-2 gap-4 mt-5">
          <section
            style={{ border: `1px solid ${C.line}` }}
            className="rounded-xl overflow-hidden"
          >
            <div className="px-4 py-3">
              <p
                style={{ fontFamily: FD }}
                className="text-[18px] font-semibold"
              >
                Markets & payments
              </p>
              <p style={{ color: C.sub }} className="text-[11.5px]">
                Every event this vendor has been added to.
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {approvals.map((item) => (
                <div
                  key={item.id}
                  style={{ borderTop: `1px solid ${C.line}` }}
                  className="px-4 py-3 text-[12px] flex gap-2"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{item.market_name}</p>
                    <p style={{ color: C.sub }}>
                      {item.event_date} · {item.booth_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{money(item.amount_due_cents)}</p>
                    <p
                      style={{
                        color: item.status === "paid" ? C.pine : C.honeyDeep,
                      }}
                      className="capitalize"
                    >
                      {item.status.replaceAll("_", " ")}
                      {item.payment_method ? ` · ${item.payment_method}` : ""}
                    </p>
                  </div>
                </div>
              ))}
              {approvals.length === 0 && (
                <p style={{ color: C.faint }} className="px-4 py-6 text-[12px]">
                  No event payment history yet.
                </p>
              )}
            </div>
          </section>
          <section
            style={{ border: `1px solid ${C.line}` }}
            className="rounded-xl overflow-hidden"
          >
            <div className="px-4 py-3">
              <p
                style={{ fontFamily: FD }}
                className="text-[18px] font-semibold"
              >
                Applications & uploads
              </p>
              <p style={{ color: C.sub }} className="text-[11.5px]">
                Open the submitted application files, insurance documents, and
                photos.
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {applications.map((item) => (
                <div
                  key={item.id}
                  style={{ borderTop: `1px solid ${C.line}` }}
                  className="px-4 py-3 text-[12px]"
                >
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="font-semibold">{item.market_name}</p>
                      <p style={{ color: C.sub }}>
                        {item.category || vendor.category || "No category"} ·{" "}
                        {item.booth_type}
                      </p>
                    </div>
                    <span
                      style={{
                        background:
                          item.status === "approved" ? C.sageSoft : C.paper2,
                        color: item.status === "approved" ? C.pine : C.sub,
                      }}
                      className="self-start px-2 py-1 rounded-full capitalize text-[10px] font-bold"
                    >
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => openAsset(item.id, asset)}
                        style={{ background: C.paper2, color: C.pine }}
                        className="px-2 py-1 rounded-md text-[10.5px] font-bold flex gap-1 items-center"
                      >
                        {asset.kind === "insurance" ? (
                          <FileText size={12} />
                        ) : (
                          <ImageIcon size={12} />
                        )}
                        {assetLabel(asset)}: {asset.file_name}
                        <ExternalLink size={11} />
                      </button>
                    ))}
                    {item.assets.length === 0 && (
                      <span style={{ color: C.faint }} className="text-[11px]">
                        No files uploaded with this application.
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <p style={{ color: C.faint }} className="px-4 py-6 text-[12px]">
                  No formal applications yet.
                </p>
              )}
            </div>
          </section>
        </div>
        <section
          style={{ borderTop: `1px solid ${C.line}` }}
          className="mt-5 pt-4"
        >
          <p style={{ fontFamily: FD }} className="text-[17px] font-semibold">
            Markets linked in CRM
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {markets.map((market) => (
              <span
                key={market.id}
                style={{ background: C.paper2, color: C.sub }}
                className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold"
              >
                {market.market_name} · {market.stage_override || "Active"}
              </span>
            ))}
            {markets.length === 0 && (
              <p style={{ color: C.faint }} className="text-[12px]">
                No markets linked yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
