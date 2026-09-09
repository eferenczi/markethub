const db = require("../db");
const config = require("../config");
const sendgrid = require("./integrations/sendgrid");

const DEFAULTS = {
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

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
const processingFee = (paymentMethod, amountCents) =>
  ["cash", "zelle", "venmo"].includes(paymentMethod)
    ? 0
    : Math.round(Number(amountCents || 0) * 0.035);
const asDate = (value) =>
  new Date(`${String(value).slice(0, 10)}T13:00:00.000Z`);
const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

function due(approval) {
  const fee = Number(approval.fee_cents || 0);
  if (approval.status === "waived") return 0;
  const discount =
    approval.discount_type === "amount"
      ? Math.min(fee, Number(approval.discount_value || 0))
      : approval.discount_type === "percent"
        ? Math.round((fee * Number(approval.discount_value || 0)) / 100)
        : 0;
  return Math.max(0, fee - discount);
}

async function detailsFor(approvalId, orgId) {
  return db("approvals as a")
    .join("vendors as v", "v.id", "a.vendor_id")
    .join("markets as m", "m.id", "a.market_id")
    .join("market_dates as d", "d.id", "a.market_date_id")
    .where({ "a.id": approvalId, "a.org_id": orgId })
    .select(
      "a.*",
      "v.business_name",
      "v.contact_name",
      "v.email",
      "m.name as market_name",
      "m.vendor_details",
      "d.event_date",
    )
    .first();
}

async function messageConfig(approval) {
  const exact = await db("market_template_assignments as a")
    .join("organizer_templates as t", "t.id", "a.template_id")
    .where({
      "a.org_id": approval.org_id,
      "a.market_id": approval.market_id,
      "a.market_date_id": approval.market_date_id,
      "t.type": "vendor_messages",
    })
    .select("t.config")
    .orderBy("a.id", "desc")
    .first();
  const assigned =
    exact ||
    (await db("market_template_assignments as a")
      .join("organizer_templates as t", "t.id", "a.template_id")
      .where({
        "a.org_id": approval.org_id,
        "a.market_id": approval.market_id,
        "t.type": "vendor_messages",
      })
      .whereNull("a.market_date_id")
      .select("t.config")
      .orderBy("a.id", "desc")
      .first());
  try {
    return {
      ...DEFAULTS,
      ...(assigned ? JSON.parse(assigned.config || "{}") : {}),
    };
  } catch {
    return DEFAULTS;
  }
}

function valuesFor(approval) {
  let vendorDetails = {};
  try {
    vendorDetails = JSON.parse(approval.vendor_details || "{}");
  } catch {
    vendorDetails = {};
  }
  const base = config.appBaseUrl.replace(/\/$/, "");
  return {
    vendor_name: approval.contact_name || approval.business_name || "Vendor",
    business_name: approval.business_name || "",
    market_name: approval.market_name || "your market",
    event_date: new Date(
      `${String(approval.event_date).slice(0, 10)}T12:00:00Z`,
    ).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    amount_due: money(due(approval)),
    payment_link: `${base}/#/payment/${approval.payment_key}`,
    load_in_instructions:
      vendorDetails.arrival_instructions ||
      vendorDetails.parking_loadin ||
      "Your market manager will confirm your arrival and load-in details.",
  };
}

function fill(template, values) {
  return String(template || "").replace(
    /{{([a-z_]+)}}/g,
    (_, key) => values[key] || "",
  );
}

async function enqueue(approval, kind, subject, body, scheduledAt) {
  if (!approval.email) return { queued: false, reason: "no_email" };
  await db("vendor_notification_messages")
    .insert({
      org_id: approval.org_id,
      approval_id: approval.id,
      kind,
      recipient_email: approval.email,
      subject,
      body,
      scheduled_at: scheduledAt.toISOString(),
    })
    .onConflict(["approval_id", "kind"])
    .ignore();
  return { queued: true };
}

async function queuePaymentRequest(approvalId, orgId) {
  const approval = await detailsFor(approvalId, orgId);
  if (!approval) return null;
  const template = await messageConfig(approval);
  const values = valuesFor(approval);
  return enqueue(
    approval,
    "payment_request",
    fill(template.payment_subject, values),
    fill(template.payment_body, values),
    new Date(),
  );
}

async function queuePaidLoadIn(approvalId, orgId) {
  const approval = await detailsFor(approvalId, orgId);
  if (!approval) return null;
  const template = await messageConfig(approval);
  const values = valuesFor(approval);
  const tomorrow = new Date(
    asDate(approval.event_date).getTime() - 24 * 60 * 60 * 1000,
  );
  const now = new Date();
  await enqueue(
    approval,
    "paid_loadin",
    fill(template.paid_subject, values),
    fill(template.paid_body, values),
    now,
  );
  return enqueue(
    approval,
    "day_before_loadin",
    fill(template.day_before_subject, values),
    fill(template.day_before_body, values),
    tomorrow > now ? tomorrow : now,
  );
}

async function processDueVendorNotifications() {
  const messages = await db("vendor_notification_messages")
    .where({ status: "queued" })
    .where("scheduled_at", "<=", new Date().toISOString())
    .orderBy("scheduled_at")
    .limit(50);
  for (const message of messages) {
    const claimed = await db("vendor_notification_messages")
      .where({ id: message.id, status: "queued" })
      .update({ status: "sending" });
    if (!claimed) continue;
    try {
      await sendgrid.send(message.org_id, {
        to: message.recipient_email,
        subject: message.subject,
        text: message.body,
        html: `<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#17372f\">${escapeHtml(message.body).replace(/\n/g, "<br>")}</div>`,
      });
      await db("vendor_notification_messages")
        .where({ id: message.id })
        .update({ status: "sent", sent_at: new Date().toISOString() });
    } catch (error) {
      await db("vendor_notification_messages")
        .where({ id: message.id })
        .update({
          status: "failed",
          error: String(error.message || error).slice(0, 1000),
        });
    }
  }
}

async function markApprovalPaid(
  approvalId,
  orgId,
  paymentMethod = "stripe",
  processingFeeCents,
) {
  const approval = await db("approvals")
    .where({ id: approvalId, org_id: orgId })
    .first();
  if (!approval || approval.status === "paid") return approval;
  const feeCents =
    processingFeeCents === undefined
      ? processingFee(paymentMethod, due(approval))
      : processingFeeCents;
  await db("approvals").where({ id: approval.id }).update({
    status: "paid",
    payment_method: paymentMethod,
    processing_fee_cents: feeCents,
    paid_at: new Date().toISOString(),
    payment_deadline_at: null,
    updated_at: new Date().toISOString(),
  });
  await queuePaidLoadIn(approval.id, orgId);
  return db("approvals").where({ id: approval.id }).first();
}

module.exports = {
  DEFAULTS,
  due,
  processingFee,
  detailsFor,
  queuePaymentRequest,
  queuePaidLoadIn,
  processDueVendorNotifications,
  markApprovalPaid,
};
