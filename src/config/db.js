/**
 * @file db.js
 * @brief MongoDB connection utilities for ProjectV.
 *
 * Exposes a shared connection to the MongoDB database used by
 * the middleware. Other modules should call getDb() to obtain
 * a reference to the database instance.
 */

import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

/**
 * @brief Get the shared MongoDB database instance.
 *
 * Returns the active database handle. If the connection has not
 * been initialized yet, this function will attempt to initialize
 * it before returning.
 *
 * @returns {Promise<import("mongodb").Db>} The MongoDB database instance.
 */
export async function getDb() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000
  });

  cachedClient = await client.connect();
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

/**
 * @brief Get the underlying MongoClient instance.
 *
 * Ensures that the database connection is initialized first.
 *
 * @returns {Promise<import("mongodb").MongoClient>} The MongoClient instance.
 */
export async function getClient() {
  if (cachedClient) return cachedClient;
  await getDb();
  return cachedClient;
}

/**
 * @brief Close the MongoDB client connection.
 *
 * Used during graceful shutdown or in tests to release resources.
 *
 * @returns {Promise<void>}
 */
export async function closeDb() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}


