import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import path from 'path';
//import { fileURLToPath } from 'url';

import j2s from 'joi-to-swagger';
// Import your Orders Joi schemas (see next section)
import {
  createOrderSchema,
  updateOrderStatusSchema,
  listUserOrdersQuerySchema,
} from '../middlewares/validation.middleware.js';

//const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

/**
 * Build the swagger spec (no YAML needed).
 * We scan controller files for @swagger blocks AND a docs folder with shared components.
 */
const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SMUNCH Orders API',
      version: '1.0.0',
      description:
        'Orders microservice for SMUNCH. Handles order creation, pricing, and status updates.',
    },
    servers: [
      { url: process.env.ORDERS_URL || 'http://localhost:8081' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: { /* Joi-injected below + jsdoc components */ },
    },
    security: [{ bearerAuth: [] }],
    tags: [{ name: 'Orders', description: 'Order lifecycle endpoints' }],
  },
  apis: [
    path.resolve(process.cwd(), 'src/api/controllers/**/*.js'),
    path.resolve(process.cwd(), 'src/api/routes/**/*.js'),
    path.resolve(process.cwd(), 'src/api/docs/**/*.jsdoc.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

// ---------- Inject components from Joi (request bodies / query) ----------
swaggerSpec.components = swaggerSpec.components || {};
swaggerSpec.components.schemas = swaggerSpec.components.schemas || {};

if (createOrderSchema) {
  const { swagger } = j2s(createOrderSchema);
  swaggerSpec.components.schemas.CreateOrderRequest = swagger;
}
if (updateOrderStatusSchema) {
  const { swagger } = j2s(updateOrderStatusSchema);
  swaggerSpec.components.schemas.UpdateOrderStatusRequest = swagger;
}
if (listUserOrdersQuerySchema) {
  const { swagger } = j2s(listUserOrdersQuerySchema);
  swaggerSpec.components.schemas.ListUserOrdersQuery = swagger;
}

export { swaggerSpec, swaggerUi };
