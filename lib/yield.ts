/**
 * Yield Matcher – matches wallet tokens against real DeFi yield pools.
 *
 * Sources: DefiLlama API (free, no key required).
 * Protocols: Kamino, Drift, MarginFi, and all verified registry entries.
 *
 * Ranking: Composite risk-adjusted scoring per ADR-002.
 *   compositeScore = riskScore * 0.5 + sustainabilityScore * 0.3 + liquidityScore * 0.2
 *   finalScore = compositeScore × apyDecayMultiplier(apyTotal)
 *
 * Sort order: matchCertainty DESC → finalScore DESC → apy DESC (tie-breaker only)
 */

import { z } from "zod";
import { getProtocolMetadata } from "./registry";
import { type TokenHolding } from "./engine";
import {
  MIN_TVL_USD,
  assessPool,
  detectExposureType,
  type RiskTier,
  type ApyWarningTier,
  type ExposureType,
} from "./risk";

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
  /** Total APY (base + reward) */
  apy: number;
  /** Base APY — organic protocol yield (fees, interest) */
  apyBase: number;
  /** Reward APY — incentive token emissions */
  apyReward: number;
  routeStatus: "verified" | "unverified";
  redirectUrl?: string;
  /** Match certainty score (100 = mint match, 80 = symbol match) */
  score: number;
  reasoning: string;
  /** Pool risk tier (LOW / MEDIUM / HIGH / EXTREME) */
  riskTier: RiskTier;
  /** Risk score 0–100 (higher = safer) */
  riskScore: number;
  /** Sustainability score 0–100 */
  sustainabilityScore: number;
  /** Liquidity score 0–100 */
  liquidityScore: number;
  /** Composite score before APY decay */
  compositeScore: number;
  /** Final ranking score (compositeScore × apyDecayMultiplier) */
  finalScore: number;
  /** APY warning tier for UI display */
  apyWarningTier: ApyWarningTier;
  /** Exposure type: SINGLE (lending/staking) or LP (liquidity pool) */
  exposureType: ExposureType;
  /** Data source identifier */
  dataSource: "defillama";
  /** ISO timestamp of when pool data was fetched */
  fetchedAt: string;
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
 * Match idle wallet tokens to yield opportunities using risk-adjusted composite scoring.
 *
 * Ranking order (ADR-002 compliant):
 *   1. Match certainty (100 mint > 80 symbol)
 *   2. Final score (compositeScore × apyDecayMultiplier) — risk, sustainability, liquidity
 *   3. APY (tie-breaker only)
 *
 * Pre-sorted and pre-sliced to exactly MAX_OPPORTUNITIES_PER_ASSET per asset.
 */
export async function matchYieldOpportunities(
  holdings: TokenHolding[]
): Promise<AssetGroupOpportunity[]> {
  if (holdings.length === 0) return [];

  const pools = await fetchSolanaYieldPools();
  
  // Set discovery offline flag if API fetch completely failed or cached data is missing
  const isOffline = pools.length === 0;

  // Capture fetch timestamp for data source tracing (AGENT-OS invariant #3)
  const fetchedAt = poolCache
    ? new Date(poolCache.timestamp).toISOString()
    : new Date().toISOString();
  
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

        // Skip unmatched pools
        if (matchedScore === 0) continue;

        const apyBase = pool.apyBase ?? 0;
        const apyReward = pool.apyReward ?? 0;
        const apyTotal = pool.apy ?? (apyBase + apyReward);

        // ── Filters ──────────────────────────────────────────────────────
        // APY must be positive
        if (apyTotal <= 0) continue;
        // TVL minimum: $50,000 (AGENT-OS Non-Negotiable Invariant #2)
        if (pool.tvlUsd < MIN_TVL_USD) continue;

        // ── Risk Assessment ──────────────────────────────────────────────
        const metadata = getProtocolMetadata(pool.project);
        const exposureType = detectExposureType(pool.symbol, pool.underlyingTokens);

        const assessment = assessPool({
          tvlUsd: pool.tvlUsd,
          isVerified: metadata.status === "verified",
          apyTotal,
          apyBase,
          apyReward,
          exposureType,
        });

        // Hard reject: APY safety valve (data anomalies > 5000%)
        if (assessment.finalScore === -1) continue;

        // Hide EXTREME risk tier by default (AGENT-OS invariant #4)
        if (assessment.tier === "EXTREME") continue;

        matchedRoutes.push({
          poolId: pool.pool,
          poolName: pool.symbol,
          protocolName: metadata.displayName,
          apy: apyTotal,
          apyBase,
          apyReward,
          routeStatus: metadata.status,
          redirectUrl: metadata.officialUrl,
          score: matchedScore,
          reasoning: matchReason,
          riskTier: assessment.tier,
          riskScore: assessment.riskScore,
          sustainabilityScore: assessment.sustainabilityScore,
          liquidityScore: assessment.liquidityScore,
          compositeScore: assessment.compositeScore,
          finalScore: assessment.finalScore,
          apyWarningTier: assessment.apyWarningTier,
          exposureType,
          dataSource: "defillama",
          fetchedAt,
        });
      }
    }

    // ── ADR-002 Compliant Sort ────────────────────────────────────────────
    // 1. Match certainty (100 mint > 80 symbol)
    // 2. Final score (composite × APY decay) — risk, sustainability, liquidity
    // 3. APY as tie-breaker only
    matchedRoutes.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
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

  // Dev-mode table telemetry — V3.0 with full scoring breakdown
  if (process.env.NODE_ENV === "development") {
    console.log("\n====== YIELD OPPORTUNITIES TELEMETRY (V3.0 — Risk-Adjusted) ======");
    results.forEach((r) => {
      console.log(`\nAsset: ${r.symbol} | Balance: ${r.balance} | Value: $${r.valueUsd.toFixed(2)} | State: ${r.stateClassification}`);
      const telemetryTable = r.opportunities.map((opp) => ({
        Protocol: opp.protocolName,
        Pool: opp.poolName,
        APY: `${opp.apy.toFixed(2)}%`,
        "Base/Reward": `${opp.apyBase.toFixed(1)}% / ${opp.apyReward.toFixed(1)}%`,
        Certainty: `${opp.score}`,
        Risk: `${opp.riskTier} (${opp.riskScore})`,
        Sustain: opp.sustainabilityScore,
        Liquid: opp.liquidityScore,
        Composite: opp.compositeScore,
        Final: opp.finalScore,
        APYWarn: opp.apyWarningTier,
        Exposure: opp.exposureType,
      }));
      console.table(telemetryTable);
    });
    console.log("=================================================================\n");
  }

  return results;
}
