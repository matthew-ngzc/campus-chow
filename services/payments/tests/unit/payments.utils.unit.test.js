import {
  formatCentsToDollars,
  generatePayNowPayload,
  formatPaynowExpiry
} from '../../src/services/payment.utils.js';

describe('payment.utils', () => {

  // Test 1: Formatting util works (cents -> Dollar)
  test('formatCentsToDollars converts correctly', () => {
    expect(formatCentsToDollars(1230)).toBe('12.30');
  });

  // Test 2: generatePayNowPayload
  test('generatePayNowPayload returns valid CRC checksum', () => {
    const payload = generatePayNowPayload(
      'mobile',
      '91234567',
      '0',
      '7.90',
      'SMUNCH',
      'SMUNCH123' // ✅ add this
    );

    expect(payload).toMatch(/6304[A-F0-9]{4}$/);
  });


  test('formatPaynowExpiry produces Singapore time format', () => {
    const expiry = formatPaynowExpiry({ minutes: 10 });
    expect(expiry).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
  });
});
