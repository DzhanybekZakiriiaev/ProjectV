/**
 * @file create-admin.js
 * @brief Create admin user in the database
 * 
 * This script creates a single admin user with the specified credentials.
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { getDb, closeDb } from '../src/config/db.js';

dotenv.config();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...\n');

    const db = await getDb();
    console.log(`✅ Connected to database: ${db.databaseName}\n`);

    const usersCollection = db.collection('users');

    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email || 'N/A'}`);
      console.log('\n💡 To recreate, delete the existing admin user first.\n');
      return;
    }

    // Hash the password using hashSync (synchronous version)
    const hash = bcrypt.hashSync('yourpassword', 10);

    // Insert the admin user
    const result = await usersCollection.insertOne({
      username: 'admin',
      email: 'admin@example.com',
      password: hash
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Username: admin`);
    console.log(`   Email: admin@example.com`);
    console.log(`   Password: yourpassword`);
    console.log(`   ID: ${result.insertedId}\n`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

// Run if script is executed directly
createAdmin();

