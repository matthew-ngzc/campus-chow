export const ORDER_STATUSES = {
  AWAITING_PAYMENT: "awaiting_payment",
  AWAITING_VERIFICATION: "awaiting_verification",
  PAYMENT_VERIFIED: "payment_verified",
  CANCELLED: "cancelled",
};

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAYMENT_VERIFIED: "payment_verified",
  FAILED: "failed",
  PENDING_REFUND: "pending_refund",
  REFUNDED: "refunded",
};

export const ROUTING_KEYS = {
  PAYMENT_STATUS: "payment.status",
  ORDER_STATUS_UPDATE: "order.command.status_update",
  PAYMENT_REMINDER_EMAIL: "order.command.payment_reminder",
  PAYMENT_VERIFIED: "payment.verified",
  PAYMENT_REFUNDED: "payment.refunded",
  PAYMENT_FAILED: "payment.failed",
  UPLOAD_SCREENSHOT: "payment.command.upload_screenshot",
  ADD_TRANSACTION: "payment.command.add_transaction",
  PROCESSED_SCREENSHOT : "payment.processed.screenshot",
  ORDER_CANCELLED : "order.status.cancelled"
};

export const BIND_PATTERNS = ["payment.command.#", "order.status.cancelled"];

export const BANKS = {
  DBS: "DBS",
  SC : "SC",
  OCBC: "OCBC",
  // UOB: "UOB",
  // HSBC: "HSBC",
  // CIMB: "CIMB",
  // MAYBANK: "MAYBANK"
}
