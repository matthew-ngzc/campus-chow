import express from 'express';
import {
  createOrder,
  updateOrderStatus,
  getOrderStatus,
  getUserOrders
} from '../controllers/order.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { createOrderSchema, listUserOrdersQuerySchema, updateOrderStatusSchema, validateBody, validateQuery } from '../middlewares/validation.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order and generate payment instructions
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateOrderRequest' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "order": {
 *                   "order_id": 5,
 *                   "customer_id": 1,
 *                   "merchant_id": 1,
 *                   "delivery_time": "2025-06-05T12:00:00.000Z",
 *                   "delivery_completion_time": null,
 *                   "payment_deadline_time": "2025-06-05T11:20:00.000Z",
 *                   "building": "sob",
 *                   "room_type": "Seminar Room",
 *                   "room_number": "2-7",
 *                   "amount_subtotal_cents": 2100,
 *                   "amount_delivery_fee_cents": 100,
 *                   "amount_total_cents": 2200,
 *                   "order_status": "awaiting_payment",
 *                   "cancel_reason_code": null,
 *                   "created_time": "2025-11-09T18:18:29.536Z",
 *                   "updated_time": null,
 *                   "items": [
 *                     {
 *                       "qty": 2,
 *                       "name": "Chicken Rice",
 *                       "options": { "noodle": "yellow" },
 *                       "menuItemId": 1,
 *                       "unitPriceCents": 550
 *                     },
 *                     {
 *                       "qty": 1,
 *                       "name": "Soup",
 *                       "options": {},
 *                       "menuItemId": 2,
 *                       "unitPriceCents": 1000
 *                     }
 *                   ]
 *                 },
 *                 "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWMAAAF3CAIAAAD/5707AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nO2dd3gc1dX/78xWaaVV770XS3IvcsNFNsYYY5skBEJzKAkB8pL8IAQCvCTwhpC8LwkEEgiQkNCrwRgXcDcuuMmSbKv3suptJW2f+f2x8mi0knZ2Ne2uOJ+Hh8eavXPv3Sln53zn3HMImqYRAACAW0i5JwAAgA8AlgIAAG7AUgAAwA1YCgAAuAFLAQAAN2ApAADgBiwFAADcgKUAAIAbsBQAAHADlgIAAG7AUgAAwA1YCgAAuAFLAQAAN2ApAADgRulV6yfiHhVtJq48…(truncated)…",
 *                 "paymentReference": "SMUNCH49",
 *                 "paynowNumber": "87896972"
 *               }
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/', authenticateToken, requireRole('USER', 'ADMIN'), validateBody(createOrderSchema), createOrder);

/**
 * @swagger
 * /api/orders/{orderId}/order-status:
 *   put:
 *     summary: Update the status of an existing order
 *     description: Updates the status of an order (e.g., from awaiting_payment to payment_verified).
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique ID of the order to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateOrderStatusRequest' }
 *     responses:
 *       200:
 *         description: Successfully updated the order status.
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "order": {
 *                   "order_id": 2,
 *                   "order_status": "payment_verified",
 *                   "delivery_time": "2025-06-05T12:00:00.000Z",
 *                   "payment_deadline_time": "2025-06-05T11:20:00.000Z",
 *                   "building": "sob",
 *                   "room_type": "Seminar Room",
 *                   "room_number": "2-7",
 *                   "merchant_id": 1,
 *                   "amounts": {
 *                     "food_amount_cents": 2100,
 *                     "delivery_fee_cents": 100,
 *                     "total_amount_cents": 2200
 *                   },
 *                   "items": [
 *                     {
 *                       "qty": 2,
 *                       "name": "Chicken Rice",
 *                       "options": { "noodle": "yellow" },
 *                       "menuItemId": 1,
 *                       "unitPriceCents": 550
 *                     },
 *                     {
 *                       "qty": 1,
 *                       "name": "Soup",
 *                       "options": {},
 *                       "menuItemId": 2,
 *                       "unitPriceCents": 1000
 *                     }
 *                   ],
 *                   "created_time": "2025-11-09T17:59:06.814Z",
 *                   "updated_time": "2025-11-09T18:35:43.108Z"
 *                 }
 *               }
 *       400:
 *         description: Bad Request – Invalid status or malformed payload.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.put('/:orderId/order-status', authenticateToken, requireRole('USER'), validateBody(updateOrderStatusSchema),updateOrderStatus);

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Retrieve a paginated list of a user's orders
 *     description: >
 *       Returns a paginated list of orders belonging to the specified user.  
 *       Use the `type` query parameter to filter between active, history, or all orders.  
 *       - `type=active`: Excludes orders with statuses `"delivered"` and `"cancelled"`.  
 *       - `type=history`: Includes only `"delivered"` and `"cancelled"` orders.  
 *       - (omitted type): Returns all orders regardless of status.
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user whose orders are being retrieved
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: type
 *         required: false
 *         description: Filter by order status type (`active`, `history`, or leave empty for all)
 *         schema:
 *           type: string
 *           enum: [active, history, ""]
 *           example: active
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of orders to return per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           example: 4
 *       - in: query
 *         name: offset
 *         required: false
 *         description: Offset for pagination (number of records to skip)
 *         schema:
 *           type: integer
 *           minimum: 0
 *           example: 0
 *     responses:
 *       200:
 *         description: Successfully retrieved list of user orders
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "total": 2,
 *                 "orders": [
 *                   {
 *                     "order_id": 1,
 *                     "customer_id": 1,
 *                     "merchant_id": 1,
 *                     "delivery_time": "2025-06-05T12:00:00.000Z",
 *                     "delivery_completion_time": null,
 *                     "payment_deadline_time": "2025-06-05T11:20:00.000Z",
 *                     "building": "sob",
 *                     "room_type": "Seminar Room",
 *                     "room_number": "2-7",
 *                     "amount_subtotal_cents": 2100,
 *                     "amount_delivery_fee_cents": 100,
 *                     "amount_total_cents": 2200,
 *                     "order_status": "payment_verified",
 *                     "cancel_reason_code": null,
 *                     "created_time": null,
 *                     "updated_time": "2025-11-09T18:29:43.584Z",
 *                     "items": [
 *                       {
 *                         "id": 1,
 *                         "order_id": 1,
 *                         "menu_item_id": 1,
 *                         "name": "Chicken Rice",
 *                         "unit_price_cents": 550,
 *                         "qty": 2,
 *                         "options": { "noodle": "yellow" }
 *                       },
 *                       {
 *                         "id": 2,
 *                         "order_id": 1,
 *                         "menu_item_id": 2,
 *                         "name": "Soup",
 *                         "unit_price_cents": 1000,
 *                         "qty": 1,
 *                         "options": {}
 *                       }
 *                     ]
 *                   },
 *                   {
 *                     "order_id": 2,
 *                     "customer_id": 1,
 *                     "merchant_id": 1,
 *                     "delivery_time": "2025-06-05T12:00:00.000Z",
 *                     "delivery_completion_time": null,
 *                     "payment_deadline_time": "2025-06-05T11:20:00.000Z",
 *                     "building": "sob",
 *                     "room_type": "Seminar Room",
 *                     "room_number": "2-7",
 *                     "amount_subtotal_cents": 2100,
 *                     "amount_delivery_fee_cents": 100,
 *                     "amount_total_cents": 2200,
 *                     "order_status": "payment_verified",
 *                     "cancel_reason_code": null,
 *                     "created_time": "2025-11-09T17:59:06.814Z",
 *                     "updated_time": "2025-11-09T18:35:43.108Z",
 *                     "items": [
 *                       {
 *                         "id": 3,
 *                         "order_id": 2,
 *                         "menu_item_id": 1,
 *                         "name": "Chicken Rice",
 *                         "unit_price_cents": 550,
 *                         "qty": 2,
 *                         "options": { "noodle": "yellow" }
 *                       },
 *                       {
 *                         "id": 4,
 *                         "order_id": 2,
 *                         "menu_item_id": 2,
 *                         "name": "Soup",
 *                         "unit_price_cents": 1000,
 *                         "qty": 1,
 *                         "options": {}
 *                       }
 *                     ]
 *                   }
 *                 ]
 *               }
 *       403:
 *         description: Forbidden – User not authorized to view these orders
 *         content:
 *           application/json:
 *             example: { "error": "You can only view your own orders" }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/user/:userId', authenticateToken, requireRole('USER', 'ADMIN'), validateQuery(listUserOrdersQuerySchema),getUserOrders);

/**
 * @swagger
 * /api/orders/{orderId}/order-status:
 *   get:
 *     summary: Retrieve the latest status of a specific order
 *     description: >
 *       Returns the current `order_status` of a given order.  
 *       Only the order owner (customer) or an admin may access this endpoint.
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: The unique ID of the order to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved the order status.
 *         content:
 *           application/json:
 *             example:
 *               {
 *                 "order_id": 2,
 *                 "order_status": "payment_verified"
 *               }
 *       403:
 *         description: Forbidden – The user is not authorized to view this order.
 *         content:
 *           application/json:
 *             example:
 *               { "error": "You can only view or edit your own orders." }
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             example:
 *               { "error": "Order not found" }
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:orderId/order-status', authenticateToken, requireRole('USER','ADMIN'), getOrderStatus);

// Confirm payment and send receipt
// POST /api/orders/:orderId/payment/confirm
// TODO: Must be logged in as admin (keep for testing), default use cronjob / github actions
//router.post('/:orderId/payment/confirm', confirmPaymentAndSendReceipt);

export default router;