/**
 * Initial schema: organizations, users, password resets, encrypted org
 * credentials, and two example domain tables (markets, vendors) that show the
 * pattern for scoping data to an organization. The full domain model lives in
 * MarketHub_Build_Spec.md; add tables here following the same shape.
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("organizations", (t) => {
    t.increments("id").primary();
    t.string("name").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.string("email").notNullable();
    t.string("password_hash"); // null until the user sets a password (invited members)
    t.string("name").notNullable();
    t.string("role").notNullable().defaultTo("staff"); // owner | manager | staff | vendor
    t.boolean("active").notNullable().defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.unique(["email"]);
  });

  await knex.schema.createTable("password_resets", (t) => {
    t.increments("id").primary();
    t.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("token_hash").notNullable();
    t.string("purpose").notNullable().defaultTo("reset"); // reset | invite
    t.timestamp("expires_at").notNullable();
    t.timestamp("used_at");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.index(["token_hash"]);
  });

  await knex.schema.createTable("org_credentials", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.string("provider").notNullable(); // stripe | sendgrid | twilio
    t.text("data").notNullable(); // AES-256-GCM encrypted JSON blob
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.unique(["org_id", "provider"]);
  });

  await knex.schema.createTable("markets", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.string("name").notNullable();
    t.string("short_name");
    t.string("location");
    t.text("description");
    t.decimal("booth_fee", 10, 2).defaultTo(0);
    t.decimal("truck_fee", 10, 2).defaultTo(0);
    t.decimal("app_fee", 10, 2).defaultTo(0);
    t.boolean("archived").notNullable().defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("vendors", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.string("business_name").notNullable();
    t.string("contact_name");
    t.string("phone");
    t.string("email");
    t.string("city");
    t.string("category");
    t.string("booth_type").defaultTo("tent"); // tent | truck
    t.string("instagram");
    t.string("tiktok");
    t.string("facebook");
    t.string("stage").defaultTo("Lead"); // Lead | Applied | Approved | Active | Lapsed
    t.text("notes");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("vendors");
  await knex.schema.dropTableIfExists("markets");
  await knex.schema.dropTableIfExists("org_credentials");
  await knex.schema.dropTableIfExists("password_resets");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("organizations");
};
