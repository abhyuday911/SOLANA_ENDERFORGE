"use client";

import { TrendingUp } from "lucide-react";
import type { AssetGroupOpportunity } from "@/lib/yield";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricPopover } from "@/components/ui/metric-popover";

interface YieldMatrixProps {
  opportunities: AssetGroupOpportunity[];
  stateClassification?: "EMPTY_WALLET" | "NO_IDLE_CAPITAL" | "DISCOVERY_OFFLINE";
}

export function YieldMatrix({ opportunities, stateClassification }: YieldMatrixProps) {

  // Determine which empty state classification to use
  const resolvedEmptyState = stateClassification || (
    opportunities.length === 0 ? "EMPTY_WALLET" : "NO_IDLE_CAPITAL"
  );

  // Muted hardware stability empty state if no active vectors are present
  if (opportunities.length === 0) {
    let badgeText = "";
    let titleText: string | null = null;
    let descriptionText = "";

    if (resolvedEmptyState === "EMPTY_WALLET") {
      badgeText = "WALLET EMPTY";
      titleText = "NO ASSETS DETECTED";
      descriptionText = "Connect capital to begin yield discovery. Deposit assets into this wallet and Enderforge will automatically scan for idle yield routes.";
    } else if (resolvedEmptyState === "DISCOVERY_OFFLINE") {
      badgeText = "DISCOVERY OFFLINE";
      descriptionText = "Yield discovery telemetry unavailable. Unable to verify active vault opportunities.";
    } else {
      badgeText = "TELEMETRY INACTIVE";
      descriptionText = "All token allocations are fully mobilized. No idle vectors located.";
    }

    return (
      <div className="rounded-3xl border border-zinc-900/40 bg-graphite-plate border-milled-bevel shadow-milled-elevated p-5 flex flex-col justify-between h-[300px] min-h-[300px] overflow-hidden select-none">
        {/* Header HUD */}
        <div className="flex items-center justify-between border-b border-zinc-950/40 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] font-mono flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-orange-500" />
              YIELD OPPORTUNITIES
            </h3>
            <p className="text-[9px] text-zinc-400 font-mono uppercase">
              Mobilize idle capital into optimized routes
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-zinc-800" />
            <span className="size-1.5 rounded-full bg-zinc-800" />
            <span className="size-1.5 rounded-full bg-zinc-800" />
          </div>
        </div>

        {/* Inactive Telemetry Banner */}
        <div className="flex flex-col items-center justify-center text-center py-6 space-y-2 px-4 max-w-md mx-auto">
          <span className="inline-flex items-center gap-1 text-[8px] font-mono font-bold tracking-[0.15em] text-zinc-500 border border-zinc-900 bg-graphite-sunk shadow-milled-sunk px-2.5 py-1 rounded-full uppercase">
            {badgeText}
          </span>
          {titleText && (
            <h4 className="text-[10px] font-bold text-zinc-300 font-mono uppercase tracking-wider mt-1 animate-none">
              {titleText}
            </h4>
          )}
          <p className="text-[10px] text-zinc-400 font-mono uppercase leading-relaxed">
            {descriptionText}
          </p>
        </div>

        {/* Footer Ledger Tag */}
        <div className="p-2 bg-graphite-sunk border-t border-zinc-950/40 flex items-center justify-between text-[8px] font-mono text-zinc-600 select-none uppercase tracking-wider mt-auto">
          <span>LEDGER: YIELD_ROUTE_CALIBRATION</span>
          <span>DISCOVERY: DYNAMIC_LLAMA_INDEX</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-900/40 bg-graphite-plate border-milled-bevel shadow-milled-elevated p-5 flex flex-col justify-between h-[300px] min-h-[300px] overflow-hidden">
      {/* Header HUD */}
      <div className="flex items-center justify-between border-b border-zinc-950/40 pb-3 mb-2 select-none">
        <div className="space-y-0.5">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] font-mono flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-orange-500" />
            YIELD OPPORTUNITIES
          </h3>
          <p className="text-[9px] text-zinc-400 font-mono uppercase">
            Mobilize idle capital into optimized routes
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-zinc-800" />
          <span className="size-1.5 rounded-full bg-zinc-800" />
          <span className="size-1.5 rounded-full bg-zinc-800" />
        </div>
      </div>

      {/* Recessed Ledger Table Container */}
      <div className="overflow-y-auto scrollbar-hide pr-1 flex-1 w-full max-h-[175px]">
        <Table>
          <TableHeader className="bg-graphite-plate border-b border-zinc-950/40 sticky top-0 z-10 select-none">
            <TableRow className="hover:bg-transparent border-zinc-950/40">
              <TableHead className="w-[180px] text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-10">
                ASSET
              </TableHead>
              <TableHead className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-10">
                PROTOCOL & VAULT
              </TableHead>
              <TableHead className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-10">
                CERTAINTY
              </TableHead>
              <TableHead className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-10">
                APY
              </TableHead>
              <TableHead className="text-right text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-10 w-[120px]">
                ACTION
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((asset) => {
              // Case 1: No yield opportunities match this asset (or discovery offline)
              if (asset.opportunities.length === 0) {
                const isOffline = asset.stateClassification === "DISCOVERY_OFFLINE";
                const statusId = `status-${asset.mint}`;

                return (
                  <TableRow
                    key={asset.mint}
                    className="border-zinc-950/40 hover:bg-graphite-sunk/30 transition-colors duration-150 group"
                  >
                    {/* ASSET CELL */}
                    <TableCell className="py-3 border-r border-zinc-950/40 bg-zinc-900/10">
                      <div className="flex items-center gap-3">
                        {asset.logoUri ? (
                          <img
                            src={asset.logoUri}
                            alt={asset.symbol}
                            className="size-5 rounded-full filter brightness-95 border border-zinc-950 bg-zinc-950"
                          />
                        ) : (
                          <div className="size-5 rounded-full bg-graphite-sunk border border-zinc-950 flex items-center justify-center text-[8px] font-mono font-bold text-zinc-500">
                            {asset.symbol[0]}
                          </div>
                        )}
                        <div className="flex flex-col select-none">
                          <span className="text-xs font-bold text-zinc-200 font-mono tracking-tight">
                            {asset.symbol}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono uppercase">
                            Idle: ${asset.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* PROTOCOL & VAULT STATUS NOTICE */}
                    <TableCell className="py-3 pl-4 text-xs font-bold text-zinc-400 font-mono" colSpan={1}>
                      {isOffline ? "INDEX TELEMETRY DOWN" : "NO ACTIVE VAULTS"}
                    </TableCell>

                    {/* CLASSIFICATION BADGE WITH PREMIUM POPOVER */}
                    <TableCell className="py-3 relative text-center" colSpan={3}>
                      <MetricPopover
                        id={statusId}
                        title="Status Diagnostics"
                        badgeText="INFO"
                        badgeVariant="info"
                        footerLeft="INDEX STATUS"
                        footerRight="ONLINE"
                        align="center"
                        content={
                          <p className="leading-relaxed font-sans font-light text-zinc-400 select-text">
                            {isOffline
                              ? "Enderforge yield indexing telemetry is currently offline due to a connection disruption. Checking dynamic Llama indices..."
                              : "We matched this token against all active Solana lending and staking vaults. All available capital is fully deployed or outside safety TVL limits."}
                          </p>
                        }
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 px-2 text-[9px] font-mono font-bold tracking-wider rounded-lg border cursor-help select-none transition-colors duration-150 animate-none",
                            isOffline
                              ? "border-rose-950/60 bg-rose-950/15 text-rose-400"
                              : "border-zinc-800 bg-graphite-sunk/60 text-zinc-400"
                          )}
                        >
                          {isOffline ? "TELEMETRY OFFLINE" : "FULLY OPTIMIZED"}
                        </Badge>
                      </MetricPopover>
                    </TableCell>
                  </TableRow>
                );
              }

              // Case 2: Yield opportunities matched successfully
              return asset.opportunities.map((opp, idx) => {
                const isMintMatch = opp.score === 100;
                const isSizeWarning = asset.stateClassification === "SIZE_WARNING_ACTIVE";
                const certaintyId = `certainty-${opp.poolId}-${idx}`;
                const mobilizeButtonId = `mobilize-${opp.poolId}-${idx}`;

                // APY warning tier colors
                const apyColorClass = 
                  opp.apyWarningTier === "EXTREME" ? "text-rose-400" :
                  opp.apyWarningTier === "HIGH" ? "text-orange-400" :
                  opp.apyWarningTier === "ELEVATED" ? "text-amber-400" :
                  "text-emerald-400";

                // Risk tier badge styling
                const riskBadgeClass =
                  opp.riskTier === "HIGH" ? "border-rose-950/60 bg-rose-950/15 text-rose-400" :
                  opp.riskTier === "MEDIUM" ? "border-amber-950/60 bg-amber-950/15 text-amber-400" :
                  "border-emerald-900/50 bg-emerald-900/20 text-emerald-400";

                return (
                  <TableRow
                    key={opp.poolId}
                    className="border-zinc-950/40 hover:bg-graphite-sunk/30 transition-colors duration-150 group"
                  >
                    {/* ASSET CELL (Spanned over opportunities) */}
                    {idx === 0 && (
                      <TableCell
                        rowSpan={asset.opportunities.length}
                        className="py-3 border-r border-zinc-950/40 bg-zinc-900/10 align-top"
                      >
                        <div className="flex items-center gap-3">
                          {asset.logoUri ? (
                            <img
                              src={asset.logoUri}
                              alt={asset.symbol}
                              className="size-5 rounded-full filter brightness-95 border border-zinc-950 bg-zinc-950"
                            />
                          ) : (
                            <div className="size-5 rounded-full bg-graphite-sunk border border-zinc-950 flex items-center justify-center text-[8px] font-mono font-bold text-zinc-500">
                              {asset.symbol[0]}
                            </div>
                          )}
                          <div className="flex flex-col select-none">
                            <span className="text-xs font-bold text-zinc-200 font-mono tracking-tight">
                              {asset.symbol}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono uppercase">
                              Idle: ${asset.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    )}

                    {/* PROTOCOL & VAULT */}
                    <TableCell className="py-3 pl-4">
                      <div className="flex flex-col animate-none">
                        <span className="text-xs font-bold text-zinc-200 font-mono tracking-tight">
                          {opp.protocolName}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono uppercase truncate max-w-[150px]">
                          {opp.poolName}
                        </span>
                      </div>
                    </TableCell>

                    {/* MATCH CERTAINTY WITH PREMIUM POPOVER */}
                    <TableCell className="py-3 relative">
                      <MetricPopover
                        id={certaintyId}
                        title="Risk Assessment"
                        badgeText={`Risk: ${opp.riskTier}`}
                        badgeVariant={opp.riskTier === "LOW" ? "success" : opp.riskTier === "MEDIUM" ? "warning" : "critical"}
                        footerLeft={`SCORE: ${opp.finalScore}`}
                        footerRight={opp.exposureType === "LP" ? "LP POSITION" : "SINGLE ASSET"}
                        align="center"
                        content={
                          <div className="space-y-2">
                            <p className="leading-relaxed font-sans font-light text-zinc-400 select-text">
                              {opp.reasoning}
                            </p>
                            <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-zinc-500">
                              <span>Risk Score: <span className="text-zinc-300">{opp.riskScore}</span></span>
                              <span>Sustainability: <span className="text-zinc-300">{opp.sustainabilityScore}</span></span>
                              <span>Liquidity: <span className="text-zinc-300">{opp.liquidityScore}</span></span>
                              <span>Composite: <span className="text-zinc-300">{opp.compositeScore}</span></span>
                              <span>Base APY: <span className="text-zinc-300">{opp.apyBase.toFixed(1)}%</span></span>
                              <span>Reward APY: <span className="text-zinc-300">{opp.apyReward.toFixed(1)}%</span></span>
                            </div>
                            {opp.exposureType === "LP" && (
                              <p className="text-[9px] font-mono text-amber-500/80 mt-1">
                                ⚠ LP position — impermanent loss risk applies
                              </p>
                            )}
                          </div>
                        }
                      >
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 px-2 text-[9px] font-mono font-bold tracking-wider rounded-lg border cursor-help select-none transition-colors duration-150 animate-none",
                              isMintMatch
                                ? "border-emerald-900/50 bg-emerald-900/20 text-emerald-400"
                                : "border-orange-950/60 bg-orange-950/15 text-orange-400"
                            )}
                          >
                            {isMintMatch ? "MINT" : "SYMBOL"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 px-1.5 text-[8px] font-mono font-bold tracking-wider rounded-lg border cursor-help select-none transition-colors duration-150 animate-none",
                              riskBadgeClass
                            )}
                          >
                            {opp.riskTier}
                          </Badge>
                        </div>
                      </MetricPopover>
                    </TableCell>

                    {/* APY */}
                    <TableCell className="py-3 font-mono">
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-extrabold tracking-tight animate-none", apyColorClass)}>
                          {opp.apy.toFixed(2)}%
                        </span>
                        {opp.apyWarningTier !== "NORMAL" && (
                          <span className={cn(
                            "text-[8px] font-mono font-bold tracking-wider mt-0.5",
                            opp.apyWarningTier === "EXTREME" ? "text-rose-500/70" :
                            opp.apyWarningTier === "HIGH" ? "text-orange-500/70" :
                            "text-amber-500/70"
                          )}>
                            {opp.apyWarningTier === "EXTREME" ? "LIKELY TEMPORARY" :
                             opp.apyWarningTier === "HIGH" ? "VOLATILE" :
                             "ELEVATED"}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* ACTION */}
                    <TableCell className="py-3 text-right pr-4 relative">
                      {isSizeWarning ? (
                        <MetricPopover
                          id={mobilizeButtonId}
                          title="Size Telemetry Warning"
                          badgeText="LOW SIZE"
                          badgeVariant="warning"
                          footerLeft="THRESHOLD"
                          footerRight="$50.00 LIMIT"
                          align="right"
                          content={
                            <p className="leading-relaxed font-sans font-light text-zinc-400 select-text">
                              Yield routes are fully operational, but active deposit size is below the recommended $50 threshold. Solana transaction gas fees may exceed immediate yield accrual.
                            </p>
                          }
                        >
                          {opp.routeStatus === "verified" && opp.redirectUrl ? (
                            <a
                              href={opp.redirectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex pointer-events-none"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider rounded-xl border-amber-950 bg-amber-950/10 text-amber-500 cursor-not-allowed border opacity-80 animate-none"
                              >
                                Mobilize
                              </Button>
                            </a>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider rounded-xl border border-zinc-900/60 bg-zinc-950/40 text-zinc-600 cursor-not-allowed select-none animate-none"
                            >
                              Unverified
                            </Button>
                          )}
                        </MetricPopover>
                      ) : opp.routeStatus === "verified" && opp.redirectUrl ? (
                        <a
                          href={opp.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider rounded-xl border border-zinc-800 bg-graphite-plate hover:bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 active:opacity-80 transition-all duration-150 cursor-pointer animate-none"
                          >
                            Mobilize
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider rounded-xl border border-zinc-900/60 bg-zinc-950/40 text-zinc-600 cursor-not-allowed select-none animate-none"
                        >
                          Unverified
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              });
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer Ledger Tag */}
      <div className="p-2 bg-graphite-sunk border-t border-zinc-950/40 flex items-center justify-between text-[8px] font-mono text-zinc-600 select-none uppercase tracking-wider mt-2 select-none">
        <span>LEDGER: YIELD_ROUTE_CALIBRATION</span>
        <span>DISCOVERY: DYNAMIC_LLAMA_INDEX</span>
      </div>
    </div>
  );
}
