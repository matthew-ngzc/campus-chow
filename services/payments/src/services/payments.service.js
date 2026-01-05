import {
  PAYMENT_STATUSES,
  ROUTING_KEYS,
} from "../api/constants/enums.constants.js";
import { withTransaction } from "../db/client.js";
import { enqueue } from "../api/repositories/outbox.repo.js";
import {
  getPaymentByOrderId,
  createPaymentRow,
  updatePaymentFields,
} from "../api/repositories/payments.repo.js";
import { buildProperties } from "../workers/outbox.producer.js";
import {
  formatCentsToDollars,
  generatePaymentReference,
  generatePayNowQRCode,
} from "./payment.utils.js";
import fetch from 'node-fetch';
import {createWorker} from 'tesseract.js';
import { findMatchingTransaction } from "./matching.utils.js";



const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE || "smunch.events";

/**
 * Create payment instructions for an order.
 *
 * Behavior:
 * - If a payment row already exists → throw an error.
 * - If none exists → inserts a payment row (status = 'pending') and returns QR + reference + paynow number + amount cents.
 * - Always generates a *fresh* QR (e.g., for a revisit). Does not persist the QR image by default.
 *
 * @param {Object} p
 * @param {string|number} p.orderId
 * @param {string|number} p.amountCents
 * @param {string}        p.paymentDeadline   ISO timestamp (usually deliveryAt - 40m)
 * @returns {Promise<{ qrCode: string, paymentReference: string, paynowNumber: string, amountCents: number }>}
 */
export async function createPaymentInstructions({
  orderId,
  amountCents,
  paymentDeadline,
}) {
  if (!orderId || !amountCents || !paymentDeadline) {
    // console.log(`orderId: ${orderId}`);
    // console.log(`amountCents: ${amountCents}`);
    // console.log(`paymentDeadline: ${paymentDeadline}`);
    const e = new Error(
      "Missing field. orderId, amountCents, paymentDeadline are required"
    );
    e.status = 400;
    throw e;
  }

  // 2) Ensure there is a payment row (one per order)
  const existing = await getPaymentByOrderId(orderId);
  if (existing) {
    const e = new Error(`Payment for order ${orderId} already exists`);
    e.status = 409;
    throw e;
  }

  // Derive the reference (idempotent format e.g. SMUNCH-{orderId})
  const paymentReference = await generatePaymentReference(orderId);

  // 3) Persist the payment row atomically
  return await withTransaction(async (tx) => {
    try {
      await createPaymentRow(tx, {
        orderId,
        amountCents: amountCents,
        paymentStatus: PAYMENT_STATUSES.PENDING,
        paymentReference,
        paymentDeadline,
      });
    } catch (err) {
      // Unique violation → a payment already exists for this order
      // Postgres code 23505 is unique_violation
      if (err && err.code === "23505") {
        const e = new Error(`Payment for order ${orderId} already exists`);
        e.status = 409;
        throw e;
      }
      throw err;
    }
    // 4) Generate a fresh QR for the current session
    const { qrCodeDataURL, paynowNumber } = await generatePayNowQRCode({
      amount: formatCentsToDollars(amountCents),
      paymentReference,
    });

    return {
      qrCode: qrCodeDataURL,
      paymentReference,
      paynowNumber,
      amountCents,
    };
  });
}

/**
 * Confirm payment for an order and emit a domain event (via your event bus/outbox).
 *
 * Behavior:
 * - Transitions payment_status to 'confirmed' (idempotent).
 * - push `payment.confirmed` event (handled by Payments/Orders contract).
 *
 * @param {Object} p
 * @param {string|number} p.orderId
 * @returns {Promise<{ message: string, payment: object|null }>}
 */
// export async function confirmPaymentAndPublish({ orderId }) {
//     return withTransaction(async (tx) => {
//         // 1) Persist the state change idempotently
//         const { updatedPayment } = await updatePaymentFields(tx, {orderId, fields: { paymentStatus: PAYMENT_STATUSES.CONFIRMED }});
//         // 2) Enqueue domain event in the same transaction (transactional outbox)
//         // The payload should be minimal and reference the aggregate
//         await enqueue(tx, {
//             topic: TOPICS.PAYMENT_CONFIRMED,
//             payload: JSON.stringify({ orderId }),
//             // optionally add a dedupeKey if you want a unique index on (topic, orderId)
//         });

//         return { message: 'confirmed and prepped message for sending', updatedPayment };
//     });
// }

/**
 * Update a payment's status, atomically & idempotently.
 *
 * Behavior:
 * - Validates that `newStatus` is one of PAYMENT_STATUSES values.
 * - No strict transition rules enforced (as requested) — only value validation.
 * - If current status already equals `newStatus`, returns the current row (idempotent).
 * - On first transition to CONFIRMED, emits `payment.confirmed` via the outbox.
 *
 * @param {Object} params
 * @param {string|number} params.orderId
 * @param {string} params.newStatus   One of Object.values(PAYMENT_STATUSES)
 * @returns {Promise<{ok: true, order: object} | {ok: false, reason: string, message?: string}>}
 */
export async function updatePaymentStatusSvc({ orderId, newStatus }) {
  // 1) Basic validation against enum values
  if (!Object.values(PAYMENT_STATUSES).includes(newStatus)) {
    return {
      ok: false,
      reason: "invalid_status",
      message: `${newStatus} is not a valid payment status. Valid statuses are: ${Object.values(
        PAYMENT_STATUSES
      ).join(", ")}`,
    };
  }

  // 2) Execute atomically so read + update + outbox are consistent
  return await withTransaction(async (tx) => {
    const current = await getPaymentByOrderId(orderId);
    if (!current) {
      return {
        ok: false,
        reason: "not_found",
        message: `No payment found for order ${orderId}`,
      };
    }

    // Idempotent: already at desired status
    if (current.payment_status === newStatus) {
      return { ok: true, order: current };
    }

    // 3) Update the row
    const updated = await updatePaymentFields(tx, {
      orderId,
      fields: { paymentStatus: newStatus },
    });
    if (!updated) {
      return {
        ok: false,
        reason: "update_failed",
        message: "Failed to update payment status",
      };
    }

    // 4) Emit event message on status update
    if (newStatus !== current.payment_status) {
      await enqueue(tx, {
        exchange: AMQP_EXCHANGE,
        routingKey: `${ROUTING_KEYS.PAYMENT_STATUS}.${newStatus}`,
        payload: {
          orderId,
          newStatus: PAYMENT_STATUSES.PAYMENT_VERIFIED,
        },
        properties: buildProperties(),
      });
    }

    return { ok: true, payment: updated };
  });
}

// takes in an image url, uses OCR to extract info and update the db accordingly
export async function uploadPaymentScreenshotSvc({ orderId, imgUrl, bank}) {
  if (!orderId || !imgUrl || !bank) {
    const e = new Error("orderId, imgUrl and bank are required");
    e.status = 400;
    e.details = { orderId, imgUrl, bank };
    throw e;
  }
  // use OCR to get details from ss
  const text = await parsePaymentScreenshot(imgUrl);
  console.log(`[payments.service]: OCR output: ${text}`)

  // get the info from the text
  const { transactionRef, transactionAmt, transactionDatetime  } = extractRefAndAmount(text, bank);

  if (!transactionRef || !transactionAmt) {
    const e = new Error("Failed to extract reference number or amount from OCR output");
    e.status = 422;
    e.details = { text };
    throw e;
  }

  console.log(`[OCR] Extracted transactionRef = ${transactionRef}, transactionAmt = ${transactionAmt}, time = ${transactionDatetime}`);
  
  // Check if payment amount is correct
  const paymentRow = await getPaymentByOrderId(orderId);
  if (!paymentRow) {
    const e = new Error(`No payment found for order ${orderId}`);
    e.status = 404;
    throw e;
  }
  console.log(`[DEBUG] Order id: ${paymentRow.order_id}`);
  const expectedAmt = paymentRow.amount_cents;
  const amountMatches = Number(transactionAmt) === Number(expectedAmt);
  console.log(`[DEBUG] amountMatches: ${amountMatches}`);

  let fields = { screenshotUrl: imgUrl, transactionRef, transactionAmt, transactionDatetime, matchingTransactionId: null};
  console.log(`[DEBUG] fields: ${JSON.stringify(fields)}`);
  // not matching amt, save ss but dont check
  if (!amountMatches) {
    console.warn(`[payments.service] ⚠️ Amount mismatch: expected ${expectedAmt}, got ${transactionAmt}. Saving Screenshot, skipping verification.`);
    fields = {screenshotUrl: imgUrl};
  } else{
    // Look for matching transaction
    console.log(`[DEBUG] Looking for matching transaction`);
    console.log(`[payments.service] transactionRef: ${transactionRef}`);
    console.log(`[payments.service] transactionAmt: ${transactionAmt}`);
    console.log(`[payments.service] transactionDatetime: ${transactionDatetime}`);
    const matchingTransaction = await findMatchingTransaction({
      transactionRef,
      amountCents: transactionAmt,
      dateTime: transactionDatetime
    });
    // found matching
    if (matchingTransaction) {
      console.log(
        `[payments.service] Found matching transaction ID=${matchingTransaction.id}, Ref=${matchingTransaction.transaction_ref}`
      );
      await updatePaymentStatusSvc({ orderId, newStatus: PAYMENT_STATUSES.PAYMENT_VERIFIED });
      // add the transaction id into fields
      fields.matchingTransactionId = matchingTransaction.id;
    } 
  }
  // Update payment row with screenshot URL
  const updated = await withTransaction(async (tx) => {

    // 2) Enqueue OCR command (small message)
    await enqueue(tx, {
      exchange: AMQP_EXCHANGE,
      routingKey: ROUTING_KEYS.PROCESSED_SCREENSHOT,
      payload: { orderId: Number(orderId), imgUrl, bank },
      properties: buildProperties(),
    });

    // update the order
    return await updatePaymentFields(tx, {
      orderId,
      fields,
    });
  });
  return { ok: true, order: updated }; 
}

export async function parsePaymentScreenshot(imgUrl){
  // download image
  const img = await fetch(imgUrl);
  if (!img.ok) throw new Error(`Failed to fetch image: ${img.status}`);
  const arrayBuffer = await img.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // OCR
  const worker = await createWorker();
  try {
    // await worker.load(); // optional
    const { data: { text } } = await worker.recognize(buffer, { lang: 'eng' });
    return text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract transaction reference + amount (and optional note)
 * from OCR text based on the bank type.
 *
 * @param {string} ocrText - raw OCR output
 * @param {string} bank - e.g. "DBS", "SC", "UOB"
 */
export function extractRefAndAmount(ocrText, bank = "DBS") {
  if (!ocrText || typeof ocrText !== "string")
    return { transactionRef: null, transactionAmt: null, transactionDatetime: null, note: null };

  const normalized = ocrText
    .replace(/[\u2000-\u200F\u2028\u2029\u00A0]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r?\n[ \t]+/g, "\n")
    .trim();

  const lines = normalized.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  const sgdLike = /(?:S\s*G\s*D|S6D|5GD|\$)/i;
  const amount2dp = /([0-9]{1,3}(?:[, ]?[0-9]{3})*(?:[.,][0-9]{2}))/;

  // --- Extract amount (common across banks) ---
  let transactionAmt = null;
  for (const ln of lines) {
    if (sgdLike.test(ln) && amount2dp.test(ln)) {
      const raw = ln.match(amount2dp)?.[1]?.replace(/[, ]/g, "");
      const n = Number(raw?.replace(",", "."));
      if (Number.isFinite(n)) { transactionAmt = Math.round(n * 100); break; }
    }
  }

  if (!transactionAmt) {
    const m = normalized.match(new RegExp(`${sgdLike.source}\\s*${amount2dp.source}`, "i"));
    if (m) {
      const n = Number(m[1].replace(/[, ]/g, "").replace(",", "."));
      if (Number.isFinite(n)) transactionAmt = Math.round(n * 100);
    }
  }

  // --- Extract date/time ---
  // Matches things like:
  //  "on 11 Nov 2025, 07:57"
  //  "Tue, 11 Nov 2025, 7:19 am (SGT)"
  //  "2025-11-11 07:57"
  let transactionDatetime = null;
  const datePattern =
    /\b(?:on\s*)?(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})[^\d]{0,3}(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\s*(?:am|pm|AM|PM)?)?\b/;
  const dateMatch = normalized.match(datePattern);
  if (dateMatch) {
    const raw = `${dateMatch[1]} ${dateMatch[2] || ""}`.trim();
    const parsed = new Date(raw.replace(",", ""));
    if (!isNaN(parsed)) {
      transactionDatetime = parsed.toISOString();
    }
  }

  // --- Bank-specific reference extraction ---
  let transactionRef = null;
  let note = null;
  const upperBank = (bank || "").toUpperCase();

  switch (upperBank) {
    case "DBS":
    case "POSB": {
      const labelIdx = lines.findIndex(l => /reference\s*(no\.?|number)/i.test(l));
      if (labelIdx !== -1) {
        for (let i = labelIdx + 1; i < Math.min(labelIdx + 4, lines.length); i++) {
          const cand = lines[i].replace(/\s+/g, "");
          if (/^[A-Z0-9-]{8,}$/.test(cand)) { transactionRef = cand; break; }
          if (/^[0-9][0-9\s-]{6,}$/.test(lines[i])) {
            const joined = lines[i].replace(/[\s-]/g, "");
            if (/^\d{8,}$/.test(joined)) { transactionRef = joined; break; }
          }
        }
      }
      break;
    }

    case "SC":
    case "STANDARDCHARTERED":
    case "STANDARD CHARTERED": {
      // Standard Chartered style: "Ref ID: XXXXX..."
      const refLine = lines.find(l => /^ref[\s:]*id/i.test(l));
      if (refLine) {
        const m = refLine.match(/ref[\s:]*id[:\s]*([A-Z0-9-]{8,})/i);
        if (m) transactionRef = m[1];
      } else {
        const refIdx = lines.findIndex(l => /^ref[\s:]*id/i.test(l));
        if (refIdx !== -1 && lines[refIdx + 1]) {
          const next = lines[refIdx + 1].replace(/\s+/g, "");
          if (/^[A-Z0-9-]{8,}$/.test(next)) transactionRef = next;
        }
      }

      // optional Notes field (e.g. “SMUNCH5”)
      const noteIdx = lines.findIndex(l => /^notes?/i.test(l));
      if (noteIdx !== -1 && lines[noteIdx + 1]) {
        note = lines[noteIdx + 1].trim();
      }
      break;
    }

    default: {
      // fallback: longest alphanumeric chunk of 12–30 chars
      const allRefs = normalized.match(/\b[A-Z0-9]{12,30}\b/g);
      if (allRefs?.length) transactionRef = allRefs.sort((a, b) => b.length - a.length)[0];
      break;
    }
  }

  return { transactionRef, transactionAmt, transactionDatetime, note };
}
