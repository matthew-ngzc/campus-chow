
export const ORDER_STATUSES = {
  AWAITING_PAYMENT: "awaiting_payment",
  AWAITING_VERIFICATION: "awaiting_verification",
  PAYMENT_VERIFIED: "payment_verified",
  PREPARING: "preparing",
  READY_FOR_COLLECTION: "ready_for_collection",
  DELIVERING: "delivering",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const MENU_ITEM_STATUS = {
  AVAILABLE: "available",
  OUT_OF_STOCK: "out of stock",
  REMOVED: "removed",
};

export const DELIVERY_TIMINGS = {
  "08:15": { label: "Breakfast", hour: 8, minute: 15 },
  "12:00": { label: "Lunch", hour: 12, minute: 0 },
  "15:30": { label: "Tea Break", hour: 15, minute: 30 },
  "19:00": { label: "Dinner", hour: 19, minute: 0 },
};

export const ROUTING_KEYS = {
  ORDER_CREATED: "order.created",
  ORDER_STATUS: "order.status",
  PAYMENT_VERIFIED: "payment.status.payment_verified",
  EMAIL_REMINDER: "email.command.send_payment_reminder",
  INCOMING_EMAIL_REMINDER: "order.command.payment_reminder",
  ORDER_STATUS_UPDATE: "order.command.status_update"
};

export const BIND_PATTERNS = ["order.command.#", "payment.status.payment_verified"];
