import { NOW } from "sequelize";
import { pool, query } from "../../db/client.js";
import { ORDER_STATUSES } from "../constants/enums.constants.js";

/**
 * Creates a new order row and its line-items in a single DB transaction.
 *
 * Snapshots are provided by the service layer (merchant/menu/user snapshots are already computed).
 * This function is strictly data-access: it does not compute pricing or perform auth checks.
 *
 * @param {Object} params
 * @param {number} params.customerId                       - id of the ordering user
 * @param {string} params.deliveryTime                   - RFC3339 timestamptz (e.g. "2025-01-03T12:00:00+08:00")
 * @param {string} params.paymentDeadlineTime            - RFC3339 timestamptz; typically deliveryAt - 40 minutes
 * @param {string} params.building                     - Canonical building name (e.g. "SCIS1")
 * @param {string} params.roomType                     - Display text (e.g. "Seminar Room")
 * @param {string} params.roomNumber                   - Display text (e.g. "3-2")
 * @param {number} params.merchantId                   - id of merchant
 * @param {Object} params.amounts                      - { subtotalCents, deliveryFeeCents, totalCents }
 * @param {Array}  params.items                        - Array of item snapshots:
 *                                                      [{ menu_item_id, name, unit_price_cents, qty, options }]
 *
 * @returns {Promise<Object>}                          - The inserted order row
 * @throws  {Error}                                    - On constraint errors or SQL failure
 */
export async function createOrder(
  tx,
  {
    customerId,
    deliveryTime,
    paymentDeadlineTime,
    building,
    roomType,
    roomNumber,
    merchantId,
    amounts,
    items,
    customer_email
  }
) {
  console.log("inputs in repo:");
  console.log("customerId:", customerId);
  console.log("deliveryTime:", deliveryTime);
  console.log("paymentDeadlineTime:", paymentDeadlineTime);
  console.log("building:", building);
  console.log("roomType:", roomType);
  console.log("roomNumber:", roomNumber);
  console.log("merchantId:", merchantId);
  console.log("amounts:", amounts);
  console.log("items:", items);
  console.log("customerEmail", customer_email);

  const { rows } = await tx.query(
    `insert into orders (
      customer_id, delivery_time, payment_deadline_time,
      building, room_type, room_number,
      merchant_id,
      amount_subtotal_cents, amount_delivery_fee_cents, amount_total_cents,
      order_status, created_time, customer_email
    ) values (
      $1, $2, $3,
      $4, $5, $6,
      $7, 
      $8, $9, $10,
      $11, $12, $13
    ) returning *`,
    [
      customerId,
      deliveryTime,
      paymentDeadlineTime,
      building,
      roomType,
      roomNumber,
      merchantId,
      amounts.subtotalCents,
      amounts.deliveryFeeCents,
      amounts.totalCents,
      ORDER_STATUSES.AWAITING_PAYMENT,
      NOW,
      customer_email
    ]
  );
  let order = rows[0];

  // items snapshot
  for (const item of items) {
    await tx.query(
      `insert into order_items (order_id, menu_item_id, name, unit_price_cents, qty, options)
        values ($1, $2, $3, $4, $5, $6)`,
      [
        order.order_id,
        item.menu_item_id,
        item.name,
        item.unit_price_cents,
        item.qty,
        item.options || {},
      ]
    );
  }

  order = await getFullOrderById(order.order_id, tx);
  return order;
}

/**
 * Retrieves a single order by ID, selecting specific fields if desired.
 *
 * Only columns listed in `ALLOWED_ORDER_COLUMNS` may be selected.
 * If no fields are provided, all allowed columns are returned.
 *
 * @param {string} orderId                  - UUID of the order
 * @param {string|string[]=} [fields='*']   - Optional list of fields to select.
 *                                            Example: ['order_id', 'user_id', 'order_status']
 * @returns {Promise<Object|null>}          - Order row or null if not found
 * @throws  {Error}                         - If fields contain disallowed columns or SQL fails
 */
export async function getOrderById(orderId, fields = "*") {
  // 1️⃣ Define allowed columns explicitly
  const ALLOWED_ORDER_COLUMNS = [
    "order_id",
    "customer_id",
    "merchant_id",
    "delivery_time",
    "payment_deadline_time",
    "building",
    "room_type",
    "room_number",
    "order_status",
    "amount_subtotal_cents",
    "amount_delivery_fee_cents",
    "amount_total_cents",
    "cancel_reason_code",
    "created_time",
    "updated_time",
    "delivery_completion_time",
    "idempotency_key",
    "customer_email"
  ];

  // 2️⃣ Normalize and validate the `fields` argument
  let selectCols;

  if (fields === "*" || !fields) {
    selectCols = ALLOWED_ORDER_COLUMNS.join(", ");
  } else {
    const requested = Array.isArray(fields)
      ? fields
      : fields.split(",").map((f) => f.trim());

    // Check for invalid or disallowed fields
    const invalid = requested.filter((f) => !ALLOWED_ORDER_COLUMNS.includes(f));
    if (invalid.length > 0) {
      const err = new Error(`Invalid field(s): ${invalid.join(", ")}`);
      err.status = 400;
      throw err;
    }

    selectCols = requested.join(", ");
  }

  // 3️⃣ Execute the query safely
  const sql = `SELECT ${selectCols} FROM orders WHERE order_id = $1`;
  const { rows } = await query(sql, [orderId]);
  return rows[0] || null;
}

/**
 * Retrieves an order and eagerly loads its items as a JSON array.
 *
 * Shape of `items`:
 * [
 *   { menuItemId, name, unitPriceCents, qty, options }
 * ]
 *
 * @param {string|number} orderId          - The ID of the order to retrieve.
 * @param {Object} [clientOrTx=pool]       - Optional transaction object (`tx`) or pg client/pool.
 * @returns {Promise<Object|null>}         - The full order row with `items`, or `null` if not found.
 * @throws {Error}                         - If the query fails or the database connection is unavailable.
 */
export async function getFullOrderById(orderId, clientOrTx = pool) {
  const executor = clientOrTx?.query
    ? clientOrTx
    : { query: (text, params) => clientOrTx.query(text, params) };
  const { rows } = await executor.query(
    `select
       o.*,
       jsonb_agg(jsonb_build_object(
         'menuItemId', i.menu_item_id,
         'name', i.name,
         'unitPriceCents', i.unit_price_cents,
         'qty', i.qty,
         'options', i.options
       ) order by i.id) as items
     from orders o
     left join order_items i on i.order_id = o.order_id
     where o.order_id = $1
     group by o.order_id`,
    [orderId]
  );
  return rows[0];
}

/**
 * Lists a user's orders with their associated line items.
 *
 * Supports filtering by order status (via include/exclude arrays), pagination using limit/offset.
 * Returns each order with an aggregated `items` array.
 *
 * Behavior:
 * - `includeStatuses`: only include orders matching these statuses.
 * - `excludeStatuses`: exclude orders matching these statuses.
 * - If both are omitted → all orders for the user are returned.
 *
 * @param {Object} params
 * @param {string} params.userId                 - UUID of the user
 * @param {string[]=} params.includeStatuses     - Whitelist of statuses to include (e.g., ['delivered', 'cancelled'])
 * @param {string[]=} params.excludeStatuses     - Blacklist of statuses to exclude
 * @param {number=} [params.limit=20]            - Maximum number of orders to return
 * @param {number=} [params.offset=0]            - Number of records to skip (for pagination)
 *
 * @returns {Promise<Array<Object>>}             - Array of order objects, each including an `items` array
 * @throws  {Error}                              - If SQL execution fails
 *
 * @example
 * const orders = await listOrdersWithItems({
 *   userId: 'uuid-user-123',
 *   includeStatuses: ['awaiting_payment', 'payment_verified'],
 *   limit: 10,
 *   offset: 0
 * });
 */
export async function listOrdersWithItems({
  userId,
  includeStatuses,
  excludeStatuses,
  limit,
  offset,
}) {
  const where = ["o.customer_id = $1"];
  const params = [userId];

  if (includeStatuses?.length) {
    console.log("include statuses:", includeStatuses);
    params.push(includeStatuses);
    where.push(`o.order_status = ANY($${params.length}::text[])`);
  }
  if (excludeStatuses?.length) {
    console.log("exclude statuses:", excludeStatuses);
    params.push(excludeStatuses);
    where.push(`NOT (o.order_status = ANY($${params.length}::text[]))`);
  }

  params.push(limit, offset);
  const sql = `
    with page as (
      select o.*
      from orders o
      where ${where.join(" AND ")}
      order by o.created_time desc
      limit $${params.length - 1}
      offset $${params.length}
    ),
    order_items_agg as (
      select 
        oi.order_id,
        json_agg(oi.*) as items
      from order_items oi
      where oi.order_id in (select order_id from page)
      group by oi.order_id
    )
    select 
      p.*,
      coalesce(oa.items, '[]') as items
    from page p
    left join order_items_agg oa on oa.order_id = p.order_id
    order by p.created_time desc;
  `;
  console.log("SQL in repo:", sql);
  console.log("Params in repo:", params);
  const { rows } = await query(sql, params);
  console.log("rows in repo:", rows);
  return rows;
}

/**
 * Count orders for a user with optional status filtering
 * @param {Object} params
 * @param {string} params.userId - UUID of the user
 * @param {string[]=} params.includeStatuses - Whitelist of statuses to include
 * @param {string[]=} params.excludeStatuses - Blacklist of statuses to exclude
 * @returns {Promise<number>} - Total count of matching orders
 * @throws {Error} - If SQL execution fails
 */
export async function countOrdersForUser({
  userId,
  includeStatuses,
  excludeStatuses,
}) {
  const where = ["customer_id = $1"];
  const params = [userId];

  if (includeStatuses?.length) {
    params.push(includeStatuses);
    where.push(`order_status = ANY($${params.length}::text[])`);
  }
  if (excludeStatuses?.length) {
    params.push(excludeStatuses);
    where.push(`NOT (order_status = ANY($${params.length}::text[]))`);
  }

  const sql = `
    SELECT COUNT(*) as total
    FROM orders 
    WHERE ${where.join(" AND ")}
  `;

  const { rows } = await query(sql, params);
  return parseInt(rows[0].total, 10);
}

/**
 * Small whitelist of extra columns that callers may set during a status update.
 * Map "API key" → "DB column".
 * Extend this as your schema grows (e.g., 'runnerId' → 'runner_id', 'deliveredAt' → 'delivered_at').
 */
const EXTRAS_WHITELIST = {
  cancel_reason_code: "cancel_reason_code",
  delivery_completion_time: "delivery_completion_time",
};

/**
 * Builds a safe, parameterized SET clause for optional extras using a whitelist.
 * 
 * @param {object} extras - key/value pairs to include in SQL
 * @param {number} [startIndex=1] - starting parameter index (e.g., 3 if $1 and $2 are used)
 * @returns {{ setSql: string, values: any[] }}
 */
function buildExtrasSet(extras = {}, startIndex = 1) {
  const sets = [];
  const vals = [];
  let i = 0;

  for (const [k, v] of Object.entries(extras)) {
    const col = EXTRAS_WHITELIST[k];
    if (!col) continue; // ignore unknown keys
    sets.push(`${col} = $${startIndex + i}`);
    vals.push(v);
    i++;
  }

  return { setSql: sets.length ? ", " + sets.join(", ") : "", values: vals };
}

/**
 * @typedef {Object} UpdateOrderStatusResult
 * @property {boolean} ok
 * @property {Object=} order
 * @property {string=} reason
 */

/**
 * Update an order's status in a single, idempotent operation.
 *
 * Behavior:
 *  - No allowed "from status" checks — transitions are unrestricted.
 *  - If already at `toStatus`, returns { ok: true, order } (idempotent no-op).
 *  - Optional extras (whitelisted) are updated atomically with the status.
 *
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.toStatus                 // one of ORDER_STATUSES
 * @param {Object=} params.extras                  // e.g. { cancellation_reason, delivery_completion_time }
 * @param {boolean=} params.skipOutboxOnIdempotent // kept for API compatibility; unused here
 * @returns {Promise<UpdateOrderStatusResult>}
 */
export async function updateOrderStatus(
  tx,
  { orderId, toStatus, extras = {}/*, skipOutboxOnIdempotent = true*/ }
) {
  //console.log(orderId);
  if (!orderId) {
    console.log("no order id");
    return { ok: false, reason: "orderId_required" };
  }
  console.log(toStatus);
  if (!toStatus || !Object.values(ORDER_STATUSES).includes(toStatus)) {
    console.log("[orders.repo.js] invalid to status");
    return { ok: false, reason: "invalid_to_status" };
  }
  try {
    // Placeholders: $1=toStatus, $2=orderId, extras start at $3
    const { setSql, values: extraVals } = buildExtrasSet(extras, 3);

    const { rows: updated } = await tx.query(
      `
      update orders
          set order_status = $1,
              updated_time   = now()
              ${setSql}
        where order_id = $2
        returning *;
      `,
      [toStatus, orderId, ...extraVals]
    );

    if (updated.length) {
      console.log("Updated order status:", updated[0]);
      const order = await getFullOrderById(orderId, tx);
      //console.log(updated[0]);
      return { ok: true, order };
    }

    // Not found or status unchanged due to some other constraint
    return { ok: false, reason: "not_found" };
  } catch (err) {
    console.error("[orders.repo.js] updateOrderStatus failed:", err);
    throw err;
  }
}

/**
 * Auto-cancels all orders that missed their payment deadline.
 * Intended to be called by a scheduled worker (e.g., every minute)
 *
 * @returns {Promise<Array<{order_id:string, user_id:string, delivery_at:string, payment_deadline_at:string}>>}
 * @throws  {Error}
 */
export async function cancelUnpaidOrders() {
  const { rows } = await query(
    `update orders
     set order_status = 'cancelled',
         cancel_reason_code = 'UNPAID',
         updated_time = now()
     where order_status = 'awaiting_payment'
       and now() >= payment_deadline_at
     returning order_id, user_id, delivery_at, payment_deadline_at`
  );
  return rows;
}

/**
 * Finds all unpaid orders with the exact delivery_time timestamp.
 *
 * @param {string} deliveryDateTime - Full timestamp string (ISO or RFC3339)
 * @returns {Promise<Array<{ order_id: number }>>}
 */
export async function findUnpaidOrdersForDeliveryTime(deliveryDateTime) {
  const sql = `
    SELECT order_id
    FROM orders
    WHERE order_status IN ($1, $2)
      AND delivery_time = $3
  `;

  const { rows } = await query(sql, [
    ORDER_STATUSES.AWAITING_PAYMENT,
    ORDER_STATUSES.AWAITING_VERIFICATION,
    deliveryDateTime,
  ]);

  return rows;
}
