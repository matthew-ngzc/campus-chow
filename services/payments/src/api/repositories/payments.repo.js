import { query } from "../../db/client.js";
import { PAYMENT_STATUSES } from "../constants/enums.constants.js";
import dayjs from "dayjs";

/**
 * Get an existing payment row by order_id.
 *
 * @param {number|string} orderId
 * @returns {Promise<object|null>}
 */
export async function getPaymentByOrderId(orderId) {
  const { rows } = await query(
    `select id, order_id, amount_cents, payment_status, payment_reference, payment_deadline,
            created_at, updated_at
       from payments
      where order_id = $1`,
    [orderId]
  );
  return rows[0] || null;
}

/**
 * Look for payment with corresponding transactionRef, returns order_id, amount_cents, payment_status
 *
 * @param {string} transactionRef
 * @returns {Promise<object|null>}
 */
export async function getPaymentByTransactionRef(transactionRef) {
  const { rows } = await query(
    `select order_id, amount_cents, payment_status
       from payments
      where transaction_ref = $1`,
    [transactionRef]
  );
  return rows[0] || null;
}

/**
 * Create a payment row for an order (one row per order).
 *
 * Behavior:
 * - Inserts a new payment record linked to the order.
 * - (order_id) must be unique in `payments`; duplicate insert will raise a constraint error.
 * - Timestamps are set to NOW() in SQL.
 *
 * @param {Object} tx                                   - Transaction client from withTransaction
 * @param {Object} p
 * @param {string|number} p.orderId
 * @param {number}        p.amountCents                 - Amount in cents (integer)
 * @param {string}        [p.paymentStatus='pending']   - 'pending' | 'confirmed' | 'failed' | ...
 * @param {string}        p.paymentReference            - e.g., 'SMUNCHABC123'
 * @param {string}        p.paymentDeadline             - ISO timestamp (e.g., deliveryAt - 40m)
 * @returns {Promise<Object>}                           - Inserted row (selected columns)
 *
 * @example
 * Inside a service
 * await withTransaction(async (tx) => {
 *   const row = await createPaymentRow(tx, {
 *     orderId: 1,
 *     amountCents: 460,
 *     paymentReference: 'SMUNCH-XYZ123',
 *     paymentDeadline: '2025-01-03T11:20:00+08:00',
 *   });
 * });
 */
export async function createPaymentRow(
  tx,
  {
    orderId,
    amountCents,
    paymentStatus = PAYMENT_STATUSES.PENDING,
    paymentReference,
    paymentDeadline,
  }
) {
  if (
    !orderId ||
    !Number.isInteger(amountCents) ||
    !paymentReference ||
    !paymentDeadline
  ) {
    const e = new Error(
      "Missing required fields: orderId, amountCents, paymentReference, paymentDeadline"
    );
    e.status = 400;
    throw e;
  }

  const { rows } = await tx.query(
    `insert into payments (
       order_id, amount_cents, payment_status, payment_reference, payment_deadline, created_at
     ) values ($1, $2, $3, $4, $5, now())
     returning *`,
    [orderId, amountCents, paymentStatus, paymentReference, paymentDeadline]
  );

  return rows[0];
}
/**
 * Partially update fields of a payment row identified by orderId.
 *
 * Behavior:
 * - Updates only the provided, whitelisted columns.
 * - Always bumps `updated_at = now()`.
 * - Transactional: runs with the provided `tx`.
 *
 * Allowed fields:
 *   - amountCents        → payments.amount_cents
 *   - paymentStatus      → payments.payment_status
 *   - paymentReference   → payments.payment_reference
 *   - paymentDeadline    → payments.payment_deadline
 *
 * @param {Object} tx
 * @param {Object} p
 * @param {string|number} p.orderId                     - Unique per order in `payments`
 * @param {Object}        p.fields                      - Subset of allowed fields to update
 * @param {number=}       p.fields.amountCents
 * @param {string=}       p.fields.paymentStatus
 * @param {string=}       p.fields.paymentReference
 * @param {string=}       p.fields.paymentDeadline
 * @returns {Promise<Object|null>}                      - Updated row, or null if not found
 *
 * @example
 * await withTransaction(async (tx) => {
 *   const row = await updatePaymentFields(tx, {
 *     orderId: 1,
 *     fields: { paymentReference: 'SMUNCH-NEWREF', paymentDeadline: '2025-01-03T11:30:00+08:00' }
 *   });
 * });
 */
export async function updatePaymentFields(tx, { orderId, fields = {} }) {
  // check that there is orderId provided
  if (!orderId) {
    const e = new Error("orderId is required to target a payment row");
    e.status = 400;
    throw e;
  }
  // check if there are fields to update
  if (!fields || Object.keys(fields).length === 0) {
    const e = new Error("No fields provided to update");
    e.status = 400;
    throw e;
  }

  // mapping variable name to field name
  const MAP = {
    amountCents: "amount_cents",
    paymentStatus: "payment_status",
    paymentReference: "payment_reference",
    paymentDeadline: "payment_deadline",
    transactionRef: "transaction_ref",
    transactionAmt: "transaction_amt",
    transactionDatetime: "transaction_datetime",
    screenshotUrl: "screenshot_url",
    matchingTransactionId: "matching_transaction_id"
  };

  // build the query based on input fields
  const sets = [];
  const vals = [];
  const invalidKeys = [];
  Object.entries(fields).forEach(([k, v]) => {
    const col = MAP[k];
    // keep track of the wrong column names
    if (!col) {
      invalidKeys.push(k);
      return;
    }
    // add correct column names to query
    sets.push(`${col} = $${vals.length + 1}`);
    vals.push(v);
  });

  // return error message if there are invalid keys
  if (invalidKeys.length > 0) {
    const e = new Error(
      `Invalid field(s): ${invalidKeys.join(
        ", "
      )}. Allowed fields: ${Object.keys(MAP).join(", ")}`
    );
    e.status = 400;
    throw e;
  }

  // Add updated_at
  sets.push(`updated_at = now()`);

  const { rows } = await tx.query(
    `update payments
        set ${sets.join(", ")}
      where ${"order_id = $" + (vals.length + 1)}
      returning *`,
    [...vals, orderId]
  );

  return rows[0] ?? null;
}

/**
 * Returns the subset of given orderIds whose status matches `targetStatus`
 *
 * @param {Array<string|number>} orderIds
 * @param {string} [targetStatus]
 * @returns {Promise<string[]>} orderIds (as strings) that match the status
 */
export async function filterOrderIdsByStatus(orderIds, targetStatus) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) return [];

  // Pass as array; Postgres will cast numeric strings to bigint just fine.
  const { rows } = await query(
    `select order_id
       from orders
      where order_id = any($1::bigint[])
        and order_status = $2`,
    [orderIds, targetStatus]
  );

  // Return as strings to avoid JS MAX_SAFE_INTEGER precision issues
  return rows.map((r) => String(r.order_id));
}

/**
 * Returns the list of orderIds whose status matches `targetStatus`
 *
 * @param {string} [paymentStatus]
 * @returns {Promise<string[]>} orderIds (as strings) that match the status
 */
export async function getPaymentsByStatus(paymentStatus) {
  // check that payment status is valid
  if (
    !paymentStatus ||
    !Object.values(PAYMENT_STATUSES).includes(paymentStatus)
  ) {
    const e = new Error("Invalid or missing paymentStatus");
    e.status = 400;
    throw e;
  }
  // Pass as array; Postgres will cast numeric strings to bigint just fine.
  const { rows } = await query(
    `select order_id
      from payments
      where payment_status = $1`,
    [paymentStatus]
  );

  // Return as strings to avoid JS MAX_SAFE_INTEGER precision issues
  return rows.map((r) => String(r.order_id));
}


/**
 * Returns all payment rows with a given payment_status.
 *
 * @param {string} paymentStatus
 * @returns {Promise<object[]>} - Full payment rows (for admin dashboard)
 */
export async function getFullPaymentsByStatus(paymentStatus) {
  if (
    !paymentStatus ||
    !Object.values(PAYMENT_STATUSES).includes(paymentStatus)
  ) {
    const e = new Error("Invalid or missing paymentStatus");
    e.status = 400;
    throw e;
  }

  const { rows } = await query(
    `SELECT id, order_id, amount_cents, payment_status, payment_reference,
            payment_deadline, transaction_ref, screenshot_url,
            created_at, updated_at
       FROM payments
      WHERE payment_status = $1
      ORDER BY updated_at DESC, created_at DESC`,
    [paymentStatus]
  );

  return rows;
}

/**
 * Finds candidate payments close in ss_datetime and amount (±1 minute),
 * restricted to pending payments only.
 *
 * Used for matching when a transaction arrives.
 */
export async function findCandidatePayments({ amountCents, dateTime }) {
  const minTime = dayjs(dateTime).subtract(1, "minute").toISOString();
  const maxTime = dayjs(dateTime).add(1, "minute").toISOString();

  const { rows } = await query(
    `
      SELECT *
      FROM payments
      WHERE transaction_datetime BETWEEN $1 AND $2
        AND transaction_amt = $3
        AND payment_status = $4
      ORDER BY transaction_datetime DESC
      LIMIT 10
    `,
    [minTime, maxTime, amountCents, PAYMENT_STATUSES.PENDING]
  );

  return rows;
}