require("dotenv").config();

const client = process.env.DB_CLIENT || "better-sqlite3";

const base = {
  client,
  migrations: { directory: "./src/migrations" },
  seeds: { directory: "./src/seeds" },
};

let connection;
if (client === "better-sqlite3" || client === "sqlite3") {
  connection = { filename: process.env.DB_FILE || "./data/markethub.sqlite3" };
  base.useNullAsDefault = true;
} else {
  connection = process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
  // Enable SSL explicitly for external managed connections. Render's private
  // DATABASE_URL does not require it, while providers such as Supabase do.
  if (client === "pg" && process.env.DATABASE_URL) {
    base.connection = {
      connectionString: process.env.DATABASE_URL,
      ...(process.env.DB_SSL === "true" ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  }
}

const config = { ...base, connection: base.connection || connection };

// Render's private beta runs with NODE_ENV=staging. Keep every deployed
// environment on the same database configuration, while local development can
// still select SQLite through DB_CLIENT.
module.exports = { development: config, staging: config, production: config };
