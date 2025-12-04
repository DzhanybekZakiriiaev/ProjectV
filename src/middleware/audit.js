/**
 * @file audit.js
 * @brief Request/response audit logging middleware.
 *
 * Records details about each HTTP request and response in the
 * `actions` MongoDB collection, including user, path, status,
 * duration, IP address, and user agent.
 */

import { getDb } from "../config/db.js";

/**
 * @brief Middleware that logs API actions to MongoDB.
 *
 * Wraps the response lifecycle to capture timing and status.
 * After the response is sent, this middleware writes an audit
 * entry to the `actions` collection for debugging and compliance.
 *
 * Logged fields include:
 *  - username, email (from req.user when available)
 *  - HTTP method and full path
 *  - params, query, body
 *  - statusCode and duration (ms)
 *  - timestamp, IP address, user agent
 *
 * @param {import("express").Request} req  Incoming HTTP request.
 * @param {import("express").Response} res HTTP response.
 * @param {Function} next                  Next middleware function.
 * @returns {void}
 */
export async function auditLog(req, res, next) {
  const start = Date.now();
  const originalSend = res.send;
  let responseBody;

  res.send = function (data) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  res.on("finish", async () => {
    try {
      const db = await getDb();
      const action = {
        username: req.user?.username || "anonymous",
        email: req.user?.email || null,
        method: req.method,
        path: req.originalUrl || req.url,
        params: req.params,
        query: req.query,
        body: req.body,
        statusCode: res.statusCode,
        duration: Date.now() - start,
        timestamp: new Date(),
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers["user-agent"]
      };
      await db.collection("actions").insertOne(action);
    } catch (err) {
      console.error("Audit log error:", err.message);
    }
  });

  next();
}

