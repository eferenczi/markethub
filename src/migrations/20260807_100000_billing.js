/**
 * Subscription billing: a plans catalog and per-organization subscription state.
 * State is unified across channels (Stripe web, Apple IAP, Google IAP) so the
 * app gates access from one source of truth regardless of how the org paid.
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("plans", (t) => {
    t.increments("id").primary();
    t.string("code").notNullable().unique(); // starter | pro | ...
    t.string("name").notNullable();
    t.integer("price_cents").notNullable().defaultTo(0);
    t.string("interval").notNullable().defaultTo("month"); // month | year
    t.string("stripe_price_id"); // set once you create the price in Stripe
    t.text("features"); // JSON array of feature strings
    t.integer("sort").notNullable().defaultTo(0);
  });

  await knex.schema.alterTable("organizations", (t) => {
    t.string("plan_code");
    t.string("subscription_status").notNullable().defaultTo("trialing"); // trialing | active | past_due | canceled | none
    t.string("subscription_provider").notNullable().defaultTo("none"); // stripe | apple | google | manual | none
    t.timestamp("trial_ends_at");
    t.timestamp("current_period_end");
    t.string("stripe_customer_id");
    t.string("stripe_subscription_id");
  });

  await knex("plans").insert([
    { code: "starter", name: "Starter", price_cents: 2900, interval: "month", sort: 1, features: JSON.stringify(["1 market", "Up to 3 team members", "Vendor CRM", "Email support"]) },
    { code: "pro", name: "Pro", price_cents: 7900, interval: "month", sort: 2, features: JSON.stringify(["Unlimited markets", "Unlimited team", "Booth maps & check-in", "Payments & campaigns", "Priority support"]) },
  ]);
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("organizations", (t) => {
    t.dropColumn("plan_code");
    t.dropColumn("subscription_status");
    t.dropColumn("subscription_provider");
    t.dropColumn("trial_ends_at");
    t.dropColumn("current_period_end");
    t.dropColumn("stripe_customer_id");
    t.dropColumn("stripe_subscription_id");
  });
  await knex.schema.dropTableIfExists("plans");
};
