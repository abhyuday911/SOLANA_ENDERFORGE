"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";

interface RiskGaugeProps {
  hhiScore: number;
}

export function RiskGauge({ hhiScore }: RiskGaugeProps) {
  // HHI score classification:
  // > 70 is Optimal (well diversified)
  // 41-70 is Moderate concentration (Warning)
  // <= 40 is Severe concentration (Critical Hazard)
  const isHealthy = hhiScore > 70;
  const isWarning = hhiScore <= 70 && hhiScore > 40;
  const isCritical = hhiScore <= 40;

  // Calculate how many of the 10 ticks should light up
  const activeTicksCount = Math.min(10, Math.max(0, Math.floor(hhiScore / 10)));

  // Calibrate state visual variables
  const stateColor = isHealthy 
    ? "text-orange-500" 
    : isWarning 
    ? "text-amber-500" 
    : "text-rose-500";

  const stateBg = isHealthy 
    ? "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]" 
    : isWarning 
    ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]" 
    : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]";

  const stateLabel = isHealthy 
    ? "CALIBRATION_OPTIMAL" 
    : isWarning 
    ? "WARNING_CONCENTRATED" 
    : "CRITICAL_EXPOSURE_HAZARD";

  const stateIcon = isHealthy 
    ? <CheckCircle className="size-3.5 text-orange-500" />
    : isWarning 
    ? <AlertCircle className="size-3.5 text-amber-500" />
    : <ShieldAlert className="size-3.5 text-rose-500" />;

  return (
    <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-900/60 backdrop-blur-xs flex flex-col justify-between h-full space-y-6">
      
      {/* Title Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
            Concentration Index
          </h3>
          <p className="text-[11px] text-zinc-500 font-mono uppercase">
            Herfindahl-Hirschman index exposure
          </p>
        </div>
        <div className="text-right font-mono">
          <span className="text-3xl font-black text-zinc-100 tracking-tighter">{hhiScore}</span>
          <span className="text-zinc-600 text-xs ml-0.5">/100</span>
        </div>
      </div>

      {/* 10-Tick Precision Caliper Slider */}
      <div className="space-y-3">
        <div className="bg-zinc-950/60 border border-zinc-900/60 rounded-xl p-4 flex items-center justify-between gap-1.5 h-16 relative">
          {Array.from({ length: 10 }).map((_, index) => {
            const isActive = index < activeTicksCount;
            return (
              <div
                key={index}
                className={cn(
                  "w-[3px] rounded-xs transition-all duration-500",
                  isActive ? cn("h-8 sm:h-10", stateBg) : "h-5 sm:h-6 bg-zinc-900"
                )}
              />
            );
          })}
        </div>
        
        {/* Caliper Telemetry Labels */}
        <div className="flex justify-between text-[8px] text-zinc-600 font-mono tracking-wider px-1">
          <span>0.00 (HAZARD)</span>
          <span>0.50 (MIDPORT)</span>
          <span>1.00 (DIVERSIFIED)</span>
        </div>
      </div>

      {/* State Diagnostics & Actions */}
      <div className="border-t border-zinc-900/60 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {stateIcon}
          <span className={cn("text-[10px] font-bold font-mono tracking-wider uppercase", stateColor)}>
            {stateLabel}
          </span>
        </div>
        
        <p className="text-[10px] text-zinc-400 leading-normal font-sans font-light max-w-xs text-left">
          {isHealthy 
            ? "Capital spread indicates balanced single-point safety threshold. Exposure risks isolated." 
            : isWarning 
            ? "Asset concentration warning. Restructuring capital into alternative yield channels advised." 
            : "High volatility exposure. Concentrated asset load requires urgent risk optimization routing."}
        </p>
      </div>

    </div>
  );
}
