import amqplib from 'amqplib';

let conn;
const channels = new Map();

const AMQP_URL = process.env.AMQP_URL;
export const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE;

/** get (and cache) a single connection */
export async function getAmqpConnection() {
  if (conn) return conn;
  conn = await amqplib.connect(AMQP_URL);
  console.log('[amqp] connected to broker');
  conn.on('close', () => { conn = null; channels.clear(); });
  conn.on('error', () => {/* log-only; next get will rebuild */});
  return conn;
}

/** get (and cache) a named channel; asserts the topic exchange */
export async function getAmqpChannel(name = 'default') {
  if (channels.has(name)) return channels.get(name);
  console.log(`[amqp] creating channel "${name}"`);
  const ch = await (await getAmqpConnection()).createChannel();
  await ch.assertExchange(AMQP_EXCHANGE, 'topic', { durable: true });
  channels.set(name, ch);
  return ch;
}

/** ensure a durable queue and bind keys (exact or wildcard) to the topic exchange */
export async function ensureQueue(queueName, bindKeys = []) {
  const ch = await getAmqpChannel('consumer');
  await ch.assertQueue(queueName, {
    durable: true,
    // deadLetterExchange: `${AMQP_EXCHANGE}.dlx`,
    // deadLetterRoutingKey: 'dead',
  });
  for (const key of bindKeys) {
    await ch.bindQueue(queueName, AMQP_EXCHANGE, key);
  }
  return ch;
}
