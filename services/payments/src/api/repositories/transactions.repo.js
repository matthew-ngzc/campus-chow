import { query } from "../../db/client.js";
import dayjs from "dayjs";

/**
 * Look for payment with corresponding transactionRef, returns order_id, amount_cents, payment_status
 *
 * @param {string} transactionRef
 * @returns {Promise<object|null>}
 */
export async function getTransactionByTransactionRef(transactionRef) {
  const { rows } = await query(
    `select *
       from transactions
      where transaction_ref = $1`,
    [transactionRef]
  );
  return rows[0] || null;
}

export async function createTransactionRow(tx,{
    transactionRef,
    amountCents,
    dateTime,
    sender,
    receiver,
}) {
  if (
    !transactionRef ||
    !Number.isInteger(amountCents) ||
    !dateTime ||
    !sender ||
    !receiver
  ) {
    const e = new Error(
      "Missing required fields: transactionRef, amountCents, dateTime, sender, receiver"
    );
    e.status = 400;
    throw e;
  }

  const { rows } = await tx.query(
    `insert into transactions (
       transaction_ref, amount_cents, date_time, sender, receiver, created_at
     ) values ($1, $2, $3, $4, $5, now())
     returning *`,
    [transactionRef, amountCents, dateTime, sender, receiver]
  );

  return rows[0];
}

/**
 * Finds candidate transactions within ±1 minute of a given time and matching amount.
 * Used for fuzzy matching against payment screenshots.
 *
 * @param {object} params
 * @param {number} params.amountCents - Payment amount in cents
 * @param {string|Date} params.dateTime - Screenshot timestamp (ISO)
 * @returns {Promise<Array>} Candidate transaction rows
 */
export async function findCandidateTransactions({ amountCents, dateTime }) {
  console.log(`[TRANSACTION.REPO] amountCents: ${amountCents}`);
  console.log(`[TRANSACTION.REPO] dateTime: ${dateTime}`);
  const minTime = dayjs(dateTime).subtract(1, "minute").toISOString();
  const maxTime = dayjs(dateTime).add(1, "minute").toISOString();

  const { rows } = await query(
    `
      SELECT *
      FROM transactions
      WHERE date_time BETWEEN $1 AND $2
        AND amount_cents = $3
      ORDER BY date_time DESC
      LIMIT 10
    `,
    [minTime, maxTime, amountCents]
  );

  return rows;
}