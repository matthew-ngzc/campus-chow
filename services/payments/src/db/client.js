import pg from 'pg';
import dotenv from 'dotenv'; 
import { Sequelize } from 'sequelize';

dotenv.config();
const {Pool} = pg;

// Parse int8 and numeric to JS numbers (good enough for cents-based amounts)
pg.types.setTypeParser(20, (val) => parseInt(val, 10));   // int8
pg.types.setTypeParser(1700, (val) => parseFloat(val));   // numeric

// Create a single pool for the whole process
// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     require: true,
//     rejectUnauthorized: false  // <-- important for AWS RDS
//   }
// });
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Simple query helper (params is optional)
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    // if in dev, log query duration
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - start;
      console.debug(`[db] ${duration}ms  ${text.split('\n')[0]}`);
    }
    return res;
  } catch (err) {
    // Central place to add logging/observability
    console.error('[db] query error:', err.message);
    throw err;
  }
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback({
      query: (text, params) => client.query(text, params),
      client,
    });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {
      console.error("[DB] failed to rollback");
    }
    throw err;
  } finally {
    client.release();
  }
}
// Quick readiness probe
export async function healthcheck() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}

// Graceful shutdown for dev tooling / nodemon
export async function shutdownPool() {
  await pool.end();
  console.log('[db] pool closed');
}

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});