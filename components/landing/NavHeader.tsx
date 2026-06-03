"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

interface NavHeaderProps {
  mode?: "landing" | "dashboard";
  cluster?: "mainnet-beta" | "devnet";
  onClusterChange?: (cluster: "mainnet-beta" | "devnet") => void;
  isPending?: boolean;
  onRefresh?: () => void;
  publicKeyStr?: string;
}

export function NavHeader({
  mode = "landing",
  cluster = "mainnet-beta",
  onClusterChange,
  isPending = false,
  onRefresh,
  publicKeyStr,
}: NavHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-900/40 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-between px-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 font-extrabold text-sm tracking-[0.2em] text-zinc-100 select-none">
        <Link
          href="/"
          aria-label="Enderforge Home"
          className="flex items-center gap-2.5"
        >
          <img src="/ELDERFORGE.png" alt="Enderforge Logo" className="size-8 object-contain" />
          <span className="uppercase tracking-[0.25em] font-black text-xs sm:text-sm">
            <span className="text-zinc-400">ENDER</span>
            <span className="text-orange-500">FORGE</span>
          </span>
        </Link>
        {mode === "dashboard" && (
          <span className="text-zinc-500 text-xs tracking-wider font-mono font-normal border-l border-zinc-800 pl-3 hidden sm:inline">
            OPERATIONS_SHELL_V3
          </span>
        )}
      </div>

      {/* Dynamic Controls based on Page Type */}
      <div className="flex items-center gap-4">
        {mode === "landing" ? (
          <>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-[0.15em] text-orange-400 border border-orange-500/20 bg-orange-500/5 px-3 py-1 rounded-full uppercase">
              <span className="size-1.5 rounded-full bg-orange-500" />
              CALIBRATION ENGINE ACTIVE
            </span>

            <Link href="/dashboard">
              <Button
                variant="outline"
                className="rounded-xl border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 hover:text-zinc-100 text-[10px] font-bold tracking-[0.15em] text-zinc-300 transition-colors"
              >
                LAUNCH TERMINAL
              </Button>
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Minimalist low-profile cluster switch */}
            <div className="bg-zinc-900 border border-zinc-800/80 p-0.5 rounded-xl flex items-center gap-0.5">
              <button
                onClick={() => onClusterChange?.("mainnet-beta")}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                  cluster === "mainnet-beta"
                    ? "bg-orange-500 text-zinc-950 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Mainnet
              </button>
              <button
                onClick={() => onClusterChange?.("devnet")}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                  cluster === "devnet"
                    ? "bg-rose-500 text-zinc-950 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Devnet
              </button>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-zinc-800 text-zinc-400 hover:text-zinc-100 h-8 px-3"
                disabled={isPending}
                onClick={onRefresh}
              >
                <RefreshCw className={cn("size-3", isPending && "animate-spin")} />
                <span className="hidden md:inline ml-1.5 text-[9px] font-bold tracking-[0.1em]">REFRESH</span>
              </Button>
            )}

            {/* Wallet Button */}
            <WalletMultiButton className="!bg-zinc-900 hover:!bg-zinc-800 !border !border-zinc-800 !rounded-xl !h-8 !px-3 !text-[10px] !font-bold !tracking-[0.1em] !text-zinc-300 hover:!text-zinc-100 !transition-all" />
          </div>
        )}
      </div>
    </header>
  );
}
