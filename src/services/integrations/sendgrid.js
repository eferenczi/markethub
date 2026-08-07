const sgMail = require("@sendgrid/mail");
const { getCredentials } = require("../credentials");
const { ApiError } = require("../../middleware/error");

async function credsFor(orgId) {
  const creds = await getCredentials(orgId, "sendgrid");
  if (!creds || !creds.api_key) throw new ApiError(400, "SendGrid is not configured for this organization");
  return creds;
}

// Settings "Test connection": verify the key is accepted by the API.
async function test(orgId) {
  const creds = await credsFor(orgId);
  const res = await fetch("https://api.sendgrid.com/v3/scopes", {
    headers: { Authorization: `Bearer ${creds.api_key}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(400, `SendGrid rejected the key (HTTP ${res.status})`, body.slice(0, 200));
  }
  return { ok: true, detail: "SendGrid API key is valid" };
}

// Send a vendor-facing email (invitations, campaigns) from the org's own account.
async function send(orgId, { to, subject, html, text }) {
  const creds = await credsFor(orgId);
  sgMail.setApiKey(creds.api_key);
  const from = creds.from_email || "no-reply@example.com";
  return sgMail.send({ to, from, subject, html, text: text || undefined });
}

module.exports = { test, send };
