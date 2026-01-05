import express from "express";
import { runAutoCancel, runPaymentReminder } from "../../services/cron.service.js";

const router = express.Router();

/**
 * @swagger
 * /internal/cron/run-reminder:
 *   post:
 *     summary: Manually trigger the payment reminder cron for a specific delivery slot and date
 *     description: Simulates a scheduled cron run (e.g., slot 12:00 on 2025-06-05) for testing purposes.
 *     tags: [Internal]
 *     parameters:
 *       - in: query
 *         name: slot
 *         required: true
 *         schema:
 *           type: string
 *         example: "12:00"
 *         description: Delivery slot time (e.g. 12:00 or 8:15)
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2025-06-05"
 *         description: Optional delivery date (defaults to today in Singapore time)
 *     responses:
 *       200:
 *         description: Reminder successfully triggered
 *       400:
 *         description: Invalid or missing slot
 *       500:
 *         description: Internal server error
 */
router.post("/cron/run-reminder", async (req, res, next) => {
  try {
    const { slot, date } = req.query;

    if (!slot) {
      return res.status(400).json({
        error: "Missing required query parameter: slot (e.g. '12:00' or '8:15')",
      });
    }

    // Normalize slot: handle "8:15" vs "08:15" or "815"
    const normalizedSlot = slot.includes(":")
      ? slot.padStart(5, "0") // ensures "8:15" → "08:15"
      : slot.replace(/(\d{1,2})(\d{2})/, (_, h, m) => `${h.padStart(2, "0")}:${m}`);

    console.log(
      `[API] Manually triggering reminder for slot ${normalizedSlot}${
        date ? ` on ${date}` : ""
      }`
    );

    const result = await runPaymentReminder(normalizedSlot, date);

    res.status(200).json({
      message: `Reminder simulation complete for slot ${normalizedSlot}${
        date ? ` on ${date}` : ""
      }`,
      result,
    });
  } catch (err) {
    console.error("[API] Manual cron trigger failed:", err);
    next(err);
  }
});


/**
 * @swagger
 * /internal/cron/run-auto-cancel:
 *   post:
 *     summary: Manually trigger the auto-cancel cron for a specific delivery slot and date
 *     description: |
 *       Simulates a scheduled auto-cancel cron run (e.g., slot 12:00 on 2025-06-05) for testing or debugging.
 *       Cancels all unpaid orders scheduled for that delivery slot if they have exceeded their payment deadline.
 *     tags: [Internal]
 *     parameters:
 *       - in: query
 *         name: slot
 *         required: true
 *         schema:
 *           type: string
 *         example: "12:00"
 *         description: Delivery slot time (e.g. 12:00 or 08:15)
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2025-06-05"
 *         description: Optional delivery date (defaults to today's date in Singapore time)
 *     responses:
 *       200:
 *         description: Auto-cancel sweep executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Auto-cancel complete for slot 12:00 on 2025-06-05"
 *                 cancelledCount:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Missing or invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/cron/run-auto-cancel", async (req, res, next) => {
  try {
    const { slot, date } = req.query;

    if (!slot) {
      return res.status(400).json({
        error: "Missing required query parameter: slot (e.g. '12:00' or '8:15')",
      });
    }

    // Normalize slot to "HH:mm"
    const normalizedSlot = slot.includes(":")
      ? slot.padStart(5, "0")
      : slot.replace(/(\d{1,2})(\d{2})/, (_, h, m) => `${h.padStart(2, "0")}:${m}`);

    console.log(
      `[API] Manually triggering auto-cancel for slot ${normalizedSlot}${
        date ? ` on ${date}` : ""
      }`
    );

    const result = await runAutoCancel(normalizedSlot, date);

    res.status(200).json({
      message: `Auto-cancel complete for slot ${normalizedSlot}${date ? ` on ${date}` : ""}`,
      result,
    });
  } catch (err) {
    console.error("[API] Manual auto-cancel trigger failed:", err);
    next(err);
  }
});


export default router;
