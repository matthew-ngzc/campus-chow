/**
 * @file tests/integration/payments.client.int.test.js
 * @description Integration test that calls the real payments microservice.
 */
import { createPayment, getPaymentInfo } from "../../../src/services/payments.client.js";
import dotenv from "dotenv";

dotenv.config();
jest.setTimeout(10000); // Allow network delays

describe("Integration: payments.client → payment-service", () => {
  const orderId = Math.floor(Math.random() * 100000);
  const amountCents = 500;
  const deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1hr

  it("creates a real payment successfully", async () => {
    const data = await createPayment(orderId, amountCents, deadline);

    expect(data).toHaveProperty("qrCode");
    expect(data).toHaveProperty("paymentReference");
    expect(data.amountCents).toBe(amountCents);
    // ✅ Validate QR code is PNG data URI
    expect(data.qrCode).toMatch(/^data:image\/png;base64,iVBOR/);
  });

  it("fetches payment instructions successfully", async () => {
    const data = await getPaymentInfo(orderId);
    expect(data.paymentReference).toContain("SMUNCH");
    expect(data.amountCents).toBe(amountCents);
    expect(data.qrCode).toMatch(/^data:image\/png;base64,iVBOR/);
  });
});
