import { ROUTING_KEYS } from "../api/constants/enums.constants.js";
import { markFailed, markProcessed } from "../api/repositories/inbox.repo.js";
import { pool } from "../db/client.js";
import {
  handleAddTransaction,
  handleOcrRequest,
  handleOrderCancelled,
} from "../services/events.service.js";

const PROCESS_BATCH = Number(process.env.INBOX_PROCESS_BATCH || 50);
const PROCESS_INTERVAL_MS = Number(
  process.env.INBOX_PROCESS_INTERVAL_MS || 1000
);

async function claimInboxBatch(size = PROCESS_BATCH) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      `select id, message_id, routing_key, payload, properties
         from inbox
        where status = 'received'
        order by id
        limit $1
        for update skip locked`,
      [size]
    );
    await client.query("commit");
    return rows;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

// Route the message to the appropriate handler based on routing key
function routeAndHandle(row) {
  const { routing_key: routingKey, payload, properties, messageId } = row;

  console.log(`[inbox.processor] processing routing key: ${routingKey}`);

  // Normalize to string for ease
  const key = String(routingKey || "").toLowerCase();

  // TODO: change to inhouse instead of using n8n
  if (key === ROUTING_KEYS.ADD_TRANSACTION) {
    return handleAddTransaction({
      messageId,
      routingKey,
      payload,
      properties,
    });
  }

  // OCR (not in use)
  if (key === ROUTING_KEYS.OCR) {
    return handleOcrRequest({
      messageId,
      routingKey,
      payload,
      properties,
    });
  }

  if (key === ROUTING_KEYS.ORDER_CANCELLED){
    return handleOrderCancelled({
      messageId,
      routingKey,
      payload,
      properties,
    }); 
  }

  // Unknown → treat as processed (we recorded it for audit)
  const err = new Error(`Unknown routing key: ${routingKey}`);
  console.warn("[inbox.processor] ", err.message);
  err.status = 400;
  throw err;
}

export async function runInboxProcessorTick() {
  const batch = await claimInboxBatch();
  if (batch.length === 0) return;

  for (const row of batch) {
    try {
      await routeAndHandle(row);
      await markProcessed(row.message_id);
    } catch (err) {
      console.error(
        "[inbox.processor] handler failed for msg",
        row.message_id,
        err
      );
      await markFailed(row.message_id, err);
    }
  }
}

export async function startInboxProcessor() {
  console.log("[inbox.processor] started");
  // run immediately, then on interval
  await runInboxProcessorTick();
  setInterval(runInboxProcessorTick, PROCESS_INTERVAL_MS);
}
