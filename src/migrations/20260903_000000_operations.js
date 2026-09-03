/**
 * Shared operating records for the manager console. These replace the
 * browser-only prototype data with organization-scoped database records.
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable("markets", (t) => {
    t.string("frequency").notNullable().defaultTo("weekly");
    t.date("start_date");
    t.text("payment_methods").notNullable().defaultTo("[]");
  });

  await knex.schema.createTable("market_dates", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("market_id").notNullable().references("id").inTable("markets").onDelete("CASCADE");
    t.date("event_date").notNullable();
    t.string("status").notNullable().defaultTo("published"); // published | tentative | skipped
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.unique(["market_id", "event_date"]);
    t.index(["org_id", "event_date"]);
  });

  // The vendor CRM is shared across markets; this join controls market-level
  // eligibility and preserves an intentional pipeline-stage override.
  await knex.schema.createTable("vendor_markets", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("vendor_id").notNullable().references("id").inTable("vendors").onDelete("CASCADE");
    t.integer("market_id").notNullable().references("id").inTable("markets").onDelete("CASCADE");
    t.string("stage_override"); // Lead | Applied | Approved | Active | Lapsed
    t.text("notes");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.unique(["vendor_id", "market_id"]);
  });

  // An approval belongs to a specific market date. This prevents a paid booth
  // for one Saturday from being confused with the same vendor's next event.
  await knex.schema.createTable("approvals", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("vendor_id").notNullable().references("id").inTable("vendors").onDelete("CASCADE");
    t.integer("market_id").notNullable().references("id").inTable("markets").onDelete("CASCADE");
    t.integer("market_date_id").notNullable().references("id").inTable("market_dates").onDelete("CASCADE");
    t.string("status").notNullable().defaultTo("pending"); // pending | awaiting_payment | held | paid | released
    t.string("booth_type").notNullable().defaultTo("tent");
    t.integer("fee_cents").notNullable().defaultTo(0);
    t.string("discount_type").notNullable().defaultTo("none"); // none | amount | percent
    t.integer("discount_value").notNullable().defaultTo(0); // cents for amount; whole percentage for percent
    t.string("payment_method");
    t.timestamp("payment_deadline_at");
    t.timestamp("paid_at");
    t.integer("reminder_count").notNullable().defaultTo(0);
    t.text("notes");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.unique(["vendor_id", "market_date_id"]);
    t.index(["org_id", "market_date_id", "status"]);
  });

  await knex.schema.createTable("booth_layouts", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("market_id").notNullable().references("id").inTable("markets").onDelete("CASCADE");
    t.integer("market_date_id").notNullable().references("id").inTable("market_dates").onDelete("CASCADE");
    t.string("name").notNullable();
    t.text("venue_image");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.unique(["market_date_id", "name"]);
  });

  await knex.schema.createTable("booth_spots", (t) => {
    t.increments("id").primary();
    t.integer("layout_id").notNullable().references("id").inTable("booth_layouts").onDelete("CASCADE");
    t.integer("vendor_id").references("id").inTable("vendors").onDelete("SET NULL");
    t.string("code").notNullable();
    t.string("kind").notNullable().defaultTo("tent");
    t.decimal("x", 8, 3).notNullable().defaultTo(0);
    t.decimal("y", 8, 3).notNullable().defaultTo(0);
    t.decimal("width", 8, 3).notNullable().defaultTo(66);
    t.decimal("height", 8, 3).notNullable().defaultTo(58);
    t.decimal("rotation", 8, 3).notNullable().defaultTo(0);
    t.integer("sort_order").notNullable().defaultTo(0);
    t.unique(["layout_id", "code"]);
  });

  await knex.schema.createTable("campaigns", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.string("name").notNullable();
    t.string("audience").notNullable().defaultTo("vendors");
    t.string("status").notNullable().defaultTo("draft"); // draft | active | paused | archived
    t.text("steps").notNullable().defaultTo("[]");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("campaign_enrollments", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("campaign_id").notNullable().references("id").inTable("campaigns").onDelete("CASCADE");
    t.integer("vendor_id").notNullable().references("id").inTable("vendors").onDelete("CASCADE");
    t.boolean("active").notNullable().defaultTo(true);
    t.timestamp("enrolled_at").defaultTo(knex.fn.now());
    t.unique(["campaign_id", "vendor_id"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("campaign_enrollments");
  await knex.schema.dropTableIfExists("campaigns");
  await knex.schema.dropTableIfExists("booth_spots");
  await knex.schema.dropTableIfExists("booth_layouts");
  await knex.schema.dropTableIfExists("approvals");
  await knex.schema.dropTableIfExists("vendor_markets");
  await knex.schema.dropTableIfExists("market_dates");
  await knex.schema.alterTable("markets", (t) => {
    t.dropColumn("payment_methods");
    t.dropColumn("start_date");
    t.dropColumn("frequency");
  });
};
