"use server";

/**
 * Master Analysis Pipeline – Server Action
 *
 * 1. Rate-limit via Upstash
 * 2. Fetch token balances via Helius DAS API
 * 3. Fetch real-time prices via Jupiter V3
 * 4. Run risk engines
 * 5. Match yield opportunities
 * 6. AI synthesis via Groq (llama-3.3-70b-versatile)
 */


import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import Groq from "groq-sdk";
import { env } from "@/lib/env";
import {
  type TokenHolding,
  generateRiskReport,
  type RiskReport,
} from "@/lib/engine";
import { matchYieldOpportunities, type YieldMatch } from "@/lib/yield";

// ─── Clients Helper ─────────────────────────────────────────────────────────

function getClients() {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "solana-yield-optimizer",
  });

  const groq = new Groq({ apiKey: env.GROQ_API_KEY });

  return { redis, ratelimit, groq };
}

// ─── Zod Schemas for API responses ───────────────────────────────────────────


const HeliusTokenSchema = z.object({
  interface: z.string().optional(),
  id: z.string(),
  content: z.object({
    metadata: z.object({
      name: z.string().default("Unknown"),
      symbol: z.string().default("???"),
    }),
    links: z
      .object({
        image: z.string().optional(),
      })
      .optional(),
  }),
  token_info: z
    .object({
      balance: z.number().default(0),
      decimals: z.number().default(0),
      price_info: z
        .object({
          price_per_token: z.number().default(0),
          total_price: z.number().default(0),
          currency: z.string().default(""),
        })
        .optional(),
    })
    .optional(),
});

const JupiterPriceSchema = z.record(
  z.string(),
  z.object({
    id: z.string(),
    type: z.string(),
    price: z.string(),
  })
);

// ─── Action Result Types ─────────────────────────────────────────────────────

export interface AnalysisResult {
  holdings: TokenHolding[];
  riskReport: RiskReport;
  yieldMatches: YieldMatch[];
  aiSummary: string;
  timestamp: number;
}

export interface AnalysisError {
  error: string;
  code: "RATE_LIMITED" | "FETCH_ERROR" | "INVALID_WALLET" | "INTERNAL";
}

export type AnalysisResponse =
  | { success: true; data: AnalysisResult }
  | { success: false; error: AnalysisError };

// ─── Helius DAS API: Fetch token balances ────────────────────────────────────

async function fetchHeliusBalances(
  walletAddress: string
): Promise<TokenHolding[]> {
  const url = env.HELIUS_RPC_URL;

  // Fetch fungible tokens via DAS
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "portfolio",
      method: "searchAssets",
      params: {
        ownerAddress: walletAddress,
        tokenType: "fungible",
        displayOptions: {
          showNativeBalance: true,
          showGrandTotal: false,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Helius API error: ${response.status}`);
  }

  const json = await response.json();
  const items = json.result?.items ?? [];
  const nativeBalance = json.result?.nativeBalance;

  const holdings: TokenHolding[] = [];

  // Parse token holdings
  for (const item of items) {
    const parsed = HeliusTokenSchema.safeParse(item);
    if (!parsed.success) continue;

    const { data } = parsed;
    const tokenInfo = data.token_info;
    if (!tokenInfo || tokenInfo.balance === 0) continue;

    const decimals = tokenInfo.decimals || 0;
    const rawBalance = tokenInfo.balance;
    const uiBalance = rawBalance / 10 ** decimals;
    const priceUsd = tokenInfo.price_info?.price_per_token ?? 0;
    const valueUsd = tokenInfo.price_info?.total_price ?? uiBalance * priceUsd;

    if (valueUsd < 0.01) continue; // Skip dust

    holdings.push({
      mint: data.id,
      symbol: data.content.metadata.symbol,
      name: data.content.metadata.name,
      balance: uiBalance,
      priceUsd,
      valueUsd,
      allocationPct: 0, // Calculated after we have totals
      logoUri: data.content.links?.image ?? "",
    });
  }

  // Add native SOL
  if (nativeBalance) {
    const solBalance = (nativeBalance.lamports ?? 0) / 1e9;
    const solPrice = nativeBalance.price_per_sol ?? 0;
    const solValue = nativeBalance.total_price ?? solBalance * solPrice;

    if (solValue > 0.01) {
      holdings.push({
        mint: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        balance: solBalance,
        priceUsd: solPrice,
        valueUsd: solValue,
        allocationPct: 0,
        logoUri:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      });
    }
  }

  // Calculate allocation percentages
  const totalValue = holdings.reduce((s, h) => s + h.valueUsd, 0);
  if (totalValue > 0) {
    for (const h of holdings) {
      h.allocationPct = Number(((h.valueUsd / totalValue) * 100).toFixed(2));
    }
  }

  // Sort by value descending
  holdings.sort((a, b) => b.valueUsd - a.valueUsd);

  return holdings;
}

// ─── Jupiter V3: Fetch real-time prices ──────────────────────────────────────

async function enrichWithJupiterPrices(
  holdings: TokenHolding[]
): Promise<TokenHolding[]> {
  // Only enrich tokens missing prices
  const needsPricing = holdings.filter((h) => h.priceUsd === 0);
  if (needsPricing.length === 0) return holdings;

  const mintIds = needsPricing.map((h) => h.mint).join(",");

  try {
    const res = await fetch(
      `https://api.jup.ag/price/v3?ids=${mintIds}`,
      {
        headers: {
          "x-api-key": env.JUPITER_API_KEY,
        },
      }
    );

    if (!res.ok) {
      console.warn("[jupiter] Price API error:", res.status);
      return holdings;
    }

    const json = await res.json();
    const priceData = json.data;
    if (!priceData) return holdings;

    const parsed = JupiterPriceSchema.safeParse(priceData);
    if (!parsed.success) return holdings;

    // Enrich prices
    for (const h of holdings) {
      const price = parsed.data[h.mint];
      if (price && h.priceUsd === 0) {
        h.priceUsd = parseFloat(price.price);
        h.valueUsd = h.balance * h.priceUsd;
      }
    }

    // Recalculate allocations
    const totalValue = holdings.reduce((s, h) => s + h.valueUsd, 0);
    if (totalValue > 0) {
      for (const h of holdings) {
        h.allocationPct = Number(((h.valueUsd / totalValue) * 100).toFixed(2));
      }
    }
  } catch (err) {
    console.error("[jupiter] Price fetch failed:", err);
  }

  return holdings;
}

// ─── Groq AI Synthesis ───────────────────────────────────────────────────────

async function synthesizeWithAI(
  holdings: TokenHolding[],
  riskReport: RiskReport,
  yieldMatches: YieldMatch[],
  groq: Groq
): Promise<string> {
  // Truncate to top 20 assets by value
  const top20 = holdings.slice(0, 20);

  const portfolioSummary = top20
    .map(
      (h, i) =>
        `${i + 1}. ${h.symbol}: $${h.valueUsd.toFixed(2)} (${h.allocationPct}%)`
    )
    .join("\n");

  const riskSummary = [
    `HHI Score: ${riskReport.hhiScore}/100 (${riskReport.hhiScore > 70 ? "well diversified" : riskReport.hhiScore > 40 ? "moderately concentrated" : "highly concentrated"})`,
    riskReport.concentrationRisks.length > 0
      ? `Concentration Risks: ${riskReport.concentrationRisks.map((c) => `${c.symbol} at ${c.allocationPct.toFixed(1)}%`).join(", ")}`
      : "No concentration risks detected.",
    `Idle Capital: $${riskReport.idleCapital.reduce((s, a) => s + a.valueUsd, 0).toFixed(2)} across ${riskReport.idleCapital.length} assets not in yield positions.`,
  ].join("\n");

  const yieldSummary =
    yieldMatches.length > 0
      ? yieldMatches
          .map(
            (ym) =>
              `${ym.tokenSymbol} ($${ym.idleValueUsd.toFixed(2)} idle): Top pool = ${ym.opportunities[0]?.protocol} @ ${ym.opportunities[0]?.apyTotal.toFixed(2)}% APY`
          )
          .join("\n")
      : "No yield opportunities matched.";

  const prompt = `You are a DeFi portfolio strategist for Solana. Analyze this portfolio and provide a concise strategic summary (3-5 paragraphs, markdown formatting).

## Portfolio (Top ${top20.length} assets, total: $${riskReport.totalValueUsd.toFixed(2)})
${portfolioSummary}

## Risk Analysis
${riskSummary}

## Available Yield Opportunities
${yieldSummary}

Provide:
1. A brief portfolio health assessment
2. Specific action items to reduce concentration risk
3. Yield optimization recommendations with estimated annual yield in USD
4. Any warnings about current positions

Be specific with numbers. Use emerald-themed positive language for yield opportunities. Keep it concise.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a professional DeFi strategist specializing in the Solana ecosystem. Provide actionable, data-driven advice. Format responses in markdown.",
        },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 1024,
    });


    return (
      completion.choices[0]?.message?.content ??
      "Unable to generate AI summary at this time."
    );
  } catch (err) {
    console.error("[groq] AI synthesis failed:", err);
    return "AI analysis temporarily unavailable. Please try again in a moment.";
  }
}

// ─── Main Server Action ─────────────────────────────────────────────────────

const WalletInputSchema = z.object({
  walletAddress: z
    .string()
    .min(32)
    .max(44)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 address"),
});

export async function analyzePortfolio(
  walletAddress: string
): Promise<AnalysisResponse> {
  // 1. Validate input
  const input = WalletInputSchema.safeParse({ walletAddress });
  if (!input.success) {
    return {
      success: false,
      error: {
        error: "Invalid wallet address",
        code: "INVALID_WALLET",
      },
    };
  }

  // 2. Client Initialization
  const { ratelimit, groq } = getClients();

  // 3. Rate-limit check
  const { success: rateLimitOk } = await ratelimit.limit(walletAddress);
  if (!rateLimitOk) {
    return {
      success: false,
      error: {
        error: "Rate limit exceeded. Please wait 60 seconds.",
        code: "RATE_LIMITED",
      },
    };
  }

  try {
    // 3. Fetch balances via Helius DAS
    let holdings = await fetchHeliusBalances(walletAddress);

    // 4. Enrich missing prices via Jupiter V3
    holdings = await enrichWithJupiterPrices(holdings);

    // 5. Generate risk report
    const riskReport = generateRiskReport(holdings);

    // 6. Match yield opportunities for idle capital
    const yieldMatches = await matchYieldOpportunities(riskReport.idleCapital);

    // 7. AI synthesis via Groq
    const aiSummary = await synthesizeWithAI(holdings, riskReport, yieldMatches, groq);

    return {
      success: true,
      data: {
        holdings,
        riskReport,
        yieldMatches,
        aiSummary,
        timestamp: Date.now(),
      },
    };
  } catch (err) {
    console.error("[analyze] Pipeline error:", err);
    return {
      success: false,
      error: {
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during analysis.",
        code: "INTERNAL",
      },
    };
  }
}
