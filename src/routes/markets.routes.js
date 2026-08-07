const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { asyncHandler, ApiError } = require("../middleware/error");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { requireActiveSubscription } = require("../middleware/subscription");

const router = express.Router();
router.use(requireAuth, requireActiveSubscription);

const canWrite = requireRole("owner", "manager", "staff");

const marketSchema = z.object({
  name: z.string().min(1),
  short_name: z.string().optional().default(""),
  location: z.string().optional().default(""),
  description: z.string().optional().default(""),
  booth_fee: z.number().nonnegative().optional().default(0),
  truck_fee: z.number().nonnegative().optional().default(0),
  app_fee: z.number().nonnegative().optional().default(0),
  archived: z.boolean().optional().default(false),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const markets = await db("markets").where({ org_id: req.user.org_id }).orderBy("created_at", "desc");
    res.json({ markets });
  })
);

router.post(
  "/",
  canWrite,
  validate(marketSchema),
  asyncHandler(async (req, res) => {
    const [idRaw] = await db("markets").insert({ ...req.body, org_id: req.user.org_id });
    const id = typeof idRaw === "object" ? idRaw.id : idRaw;
    const market = await db("markets").where({ id }).first();
    res.status(201).json({ market });
  })
);

router.patch(
  "/:id",
  canWrite,
  validate(marketSchema.partial()),
  asyncHandler(async (req, res) => {
    const market = await db("markets").where({ id: req.params.id, org_id: req.user.org_id }).first();
    if (!market) throw new ApiError(404, "Market not found");
    await db("markets").where({ id: market.id }).update(req.body);
    res.json({ market: await db("markets").where({ id: market.id }).first() });
  })
);

router.delete(
  "/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const count = await db("markets").where({ id: req.params.id, org_id: req.user.org_id }).del();
    if (!count) throw new ApiError(404, "Market not found");
    res.json({ ok: true });
  })
);

module.exports = router;
