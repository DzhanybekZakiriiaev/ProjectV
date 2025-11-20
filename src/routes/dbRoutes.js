/**
 * @file dbRoutes.js
 * @brief Routes for managing collections and documents in MongoDB.
 *
 * Provides endpoints to list and create collections, and to perform
 * CRUD and soft-delete operations on documents within those collections.
 */

import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { 
  addSoftDeleteFilter, 
  getCreateMetadata, 
  getUpdateMetadata, 
  getDeleteMetadata 
} from "../utils/softDelete.js";

const router = Router();

/**
 * @brief Coerce string query values into appropriate types.
 *
 * Converts "true"/"false" to booleans, "null" to null, and numeric
 * strings to numbers where possible.
 *
 * @param {unknown} value Input value (often a string from query).
 * @returns {unknown} Coerced value with best-guess type.
 */
function coerceValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

/**
 * @brief Parse a filter input into an object.
 *
 * Accepts either an object or a JSON string. Returns a plain
 * object or an empty object when parsing fails or input is invalid.
 *
 * @param {unknown} input Filter provided by the client.
 * @returns {Object} Parsed filter object.
 */
function parseFilterInput(input) {
  if (!input) return {};
  if (typeof input === "object") return input;
  if (typeof input === "string") {
    try {
      const obj = JSON.parse(input);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch {}
  }
  return {};
}

/**
 * @openapi
 * /api/collections:
 *   get:
 *     summary: List collections in the database
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: Array of collection names
 */

 /**
  * @brief List all collections in the database.
  *
  * Returns an array of collection names from the current database.
  *
  * @route GET /api/collections
  */
router.get("/collections", async (req, res, next) => {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    res.json({ ok: true, collections: collections.map(c => c.name) });
  } catch (err) {
    next(err);
  }
});

// Create a collection: POST /api/collections/:name
/**
 * @openapi
 * /api/collections/{name}:
 *   post:
 *     summary: Create a collection
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Created
 */

 /**
  * @brief Create a new MongoDB collection if it does not exist.
  *
  * Returns a message indicating whether the collection was newly
  * created or already existed.
  *
  * @route POST /api/collections/:name
  */
router.post("/collections/:name", async (req, res, next) => {
  try {
    const db = await getDb();
    const { name } = req.params;
    if (!name) return res.status(400).json({ error: "Collection name is required" });

    const existing = await db.listCollections({ name }).toArray();
    if (existing.length > 0) {
      return res.status(200).json({ ok: true, message: "Collection already exists" });
    }

    await db.createCollection(name);
    res.status(201).json({ ok: true, collection: name });
  } catch (err) {
    next(err);
  }
});

// Create a document: POST /api/collections/:name/documents
/**
 * @openapi
 * /api/collections/{name}/documents:
 *   post:
 *     summary: Create a new document in a collection
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Inserted
 */

 /**
  * @brief Insert a new document into the specified collection.
  *
  * Adds creation metadata (created_at, created_by) using the
  * authenticated user, then inserts the document.
  *
  * @route POST /api/collections/:name/documents
  */
router.post("/collections/:name/documents", async (req, res, next) => {
  try {
    const db = await getDb();
    const { name } = req.params;
    const body = req.body || {};
    if (!name) return res.status(400).json({ error: "Collection name is required" });
    if (typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "Body must be an object" });
    }

    const docWithMetadata = { ...body, ...getCreateMetadata(req.user) };
    const result = await db.collection(name).insertOne(docWithMetadata);
    res.status(201).json({ ok: true, insertedId: result.insertedId });
  } catch (err) {
    next(err);
  }
});

// Edit a document by _id: PATCH /api/collections/:name/documents/:id
/**
 * @openapi
 * /api/collections/{name}/documents/{id}:
 *   patch:
 *     summary: Update a document by id
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */

 /**
  * @brief Partially update a document by its ID.
  *
  * Applies updates and update metadata, but only if the document
  * has not been soft deleted.
  *
  * @route PATCH /api/collections/:name/documents/:id
  */
router.patch("/collections/:name/documents/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, id } = req.params;
    const updates = req.body || {};
    if (!name) return res.status(400).json({ error: "Collection name is required" });
    if (!id) return res.status(400).json({ error: "Document id is required" });

    let _id;
    try {
      _id = new ObjectId(id);
    } catch (e) {
      return res.status(400).json({ error: "Invalid id format" });
    }

    if (typeof updates !== "object" || Array.isArray(updates)) {
      return res.status(400).json({ error: "Body must be an object" });
    }

    const updatesWithMetadata = { ...updates, ...getUpdateMetadata(req.user) };
    const result = await db.collection(name).findOneAndUpdate(
      addSoftDeleteFilter({ _id }),
      { $set: updatesWithMetadata },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Document not found" });
    res.json({ ok: true, document: result.value });
  } catch (err) {
    next(err);
  }
});

// Removed redundant GET search and GET list endpoints; use POST /find instead.

/**
 * @openapi
 * /api/collections/{name}/find:
 *   post:
 *     summary: Find documents by JSON filter with pagination and options
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Results
 */


/**
 * @brief Query documents from a collection using a JSON filter.
 *
 * Supports filter, projection, sort, limit, and skip. Automatically
 * excludes soft-deleted documents via addSoftDeleteFilter.
 *
 * @route POST /api/collections/:name/find
 */
router.post("/collections/:name/find", async (req, res, next) => {
  try {
    const db = await getDb();
    const { name } = req.params;
    const { filter = {}, projection, sort, limit = 50, skip = 0 } = req.body || {};
    if (typeof filter !== "object" || Array.isArray(filter)) return res.status(400).json({ error: "filter must be an object" });
    const col = db.collection(name);
    const softDeleteFilter = addSoftDeleteFilter(filter);
    const cursor = col.find(softDeleteFilter, { projection }).sort(sort || {}).skip(Number(skip) || 0).limit(Math.min(Number(limit) || 50, 500));
    const docs = await cursor.toArray();
    res.json({ ok: true, count: docs.length, documents: docs });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/collections/{name}/documents:
 *   delete:
 *     summary: Soft-delete documents by JSON filter (sets deleted_at/deleted_by)
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filter:
 *                 type: object
 *     responses:
 *       200:
 *         description: Deletion result
 */

 /**
  * @brief Soft-delete multiple documents matching a filter.
  *
  * Sets deleted_at and deleted_by on all documents that match the
  * provided filter and are not already soft-deleted.
  *
  * @route DELETE /api/collections/:name/documents
  */
router.delete("/collections/:name/documents", async (req, res, next) => {
  try {
    const db = await getDb();
    const { name } = req.params;
    const { filter = {} } = req.body || {};
    if (typeof filter !== "object" || Array.isArray(filter)) return res.status(400).json({ error: "filter must be an object" });
    const softDeleteFilter = addSoftDeleteFilter(filter);
    const result = await db.collection(name).updateMany(softDeleteFilter, { $set: getDeleteMetadata(req.user) });
    res.json({ ok: true, deleted: result.modifiedCount });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/collections/{name}/documents/delete:
 *   post:
 *     summary: Soft-delete documents by JSON filter (POST alternative, sets deleted_at/deleted_by)
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filter:
 *                 type: object
 *     responses:
 *       200:
 *         description: Deletion result
 */

 /**
  * @brief Soft-delete documents via POST as an alternative to DELETE.
  *
  * Same behavior as DELETE /documents but uses POST to make it easier
  * for some clients to send JSON bodies.
  *
  * @route POST /api/collections/:name/documents/delete
  */
router.post("/collections/:name/documents/delete", async (req, res, next) => {
  try {
    const db = await getDb();
    const { name } = req.params;
    const { filter = {} } = req.body || {};
    if (typeof filter !== "object" || Array.isArray(filter)) return res.status(400).json({ error: "filter must be an object" });
    const softDeleteFilter = addSoftDeleteFilter(filter);
    const result = await db.collection(name).updateMany(softDeleteFilter, { $set: getDeleteMetadata(req.user) });
    res.json({ ok: true, deleted: result.modifiedCount });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/collections/{name}/documents/{id}:
 *   get:
 *     summary: Get a document by id
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Found
 */

 /**
  * @brief Get a single document by its ID if not soft-deleted.
  *
  * @route GET /api/collections/:name/documents/:id
  */
router.get("/collections/:name/documents/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, id } = req.params;
    let _id;
    try { _id = new ObjectId(id); } catch {
      return res.status(400).json({ error: "Invalid id format" });
    }
    const doc = await db.collection(name).findOne(addSoftDeleteFilter({ _id }));
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json({ ok: true, document: doc });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/collections/{name}/documents/{id}:
 *   delete:
 *     summary: Soft-delete a document by id (sets deleted_at/deleted_by)
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */

 /**
  * @brief Soft-delete a single document by ID.
  *
  * Sets deleted_at and deleted_by fields instead of removing the
  * document from the collection.
  *
  * @route DELETE /api/collections/:name/documents/:id
  */
router.delete("/collections/:name/documents/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, id } = req.params;
    let _id;
    try { _id = new ObjectId(id); } catch {
      return res.status(400).json({ error: "Invalid id format" });
    }
    const result = await db.collection(name).updateOne(
      addSoftDeleteFilter({ _id }), 
      { $set: getDeleteMetadata(req.user) }
    );
    if (result.modifiedCount === 0) return res.status(404).json({ error: "Document not found" });
    res.json({ ok: true, deleted: result.modifiedCount });
  } catch (err) {
    next(err);
  }
});

export default router;


