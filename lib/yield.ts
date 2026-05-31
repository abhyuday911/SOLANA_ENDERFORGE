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
  /** Underlying token symbols/mints */
  underlyingTokens: string[];
  /** Pool chain */
  chain: string;
  /** Match Score (100 = Mint Match, 80 = Canonical Symbol Match) */
  score?: number;
  /** Reason for the match */
  reason?: string;
}

export interface YieldMatch {
  /** The wallet token this applies to */
  tokenSymbol: string;
  /** Idle value available for deployment */
  idleValueUsd: number;
  /** Matched yield opportunities, sorted by APY desc */
  opportunities: YieldPool[];
  /** Is this fallback data from global top yields? */
  isFallback?: boolean;
}

export async function getGlobalTopYields(limit: number = 5): Promise<YieldPool[]> {
  const pools = await fetchSolanaYieldPools();
  return pools
    .map(
      (p): YieldPool => ({
        poolId: p.pool,
        protocol: p.project,
        poolName: p.symbol,
        apyBase: p.apyBase ?? 0,
        apyReward: p.apyReward ?? 0,
        apyTotal: p.apy ?? (p.apyBase ?? 0) + (p.apyReward ?? 0),
        tvlUsd: p.tvlUsd,
        underlyingTokens: p.underlyingTokens ?? [],
        chain: p.chain,
        score: 100,
        reason: "Global featured yield route."
      })
    )
    .filter((p) => p.apyTotal > 0 && p.tvlUsd > 10_000)
    .sort((a, b) => b.apyTotal - a.apyTotal)
    .slice(0, limit);
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
  underlyingTokens: z.array(z.string()).nullable().optional(),
});

type DefiLlamaPool = z.infer<typeof DefiLlamaPoolSchema>;

// Whitelists removed completely for discovery-driven dynamic matching

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
 * Fetch Solana yield pools from DefiLlama.
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

  // Filter dynamically to Solana chain pools only (SLUG-AGNOSTIC!)
  const solanaPoolsRaw = allPools.filter((p: unknown) => {
    const pool = p as Record<string, unknown>;
    return pool.chain === "Solana";
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
 * Match idle wallet tokens to yield opportunities using Multi-Layer Scoring.
 */
export async function matchYieldOpportunities(
  idleAssets: { symbol: string; valueUsd: number; mint: string }[]
): Promise<YieldMatch[]> {
  if (idleAssets.length === 0) return [];

  const pools = await fetchSolanaYieldPools();
  const matches: YieldMatch[] = [];

  for (const asset of idleAssets) {
    const userMintLower = asset.mint.toLowerCase();
    const userSymbolUpper = asset.symbol.toUpperCase();
    const aliases = TOKEN_MATCH_ALIASES[userSymbolUpper] ?? [userSymbolUpper];

    const opportunities: YieldPool[] = [];

    for (const pool of pools) {
      let matchedScore = 0;
      let matchReason = "";

      // Tier 1: Mint Address Match
      if (pool.underlyingTokens && pool.underlyingTokens.length > 0) {
        const hasMintMatch = pool.underlyingTokens.some(
          (t) => t.toLowerCase() === userMintLower
        );
        if (hasMintMatch) {
          matchedScore = 100;
          matchReason = "Exact on-chain mint address match verified.";
        }
      }

      // Tier 2: Canonical Symbol Match
      if (matchedScore === 0) {
        const poolSymbolUpper = pool.symbol.toUpperCase();
        const isCanonicalMatch = aliases.some(
          (alias) => poolSymbolUpper === alias.toUpperCase()
        );
        if (isCanonicalMatch) {
          matchedScore = 80;
          matchReason = "Canonical symbol match resolved.";
        }
      }

      const apyTotal = pool.apy ?? (pool.apyBase ?? 0) + (pool.apyReward ?? 0);
      if (matchedScore > 0 && apyTotal > 0 && pool.tvlUsd > 10_000) {
        opportunities.push({
          poolId: pool.pool,
          protocol: pool.project,
          poolName: pool.symbol,
          apyBase: pool.apyBase ?? 0,
          apyReward: pool.apyReward ?? 0,
          apyTotal: apyTotal,
          tvlUsd: pool.tvlUsd,
          underlyingTokens: pool.underlyingTokens ?? [],
          chain: pool.chain,
          score: matchedScore,
          reason: matchReason,
        });
      }
    }

    if (opportunities.length > 0) {
      // Sort by score descending (Tier 1 first), then by APY descending
      opportunities.sort((a, b) => {
        if (b.score !== a.score) {
          return (b.score ?? 0) - (a.score ?? 0);
        }
        return b.apyTotal - a.apyTotal;
      });

      matches.push({
        tokenSymbol: asset.symbol,
        idleValueUsd: asset.valueUsd,
        opportunities: opportunities.slice(0, 10), // Return top 10 opportunities per asset
      });
    }
  }

  // Dev-mode table telemetry
  if (process.env.NODE_ENV === "development") {
    console.log("\n====== YIELD OPPORTUNITIES TELEMETRY ======");
    console.log(`[yield] Fetch - Total Solana pools scanned: ${pools.length}`);
    matches.forEach((m) => {
      console.log(`\nAsset: ${m.tokenSymbol} | Idle Value: $${m.idleValueUsd.toFixed(2)} | Matches Found: ${m.opportunities.length}`);
      const telemetryTable = m.opportunities.map((opp) => ({
        Protocol: opp.protocol,
        Pool: opp.poolName,
        APY: `${opp.apyTotal.toFixed(2)}%`,
        TVL: `$${opp.tvlUsd.toLocaleString()}`,
        Score: opp.score,
        Reason: opp.reason
      }));
      console.table(telemetryTable);
    });
    console.log("===========================================\n");
  }

  return matches;
}
