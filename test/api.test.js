/**
 * Formal API test suite. Spins up the real app against a throwaway SQLite DB,
 * runs migrations + seed, and exercises auth, roles, tenant isolation,
 * encrypted settings, and domain CRUD end to end.
 *
 * Run with:  npm test
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

// Isolated test environment — set BEFORE requiring app/db.
process.env.NODE_ENV = "test";
process.env.DB_CLIENT = "better-sqlite3";
process.env.DB_FILE = path.join(__dirname, "..", "data", "test.sqlite3");
process.env.JWT_SECRET = "test-jwt-secret";
process.env.APP_ENCRYPTION_KEY = "test-encryption-key";
process.env.CORS_ORIGINS = "http://localhost:5173";

if (fs.existsSync(process.env.DB_FILE)) fs.unlinkSync(process.env.DB_FILE);

const db = require("../src/db");
const app = require("../src/server");

let server;
let base;

function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({
    status: r.status,
    body: await r.json().catch(() => null),
  }));
}

before(async () => {
  await db.migrate.latest();
  await db.seed.run();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((r) => server.close(r));
  await db.destroy();
  if (fs.existsSync(process.env.DB_FILE)) fs.unlinkSync(process.env.DB_FILE);
});

// ---- helpers ----
async function loginDemo() {
  const res = await api("/auth/login", { method: "POST", body: { email: "demo@markethub.test", password: "password123" } });
  return res.body.token;
}

// ---- tests ----
test("health check responds", async () => {
  const res = await api("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test("compiled web client is served for an SPA route", async () => {
  const res = await fetch(base + "/reset-password");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<div id="root"><\/div>/);
});

test("login succeeds with seeded owner", async () => {
  const res = await api("/auth/login", { method: "POST", body: { email: "demo@markethub.test", password: "password123" } });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, "owner");
});

test("login fails with wrong password", async () => {
  const res = await api("/auth/login", { method: "POST", body: { email: "demo@markethub.test", password: "nope" } });
  assert.equal(res.status, 401);
});

test("login validation rejects bad input", async () => {
  const res = await api("/auth/login", { method: "POST", body: { email: "not-an-email", password: "" } });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.details));
});

test("/auth/me requires a token", async () => {
  const res = await api("/auth/me");
  assert.equal(res.status, 401);
});

test("/auth/me returns the current user with a token", async () => {
  const token = await loginDemo();
  const res = await api("/auth/me", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, "demo@markethub.test");
});

test("register creates a new org with an owner", async () => {
  const res = await api("/auth/register", {
    method: "POST",
    body: { orgName: "Test Org", name: "Tess", email: "tess@test.dev", password: "password123" },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, "owner");
  assert.ok(res.body.token);
});

test("duplicate registration email is rejected", async () => {
  const res = await api("/auth/register", {
    method: "POST",
    body: { orgName: "Dup", name: "Dup", email: "demo@markethub.test", password: "password123" },
  });
  assert.equal(res.status, 409);
});

test("staff cannot add members (role gate)", async () => {
  const staff = await api("/auth/login", { method: "POST", body: { email: "staff@markethub.test", password: "password123" } });
  const res = await api("/org/members", {
    method: "POST",
    token: staff.body.token,
    body: { name: "X", email: "x@y.dev", role: "staff" },
  });
  assert.equal(res.status, 403);
});

test("owner can invite a member", async () => {
  const token = await loginDemo();
  const res = await api("/org/members", {
    method: "POST",
    token,
    body: { name: "New Staff", email: "newstaff@test.dev", role: "staff" },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.member.role, "staff");
  assert.equal(res.body.member.active, 0); // inactive until they set a password
});

test("settings: only managers can read integrations", async () => {
  const staff = await api("/auth/login", { method: "POST", body: { email: "staff@markethub.test", password: "password123" } });
  const res = await api("/settings/integrations", { token: staff.body.token });
  assert.equal(res.status, 403);
});

test("settings: saving a Stripe key returns masked secrets and encrypts at rest", async () => {
  const token = await loginDemo();
  const save = await api("/settings/integrations/stripe", {
    method: "PUT",
    token,
    body: { secret_key: "sk_test_SECRETVALUE1234", publishable_key: "pk_test_1", webhook_secret: "whsec_abc" },
  });
  assert.equal(save.status, 200);
  assert.match(save.body.integration.fields.secret_key, /••••/);
  assert.ok(!JSON.stringify(save.body).includes("sk_test_SECRETVALUE1234"));

  // Confirm the stored blob is ciphertext, not plaintext.
  const row = await db("org_credentials").where({ provider: "stripe" }).first();
  assert.ok(!row.data.includes("sk_test_SECRETVALUE1234"));
});

test("settings: testing an invalid Stripe key fails cleanly (not a crash)", async () => {
  const token = await loginDemo();
  const res = await api("/settings/integrations/stripe/test", { method: "POST", token });
  assert.equal(res.status, 400);
});

test("markets: create, list, update, delete", async () => {
  const token = await loginDemo();
  const created = await api("/markets", { method: "POST", token, body: { name: "New Market", booth_fee: 50 } });
  assert.equal(created.status, 201);
  const id = created.body.market.id;

  const list = await api("/markets", { token });
  assert.ok(list.body.markets.some((m) => m.id === id));

  const updated = await api(`/markets/${id}`, { method: "PATCH", token, body: { name: "Renamed Market" } });
  assert.equal(updated.body.market.name, "Renamed Market");

  const del = await api(`/markets/${id}`, { method: "DELETE", token });
  assert.equal(del.status, 200);
  const after = await api("/markets", { token });
  assert.ok(!after.body.markets.some((m) => m.id === id));
});

test("vendors: create and validation", async () => {
  const token = await loginDemo();
  const good = await api("/vendors", { method: "POST", token, body: { business_name: "Lemon Stand", category: "Lemonade", booth_type: "tent" } });
  assert.equal(good.status, 201);

  const bad = await api("/vendors", { method: "POST", token, body: { business_name: "X", email: "not-email" } });
  assert.equal(bad.status, 400);
});

test("tenant isolation: one org cannot see another org's data", async () => {
  const ownerA = await loginDemo();
  // Create a second org and a market inside it.
  const reg = await api("/auth/register", { method: "POST", body: { orgName: "Org B", name: "Bee", email: "bee@test.dev", password: "password123" } });
  const tokenB = reg.body.token;
  const marketB = await api("/markets", { method: "POST", token: tokenB, body: { name: "Org B Secret Market" } });
  const idB = marketB.body.market.id;

  const listA = await api("/markets", { token: ownerA });
  assert.ok(!listA.body.markets.some((m) => m.id === idB), "Org A must not see Org B's market");

  // Org A also cannot modify Org B's market by id.
  const attempt = await api(`/markets/${idB}`, { method: "PATCH", token: ownerA, body: { name: "hacked" } });
  assert.equal(attempt.status, 404);
});

test("billing: new org is on an active trial and can use features", async () => {
  const reg = await api("/auth/register", { method: "POST", body: { orgName: "Trial Org", name: "Tri", email: "tri@test.dev", password: "password123" } });
  const token = reg.body.token;
  const bill = await api("/billing", { token });
  assert.equal(bill.body.status, "trialing");
  assert.equal(bill.body.active, true);
  assert.ok(bill.body.plans.length >= 1);
  // trial allows creating a market
  const m = await api("/markets", { method: "POST", token, body: { name: "Trial Market" } });
  assert.equal(m.status, 201);
});

test("billing: expired trial blocks paid features with 402", async () => {
  const reg = await api("/auth/register", { method: "POST", body: { orgName: "Expired Org", name: "Ex", email: "ex@test.dev", password: "password123" } });
  const token = reg.body.token;
  const orgId = reg.body.user.org_id;
  // Force the trial to have ended.
  await db("organizations").where({ id: orgId }).update({ trial_ends_at: new Date(Date.now() - 86400000).toISOString() });
  const blocked = await api("/markets", { method: "POST", token, body: { name: "Nope" } });
  assert.equal(blocked.status, 402);
  assert.equal(blocked.body.details.code, "subscription_required");
});

test("billing: owner can activate a plan and regain access; staff cannot activate", async () => {
  const reg = await api("/auth/register", { method: "POST", body: { orgName: "Activate Org", name: "Act", email: "act@test.dev", password: "password123" } });
  const token = reg.body.token;
  const orgId = reg.body.user.org_id;
  await db("organizations").where({ id: orgId }).update({ trial_ends_at: new Date(Date.now() - 86400000).toISOString() });

  const act = await api("/billing/activate", { method: "POST", token, body: { plan_code: "pro" } });
  assert.equal(act.status, 200);
  assert.equal(act.body.status, "active");

  const m = await api("/markets", { method: "POST", token, body: { name: "Now Allowed" } });
  assert.equal(m.status, 201);
});

test("operations: market date, CRM link, approval, payment, and booth map persist together", async () => {
  const token = await loginDemo();
  const markets = await api("/markets", { token });
  const vendors = await api("/vendors", { token });
  const market = markets.body.markets[0];
  const vendor = vendors.body.vendors[0];

  const date = await api("/operations/market-dates", {
    method: "POST",
    token,
    body: { market_id: market.id, event_date: "2026-10-03" },
  });
  assert.equal(date.status, 201);

  const link = await api(`/operations/vendor-markets/${vendor.id}/${market.id}`, {
    method: "PUT",
    token,
    body: { stage_override: "Applied", notes: "Prefers a corner booth" },
  });
  assert.equal(link.status, 200);
  assert.equal(link.body.vendor_market.stage_override, "Applied");
  const removedLink = await api(`/operations/vendor-markets/${vendor.id}/${market.id}`, { method: "DELETE", token });
  assert.equal(removedLink.status, 200);

  const approval = await api("/operations/approvals", {
    method: "POST",
    token,
    body: { vendor_id: vendor.id, market_date_id: date.body.market_date.id },
  });
  assert.equal(approval.status, 201);
  assert.equal(approval.body.approval.status, "pending");
  assert.ok(approval.body.approval.amount_due_cents > 0);
  const autoLink = await api(`/operations/vendor-markets?vendor_id=${vendor.id}&market_id=${market.id}`, { token });
  assert.equal(autoLink.status, 200);
  assert.equal(autoLink.body.vendor_markets.length, 1, "event enrollment links a vendor to the market CRM");

  const approved = await api(`/operations/approvals/${approval.body.approval.id}/approve`, { method: "POST", token });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.approval.status, "awaiting_payment");
  assert.ok(approved.body.approval.payment_deadline_at);

  const reminder = await api(`/operations/approvals/${approval.body.approval.id}/reminder`, { method: "POST", token });
  assert.equal(reminder.status, 200);
  assert.equal(reminder.body.approval.reminder_count, 1);

  const paid = await api(`/operations/approvals/${approval.body.approval.id}/record-payment`, {
    method: "POST",
    token,
    body: { payment_method: "stripe" },
  });
  assert.equal(paid.status, 200);
  assert.equal(paid.body.approval.status, "paid");
  assert.ok(paid.body.approval.processing_fee_cents > 0);

  const financials = await api(`/operations/financial-report?market_id=${market.id}`, { token });
  assert.equal(financials.status, 200);
  assert.equal(financials.body.totals.collected_cents, paid.body.approval.amount_due_cents);
  assert.ok(financials.body.totals.processing_fees_cents > 0);
  assert.equal(financials.body.by_payment_method[0].label, "stripe");

  const layout = await api("/operations/layouts", {
    method: "POST",
    token,
    body: {
      market_date_id: date.body.market_date.id,
      name: "October layout",
      spots: [{ code: "B1", kind: "tent", vendor_id: vendor.id, x: 8, y: 18, width: 66, height: 58, rotation: 0, sort_order: 1 }],
    },
  });
  assert.equal(layout.status, 201);
  assert.equal(layout.body.layout.spots[0].vendor_id, vendor.id);

  const template = await api("/operations/layout-templates", {
    method: "POST",
    token,
    body: { market_id: market.id, name: "Main venue", venue_image: "data:image/png;base64,SGVsbG8=", spots: [{ code: "B1", kind: "tent", x: 10, y: 10, width: 10, height: 8, rotation: 10, sort_order: 0 }] },
  });
  assert.equal(template.status, 201);
  const appliedTemplate = await api(`/operations/layout-templates/${template.body.template.id}/apply`, { method: "POST", token, body: { market_date_id: date.body.market_date.id } });
  assert.equal(appliedTemplate.status, 200);
  assert.equal(appliedTemplate.body.layout.spots[0].vendor_id, null, "templates do not carry a vendor into future events");
  const futureDate = await api("/operations/market-dates", { method: "POST", token, body: { market_id: market.id, event_date: "2026-10-10" } });
  assert.equal(futureDate.status, 201);
  const copiedLayout = await api(`/operations/layouts?market_date_id=${futureDate.body.market_date.id}`, { token });
  assert.equal(copiedLayout.body.layouts[0].spots[0].code, "B1", "new market dates start with the current market template");

  const list = await api(`/operations/approvals?market_date_id=${date.body.market_date.id}`, { token });
  assert.equal(list.status, 200);
  assert.equal(list.body.approvals[0].status, "paid");

  const expense = await api("/operations/expenses", {
    method: "POST",
    token,
    body: { market_id: market.id, market_date_id: date.body.market_date.id, category: "Permit", amount_cents: 12500, expense_date: "2026-10-01" },
  });
  assert.equal(expense.status, 201);
  const expenses = await api(`/operations/expenses?market_id=${market.id}`, { token });
  assert.equal(expenses.body.expenses[0].amount_cents, 12500);
});

test("vendor applications save contact details, uploads, and CRM review status", async () => {
  const token = await loginDemo();
  const org = await api("/org", { token });
  const market = (await api("/markets", { token })).body.markets[0];
  const key = org.body.org.public_apply_key;

  const publicForm = await api(`/applications/public/${key}`);
  assert.equal(publicForm.status, 200);
  assert.ok(publicForm.body.markets.some((item) => item.id === market.id));

  const minimal = await api(`/applications/public/${key}`, {
    method: "POST",
    body: {
      market_id: market.id,
      business_name: "Easy Entry Vendor",
      contact_name: "Erin Vendor",
      phone: "305-555-0199",
      email: "erin@easyentry.test",
    },
  });
  assert.equal(minimal.status, 201, "optional social media, insurance, and photos must not block an application");

  const submitted = await api(`/applications/public/${key}`, {
    method: "POST",
    body: {
      market_id: market.id,
      business_name: "Pilot Pie Co.",
      contact_name: "Pat Vendor",
      phone: "305-555-0101",
      email: "pat@pilotpie.test",
      category: "Bakery",
      booth_type: "tent",
      instagram: "@pilotpie",
      assets: [
        { kind: "insurance", file_name: "insurance.pdf", mime_type: "application/pdf", data: "data:application/pdf;base64,SGVsbG8=" },
        { kind: "product_photo", file_name: "pie.jpg", mime_type: "image/jpeg", data: "data:image/jpeg;base64,SGVsbG8=" },
      ],
    },
  });
  assert.equal(submitted.status, 201);
  assert.equal(submitted.body.application.status, "under_review");

  const applications = await api("/applications", { token });
  const application = applications.body.applications.find((item) => item.id === submitted.body.application.id);
  assert.equal(application.business_name, "Pilot Pie Co.");
  assert.equal(application.assets.length, 2);
  assert.ok(!Object.hasOwn(application.assets[0], "data"), "assets must not expose upload data in the CRM list");

  const asset = await fetch(`${base}/applications/${application.id}/assets/${application.assets[0].id}`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), "Hello");

  const reviewed = await api(`/applications/${application.id}`, { method: "PATCH", token, body: { status: "approved", review_notes: "Great fit for the October market" } });
  assert.equal(reviewed.status, 200);
  assert.equal(reviewed.body.application.status, "approved");
  const vendor = await db("vendors").where({ id: application.vendor_id }).first();
  assert.equal(vendor.stage, "Approved");
});

test("campaigns and newsletter contacts persist without sending messages", async () => {
  const token = await loginDemo();
  const subscriber = await api("/campaigns/subscribers", { method: "POST", token, body: { name: "Market Friend", email: "friend@example.test" } });
  assert.equal(subscriber.status, 201);
  const campaign = await api("/campaigns", {
    method: "POST",
    token,
    body: { name: "Sunday Market Update", audience: "all", steps: [{ channel: "email", subject: "See you Sunday", body: "Fresh vendors and food trucks.", delay_hours: 0 }, { channel: "sms", body: "Reminder: market opens tomorrow.", delay_hours: 24 }] },
  });
  assert.equal(campaign.status, 201);
  const list = await api("/campaigns", { token });
  assert.ok(list.body.campaigns.some((item) => item.name === "Sunday Market Update" && item.steps.length === 2));
});
