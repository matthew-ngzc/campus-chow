/**
 * @file tests/unit/services/events.service.test.js
 */
import { jest } from "@jest/globals";

// ---- define mocks ----
const mockGetFullOrderById = jest.fn();
const mockEnqueue = jest.fn();
const mockUpdateOrderStatusOrThrow = jest.fn();

// ---- register mocks BEFORE import ----
await jest.unstable_mockModule("../../../src/api/repositories/orders.repo.js", () => ({
  getFullOrderById: mockGetFullOrderById,
}));

// ✅ include all expected exports to satisfy imports
await jest.unstable_mockModule("../../../src/api/repositories/outbox.repo.js", () => ({
  enqueue: mockEnqueue,
  claimBatch: jest.fn(),
  markProcessed: jest.fn(),
  markPublished: jest.fn(),
  getUnpublished: jest.fn(),
}));

await jest.unstable_mockModule("../../../src/services/orders.service.js", () => ({
  toDTO: (o) => o,
  updateOrderStatusOrThrow: mockUpdateOrderStatusOrThrow,
}));

await jest.unstable_mockModule("../../../src/db/client.js", () => ({
  withTransaction: jest.fn(async (fn) => fn({})),
  pool: {},
}));

// ---- import after mocks ----
const { handlePaymentReminder, handleOrderStatusUpdate } = await import(
  "../../../src/services/events.service.js"
);

// ---- test suite ----
describe("events.service", () => {
  beforeEach(() => jest.clearAllMocks());

  // 🧪 Test 1: Rejects events from invalid source
  it("rejects invalid source", async () => {
    await expect(
      handlePaymentReminder({
        messageId: "1",
        routingKey: "",
        payload: { orderIds: [1] },
        properties: { headers: { sourceService: "unknown" } },
      })
    ).rejects.toThrow();
  });

  // 🧪 Test 2: Accepts valid payment reminder from 'payment' service
  it("accepts valid reminder", async () => {
    mockGetFullOrderById.mockResolvedValue({
      order_id: 1,
      order_status: "awaiting_payment",
    });

    const res = await handlePaymentReminder({
      messageId: "1",
      routingKey: "",
      payload: { orderIds: [1] },
      properties: { headers: { sourceService: "payment" } },
    });

    expect(res.status).toBe("queued");
    expect(mockEnqueue).toHaveBeenCalledTimes(1);
  });

  // 🧪 Test 3: Handles order status update from payment service
  it("handles valid order status update from payment service", async () => {
    mockUpdateOrderStatusOrThrow.mockResolvedValue({});
    mockGetFullOrderById.mockResolvedValue({ order_id: 1 });

    const result = await handleOrderStatusUpdate({
      routingKey: "",
      payload: { orderId: 1, newStatus: "payment_verified" },
      properties: { headers: { sourceService: "payment" } },
    });

    expect(result.status).toBe("applied");
    expect(mockUpdateOrderStatusOrThrow).toHaveBeenCalledWith(
      1,
      "payment_verified",
      undefined
    );
    expect(mockEnqueue).toHaveBeenCalledTimes(1);
  });
});
