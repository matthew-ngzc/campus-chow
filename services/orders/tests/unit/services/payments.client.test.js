/**
 * @file tests/unit/services/payments.client.test.js
 * @description Unit tests for the payments.client service — verifies that payment creation,
 * validation, and retrieval work correctly with realistic mocked data.
 */
import { jest } from "@jest/globals";
import dotenv from "dotenv";
import path from "path";

// --- 1️⃣ Mock functions and realistic data ---
const mockPost = jest.fn();
const mockGet = jest.fn();

// Mock request for POST /api/payments
const mockCreateRequest = {
  orderId: 6,
  amountCents: 500,
  paymentDeadline: "2025-10-26T00:08:32.717Z",
};

// Mock successful API responses
const mockCreateResponse = {
  qrCode:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWMAAAF3CAIAAAD/5707AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nO2dd3gc1fX3...",
  paymentReference: "SMUNCH6",
  paynowNumber: "87896972",
  amountCents: 500,
};

// Same response used for GET /api/payments/:orderId
const mockGetResponse = { ...mockCreateResponse };

// --- 2️⃣ Helper: reload environment and module per test ---
async function loadClient() {
  jest.resetModules();
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });

  // Mock axios before import
  await jest.unstable_mockModule("axios", () => ({
    default: {
      create: jest.fn(() => ({ post: mockPost, get: mockGet })),
    },
  }));

  // Import after mocks are registered
  const mod = await import("../../../src/services/payments.client.js");
  return { createPayment: mod.createPayment, getPaymentInfo: mod.getPaymentInfo };
}

// --- 3️⃣ Test suite ---
describe("payments.client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYMENTS_URL = "http://mock-payments";
  });

  /**
   * ✅ TEST 1: Successful payment creation
   * Ensures createPayment() sends correct POST body and returns validated response data.
   */
  it("creates payment and validates response", async () => {
    mockPost.mockResolvedValue({ data: mockCreateResponse });
    const { createPayment } = await loadClient();

    const data = await createPayment(
      mockCreateRequest.orderId,
      mockCreateRequest.amountCents,
      mockCreateRequest.paymentDeadline
    );

    // Verify POST call
    expect(mockPost).toHaveBeenCalledWith("/api/payments", mockCreateRequest);

    // Verify response data shape
    expect(data).toEqual(mockCreateResponse);
  });

  /**
   * ⚠️ TEST 2: Invalid payment response handling
   * Simulates Joi validation failure — the client should throw a generic wrapped error.
   */
  it("throws on invalid response", async () => {
    mockPost.mockResolvedValue({ data: {} }); // missing required fields
    const { createPayment } = await loadClient();

    await expect(
      createPayment(6, 500, mockCreateRequest.paymentDeadline)
    ).rejects.toThrow("Failed to create payment in payment microservice");
  });

  /**
   * ✅ TEST 3: Successful retrieval of payment instructions
   * Ensures getPaymentInfo() calls the correct new endpoint `/api/payments/:orderId`
   * and returns the validated payment info data.
   */
  it("gets payment info successfully", async () => {
    mockGet.mockResolvedValue({ data: mockGetResponse });
    const { getPaymentInfo } = await loadClient();

    const data = await getPaymentInfo(2);

    // ✅ This checks the correct new API route was called
    expect(mockGet).toHaveBeenCalledWith("/api/payments/2");

    // ✅ Verify the returned data is parsed correctly
    expect(data.amountCents).toBe(500);
    expect(data.qrCode).toContain("data:image/png;base64");
    expect(data.paymentReference).toBe("SMUNCH6");
  });
});
