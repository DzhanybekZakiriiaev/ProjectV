# ProjectV Middleware API

Express-based middleware to control your MongoDB database with JWT authentication and automatic audit logging.

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment (optional)

Create a `.env` file in the project root if you want to override defaults.

### 3. Create a user in MongoDB

Before you can log in, manually insert a user document in the `users` collection with a bcrypt-hashed password.  
Example (using `bcryptjs`):

```js
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('yourpassword', 10);
db.users.insertOne({ username: 'admin', email: 'admin@example.com', password: hash });
```

### 4. Run the server

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

---

## 🔐 Authentication

All API routes (except `/health`, `/auth/login`, and `/docs`) require a JWT Bearer token.

### Login

**POST** `/auth/login`

**Body:**
```json
{ "username": "admin", "password": "yourpassword" }
```

**Response:**
```json
{ "ok": true, "token": "...", "user": { "username": "admin", "email": "admin@example.com" } }
```

Use the token in all subsequent requests:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/collections
```

---

## 🧾 Audit Logging

All API and actions requests are automatically logged to the `actions` collection with:

- username, email  
- method, path, params, query, body  
- statusCode, duration, timestamp, ip, userAgent  

### Query the audit log

**POST** `/actions/find` (requires auth)

**Body:**
```json
{ "filter": { "username": "admin" }, "sort": { "timestamp": -1 }, "limit": 100 }
```

---

## 🕒 Soft Delete & Automatic Metadata

All document operations include automatic timestamp and user tracking:

| Operation | Metadata Added |
|------------|----------------|
| **Create** | `created_at`, `created_by` |
| **Update** | `updated_at`, `updated_by` |
| **Delete** | `deleted_at`, `deleted_by` (soft delete) |

### Behavior
- All find/get operations exclude soft-deleted documents.
- Delete operations mark documents as deleted instead of removing them.
- You can still query deleted documents directly in MongoDB if needed.

---

## 🧠 API Reference

**Base URL:** `http://localhost:3000/api`  
*(All routes require Bearer token.)*

### Collections

#### Create collection
```http
POST /collections/:name
```
**Response 201:**
```json
{ "ok": true, "collection": "name" }
```

#### List collections
```http
GET /collections
```
**Response 200:**
```json
{ "ok": true, "collections": ["col1", "col2"] }
```

---

### Documents

#### Create document
```http
POST /collections/:name/documents
```
**Body:** JSON object (document fields)  
Automatically adds `created_at` and `created_by`.

**Response 201:**
```json
{ "ok": true, "insertedId": "..." }
```

---

#### Find with JSON filter
```http
POST /collections/:name/find
```
Automatically excludes soft-deleted documents.

**Body:**
```json
{
  "filter": { "status": "active", "age": { "$gte": 21 } },
  "projection": { "email": 1 },
  "sort": { "createdAt": -1 },
  "limit": 50,
  "skip": 0
}
```

**Response 200:**
```json
{ "ok": true, "count": 3, "documents": [ ... ] }
```

---

#### Get document by ID
```http
GET /collections/:name/documents/:id
```
Only returns if not soft-deleted.

**Response 200:**
```json
{ "ok": true, "document": { ... } }
```

---

#### Edit document by ID
```http
PATCH /collections/:name/documents/:id
```
Automatically adds `updated_at` and `updated_by`.

**Response 200:**
```json
{ "ok": true, "document": { ... } }
```

---

#### Delete document by ID (soft delete)
```http
DELETE /collections/:name/documents/:id
```
Sets `deleted_at` and `deleted_by`.

**Response 200:**
```json
{ "ok": true, "deleted": 1 }
```

---

#### Delete many by JSON filter (soft delete)
```http
DELETE /collections/:name/documents
```
or  
```http
POST /collections/:name/documents/delete
```

**Body:**
```json
{ "filter": { "status": "inactive" } }
```

**Response 200:**
```json
{ "ok": true, "deleted": 5 }
```

---

## 📘 Swagger

- **UI:** [http://localhost:3000/docs](http://localhost:3000/docs)  
  *(Use the “Authorize” button with your Bearer token)*
- **JSON:** [http://localhost:3000/swagger.json](http://localhost:3000/swagger.json)

---

## 🛡️ Security Notes

- All API routes require JWT authentication.
- All requests are logged to the `actions` collection.
- Set a strong `JWT_SECRET` in production.
- Consider adding **role-based authorization** and **rate limiting** in production.

  
---

## 🤝 Cross-Team Requirements and Change Management

### Combined Requirements Overview
Both the **Database Development Team** (ProjectV Middleware) and the **IT Deployment Team** share the goal of ensuring secure, reliable, and maintainable data management. The joint requirements include:

- **Consistent Configuration Management:** Environment variables (e.g., MongoDB URI, JWT secret) must be documented and synchronized across development, staging, and production environments.
- **Secure Deployment:** JWT secrets, admin credentials, and MongoDB access details must be stored using a secure method (e.g., `.env` with restricted permissions or a secrets manager).
- **Continuous Availability:** The middleware must be deployed with minimal downtime, using containerization or automated redeployment scripts.
- **Monitoring and Logging:** Both action logs (`actions` collection) and system logs should be collected and accessible to the IT team for auditing and incident response.
- **Version Compatibility:** Each new API version must maintain backward compatibility or provide migration documentation for existing collections.

### Change Management Conditions
To maintain system stability, any change to requirements or API structure should only be made when:

1. **Impact Analysis** has been conducted and approved by both teams.
2. **Documentation Updates** (README, Swagger, and config guides) are complete.
3. **Automated Tests** and manual smoke tests pass in staging.
4. **Rollback Plan** is defined for production deployments.
5. **Sign-Off** is received from the IT lead before release.

### Relevant Testing Practices
To ensure reliable performance and data integrity, both teams should coordinate the following testing strategies:

| Test Type           | Responsibility   | Purpose |
|--------------------|----------------|---------|
| **Unit Tests**      | Database Team   | Validate CRUD logic, JWT verification, and audit logging |
| **Integration Tests** | Database Team | Verify end-to-end MongoDB operations via API routes |
| **Deployment Tests**  | IT Team       | Confirm proper startup, environment config, and container health |
| **Load & Stress Tests** | IT + DB Teams | Evaluate response times and stability under realistic data volumes |
| **Security Tests**     | Both Teams    | Test token expiration, authorization headers, and vulnerability scans |
| **Recovery Tests**     | IT Team       | Validate that backup and restore procedures preserve audit logs |
