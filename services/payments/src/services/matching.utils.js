import { findCandidatePayments, getPaymentByTransactionRef } from "../api/repositories/payments.repo.js";
import { findCandidateTransactions } from "../api/repositories/transactions.repo.js"
import dayjs from "dayjs";

/**
 * Finds the most likely matching transaction for a payment screenshot.
 * Uses substring matching first, then time proximity fallback.
 */
export async function findMatchingTransaction({ transactionRef, amountCents, dateTime }) {
  // console.log(`[matching.utils] amountCents: ${transactionRef}`);
  // console.log(`[matching.utils] transactionAmt: ${transactionAmt}`);
  // console.log(`[matching.utils] transactionDatetime: ${transactionDatetime}`);
  const candidates = await findCandidateTransactions({ amountCents, dateTime });
  console.log(`[DEBUG] found ${candidates.length} candidates`);
  // 1️⃣ Try substring match first
  const substringMatch = candidates.find(
    (tx) => String(tx.transaction_ref || "").includes(String(transactionRef || "").trim())
  );
  if (substringMatch) return substringMatch;

  // 2️⃣ Fallback: amount + time within ±1 minute (already narrowed down)
  const match = candidates.find((tx) => {
    const diffMs = Math.abs(dayjs(tx.date_time).diff(dayjs(dateTime)));
    return diffMs <= 60 * 1000;
  });

  return match || null;
}

/**
 * Finds a matching payment for a new transaction.
 *
 * Matching rules:
 *  1. Exact match on transaction_ref
 *  2. Otherwise, payment.transaction_ref is contained in transactionRef
 *  3. Otherwise, same amount and within ±1 minute of timestamp
 *
 * @param {object} transaction
 * @param {string} transaction.transactionRef
 * @param {number} transaction.amountCents
 * @param {string} transaction.dateTime
 * @returns {Promise<object|null>} matching payment row or null
 */
export async function findMatchingPayment({ transactionRef, amountCents, dateTime }) {
  const trimmedRef = String(transactionRef || "").trim();

  // 1️⃣ Try exact match
  const direct = await getPaymentByTransactionRef(trimmedRef);
  if (direct) return direct;

  // 2️⃣ Fuzzy search by time ±1 minute and amount
  const candidates = await findCandidatePayments({ amountCents, dateTime });
  console.log(`[DEBUG FINDING CANDIDATE PAYMENTS] Found ${candidates.length} candidates`);
  if (!candidates.length) return null;

  // Substring match (transactionRef contains payment ref)
  const substringMatch = candidates.find((p) =>
    String(trimmedRef).includes(String(p.transaction_ref || ""))
  );
  if (substringMatch) return substringMatch;

  // Fallback: ±1 minute
  const match = candidates.find((p) => {
    const diffMs = Math.abs(dayjs(p.transaction_datetime).diff(dayjs(dateTime)));
    return diffMs <= 60 * 1000;
  });

  return match || null;
}
