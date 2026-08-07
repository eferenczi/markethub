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
  // Managed Postgres providers usually require SSL.
  if (client === "pg" && process.env.DATABASE_URL) {
    base.connection = { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } };
  }
}

const config = { ...base, connection: base.connection || connection };

module.exports = { development: config, production: config };
