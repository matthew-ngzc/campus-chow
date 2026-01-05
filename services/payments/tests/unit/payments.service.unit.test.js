/**
 * @file tests/unit/payments.service.unit.test.js
 */
import { jest } from '@jest/globals';

// ---- define mocks ----
const mockGetPaymentByOrderId = jest.fn();
const mockCreatePaymentRow = jest.fn();
const mockUpdatePaymentFields = jest.fn(); // ✅ add this
const mockGeneratePaymentReference = jest.fn();
const mockGeneratePayNowQRCode = jest.fn();
const mockFormatCentsToDollars = jest.fn();
const mockfindCandidatePayments = jest.fn();
const mockgetPaymentByTransactionRef = jest.fn();

// ---- 1️⃣ register mocks BEFORE service import ----
await jest.unstable_mockModule('../../src/api/repositories/payments.repo.js', () => ({
  getPaymentByOrderId: mockGetPaymentByOrderId,
  createPaymentRow: mockCreatePaymentRow,
  updatePaymentFields: mockUpdatePaymentFields, 
  findCandidatePayments: mockfindCandidatePayments,
  getPaymentByTransactionRef: mockgetPaymentByTransactionRef
}));

await jest.unstable_mockModule('../../src/services/payment.utils.js', () => ({
  generatePaymentReference: mockGeneratePaymentReference,
  generatePayNowQRCode: mockGeneratePayNowQRCode,
  formatCentsToDollars: mockFormatCentsToDollars,
}));

await jest.unstable_mockModule('../../src/db/client.js', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(), // some repos import pool.query directly
  },
  query: jest.fn(), // ✅ add this for named import { query }
  withTransaction: jest.fn(async (callback) =>
    callback({
      query: jest.fn(),
      client: {},
      release: jest.fn(),
    })
  ),
}));



// ---- 2️⃣ dynamically import service AFTER mocks ----
const { createPaymentInstructions } = await import('../../src/services/payments.service.js');

// ---- 3️⃣ test suite ----
describe('payments.service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('throws error when missing params', async () => {
    await expect(createPaymentInstructions({})).rejects.toThrow(/Missing field/);
  });

  test('creates payment instructions successfully', async () => {
    mockGetPaymentByOrderId.mockResolvedValue(null);
    mockCreatePaymentRow.mockResolvedValue({});
    mockGeneratePaymentReference.mockResolvedValue('SMUNCH1');
    mockGeneratePayNowQRCode.mockResolvedValue({
      qrCodeDataURL: 'data:image/png;base64,abc',
      paynowNumber: '91234567',
    });
    mockFormatCentsToDollars.mockReturnValue('4.60');

    const result = await createPaymentInstructions({
      orderId: 1,
      amountCents: 460,
      paymentDeadline: new Date().toISOString(),
    });

    expect(result).toEqual(
      expect.objectContaining({
        qrCode: expect.stringContaining('data:image/png'),
        paymentReference: 'SMUNCH1',
        paynowNumber: '91234567',
        amountCents: 460,
      })
    );
  });
});
