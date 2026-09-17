import type { TokenHolding, RiskReport } from "@/lib/engine";
import type { AssetGroupOpportunity } from "@/lib/yield";

/** Groq chat model used by analyzePortfolio. Asserted live by scripts/groq-model.test.ts. */
export const GROQ_MODEL = "openai/gpt-oss-120b";

/**
 * Holdings and yield lines included in the prompt. Groq's free tier allows
 * 8,000 tokens/min on GROQ_MODEL; the unbounded yield list produced a
 * 14,244-token request for a 1,000-token wallet (2026-09-17). 20 + 20 lines
 * plus instructions stays under ~1k prompt tokens.
 */
const PROMPT_TOP_N = 20;

export function buildAnalysisPrompt(
  holdings: TokenHolding[],
  riskReport: RiskReport,
  activeYieldOpportunities: AssetGroupOpportunity[]
): string {
  const top = [...holdings]
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, PROMPT_TOP_N);
  const topMints = new Set(top.map((h) => h.mint));

  const portfolioSummary = top
    .map(
      (h, i) =>
        `${i + 1}. ${h.symbol}: $${h.valueUsd.toFixed(2)} (${h.allocationPct}%)`
    )
    .join("\n");

  const riskSummary = [
    `HHI Score: ${riskReport.hhiScore}/100`,
    riskReport.concentrationRisks.length > 0
      ? `Concentration Risks: ${riskReport.concentrationRisks.map((c) => `${c.symbol} at ${c.allocationPct.toFixed(1)}%`).join(", ")}`
      : "No concentration risks detected.",
  ].join("\n");

  // Only assets already in the portfolio section, and only groups with a real route
  // (groups without one used to render as "Top pool = undefined @ undefined% APY").
  const yieldLines = activeYieldOpportunities
    .filter((ym) => topMints.has(ym.mint) && ym.opportunities.length > 0)
    .slice(0, PROMPT_TOP_N)
    .map(
      (ym) =>
        `${ym.symbol}: Top pool = ${ym.opportunities[0].protocolName} @ ${ym.opportunities[0].apy.toFixed(2)}% APY`
    );
  const yieldSummary =
    yieldLines.length > 0 ? yieldLines.join("\n") : "No yield opportunities matched.";

  return `You are a DeFi strategist for Solana. Analyze this portfolio and provide a concise strategic assessment in 3-5 paragraphs of markdown.

## Portfolio
${portfolioSummary}

## Risk Analysis
${riskSummary}

## Yield Opportunities
${yieldSummary}

IMPORTANT:
- Highlight key yield opportunities and specific strategies by wrapping them in double asterisks **like this**.
- DO NOT use HTML tags like <font> or <span>.
- Use a professional yet encouraging tone.
- Ensure the assessment is data-driven.`;
}
