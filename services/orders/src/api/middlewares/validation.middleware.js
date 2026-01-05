import Joi from "joi";
import { ORDER_STATUSES } from "../constants/enums.constants.js";

const isoDateTime = () => Joi.string().isoDate();

// Create Order
export const createOrderSchema = Joi.object({
  idempotencyKey: Joi.string().guid({ version: "uuidv4" }).optional(),
  order: Joi.object({
    customer_id: Joi.number().integer().min(1).required(),
    merchant_id: Joi.number().integer().min(1).required(),
    delivery_fee_cents: Joi.number().integer().min(0).required(),
    building: Joi.string()
      .max(20)
      .pattern(/^[A-Za-z0-9]+$/)
      .required()
      .messages({
        "string.pattern.base": "building contains invalid characters",
      }),
    room_type: Joi.string()
      .max(32)
      // Removed unnecessary escapes before / and -
      .pattern(/^[A-Za-z][A-Za-z0-9 .\-()/]*$/)
      .required()
      .messages({
        "string.pattern.base": "roomType contains invalid characters",
      }),
    room_number: Joi.string()
      .max(10)
      // The dash doesn’t need escaping if it’s last in the character class
      .pattern(/^[A-Za-z0-9-]+$/)
      .required()
      .messages({
        "string.pattern.base":
          "room_number must be alphanumeric with dashes (e.g. 4-3, B1-3)",
      }),
    delivery_time: isoDateTime().required(),
    order_items: Joi.array()
      .items(
        Joi.object({
          menu_item_id: Joi.number().integer().min(1).required(),
          quantity: Joi.number().integer().min(1).required(),
          customisations: Joi.object().unknown(true).default({}),
          notes: Joi.string().allow("", null),
        })
      )
      .min(1)
      .required(),
  }).required(),
}).prefs({ convert: true, stripUnknown: true });

// Update Order Status
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      ORDER_STATUSES.AWAITING_PAYMENT,
      ORDER_STATUSES.AWAITING_VERIFICATION,
      ORDER_STATUSES.PAYMENT_VERIFIED,
      ORDER_STATUSES.PREPARING,
      ORDER_STATUSES.DELIVERING,
      ORDER_STATUSES.DELIVERED,
      ORDER_STATUSES.READY_FOR_COLLECTION,
      ORDER_STATUSES.CANCELLED
    )
    .required(),
}).prefs({ convert: true, stripUnknown: true });

// List Orders (user)
export const listUserOrdersQuerySchema = Joi.object({
  type: Joi.string().valid("active", "history").optional(),
  limit: Joi.number().integer().min(1).max(50).default(10),
  offset: Joi.number().integer().min(0).default(0),
}).prefs({ convert: true, stripUnknown: true });

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({
        message: "invalid_payload",
        details: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return res.status(400).json({
        message: "invalid_query",
        details: error.details.map((d) => d.message),
      });
    }

    Object.assign(req.query, value);
    next();
  };
}
