"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  hhiScore: number;
}

export function RiskGauge({ hhiScore }: RiskGaugeProps) {
  // Score is 1-100. 100 is perfectly balanced (good), 1 is highly concentrated (bad).
  const isHealthy = hhiScore > 70;
  const isWarning = hhiScore <= 70 && hhiScore > 40;
  const isCritical = hhiScore <= 40;

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Diversification Health</CardTitle>
        <CardDescription className="text-xs">Based on HHI concentration analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isHealthy ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-rose-500"
            )}
            style={{ width: `${hhiScore}%` }}
          />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <span className={cn(
              "text-lg font-bold",
              isHealthy ? "text-emerald-400" : isWarning ? "text-amber-400" : "text-rose-400"
            )}>
              {isHealthy ? "Healthy" : isWarning ? "Balanced" : "Concentrated"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold">{hhiScore}</span>
            <span className="text-zinc-500 text-sm ml-1">/ 100</span>
          </div>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {isHealthy 
            ? "Your portfolio is well-diversified across multiple assets, reducing single-point failure risk." 
            : isWarning 
            ? "Moderate concentration detected. Consider rebalancing some of your larger positions." 
            : "High concentration risk. A large portion of your value is in very few assets."}
        </p>
      </CardContent>
    </Card>
  );
}
