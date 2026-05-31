import { z } from "zod";

export const tokenHoldingSchema = z.object({
  mint: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  balance: z.number().finite().nonnegative(),
  priceUsd: z.number().finite().nonnegative(),
  valueUsd: z.number().finite().nonnegative(),
  allocationPct: z.number().finite().min(0).max(100),
  logoUri: z.string(),
});

export type TokenHolding = z.infer<typeof tokenHoldingSchema>;

export interface ConcentrationRisk {
  symbol: string;
  allocationPct: number;
  valueUsd: number;
  severity: "medium" | "high";
}

export interface RiskReport {
  totalValueUsd: number;
  hhiRaw: number;
  hhiScore: number;
  concentrationRisks: ConcentrationRisk[];
}

export const KNOWN_YIELD_MINTS = new Set<string>([
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
]);

export function withAllocations(holdings: TokenHolding[]): TokenHolding[] {
  const totalValueUsd = holdings.reduce((sum, holding) => sum + holding.valueUsd, 0);

  return holdings
    .map((holding) => ({
      ...holding,
      allocationPct:
        totalValueUsd > 0
          ? Number(((holding.valueUsd / totalValueUsd) * 100).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

export function analyzeConcentration(
  holdings: TokenHolding[]
): ConcentrationRisk[] {
  return holdings
    .filter((holding) => holding.allocationPct > 25)
    .map((holding) => ({
      symbol: holding.symbol,
      allocationPct: holding.allocationPct,
      valueUsd: holding.valueUsd,
      severity: holding.allocationPct > 50 ? "high" : "medium",
    }));
}

export function calculateHHI(holdings: TokenHolding[]): {
  hhiRaw: number;
  hhiScore: number;
} {
  if (holdings.length === 0) {
    return { hhiRaw: 0, hhiScore: 100 };
  }
 
  const hhiRaw = holdings.reduce(
    (sum, holding) => sum + holding.allocationPct ** 2,
    0
  );

  const minimumHHI = 10_000 / holdings.length;
  const range = 10_000 - minimumHHI;
  const normalized =
    range > 0 ? ((10_000 - hhiRaw) / range) * 99 + 1 : 1;

  return {
    hhiRaw: Number(hhiRaw.toFixed(0)),
    hhiScore: Math.max(1, Math.min(100, Math.round(normalized))),
  };
}

export function generateRiskReport(rawHoldings: TokenHolding[]): RiskReport {
  const holdings = withAllocations(rawHoldings);
  const totalValueUsd = holdings.reduce((sum, holding) => sum + holding.valueUsd, 0);
  const { hhiRaw, hhiScore } = calculateHHI(holdings);

  return {
    totalValueUsd,
    hhiRaw,
    hhiScore,
    concentrationRisks: analyzeConcentration(holdings),
  };
}
