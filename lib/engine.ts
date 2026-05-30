/**
 * Financial Math Engine – pure functions for portfolio risk analysis.
 *
 * All functions are side-effect free and work on plain arrays/objects.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TokenHolding {
  /** Token mint address */
  mint: string;
  /** Human-readable symbol (e.g. "SOL") */
  symbol: string;
  /** Token name */
  name: string;
  /** Raw balance (UI amount, already decimals-adjusted) */
  balance: number;
  /** USD price per unit */
  priceUsd: number;
  /** balance × priceUsd */
  valueUsd: number;
  /** Percentage of portfolio (0-100) */
  allocationPct: number;
  /** URI for token logo */
  logoUri: string;
}

export interface ConcentrationRisk {
  /** Token symbol that exceeds 25% threshold */
  symbol: string;
  /** Actual allocation percentage */
  allocationPct: number;
  /** Severity: "high" (>50%), "medium" (25-50%) */
  severity: "high" | "medium";
}

export interface RiskReport {
  /** HHI score 1..100 (100 = perfectly balanced) */
  hhiScore: number;
  /** Raw HHI value (sum of squared allocations, 0..10000) */
  hhiRaw: number;
  /** Tokens exceeding 25% concentration */
  concentrationRisks: ConcentrationRisk[];
  /** Tokens >$50 sitting idle (not in known yield positions) */
  idleCapital: IdleAsset[];
  /** Total portfolio value in USD */
  totalValueUsd: number;
}

export interface IdleAsset {
  symbol: string;
  valueUsd: number;
  mint: string;
}

// ─── Known yield position mints (tokens already in protocols) ────────────────

const KNOWN_YIELD_MINTS = new Set([
  // Kamino kTokens (example mints)
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", // JitoSOL
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",  // mSOL
  "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",  // bSOL
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj", // stSOL
  // MarginFi deposit receipts, Drift LP tokens, etc. – extend as needed
]);

// ─── Concentration Analysis ──────────────────────────────────────────────────

/**
 * Flag any asset exceeding 25% of total portfolio value.
 */
export function analyzeConcentration(
  holdings: TokenHolding[]
): ConcentrationRisk[] {
  return holdings
    .filter((h) => h.allocationPct > 25)
    .map((h) => ({
      symbol: h.symbol,
      allocationPct: h.allocationPct,
      severity: h.allocationPct > 50 ? ("high" as const) : ("medium" as const),
    }));
}

// ─── HHI (Herfindahl–Hirschman Index) ────────────────────────────────────────

/**
 * Calculate the HHI diversification score.
 *
 * HHI = Σ(allocation%)²
 *   - Perfectly concentrated (1 asset): HHI = 10,000
 *   - Perfectly balanced (100 assets @ 1%): HHI = 100
 *
 * We invert to a 1–100 intuitive score:
 *   score = max(1, 100 - ((hhiRaw - 100) / 99))
 *   → 100 = maximally diverse, 1 = maximally concentrated
 */
export function calculateHHI(holdings: TokenHolding[]): {
  hhiRaw: number;
  hhiScore: number;
} {
  if (holdings.length === 0) return { hhiRaw: 10000, hhiScore: 1 };

  const hhiRaw = holdings.reduce(
    (sum, h) => sum + h.allocationPct ** 2,
    0
  );

  // Normalize: 10000 → 1, 100 → 100
  const score = Math.max(1, Math.round(100 - ((hhiRaw - 100) / 99)));
  return { hhiRaw: Math.round(hhiRaw), hhiScore: Math.min(100, score) };
}

// ─── Idle Capital Detection ──────────────────────────────────────────────────

/**
 * Identify wallet tokens >$50 in value that are NOT in known yield protocols.
 */
export function findIdleCapital(holdings: TokenHolding[]): IdleAsset[] {
  return holdings
    .filter(
      (h) => h.valueUsd > 50 && !KNOWN_YIELD_MINTS.has(h.mint)
    )
    .map((h) => ({
      symbol: h.symbol,
      valueUsd: h.valueUsd,
      mint: h.mint,
    }));
}

// ─── Full Risk Report ────────────────────────────────────────────────────────

/**
 * Run all risk engines and return a unified report.
 */
export function generateRiskReport(holdings: TokenHolding[]): RiskReport {
  const totalValueUsd = holdings.reduce((s, h) => s + h.valueUsd, 0);
  const { hhiRaw, hhiScore } = calculateHHI(holdings);
  const concentrationRisks = analyzeConcentration(holdings);
  const idleCapital = findIdleCapital(holdings);

  return {
    hhiScore,
    hhiRaw,
    concentrationRisks,
    idleCapital,
    totalValueUsd,
  };
}
