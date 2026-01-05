/**
 * @file tests/unit/services/amqp.test.js
 */
import { jest } from '@jest/globals';
import amqplib from 'amqplib';
import { getAmqpConnection, getAmqpChannel, ensureQueue } from '../../../src/services/amqp.js';

jest.mock('amqplib');

describe('amqp.js', () => {
  let mockConn;
  const channels = new Map();

  beforeEach(() => {
    jest.clearAllMocks();
    channels.clear();

    // Each createChannel() call returns a new isolated mock channel
    mockConn = {
      createChannel: jest.fn().mockImplementation(async () => {
        const ch = {
          assertExchange: jest.fn(),
          assertQueue: jest.fn(),
          bindQueue: jest.fn(),
        };
        channels.set(ch, true);
        return ch;
      }),
      on: jest.fn(),
    };

    amqplib.connect.mockResolvedValue(mockConn);
  });

  it('connects once and caches connection', async () => {
    const conn1 = await getAmqpConnection();
    const conn2 = await getAmqpConnection();
    expect(amqplib.connect).toHaveBeenCalledTimes(1);
    expect(conn1).toBe(conn2);
  });

  it('creates and caches a channel', async () => {
    const ch = await getAmqpChannel('test');
    expect(ch.assertExchange).toHaveBeenCalled();
  });

  it('ensures queue and binds keys', async () => {
    await ensureQueue('orders_q', ['a', 'b']);

    // Find the last created channel — that’s the consumer one
    const allChannels = Array.from(channels.keys());
    const consumerCh = allChannels[allChannels.length - 1];

    expect(consumerCh.assertQueue).toHaveBeenCalledWith(
      'orders_q',
      expect.objectContaining({ durable: true })
    );
    expect(consumerCh.bindQueue).toHaveBeenCalledTimes(2);
  });
});
