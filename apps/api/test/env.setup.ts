/**
 * e2e environment, applied in the worker before any spec module is imported.
 *
 * - AI_PROVIDER=fixture: the analysis suites run the real pipeline against a
 *   deterministic provider (ADR-0007). The factory refuses this provider when
 *   NODE_ENV=production, so it cannot reach a real deployment.
 * - The analysis rate limit is raised so a suite can make many calls; the limit
 *   itself is asserted separately by the pipeline's own tests.
 */
process.env.AI_PROVIDER = 'fixture';
process.env.AI_RATE_LIMIT_LIMIT = '1000';
process.env.AI_DAILY_BUDGET = '100000';

// S3 accounts: a test-only secret (never a real one) and the console SMS
// provider, so sign-in flows run without a gateway. The provider factory
// refuses `console` in production, so this cannot leak into a deployment.
process.env.JWT_SECRET ??= 'test-only-jwt-secret-that-is-long-enough-for-the-schema';
process.env.SMS_PROVIDER = 'console';
// The sign-in rate limits are asserted by their own tests; the flow tests need
// to make many requests from one address.
process.env.OTP_REQUEST_RATE_LIMIT = '1000';
process.env.OTP_VERIFY_RATE_LIMIT = '1000';
