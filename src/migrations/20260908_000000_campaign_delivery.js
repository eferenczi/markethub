exports.up = async function up(knex) {
  await knex.schema.alterTable("campaigns", (t) => {
    t.integer("market_id").references("id").inTable("markets").onDelete("SET NULL");
  });
  await knex.schema.createTable("newsletter_subscribers", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.string("name");
    t.string("email");
    t.string("phone");
    t.boolean("active").notNullable().defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.index(["org_id", "active"]);
  });
  await knex.schema.createTable("campaign_messages", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("campaign_id").notNullable().references("id").inTable("campaigns").onDelete("CASCADE");
    t.string("recipient_name");
    t.string("recipient_email");
    t.string("recipient_phone");
    t.string("channel").notNullable(); // email | sms | whatsapp
    t.string("subject");
    t.text("body").notNullable();
    t.timestamp("scheduled_at").notNullable();
    t.string("status").notNullable().defaultTo("queued"); // queued | sending | sent | failed | skipped
    t.text("error");
    t.timestamp("sent_at");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.index(["status", "scheduled_at"]);
    t.index(["campaign_id", "status"]);
  });
  await knex.schema.createTable("market_expenses", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("market_id").notNullable().references("id").inTable("markets").onDelete("CASCADE");
    t.integer("market_date_id").references("id").inTable("market_dates").onDelete("SET NULL");
    t.string("category").notNullable();
    t.integer("amount_cents").notNullable();
    t.text("note");
    t.date("expense_date").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.index(["org_id", "market_id", "expense_date"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("market_expenses");
  await knex.schema.dropTableIfExists("campaign_messages");
  await knex.schema.dropTableIfExists("newsletter_subscribers");
  await knex.schema.alterTable("campaigns", (t) => t.dropColumn("market_id"));
};
