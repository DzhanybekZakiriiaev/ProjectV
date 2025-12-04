# Database Scripts

This directory contains utility scripts for managing the database.

## Seed Script

Populates the database with sample data for development and testing.

### Usage

```bash
npm run seed
```

### What it creates:

1. **Users Collection** (3 users):
   - `admin` / `admin123` (admin role)
   - `testuser` / `test123` (user role)
   - `demo` / `demo123` (user role)

2. **Products Collection** (5 products):
   - Electronics: Laptop, Mouse, Keyboard, Monitor
   - Furniture: Desk Chair

3. **Orders Collection** (3 orders):
   - Sample orders with various statuses

### Features:

- All seeded data is marked with `_seeded: true` flag
- Safe to run multiple times (skips if data already exists)
- Includes proper metadata (created_at, created_by, etc.)

## Cleanup Script

Removes all data that was created by the seed script.

### Usage

```bash
npm run seed:clean
```

### What it does:

- Removes all documents marked with `_seeded: true` from all collections
- Safe to run multiple times
- Shows summary of what was cleaned

## Environment Variables

Make sure you have your `.env` file configured with:

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=your_database_name
```

## Notes

- The seed script will skip seeding if data already exists (checks for `_seeded: true`)
- Only data created by the seed script will be removed by the cleanup script
- Your existing data (without `_seeded: true`) will remain untouched

