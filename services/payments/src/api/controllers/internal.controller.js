import { PAYMENT_STATUSES } from "../constants/enums.constants.js";
import { getFullPaymentsByStatus } from "../repositories/payments.repo.js";
import { updatePaymentStatusSvc } from "../../services/payments.service.js";
import { addTransaction } from "../../services/transactions.service.js";

export async function listPendingPayments(req, res, next) {
  try {
    const payments = await getFullPaymentsByStatus(PAYMENT_STATUSES.PENDING);
    res.json({ count: payments.length, orders: payments });
  } catch (err) {
    next(err);
  }
}

export async function listPendingRefunds(req, res, next) {
  try {
    const payments = await getFullPaymentsByStatus(PAYMENT_STATUSES.PENDING_REFUND);
    res.json({ count: payments.length, orders: payments });
  } catch (err) {
    next(err);
  }
}

export async function markOrdersRefunded(req, res, next) {
  try {
    const { orderIds } = req.body;
    const results = [];

    for (const id of orderIds) {
        const updated = await updatePaymentStatusSvc({orderId: id, newStatus: PAYMENT_STATUSES.REFUNDED });
        results.push({ orderId: id, status: updated ? "ok" : "not_found" });
    }

    res.json({ updated: results.length, results });
  } catch (err) {
    next(err);
  }
}

export async function markPaymentsVerified(req, res, next) {
  try {
    const { orderIds } = req.body;
    const results = [];

    for (const id of orderIds) {
        const updated = await updatePaymentStatusSvc({orderId: id, newStatus: PAYMENT_STATUSES.PAYMENT_VERIFIED });
        results.push({ orderId: id, status: updated ? "ok" : "not_found" });
    }

    res.json({ updated: results.length, results });
  } catch (err) {
    next(err);
  }
}

/**
 * Add a new transaction (internal only)
 * 
 * Body is validated by middleware before this runs.
 */
export async function addTransactionInternal(req, res, next) {
  try {
    const tx = await addTransaction(req.body);
    res.status(201).json({ ok: true, transaction: tx });
  } catch (err) {
    next(err);
  }
}
