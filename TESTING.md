# Testing Guide

This project includes comprehensive unit tests using Jest. The test suite covers middleware, routes, and utilities.

## Test Structure

Tests are located in `__tests__` directories next to the source files they test:

- `src/middleware/__tests__/` - Tests for authentication and audit middleware
- `src/routes/__tests__/` - Tests for API routes
- `src/utils/__tests__/` - Tests for utility functions

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

### Middleware Tests
- **auth.test.js**: Tests JWT token generation and authentication middleware
- **audit.test.js**: Tests audit logging functionality

### Route Tests
- **authRoutes.test.js**: Tests login endpoint
- **dbRoutes.test.js**: Tests CRUD operations for collections and documents
- **actionsRoutes.test.js**: Tests audit log querying

### Utility Tests
- **softDelete.test.js**: Tests soft delete filter and metadata functions

## Test Configuration

Tests use Jest with Babel for ES module support. The configuration is in `jest.config.js` and `babel.config.js`.

### Mocking

Some tests use manual mocks located in `__mocks__` directories:
- `src/config/__mocks__/db.js` - Database connection mocks
- `src/utils/__mocks__/softDelete.js` - Soft delete utility mocks
- `src/middleware/__mocks__/auth.js` - Authentication mocks

## Notes

- Tests require Node.js with experimental VM modules support (automatically enabled via npm scripts)
- Some tests may need environment variables set (e.g., `JWT_SECRET`)
- Database-dependent tests use mocked MongoDB collections

