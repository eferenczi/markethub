exports.up = async function up(knex) {
  await knex.schema.alterTable("approvals", (table) => {
    table.string("payment_key").unique();
  });
  await knex.schema.createTable("vendor_notification_messages", (table) => {
    table.increments("id").primary();
    table
      .integer("org_id")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table
      .integer("approval_id")
      .notNullable()
      .references("id")
      .inTable("approvals")
      .onDelete("CASCADE");
    table.string("kind").notNullable(); // payment_request | paid_loadin | day_before_loadin
    table.string("recipient_email").notNullable();
    table.string("subject").notNullable();
    table.text("body").notNullable();
    table.timestamp("scheduled_at").notNullable();
    table.string("status").notNullable().defaultTo("queued");
    table.text("error");
    table.timestamp("sent_at");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["approval_id", "kind"]);
    table.index(["status", "scheduled_at"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("vendor_notification_messages");
  await knex.schema.alterTable("approvals", (table) => {
    table.dropColumn("payment_key");
  });
};
