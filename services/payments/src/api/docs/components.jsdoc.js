/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment-related operations
 *
 * components:
 *   schemas:
 *     PaymentInstructionsResponse:
 *       type: object
 *       required: [qrCode, paymentReference, paynowNumber, amountCents]
 *       properties:
 *         qrCode:
 *           type: string
 *           description: Base64 data URL for a PNG QR code (data:image/png;base64,...)
 *           example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *         paymentReference:
 *           type: string
 *           example: "SMUNCH123ABC"
 *         paynowNumber:
 *           type: string
 *           example: "87612345"
 *         amountCents:
 *           type: integer
 *           minimum: 0
 *           example: 790
 *
 *     PaymentRow:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 12 }
 *         order_id: { type: integer, example: 1203 }
 *         payment_status: { type: string, example: "confirmed" }
 *         payment_reference: { type: string, example: "SMUNCH123ABC" }
 *         amount_cents: { type: integer, example: 790 }
 *         payment_deadline: { type: string, format: date-time }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Invalid status"
 */
export {};
