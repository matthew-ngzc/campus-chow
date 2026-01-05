import express from "express";
import {
  addTransactionInternal,
  listPendingPayments,
  listPendingRefunds,
  markOrdersRefunded,
  markPaymentsVerified,
} from "../controllers/internal.controller.js";

import { validateBody, bulkUpdateSchema, addTransactionSchema } from "../middlewares/validation.middleware.js"; 
// import { authenticateToken } from "../../middlewares/auth.middleware.js";
// import { requireRole } from "../../middlewares/role.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/payments/internal/pending:
 *   get:
 *     summary: Get all pending payments
 *     tags: [Admin Payments]
 *     description: |
 *       Retrieves all payment records currently marked as **pending**.  
 *       Used by the admin dashboard to verify which orders have not yet been paid.
 *     responses:
 *       200:
 *         description: List of pending payment rows
 *         content:
 *           application/json:
 *             example:
 *               count: 2
 *               payments:
 *                 - id: 101
 *                   order_id: 4501
 *                   amount_cents: 460
 *                   payment_status: "pending"
 *                   payment_reference: "SMUNCH4501"
 *                   payment_deadline: "2025-01-03T11:20:00+08:00"
 *                   transaction_ref: null
 *                   screenshot_url: null
 *                   created_at: "2025-01-01T09:00:00+08:00"
 *                   updated_at: "2025-01-01T09:10:00+08:00"
 *                 - id: 102
 *                   order_id: 4502
 *                   amount_cents: 760
 *                   payment_status: "pending"
 *                   payment_reference: "SMUNCH4502"
 *                   payment_deadline: "2025-01-03T11:20:00+08:00"
 *                   transaction_ref: "17610202866139367481"
 *                   screenshot_url: "https://cdn.smunch.sg/uploads/payments/4502.png"
 *                   created_at: "2025-01-01T09:30:00+08:00"
 *                   updated_at: "2025-01-01T09:40:00+08:00"
 */
router.get("/pending", /*authenticateToken, requireRole('admin'),*/ listPendingPayments);

/**
 * @swagger
 * /api/payments/internal/pending-refunds:
 *   get:
 *     summary: Get all payments pending refund
 *     tags: [Admin Payments]
 *     description: |
 *       Retrieves all payment records currently marked as **pending_refund**.  
 *       Admins use this list to process refunds manually or via automated reconciliation.
 *     responses:
 *       200:
 *         description: List of payments awaiting refund processing
 *         content:
 *           application/json:
 *             example:
 *               count: 1
 *               payments:
 *                 - id: 118
 *                   order_id: 5012
 *                   amount_cents: 890
 *                   payment_status: "pending_refund"
 *                   payment_reference: "SMUNCH5012"
 *                   payment_deadline: "2025-01-04T11:20:00+08:00"
 *                   transaction_ref: "ABC123XYZ456"
 *                   screenshot_url: "https://cdn.smunch.sg/uploads/payments/5012.png"
 *                   created_at: "2025-01-02T09:10:00+08:00"
 *                   updated_at: "2025-01-03T10:10:00+08:00"
 */
router.get("/pending-refunds", /*authenticateToken, requireRole('admin'),*/ listPendingRefunds);

/**
 * @swagger
 * /api/payments/internal/mark-refunded:
 *   post:
 *     summary: Mark selected orders as refunded
 *     tags: [Admin Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkUpdateSchema'
 */
router.post(
  "/mark-refunded",
  /*authenticateToken, requireRole('admin'),*/
  validateBody(bulkUpdateSchema),
  markOrdersRefunded
);

/**
 * @swagger
 * /api/payments/internal/mark-verified:
 *   post:
 *     summary: Mark selected orders as payment verified
 *     tags: [Admin Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkUpdateSchema'
 */
router.post(
  "/mark-verified",
  /*authenticateToken, requireRole('admin'),*/
  validateBody(bulkUpdateSchema),
  markPaymentsVerified
);

/**
 * @swagger
 * /api/payments/internal/transaction:
 *   post:
 *     summary: Add a new transaction manually
 *     tags: [Admin Payments]
 *     description: |
 *       Internal-only endpoint to add a transaction record.  
 *       Used by admins or automation (e.g., n8n) to log payments.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/addTransactionSchema'
 *     responses:
 *       201:
 *         description: Transaction successfully added
 *       400:
 *         description: Invalid payload
 *       500:
 *         description: Internal server error
 */
router.post(
  "/transaction",
  /*authenticateToken, requireRole('admin'),*/
  validateBody(addTransactionSchema),
  addTransactionInternal
);

export default router;
