const express = require("express");
const { z } = require("zod");
const db = require("../db");
const config = require("../config");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const {
  hashPassword,
  verifyPassword,
  signToken,
  makeResetToken,
  hashResetToken,
} = require("../utils/auth");
const { sendMail } = require("../services/mailer");
const billing = require("../services/billing");

const router = express.Router();

function publicUser(u) {
  return { id: u.id, org_id: u.org_id, email: u.email, name: u.name, role: u.role };
}

// Create a brand-new organization with its first (owner) user.
router.post(
  "/register",
  validate(
    z.object({
      orgName: z.string().min(2),
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
    })
  ),
  asyncHandler(async (req, res) => {
    const { orgName, name, email, password } = req.body;
    const existing = await db("users").whereRaw("lower(email) = ?", [email.toLowerCase()]).first();
    if (existing) throw new ApiError(409, "An account with that email already exists");

    const [orgIdRaw] = await db("organizations").insert({ name: orgName, ...billing.trialFields() });
    const org_id = typeof orgIdRaw === "object" ? orgIdRaw.id : orgIdRaw;
    const password_hash = await hashPassword(password);
    const [userIdRaw] = await db("users").insert({ org_id, email, name, role: "owner", password_hash });
    const id = typeof userIdRaw === "object" ? userIdRaw.id : userIdRaw;

    const user = await db("users").where({ id }).first();
    const token = signToken({ sub: user.id });
    res.status(201).json({ token, user: publicUser(user) });
  })
);

router.post(
  "/login",
  validate(z.object({ email: z.string().email(), password: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await db("users").whereRaw("lower(email) = ?", [email.toLowerCase()]).first();
    const ok = user && user.active && (await verifyPassword(password, user.password_hash));
    if (!ok) throw new ApiError(401, "Invalid email or password");
    const token = signToken({ sub: user.id });
    res.json({ token, user: publicUser(user) });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

router.post(
  "/change-password",
  requireAuth,
  validate(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })),
  asyncHandler(async (req, res) => {
    const user = await db("users").where({ id: req.user.id }).first();
    const ok = await verifyPassword(req.body.currentPassword, user.password_hash);
    if (!ok) throw new ApiError(400, "Current password is incorrect");
    await db("users").where({ id: user.id }).update({ password_hash: await hashPassword(req.body.newPassword) });
    res.json({ ok: true });
  })
);

// Request a reset link. Always responds 200 so it can't be used to probe emails.
router.post(
  "/forgot",
  validate(z.object({ email: z.string().email() })),
  asyncHandler(async (req, res) => {
    const user = await db("users").whereRaw("lower(email) = ?", [req.body.email.toLowerCase()]).first();
    if (user) {
      const { token, hash } = makeResetToken();
      const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      await db("password_resets").insert({ user_id: user.id, token_hash: hash, purpose: "reset", expires_at });
      const link = `${config.appBaseUrl}/reset-password?token=${token}`;
      await sendMail({
        to: user.email,
        subject: "Reset your MarketHub password",
        text: `Reset your password using this link (valid for 1 hour):\n\n${link}`,
        html: `<p>Reset your password using this link (valid for 1 hour):</p><p><a href="${link}">${link}</a></p>`,
      });
    }
    res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
  })
);

// Complete a reset (also used to set the initial password for invited members).
router.post(
  "/reset",
  validate(z.object({ token: z.string().min(10), newPassword: z.string().min(8) })),
  asyncHandler(async (req, res) => {
    const token_hash = hashResetToken(req.body.token);
    const row = await db("password_resets").where({ token_hash }).whereNull("used_at").first();
    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      throw new ApiError(400, "This link is invalid or has expired");
    }
    await db("users").where({ id: row.user_id }).update({ password_hash: await hashPassword(req.body.newPassword), active: true });
    await db("password_resets").where({ id: row.id }).update({ used_at: new Date().toISOString() });
    res.json({ ok: true });
  })
);

module.exports = router;
