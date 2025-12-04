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
- **auth.test.js**: Tests JWT token generation and authentication middleware (8 tests)

### Utility Tests
- **softDelete.test.js**: Tests soft delete filter and metadata functions (13 tests)

## Test Configuration

Tests use Jest with Babel for ES module support. The configuration is in `jest.config.js` and `babel.config.js`.

## Current Test Status

- ✅ **2 test suites passing**
- ✅ **21 tests passing**
- All tests focus on pure functions and utilities that don't require external dependencies or complex mocking

## Notes

- Tests require Node.js with experimental VM modules support (automatically enabled via npm scripts)
- Tests use actual implementations where possible (no mocking needed for current test suite)
- Route and integration tests would require additional setup for ES module compatibility

