exports.up = async function up(knex) {
  await knex.schema.alterTable("approvals", (t) => t.string("acknowledgment_key").unique());
  await knex.schema.createTable("organizer_templates", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.string("type").notNullable(); // onboarding | categories_spaces | required_documents
    t.string("name").notNullable();
    t.text("config").notNullable().defaultTo("{}");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.index(["org_id", "type"]);
  });
  await knex.schema.createTable("market_template_assignments", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("template_id").notNullable().references("id").inTable("organizer_templates").onDelete("CASCADE");
    t.integer("market_id").notNullable().references("id").inTable("markets").onDelete("CASCADE");
    t.integer("market_date_id").references("id").inTable("market_dates").onDelete("CASCADE");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.unique(["template_id", "market_id", "market_date_id"]);
  });
  await knex.schema.createTable("vendor_acknowledgments", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("approval_id").notNullable().references("id").inTable("approvals").onDelete("CASCADE");
    t.integer("template_id").notNullable().references("id").inTable("organizer_templates").onDelete("CASCADE");
    t.text("answers").notNullable().defaultTo("{}");
    t.timestamp("acknowledged_at").defaultTo(knex.fn.now());
    t.unique(["approval_id", "template_id"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("vendor_acknowledgments");
  await knex.schema.dropTableIfExists("market_template_assignments");
  await knex.schema.dropTableIfExists("organizer_templates");
  await knex.schema.alterTable("approvals", (t) => t.dropColumn("acknowledgment_key"));
};
