import axios from 'axios';
import Joi from 'joi';

const BASE_URL = process.env.PAYMENTS_URL;
const TOKEN = process.env.SERVICE_TOKEN;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  },
});

const PaymentInfoResp = Joi.object({
  qrCode: Joi.string().required(),
  amountCents: Joi.number().integer().min(0).required(),
  paymentReference: Joi.string().required(),
  paynowNumber: Joi.string().required(),
  paidAt: Joi.string().isoDate().allow(null).optional(),
}).unknown(true);

/**
 * Create payment
 * @param {string} orderId
 * @param {number} totalAmountCents
 * @returns {Promise<{ payment_id: string, qr_code: string, amount_cents: number, payment_reference: string, paynow_number: string }>}
 */
export async function createPayment(orderId, totalAmountCents, paymentDeadline) {
  try {
    const { data } = await client.post('/api/payments', { orderId, amountCents: totalAmountCents, paymentDeadline });
    console.log("payment service response data:", data);
    const { error } = PaymentInfoResp.validate(data, { abortEarly: false });
    if (error){
      console.log("validation error:", error);
      throw Object.assign(new Error(`Payments response invalid: ${error.message}`), { status: 502 });
    } 
    return data;
  } catch (error) {
    console.error("[payments client] fetch failed", error.message);

    const e = new Error('Failed to create payment in payment microservice');
    e.status = error?.response?.status ?? 502;
    e.code = 'PAYMENT_SERVICE_ERROR';
    e.details = {
      networkCode: error?.code,
      responseStatus: error?.response?.status,
      responseData: error?.response?.data ?? null,
      message: error?.message,
    };
    throw e;
  }
}

/**
 * Get payment info by ID
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function getPaymentInfo(orderId) {
  try {
    const { data } = await client.get(`/api/payments/${orderId}`);
    const { error } = PaymentInfoResp.validate(data, { abortEarly: false });
    if (error) throw Object.assign(new Error(`Payments response invalid: ${error.message}`), { status: 502 });
    return data;
  } catch (err) {
    if (err.response) {
      throw Object.assign(new Error(`Payments ${err.response.status}: ${err.response.data || ''}`), {
        status: err.response.status,
      });
    }
    throw err;
  }
}