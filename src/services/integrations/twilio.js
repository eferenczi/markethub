const twilio = require("twilio");
const { getCredentials } = require("../credentials");
const { ApiError } = require("../../middleware/error");

async function clientFor(orgId) {
  const creds = await getCredentials(orgId, "twilio");
  if (!creds || !creds.account_sid || !creds.auth_token) {
    throw new ApiError(400, "Twilio is not configured for this organization");
  }
  return { client: twilio(creds.account_sid, creds.auth_token), creds };
}

// Settings "Test connection": fetch the account to confirm the credentials work.
async function test(orgId) {
  const { client, creds } = await clientFor(orgId);
  const account = await client.api.v2010.accounts(creds.account_sid).fetch();
  return { ok: true, detail: `Connected to Twilio account "${account.friendlyName}" (${account.status})` };
}

// Send an SMS (reminders, day-of alerts) from the org's own Twilio number.
async function send(orgId, { to, body, whatsapp = false }) {
  const { client, creds } = await clientFor(orgId);
  const from = whatsapp ? creds.whatsapp_from : creds.from_number;
  if (!from) throw new ApiError(400, whatsapp ? "No Twilio WhatsApp sender configured" : "No Twilio from-number configured");
  return client.messages.create({ to: whatsapp && !to.startsWith("whatsapp:") ? `whatsapp:${to}` : to, from: whatsapp && !from.startsWith("whatsapp:") ? `whatsapp:${from}` : from, body });
}

module.exports = { test, send };
