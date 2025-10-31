import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

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

export async function getClient() {
  if (cachedClient) return cachedClient;
  await getDb();
  return cachedClient;
}

export async function closeDb() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}


