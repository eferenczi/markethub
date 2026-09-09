import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  ImagePlus,
  Loader2,
  Store,
  Upload,
} from "lucide-react";
import { api } from "./api";
import { C, FD, FB } from "./theme";

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
const blank = {
  market_id: "",
  market_date_id: "",
  business_name: "",
  contact_name: "",
  phone: "",
  email: "",
  city: "",
  category: "",
  booth_type: "tent",
  truck_size: "",
  instagram: "",
  tiktok: "",
  facebook: "",
  website: "",
  description: "",
  application_answers: {},
};
const MAX_INSURANCE = 5 * 1024 * 1024;
const MAX_PHOTO = 2 * 1024 * 1024;

function FilePicker({ label, help, accept, multiple, onAdd, icon: Icon }) {
  const choose = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      await onAdd(files);
    } catch (error) {
      window.alert(error.message);
    }
  };
  return (
    <label
      style={{ border: `1.5px dashed ${C.line}`, background: C.paper2 }}
      className="rounded-xl p-4 cursor-pointer flex items-center gap-3 hover:brightness-95"
    >
      <Icon size={20} color={C.pine} />
      <span className="flex-1">
        <span className="block text-[13px] font-bold">{label}</span>
        <span style={{ color: C.sub }} className="block text-[11.5px] mt-0.5">
          {help}
        </span>
      </span>
      <Upload size={17} color={C.sub} />
      <input
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={choose}
      />
    </label>
  );
}

async function toAsset(file, kind) {
  const max = kind === "insurance" ? MAX_INSURANCE : MAX_PHOTO;
  if (file.size > max)
    throw new Error(
      `${file.name} is too large. ${kind === "insurance" ? "Insurance files must be 5 MB or smaller." : "Photos must be 2 MB or smaller."}`,
    );
  const allowed =
    kind === "insurance"
      ? ["application/pdf", "image/jpeg", "image/png", "image/webp"]
      : ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type))
    throw new Error(`${file.name} is not an accepted file type.`);
  const data = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
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
  const [showMarketDetails, setShowMarketDetails] = useState(false);
  const set = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  useEffect(() => {
    api
      .getPublicApplication(applicationKey)
      .then((result) => {
        setInfo(result);
        if (result.markets.length === 1)
          set("market_id", String(result.markets[0].id));
      })
      .catch((err) => setError(err.message));
  }, [applicationKey]);

  const assets = useMemo(
    () => [...(insurance ? [insurance] : []), ...photos],
    [insurance, photos],
  );
  const selectedTemplates = useMemo(
    () =>
      (info?.market_templates || []).filter(
        (item) => String(item.market_id) === String(form.market_id),
      ),
    [info, form.market_id],
  );
  const selectedMarket = useMemo(
    () =>
      info?.markets?.find(
        (market) => String(market.id) === String(form.market_id),
      ) || null,
    [info, form.market_id],
  );
  const vendorDetails = selectedMarket?.vendor_details || {};
  const categoryOptions =
    selectedTemplates.find((item) => item.type === "categories_spaces")?.config
      ?.items || [];
  const requestedDocuments =
    selectedTemplates.find((item) => item.type === "required_documents")?.config
      ?.items || [];
  const applicationQuestions =
    selectedTemplates.find((item) => item.type === "vendor_application")?.config
      ?.questions || [];
  const availableDates = (info?.market_dates || []).filter(
    (date) => String(date.market_id) === String(form.market_id),
  );
  const addInsurance = async (files) => {
    if (files.length !== 1)
      throw new Error("Please choose one insurance document.");
    setInsurance(await toAsset(files[0], "insurance"));
  };
  const addPhotos = async (files) => {
    const additions = await Promise.all(
      files.slice(0, 4).map((file) => toAsset(file, "product_photo")),
    );
    setPhotos((previous) => [...previous, ...additions].slice(0, 4));
  };
  const submit = async () => {
    setError("");
    if (
      !form.market_id ||
      !form.business_name ||
      !form.contact_name ||
      !form.phone ||
      !form.email
    )
      return setError(
        "Please complete the required contact and market fields.",
      );
    setBusy(true);
    try {
      await api.submitPublicApplication(applicationKey, {
        ...form,
        market_id: Number(form.market_id),
        market_date_id: form.market_date_id
          ? Number(form.market_date_id)
          : undefined,
        assets,
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <div
        style={{
          background: C.paper,
          minHeight: "100vh",
          fontFamily: FB,
          color: C.ink,
        }}
        className="flex items-center justify-center p-5"
      >
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            maxWidth: 520,
          }}
          className="rounded-2xl p-8 text-center"
        >
          <CheckCircle2 size={46} color={C.pine} className="mx-auto mb-3" />
          <h1 style={{ fontFamily: FD }} className="text-[26px] font-semibold">
            Application received
          </h1>
          <p style={{ color: C.sub }} className="mt-2 text-[14px]">
            Thank you. The market team will review your information and contact
            you using the details you provided.
          </p>
        </div>
      </div>
    );
  if (!info && !error)
    return (
      <div
        style={{ background: C.paper, minHeight: "100vh", color: C.sub }}
        className="flex items-center justify-center gap-2"
      >
        <Loader2 size={18} className="animate-spin" /> Loading application…
      </div>
    );
  if (!info)
    return (
      <div
        style={{ background: C.paper, minHeight: "100vh", fontFamily: FB }}
        className="flex items-center justify-center p-5"
      >
        <p style={{ color: C.danger }} className="text-[14px]">
          {error}
        </p>
      </div>
    );

  return (
    <div
      style={{
        background: C.paper,
        minHeight: "100vh",
        fontFamily: FB,
        color: C.ink,
      }}
      className="py-8 px-4"
    >
      <main style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="text-center mb-7">
          <div
            style={{ background: C.pine }}
            className="w-11 h-11 rounded-xl inline-flex items-center justify-center mb-3"
          >
            <Store size={22} color={C.honey} />
          </div>
          <h1 style={{ fontFamily: FD }} className="text-[29px] font-semibold">
            Vendor application
          </h1>
          <p style={{ color: C.sub }} className="text-[14px] mt-1">
            Apply to {info.organization.name}
          </p>
        </div>
        <div
          style={{ background: C.card, border: `1px solid ${C.line}` }}
          className="rounded-2xl p-5 sm:p-7 flex flex-col gap-5"
        >
          {error && (
            <p
              style={{ background: C.dangerSoft, color: C.danger }}
              className="rounded-lg px-3 py-2.5 text-[13px]"
            >
              {error}
            </p>
          )}
          <section>
            <h2
              style={{ fontFamily: FD }}
              className="text-[19px] font-semibold mb-3"
            >
              Business and contact
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={form.business_name}
                onChange={(e) => set("business_name", e.target.value)}
                placeholder="Business name *"
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              />
              <input
                value={form.contact_name}
                onChange={(e) => set("contact_name", e.target.value)}
                placeholder="Your full name *"
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              />
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="Phone *"
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              />
              <input
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Email *"
                type="email"
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              />
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="City"
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              />
              {categoryOptions.length ? (
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  style={inp}
                  className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
                >
                  <option value="">Choose category / cuisine</option>
                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Product category / cuisine"
                  style={inp}
                  className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
                />
              )}
            </div>
          </section>
          <section>
            <h2
              style={{ fontFamily: FD }}
              className="text-[19px] font-semibold mb-3"
            >
              Requested market and setup
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <select
                value={form.market_id}
                onChange={(e) => {
                  set("market_id", e.target.value);
                  set("market_date_id", "");
                  setShowMarketDetails(false);
                }}
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              >
                <option value="">Choose a market *</option>
                {info.markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                    {market.location ? ` — ${market.location}` : ""}
                  </option>
                ))}
              </select>
              <select
                value={form.market_date_id}
                onChange={(e) => set("market_date_id", e.target.value)}
                disabled={!form.market_id || !availableDates.length}
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              >
                <option value="">
                  {availableDates.length
                    ? "Choose event date (optional)"
                    : "No future dates posted yet"}
                </option>
                {availableDates.map((date) => (
                  <option key={date.id} value={date.id}>
                    {new Date(
                      `${String(date.event_date).slice(0, 10)}T12:00:00`,
                    ).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <select
                value={form.booth_type}
                onChange={(e) => set("booth_type", e.target.value)}
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              >
                <option value="tent">Tent / booth</option>
                <option value="truck">Food truck</option>
              </select>
              {form.booth_type === "truck" && (
                <input
                  value={form.truck_size}
                  onChange={(e) => set("truck_size", e.target.value)}
                  placeholder="Truck length (e.g. 15, 18, or 24 ft)"
                  style={inp}
                  className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
                />
              )}
            </div>
            {selectedMarket && (
              <div
                style={{ background: C.paper2, border: `1px solid ${C.line}` }}
                className="rounded-xl mt-3 overflow-hidden"
              >
                <button
                  onClick={() => setShowMarketDetails((value) => !value)}
                  className="w-full text-left px-3.5 py-3 flex gap-3 items-center"
                >
                  <Store size={16} color={C.pine} />
                  <span className="flex-1">
                    <span className="block text-[12.5px] font-bold">
                      {selectedMarket.name} — vendor event details
                    </span>
                    <span
                      style={{ color: C.sub }}
                      className="block text-[11px] mt-0.5"
                    >
                      Click to read schedule, arrival, parking, and market
                      requirements.
                    </span>
                  </span>
                  <span
                    style={{ color: C.pine }}
                    className="text-[12px] font-bold"
                  >
                    {showMarketDetails ? "Hide" : "Read details"}
                  </span>
                </button>
                {showMarketDetails && (
                  <div
                    style={{ borderTop: `1px solid ${C.line}` }}
                    className="px-3.5 py-3 text-[12.5px] flex flex-col gap-3"
                  >
                    {selectedMarket.description && (
                      <p style={{ color: C.sub }}>
                        {selectedMarket.description}
                      </p>
                    )}
                    {selectedMarket.map_url && (
                      <a
                        href={selectedMarket.map_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: C.pine }}
                        className="font-bold underline"
                      >
                        Open venue map and directions
                      </a>
                    )}
                    {(selectedMarket.venue_contact_name ||
                      selectedMarket.venue_contact_phone ||
                      selectedMarket.venue_contact_email) && (
                      <div>
                        <p
                          style={{ color: C.faint }}
                          className="text-[10px] font-bold uppercase"
                        >
                          Venue contact
                        </p>
                        <p className="mt-1">
                          {[
                            selectedMarket.venue_contact_name,
                            selectedMarket.venue_contact_phone,
                            selectedMarket.venue_contact_email,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    )}
                    {[
                      ["schedule", "Schedule & event hours"],
                      ["arrival_instructions", "Arrival & check-in"],
                      ["parking_loadin", "Parking & load-in"],
                      ["rules", "Vendor rules & requirements"],
                      ["contact", "Day-of contact"],
                    ].map(([key, label]) =>
                      vendorDetails[key] ? (
                        <div key={key}>
                          <p
                            style={{ color: C.faint }}
                            className="text-[10px] font-bold uppercase"
                          >
                            {label}
                          </p>
                          <p className="whitespace-pre-wrap mt-1">
                            {vendorDetails[key]}
                          </p>
                        </div>
                      ) : null,
                    )}
                    {!selectedMarket.description &&
                      !Object.values(vendorDetails).some(Boolean) && (
                        <p style={{ color: C.sub }}>
                          The market team has not posted event details yet. You
                          can still apply and they will contact you with next
                          steps.
                        </p>
                      )}
                  </div>
                )}
              </div>
            )}
          </section>
          {applicationQuestions.length > 0 && (
            <section>
              <h2
                style={{ fontFamily: FD }}
                className="text-[19px] font-semibold mb-3"
              >
                Application questions
              </h2>
              <div className="flex flex-col gap-3">
                {applicationQuestions.map((question) => (
                  <div
                    key={question.id}
                    style={{
                      background: C.paper2,
                      border: `1px solid ${C.line}`,
                    }}
                    className="rounded-xl p-3"
                  >
                    <p className="text-[13px] font-semibold">
                      {question.label}
                    </p>
                    {question.type !== "comment" && (
                      <select
                        value={
                          form.application_answers[question.id]?.choice || ""
                        }
                        onChange={(event) =>
                          set("application_answers", {
                            ...form.application_answers,
                            [question.id]: {
                              ...(form.application_answers[question.id] || {}),
                              choice: event.target.value,
                            },
                          })
                        }
                        style={inp}
                        className="mt-2 px-3 py-2 rounded-lg text-[12px] outline-none"
                      >
                        <option value="">Choose an answer</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    )}
                    {question.type !== "yes_no" && (
                      <textarea
                        value={
                          form.application_answers[question.id]?.comment || ""
                        }
                        onChange={(event) =>
                          set("application_answers", {
                            ...form.application_answers,
                            [question.id]: {
                              ...(form.application_answers[question.id] || {}),
                              comment: event.target.value,
                            },
                          })
                        }
                        rows={2}
                        placeholder="Add a comment (optional)"
                        style={inp}
                        className="mt-2 w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2
              style={{ fontFamily: FD }}
              className="text-[19px] font-semibold mb-3"
            >
              Social media
            </h2>
            <p style={{ color: C.sub }} className="text-[12px] mb-2">
              Optional, but helpful when reviewing your application.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <input
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="Instagram"
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              />
              <input
                value={form.tiktok}
                onChange={(e) => set("tiktok", e.target.value)}
                placeholder="TikTok"
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              />
              <input
                value={form.facebook}
                onChange={(e) => set("facebook", e.target.value)}
                placeholder="Facebook"
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[14px] outline-none"
              />
            </div>
            <input
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="Website (optional)"
              style={inp}
              className="mt-3 w-full px-3 py-2.5 rounded-lg text-[14px] outline-none"
            />
          </section>
          <section>
            <h2
              style={{ fontFamily: FD }}
              className="text-[19px] font-semibold mb-3"
            >
              Insurance and photos
            </h2>
            <p style={{ color: C.sub }} className="text-[12px] mb-3">
              Optional now—you can request them later if needed.
            </p>
            {requestedDocuments.length > 0 && (
              <p
                style={{ background: C.honeySoft, color: C.honeyDeep }}
                className="rounded-lg px-3 py-2 text-[12px] mb-3"
              >
                This market requests: {requestedDocuments.join(" · ")}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <FilePicker
                label="Insurance certificate"
                help="PDF, JPG, PNG, or WebP · up to 5 MB"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onAdd={addInsurance}
                icon={FileText}
              />
              {insurance && (
                <p
                  style={{ color: C.pine }}
                  className="text-[12.5px] font-semibold"
                >
                  ✓ {insurance.file_name}
                </p>
              )}
              <FilePicker
                label="Booth or product photos"
                help="JPG, PNG, or WebP · up to 2 MB each · up to 4 photos"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onAdd={addPhotos}
                icon={ImagePlus}
              />
              {photos.length > 0 && (
                <p
                  style={{ color: C.pine }}
                  className="text-[12.5px] font-semibold"
                >
                  ✓ {photos.map((photo) => photo.file_name).join(", ")}
                </p>
              )}
            </div>
          </section>
          <section>
            <h2
              style={{ fontFamily: FD }}
              className="text-[19px] font-semibold mb-3"
            >
              Tell us about your business
            </h2>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
              placeholder="What do you sell? Include anything helpful for the review team."
              style={inp}
              className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-y"
            />
          </section>
          <button
            onClick={submit}
            disabled={busy}
            style={{
              background: C.pine,
              color: "#fff",
              opacity: busy ? 0.65 : 1,
            }}
            className="w-full py-3 rounded-lg text-[15px] font-bold flex items-center justify-center gap-2"
          >
            {busy ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Upload size={17} />
            )}{" "}
            Submit application
          </button>
        </div>
      </main>
    </div>
  );
}
