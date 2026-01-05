import crypto from "node:crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

import { pool } from "../db/client.js";
import {
  claimBatch,
  markProcessed,
  //markFailed,
} from "../api/repositories/outbox.repo.js";
import { getAmqpChannel, AMQP_EXCHANGE } from "../services/amqp.js";


const PUBLISH_BATCH = Number(process.env.AMQP_PUBLISH_BATCH || 100);
const PUBLISH_INTERVAL_MS = Number(
  process.env.AMQP_PUBLISH_INTERVAL_MS || 1000
);


/**
 * Build AMQP properties for our outgoing messages.
 */
export function buildProperties() {
  return {
    messageId: crypto.randomUUID(),
    headers: {
      sourceService: 'payment',
      sentAt: dayjs().tz('Asia/Singapore').format('YYYY-MM-DDTHH:mm:ssZ'),
    },
  };
}

async function publishOnce() {
  const ch = await getAmqpChannel("publisher");
  const rows = await claimBatch(pool, { size: PUBLISH_BATCH });
  if (rows?.length === 0) return;
  console.log(`[outbox.producer] claimed ${rows.length} messages`);
  

  for (const row of rows) {
    const exchange   = row.exchange || AMQP_EXCHANGE;
    const routingKey = row.routing_key;
    const bodyString = typeof row.payload === 'string' ? row.payload : JSON.stringify(row.payload ?? {});
    const bodyBuffer = Buffer.from(bodyString);
    const properties   = (row.properties);


    const client = await pool.connect();
    try {
      await client.query("begin");

      try {
        await ch.publish( exchange, routingKey, bodyBuffer, properties);
        await markProcessed(client, row.id);
      } catch (err) {
        // await markFailed(client, row.id, err);
        console.log(
          "[outbox.worker] publish failed for outbox id",
          row.id,
          err
        );
        throw err;
      } finally {
        await client.query("commit");
      }
    } catch (e) {
      // If commit fails—we'll retry next interval because row is still unprocessed or has error noted.
      console.error("[outbox.worker] tx failed for outbox id", row.id, e);
    } finally {
      client.release();
    }
  }
}

export async function startOutboxProducer() {
  console.log("[outbox.producer] started");
  try {
    await publishOnce(); // first tick
  } catch (e) {
    console.error("[outbox.producer] first run failed:", e);
  }
  setInterval(async () => {
    try {
      await publishOnce();
    } catch (e) {
      console.error("[outbox.producer] interval run failed:", e);
    }
  }, PUBLISH_INTERVAL_MS);
}
