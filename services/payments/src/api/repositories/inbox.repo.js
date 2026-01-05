import { query } from "../../db/client.js";

/**
 * Record an incoming message as "received".
 * Returns { inserted: boolean, row: { id, status } }
 * Idempotent by (message_id) unique index—if duplicate, inserted=false.
 */
export async function recordReceived({
  messageId,
  routingKey,
  properties,
  payload,
}) {
  const { rows } = await query(
    `insert into inbox (message_id, routing_key, properties, payload)
     values ($1, $2, $3::jsonb, $4::jsonb)
     on conflict (message_id) do nothing
     returning id, status`,
    [messageId, routingKey, JSON.stringify(properties), JSON.stringify(payload)]
  );
  if (rows.length) return { inserted: true, row: rows[0] };

  // It already exists → fetch current status (helpful for idempotent return)
  const { rows: existing } = await query(
    `select id, status from inbox where message_id = $1`,
    [messageId]
  );
  return { inserted: false, row: existing[0] || null };
}

/** Mark a message as processed . */
export async function markProcessed(messageId) {
  const { rowCount } = await query(
    `update inbox
        set status = 'processed',
            processed_at = now(),
            error_message = null
      where message_id = $1`,
    [messageId]
  );
  return rowCount > 0;
}

/** Mark failed with a bounded error string to avoid unbounded row growth. */
export async function markFailed(messageId, error) {
  const errMsg = (error?.message || String(error) || "unknown_error").slice(
    0,
    2000
  );
  const { rowCount } = await query(
    `update inbox
        set status = 'failed',
            processed_at = now(),
            error_message = $2
      where message_id = $1`,
    [messageId, errMsg]
  );
  return rowCount > 0;
}
