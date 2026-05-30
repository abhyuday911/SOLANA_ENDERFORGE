/**
 * Yield Matcher – matches wallet tokens against real DeFi yield pools.
 *
 * Sources: DefiLlama API (free, no key required).
 * Protocols: Kamino, Drift, MarginFi.
 */

import { z } from "zod";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface YieldPool {
  /** DefiLlama pool ID */
  poolId: string;
  /** Protocol name */
  protocol: string;
  /** Pool symbol / name */
  poolName: string;
  /** Base APY (without rewards) */
  apyBase: number;
  /** Reward APY (incentive tokens) */
  apyReward: number;
  /** Total APY */
  apyTotal: number;
  /** TVL in USD */
  tvlUsd: number;
  /** Underlying token symbols */
  underlyingTokens: string[];
  /** Pool chain */
  chain: string;
}

export interface YieldMatch {
  /** The wallet token this applies to */
  tokenSymbol: string;
  /** Idle value available for deployment */
  idleValueUsd: number;
  /** Matched yield opportunities, sorted by APY desc */
  opportunities: YieldPool[];
}

// ─── DefiLlama response validation ──────────────────────────────────────────

const DefiLlamaPoolSchema = z.object({
  pool: z.string(),
  project: z.string(),
  symbol: z.string(),
  chain: z.string(),
  apyBase: z.number().nullable().optional(),
  apyReward: z.number().nullable().optional(),
  apy: z.number().nullable().optional(),
  tvlUsd: z.number(),
});

type DefiLlamaPool = z.infer<typeof DefiLlamaPoolSchema>;

// ─── Target protocols on Solana ──────────────────────────────────────────────

const TARGET_PROTOCOLS = new Set([
  "kamino-lending",
  "kamino-liquidity",
  "drift",
  "marginfi",
  "marinade-finance",
  "jito",
]);

// ─── Token symbol matching map ───────────────────────────────────────────────

const TOKEN_MATCH_ALIASES: Record<string, string[]> = {
  SOL: ["SOL", "WSOL", "stSOL", "mSOL", "JitoSOL", "bSOL"],
  USDC: ["USDC"],
  USDT: ["USDT"],
  BONK: ["BONK"],
  JTO: ["JTO"],
  JUP: ["JUP"],
  WIF: ["WIF"],
  PYTH: ["PYTH"],
};

/**
 * Fetch Solana yield pools from DefiLlama for our target protocols.
 * Caches in-memory for 5 minutes.
 */
let poolCache: { data: DefiLlamaPool[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function fetchSolanaYieldPools(): Promise<DefiLlamaPool[]> {
  if (poolCache && Date.now() - poolCache.timestamp < CACHE_TTL) {
    return poolCache.data;
  }

  const res = await fetch("https://yields.llama.fi/pools", {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error("[yield] DefiLlama API error:", res.status);
    return poolCache?.data ?? [];
  }

  const json = await res.json();
  const allPools = (json.data as unknown[]) ?? [];

  // Filter to Solana + target protocols
  const solanaPoolsRaw = allPools.filter((p: unknown) => {
    const pool = p as Record<string, unknown>;
    return (
      pool.chain === "Solana" &&
      typeof pool.project === "string" &&
      TARGET_PROTOCOLS.has(pool.project)
    );
  });

  const solanaPools: DefiLlamaPool[] = [];
  for (const raw of solanaPoolsRaw) {
    const parsed = DefiLlamaPoolSchema.safeParse(raw);
    if (parsed.success) {
      solanaPools.push(parsed.data);
    }
  }

  poolCache = { data: solanaPools, timestamp: Date.now() };
  return solanaPools;
}

/**
 * Match idle wallet tokens to yield opportunities.
 */
export async function matchYieldOpportunities(
  idleAssets: { symbol: string; valueUsd: number; mint: string }[]
): Promise<YieldMatch[]> {
  if (idleAssets.length === 0) return [];

  const pools = await fetchSolanaYieldPools();
  const matches: YieldMatch[] = [];

  for (const asset of idleAssets) {
    const aliases = TOKEN_MATCH_ALIASES[asset.symbol.toUpperCase()] ?? [
      asset.symbol.toUpperCase(),
    ];

    const opportunities = pools
      .filter((p) => {
        const poolSymbol = p.symbol.toUpperCase();
        return aliases.some(
          (alias) =>
            poolSymbol.includes(alias.toUpperCase()) ||
            poolSymbol.startsWith(alias.toUpperCase())
        );
      })
      .map(
        (p): YieldPool => ({
          poolId: p.pool,
          protocol: p.project,
          poolName: p.symbol,
          apyBase: p.apyBase ?? 0,
          apyReward: p.apyReward ?? 0,
          apyTotal: p.apy ?? (p.apyBase ?? 0) + (p.apyReward ?? 0),
          tvlUsd: p.tvlUsd,
          underlyingTokens: p.symbol.split("-"),
          chain: p.chain,
        })
      )
      .filter((p) => p.apyTotal > 0 && p.tvlUsd > 10_000)
      .sort((a, b) => b.apyTotal - a.apyTotal)
      .slice(0, 5); // Top 5 pools per asset

    if (opportunities.length > 0) {
      matches.push({
        tokenSymbol: asset.symbol,
        idleValueUsd: asset.valueUsd,
        opportunities,
      });
    }
  }

  return matches;
}
