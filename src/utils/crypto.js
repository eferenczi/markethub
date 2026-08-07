const crypto = require("crypto");
const config = require("../config");

// Derive a stable 32-byte key from the configured secret so any string works.
const KEY = crypto.scryptSync(config.encryptionKey, "markethub.credentials.salt", 32);
const ALGO = "aes-256-gcm";

/**
 * Encrypt a JS object/string into a compact base64 token: iv|tag|ciphertext.
 */
function encrypt(value) {
  const plaintext = typeof value === "string" ? value : JSON.stringify(value);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

/**
 * Decrypt a token produced by encrypt(). Returns the parsed object (or raw string).
 */
function decrypt(token) {
  const raw = Buffer.from(token, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  try {
    return JSON.parse(dec);
  } catch {
    return dec;
  }
}

module.exports = { encrypt, decrypt };
