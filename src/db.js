const fs = require("fs");
const path = require("path");
const knex = require("knex");
const knexConfig = require("../knexfile");

const env = process.env.NODE_ENV === "production" ? "production" : "development";
const cfg = knexConfig[env];

// Ensure the SQLite data directory exists before connecting.
if (cfg.client === "better-sqlite3" || cfg.client === "sqlite3") {
  const file = cfg.connection.filename;
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const db = knex(cfg);

module.exports = db;
