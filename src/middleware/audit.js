import { getDb } from "../config/db.js";

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

