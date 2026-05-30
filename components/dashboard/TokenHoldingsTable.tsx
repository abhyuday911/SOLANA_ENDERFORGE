"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TokenHolding } from "@/lib/engine";
import { cn } from "@/lib/utils";

interface TokenHoldingsTableProps {
  holdings: TokenHolding[];
}

export function TokenHoldingsTable({ holdings }: TokenHoldingsTableProps) {
  return (
    <div className="rounded-3xl border border-zinc-900/60 bg-zinc-900/10 backdrop-blur-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-900/40 border-b border-zinc-900/60">
            <TableRow className="hover:bg-transparent border-zinc-900/60 select-none">
              <TableHead className="w-[220px] text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-11">
                Asset Telemetry
              </TableHead>
              <TableHead className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-11">
                Calibrated Balance
              </TableHead>
              <TableHead className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-11">
                Price (USD)
              </TableHead>
              <TableHead className="text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-11">
                Total Value (USD)
              </TableHead>
              <TableHead className="text-right text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 uppercase h-11 w-[160px]">
                Allocation Pct
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((token) => {
              const isOverAllocated = token.allocationPct > 25;
              
              return (
                <TableRow 
                  key={`${token.mint}+${token.name}`} 
                  className="border-zinc-900/40 hover:bg-zinc-900/30 transition-colors duration-200 group"
                >
                  {/* Asset Info */}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      {token.logoUri ? (
                        <img 
                          src={token.logoUri} 
                          alt={token.symbol} 
                          className="size-5 rounded-full filter brightness-95 border border-zinc-900/60 bg-zinc-950" 
                        />
                      ) : (
                        <div className="size-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[8px] font-mono font-bold text-zinc-400">
                          {token.symbol[0]}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-200 font-mono tracking-tight">
                          {token.symbol}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono uppercase truncate max-w-[120px]">
                          {token.name}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Balance */}
                  <TableCell className="text-zinc-300 font-mono text-xs py-4">
                    {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-zinc-300 font-mono text-xs py-4">
                    ${token.priceUsd < 0.01 ? token.priceUsd.toFixed(6) : token.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>

                  {/* Total Value */}
                  <TableCell className="font-bold text-zinc-100 font-mono text-xs py-4">
                    ${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>

                  {/* Allocation Percent */}
                  <TableCell className="text-right py-4">
                    <div className="flex items-center justify-end gap-3 select-none">
                      {/* Low-profile mini progress bar indicator */}
                      <div className="w-12 h-1 overflow-hidden rounded-full bg-zinc-950/80 border border-zinc-900/60 hidden sm:block">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            isOverAllocated 
                              ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" 
                              : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                          )} 
                          style={{ width: `${token.allocationPct}%` }}
                        />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "h-5 px-2 text-[9px] font-mono font-bold tracking-wider rounded-lg border",
                          isOverAllocated 
                            ? "border-rose-950/60 bg-rose-950/15 text-rose-400" 
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400"
                        )}
                      >
                        {token.allocationPct.toFixed(1)}%
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Table Footer Telemetry Tag */}
      <div className="p-3 bg-zinc-950/40 border-t border-zinc-900/60 flex items-center justify-between text-[8px] font-mono text-zinc-600 select-none">
        <span>ASSET_REGISTER: ACTIVE_ON_CHAIN_DASH</span>
        <span>INDEXING: HELIUS_DAS_PROTOCOL</span>
      </div>

    </div>
  );
}
