/**
 * @file cleanup.js
 * @brief Database cleanup script to remove seeded data
 * 
 * This script removes all data marked with _seeded: true from the database.
 */

import dotenv from 'dotenv';
import { getDb, closeDb } from '../src/config/db.js';

dotenv.config();

/**
 * Clean up seeded data from a collection
 */
async function cleanupCollection(db, collectionName) {
  const collection = db.collection(collectionName);
  const result = await collection.deleteMany({ _seeded: true });
  return result.deletedCount;
}

/**
 * Main cleanup function
 */
async function cleanup() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    const db = await getDb();
    console.log(`✅ Connected to database: ${db.databaseName}\n`);

    // Get all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    let totalDeleted = 0;
    const results = {};

    // Clean up each collection
    for (const collectionName of collectionNames) {
      try {
        const deleted = await cleanupCollection(db, collectionName);
        if (deleted > 0) {
          results[collectionName] = deleted;
          totalDeleted += deleted;
          console.log(`✅ Removed ${deleted} document(s) from '${collectionName}'`);
        }
      } catch (error) {
        console.error(`⚠️  Error cleaning '${collectionName}':`, error.message);
      }
    }

    if (totalDeleted === 0) {
      console.log('\n📌 No seeded data found to clean up.');
    } else {
      console.log(`\n✨ Cleanup completed! Removed ${totalDeleted} document(s) total.`);
      console.log('\nCollections cleaned:');
      for (const [collection, count] of Object.entries(results)) {
        console.log(`   - ${collection}: ${count} document(s)`);
      }
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

// Run cleanup if script is executed directly
cleanup();

