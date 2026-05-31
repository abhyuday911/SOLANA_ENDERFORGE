"use client";

import { ExternalLink, TrendingUp, HelpCircle, Sparkles } from "lucide-react";
import type { YieldMatch } from "@/lib/yield";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface YieldMatrixProps {
  matches: YieldMatch[];
}

export function YieldMatrix({ matches }: YieldMatrixProps) {
  if (matches.length === 0) {
    return (
      <div className="p-5 rounded-3xl bg-graphite-plate border-milled-bevel shadow-milled-elevated flex flex-col items-center justify-center text-center h-48 space-y-3">
        <TrendingUp className="size-8 text-zinc-700 animate-pulse" />
        <div className="space-y-1">
          <p className="text-[9px] font-bold font-mono tracking-[0.15em] text-zinc-500 uppercase">
            NO OPPORTUNITIES LOCATED
          </p>
          <p className="text-[10px] text-zinc-400 font-mono uppercase">
            All token allocations are fully mobilized.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-3xl bg-graphite-plate border-milled-bevel shadow-milled-elevated flex flex-col justify-between h-full space-y-4">
      
      {/* Header */}
      <div className="space-y-0.5">
        <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em] font-mono flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-orange-500" />
          YIELD OPPORTUNITIES MATRIX
        </h3>
        <p className="text-[10px] text-zinc-400 font-mono uppercase">
          Mobilize idle capital into optimized routes
        </p>
      </div>

      {/* Strategies Grid */}
      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
        {matches.map((match) => (
          <div 
            key={match.tokenSymbol} 
            className={cn(
              "p-3.5 rounded-2xl bg-graphite-sunk shadow-milled-sunk border space-y-3 transition-all duration-300",
              match.isFallback 
                ? "border-amber-500/20 hover:border-amber-500/30" 
                : "border-zinc-950/80"
            )}
          >
            {/* Token allocation label */}
            <div className="flex justify-between items-center text-[9px] font-mono tracking-wider border-b border-zinc-950/40 pb-2">
              {match.isFallback ? (
                <span className="font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="size-3 text-amber-500" />
                  GLOBAL YIELD ROUTING
                </span>
              ) : (
                <span className="font-bold text-zinc-400 uppercase tracking-widest">{match.tokenSymbol} ALLOCATION</span>
              )}
              
              {match.isFallback ? (
                <span className="text-[8px] font-bold font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Solana Featured
                </span>
              ) : (
                <span className="text-zinc-500 uppercase">
                  Idle: <span className="text-zinc-300 font-bold font-mono">${match.idleValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </span>
              )}
            </div>

            {/* Opportunities List for this token */}
            <div className="space-y-2">
              {match.opportunities.slice(0, match.isFallback ? 5 : 2).map((opp) => (
                <div 
                  key={opp.poolId} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-graphite-plate/30 border border-zinc-950/20 hover:border-amber-500/20 hover:bg-graphite-plate/80 transition-all group active:translate-y-px"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-200 font-mono tracking-tight">
                        {opp.protocol}
                      </span>
                      {opp.score && (
                        <span 
                          title={opp.reason}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[7px] font-mono font-bold uppercase border cursor-help select-none leading-none tracking-wider",
                            opp.score === 100 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          )}
                        >
                          T{opp.score === 100 ? "1" : "2"} Match
                        </span>
                      )}
                    </div>
                    <span 
                      title={opp.reason}
                      className="text-[9px] text-zinc-500 font-mono uppercase truncate max-w-[150px] cursor-help"
                    >
                      {opp.poolName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black font-mono text-amber-500 tracking-tight">
                        {opp.apyTotal.toFixed(2)}%
                      </div>
                      <div className="text-[8px] text-zinc-500 font-mono tracking-wider uppercase">APY</div>
                    </div>
                    
                    <a
                      href={
                        opp.protocol === "Kamino" 
                          ? "https://app.kamino.finance" 
                          : opp.protocol === "MarginFi" 
                          ? "https://app.marginfi.com" 
                          : opp.protocol === "Drift"
                          ? "https://app.drift.trade"
                          : "https://solana.com"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Button 
                        size="icon-xs" 
                        variant="ghost" 
                        className="text-zinc-500 hover:text-amber-500 hover:bg-amber-500/5 cursor-pointer rounded-lg hover:scale-105 active:scale-95 transition-all"
                      >
                        <ExternalLink className="size-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[8px] text-zinc-600 font-mono leading-tight border-t border-zinc-950/40 pt-3 uppercase tracking-wider">
        Vault APY rates verified via real-time on-chain protocols.
      </div>

    </div>
  );
}
