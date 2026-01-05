import { PAYMENT_STATUSES } from "../api/constants/enums.constants.js";
import { updatePaymentFields } from "../api/repositories/payments.repo.js";
import { createTransactionRow } from "../api/repositories/transactions.repo.js";
import { withTransaction } from "../db/client.js";
import { findMatchingPayment } from "./matching.utils.js";
import { updatePaymentStatusSvc } from "./payments.service.js";

export async function addTransaction({ transactionRef, amountCents, dateTime, sender, receiver }) {
  return await withTransaction(async (tx) => {
    const transaction = await createTransactionRow(tx, {
      transactionRef,
      amountCents,
      dateTime,
      sender,
      receiver,
    });
    let fields;
    // check for matching payment
    const matchingPayment = await findMatchingPayment({transactionRef, amountCents, dateTime});
    if (matchingPayment){
      const orderId = matchingPayment.order_id;
      console.log(
        `[transactions.service] Found matching payemnt orderId=${orderId}, Ref=${matchingPayment.transaction_ref}`
        
      );
      await updatePaymentStatusSvc({ orderId, newStatus: PAYMENT_STATUSES.PAYMENT_VERIFIED });
      fields = {matchingTransactionId : transaction.id};
      await updatePaymentFields(tx, {
        orderId,
        fields,
      });
    }
    return transaction;
  });
}