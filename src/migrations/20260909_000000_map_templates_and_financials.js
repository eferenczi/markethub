exports.up = async function up(knex) {
  await knex.schema.alterTable("approvals", (t) => {
    t.integer("processing_fee_cents").notNullable().defaultTo(0);
  });

  await knex.schema.createTable("booth_templates", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("market_id").notNullable().references("id").inTable("markets").onDelete("CASCADE");
    t.string("name").notNullable();
    t.text("venue_image");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.unique(["market_id", "name"]);
  });

  await knex.schema.createTable("booth_template_spots", (t) => {
    t.increments("id").primary();
    t.integer("template_id").notNullable().references("id").inTable("booth_templates").onDelete("CASCADE");
    t.string("code").notNullable();
    t.string("kind").notNullable().defaultTo("tent");
    t.decimal("x", 8, 3).notNullable().defaultTo(0);
    t.decimal("y", 8, 3).notNullable().defaultTo(0);
    t.decimal("width", 8, 3).notNullable().defaultTo(10);
    t.decimal("height", 8, 3).notNullable().defaultTo(8);
    t.decimal("rotation", 8, 3).notNullable().defaultTo(0);
    t.integer("sort_order").notNullable().defaultTo(0);
    t.unique(["template_id", "code"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("booth_template_spots");
  await knex.schema.dropTableIfExists("booth_templates");
  await knex.schema.alterTable("approvals", (t) => t.dropColumn("processing_fee_cents"));
};
