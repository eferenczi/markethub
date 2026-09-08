exports.up = async function up(knex) {
  await knex.schema.alterTable("vendors", (table) => {
    table.text("tags").notNullable().defaultTo("[]");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("vendors", (table) => {
    table.dropColumn("tags");
  });
};
