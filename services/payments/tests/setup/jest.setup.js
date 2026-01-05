// tests/setup/jest.setup.js
import { jest } from '@jest/globals';
// Optional: extend Jest timeout (some async DB or QR tests take time)
jest.setTimeout(15000);

// Global mock examples (optional)
jest.mock('amqplib', () => {
  const publish = jest.fn();
  const assertExchange = jest.fn();
  const assertQueue = jest.fn();
  const bindQueue = jest.fn();
  const createChannel = jest.fn(() =>
    Promise.resolve({
      assertExchange,
      assertQueue,
      bindQueue,
      publish,
      consume: jest.fn(),
      prefetch: jest.fn(),
    })
  );
  return {
    connect: jest.fn(() => Promise.resolve({ createChannel })),
  };
});

// Optional global before/after hooks
beforeAll(() => {
  console.log('[jest setup] Starting test suite...');
});

afterAll(() => {
  console.log('[jest setup] Finished test suite');
});
