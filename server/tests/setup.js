// Global test setup: configures a dedicated isolated test database,
// disables rate limiting and external push notifications, and exposes
// the app under test. Runs before every test file (see vitest.config.js).

process.env.NODE_ENV = 'test';

// Point the Prisma-backed `pool` shim at an isolated database so the
// development database is never touched by the test suite.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@postgres:5432/irbis_test';

// Fixed secret so tokens generated in tests are deterministic.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-irbis';

// Required by pushController at module load time.
process.env.VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'test-vapid-public-key';
process.env.VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'test-vapid-private-key';

// No-op rate limiter: keeps the suite fast and free of 429 surprises.
vi.mock('express-rate-limit', () => ({
  default: (opts) => (req, res, next) => next(),
  __esModule: true,
}));

// Stub web-push so no real push network calls happen during tests.
const webpushStub = {
  setVapidDetails: () => {},
  sendNotification: () => Promise.resolve({ statusCode: 201 }),
  generateVAPIDKeys: () => ({ publicKey: 'pub', privateKey: 'priv' }),
};
vi.mock('web-push', () => ({
  ...webpushStub,
  default: webpushStub,
}));
