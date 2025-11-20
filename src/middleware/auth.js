/**
 * @file auth.js
 * @brief Authentication helpers and middleware for ProjectV.
 *
 * Provides JWT token generation and verification, and attaches
 * the decoded user object to the request for downstream handlers.
 */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";

/**
 * @brief Express middleware for JWT authentication.
 *
 * Reads the Authorization header, verifies the JWT using the
 * configured secret, and attaches the decoded payload to req.user.
 * If the token is missing or invalid, responds with HTTP 401.
 *
 * @param {import("express").Request} req  The incoming request.
 * @param {import("express").Response} res The HTTP response.
 * @param {Function} next                  Next middleware handler.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { username, email, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
}

/**
 * @brief Generate a signed JWT for a given payload.
 *
 * @param {Object} payload   User information to embed in the token.
 * @param {string} [expiresIn="24h"] Expiration time for the token.
 * @returns {string} Signed JWT string.
 */
export function generateToken(payload, expiresIn = "24h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

