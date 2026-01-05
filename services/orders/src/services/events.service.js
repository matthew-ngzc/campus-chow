import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);
import { toDTO, updateOrderStatusOrThrow } from "./orders.service.js";
import { ORDER_STATUSES, ROUTING_KEYS } from "../api/constants/enums.constants.js";
import { schemaByTopic } from "../workers/schemas.js";
import { enqueue } from "../api/repositories/outbox.repo.js";
import { withTransaction } from '../db/client.js';
import { buildProperties } from '../workers/outbox.producer.js';
import { getFullOrderById } from '../api/repositories/orders.repo.js';

const EXCHANGE = process.env.AMQP_EXCHANGE_ORDERS || "smunch.events";

/** Payment reminder → produce email reminder events for the listed orders */
export async function handlePaymentReminder({   
  // messageId,
  // routingKey,
  payload,
  properties, }) {

  const sourceService = properties?.headers?.sourceService || "unknown";
  if (sourceService !== "payment" && sourceService !== "admin") {
    throw Object.assign(new Error("UNAUTHORIZED_SOURCE. Sender must be payment service"), { details: error.details });
  }
  // check schema
  const { value, error } = schemaByTopic["payment.reminder"].validate(payload, { abortEarly:false, stripUnknown:true });
  if (error) throw Object.assign(new Error('INVALID_PAYLOAD'), { details: error.details });

    // 2) Process each orderId, collecting outcomes
  const results = {
    queued: [],            // successfully enqueued
    notFound: [],          // order didn’t exist
    skippedStatus: [],     // not in awaiting_payment
    failed: []             // unexpected error while loading/enqueuing
  };
  // send msg
  for (const id of value.orderIds) {
    try {
      // (Optional) check order state first; skip if not awaiting_payment
      const full = await getFullOrderById(id);
      // only send reminder for orders still awaiting payment
      if (!full) { 
        results.notFound.push(id); 
        continue; 
      }
      if (full.order_status !== ORDER_STATUSES.AWAITING_PAYMENT) {
        results.skippedStatus.push({ id, status: full.order_status });
        continue;
      }
      const order = toDTO(full);
      withTransaction(async (tx) => {
        await enqueue(tx,{
          routingKey: ROUTING_KEYS.EMAIL_REMINDER,
          exchange: EXCHANGE,
          payload: { order },
          properties: buildProperties(),
        });
        results.queued.push(id);
      });
    } catch (err) {
      results.failed.push({ id, message: err.message });
      console.warn(`[events.service] failed to enqueue payment reminder for order ${id}:`, err);
    }
  }
  return { status: 'queued', ...results };
}

/** --- ANY ORDER STATUS UPDATE request
 */
export async function handleOrderStatusUpdate({ 
  //routingKey, 
  payload, 
  properties }) {
  const sourceService = properties?.headers?.sourceService || "unknown";
  const sentAt = properties?.headers?.sentAt || dayjs().tz('Asia/Singapore').format('YYYY-MM-DDTHH:mm:ssZ');

  // validate schema
  const { value, error } = schemaByTopic['order.status'].validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) { const e = Object.assign(new Error('INVALID_PAYLOAD'), { details: error.details }); throw e; }
  
  // check authorisation
  const allowedBySource = {
    runner: new Set([ORDER_STATUSES.DELIVERING, ORDER_STATUSES.DELIVERED]),
    merchant: new Set([ORDER_STATUSES.PREPARING, ORDER_STATUSES.READY_FOR_COLLECTION]),
    payment: new Set([ORDER_STATUSES.PAYMENT_VERIFIED, ORDER_STATUSES.CANCELLED]),
  };
  const toStatus = payload.newStatus;
  if (!allowedBySource[sourceService]?.has(toStatus)) {
    const e = new Error('FORBIDDEN_STATUS_BY_SOURCE');
    e.code = 'FORBIDDEN_STATUS_BY_SOURCE';
    e.status = 403;                    // if useful to your HTTP layer
    e.details = { sourceService, attempted: toStatus };
    throw e;
  }

  // do update
  return withTransaction(async (tx) => {
    const extras = (toStatus === ORDER_STATUSES.DELIVERED)
      ? { delivery_completion_time: sentAt }
      : undefined;

    const updated = await updateOrderStatusOrThrow(value.orderId, toStatus, extras);
    if (!updated) { const e = new Error(updated.reason || 'update_failed'); e.status = 400; throw e; }

    // You may want to fan-out a generic order.status event for websocket/runners too:
    const full = await getFullOrderById(value.orderId);
    const order = toDTO(full);
    await enqueue(tx, {
      routingKey: `${ROUTING_KEYS.ORDER_STATUS}.${toStatus}`,
      exchange: EXCHANGE,
      payload: { order },
      properties: buildProperties(),
    });

    return { status: 'applied', orderId: value.orderId, newStatus: toStatus };
  });
}
