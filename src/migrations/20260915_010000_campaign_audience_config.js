exports.up = async function up(knex) {
  await knex.schema.alterTable("campaigns", (t) => {
    t.text("audience_config").notNullable().defaultTo("{}");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("campaigns", (t) => {
    t.dropColumn("audience_config");
  });
};
