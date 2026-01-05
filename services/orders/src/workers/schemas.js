import Joi from 'joi';
import { ORDER_STATUSES } from '../api/constants/enums.constants.js';

// Very tolerant envelope (consumer-level). You can tighten later.
export const baseEnvelope = Joi.object({}).unknown(true);

export const paymentVerifiedSchema = Joi.object({
  orderId: Joi.number().integer().required(),
}).required();

export const paymentReminderSchema = Joi.object({
  orderIds: Joi.array().items(Joi.number().integer().required()).min(1).required()
}).required();

export const orderStatusSchema = Joi.object({
  orderId: Joi.number().integer().required(),
  newStatus: Joi.string().valid(
      ORDER_STATUSES.AWAITING_PAYMENT,
      ORDER_STATUSES.AWAITING_VERIFICATION,
      ORDER_STATUSES.PAYMENT_VERIFIED,
      ORDER_STATUSES.PREPARING,
      ORDER_STATUSES.DELIVERING,
      ORDER_STATUSES.DELIVERED,
      ORDER_STATUSES.READY_FOR_COLLECTION,
      ORDER_STATUSES.CANCELLED
    ).required(),
  delivery_completion_time: Joi.date().iso().optional(),
}).required();

// Map routing keys → schemas used by the processor
export const schemaByTopic = {
  'payment.verified': paymentVerifiedSchema,
  'payment.reminder': paymentReminderSchema,
  'order.status': orderStatusSchema,
};
