const bcrypt = require("bcryptjs");

/**
 * Demo data so you can log in immediately after setup.
 *   email:    demo@markethub.test
 *   password: password123
 * Change or remove this before going live.
 */
exports.seed = async function seed(knex) {
  await knex("vendors").del();
  await knex("markets").del();
  await knex("org_credentials").del();
  await knex("password_resets").del();
  await knex("users").del();
  await knex("organizations").del();

  const [orgId] = await knex("organizations").insert({
    name: "Central Makers Markets",
    plan_code: "pro",
    subscription_status: "active",
    subscription_provider: "manual",
    current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
  });
  const org = typeof orgId === "object" ? orgId.id : orgId;

  const password_hash = await bcrypt.hash("password123", 10);
  await knex("users").insert([
    { org_id: org, email: "demo@markethub.test", password_hash, name: "Demo Owner", role: "owner" },
    { org_id: org, email: "manager@markethub.test", password_hash, name: "Market Manager", role: "manager" },
    { org_id: org, email: "staff@markethub.test", password_hash, name: "Day-of Staff", role: "staff" },
  ]);

  await knex("markets").insert([
    { org_id: org, name: "Central Makers — Sanford", short_name: "Sanford", location: "Palmetto Ave, Sanford", description: "Weekly makers market in historic downtown Sanford.", booth_fee: 65, truck_fee: 120, app_fee: 10 },
    { org_id: org, name: "Wynwood Makers Market", short_name: "Wynwood", location: "NW 2nd Ave, Miami", description: "Biweekly market in the Wynwood arts district.", booth_fee: 85, truck_fee: 150, app_fee: 15 },
  ]);

  await knex("vendors").insert([
    { org_id: org, business_name: "Rosalind Candle Co.", contact_name: "Rosalind Vega", phone: "(305) 555-0142", email: "rosalind@example.com", city: "Miami", category: "Candles & Home", booth_type: "tent", stage: "Active" },
    { org_id: org, business_name: "Taco Libre Truck", contact_name: "Marco Díaz", phone: "(305) 555-0177", email: "marco@example.com", city: "Doral", category: "Food Truck", booth_type: "truck", stage: "Approved" },
  ]);
};
