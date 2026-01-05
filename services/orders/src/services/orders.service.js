import dayjs from "dayjs";
import {
  createOrder,
  updateOrderStatus,
  listOrdersWithItems,
  countOrdersForUser,
} from "../api/repositories/orders.repo.js";
import * as outboxRepo from "../api/repositories/outbox.repo.js";
import { computePricingFromOrderItems } from "./price.js";
import {
  ORDER_STATUSES,
  ROUTING_KEYS,
} from "../api/constants/enums.constants.js";
import { withTransaction } from "../db/client.js";
import { createPayment } from "./payments.client.js";
import { buildProperties } from "../workers/outbox.producer.js";

const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE_ORDERS || "smunch.events";

// Keep env knobs the same behaviorally
const DEFAULT_DEADLINE_MINUTES_BEFORE = Number(
  process.env.PAYMENT_DEADLINE_MIN_BEFORE || 40
);

// ---- helpers (internal) ----
function computeDeadlineTime(deliveryTimeIso) {
  const d = dayjs(deliveryTimeIso);
  if (!d.isValid()) throw new Error("Invalid delivery_time");
  return d.subtract(DEFAULT_DEADLINE_MINUTES_BEFORE, "minute").toISOString();
}

export function toDTO(row) {
  if (!row) return null;
  return {
    order_id: row.order_id,
    customer_id: row.user_id,
    customer_email: row.customer_email,
    order_status: row.order_status,
    delivery_time: row.delivery_time,
    payment_deadline_time: row.payment_deadline_time,
    building: row.building,
    room_type: row.room_type,
    room_number: row.room_number,
    merchant_id: row.merchant_id,
    amounts: {
      food_amount_cents: row.amount_subtotal_cents,
      delivery_fee_cents: row.amount_delivery_fee_cents,
      total_amount_cents: row.amount_total_cents,
    },
    items: row.items || [],
    created_time: row.created_time,
    updated_time: row.updated_time,
  };
}

/**
 * createOrderOrThrow (compat)
 * - Same responsibility as monolith: validate, price, persist, return full order.
 * - Throws on validation/DB failures.
 */
export async function createOrderOrThrow({ body, customer_email/*, idempotencyKey*/ }) {
  const {
    customer_id,
    delivery_time,
    building,
    room_type,
    room_number,
    order_items,
    merchant_id,
  } = body;
  if (!delivery_time) {
    const e = new Error("delivery_time is required");
    e.status = 400;
    throw e;
  }
  if (!building || !room_type || !room_number) {
    console.log(`${building}, ${room_type}, ${room_number}`);
    const e = new Error("destination is incomplete");
    e.status = 400;
    throw e;
  }
  if (!Array.isArray(order_items) || order_items.length === 0) {
    const e = new Error("order_items/items must contain at least one item");
    e.status = 400;
    throw e;
  }

  const { amounts, itemSnapshots } = await computePricingFromOrderItems({
    merchantId: merchant_id,
    orderItems: order_items,
  });
  const payment_deadline_time = computeDeadlineTime(delivery_time);
  const { created, qrCode, paymentReference, paynowNumber } =
    await withTransaction(async (tx) => {
      const created = await createOrder(tx, {
        customerId: customer_id,
        deliveryTime: delivery_time,
        paymentDeadlineTime: payment_deadline_time,
        building,
        roomType: room_type,
        roomNumber: room_number,
        merchantId: merchant_id,
        amounts,
        items: itemSnapshots,
        customer_email
      });
      console.log("created order:", created);
      //add message to outbox
      const order = toDTO(created);
      await outboxRepo.enqueue(tx, {
        routingKey: ROUTING_KEYS.ORDER_CREATED,
        payload: { order },
        properties: buildProperties(),
        exchange: AMQP_EXCHANGE,
      });
      const { qrCode, paymentReference, paynowNumber } = await createPayment(
        created.order_id,
        amounts.totalCents,
        payment_deadline_time
      );
      console.log("payment created inside transaction:", {
        qrCode,
        paymentReference,
        paynowNumber,
      });
      return { created, qrCode, paymentReference, paynowNumber };
    });
  console.log("payment created:", { qrCode, paymentReference, paynowNumber });
  // let newOrder = await getFullOrderById(created.order_id);
  // console.log("newOrder in service:", newOrder);
  // outbox: order.created
  return { newOrder: created, qrCode, paymentReference, paynowNumber };
}

/*
extras for delivery completion time and cancellation reason
*/
export async function updateOrderStatusOrThrow(
  orderId,
  newStatus,
  extras = {}
) {
  console.log(
    `Updating order ${orderId} to status ${newStatus} with extras:`,
    extras
  );
  const order = await withTransaction(async (tx) => {
    const updated = await updateOrderStatus(tx, {
      orderId,
      toStatus: newStatus,
      extras,
    });
    if (!updated.ok) {
      if (updated.reason === "orderId_required") {
        const e = new Error("orderId is required");
        e.status = 400;
        throw e;
      }
      if (updated.reason === "invalid_to_status") {
        const e = new Error(
          `invalid status. Must be one of ${Object.values(ORDER_STATUSES).join(
            ", "
          )}`
        );
        e.status = 400;
        throw e;
      }
      if (updated.reason === "not_found") {
        const e = new Error(`Order ${orderId} not found`);
        e.status = 404;
        throw e;
      }
    }
    const order = toDTO(updated.order);
    // send message
    await outboxRepo.enqueue(tx, {
      routingKey: `${ROUTING_KEYS.ORDER_STATUS}.${newStatus}`,
      payload: { order },
      properties: buildProperties(),
      exchange: AMQP_EXCHANGE,
    });
    return order;
  });

  //console.log("inside service:", updated);
  return order;
}

export async function getFullOrdersByCustomerIdAndStatusOrThrow({
  userId,
  type,
  limit,
  offset,
}) {
  let includeStatuses, excludeStatuses;
  // convert limit and offset into the correct types to put into method, and make sure they are reasonable (within 50)
  const safeLimit = Math.min(Number(limit) || 10, 50);
  const safeOffset = Number(offset) || 0;

  if (type === "active") {
    excludeStatuses = [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED];
  } else if (type === "history") {
    includeStatuses = [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED];
  } else if (type !== undefined) {
    throw Object.assign(new Error(`Invalid type: '${type}'. Allowed values: active, history`), {
      status: 400,
      code: "INVALID_QUERY_PARAM",
    });
  }

  console.log("service - includeStatuses:", includeStatuses);
  console.log("service - excludeStatuses:", excludeStatuses);
  const orders = await listOrdersWithItems({
    userId,
    includeStatuses,
    excludeStatuses,
    safeLimit,
    safeOffset,
  });
  console.log("orders in service:", orders);
  return orders;
}

export async function countUserOrdersByType({ userId, type }) {
  let includeStatuses, excludeStatuses;

  if (type === "active") {
    excludeStatuses = [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED];
  } else if (type === "history") {
    includeStatuses = [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED];
  } else if (type !== undefined) {
    throw Object.assign(new Error(`Invalid type: '${type}'. Allowed values: active, history`), {
      status: 400,
      code: "INVALID_QUERY_PARAM",
    });
  }

  return countOrdersForUser({
    userId,
    includeStatuses,
    excludeStatuses,
  });
}
