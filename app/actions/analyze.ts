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
  walletAddress: string,
  rpcUrl: string
): Promise<TokenHolding[]> {
  const response = await fetch(rpcUrl, {
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

    if (valueUsd < 0.01 && uiBalance < 0.000001) continue;

    holdings.push({
      mint: data.id,
      symbol: data.content.metadata.symbol,
      name: data.content.metadata.name,
      balance: uiBalance,
      priceUsd,
      valueUsd,
      allocationPct: 0,
      logoUri: data.content.links?.image ?? "",
      isKnownYieldPosition: false,
    });
  }

  if (nativeBalance) {
    const solBalance = (nativeBalance.lamports ?? 0) / 1e9;
    const solPrice = nativeBalance.price_per_sol ?? 0;
    const solValue = nativeBalance.total_price ?? solBalance * solPrice;

    if (solBalance > 0) {
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
        isKnownYieldPosition: false,
      });
    }
  }

  const totalValue = holdings.reduce((s, h) => s + h.valueUsd, 0);
  if (totalValue > 0) {
    for (const h of holdings) {
      h.allocationPct = Number(((h.valueUsd / totalValue) * 100).toFixed(2));
    }
  }

  holdings.sort((a, b) => b.valueUsd - a.valueUsd);
  return holdings;
}

// ─── Jupiter V3: Fetch real-time prices ──────────────────────────────────────

async function enrichWithJupiterPrices(
  holdings: TokenHolding[]
): Promise<TokenHolding[]> {
  const needsPricing = holdings.filter((h) => h.priceUsd === 0);
  if (needsPricing.length === 0) return holdings;

  const mintIds = needsPricing.map((h) => h.mint).join(",");

  try {
    const res = await fetch(`https://api.jup.ag/price/v3?ids=${mintIds}`, {
      headers: { "x-api-key": env.JUPITER_API_KEY },
    });

    if (!res.ok) return holdings;

    const json = await res.json();
    const priceData = json.data;
    if (!priceData) return holdings;

    const parsed = JupiterPriceSchema.safeParse(priceData);
    if (!parsed.success) return holdings;

    for (const h of holdings) {
      const price = parsed.data[h.mint];
      if (price && h.priceUsd === 0) {
        h.priceUsd = parseFloat(price.price);
        h.valueUsd = h.balance * h.priceUsd;
      }
    }

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
  if (holdings.length === 0) {
    return `Your wallet appears to be empty – no assets were detected.

There are no concentration risks or yield opportunities to analyze at this time.

To get a meaningful analysis, please deposit some SOL or SPL tokens into your wallet and refresh the dashboard.`;
  }

  const top20 = [...holdings]
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, 20);

  const portfolioSummary = top20
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
    `Idle Capital: $${riskReport.idleCapital.reduce((s, a) => s + a.valueUsd, 0).toFixed(2)}`,
  ].join("\n");

  const yieldSummary =
    yieldMatches.length > 0
      ? yieldMatches
        .map(
          (ym) =>
            `${ym.tokenSymbol}: Top pool = ${ym.opportunities[0]?.protocol} @ ${ym.opportunities[0]?.apyTotal.toFixed(2)}% APY`
        )
        .join("\n")
      : "No yield opportunities matched.";

  const prompt = `You are a DeFi strategist for Solana. Analyze this portfolio and provide a concise strategic assessment in 3-5 paragraphs of markdown.
  
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


  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional Solana DeFi strategist. Format in markdown.",
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
    return "AI synthesis unavailable at this moment.";
  }
}

// ─── Main Server Action ─────────────────────────────────────────────────────

const WalletInputSchema = z.object({
  walletAddress: z
    .string()
    .min(32)
    .max(44)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 address"),
  cluster: z.enum(["mainnet-beta", "devnet"]).default("mainnet-beta"),
});

export async function analyzePortfolio(
  walletAddress: string,
  cluster: "mainnet-beta" | "devnet" = "mainnet-beta"
): Promise<AnalysisResponse> {
  const input = WalletInputSchema.safeParse({ walletAddress, cluster });
  if (!input.success) {
    return {
      success: false,
      error: { error: "Invalid input parameters", code: "INVALID_WALLET" },
    };
  }

  const { ratelimit, groq } = getClients();
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
    const rpcUrl =
      cluster === "devnet" ? env.HELIUS_DEVNET_RPC_URL : env.HELIUS_RPC_URL;
    let holdings = await fetchHeliusBalances(walletAddress, rpcUrl);

    if (cluster === "mainnet-beta") {
      holdings = await enrichWithJupiterPrices(holdings);
    } else {
      for (const h of holdings) {
        if (h.priceUsd === 0) {
          h.priceUsd = 1.0;
          h.valueUsd = h.balance * h.priceUsd;
        }
      }
      const totalValue = holdings.reduce((s, h) => s + h.valueUsd, 0);
      if (totalValue > 0) {
        for (const h of holdings) {
          h.allocationPct = Number(((h.valueUsd / totalValue) * 100).toFixed(2));
        }
      }
    }

    const riskReport = generateRiskReport(holdings);
    const yieldMatches =
      cluster === "mainnet-beta"
        ? await matchYieldOpportunities(riskReport.idleCapital)
        : [];

    const aiSummary = await synthesizeWithAI(
      holdings,
      riskReport,
      yieldMatches,
      groq
    );

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
