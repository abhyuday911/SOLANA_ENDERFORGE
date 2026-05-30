"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp } from "lucide-react";
import type { YieldMatch } from "@/lib/yield";

interface YieldMatrixProps {
  matches: YieldMatch[];
}

export function YieldMatrix({ matches }: YieldMatrixProps) {
  if (matches.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
        <CardContent className="h-40 flex flex-col items-center justify-center text-zinc-500">
          <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
          <p className="text-sm">No yield opportunities found for your idle assets.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        Top Yield Strategies
      </h3>
      <div className="grid gap-3 lg:grid-cols-2">
        {matches.map((match) => (
          <Card key={match.tokenSymbol} className="bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {match.tokenSymbol}
                  <Badge variant="outline" className="text-[10px] h-4 py-0 border-zinc-700 bg-zinc-800/50">
                    Idle: ${match.idleValueUsd.toFixed(2)}
                  </Badge>
                </CardTitle>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Suggested Deals</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {match.opportunities.slice(0, 2).map((opp) => (
                  <div key={opp.poolId} className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50 group">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{opp.protocol}</span>
                      <span className="text-[10px] text-zinc-500 italic">{opp.poolName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">
                          {opp.apyTotal.toFixed(2)}%
                        </div>
                        <div className="text-[9px] text-zinc-600 uppercase">APY</div>
                      </div>
                      <Button size="icon-xs" variant="ghost" className="text-zinc-600 hover:text-emerald-400">
                        <ExternalLink className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
