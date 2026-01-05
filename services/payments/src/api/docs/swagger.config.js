import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

// OPTIONAL: keep docs & validation in sync via Joi → OpenAPI
import j2s from 'joi-to-swagger';
import {
  bulkUpdateSchema,
  createPaymentSchema,
  updatePaymentStatusSchema,
  addTransactionSchema
} from '../middlewares/validation.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build the swagger spec (no YAML needed).
 * We scan controller files for @swagger blocks AND a docs folder with shared components.
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SMUNCH Payments API',
      version: '1.0.0',
      description:
        'API for creating payment instructions, updating payment status, and confirming payments for SMUNCH.',
    },
    // Make sure this is your actual base URL (NOT /api-docs)
    servers: [
      { url: process.env.PAYMENTS_PUBLIC_URL },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {/*inject below*/},
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Scan your controllers for route docs + the docs folder for components
  apis: [
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../docs/*.jsdoc.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

// ---------- Inject components from Joi (optional but recommended) ----------
swaggerSpec.components = swaggerSpec.components || {};
swaggerSpec.components.schemas = swaggerSpec.components.schemas || {};

if (createPaymentSchema) {
  const { swagger } = j2s(createPaymentSchema);
  swaggerSpec.components.schemas.CreatePaymentRequest = swagger;
}

if (updatePaymentStatusSchema) {
  const { swagger } = j2s(updatePaymentStatusSchema);
  swaggerSpec.components.schemas.UpdatePaymentStatusRequest = swagger;
}

if (bulkUpdateSchema) {
  const { swagger } = j2s(bulkUpdateSchema);
  swaggerSpec.components.schemas.BulkUpdateSchema = swagger;
}

if (addTransactionSchema) {
  const { swagger } = j2s(addTransactionSchema);
  swaggerSpec.components.schemas.addTransactionSchema = swagger;
}

export { swaggerSpec, swaggerUi };
