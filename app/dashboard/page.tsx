"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { analyzePortfolio, type AnalysisResult } from "@/app/actions/analyze";
import { PortfolioSummary } from "@/components/dashboard/PortfolioSummary";
import { RiskGauge } from "@/components/dashboard/RiskGauge";
import { YieldMatrix } from "@/components/dashboard/YieldMatrix";
import { TokenHoldingsTable } from "@/components/dashboard/TokenHoldingsTable";
import { AINarrativeCard } from "@/components/dashboard/AINarrativeCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamic import for WalletMultiButton to prevent hydration mismatch
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);


export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async () => {
    if (!publicKey) return;

    setError(null);
    startTransition(async () => {
      const response = await analyzePortfolio(publicKey.toBase58());

      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error.error);
      }
    });
  };

  // Auto-analyze on connect
  useEffect(() => {
    if (connected && publicKey && !data) {
      performAnalysis();
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8 text-center">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-zinc-950 rounded-full p-4 border border-zinc-800">
            <Sparkles className="size-12 text-emerald-400" />
          </div>
        </div>

        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-zinc-100">
            Solana Yield <span className="text-emerald-400">Optimizer</span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Connect your wallet to analyze concentration risks, discover idle capital, and get AI-synthesized yield strategies tailored to your portfolio.
          </p>
        </div>

        <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 !rounded-2xl !transition-all !h-12 !px-8 !font-bold" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            Optimizer Dashboard
            <span className="text-[10px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Mainnet
            </span>
          </h2>
          <p className="text-xs text-zinc-500 font-mono">
            Wallet: {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-800 text-zinc-400 hover:text-zinc-100"
            disabled={isPending}
            onClick={performAnalysis}
          >
            <RefreshCw className={cn("size-3.5 mr-2", isPending && "animate-spin")} />
            {isPending ? "Analyzing..." : "Refresh Stats"}
          </Button>
          <WalletMultiButton className="!bg-zinc-800 hover:!bg-zinc-700 !rounded-xl !h-8 !px-4 !text-xs" />
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <ShieldAlert className="size-5 shrink-0" />
          <p>{error}</p>
          <Button variant="ghost" size="sm" className="ml-auto hover:bg-rose-500/10 h-7" onClick={performAnalysis}>
            Retry
          </Button>
        </div>
      ) : null}

      {/* Main Grid */}
      {data ? (
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* Top Row: Summaries */}
          <PortfolioSummary
            totalValue={data.riskReport.totalValueUsd}
            tokenCount={data.holdings.length}
            hhiScore={data.riskReport.hhiScore}
            concentrationRiskCount={data.riskReport.concentrationRisks.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: AI & Yield */}
            <div className="lg:col-span-2 space-y-8">
              <AINarrativeCard summary={data.aiSummary} isLoading={isPending} />
              <YieldMatrix matches={data.yieldMatches} />
            </div>

            {/* Right: Risk Analysis */}
            <div className="space-y-8">
              <RiskGauge hhiScore={data.riskReport.hhiScore} />
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="size-3 text-amber-500" />
                  Risk Breakdown
                </h3>
                {data.riskReport.concentrationRisks.length > 0 ? (
                  data.riskReport.concentrationRisks.map((risk) => (
                    <div key={risk.symbol} className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">{risk.symbol} Exposure</span>
                      <span className={cn(
                        "font-bold",
                        risk.severity === "high" ? "text-rose-400" : "text-amber-400"
                      )}>
                        {risk.allocationPct.toFixed(1)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-emerald-400/70 border border-emerald-500/20 bg-emerald-500/5 p-3 rounded-xl italic">
                    All assets within safe 25% allocation thresholds.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Token Holdings
            </h3>
            <TokenHoldingsTable holdings={data.holdings} />
          </div>
        </div>
      ) : isPending ? (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-900 animate-pulse" />)}
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 h-96 rounded-2xl bg-zinc-900 animate-pulse" />
            <div className="h-96 rounded-2xl bg-zinc-900 animate-pulse" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
