// vitest.config.js
export default {
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["tests/setup.env.js"],
    include: ["tests/**/*.test.js"],
    hookTimeout: 30000,
    testTimeout: 30000,
    isolate: true
  }
}
