import Joi from 'joi';
import { BANKS, ROUTING_KEYS } from '../api/constants/enums.constants.js';

// Very tolerant envelope (consumer-level). You can tighten later.
export const baseEnvelope = Joi.object({}).unknown(true);

// export const uploadScreenshotSchema = Joi.object({
//   orderId: Joi.number()
//     .integer()
//     .min(1)
//     .required(),
//   imgUrl: Joi.string()
//     .required(),
//   bank: Joi.string()
//     .valid(BANKS.DBS, BANKS.SC, BANKS.OCBC)
//     .required(),
// });

export const ocrSchema = Joi.object({
  orderId: Joi.number().min(1).required,
  imgUrl: Joi.string().uri({ scheme: ['http','https'] }).required(),
  bank: Joi.string().valid(BANKS.DBS, BANKS.SC, BANKS.OCBC,BANKS.OCBC).required(),
});

export const transactionSchema = Joi.object({
  transactionRef: Joi.string().max(100).required(),
  amountCents: Joi.number().integer().min(1).required(),
  dateTime: Joi.string().isoDate().required(),  // e.g. "2025-10-09T17:35:00+08:00"
  sender: Joi.string().max(100).required(),
  receiver: Joi.string().max(100).required(),
});

// Map routing keys → schemas used by the processor
export const schemaByTopic = {
  [ROUTING_KEYS.OCR] : ocrSchema,
  [ROUTING_KEYS.ADD_TRANSACTION] : transactionSchema,
};
