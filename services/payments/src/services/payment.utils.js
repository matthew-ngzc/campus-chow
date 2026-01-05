import QRCode from 'qrcode';
import { CRC } from 'crc-full';
import dotenv from "dotenv";

import {generatePayNowQRCodeUsingSGQR} from "./sgqr.client.js";

dotenv.config();

const PAYNOW_PROXYTYPE = "mobile";
const REFERENCE_PREFIX = "SMUNCH";
const MERCHANT_NAME = "SMUNCH";
const PAYNOW_NUMBER = process.env.PAYNOW_NUMBER || "";


/**
 * Converts an amount in cents to a formatted dollar string with 2 decimal places.
 * 
 * Example:
 *   formatCentsToDollars(520) → "5.20"
 *   formatCentsToDollars(1230) → "12.30"
 *   formatCentsToDollars(0) → "0.00"
 * 
 * @param {number} cents - The amount in cents
 * @returns {string} - The formatted dollar string (e.g., "4.20")
 */
export function formatCentsToDollars(cents) {
  return (cents / 100).toFixed(2);
}

export function formatDollarsToCents(dollars){
  return dollars * 100;
}

/**
 * Generates a unique payment reference for an order.
 *
 * @param {string} orderId - The ID of the order
 * @returns {Promise<string>} - A unique payment reference in the format "SMUNCH{orderId}"
 */
export async function generatePaymentReference(orderId){
  // Ensure orderId and customerId are strings
  const orderIdStr = String(orderId);

  // Generate a unique reference using the order ID
  return `${REFERENCE_PREFIX}${orderIdStr}`;
}

/**
 * Generates a PayNow QR code image as a Data URI, using SGQR API with fallback.
 * @param {string|number} amount - Transaction amount in SGD dollars (e.g. '7.90' or 7.90).
 * @param {string|number} orderId - The unique ID of the order.
 * @returns {Promise<{ qrCodeDataURL: string, paynowNumber: string }>}
 *   A Base64 QR code image, the payment reference used, and the PayNow number used
 */
export async function generatePayNowQRCode({amount, paymentReference}){
  const expiryStr = formatPaynowExpiry( { minutes : 10 } ); //QRcode expires 10 minutes from now
  try {
    // try getting code from SGQR first cos its nicer
    const qrCodeDataURL = await generatePayNowQRCodeUsingSGQR({
      amount: amount,
      mobile: PAYNOW_NUMBER,
      uen: '',
      editable: 0,
      expiry: expiryStr,
      ref_id: paymentReference,
      company: ''
    });
    return {
      qrCodeDataURL,
      paynowNumber: PAYNOW_NUMBER
    };
  } catch (error) {
    console.error('[QR Fallback Error, using default QR code generator]', error.message);
    // fall back to our own QR code generator
    return buildBnWPaynowQrCode({
      amount,
      mobile: PAYNOW_NUMBER,
      uen: '',
      editable: '0',
      expiry: expiryStr,
      ref_id: paymentReference,
      company: MERCHANT_NAME
    });
  }
}


//--------------------------------------------------------------------------------------------
// * use the generatePayNowQRCode function and generatePayNowPayload to create the paynow QR code that only works with DBS. Fall back to this if the API from sgqrcode stops working

/**
 * Generates a PayNow QR code image as a Data URI using fixed proxy settings.
 * 
 * This function generates a dynamic PayNow QR code using:
 * - a fixed proxy type ('mobile'),
 * - a fixed PayNow-registered phone number from .env'),
 * - a fixed merchant name (e.g. 'SMUNCH'),
 * - a fixed non-editable amount field.
 * 
 * The only dynamic inputs are the transaction amount and order/customer identifiers,
 * which are used to compute a unique payment reference in the format: "SMUNCH-{orderId}-{customerId}".
 *
 * @param {string|number} amount - Transaction amount in SGD dollars (e.g. '7.90' or 7.90).
 * @param {string|number} orderId - The unique ID of the order.
 * @param {string|number} customerId - The unique ID of the customer placing the order.
 * @returns {Promise<{ qrCodeDataURL: string, paynowNumber: string }>}
 *   A Base64 QR code image, the payment reference used, and the PayNow number used
 */
export async function buildBnWPaynowQrCode({
      amount,
      mobile,
      //uen,
      editable,
      //expiry,
      ref_id,
      company
    }) {
  try {
    /*
     * PayNow QR Code Parameters:
     * - proxyType: 'mobile' or 'UEN'
     * - proxyValue: 8-digit SG number or company UEN
     * - edit: 'yes' or 'no' (allow user to edit amount)
     * - amount: amount in SGD
     * - merchantName (optional): display name (defaults to 'NA')
     * - additionalComments (optional): reference or comment (e.g. order ID)
    
     * Output : 
     * - EMVCo-compliant string payload to be encoded as a QR code
     */
    const payload = generatePayNowPayload(
      PAYNOW_PROXYTYPE, //"mobile"
      mobile, // PayNow-registered phone number from .env
      editable,
      amount, //payment amount in SGD
      company, //merchant name
      ref_id // reference number
    );
    // Generate the QR code as a Data URI
    const qrCodeDataURLBnW = await QRCode.toDataURL(payload);

    // Return a Base64-encoded PNG image that can be embedded in HTML, payment reference and number for non DBS payment
    return {
      qrCodeDataURL: qrCodeDataURLBnW,
      paynowNumber: PAYNOW_NUMBER
    };
  } catch (error) {
    console.error('[QR GENERATION ERROR]', error);
    throw new Error('Failed to generate PayNow QR code');
  }
}

/**
 * Formats a PayNow expiry timestamp string (e.g., "2025/07/21 23:00")
 * based on the current time in Singapore (GMT+8).
 *
 * @param {Object} options
 * @param {number} [options.days=0] - Number of days to add.
 * @param {number} [options.hours=0] - Number of hours to add.
 * @param {number} [options.minutes=0] - Number of minutes to add.
 * @returns {string} Expiry string in format "YYYY/MM/DD HH:MM" (Singapore time).
 *
 * @example
 * formatPaynowExpiry({ days: 1, hours: 2, minutes: 30 });
 *  → "2025/07/22 02:30"
 */
export function formatPaynowExpiry({ days = 0, hours = 0, minutes = 0 } = {}) {
  // amount of miliseconds to add to current time
  const totalMs = (days * 24 * 60 + hours * 60 + minutes) * 60 * 1000
  // Calculate expiry UTC time
  const expiry = new Date(Date.now() + totalMs);

  // Convert to Singapore timezone (Asia/Singapore)
  const sgTime = new Date(
    expiry.toLocaleString('en-US', { timeZone: 'Asia/Singapore' })
  );

  // Format components
  const yyyy = sgTime.getFullYear();
  const mm = String(sgTime.getMonth() + 1).padStart(2, '0');
  const dd = String(sgTime.getDate()).padStart(2, '0');
  const hh = String(sgTime.getHours()).padStart(2, '0');
  const min = String(sgTime.getMinutes()).padStart(2, '0');

  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}


export function generatePayNowPayload(
  proxyType = 'mobile',     // 'mobile' or 'UEN'
  proxyValue,               // e.g. '91234567' or '202312345A'
  editable,         // 1 allows user to change amount, 0 fixes amount
  amount,                   // e.g. '7.90'
  merchantName = 'SMUNCH',  // up to 25 chars
  reference            // e.g. 'SMUNCH-42-12'
) {
  console.log("[DEBUG] : " + reference)
  const pad = (val, len = 2) => val.toString().padStart(len, '0');
  const build = (id, value) => pad(id) + pad(value.length) + value;

  const proxyTypeCode = proxyType === 'UEN' ? '2' : '0';
  const fullProxy = proxyType === 'mobile' ? `+65${proxyValue}` : proxyValue;

  
  const refField = build('01', reference);     // Subfield ID "05"
  const field62 = build('62', refField);       // Wrap it properly as EMV template

  const payload = [
    build('00', '01'), // Payload Format Indicator
    build('01', '12'), // Point of Initiation Method (dynamic)
    build('26',
      build('00', 'SG.PAYNOW') +
      build('01', proxyTypeCode) +
      build('02', fullProxy)
    ),
    build('30', editable), // Amount editable flag
    build('04', '99991231'), // optional, end of time
    build('52', '0000'), // Merchant category
    build('53', '702'),  // Currency (SGD)
    build('54', Number(amount).toFixed(2)), // Amount
    build('58', 'SG'),   // Country
    build('59', merchantName.substring(0, 25)), // Merchant name
    build('60', 'Singapore'), // City
    field62 // Reference field
  ];
  
  const joined = payload.join('');
  const crc = CRC.default('CRC16_CCITT_FALSE');
  const checksum = crc.compute(Buffer.from(joined + '6304', 'ascii'))
    .toString(16).toUpperCase().padStart(4, '0');

  return joined + '6304' + checksum;
}

/**
 * Returns all orders pending payment ('awaiting_payment', 'awaiting_verification') with formatted structure.
 * 
 * Used by: admin dashboard, payment verification
 * 
 * Example return format:
 * [
 *   {
 *     order_id: 187,
 *     reference_number: "SMUNCH187",
 *     amount: "4.20",
 *     payment_status: "awaiting_payment",
 *     payment_screenshot_url: null,
 *     paid: false
 *   },
 *   {
 *     order_id: 188,
 *     reference_number: "SMUNCH188",
 *     amount: "7.50",
 *     payment_status: "awaiting_verification",
 *     payment_screenshot_url: "https://cdn.example.com/screenshot.png",
 *     paid: false
 *   }
 * ]
 */
// export async function buildPendingTransactions() {
//   const rawOrders = await getOrdersPendingPaymentCheck();
//   return rawOrders.map(order => ({
//     order_id: order.order_id,
//     reference_number: order.payment_reference,
//     amount: formatCentsToDollars(order.total_amount_cents),
//     payment_status: order.payment_status,
//     payment_screenshot_url: order.payment_screenshot_url || null,
//     paid: false
//   }));
// }
