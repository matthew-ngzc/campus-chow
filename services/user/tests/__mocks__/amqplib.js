// tests/__mocks__/amqplib.js
// noop mock so register() doesn’t try to talk to RabbitMQ
export default {
  connect: async () => ({
    createChannel: async () => ({
      assertExchange: async () => {},
      publish: () => true,
      close: async () => {}
    }),
    close: async () => {}
  }),
};
