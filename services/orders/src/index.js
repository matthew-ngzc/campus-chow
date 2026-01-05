import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

import ordersRouter from './api/routes/order.routes.js';
import internalRouter from './api/routes/internal.routes.js';
import errorHandler from './api/middlewares/error.middleware.js';
import { swaggerSpec, swaggerUi } from './api/docs/swagger.config.js';
import { startOutboxProducer } from './workers/outbox.producer.js';
import { startInboxConsumer } from './workers/inbox.consumer.js';
import { startInboxProcessor } from './workers/inbox.processor.js';
import { sequelize } from './db/client.js';
import './models/index.js';
import { startCronScheduler } from "./workers/cron-scheduler.js";

const app = express();
const isDev = process.env.NODE_ENV === 'development';

// Trust proxy (e.g., if running behind a load balancer)
app.set('trust proxy', true);

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: true,
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
app.use('/api/orders', ordersRouter);
app.use('/internal', internalRouter);

// Errors
//app.use(notFound);
app.use(errorHandler);

// Function for starting wokers
const workerStates = new Map();
function safeStart(name, fn) {
  const state = { status: 'starting', lastError: null };
  workerStates.set(name, state);

  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      // async function (returns a Promise)
      result
        .then(() => { state.status = 'running'; })
        .catch(err => { 
          state.status = 'error'; 
          state.lastError = String(err?.message || err);
          console.error(`[${name}] failed to start:`, err);
        });
    } else {
      // sync function — assume success
      state.status = 'running';
    }
  } catch (err) {
    state.status = 'error';
    state.lastError = String(err?.message || err);
    console.error(`[${name}] failed to start (sync error):`, err);
  }
}

// Start server and workers
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[db] connected');

    await sequelize.sync({ alter: true }); // or  for dev schema updates
    console.log('[db] models synchronized');

    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      console.log( `[TIME] ${dayjs().tz('Asia/Singapore').format('YYYY-MM-DDTHH:mm:ssZ')}`);
      console.log(`[orders] listening on :${process.env.ORDERS_URL}`);
      console.log(`[docs] Swagger UI: ${process.env.ORDERS_URL}/api-docs`);
      if (process.env.NODE_ENV !== 'test') {
        safeStart('outbox-Producer', startOutboxProducer);
        safeStart('inbox-Consumer', startInboxConsumer);
        safeStart('inbox-Processor', startInboxProcessor);
        // Start your cron reminders
        safeStart("cron-scheduler", startCronScheduler);
      }


    });
  } catch (err) {
    console.error("\n[❌ STARTUP ERROR]");
    if (err.name === "SequelizeConnectionError") {
      console.error(`[db] Connection failed → ${err.message}`);
      console.error(`Check DATABASE_URL, username, or password.`);
    } else if (err.name === "SequelizeHostNotFoundError") {
      console.error(`[db] Host not found → ${err.message}`);
      console.error(`Check your database host in DATABASE_URL.`);
    } else if (err.name === "SequelizeAccessDeniedError") {
      console.error(`[db] Access denied → ${err.message}`);
      console.error(`Ensure user credentials are correct.`);
    } else if (err.code === "ECONNREFUSED") {
      console.error(`[amqp] Connection refused → ${err.message}`);
      console.error(`RabbitMQ might be down or AMQP_URL is invalid.`);
    } else {
      console.error(`[startup] Unexpected error:`, err);
    }

    console.error("[startup] Exiting process with code 1.");
    process.exit(1);
  }
}

startServer();