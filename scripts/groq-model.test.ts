/**
 * Live check: the Groq model analyzePortfolio requests must exist on this API key.
 *
 * Bug (2026-09-17): Groq retired llama-3.3-70b-versatile. Every chat completion
 * returned 404 model_not_found, so production showed "AI synthesis is temporarily
 * unavailable" for every wallet while local looked fine until the dev server restarted.
 *
 * Run: bun scripts/groq-model.test.ts   (bun loads GROQ_API_KEY from .env.local)
 */
import assert from "node:assert/strict";
import { GROQ_MODEL } from "../lib/ai-model";

const key = process.env.GROQ_API_KEY;
assert.ok(key, "GROQ_API_KEY is not set");

const res = await fetch("https://api.groq.com/openai/v1/models", {
  headers: { Authorization: `Bearer ${key}` },
});
assert.equal(res.status, 200, `Groq /models returned HTTP ${res.status}`);

const ids = ((await res.json()).data as { id: string }[]).map((m) => m.id);
assert.ok(
  ids.includes(GROQ_MODEL),
  `Groq model "${GROQ_MODEL}" is not available to this key. Available: ${ids.join(", ")}`
);

console.log(`PASS groq-model: ${GROQ_MODEL} is available on this key`);
