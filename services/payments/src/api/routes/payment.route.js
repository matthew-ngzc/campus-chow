import express from 'express';
import { 
  createPayment,
  getPaymentInstructions,
  getPaymentStatus,
  confirmPaymentManual,
  updatePaymentStatus,
  uploadPaymentScreenshot
 } from '../controllers/payment.controller.js';
//  import { authenticateToken } from '../middlewares/auth.middleware.js';
// import { requireRole } from '../middlewares/role.middleware.js';
import { createPaymentSchema, updatePaymentStatusSchema, uploadScreenshotSchema, validateBody } from '../middlewares/validation.middleware.js';

const router = express.Router();

// Create a new payment
// POST /api/payments
// Must be logged in as user / admin (cannot be merchant)
router.post('/', /*authenticateToken, requireRole('user', 'admin'),*/ validateBody(createPaymentSchema), createPayment);

// Get payment instructions (regenerate QR code, reference number, paynowNumber.)
// GET /api/payments/:orderId
// Must be logged in as the user with the corresponding order
//TODO: add role check and correct user check?
router.get('/:orderId', /*authenticateToken,*/ getPaymentInstructions);


// Update payment status of an order
// PUT /api/orders/:orderId/status
// Must be logged in as admin
router.patch('/:orderId/payment-status', /*authenticateToken, requireRole('user', 'admin'),*/ validateBody(updatePaymentStatusSchema), updatePaymentStatus);

// Refresh payment and order status for a specific order
// GET /api/orders/:orderId/refresh-status
// Must be logged in as user or admin (cannot be merchant)
// Only the owner of the order or an admin can access this
router.get('/:orderId/payment-status', /*authenticateToken, requireRole('user', 'admin'),*/ getPaymentStatus);

// Confirm payment and send message to orders to send receipt email
// POST /api/orders/:orderId/payment/confirm
 // TODO: Must be logged in as admin (keep for testing), default use cronjob / github actions
router.patch('/:orderId/confirm-manual', /*authenticateToken, requireRole('admin'),*/ confirmPaymentManual);

router.patch('/:orderId/screenshot', validateBody(uploadScreenshotSchema), uploadPaymentScreenshot);

export default router;