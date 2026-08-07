/**
 * Simple timestamped backup of the SQLite database.
 *   node scripts/backup-sqlite.js
 * For Postgres/MySQL use your provider's managed backups (or pg_dump/mysqldump)
 * on a schedule — see PRODUCTION.md.
 */
const fs = require("fs");
const path = require("path");

const src = process.env.DB_FILE || "./data/markethub.sqlite3";
if (!fs.existsSync(src)) {
  console.error("No SQLite database found at", src);
  process.exit(1);
}
const dir = path.join(path.dirname(src), "backups");
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(dir, `markethub-${stamp}.sqlite3`);
fs.copyFileSync(src, dest);
console.log("Backup written:", dest);
