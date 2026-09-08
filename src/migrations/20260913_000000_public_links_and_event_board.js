exports.up = async function up(knex) {
  await knex.schema.alterTable("organizations", (table) => {
    table.string("public_subscribe_key");
  });
  await knex.schema.alterTable("market_dates", (table) => {
    table.string("manager_board_key");
  });
  await knex.schema.alterTable("campaign_messages", (table) => {
    table.text("html");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("campaign_messages", (table) =>
    table.dropColumn("html"),
  );
  await knex.schema.alterTable("market_dates", (table) =>
    table.dropColumn("manager_board_key"),
  );
  await knex.schema.alterTable("organizations", (table) =>
    table.dropColumn("public_subscribe_key"),
  );
};
