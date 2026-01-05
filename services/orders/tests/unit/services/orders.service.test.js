/**
 * @file tests/unit/services/orders.service.test.js
 * @description Unit tests for orders.service.js.
 * All dependent modules (DB, outbox, menu, and payment clients) are mocked
 * so no external services or Postgres connections are required.
 */

import { jest } from "@jest/globals";

// --------------------------------------------------
// 1️⃣ Define all mock functions
// --------------------------------------------------
const mockCreateOrder = jest.fn();
const mockUpdateOrderStatus = jest.fn();
const mockListOrdersWithItems = jest.fn();
const mockCountOrdersForUser = jest.fn();

const mockEnqueue = jest.fn();
const mockCreatePayment = jest.fn();
const mockFetchMenuItemDetails = jest.fn();

// --------------------------------------------------
// 2️⃣ Mock modules BEFORE importing the service
// --------------------------------------------------

// --- Orders repository ---
await jest.unstable_mockModule("../../../src/api/repositories/orders.repo.js", () => ({
  createOrder: mockCreateOrder,
  updateOrderStatus: mockUpdateOrderStatus,
  listOrdersWithItems: mockListOrdersWithItems,
  countOrdersForUser: mockCountOrdersForUser,
  cancelUnpaidOrders: jest.fn(),
}));

// --- Outbox repository ---
await jest.unstable_mockModule("../../../src/api/repositories/outbox.repo.js", () => ({
  enqueue: mockEnqueue,
  claimBatch: jest.fn(),
  markProcessed: jest.fn(),
  markPublished: jest.fn(),
  getUnpublished: jest.fn(),
}));

// --- Payments client ---
await jest.unstable_mockModule("../../../src/services/payments.client.js", () => ({
  createPayment: mockCreatePayment,
}));

// --- Menu client (NEW: prevents real HTTP requests) ---
await jest.unstable_mockModule("../../../src/services/menus.client.js", () => ({
  fetchMenuItemDetails: mockFetchMenuItemDetails,
}));

// --- Database client ---
await jest.unstable_mockModule("../../../src/db/client.js", () => ({
  withTransaction: jest.fn(async (callback) => callback({ query: jest.fn(), client: {} })),
  pool: {},
}));

// --------------------------------------------------
// 3️⃣ Import the service AFTER mocks are registered
// --------------------------------------------------
const { createOrderOrThrow, updateOrderStatusOrThrow } = await import(
  "../../../src/services/orders.service.js"
);

// --------------------------------------------------
// 4️⃣ Test suite
// --------------------------------------------------
describe("orders.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // default menu client mock data (simulating /api/merchants/:id/menu/items)
    const mockMenuResponse = {
      items: [
        { itemId: 1, name: "Chicken Rice", available: true, priceCents: 550 },
        { itemId: 2, name: "Soup", available: true, priceCents: 1000 },
      ],
    };

    mockFetchMenuItemDetails.mockImplementation(async (merchantId, itemIds) => {
      const map = new Map();
      for (const it of mockMenuResponse.items) {
        map.set(it.itemId, {
          name: it.name,
          available: it.available,
          priceCents: it.priceCents,
        });
      }
      return map;
    });
  });

  // -----------------------------------------
  // 🧪 Test 1: Validates missing delivery_time
  // -----------------------------------------
  it("throws if delivery_time missing", async () => {
    await expect(createOrderOrThrow({ body: {} })).rejects.toThrow("delivery_time");
  });

  // -----------------------------------------
  // 🧪 Test 2: Creates order and payment successfully
  // -----------------------------------------
  it("creates order and payment successfully", async () => {
    mockCreateOrder.mockResolvedValue({ order_id: 1 });
    mockCreatePayment.mockResolvedValue({
      qrCode: "mockQR",
      paymentReference: "SMUNCH6",
      paynowNumber: "87896972",
    });

    const requestPayload = {
      idempotency_key: "abcdef",
      order: {
        customer_id: 1,
        merchant_id: 1,
        delivery_fee_cents: 100,
        order_items: [
          {
            menu_item_id: 1,
            quantity: 2,
            customisations: { noodle: "yellow" },
            notes: "hello",
          },
          {
            menu_item_id: 2,
            quantity: 1,
          },
        ],
        building: "sob",
        room_type: "Seminar Room",
        room_number: "2-7",
        delivery_time: "2025-06-05T12:00:00Z",
      },
    };

    const result = await createOrderOrThrow({
      body: requestPayload.order,
      idempotencyKey: requestPayload.idempotency_key,
    });

    expect(mockFetchMenuItemDetails).toHaveBeenCalledWith(1, [1, 2]);
    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    expect(mockCreatePayment).toHaveBeenCalledTimes(1);
    expect(mockEnqueue).toHaveBeenCalledTimes(1);

    expect(result.qrCode).toBe("mockQR");
    expect(result.paymentReference).toBe("SMUNCH6");
    expect(result.paynowNumber).toBe("87896972");
  });

  // -----------------------------------------
  // 🧪 Test 3: Handles update failure (not_found)
  // -----------------------------------------
  it("handles status update failure", async () => {
    mockUpdateOrderStatus.mockResolvedValue({ ok: false, reason: "not_found" });

    await expect(updateOrderStatusOrThrow(1, "cancelled")).rejects.toThrow("not found");
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith(expect.any(Object), {
      orderId: 1,
      toStatus: "cancelled",
      extras: {},
    });
  });

  // -----------------------------------------
  // 🧪 Test 4: Updates order status successfully
  // -----------------------------------------
  it("updates order status successfully", async () => {
    mockUpdateOrderStatus.mockResolvedValue({
      ok: true,
      order: {
        order_id: 1,
        order_status: "delivered",
        customer_id: 1,
        building: "SCIS 1",
        room_type: "Seminar Room",
        room_number: "1-1",
        items: [],
      },
    });

    const result = await updateOrderStatusOrThrow(1, "delivered");

    expect(mockUpdateOrderStatus).toHaveBeenCalledTimes(1);
    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    expect(result.order_status).toBe("delivered");
  });
});
