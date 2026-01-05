import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

import {
  findUnpaidOrdersForDeliveryTime,
  getFullOrderById,
} from "../api/repositories/orders.repo.js";
import { enqueue } from "../api/repositories/outbox.repo.js";
import { buildProperties } from "../workers/outbox.producer.js";
import { withTransaction } from "../db/client.js";
import { toDTO, updateOrderStatusOrThrow } from "./orders.service.js";
import { ORDER_STATUSES } from "../api/constants/enums.constants.js";

const EXCHANGE = process.env.AMQP_EXCHANGE_ORDERS || "smunch.events";

export async function runPaymentReminder(slot, dateInput) {
  const date = dateInput || dayjs().tz("Asia/Singapore").format("YYYY-MM-DD");

  // Combine date + slot into full timestamp in Singapore timezone
  const deliveryDateTime = dayjs
    .tz(`${date} ${slot}`, "Asia/Singapore")
    .toISOString();

  console.log(
    `[CRON] Checking unpaid orders for delivery_time = ${deliveryDateTime}`
  );

  const orders = await findUnpaidOrdersForDeliveryTime(deliveryDateTime);
  if (!orders.length) {
    console.log(`[CRON] No unpaid orders found for ${slot} on ${date}.`);
    return;
  }

  for (const o of orders) {
    try {
      const fullOrder = await getFullOrderById(o.order_id);
      if (!fullOrder) continue;

      const order = toDTO(fullOrder);

      await withTransaction(async (tx) => {
        await enqueue(tx, {
          routingKey: "email.command.send_payment_reminder",
          exchange: EXCHANGE,
          payload: { order },
          properties: buildProperties(),
        });
      });

      console.log(`[CRON] Enqueued reminder for order ${o.order_id}`);
    } catch (err) {
      console.error(
        `[CRON] Failed to enqueue reminder for order ${o.order_id}:`,
        err
      );
    }
  }

  console.log(
    `[CRON] Done — enqueued ${orders.length} reminder messages for slot ${slot} (${date})`
  );
}


/**
 * Auto-cancel unpaid orders for a given delivery slot and date.
 * Called N minutes before delivery slot (e.g., 60m).
 *
 * @param {string} slot - Delivery slot time (e.g. "12:00" or "08:15")
 * @param {string} [dateInput] - YYYY-MM-DD string (defaults to today)
 */
export async function runAutoCancel(slot, dateInput) {
  const date = dateInput || dayjs().tz("Asia/Singapore").format("YYYY-MM-DD");

  // Combine date + slot into full timestamp
  const deliveryDateTime = dayjs.tz(`${date} ${slot}`, "Asia/Singapore").toISOString();
  console.log(`[CRON] Running auto-cancel for slot ${slot} on ${date}`);

  // Step 1: find unpaid orders for this delivery time
  const orders = await findUnpaidOrdersForDeliveryTime(deliveryDateTime);
  if (!orders.length) {
    console.log(`[CRON] No unpaid orders found for ${slot} on ${date}.`);
    return;
  }

  let cancelledCount = 0;
  for (const o of orders) {
    try {
      // Ensure we reload full order data (optional)
      const full = await getFullOrderById(o.order_id);
      if (!full) continue;

      await updateOrderStatusOrThrow(full.order_id, ORDER_STATUSES.CANCELLED, {
        cancel_reason_code: "UNPAID",
      });

      cancelledCount++;
      console.log(`[CRON] Auto-cancelled order ${full.order_id}`);
    } catch (err) {
      console.error(`[CRON] Failed to auto-cancel order ${o.order_id}:`, err.message);
    }
  }

  console.log(`[CRON] Done — auto-cancelled ${cancelledCount} unpaid orders for ${slot} (${date})`);
}