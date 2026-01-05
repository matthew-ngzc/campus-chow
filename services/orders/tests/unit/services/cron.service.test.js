/**
 * @file tests/unit/services/cron.service.test.js
 * @description Unit tests for cron.service.js — mocks DB and outbox layers
 * so the scheduler logic can be tested without external dependencies.
 */

import { jest } from "@jest/globals";

// -----------------------------------------------------
// 1️⃣ Define explicit mocks for the used repo methods
// -----------------------------------------------------
const mockFindUnpaidOrdersForDeliveryTime = jest.fn();
const mockGetFullOrderById = jest.fn();
const mockEnqueue = jest.fn();
const mockUpdateOrderStatusOrThrow = jest.fn();

// -----------------------------------------------------
// 2️⃣ Register module mocks BEFORE importing the service
// -----------------------------------------------------
await jest.unstable_mockModule(
  "../../../src/api/repositories/orders.repo.js",
  () => ({
    findUnpaidOrdersForDeliveryTime: mockFindUnpaidOrdersForDeliveryTime,
    getFullOrderById: mockGetFullOrderById,
  })
);

await jest.unstable_mockModule(
  "../../../src/api/repositories/outbox.repo.js",
  () => ({
    enqueue: mockEnqueue,
    claimBatch: jest.fn(),
    markProcessed: jest.fn(),
    markPublished: jest.fn(),
  })
);


await jest.unstable_mockModule(
  "../../../src/services/orders.service.js",
  () => ({
    updateOrderStatusOrThrow: mockUpdateOrderStatusOrThrow,
    toDTO: (x) => x, // simple passthrough for convenience
  })
);

// --- Database client ---
await jest.unstable_mockModule("../../../src/db/client.js", () => ({
  withTransaction: jest.fn(async (callback) => callback({ query: jest.fn(), client: {} })),
  pool: {},
}));


// -----------------------------------------------------
// 3️⃣ Import the cron service AFTER mocks are registered
// -----------------------------------------------------
const { runPaymentReminder, runAutoCancel } = await import(
  "../../../src/services/cron.service.js"
);

// -----------------------------------------------------
// 4️⃣ Unit tests
// -----------------------------------------------------
describe("cron.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------
  // 🧪 Test 1: skips when there are no unpaid orders
  // ---------------------------------------------
  it("skips if no unpaid orders", async () => {
    mockFindUnpaidOrdersForDeliveryTime.mockResolvedValue([]);
    await runPaymentReminder("12:00");
    expect(mockFindUnpaidOrdersForDeliveryTime).toHaveBeenCalled();
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  // ---------------------------------------------
  // 🧪 Test 2: enqueues reminders for unpaid orders
  // ---------------------------------------------
  it("enqueues reminders for unpaid orders", async () => {
    mockFindUnpaidOrdersForDeliveryTime.mockResolvedValue([{ order_id: 1 }]);
    mockGetFullOrderById.mockResolvedValue({ order_id: 1, order_status: "awaiting_payment" });

    await runPaymentReminder("12:00");

    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    expect(mockEnqueue).toHaveBeenCalledWith(expect.any(Object), {
      routingKey: "email.command.send_payment_reminder",
      exchange: expect.any(String),
      payload: expect.any(Object),
      properties: expect.any(Object),
    });
  });

  // ---------------------------------------------
  // 🧪 Test 3: auto-cancels unpaid orders
  // ---------------------------------------------
  it("auto-cancels unpaid orders", async () => {
    mockFindUnpaidOrdersForDeliveryTime.mockResolvedValue([{ order_id: 2 }]);
    mockGetFullOrderById.mockResolvedValue({ order_id: 2 });

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runAutoCancel("12:00");

    expect(mockUpdateOrderStatusOrThrow).toHaveBeenCalledWith(
      2,
      expect.stringContaining("cancelled"),
      expect.objectContaining({ cancel_reason_code: "UNPAID" })
    );
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
