/**
 * Regression check: analyzePortfolio must never reject when Upstash is unreachable.
 *
 * Bug (2026-09-17): the rate-limit call ran outside the action's try/catch, so a dead
 * Redis host (ENOTFOUND) escaped the server action and crashed the dashboard with
 * Next.js's "This page couldn't load" screen instead of a typed error envelope.
 *
 * Run: bun scripts/analyze-resilience.test.ts
 */
import assert from "node:assert/strict";

// Hermetic env: every value is syntactically valid, and the Redis host is a
// reserved .invalid domain (RFC 2606) that is guaranteed to fail DNS resolution.
process.env.HELIUS_RPC_URL = "https://helius.invalid";
process.env.JUPITER_API_KEY = "test";
process.env.UPSTASH_REDIS_REST_URL = "https://redis.invalid";
process.env.UPSTASH_REDIS_REST_TOKEN = "test";
process.env.GROQ_API_KEY = "test";

// Dynamic import so lib/env parses the values above rather than the real .env.local.
const { analyzePortfolio } = await import("../app/actions/analyze");

const result = await analyzePortfolio("11111111111111111111111111111111");

assert.equal(result.success, false, "expected a failure envelope, not a thrown error");
if (!result.success) {
  assert.equal(result.error.code, "INTERNAL");
  assert.ok(result.error.error.length > 0, "error message must not be empty");
}

console.log("PASS analyze-resilience: Redis outage returns a typed error envelope");
