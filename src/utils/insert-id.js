/**
 * Insert a row and return its primary-key value across the supported
 * databases. SQLite returns an array of numeric ids, while PostgreSQL only
 * returns generated ids when RETURNING is requested.
 */
async function insertId(connection, table, values) {
  const query = connection(table).insert(values);
  const client = connection.client && connection.client.config && connection.client.config.client;
  const result = client === "pg" ? await query.returning("id") : await query;
  const first = Array.isArray(result) ? result[0] : result;
  return first && typeof first === "object" ? first.id : first;
}

module.exports = { insertId };
