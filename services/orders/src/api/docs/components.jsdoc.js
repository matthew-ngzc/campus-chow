/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order lifecycle endpoints
 *
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "invalid_payload"
 *         details:
 *           type: array
 *           items: { type: string }
 *
 *     OrderItem:
 *       type: object
 *       properties:
 *         order_item_id: { type: integer, example: 23 }
 *         order_id: { type: integer, example: 84 }
 *         menu_item_id: { type: integer, example: 2 }
 *         quantity: { type: integer, example: 2 }
 *         price_cents: { type: integer, example: 160 }
 *         notes: { type: string, nullable: true, example: "less spicy" }
 *         customisations:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *           example: { noodle: "yellow" }
 *         created_at: { type: string, format: date-time }
 *
 *     Order:
 *       type: object
 *       properties:
 *         order_id: { type: integer, example: 84 }
 *         customer_id: { type: integer, example: 1 }
 *         merchant_id: { type: integer, example: 5 }
 *         building: { type: string, example: "SCIS" }
 *         room_type: { type: string, example: "Seminar Room" }
 *         room_number: { type: string, example: "2-7" }
 *         delivery_time: { type: string, format: date-time }
 *         delivery_completion_time: { type: string, format: date-time }
 *         playment_deadline_time: { type: string, format: date-time }
 *         total_amount_cents: { type: integer, example: 520 }
 *         food_amount_cents: { type: integer, example: 420 }
 *         delivery_fee_cents: { type: integer, example: 100 }
 *         order_status: { type: string, example: "created" }
 *         created_time: { type: string, format: date-time }
 *         updated_time: { type: string, format: date-time }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/OrderItem' }
 */
export {};
