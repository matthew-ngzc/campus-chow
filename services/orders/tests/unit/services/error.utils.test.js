import { NotFoundError, DuplicateError, BadRequestError, UnauthorizedError } from '../../../src/services/error.utils.js';

describe('error.utils', () => {
  it('creates NotFoundError', () => {
    const e = NotFoundError('Order', 'ID', 1);
    expect(e.message).toContain('Order');
    expect(e.status).toBe(404);
  });

  it('creates DuplicateError', () => {
    const e = DuplicateError('Order', 'ID', 1);
    expect(e.status).toBe(409);
  });

  it('creates BadRequestError', () => {
    const e = BadRequestError('bad');
    expect(e.status).toBe(400);
  });

  it('creates UnauthorizedError', () => {
    const e = UnauthorizedError();
    expect(e.status).toBe(401);
  });
});
