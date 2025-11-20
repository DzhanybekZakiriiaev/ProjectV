/**
 * @file authRoutes.js
 * @brief Authentication routes for ProjectV.
 *
 * Exposes endpoints for logging in and obtaining JWT tokens.
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "../config/db.js";
import { generateToken } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login and receive JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */

 /**
  * @brief Login endpoint for issuing JWT tokens.
  *
  * Validates the provided username and password against the `users`
  * collection. On success, returns a signed JWT token and basic user
  * information; otherwise returns an error.
  *
  * @route POST /auth/login
  *
  * @param {import("express").Request} req  Body: { username, password }.
  * @param {import("express").Response} res JSON response with token or error.
  * @param {Function} next                  Next middleware function.
  * @returns {Promise<void>}
  */
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "username and password required" });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken({ username: user.username, email: user.email });
    res.json({ ok: true, token, user: { username: user.username, email: user.email } });
  } catch (err) {
    next(err);
  }
});

export default router;

