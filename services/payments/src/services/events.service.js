import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

import {
  PAYMENT_STATUSES,
  ROUTING_KEYS,
} from "../api/constants/enums.constants.js";
import { schemaByTopic } from "../workers/schemas.js";
import { updatePaymentStatusSvc, uploadPaymentScreenshotSvc } from "./payments.service.js";
import { addTransaction } from "./transactions.service.js";
import { getPaymentByOrderId } from "../api/repositories/payments.repo.js";

// const EXCHANGE = process.env.AMQP_EXCHANGE_ORDERS || "smunch.events";

/** Payment screenshot → Upload, then use OCR to extract info and check */
// TODO: Change to http req
export async function handleOcrRequest({
  // messageId,
  // routingKey,
  payload,
  properties,
}) {
  const sourceService = properties?.headers?.sourceService || "unknown";
  if (sourceService !== "n8n" && sourceService !== "admin") {
    throw Object.assign(
      new Error("UNAUTHORIZED_SOURCE. Sender must be n8n service"),
      { details: error.details }
    );
  }
  // check schema
  const { value, error } = schemaByTopic[ROUTING_KEYS.OCR].validate(payload, { abortEarly: false, stripUnknown: true });
  if (error)
    throw Object.assign(new Error("INVALID_PAYLOAD"), {
      details: error.details,
  });

  return await uploadPaymentScreenshotSvc({
    orderId: value.orderId,
    imgUrl: value.imgUrl,
    bank: value.bank,
  });
}

// TODO: Test
export async function handleAddTransaction({
  // messageId,
  // routingKey,
  payload,
  properties,
}) {
    const sourceService = properties?.headers?.sourceService || "unknown";
    if (sourceService !== "n8n" && sourceService !== "admin") {
      throw Object.assign(
        new Error("UNAUTHORIZED_SOURCE. Sender must be n8n service"),
        { details: error.details }
      );
    }
    // check schema
    const { /*value,*/ error } = schemaByTopic[ROUTING_KEYS.ADD_TRANSACTION].validate(payload, { abortEarly: false, stripUnknown: true });
    if (error)
      throw Object.assign(new Error("INVALID_PAYLOAD"), {
        details: error.details,
    });
    
    return await addTransaction({
      transactionRef: payload.transactionRef,
      amountCents : payload.amountCents,
      dateTime : payload.dateTime,
      sender : payload.sender,
      receiver : payload.receiver
    })
}

/**
 * Handle "order.status.cancelled" event.
 * - If payment_status = payment_verified → set pending_refund
 * - Else → set failed
 */
export async function handleOrderCancelled({
  // messageId,
  // routingKey,
  payload,
  properties,
}) {
  const sourceService = properties?.headers?.sourceService || "unknown";

  // Only accept from Orders service
  if (sourceService !== "order") {
    const e = new Error("UNAUTHORIZED_SOURCE. Sender must be orders service");
    e.status = 401;
    throw e;
  }

  const orderId = payload?.order?.order_id || payload?.orderId;
  if (!orderId) {
    const e = new Error("INVALID_PAYLOAD: missing orderId");
    e.status = 400;
    throw e;
  }

  const payment = await getPaymentByOrderId(orderId);
  if (!payment) {
    console.warn(`[handleOrderCancelled] No payment found for order ${orderId}`);
    return { ok: false, reason: "not_found" };
  }

  const currentStatus = payment.payment_status;
  let newStatus;

  if (currentStatus === PAYMENT_STATUSES.PAYMENT_VERIFIED) {
    newStatus = PAYMENT_STATUSES.PENDING_REFUND;
  } else {
    newStatus = PAYMENT_STATUSES.FAILED;
  }

  await updatePaymentStatusSvc( { orderId, newStatus });
  console.log(`[handleOrderCancelled] Updated order ${orderId}: ${currentStatus} → ${newStatus}`);
  return { ok: true, orderId, from: currentStatus, to: newStatus };
}

/** --- ANY ORDER STATUS UPDATE request
 */
// export async function handleOrderStatusUpdate({
//   routingKey,
//   payload,
//   properties,
// }) {
//   const sourceService = properties?.headers?.sourceService || "unknown";
//   const sentAt =
//     properties?.headers?.sentAt ||
//     dayjs().tz("Asia/Singapore").format("YYYY-MM-DDTHH:mm:ssZ");

//   // validate schema
//   const { value, error } = schemaByTopic["order.status"].validate(payload, {
//     abortEarly: false,
//     stripUnknown: true,
//   });
//   if (error) {
//     const e = Object.assign(new Error("INVALID_PAYLOAD"), {
//       details: error.details,
//     });
//     throw e;
//   }

//   // check authorisation
//   const allowedBySource = {
//     runner: new Set([ORDER_STATUSES.DELIVERING, ORDER_STATUSES.DELIVERED]),
//     merchant: new Set([
//       ORDER_STATUSES.PREPARING,
//       ORDER_STATUSES.READY_FOR_COLLECTION,
//     ]),
//     payment: new Set([
//       ORDER_STATUSES.PAYMENT_VERIFIED,
//       ORDER_STATUSES.CANCELLED,
//     ]),
//   };
//   const toStatus = payload.newStatus;
//   if (!allowedBySource[sourceService]?.has(toStatus)) {
//     const e = new Error("FORBIDDEN_STATUS_BY_SOURCE");
//     e.code = "FORBIDDEN_STATUS_BY_SOURCE";
//     e.status = 403; // if useful to your HTTP layer
//     e.details = { sourceService, attempted: toStatus };
//     throw e;
//   }

//   // do update
//   return withTransaction(async (tx) => {
//     const extras =
//       toStatus === ORDER_STATUSES.DELIVERED
//         ? { delivery_completion_time: sentAt }
//         : undefined;

//     const updated = await updateOrderStatusOrThrow(
//       value.orderId,
//       toStatus,
//       extras
//     );
//     if (!updated) {
//       const e = new Error(updated.reason || "update_failed");
//       e.status = 400;
//       throw e;
//     }

//     // You may want to fan-out a generic order.status event for websocket/runners too:
//     const full = await getFullOrderById(value.orderId);
//     const order = toDTO(full);
//     await enqueue(tx, {
//       routingKey: `${ROUTING_KEYS.ORDER_STATUS}.${toStatus}`,
//       exchange: EXCHANGE,
//       payload: { order },
//       properties: buildProperties(),
//     });

//     return { status: "applied", orderId: value.orderId, newStatus: toStatus };
//   });
// }
