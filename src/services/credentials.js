const db = require("../db");
const { encrypt, decrypt } = require("../utils/crypto");

const PROVIDERS = ["stripe", "sendgrid", "twilio"];

// Which fields each provider stores, and which are "secret" (never returned to the client).
const PROVIDER_FIELDS = {
  stripe: { fields: ["publishable_key", "secret_key", "webhook_secret"], secret: ["secret_key", "webhook_secret"] },
  sendgrid: { fields: ["api_key", "from_email"], secret: ["api_key"] },
  twilio: { fields: ["account_sid", "auth_token", "from_number"], secret: ["auth_token"] },
};

// Save (upsert) a provider's credentials for an org, encrypted at rest.
async function saveCredentials(orgId, provider, data) {
  const enc = encrypt(data);
  const existing = await db("org_credentials").where({ org_id: orgId, provider }).first();
  if (existing) {
    await db("org_credentials").where({ id: existing.id }).update({ data: enc, updated_at: new Date().toISOString() });
  } else {
    await db("org_credentials").insert({ org_id: orgId, provider, data: enc, updated_at: new Date().toISOString() });
  }
}

// Return decrypted credentials for internal use (integrations), or null.
async function getCredentials(orgId, provider) {
  const row = await db("org_credentials").where({ org_id: orgId, provider }).first();
  if (!row) return null;
  try {
    return decrypt(row.data);
  } catch {
    return null;
  }
}

// Return a client-safe view: which providers are configured, with secrets masked.
async function listMasked(orgId) {
  const rows = await db("org_credentials").where({ org_id: orgId });
  const byProvider = Object.fromEntries(rows.map((r) => [r.provider, r]));
  return PROVIDERS.map((provider) => {
    const row = byProvider[provider];
    const spec = PROVIDER_FIELDS[provider];
    const out = { provider, configured: false, fields: {}, updated_at: null };
    if (row) {
      out.configured = true;
      out.updated_at = row.updated_at;
      let data = {};
      try {
        data = decrypt(row.data) || {};
      } catch {
        data = {};
      }
      for (const f of spec.fields) {
        const val = data[f];
        if (val == null || val === "") {
          out.fields[f] = null;
        } else if (spec.secret.includes(f)) {
          out.fields[f] = maskSecret(String(val));
        } else {
          out.fields[f] = String(val);
        }
      }
    }
    return out;
  });
}

async function deleteCredentials(orgId, provider) {
  await db("org_credentials").where({ org_id: orgId, provider }).del();
}

function maskSecret(s) {
  if (s.length <= 4) return "••••";
  return "••••••••" + s.slice(-4);
}

module.exports = { PROVIDERS, PROVIDER_FIELDS, saveCredentials, getCredentials, listMasked, deleteCredentials };
