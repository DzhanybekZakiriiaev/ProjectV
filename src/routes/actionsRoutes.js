import { Router } from "express";
import { getDb } from "../config/db.js";

const router = Router();

/**
 * @openapi
 * /actions/find:
 *   post:
 *     summary: Query the actions audit log
 *     tags: [Actions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filter:
 *                 type: object
 *               projection:
 *                 type: object
 *               sort:
 *                 type: object
 *               limit:
 *                 type: integer
 *               skip:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Actions log
 */
router.post("/find", async (req, res, next) => {
  try {
    const db = await getDb();
    const { filter = {}, projection, sort, limit = 100, skip = 0 } = req.body || {};
    if (typeof filter !== "object" || Array.isArray(filter)) {
      return res.status(400).json({ error: "filter must be an object" });
    }
    const cursor = db.collection("actions")
      .find(filter, { projection })
      .sort(sort || { timestamp: -1 })
      .skip(Number(skip) || 0)
      .limit(Math.min(Number(limit) || 100, 1000));
    const docs = await cursor.toArray();
    res.json({ ok: true, count: docs.length, actions: docs });
  } catch (err) {
    next(err);
  }
});

export default router;

