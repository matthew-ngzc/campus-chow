import Joi from 'joi';
import { BANKS, PAYMENT_STATUSES } from '../constants/enums.constants.js';

export const createPaymentSchema = Joi.object({
  orderId: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'orderId must be a number',
      'number.integer': 'orderId must be an integer',
      'number.min': 'orderId must be positive',
      'any.required': 'orderId is required'
    }),
  amountCents: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'amountCents must be a number',
      'number.integer': 'amountCents must be an integer',
      'number.min': 'amountCents must be a positive integer',
      'any.required': 'amountCents is required'
    }),
  paymentDeadline: Joi.string()
      .isoDate()
      .required()
      .messages({
        'string.isoDate': 'paymentDeadline must be a valid ISO date string',
        'any.required': 'paymentDeadline is required'
      }),
}).prefs({ convert: true }); // ✅ this enables string→number coercion

export const updatePaymentStatusSchema = Joi.object({
  orderId: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'orderId must be a number',
      'number.integer': 'orderId must be an integer',
      'number.min': 'orderId must be positive',
      'any.required': 'orderId is required'
    }),
  newStatus: Joi.string()
    .valid(...Object.values(PAYMENT_STATUSES))
    .required()
    .messages({
      "any.only": `newStatus must be one of: ${Object.values(PAYMENT_STATUSES).join(", ")}`,
      "any.required": "newStatus is required",
    }),
});

export const uploadScreenshotSchema = Joi.object({
  imgUrl: Joi.string().uri({ scheme: ['http','https'] }).required(),
  bank: Joi.string().valid(BANKS.DBS, BANKS.SC, BANKS.OCBC,BANKS.OCBC).required(),
});

export const bulkUpdateSchema = Joi.object({
  orderIds: Joi.array().items(Joi.number().integer().required()).min(1).required(),
});

export const addTransactionSchema = Joi.object({
  transactionRef: Joi.string().required(),
  amountCents: Joi.number().integer().min(1).required(),
  dateTime: Joi.date().iso().required(),
  sender: Joi.string().required(),
  receiver: Joi.string().required(),
}).required();

export function validateBody(schema) {
  return (req, res, next) => {
    console.log("inside validateBody, body = ");
    console.log(req.body);
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true, // ✅ important — ensures "460" → 460
    });
    if (error) {
      console.log("Body validation error:", error);
      return res.status(400).json({
        message: 'invalid_payload',
        details: error.details.map(d => d.message),
      });
    }
    console.log("Body ok! Validated value:", value);
    req.validated = value;
    req.body = value;
    next();
  };
}
