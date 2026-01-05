import 'dotenv/config';
import { Sequelize } from "sequelize";
import pg from "pg";

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

async function ensureDatabase() {
  const client = new pg.Client({
    host: DB_HOST,
    port: Number(DB_PORT || 5432),
    user: DB_USER,
    password: DB_PASS,
    database: "postgres"
  });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
  } catch (e) {
    // ignore "already exists"
  } finally {
    await client.end();
  }
}

async function connectSequelize() {
  const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: Number(DB_PORT || 5432),
    dialect: "postgres",
    logging: false
  });
  try {
    await sequelize.authenticate();
    return sequelize;
  } catch (err) {
    if ((err?.message || "").includes("does not exist")) {
      await ensureDatabase();
      await sequelize.authenticate();
      return sequelize;
    }
    throw err;
  }
}

export const sequelize = await connectSequelize();
