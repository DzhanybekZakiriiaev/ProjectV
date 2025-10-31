import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { getClient, getDb } from "./config/db.js";
import dbRouter from "./routes/dbRoutes.js";
import authRouter from "./routes/authRoutes.js";
import actionsRouter from "./routes/actionsRoutes.js";
import { authenticate } from "./middleware/auth.js";
import { auditLog } from "./middleware/audit.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Health check (public)
app.get("/health", async (req, res) => {
  try {
    const client = await getClient();
    await client.db("admin").command({ ping: 1 });
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Auth routes (public)
app.use("/auth", authRouter);

// Protected API routes (auth + audit)
app.use("/api", authenticate, auditLog, dbRouter);
app.use("/actions", authenticate, auditLog, actionsRouter);

// Swagger docs (public)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;

async function start() {
  // ensure DB connects before starting server
  await getDb();
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});


