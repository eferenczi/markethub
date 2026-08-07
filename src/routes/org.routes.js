const express = require("express");
const { z } = require("zod");
const db = require("../db");
const config = require("../config");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { makeResetToken } = require("../utils/auth");
const { sendMail } = require("../services/mailer");

const router = express.Router();
router.use(requireAuth);

const memberFields = ["id", "name", "email", "role", "active", "created_at"];

// Org profile + members.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const org = await db("organizations").where({ id: req.user.org_id }).first();
    const members = await db("users").where({ org_id: req.user.org_id }).select(memberFields).orderBy("created_at");
    res.json({ org, members });
  })
);

// Invite/create a member. They receive an email link to set their password.
router.post(
  "/members",
  requireRole("owner", "manager"),
  validate(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      role: z.enum(["manager", "staff", "vendor"]),
    })
  ),
  asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;
    const existing = await db("users").whereRaw("lower(email) = ?", [email.toLowerCase()]).first();
    if (existing) throw new ApiError(409, "A user with that email already exists");

    const [idRaw] = await db("users").insert({ org_id: req.user.org_id, name, email, role, password_hash: null, active: false });
    const id = typeof idRaw === "object" ? idRaw.id : idRaw;

    const { token, hash } = makeResetToken();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    await db("password_resets").insert({ user_id: id, token_hash: hash, purpose: "invite", expires_at });

    const link = `${config.appBaseUrl}/reset-password?token=${token}`;
    await sendMail({
      to: email,
      subject: "You've been invited to MarketHub",
      text: `${req.user.name} added you to MarketHub as a ${role}. Set your password here (valid 7 days):\n\n${link}`,
      html: `<p>${req.user.name} added you to MarketHub as a <b>${role}</b>.</p><p>Set your password here (valid 7 days):</p><p><a href="${link}">${link}</a></p>`,
    });

    const member = await db("users").where({ id }).select(memberFields).first();
    res.status(201).json({ member });
  })
);

// Change a member's role.
router.patch(
  "/members/:id",
  requireRole("owner", "manager"),
  validate(z.object({ role: z.enum(["owner", "manager", "staff", "vendor"]) })),
  asyncHandler(async (req, res) => {
    const target = await db("users").where({ id: req.params.id, org_id: req.user.org_id }).first();
    if (!target) throw new ApiError(404, "Member not found");
    if (target.id === req.user.id) throw new ApiError(400, "You can't change your own role");
    if (req.body.role === "owner" && req.user.role !== "owner") throw new ApiError(403, "Only an owner can grant owner");
    await db("users").where({ id: target.id }).update({ role: req.body.role });
    const member = await db("users").where({ id: target.id }).select(memberFields).first();
    res.json({ member });
  })
);

// Remove a member.
router.delete(
  "/members/:id",
  requireRole("owner", "manager"),
  asyncHandler(async (req, res) => {
    const target = await db("users").where({ id: req.params.id, org_id: req.user.org_id }).first();
    if (!target) throw new ApiError(404, "Member not found");
    if (target.id === req.user.id) throw new ApiError(400, "You can't remove yourself");
    if (target.role === "owner") throw new ApiError(400, "You can't remove an owner");
    await db("users").where({ id: target.id }).del();
    res.json({ ok: true });
  })
);

module.exports = router;
