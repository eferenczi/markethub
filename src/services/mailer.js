const nodemailer = require("nodemailer");
const config = require("../config");

let transporter = null;
if (config.mail.host) {
  transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.port === 465,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
  });
}

/**
 * Send a platform email (password reset, member invite).
 * If no SMTP is configured, the message is logged to the console so the flow
 * still works during development/testing.
 */
async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log("\n──────── EMAIL (no SMTP configured, logged instead) ────────");
    // eslint-disable-next-line no-console
    console.log(`To: ${to}\nSubject: ${subject}\n\n${text || html}`);
    // eslint-disable-next-line no-console
    console.log("────────────────────────────────────────────────────────────\n");
    return { logged: true };
  }
  return transporter.sendMail({ from: config.mail.from, to, subject, html, text });
}

module.exports = { sendMail };
