/**
 * Regression check: the Groq prompt stays bounded regardless of wallet size.
 *
 * Bug (2026-09-17): the yield section listed every holding (1,000 lines for a
 * whale wallet, including "Top pool = undefined" for groups with no route), so
 * the request hit 14,244 tokens against Groq's 8,000 tokens/min free-tier cap and
 * the summary failed with 413 rate_limit_exceeded.
 *
 * Run: bun scripts/ai-prompt.test.ts
 */
import assert from "node:assert/strict";
import { buildAnalysisPrompt } from "../lib/ai-model";
import type { TokenHolding, RiskReport } from "../lib/engine";
import type { AssetGroupOpportunity, EnrichedRoute } from "../lib/yield";

const holdings: TokenHolding[] = Array.from({ length: 1000 }, (_, i) => ({
  mint: `mint${i}`,
  symbol: `TOKEN${i}`,
  name: `Token ${i}`,
  balance: 1,
  priceUsd: 1,
  valueUsd: 1000 - i,
  allocationPct: 0.1,
  logoUri: "",
}));

// Every other holding has no route; the rest have one.
const groups: AssetGroupOpportunity[] = holdings.map((h, i) => ({
  mint: h.mint,
  symbol: h.symbol,
  balance: h.balance,
  valueUsd: h.valueUsd,
  opportunities:
    i % 2 === 0 ? [{ protocolName: `Proto${i}`, apy: 5 } as unknown as EnrichedRoute] : [],
  stateClassification: i % 2 === 0 ? "ACTIVE_CALIBRATED" : "NO_ACTIVE_ROUTES",
}));

const riskReport = { hhiScore: 10, concentrationRisks: [] } as unknown as RiskReport;

const prompt = buildAnalysisPrompt(holdings, riskReport, groups);

// ~3.5 chars per token. 8,000 TPM minus 1,024 max_tokens leaves ~6,900 prompt
// tokens; 4,000 chars (~1,150 tokens) is a wide safety margin.
assert.ok(prompt.length < 4000, `prompt too long: ${prompt.length} chars`);
assert.ok(!prompt.includes("undefined"), "prompt renders 'undefined' for groups without routes");
assert.ok(prompt.includes("TOKEN0:") && !prompt.includes("TOKEN20:"), "portfolio should stop at the top 20");
assert.ok(prompt.includes("TOKEN18: Top pool = Proto18"), "yield line for a top-20 holding with a route is missing");
assert.ok(!prompt.includes("TOKEN22:"), "yield line leaked for a holding outside the top 20");

console.log(`PASS ai-prompt: bounded at ${prompt.length} chars for 1000 holdings / 1000 yield groups`);
