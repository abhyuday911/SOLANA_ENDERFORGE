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

interface TokenHoldingsTableProps {
  holdings: TokenHolding[];
}

export function TokenHoldingsTable({ holdings }: TokenHoldingsTableProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-900/50">
          <TableRow className="hover:bg-transparent border-zinc-800">
            <TableHead className="w-[200px] text-zinc-400">Asset</TableHead>
            <TableHead className="text-zinc-400">Balance</TableHead>
            <TableHead className="text-zinc-400">Price (USD)</TableHead>
            <TableHead className="text-zinc-400">Value (USD)</TableHead>
            <TableHead className="text-right text-zinc-400">Allocation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((token) => (
            <TableRow key={token.mint} className="border-zinc-800 group transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {token.logoUri ? (
                    <img src={token.logoUri} alt={token.symbol} className="size-5 rounded-full" />
                  ) : (
                    <div className="size-5 rounded-full bg-zinc-800 flex items-center justify-center text-[8px]">
                      {token.symbol[0]}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm">{token.symbol}</span>
                    <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">{token.name}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-zinc-300">
                {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </TableCell>
              <TableCell className="text-zinc-300">
                ${token.priceUsd < 0.01 ? token.priceUsd.toFixed(6) : token.priceUsd.toFixed(2)}
              </TableCell>
              <TableCell className="font-semibold text-zinc-100">
                ${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-12 h-1 overflow-hidden rounded-full bg-zinc-800 hidden sm:block">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${token.allocationPct}%` }}
                    />
                  </div>
                  <Badge variant={token.allocationPct > 25 ? "destructive" : "secondary"} className="h-4 px-1.5 text-[10px]">
                    {token.allocationPct.toFixed(1)}%
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
