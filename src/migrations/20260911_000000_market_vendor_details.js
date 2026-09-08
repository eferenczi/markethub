exports.up = async function up(knex) {
  await knex.schema.alterTable("markets", (table) => {
    table.text("vendor_details").notNullable().defaultTo("{}");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("markets", (table) => {
    table.dropColumn("vendor_details");
  });
};
