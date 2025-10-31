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

export const swaggerSpec = swaggerJSDoc(options);


