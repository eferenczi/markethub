exports.up = async function up(knex) {
  await knex.schema.alterTable("newsletter_subscribers", (t) => {
    t.text("interested_market_ids").notNullable().defaultTo("[]");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("newsletter_subscribers", (t) => {
    t.dropColumn("interested_market_ids");
  });
};
