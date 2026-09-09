exports.up = async function up(knex) {
  await knex.schema.alterTable("markets", (table) => {
    table.integer("sort_order").notNullable().defaultTo(0);
    table.string("venue_contact_name");
    table.string("venue_contact_phone");
    table.string("venue_contact_email");
    table.text("map_url");
    table.text("seasonal_rates").notNullable().defaultTo("[]");
  });
  await knex.schema.alterTable("vendor_applications", (table) => {
    table
      .integer("market_date_id")
      .references("id")
      .inTable("market_dates")
      .onDelete("SET NULL");
    table.text("application_answers").notNullable().defaultTo("{}");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("vendor_applications", (table) => {
    table.dropColumn("application_answers");
    table.dropColumn("market_date_id");
  });
  await knex.schema.alterTable("markets", (table) => {
    table.dropColumn("seasonal_rates");
    table.dropColumn("map_url");
    table.dropColumn("venue_contact_email");
    table.dropColumn("venue_contact_phone");
    table.dropColumn("venue_contact_name");
    table.dropColumn("sort_order");
  });
};
