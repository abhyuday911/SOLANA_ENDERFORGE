"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, ShieldAlert, Info } from "lucide-react";

interface RiskGaugeProps {
  hhiScore: number;
  tokenCount: number;
}

export function RiskGauge({ hhiScore, tokenCount }: RiskGaugeProps) {
  // HHI score classification:
  // > 70 is Optimal (well diversified)
  // 41-70 is Moderate concentration (Warning)
  // <= 40 is Severe concentration (Critical Hazard)
  const isEmpty = tokenCount === 0;
  const isHealthy = !isEmpty && hhiScore > 70;
  const isWarning = !isEmpty && hhiScore <= 70 && hhiScore > 40;
  const isCritical = !isEmpty && hhiScore <= 40;

  // Calculate how many of the 10 ticks should light up
  const activeTicksCount = isEmpty 
    ? 0 
    : Math.min(10, Math.max(0, Math.floor(hhiScore / 10)));

  // Calibrate state visual variables
  const stateColor = isEmpty
    ? "text-zinc-500"
    : isHealthy 
    ? "text-orange-500" 
    : isWarning 
    ? "text-amber-500" 
    : "text-rose-500";

  const stateBg = isEmpty
    ? "bg-zinc-800"
    : isHealthy 
    ? "bg-orange-500 shadow-[0_1px_2px_rgba(0,0,0,0.4)]" 
    : isWarning 
    ? "bg-amber-500 shadow-[0_1px_2px_rgba(0,0,0,0.4)]" 
    : "bg-rose-500 shadow-[0_1px_2px_rgba(0,0,0,0.4)]";

  const stateLabel = isEmpty
    ? "AWAITING_TELEMETRY"
    : isHealthy 
    ? "CALIBRATION_OPTIMAL" 
    : isWarning 
    ? "WARNING_CONCENTRATED" 
    : "CRITICAL_EXPOSURE_HAZARD";

  const stateIcon = isEmpty
    ? <Info className="size-3.5 text-zinc-500" />
    : isHealthy 
    ? <CheckCircle className="size-3.5 text-orange-500" />
    : isWarning 
    ? <AlertCircle className="size-3.5 text-amber-500" />
    : <ShieldAlert className="size-3.5 text-rose-500" />;

  return (
    <div className="p-5 rounded-3xl bg-graphite-plate border-milled-bevel shadow-milled-elevated flex flex-col justify-between h-full space-y-5">
      
      {/* Title Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em] font-mono">
            CONCENTRATION INDEX
          </h3>
{tokenCount > 0 ? (
  <p className="text-[10px] text-zinc-400 font-mono uppercase">
    HHI Exposure Telemetry
  </p>
) : (
  <p className="text-[10px] text-zinc-400 font-mono uppercase">
    NO ASSETS – INDEX N/A
  </p>
)}
        </div>
        <div className="text-right font-mono">
          <span className="text-3xl font-black text-zinc-100 tracking-tighter">
            {tokenCount > 0 ? hhiScore : "—"}
          </span>
          <span className="text-zinc-500 text-xs ml-0.5 font-mono">/100</span>
        </div>
      </div>

      {/* 10-Tick Precision Caliper Slider */}
      <div className="space-y-2">
        <div className="bg-graphite-sunk shadow-milled-sunk border border-zinc-950/80 rounded-xl p-3.5 flex items-center justify-between gap-1.5 h-14 relative">
          {Array.from({ length: 10 }).map((_, index) => {
            const isActive = index < activeTicksCount;
            return (
              <div
                key={index}
                className={cn(
                  "w-[3px] rounded-xs transition-all duration-500",
                  isActive ? cn("h-8 sm:h-9", stateBg) : "h-4 sm:h-5 bg-zinc-900"
                )}
              />
            );
          })}
        </div>
        
        {/* Caliper Telemetry Labels */}
        <div className="flex justify-between text-[8px] text-zinc-500 font-mono tracking-widest px-1 uppercase">
          <span>0.00 (HAZARD)</span>
          <span>0.50 (MIDPORT)</span>
          <span>1.00 (DIVERSIFIED)</span>
        </div>
      </div>

      {/* State Diagnostics & Actions */}
      <div className="border-t border-zinc-950/40 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {stateIcon}
          <span className={cn("text-[9px] font-bold font-mono tracking-wider uppercase", stateColor)}>
            {stateLabel}
          </span>
        </div>
        
        <p className="text-[10px] text-zinc-400 leading-relaxed font-sans font-light max-w-xs text-left">
          {isEmpty
            ? "Connect a wallet with assets or populate holdings to initiate automated HHI index assessment and safety calibrations."
            : isHealthy 
            ? "Capital spread indicates balanced single-point safety threshold. Exposure risks isolated." 
            : isWarning 
            ? "Asset concentration warning. Restructuring capital into alternative yield channels advised." 
            : "High volatility exposure. Concentrated asset load requires urgent risk optimization routing."}
        </p>
      </div>

    </div>
  );
}
