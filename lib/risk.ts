/**
 * Pool Risk Scoring Engine
 *
 * Implements the risk model defined in docs/00-core/risk-model.md and
 * the composite scoring formula from docs/00-core/yield-recommendation-principles.md:
 *
 *   compositeScore = riskScore * 0.5 + sustainabilityScore * 0.3 + liquidityScore * 0.2
 *
 * The final ranking score is then adjusted by a graduated APY decay multiplier
 * (see implementation_plan.md §1.1) to dampen the influence of extreme APY values.
 *
 * ADR-002 authority: ranking must prioritise Risk → Sustainability → Liquidity → APY.
 */

// ─── Risk Tiers ──────────────────────────────────────────────────────────────

export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export interface PoolRiskAssessment {
  tier: RiskTier;
  riskScore: number; // 0–100 (higher = safer)
  sustainabilityScore: number; // 0–100
  liquidityScore: number; // 0–100
  compositeScore: number; // weighted combination
  finalScore: number; // compositeScore × apyDecayMultiplier
  apyWarningTier: ApyWarningTier;
  factors: string[];
}

// ─── APY Warning Tiers ───────────────────────────────────────────────────────

export type ApyWarningTier = "NORMAL" | "ELEVATED" | "HIGH" | "EXTREME";

// ─── Configuration Constants ─────────────────────────────────────────────────

/** APY decay multiplier configuration (§1.1 of implementation plan) */
export const APY_PENALTY_CONFIG = {
  /** APY below this: no penalty (multiplier = 1.0) */
  DECAY_START: 50,
  /** Multiplier decays linearly from 1.0 → 0.7 */
  MODERATE_THRESHOLD: 150,
  /** Multiplier decays linearly from 0.7 → 0.3 */
  HIGH_THRESHOLD: 500,
  /** Multiplier decays linearly from 0.3 → 0.1 */
  EXTREME_THRESHOLD: 1000,
  /** Hard rejection — obvious data anomalies (empirically: 2 pools) */
  SAFETY_VALVE: 5000,
} as const;

/** TVL thresholds for risk tier classification (from risk-model.md) */
export const TVL_THRESHOLDS = {
  LOW: 50_000_000, // > $50M
  MEDIUM: 10_000_000, // $10M – $50M
  HIGH: 1_000_000, // $1M – $10M
  // < $1M → EXTREME
} as const;

/** Minimum TVL for inclusion (AGENT-OS invariant #2) */
export const MIN_TVL_USD = 50_000;

/** Composite score weights (from yield-recommendation-principles.md) */
export const COMPOSITE_WEIGHTS = {
  RISK: 0.5,
  SUSTAINABILITY: 0.3,
  LIQUIDITY: 0.2,
} as const;

// ─── APY Decay Multiplier ────────────────────────────────────────────────────

/**
 * Computes a graduated decay multiplier based on APY magnitude.
 * This dampens the influence of extreme APY values on the final ranking score
 * without hard-excluding pools (except obvious data anomalies > 5000%).
 *
 * Returns a value between 0.1 and 1.0, or -1 for hard rejection.
 */
export function apyDecayMultiplier(apy: number): number {
  const { DECAY_START, MODERATE_THRESHOLD, HIGH_THRESHOLD, EXTREME_THRESHOLD, SAFETY_VALVE } =
    APY_PENALTY_CONFIG;

  // Hard rejection for data anomalies
  if (apy > SAFETY_VALVE) return -1;

  // No penalty below decay start
  if (apy <= DECAY_START) return 1.0;

  // Linear interpolation between tiers
  if (apy <= MODERATE_THRESHOLD) {
    // 1.0 → 0.7
    const t = (apy - DECAY_START) / (MODERATE_THRESHOLD - DECAY_START);
    return 1.0 - t * 0.3;
  }

  if (apy <= HIGH_THRESHOLD) {
    // 0.7 → 0.3
    const t = (apy - MODERATE_THRESHOLD) / (HIGH_THRESHOLD - MODERATE_THRESHOLD);
    return 0.7 - t * 0.4;
  }

  if (apy <= EXTREME_THRESHOLD) {
    // 0.3 → 0.1
    const t = (apy - HIGH_THRESHOLD) / (EXTREME_THRESHOLD - HIGH_THRESHOLD);
    return 0.3 - t * 0.2;
  }

  // 1000 – 5000: floor at 0.1
  return 0.1;
}

// ─── APY Warning Tier ────────────────────────────────────────────────────────

/**
 * Classifies APY into a warning tier for UI display.
 */
export function classifyApyWarningTier(apy: number): ApyWarningTier {
  if (apy <= 50) return "NORMAL";
  if (apy <= 150) return "ELEVATED";
  if (apy <= 500) return "HIGH";
  return "EXTREME";
}

// ─── Exposure Type Detection ─────────────────────────────────────────────────

export type ExposureType = "SINGLE" | "LP";

/**
 * Detects whether a pool symbol represents a multi-token LP position.
 * LP positions carry impermanent loss risk and warrant a ranking penalty.
 *
 * Heuristics:
 * - Symbol contains "-" or "/" separator (e.g., "WSOL-BRCA", "SOL/USDC")
 * - Underlying tokens array has 2+ entries
 */
export function detectExposureType(
  symbol: string,
  underlyingTokens: string[] | null | undefined
): ExposureType {
  // Check underlying tokens first (most reliable)
  if (underlyingTokens && underlyingTokens.length >= 2) {
    return "LP";
  }

  // Heuristic: symbol separator indicates multi-token LP
  if (symbol.includes("-") || symbol.includes("/")) {
    return "LP";
  }

  return "SINGLE";
}

// ─── Risk Tier Classification ────────────────────────────────────────────────

interface PoolRiskInput {
  tvlUsd: number;
  isVerified: boolean;
  apyTotal: number;
  apyBase: number;
  apyReward: number;
  exposureType: ExposureType;
}

/**
 * Classifies a pool into a risk tier and computes a 0–100 risk score.
 * Higher score = safer pool.
 *
 * Factors considered (from risk-model.md):
 * - TVL (absolute)
 * - Protocol verification status
 * - APY warning tier (proxy for volatility)
 * - Exposure type (LP vs single-asset)
 */
export function calculateRiskScore(input: PoolRiskInput): {
  tier: RiskTier;
  riskScore: number;
  factors: string[];
} {
  const factors: string[] = [];
  let score = 50; // Base score

  // ── TVL component (0 to +30) ───────────────────────────────────────────
  if (input.tvlUsd >= TVL_THRESHOLDS.LOW) {
    score += 30;
    factors.push("TVL > $50M (Low risk)");
  } else if (input.tvlUsd >= TVL_THRESHOLDS.MEDIUM) {
    score += 20;
    factors.push("TVL $10M–$50M (Medium risk)");
  } else if (input.tvlUsd >= TVL_THRESHOLDS.HIGH) {
    score += 5;
    factors.push("TVL $1M–$10M (High risk)");
  } else {
    score -= 15;
    factors.push("TVL < $1M (Extreme risk)");
  }

  // ── Verification component (+15 / -15) ─────────────────────────────────
  if (input.isVerified) {
    score += 15;
    factors.push("Protocol verified");
  } else {
    score -= 15;
    factors.push("Protocol unverified — no audit data");
  }

  // ── APY volatility proxy (-0 to -10) ───────────────────────────────────
  const apyTier = classifyApyWarningTier(input.apyTotal);
  if (apyTier === "EXTREME") {
    score -= 10;
    factors.push("Extreme APY — likely temporary or volatile");
  } else if (apyTier === "HIGH") {
    score -= 5;
    factors.push("High APY — elevated volatility risk");
  }

  // ── Exposure type (-5 for LP) ──────────────────────────────────────────
  if (input.exposureType === "LP") {
    score -= 5;
    factors.push("LP position — impermanent loss risk");
  }

  // Clamp to 0–100
  score = Math.max(0, Math.min(100, score));

  // Determine tier from TVL (primary) + verification
  let tier: RiskTier;
  if (input.tvlUsd >= TVL_THRESHOLDS.LOW && input.isVerified) {
    tier = "LOW";
  } else if (input.tvlUsd >= TVL_THRESHOLDS.MEDIUM) {
    tier = "MEDIUM";
  } else if (input.tvlUsd >= TVL_THRESHOLDS.HIGH) {
    tier = "HIGH";
  } else {
    tier = "EXTREME";
  }

  return { tier, riskScore: score, factors };
}

// ─── Sustainability Score ────────────────────────────────────────────────────

/**
 * Scores a pool based on yield sustainability (0–100).
 * Higher score = more sustainable yield source.
 *
 * Factors:
 * - Base APY ratio (organic fees vs emissions)
 * - APY magnitude (extreme APY is likely temporary)
 * - Exposure type (single-asset lending is more stable than LP)
 */
export function calculateSustainabilityScore(input: {
  apyTotal: number;
  apyBase: number;
  apyReward: number;
  exposureType: ExposureType;
}): number {
  let score = 50; // Base

  // ── Base APY ratio (+0 to +30) ─────────────────────────────────────────
  if (input.apyTotal > 0) {
    const baseRatio = input.apyBase / input.apyTotal;
    // 100% base = +30, 0% base = +0
    score += Math.round(baseRatio * 30);
  } else {
    score += 30; // No APY data = assume base-only
  }

  // ── APY magnitude penalty (-0 to -20) ──────────────────────────────────
  // Extreme APYs are statistically unlikely to sustain
  if (input.apyTotal > 500) {
    score -= 20;
  } else if (input.apyTotal > 150) {
    score -= 10;
  } else if (input.apyTotal > 50) {
    score -= 3;
  }

  // ── Exposure stability bonus (+10 for single-asset) ────────────────────
  if (input.exposureType === "SINGLE") {
    score += 10;
  }

  // ── Emissions-heavy penalty (-15) ──────────────────────────────────────
  if (input.apyReward > input.apyBase * 3 && input.apyReward > 10) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

// ─── Liquidity Score ─────────────────────────────────────────────────────────

/**
 * Scores a pool based on available liquidity (0–100).
 * Higher score = more liquid pool.
 */
export function calculateLiquidityScore(tvlUsd: number): number {
  if (tvlUsd >= 50_000_000) return 100;
  if (tvlUsd >= 10_000_000) return 75;
  if (tvlUsd >= 1_000_000) return 50;
  if (tvlUsd >= 500_000) return 35;
  if (tvlUsd >= 100_000) return 20;
  if (tvlUsd >= 50_000) return 10;
  return 5;
}

// ─── Full Pool Risk Assessment ───────────────────────────────────────────────

/**
 * Performs a complete risk assessment of a pool, computing all scores
 * and applying the APY decay multiplier to produce the final ranking score.
 *
 * This is the main entry point for the risk engine.
 */
export function assessPool(input: PoolRiskInput): PoolRiskAssessment {
  // Individual scores
  const { tier, riskScore, factors } = calculateRiskScore(input);

  const sustainabilityScore = calculateSustainabilityScore({
    apyTotal: input.apyTotal,
    apyBase: input.apyBase,
    apyReward: input.apyReward,
    exposureType: input.exposureType,
  });

  const liquidityScore = calculateLiquidityScore(input.tvlUsd);

  // Composite score (ADR-002 / yield-recommendation-principles.md)
  const compositeScore =
    riskScore * COMPOSITE_WEIGHTS.RISK +
    sustainabilityScore * COMPOSITE_WEIGHTS.SUSTAINABILITY +
    liquidityScore * COMPOSITE_WEIGHTS.LIQUIDITY;

  // APY decay multiplier (§1.1)
  const decay = apyDecayMultiplier(input.apyTotal);
  const finalScore = decay === -1 ? -1 : compositeScore * decay;

  const apyWarningTier = classifyApyWarningTier(input.apyTotal);

  return {
    tier,
    riskScore,
    sustainabilityScore,
    liquidityScore,
    compositeScore: Math.round(compositeScore * 100) / 100,
    finalScore: finalScore === -1 ? -1 : Math.round(finalScore * 100) / 100,
    apyWarningTier,
    factors,
  };
}
