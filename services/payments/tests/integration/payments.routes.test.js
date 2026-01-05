import request from 'supertest';
import express from 'express';
import paymentsRouter from '../../src/api/routes/payment.route.js';

const app = express();
app.use(express.json());
app.use('/api/payments', paymentsRouter);

describe('Payments API Integration', () => {
  test('POST /api/payments returns 400 for invalid input', async () => {
    const res = await request(app).post('/api/payments').send({});
    expect(res.statusCode).toBe(400);
  });

  // Example of integration DB test could be added once pg test DB ready
});
