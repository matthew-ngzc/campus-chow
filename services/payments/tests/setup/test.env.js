// tests/setup/test.env.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load a .env.test first (if you have one), else fallback to .env
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Minimal defaults for testing (if not provided)
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || 9999;
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://smunch:smunch@localhost:5434/smunch_payments_test';
process.env.AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672';
process.env.AMQP_EXCHANGE = process.env.AMQP_EXCHANGE || 'smunch.test.events';

console.log('[jest setup] Environment loaded for testing');
