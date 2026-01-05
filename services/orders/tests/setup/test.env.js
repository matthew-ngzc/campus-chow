// tests/setup/test.env.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1️⃣ Try to load a .env.test first (optional file committed to repo)
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// 2️⃣ Fallback to main .env if test file missing
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 3️⃣ Inject safe defaults for testing (non-secret / dummy values)
process.env.NODE_ENV = 'test';
process.env.TZ = process.env.TZ || 'Asia/Singapore';

// === DATABASE ===
// Use a separate test database (never the real one)
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://smunch:smunch@localhost:5434/smunch_orders_test';
process.env.POSTGRES_USER = process.env.POSTGRES_USER || 'smunch';
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'smunch';
process.env.POSTGRES_DB = process.env.POSTGRES_DB || 'smunch_orders_test';

// === SERVER ===
process.env.PORT = process.env.PORT || 9999;
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.ORDERS_URL = process.env.ORDERS_URL || 'http://localhost:8084';
process.env.PAYMENTS_URL = process.env.PAYMENTS_URL || 'http://localhost:8085';

// === DOWNSTREAM MICROSERVICES (dummy URLs for isolation) ===
process.env.API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
process.env.MERCHANTS_URL = process.env.MERCHANTS_URL || 'http://localhost:8082';
process.env.MENU_URL = process.env.MENU_URL || 'http://localhost:8083';
process.env.ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:8086';
process.env.USERS_URL = process.env.USERS_URL || 'http://localhost:8087';
process.env.RUNNERS_URL = process.env.RUNNERS_URL || 'http://localhost:8088';
process.env.EMAILS_URL = process.env.EMAILS_URL || 'http://localhost:8089';

// === AMQP (RabbitMQ) ===
process.env.AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672';
process.env.AMQP_EXCHANGE = process.env.AMQP_EXCHANGE || 'smunch.test.events';
process.env.AMQP_INBOX_QUEUE = process.env.AMQP_INBOX_QUEUE || 'orders.test.inbox';
process.env.AMQP_PREFETCH = process.env.AMQP_PREFETCH || 10;
process.env.AMQP_PUBLISH_BATCH = process.env.AMQP_PUBLISH_BATCH || 5;
process.env.AMQP_PUBLISH_INTERVAL_MS = process.env.AMQP_PUBLISH_INTERVAL_MS || 500;
process.env.INBOX_PROCESS_BATCH = process.env.INBOX_PROCESS_BATCH || 5;
process.env.INBOX_PROCESS_INTERVAL_MS = process.env.INBOX_PROCESS_INTERVAL_MS || 500;

// === AUTH ===
// ⚠️ Use dummy values only (safe to commit)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-for-production';
process.env.JWT_ALG = process.env.JWT_ALG || 'HS256';

// === BUSINESS CONFIG ===
process.env.DELIVERY_FEE_CENTS = process.env.DELIVERY_FEE_CENTS || 100;
process.env.PAYMENT_DEADLINE_MINUTES_BEFORE =
  process.env.PAYMENT_DEADLINE_MINUTES_BEFORE || 60;
process.env.PAYMENT_REMINDER_MINUTES_BEFORE =
  process.env.PAYMENT_REMINDER_MINUTES_BEFORE || 90;

console.log('[jest setup] Environment loaded for testing');
