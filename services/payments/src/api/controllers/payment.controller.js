
import { PAYMENT_STATUSES } from '../constants/enums.constants.js';
import { getPaymentByOrderId } from '../repositories/payments.repo.js';
import {
  formatCentsToDollars,
    generatePayNowQRCode
} from '../../services/payment.utils.js';
import { createPaymentInstructions, updatePaymentStatusSvc, uploadPaymentScreenshotSvc } from '../../services/payments.service.js';


/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create payment instructions for an order (persist payment row)
 *     description: |
 *       Creates a payment row (one per order) and returns a fresh PayNow QR,
 *       the payment reference, PayNow number, and the amount in cents.
 *       The QR image is session-scoped and not stored by default.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentRequest'
 *     responses:
 *       201:
 *         description: Instructions created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentInstructionsResponse'
 */
export async function createPayment(req, res, next) {
  try {
    const {orderId, amountCents: inputAmountCents, paymentDeadline} = req.validated;
    console.log(`orderId: ${orderId}`);
    console.log(`amountCents: ${inputAmountCents}`);
    console.log(`paymentDeadline: ${paymentDeadline}`);
    const {qrCode, paymentReference, paynowNumber, amountCents: outputAmountCents} = 
      await createPaymentInstructions({orderId, amountCents: inputAmountCents, paymentDeadline});

    return res.status(201).json({qrCode, paymentReference, paynowNumber, amountCents: outputAmountCents});
  }catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/payments/{orderId}:
 *   get:
 *     summary: Get (fresh) PayNow QR + payment info for an order
 *     description: |
 *       Returns a **fresh** PayNow QR PNG (Base64), payment reference, PayNow number,
 *       and amount (cents). The QR typically expires ~10 minutes from generation.
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payment info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentInstructionsResponse'
 *       404:
 *         description: Payment record not found for this order
 */
/**
 * GET /api/payments/:orderId
 *
 * Regenerates PayNow QR code, reference number, and PayNow phone.
 * Use when user revisits the payment screen.
 */
export async function getPaymentInstructions(req, res, next) {
  try {
    const { orderId } = req.params;
    const payment = await getPaymentByOrderId(orderId); // { amount_cents, payment_reference, ... }
    if (!payment) {
      return res.status(404).json({ error: `No payment for order ${orderId}`, code: 'NOT_FOUND_PAYMENT' });
    }

    const amountDollars = formatCentsToDollars(payment.amount_cents);
    const { qrCodeDataURL, paynowNumber } = await generatePayNowQRCode({
      amount: amountDollars,
      paymentReference: payment.payment_reference,
    });

    return res.status(200).json({
      qrCode: qrCodeDataURL,
      paymentReference: payment.payment_reference,
      paynowNumber,
      amountCents: payment.amount_cents,
    });
  } catch (err) {
    next(err);
  }
}
/**
 * @swagger
 * /api/payments/{orderId}/payment-status:
 *   patch:
 *     summary: Update payment status (idempotent)
 *     description: |
 *       Sets the payment_status of an order's payment row. Allowed values are defined by your enum.
 *       Idempotent: if already at the requested status, returns 200 with the current row.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentStatusRequest'
 *     responses:
 *       200:
 *         description: Payment status updated (or unchanged)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentRow'
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Payment row not found for this order
 */
export async function updatePaymentStatus(req, res, next) {
  try {
    const { orderId, newStatus } = req.body;
    console.log(req.body);
    console.log(newStatus);

    const result = await updatePaymentStatusSvc({ orderId, newStatus });

    if (!result.ok) {
      if (result.reason === 'invalid_status') {
        return res.status(400).json({ message: result.message || 'invalid_status' });
      }
      if (result.reason === 'not_found') {
        return res.status(404).json({ message: `No payment found for order ${orderId}` });
      }
      return res.status(400).json({ message: result.reason || 'update_failed' });
    }

    return res.status(200).json({ payment: result.payment });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/payments/{orderId}/payment-status:
 *   get:
 *     summary: Get payment status for an order
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Status returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId: { type: integer }
 *                 paymentStatus: { type: string }
 *       404:
 *         description: Not found
 */
export async function getPaymentStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const payment = await getPaymentByOrderId(orderId);
    if (!payment) return res.status(404).json({ message: `No payment found for order ${orderId}` });

    return res.status(200).json({
      orderId: payment.order_id,
      paymentStatus: payment.payment_status,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/payments/{orderId}/confirm-manual:
 *   patch:
 *     summary: Manually confirm payment and enqueue event. Essentially the update payment status endpoint but only for confirmed
 *     description: Confirms payment and emits `payment.confirmed` via outbox.
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Confirmed
 *       404:
 *         description: Not found
 */
export async function confirmPaymentManual(req, res, next) {
  try {
    const { orderId } = req.params;
    const result = await updatePaymentStatusSvc({ orderId, newStatus: PAYMENT_STATUSES.CONFIRMED });

    if (!result.ok) {
      if (result.reason === 'invalid_status') {
        return res.status(400).json({ message: result.message || 'invalid_status' });
      }
      if (result.reason === 'not_found') {
        return res.status(404).json({ message: `No payment found for order ${orderId}` });
      }
      return res.status(400).json({ message: result.reason || 'update_failed' });
    }

    return res.status(200).json({ payment: result.payment });
  } catch (err) {
    next(err);
  }
}

/**
 * @swagger
 * /api/payments/{orderId}/screenshot:
 *   patch:
 *     tags: [Payments]
 *     summary: Save screenshot URL and queue OCR job (async)
 *     description: Accepts an ImageKit URL and bank; immediately returns 202 while an OCR worker processes the image.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imgUrl, bank]
 *             properties:
 *               imgUrl: { type: string, format: uri }
 *               bank: { type: string, enum: [DBS, POSB, OCBC, UOB] }
 *     responses:
 *       202:
 *         description: Accepted; OCR job queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accepted: { type: boolean, example: true }
 *                 orderId: { type: integer, example: 123 }
 */
export async function uploadPaymentScreenshot(req, res, next) {
  const { orderId } = req.params;
  const { imgUrl, bank } = req.body;

  try {
    // 1) Persist URL + mark OCR pending (idempotent upsert-like update)
    await uploadPaymentScreenshotSvc({
      orderId: Number(orderId),
      imgUrl,
      bank,
    });

    // 3) Immediate response
    res.status(202).json({ accepted: true, orderId: Number(orderId) });
  } catch (err) {
    next(err);
  }
}