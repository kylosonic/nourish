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
