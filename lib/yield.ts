/**
 * Yield Matcher – matches wallet tokens against real DeFi yield pools.
 *
 * Sources: DefiLlama API (free, no key required).
 * Protocols: Kamino, Drift, MarginFi.
 */

import { z } from "zod";
import { getProtocolMetadata } from "./registry";
import { type TokenHolding } from "./engine";

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

export interface EnrichedRoute {
  poolId: string;
  poolName: string;
  protocolName: string;
  apy: number;
  routeStatus: "verified" | "unverified";
  redirectUrl?: string;
  score: number;
  reasoning: string;
}

export interface AssetGroupOpportunity {
  mint: string;
  symbol: string;
  balance: number;
  valueUsd: number;
  logoUri?: string;
  opportunities: EnrichedRoute[];
  stateClassification: "ACTIVE_CALIBRATED" | "SIZE_WARNING_ACTIVE" | "NO_ACTIVE_ROUTES" | "DISCOVERY_OFFLINE";
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
  PYUSD: ["PYUSD"],
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

  try {
    const res = await fetch("https://yields.llama.fi/pools", {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error("[yield] DefiLlama API error:", res.status);
      return poolCache?.data ?? [];
    }

    const json = await res.json();
    const allPools = (json.data as unknown[]) ?? [];

    // Filter dynamically to Solana chain pools only
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
  } catch (err) {
    console.error("[yield] Network error fetching Solana pools:", err);
    return poolCache?.data ?? [];
  }
}

export const MAX_OPPORTUNITIES_PER_ASSET = 2;

/**
 * Match idle wallet tokens to yield opportunities using Multi-Layer Scoring.
 * Pre-sorted and pre-sliced to exactly MAX_OPPORTUNITIES_PER_ASSET per asset.
 */
export async function matchYieldOpportunities(
  holdings: TokenHolding[]
): Promise<AssetGroupOpportunity[]> {
  if (holdings.length === 0) return [];

  const pools = await fetchSolanaYieldPools();
  
  // Set discovery offline flag if API fetch completely failed or cached data is missing
  const isOffline = pools.length === 0;
  
  const results: AssetGroupOpportunity[] = [];

  for (const asset of holdings) {
    const userMintLower = asset.mint.toLowerCase();
    const userSymbolUpper = asset.symbol.toUpperCase();
    const aliases = TOKEN_MATCH_ALIASES[userSymbolUpper] ?? [userSymbolUpper];

    const matchedRoutes: EnrichedRoute[] = [];

    // Perform matching if online
    if (!isOffline) {
      for (const pool of pools) {
        let matchedScore = 0;
        let matchReason = "";

        // Tier 1: Exact Mint Address Match
        if (pool.underlyingTokens && pool.underlyingTokens.length > 0) {
          const hasMintMatch = pool.underlyingTokens.some(
            (t) => t.toLowerCase() === userMintLower
          );
          if (hasMintMatch) {
            matchedScore = 100;
            matchReason = "Exact on-chain mint address match verified.";
          }
        }

        // Tier 2: Canonical Symbol Match (Only if asset price is resolved for security safety!)
        const isPriced = asset.priceUsd > 0;
        if (matchedScore === 0 && isPriced) {
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
          // Enriched via central Protocol Registry
          const metadata = getProtocolMetadata(pool.project);

          matchedRoutes.push({
            poolId: pool.pool,
            poolName: pool.symbol,
            protocolName: metadata.displayName,
            apy: apyTotal,
            routeStatus: metadata.status,
            redirectUrl: metadata.officialUrl,
            score: matchedScore,
            reasoning: matchReason,
          });
        }
      }
    }

    // Sort matching routes in this asset group
    matchedRoutes.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.apy - a.apy;
    });

    const slicedRoutes = matchedRoutes.slice(0, MAX_OPPORTUNITIES_PER_ASSET);

    // Determine stateClassification based on matching outcomes and balance thresholds
    let stateClassification: "ACTIVE_CALIBRATED" | "SIZE_WARNING_ACTIVE" | "NO_ACTIVE_ROUTES" | "DISCOVERY_OFFLINE";

    if (isOffline) {
      stateClassification = "DISCOVERY_OFFLINE";
    } else if (slicedRoutes.length === 0) {
      stateClassification = "NO_ACTIVE_ROUTES";
    } else if (asset.valueUsd <= 50) {
      stateClassification = "SIZE_WARNING_ACTIVE";
    } else {
      stateClassification = "ACTIVE_CALIBRATED";
    }

    results.push({
      mint: asset.mint,
      symbol: asset.symbol,
      balance: asset.balance,
      valueUsd: asset.valueUsd,
      logoUri: asset.logoUri,
      opportunities: slicedRoutes,
      stateClassification,
    });
  }

  // Dev-mode table telemetry
  if (process.env.NODE_ENV === "development") {
    console.log("\n====== YIELD OPPORTUNITIES TELEMETRY (V2.2) ======");
    results.forEach((r) => {
      console.log(`\nAsset: ${r.symbol} | Balance: ${r.balance} | Value: $${r.valueUsd.toFixed(2)} | State: ${r.stateClassification}`);
      const telemetryTable = r.opportunities.map((opp) => ({
        Protocol: opp.protocolName,
        Pool: opp.poolName,
        APY: `${opp.apy.toFixed(2)}%`,
        Certainty: `${opp.score}%`,
        Reason: opp.reasoning
      }));
      console.table(telemetryTable);
    });
    console.log("==================================================\n");
  }

  return results;
}
