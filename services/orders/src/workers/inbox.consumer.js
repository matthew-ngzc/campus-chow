import { ensureQueue } from '../services/amqp.js';
import { recordReceived } from '../api/repositories/inbox.repo.js';
import { BIND_PATTERNS } from '../api/constants/enums.constants.js';
import { baseEnvelope } from './schemas.js';

// Use env or constants for bind patterns
const INBOX_QUEUE = process.env.AMQP_INBOX_QUEUE;
const PREFETCH = Number(process.env.AMQP_PREFETCH || 20);

export async function startInboxConsumer() {
  console.log('[inbox.consumer] started');
  const ch = await ensureQueue(INBOX_QUEUE, BIND_PATTERNS);
  console.log('[inbox.consumer] queue ensured');
  await ch.prefetch(PREFETCH);

  console.log(`[inbox.consumer] listening on ${INBOX_QUEUE} for [${BIND_PATTERNS.join(', ')}]`);

  ch.consume(INBOX_QUEUE, async (msg) => {
    if (!msg) return;

    //try parsing message
    try{
        const props = msg.properties || {};
        const routingKey = msg.fields?.routingKey || 'unknown';
        const messageId = props.messageId || null;
        const headers = props.headers || {};
        // debugging logs
        console.log(`[inbox.consumer] received messageId=${messageId} routingKey=${routingKey}`);
        console.log(msg);
        console.log(`[inbox.consumer] message : ${JSON.stringify(msg)}`);
        console.log(`[inbox.consumer] message properties: ${JSON.stringify(props)}`);
        console.log(`[inbox.consumer] message headers: ${JSON.stringify(headers)}`);
        console.log(`[inbox.consumer] message content: ${msg.content.toString()}`);
        
        if (!messageId) {
          console.warn('[inbox.consumer] missing messageId; acking as permanent reject');
          ch.ack(msg);
          return;
        }
        let payload = {};
        try {
          payload = JSON.parse(msg.content.toString());
        } catch {
          console.warn('[inbox.consumer] invalid JSON; acking (bad message)');
          ch.ack(msg);
          return;
        }

        // check envelope structure
        const { error } = baseEnvelope.validate(payload, { abortEarly: false });
        if (error) {
          console.warn('[inbox.consumer] envelope validation failed:', error.details);
          ch.ack(msg);
          return;
        }
        await recordReceived({
          messageId,
          routingKey,
          payload,                        // parsed JSON body
          properties: props,              // full AMQP properties (json)
        });
      ch.ack(msg);
    } catch (err) {
      console.error('[inbox.consumer] transient error, nacking (to DLQ if configured):', err);
      ch.nack(msg, false, false);
    }
  });
}