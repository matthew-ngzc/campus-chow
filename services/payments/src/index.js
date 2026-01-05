import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import paymentsRouter from './api/routes/payment.route.js';
import internalRouter from './api/routes/internal.route.js';
import errorHandler from "./api/middlewares/error.middleware.js";
import { swaggerSpec, swaggerUi } from './api/docs/swagger.config.js';
import { startOutboxProducer } from './workers/outbox.producer.js';
import { startInboxConsumer } from './workers/inbox.consumer.js';
import { startInboxProcessor } from './workers/inbox.processor.js';
import { startEmailWorker } from './workers/email-processor/emailWorker.js';  // ← Add this line
import { sequelize } from './db/client.js';
import './models/index.js';

const app = express();
const isDev = process.env.NODE_ENV === 'development';

// Trust proxy (e.g., if running behind a load balancer)
app.set('trust proxy', true);

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Logging
app.use(morgan(isDev ? 'dev' : 'combined'));

// Body parser, limit to prevent memory exhaustion
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/health', (_, res) => res.json({ ok: true }));

// Swagger UI (reads your YAML and mounts at /docs)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/payments', paymentsRouter);
app.use('/api/payments/internal', internalRouter);

// Errors
//app.use(notFound);
app.use(errorHandler);

// Function for starting wokers
const workerStates = new Map();
function safeStart(name, fn) {
  const state = { status: 'starting', lastError: null };
  workerStates.set(name, state);
  fn().then(() => { state.status = 'running'; })
      .catch(err => { state.status = 'error'; state.lastError = String(err?.message || err); });
}

// Start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[db] connected');

    await sequelize.sync({ alter: true }); // or  for dev schema updates
    console.log('[db] models synchronized');

    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log(`[payments] listening on :${process.env.PAYMENTS_URL}`);
      console.log(`[docs] Swagger UI: ${process.env.PAYMENTS_URL}/api-docs`);

      if (process.env.NODE_ENV !== 'test') {
        safeStart('outbox-Producer', startOutboxProducer);
        safeStart('inbox-Consumer', startInboxConsumer);
        safeStart('inbox-Processor', startInboxProcessor);
        startEmailWorker();  // ← Just call it directly
      }
    });
  } catch (err) {
    console.error('[db / amqp] initialization error:', err);
    process.exit(1);
  }
}

startServer();