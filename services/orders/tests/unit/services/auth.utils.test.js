import { isCorrectUser } from '../../../src/services/auth.utils.js';

describe('isCorrectUser', () => {
  it('allows admin always', () => {
    expect(isCorrectUser({ role: 'ADMIN', userId: 1, order: { customer_id: 2 } })).toEqual({ allowed: true });
  });

  it('denies unknown roles', () => {
    const res = isCorrectUser({ role: 'MERCHANT', userId: 1, order: { customer_id: 1 } });
    expect(res.allowed).toBe(false);
  });

  it('denies mismatched user', () => {
    const res = isCorrectUser({ role: 'USER', userId: 1, order: { customer_id: 2 } });
    expect(res.allowed).toBe(false);
  });

  it('allows correct user', () => {
    const res = isCorrectUser({ role: 'USER', userId: 1, order: { customer_id: 1 } });
    expect(res.allowed).toBe(true);
  });
});
