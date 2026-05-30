"use client";

import { Wallet, ShieldAlert, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Score mapping for color coding
  const isHealthy = hhiScore > 70;
  const isWarning = hhiScore <= 70 && hhiScore > 40;

  return (
    <div className="rounded-3xl border border-zinc-900/60 bg-zinc-900/10 backdrop-blur-xs overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-900/60">
        
        {/* Cell 1: Total Value */}
        <div className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase">
              Total Capital Value
            </span>
            <Wallet className="size-3.5 text-zinc-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-100 tracking-tight">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[9px] font-mono text-zinc-600 mt-1 uppercase">
              Across {tokenCount} live assets
            </p>
          </div>
        </div>

        {/* Cell 2: Concentration Index */}
        <div className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase">
              Concentration Index
            </span>
            <Zap className="size-3.5 text-zinc-500" />
          </div>
          <div>
            <div className={cn(
              "text-xl sm:text-2xl font-black font-mono tracking-tight",
              isHealthy ? "text-orange-500" : isWarning ? "text-amber-500" : "text-rose-500"
            )}>
              {hhiScore}
              <span className="text-zinc-600 text-xs font-normal ml-0.5 font-sans">/100</span>
            </div>
            <p className="text-[9px] font-mono text-zinc-600 mt-1 uppercase">
              HHI Calibration Metric
            </p>
          </div>
        </div>

        {/* Cell 3: High Exposure Count */}
        <div className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase">
              High Exposure Count
            </span>
            <ShieldAlert className="size-3.5 text-zinc-500" />
          </div>
          <div>
            <div className={cn(
              "text-xl sm:text-2xl font-black font-mono tracking-tight",
              concentrationRiskCount > 0 ? "text-amber-500" : "text-zinc-400"
            )}>
              {concentrationRiskCount}
            </div>
            <p className="text-[9px] font-mono text-zinc-600 mt-1 uppercase">
              Assets &gt; 25% allocation
            </p>
          </div>
        </div>

        {/* Cell 4: Yield Potential */}
        <div className="p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase">
              Liquid Optimization
            </span>
            <TrendingUp className="size-3.5 text-zinc-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-500 tracking-tight uppercase">
              Active APY
            </div>
            <p className="text-[9px] font-mono text-zinc-600 mt-1 uppercase">
              Optimizations Ready
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
