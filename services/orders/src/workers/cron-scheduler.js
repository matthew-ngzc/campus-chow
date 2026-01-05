import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

import { runAutoCancel, runPaymentReminder } from "../services/cron.service.js";
import { DELIVERY_TIMINGS } from "../api/constants/enums.constants.js";

const REMINDER_MINUTES_BEFORE = Number(process.env.PAYMENT_REMINDER_MINUTES_BEFORE || 90);
const PAYMENT_DEADLINE_MINUTES_BEFORE = Number(process.env.PAYMENT_DEADLINE_MINUTES_BEFORE || 60);

/**
 * Compute cron string for N minutes before a delivery slot.
 * node-cron format: "m h * * *"
 */
function cronExprBefore({ hour, minute }, offsetMinutes) {
  let total = hour * 60 + minute - offsetMinutes;
  if (total < 0) total += 24 * 60; // wrap midnight
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${m} ${h} * * *`;
}

/**
 * Start cron schedules for each delivery slot (e.g. 08:15, 12:00, 15:30, 19:00)
 * send reminder email 90 minutes before, auto cancels 60 minutes before
 */
export function startCronScheduler() {
  // existing reminders
  for (const [slot, info] of Object.entries(DELIVERY_TIMINGS)) {
    const exprRem = cronExprBefore(info, REMINDER_MINUTES_BEFORE);
    const exprCancel = cronExprBefore(info, PAYMENT_DEADLINE_MINUTES_BEFORE);

    // Reminder job
    cron.schedule(exprRem, async () => {
      const today = dayjs().tz("Asia/Singapore").format("YYYY-MM-DD");
      console.log(`[CRON] Running payment reminder for ${slot}`);
      await runPaymentReminder(slot, today);
    }, { timezone: "Asia/Singapore" });

    // Auto-cancel job
    cron.schedule(exprCancel, async () => {
      const today = dayjs().tz("Asia/Singapore").format("YYYY-MM-DD");
      console.log(`[CRON] Running auto-cancel for ${slot}`);
      await runAutoCancel(slot, today);
    }, { timezone: "Asia/Singapore" });

    console.log(`[CRON] Scheduled auto-cancel ${PAYMENT_DEADLINE_MINUTES_BEFORE}-minute-before ${slot}`);
  }

  console.log("[CRON] All reminder + auto-cancel jobs scheduled successfully");
}