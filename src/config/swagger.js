/**
 * @file swagger.js
 * @brief OpenAPI / Swagger configuration for ProjectV.
 *
 * Uses swagger-jsdoc to generate an OpenAPI specification from
 * JSDoc comments in the route files. The generated spec is then
 * served via Swagger UI in index.js.
 */

import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ProjectV Middleware API",
      version: "1.0.0",
      description: "Middleware API to manage MongoDB collections and documents with authentication and audit logging",
    },
    servers: [
      { url: "http://localhost:" + (process.env.PORT || 3000) }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  },
  apis: [
    "./src/routes/*.js"
  ],
};


/**
 * @brief Generated OpenAPI specification for the API.
 *
 * This object is consumed by Swagger UI to render interactive
 * documentation at the /docs endpoint.
 */
export const swaggerSpec = swaggerJSDoc(options);


