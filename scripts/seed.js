/**
 * @file seed.js
 * @brief Database seeding script to populate sample data
 * 
 * This script populates the database with sample data for testing and development.
 * All seeded data is marked with a `_seeded: true` flag for easy identification and cleanup.
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { getDb, closeDb } from '../src/config/db.js';

dotenv.config();

const SEED_MARKER = { _seeded: true };
const SEED_TIMESTAMP = new Date();

/**
 * Seed users collection
 */
async function seedUsers(db) {
  console.log('📝 Seeding users collection...');
  const usersCollection = db.collection('users');

  // Hash passwords first
  const adminPassword = await bcrypt.hash('admin123', 10);
  const testPassword = await bcrypt.hash('test123', 10);
  const demoPassword = await bcrypt.hash('demo123', 10);

  const users = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP
    },
    {
      username: 'testuser',
      email: 'test@example.com',
      password: testPassword,
      role: 'user',
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP
    },
    {
      username: 'demo',
      email: 'demo@example.com',
      password: demoPassword,
      role: 'user',
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP
    }
  ];

  // Check if users already exist
  const existingUsers = await usersCollection.find({ _seeded: true }).toArray();
  if (existingUsers.length > 0) {
    console.log('⚠️  Users already seeded. Skipping...');
    return;
  }

  const result = await usersCollection.insertMany(users);
  console.log(`✅ Created ${result.insertedCount} users`);
  console.log('   - admin / admin123');
  console.log('   - testuser / test123');
  console.log('   - demo / demo123');
}

/**
 * Seed products collection
 */
async function seedProducts(db) {
  console.log('📦 Seeding products collection...');
  const productsCollection = db.collection('products');

  const products = [
    {
      name: 'Laptop',
      category: 'Electronics',
      price: 999.99,
      stock: 50,
      description: 'High-performance laptop for work and gaming',
      active: true,
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP,
      created_at: new Date(),
      created_by: 'seed-script'
    },
    {
      name: 'Mouse',
      category: 'Electronics',
      price: 29.99,
      stock: 200,
      description: 'Wireless optical mouse',
      active: true,
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP,
      created_at: new Date(),
      created_by: 'seed-script'
    },
    {
      name: 'Keyboard',
      category: 'Electronics',
      price: 79.99,
      stock: 150,
      description: 'Mechanical keyboard with RGB lighting',
      active: true,
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP,
      created_at: new Date(),
      created_by: 'seed-script'
    },
    {
      name: 'Monitor',
      category: 'Electronics',
      price: 299.99,
      stock: 75,
      description: '27-inch 4K monitor',
      active: true,
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP,
      created_at: new Date(),
      created_by: 'seed-script'
    },
    {
      name: 'Desk Chair',
      category: 'Furniture',
      price: 199.99,
      stock: 30,
      description: 'Ergonomic office chair',
      active: true,
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP,
      created_at: new Date(),
      created_by: 'seed-script'
    }
  ];

  // Check if products already exist
  const existingProducts = await productsCollection.find({ _seeded: true }).toArray();
  if (existingProducts.length > 0) {
    console.log('⚠️  Products already seeded. Skipping...');
    return;
  }

  const result = await productsCollection.insertMany(products);
  console.log(`✅ Created ${result.insertedCount} products`);
}

/**
 * Seed orders collection
 */
async function seedOrders(db) {
  console.log('🛒 Seeding orders collection...');
  const ordersCollection = db.collection('orders');

  const orders = [
    {
      orderNumber: 'ORD-001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: [
        { productId: '1', name: 'Laptop', quantity: 1, price: 999.99 },
        { productId: '2', name: 'Mouse', quantity: 2, price: 29.99 }
      ],
      total: 1059.97,
      status: 'completed',
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP,
      created_at: new Date(),
      created_by: 'seed-script'
    },
    {
      orderNumber: 'ORD-002',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      items: [
        { productId: '3', name: 'Keyboard', quantity: 1, price: 79.99 }
      ],
      total: 79.99,
      status: 'pending',
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP,
      created_at: new Date(),
      created_by: 'seed-script'
    },
    {
      orderNumber: 'ORD-003',
      customerName: 'Bob Johnson',
      customerEmail: 'bob@example.com',
      items: [
        { productId: '4', name: 'Monitor', quantity: 2, price: 299.99 },
        { productId: '5', name: 'Desk Chair', quantity: 1, price: 199.99 }
      ],
      total: 799.97,
      status: 'processing',
      ...SEED_MARKER,
      _seededAt: SEED_TIMESTAMP,
      created_at: new Date(),
      created_by: 'seed-script'
    }
  ];

  // Check if orders already exist
  const existingOrders = await ordersCollection.find({ _seeded: true }).toArray();
  if (existingOrders.length > 0) {
    console.log('⚠️  Orders already seeded. Skipping...');
    return;
  }

  const result = await ordersCollection.insertMany(orders);
  console.log(`✅ Created ${result.insertedCount} orders`);
}

/**
 * Main seeding function
 */
async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    const db = await getDb();
    console.log(`✅ Connected to database: ${db.databaseName}\n`);

    await seedUsers(db);
    await seedProducts(db);
    await seedOrders(db);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📌 Note: All seeded data is marked with _seeded: true');
    console.log('   Run "npm run seed:clean" to remove seeded data\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

// Run seed if script is executed directly
seed();

