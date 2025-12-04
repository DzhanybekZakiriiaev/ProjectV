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
curl http://localhost:3100/health
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
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3100/api/collections
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

**Base URL:** `http://localhost:3100/api`  
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

- **UI:** [http://localhost:3100/docs](http://localhost:3100/docs)  
  *(Use the “Authorize” button with your Bearer token)*
- **JSON:** [http://localhost:3100/swagger.json](http://localhost:3100/swagger.json)

---

## 🛡️ Security Notes

- All API routes require JWT authentication.
- All requests are logged to the `actions` collection.
- Set a strong `JWT_SECRET` in production.
- Consider adding **role-based authorization** and **rate limiting** in production.

  
---

## 🤝 Cross-Team Requirements and Change Management w/ IT Team

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

---

## 🤝 Cross-Team Integration w/ Facilities Team

### Description of the Facilities Team’s Component (As It Stands Currently)

The Facilities Team is developing a C++ application using CMake for building and deployment. Their component is responsible for managing maintenance-related operations, including creating and updating work orders, tracking assets and locations, and logging maintenance activities. Rather than interacting directly with the MongoDB instance, their system is designed to communicate exclusively with our Database/Auth middleware. All database interactions—such as inserting work orders, retrieving asset information, or updating equipment records—are performed through our secured REST API.

Their application depends on the stability of our authentication system (JWT), the correctness of our CRUD endpoints, and the consistency of our API structure. Once our API is deployed on the class server, the Facilities Team will connect to it using the server’s address and port, issuing HTTP requests directly from their C++ client. They rely heavily on our `/docs` Swagger interface and READMEs to understand the expected payloads, endpoint routes, and authentication procedures needed to integrate their component successfully.

---

### Combined List of Requirements Across Both Teams

Both the Database/Auth Team and the Facilities Team share several cross-functional requirements necessary for smooth integration:

* **Stable API Endpoints:** The Facilities Team depends on our consistent route structures for authentication, collection creation, and CRUD operations. Any changes to these endpoints would require updates on their side.
* **Authentication and Security:** The Facilities Team requires a reliable login mechanism that issues valid JWT tokens, and our team must ensure that token verification and authorization work predictably across all protected routes.
* **Documentation Alignment:** Our Swagger documentation (`/docs`) and README must remain synchronized with the actual API implementation so the Facilities Team can correctly construct and validate their requests.
* **Database Consistency:** Collections such as `WorkOrders`, `Assets`, and `Locations` must be available, appropriately named, and maintain predictable metadata fields (`created_at`, `updated_at`, `deleted_at`, etc.).
* **Operational Availability:** The Facilities Team must be able to reach our running container on the class server. This requires consistent port exposure, uptime, and the avoidance of breaking changes during development.
* **Interoperable Data Model:** Both teams must agree on the shape and identifiers of the data they exchange—for example, how work orders reference assets and locations, or which fields are required during creation.

Together, these requirements ensure that both teams can treat the middleware as a stable and predictable enterprise service.

---

### Recommended Conditions for Making Changes to These Requirements

Because the Facilities Team’s application completely depends on our API’s stability, changes should only occur once several conditions are met:

1. **Impact Analysis:** Both teams must evaluate how proposed API modifications affect client code, build configurations, and existing data.
2. **Complete and Updated Documentation:** Any API adjustments—such as changes to routes, payloads, or authentication—must be fully documented in the README and reflected in `/docs` before deployment.
3. **Backward Compatibility Whenever Possible:** Breaking changes should be avoided. If unavoidable, versioning (e.g., `/v1`, `/v2`) should be introduced so the Facilities Team can transition without interruption.
4. **Testing and Validation:** Changes must pass unit, integration, and security tests on the API side and be verified manually via Swagger before release.
5. **Staging Deployment and Smoke Tests:** A temporary staging environment or container must confirm that the Facilities Team can still authenticate and perform CRUD operations.
6. **Clear Communication and Approval:** The Facilities Team must be informed before any change is deployed, and updates should occur only with joint agreement.

These conditions prevent disruptions and preserve the reliability expected in a multi-team enterprise system.

---

### Relevant Tests for Reliable Operation Between DB/Auth and Facilities

The following tests ensure that both components can operate together without failure and maintain data integrity throughout the system:

| **Test Type**                  | **Responsible Team** | **Purpose for Both Teams**                                                                                                                              |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication Tests**       | Database/Auth        | Validate that login returns valid JWTs, expired tokens are rejected, and protected endpoints enforce authorization.                                     |
| **CRUD Integration Tests**     | Database/Auth        | Ensure Facilities can successfully create, read, update, and soft-delete documents through API calls using real collections (e.g., WorkOrders, Assets). |
| **Schema Compatibility Tests** | Both Teams           | Confirm that the data shapes used by Facilities match the expected fields and metadata added by the API.                                                |
| **Connection Tests**           | Facilities Team      | Verify that the C++ application can consistently reach the API on the server and handle network/port changes gracefully.                                |
| **Soft-Delete Behavior Tests** | Database/Auth        | Demonstrate that deleted records are excluded from default queries but still restorable, ensuring Facilities does not lose data unexpectedly.           |
| **Audit Logging Tests**        | Database/Auth        | Validate that every Facilities operation creates correct entries in the `actions` log, enabling traceability and debugging.                             |
| **Performance Sanity Tests**   | Both Teams           | Confirm that typical Facilities operations (e.g., listing work orders) return quickly under normal data volumes.                                        |
| **Error-Handling Tests**       | Facilities Team      | Ensure that their application gracefully handles 400/401/404 responses and retries or surfaces errors appropriately.                                    |

These tests collectively ensure that the Database/Auth service continues to function as a reliable backend and that the Facilities application can operate on top of it without unexpected behavior.
**Webhooks**
