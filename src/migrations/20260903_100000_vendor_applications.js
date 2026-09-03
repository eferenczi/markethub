const crypto = require("crypto");

const makePublicKey = () => crypto.randomBytes(18).toString("base64url");

exports.up = async function up(knex) {
  await knex.schema.alterTable("organizations", (t) => {
    t.string("public_apply_key");
  });

  const organizations = await knex("organizations").select("id", "public_apply_key");
  for (const organization of organizations) {
    if (!organization.public_apply_key) {
      await knex("organizations").where({ id: organization.id }).update({ public_apply_key: makePublicKey() });
    }
  }
  await knex.schema.alterTable("organizations", (t) => t.unique(["public_apply_key"]));

  await knex.schema.createTable("vendor_applications", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("vendor_id").notNullable().references("id").inTable("vendors").onDelete("CASCADE");
    t.integer("market_id").notNullable().references("id").inTable("markets").onDelete("CASCADE");
    t.string("status").notNullable().defaultTo("under_review"); // under_review | approved | unapproved | withdrawn
    t.string("business_name").notNullable();
    t.string("contact_name").notNullable();
    t.string("phone").notNullable();
    t.string("email").notNullable();
    t.string("city");
    t.string("category");
    t.string("booth_type").notNullable().defaultTo("tent");
    t.string("booth_size");
    t.boolean("power_needed").notNullable().defaultTo(false);
    t.string("instagram");
    t.string("tiktok");
    t.string("facebook");
    t.text("website");
    t.text("description");
    t.text("review_notes");
    t.timestamp("submitted_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.index(["org_id", "status", "submitted_at"]);
    t.index(["org_id", "market_id"]);
  });

  // A data URL is stored only for the private pilot. It makes insurance and
  // photo uploads durable without relying on Render's ephemeral filesystem.
  await knex.schema.createTable("application_assets", (t) => {
    t.increments("id").primary();
    t.integer("org_id").notNullable().references("id").inTable("organizations").onDelete("CASCADE");
    t.integer("application_id").notNullable().references("id").inTable("vendor_applications").onDelete("CASCADE");
    t.string("kind").notNullable(); // insurance | booth_photo | product_photo
    t.string("file_name").notNullable();
    t.string("mime_type").notNullable();
    t.integer("size_bytes").notNullable();
    t.text("data").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.index(["application_id", "kind"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("application_assets");
  await knex.schema.dropTableIfExists("vendor_applications");
  await knex.schema.alterTable("organizations", (t) => {
    t.dropUnique(["public_apply_key"]);
    t.dropColumn("public_apply_key");
  });
};
