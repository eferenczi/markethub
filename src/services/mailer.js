const sgMail = require("@sendgrid/mail");
const config = require("../config");

/**
 * Send a platform email (password reset, member invite). Production uses the
 * platform SendGrid account; development and tests log messages instead.
 */
async function sendMail({ to, subject, html, text }) {
  if (config.platformSendgrid.apiKey) {
    sgMail.setApiKey(config.platformSendgrid.apiKey);
    return sgMail.send({
      to,
      from: config.platformSendgrid.from,
      subject,
      html,
      text: text || undefined,
    });
  }
  if (!config.platformSendgrid.apiKey) {
    if (config.env === "production") throw new Error("Outbound email is not configured");
    // eslint-disable-next-line no-console
    console.log("\n──────── EMAIL (no SMTP configured, logged instead) ────────");
    // eslint-disable-next-line no-console
    console.log(`To: ${to}\nSubject: ${subject}\n\n${text || html}`);
    // eslint-disable-next-line no-console
    console.log("────────────────────────────────────────────────────────────\n");
    return { logged: true };
  }
  // The production guard in config.js prevents this branch from being reached.
  throw new Error("Outbound email is not configured");
}

module.exports = { sendMail };
