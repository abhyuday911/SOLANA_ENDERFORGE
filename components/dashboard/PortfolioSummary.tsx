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
    <div className="rounded-3xl border-milled-bevel bg-graphite-plate shadow-milled-elevated overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-950/40">
        
        {/* Cell 1: Total Value */}
        <div className="p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase">
              TOTAL CAPITAL VALUE
            </span>
            <Wallet className="size-3.5 text-zinc-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-100 tracking-tight">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">
              Across {tokenCount} active assets
            </p>
          </div>
        </div>

        {/* Cell 2: Concentration Index */}
        <div className="p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase">
              CONCENTRATION INDEX
            </span>
            <Zap className="size-3.5 text-zinc-500" />
          </div>
          <div className="">
            {tokenCount > 0 ? (
              <div className={cn(
                "text-xl sm:text-2xl font-black font-mono tracking-tight",
                isHealthy ? "text-orange-500" : isWarning ? "text-amber-500" : "text-rose-500"
              )}>
                {hhiScore}<span className="text-zinc-500 text-xs font-normal ml-0.5 font-mono">/100</span>
              </div>
            ) : (
              <div className="text-xl sm:text-2xl font-black font-mono text-zinc-400 tracking-tight">—</div>
            )}
            <p className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">
              {tokenCount > 0 ? "HHI CALIBRATION INDEX" : "NO ASSETS – INDEX N/A"}
            </p>
          </div>
        </div>

        {/* Cell 3: High Exposure Count */}
        <div className="p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase">
              HIGH EXPOSURE COUNT
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
            <p className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">
              Assets &gt; 25% allocation
            </p>
          </div>
        </div>

        {/* Cell 4: Yield Potential */}
        <div className="p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase">
              LIQUID OPTIMIZATION
            </span>
            <TrendingUp className="size-3.5 text-zinc-500" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-500 tracking-tight">
              OPTIMIZED
            </div>
            <p className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">
              Yield routes fully ready
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
