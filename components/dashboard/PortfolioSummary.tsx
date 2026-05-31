"use client";

import { Wallet, ShieldAlert, Zap, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricPopover } from "@/components/ui/metric-popover";

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
            {tokenCount > 0 ? (
              <MetricPopover
                id="hhi-summary-popover"
                title="HHI (Portfolio Concentration)"
                badgeText={
                  hhiScore > 70
                    ? "High Score"
                    : hhiScore > 40
                    ? "Medium Score"
                    : "Low Score"
                }
                badgeVariant={
                  hhiScore > 70
                    ? "success"
                    : hhiScore > 40
                    ? "warning"
                    : "critical"
                }
                footerLeft="CALCULATED VIA ON-CHAIN DATA"
                footerRight="REAL-TIME"
                align="center"
                position="bottom"
                className="group mt-0.5"
                content={
                  <div className="space-y-2 select-text">
                    <p className="leading-relaxed font-sans font-light text-zinc-400">
                      The HHI score measures your portfolio's concentration risk. Enderforge uses HHI to evaluate concentration risk and identify diversification opportunities.
                    </p>

                    {/* Mathematical Formula Telemetry Block */}
                    <div className="bg-graphite-sunk border border-zinc-950/80 rounded-lg p-2 flex flex-col items-center justify-center space-y-1 font-mono text-[9px] select-none">
                      <span className="text-zinc-500 font-bold text-[7px] uppercase tracking-widest">DETERMINISTIC RISK ENGINE</span>
                      <span className="text-orange-500 font-black text-[11px] tracking-widest">HHI = Σ (s_i)²</span>
                      <span className="text-zinc-500 text-[7.5px] text-center uppercase tracking-wider">s_i = % allocation of asset i</span>
                    </div>

                    <p className="leading-relaxed font-sans font-light text-zinc-400 text-[9.5px]">
                      The raw index is normalized onto an intuitive <span className="font-mono text-[9px] px-1 py-0.5 rounded border border-zinc-800 bg-graphite-sunk text-zinc-300">1</span> to <span className="font-mono text-[9px] px-1 py-0.5 rounded border border-zinc-800 bg-graphite-sunk text-zinc-300">100</span> scale. Scores <span className="text-rose-400 font-semibold">&le; 40</span> trigger warning flags for assets exceeding 25% allocation.
                    </p>

                    <div className="pt-2 border-t border-zinc-950/20 space-y-1 text-[8px] uppercase tracking-wider text-zinc-400 font-mono select-none">
                      <div className="flex justify-between text-zinc-500 font-bold mb-0.5">
                        <span>STATUS GUIDE</span>
                        <span>CONCENTRATION</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>HIGH SCORE (&gt;70)</span>
                        <span>WELL DIVERSIFIED</span>
                      </div>
                      <div className="flex justify-between text-amber-500">
                        <span>MEDIUM SCORE (41-70)</span>
                        <span>MODERATELY CONCENTRATED</span>
                      </div>
                      <div className="flex justify-between text-rose-500">
                        <span>LOW SCORE (&le;40)</span>
                        <span>HIGHLY CONCENTRATED</span>
                      </div>
                    </div>
                  </div>
                }
              >
                <span className="text-[9px] font-mono text-zinc-500 uppercase group-hover:text-zinc-300 group-focus:text-zinc-300 transition-colors select-none">
                  HHI CALIBRATION INDEX
                </span>
                <Info className="size-3 ml-1 text-zinc-500 group-hover:text-zinc-300 group-focus:text-zinc-300 transition-colors flex-shrink-0" />
              </MetricPopover>
            ) : (
              <p className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5 select-none">
                NO ASSETS – INDEX N/A
              </p>
            )}
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
