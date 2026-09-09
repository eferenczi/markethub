import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  FileCheck2,
  Layers3,
  Loader2,
  Mail,
  MapPinned,
  Plus,
  Save,
} from "lucide-react";
import { api } from "./api";
import { C, FD } from "./theme";

const inp = { background: C.card, border: `1px solid ${C.line}`, color: C.ink };
const TYPES = [
  { key: "booths", label: "Booth Layouts", icon: MapPinned },
  { key: "onboarding", label: "Onboarding Forms", icon: ClipboardList },
  {
    key: "vendor_application",
    label: "Vendor Application",
    icon: ClipboardList,
  },
  { key: "categories_spaces", label: "Categories & Spaces", icon: Layers3 },
  { key: "required_documents", label: "Required Documents", icon: FileCheck2 },
  { key: "vendor_messages", label: "Vendor Emails", icon: Mail },
];
const DEFAULT_MESSAGES = {
  payment_subject: "You're approved for {{market_name}} — payment needed",
  payment_body:
    "Hi {{vendor_name}},\n\nGreat news — you are approved for {{market_name}} on {{event_date}}. Your balance is {{amount_due}}.\n\nPlease complete payment here: {{payment_link}}\n\nThank you!",
  paid_subject: "Thank you — you're confirmed for {{market_name}}",
  paid_body:
    "Hi {{vendor_name}},\n\nThank you for your payment. Your space is confirmed for {{market_name}} on {{event_date}}.\n\nLoad-in instructions:\n{{load_in_instructions}}\n\nWe look forward to seeing you!",
  day_before_subject: "Tomorrow: load-in for {{market_name}}",
  day_before_body:
    "Hi {{vendor_name}},\n\nA quick reminder that {{market_name}} is tomorrow, {{event_date}}.\n\nLoad-in instructions:\n{{load_in_instructions}}\n\nSee you there!",
};
const descriptions = {
  onboarding:
    "Create vendor acknowledgment questions with Yes / No and comment options.",
  vendor_application:
    "Create editable questions for the public vendor application with Yes / No and comment options.",
  categories_spaces: "Enter category or space options, one per line.",
  required_documents:
    "Enter requested document names, one per line. These are displayed to vendors but remain optional.",
};

function EmailTemplates({ templates, markets, canWrite, notify, reload }) {
  const [marketId, setMarketId] = useState("");
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("Vendor payment & load-in");
  const [form, setForm] = useState(DEFAULT_MESSAGES);
  const [busy, setBusy] = useState(false);
  const current = templates.filter(
    (template) => template.type === "vendor_messages",
  );
  const field = (label, key, multiline) => (
    <label className="block">
      <span
        style={{ color: C.faint }}
        className="text-[10.5px] font-bold uppercase tracking-wide"
      >
        {label}
      </span>
      {multiline ? (
        <textarea
          value={form[key]}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, [key]: event.target.value }))
          }
          rows={6}
          style={inp}
          className="mt-1 w-full px-3 py-2 rounded-lg text-[12.5px] outline-none resize-y"
        />
      ) : (
        <input
          value={form[key]}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, [key]: event.target.value }))
          }
          style={inp}
          className="mt-1 w-full px-3 py-2 rounded-lg text-[12.5px] outline-none"
        />
      )}
    </label>
  );
  const save = async () => {
    if (!name.trim()) return notify("Give the email template a name", "err");
    setBusy(true);
    try {
      const body = { type: "vendor_messages", name: name.trim(), config: form };
      const result = editing
        ? await api.updateTemplate(editing, body)
        : await api.createTemplate(body);
      if (marketId)
        await api.assignTemplate(result.template.id, {
          market_id: Number(marketId),
        });
      setEditing(result.template.id);
      notify(
        marketId
          ? "Vendor emails saved and applied to this market"
          : "Vendor emails saved",
      );
      await reload();
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <section
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        className="rounded-2xl p-5"
      >
        <div className="flex gap-3">
          <div
            style={{ background: C.berrySoft }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
          >
            <Mail size={18} color={C.berry} />
          </div>
          <div>
            <p style={{ fontFamily: FD }} className="text-[19px] font-semibold">
              Vendor payment & load-in emails
            </p>
            <p style={{ color: C.sub }} className="mt-1 text-[12px]">
              Sent automatically when a vendor is approved, when payment is
              received, and again the day before the market.
            </p>
          </div>
        </div>
        {canWrite && (
          <>
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Template name"
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[13px] outline-none"
              />
              <select
                value={marketId}
                onChange={(event) => setMarketId(event.target.value)}
                style={inp}
                className="px-3 py-2.5 rounded-lg text-[13px] outline-none"
              >
                <option value="">Save for use anywhere</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
            </div>
            <p style={{ color: C.sub }} className="mt-2 text-[11px]">
              Use these tokens: vendor_name, market_name, event_date,
              amount_due, payment_link, and load_in_instructions (inside double
              braces).
            </p>
            <div className="grid lg:grid-cols-3 gap-3 mt-4">
              <div style={{ background: C.paper2 }} className="rounded-xl p-3">
                {field("Approval / payment subject", "payment_subject")}
                {field("Approval / payment body", "payment_body", true)}
              </div>
              <div style={{ background: C.paper2 }} className="rounded-xl p-3">
                {field("Paid thank-you subject", "paid_subject")}
                {field("Paid thank-you + load-in body", "paid_body", true)}
              </div>
              <div style={{ background: C.paper2 }} className="rounded-xl p-3">
                {field("Day-before reminder subject", "day_before_subject")}
                {field("Day-before load-in body", "day_before_body", true)}
              </div>
            </div>
            <button
              onClick={save}
              disabled={busy}
              style={{ background: C.pine, color: "#fff" }}
              className="mt-4 px-4 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}{" "}
              {editing ? "Update email template" : "Save email template"}
            </button>
          </>
        )}
      </section>
      <section className="flex flex-col gap-2">
        {current.map((template) => (
          <article
            key={template.id}
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            className="rounded-xl p-4 flex gap-3"
          >
            <div className="flex-1">
              <p className="font-bold text-[14px]">{template.name}</p>
              <p style={{ color: C.sub }} className="mt-1 text-[12px]">
                {template.config?.payment_subject ||
                  DEFAULT_MESSAGES.payment_subject}
              </p>
            </div>
            {canWrite && (
              <button
                onClick={() => {
                  setEditing(template.id);
                  setName(template.name);
                  setForm({ ...DEFAULT_MESSAGES, ...(template.config || {}) });
                }}
                style={{ background: C.sageSoft, color: C.pine }}
                className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold"
              >
                Edit
              </button>
            )}
          </article>
        ))}
        {current.length === 0 && (
          <p
            style={{ color: C.faint }}
            className="text-center py-5 text-[13px]"
          >
            The built-in wording will be used until you save a custom email
            template.
          </p>
        )}
      </section>
    </div>
  );
}

export default function TemplatesPage({ canWrite, notify }) {
  const [type, setType] = useState("booths");
  const [templates, setTemplates] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [name, setName] = useState("");
  const [items, setItems] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [questionMode, setQuestionMode] = useState("yes_no_comment");
  const [marketId, setMarketId] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const [templateResult, marketResult] = await Promise.all([
        api.getTemplates(),
        api.getMarkets(),
      ]);
      setTemplates(templateResult.templates);
      setMarkets(marketResult.markets.filter((market) => !market.archived));
    } catch (error) {
      notify(error.message, "err");
    }
  };
  useEffect(() => {
    load();
  }, []);
  const current = templates.filter((template) => template.type === type);
  const addQuestion = () => {
    if (!questionText.trim())
      return notify("Write the question or comment first", "err");
    setQuestions((existing) => [
      ...existing,
      {
        id: `q${existing.length + 1}`,
        label: questionText.trim(),
        type: questionMode,
      },
    ]);
    setQuestionText("");
  };
  const save = async () => {
    if (
      !name.trim() ||
      (type === "onboarding" || type === "vendor_application"
        ? !questions.length
        : !items.trim())
    )
      return notify("Add a template name and at least one item", "err");
    setBusy(true);
    try {
      await api.createTemplate({
        type,
        name: name.trim(),
        config:
          type === "onboarding" || type === "vendor_application"
            ? { questions }
            : {
                items: items
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              },
      });
      setName("");
      setItems("");
      setQuestions([]);
      await load();
      notify("Template saved");
    } catch (error) {
      notify(error.message, "err");
    } finally {
      setBusy(false);
    }
  };
  const assign = async (template) => {
    if (!marketId)
      return notify("Choose a market to apply this template", "err");
    try {
      await api.assignTemplate(template.id, { market_id: Number(marketId) });
      notify(`${template.name} applied to this market`);
    } catch (error) {
      notify(error.message, "err");
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <section
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        className="rounded-2xl p-4"
      >
        <p style={{ fontFamily: FD }} className="text-[20px] font-semibold">
          Organizer templates
        </p>
        <p style={{ color: C.sub }} className="text-[12.5px] mt-1">
          Reuse venue layouts, vendor forms, required documents, and vendor
          communication.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              style={{
                background: type === key ? C.pine : C.paper2,
                color: type === key ? "#fff" : C.sub,
              }}
              className="px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1.5"
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </section>
      {type === "vendor_messages" ? (
        <EmailTemplates
          templates={templates}
          markets={markets}
          canWrite={canWrite}
          notify={notify}
          reload={load}
        />
      ) : type === "booths" ? (
        <section
          style={{ background: C.card, border: `1px solid ${C.line}` }}
          className="rounded-2xl p-5"
        >
          <MapPinned size={26} color={C.pine} />
          <p
            style={{ fontFamily: FD }}
            className="text-[19px] font-semibold mt-2"
          >
            Booth layouts
          </p>
          <p style={{ color: C.sub }} className="text-[13px] mt-1">
            Upload a venue image and create 10×10 canopy or food-truck spots in
            Event Operations → Booth map. Each market’s latest layout is
            automatically used for future event dates.
          </p>
        </section>
      ) : (
        <>
          <section
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            className="rounded-2xl p-4"
          >
            <p style={{ fontFamily: FD }} className="text-[18px] font-semibold">
              Create {TYPES.find((item) => item.key === type)?.label}
            </p>
            <p style={{ color: C.sub }} className="text-[12px] mt-1">
              {descriptions[type]}
            </p>
            {canWrite && (
              <div className="flex flex-col gap-2 mt-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Template name"
                  style={inp}
                  className="px-3 py-2.5 rounded-lg text-[13px] outline-none"
                />
                {type === "onboarding" || type === "vendor_application" ? (
                  <>
                    <div className="grid sm:grid-cols-[1fr_170px_auto] gap-2">
                      <input
                        value={questionText}
                        onChange={(event) =>
                          setQuestionText(event.target.value)
                        }
                        placeholder="Question or manager comment"
                        style={inp}
                        className="px-3 py-2.5 rounded-lg text-[13px] outline-none"
                      />
                      <select
                        value={questionMode}
                        onChange={(event) =>
                          setQuestionMode(event.target.value)
                        }
                        style={inp}
                        className="px-3 py-2.5 rounded-lg text-[12px]"
                      >
                        <option value="yes_no">Yes / No</option>
                        <option value="comment">Comment</option>
                        <option value="yes_no_comment">
                          Yes / No / Comment
                        </option>
                      </select>
                      <button
                        onClick={addQuestion}
                        style={{ background: C.paper2, color: C.pine }}
                        className="px-3 py-2 rounded-lg text-[12px] font-bold"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {questions.map((question, index) => (
                        <div
                          key={question.id}
                          style={{ background: C.paper2 }}
                          className="rounded-lg px-3 py-2 text-[12px] flex gap-2"
                        >
                          <span className="font-bold">{index + 1}.</span>
                          <span className="flex-1">{question.label}</span>
                          <span style={{ color: C.sub }} className="capitalize">
                            {question.type.replaceAll("_", " / ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <textarea
                    value={items}
                    onChange={(event) => setItems(event.target.value)}
                    rows={5}
                    placeholder="Add one item per line"
                    style={inp}
                    className="px-3 py-2.5 rounded-lg text-[13px] outline-none resize-y"
                  />
                )}
                <button
                  onClick={save}
                  disabled={busy}
                  style={{ background: C.pine, color: "#fff" }}
                  className="self-start px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
                >
                  <Save size={14} /> Save template
                </button>
              </div>
            )}
          </section>
          <section className="flex flex-col gap-2">
            <select
              value={marketId}
              onChange={(event) => setMarketId(event.target.value)}
              style={inp}
              className="self-start px-3 py-2 rounded-lg text-[12px] outline-none"
            >
              <option value="">Choose market to apply templates…</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
            </select>
            {current.map((template) => (
              <article
                key={template.id}
                style={{ background: C.card, border: `1px solid ${C.line}` }}
                className="rounded-xl p-4 flex gap-3"
              >
                <div className="flex-1">
                  <p className="text-[14px] font-bold">{template.name}</p>
                  <p style={{ color: C.sub }} className="text-[12px] mt-1">
                    {(template.config.questions || template.config.items || [])
                      .map((item) =>
                        typeof item === "string" ? item : item.label,
                      )
                      .join(" · ")}
                  </p>
                </div>
                {canWrite && (
                  <button
                    onClick={() => assign(template)}
                    style={{ background: C.sageSoft, color: C.pine }}
                    className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold"
                  >
                    Apply to market
                  </button>
                )}
              </article>
            ))}
            {current.length === 0 && (
              <p
                style={{ color: C.faint }}
                className="text-center py-5 text-[13px]"
              >
                No saved templates in this category yet.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
