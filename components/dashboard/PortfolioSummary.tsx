"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Wallet, PieChart, Activity } from "lucide-react";

interface PortfolioSummaryProps {
  totalValue: number;
  tokenCount: number;
  hhiScore: number;
  concentrationRiskCount: number;
}

export function PortfolioSummary({
  totalValue,
  tokenCount,
  hhiScore,
  concentrationRiskCount,
}: PortfolioSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card size="sm" className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-zinc-400">Total Value</CardTitle>
          <Wallet className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-zinc-500 mt-1">Across {tokenCount} assets</p>
        </CardContent>
      </Card>

      <Card size="sm" className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-zinc-400">Diversification</CardTitle>
          <PieChart className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{hhiScore}/100</div>
          <p className="text-xs text-zinc-500 mt-1">HHI Multi-asset score</p>
        </CardContent>
      </Card>

      <Card size="sm" className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-zinc-400">Risk Flags</CardTitle>
          <Activity className="h-4 w-4 text-rose-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{concentrationRiskCount}</div>
          <p className="text-xs text-zinc-500 mt-1">Assets &gt; 25% allocation</p>
        </CardContent>
      </Card>

      <Card size="sm" className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-zinc-400">Yield Potential</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Active</div>
          <p className="text-xs text-emerald-400/70 mt-1">Optimization available</p>
        </CardContent>
      </Card>
    </div>
  );
}
