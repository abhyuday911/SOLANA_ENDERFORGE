"use client";

import { useEffect, useState, useTransition, useRef } from "react";

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
import Link from 'next/link';

// Dynamic import for WalletMultiButton to prevent hydration mismatch
const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);


export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
  const [cluster, setCluster] = useState<"mainnet-beta" | "devnet">("mainnet-beta");
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "warning" | "error" | "info" } | null>(null);

  // Track current request to prevent race conditions
  const analysisRequestId = useRef(0);

  // Trigger toast on AI limitations
  useEffect(() => {
    if (data?.aiError) {
      setToast({
        message: "AI credits limit reached. Standard risk metrics are fully operational.",
        type: "warning",
      });
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const performAnalysis = async (targetCluster = cluster, targetWallet = publicKey) => {
    if (!targetWallet) return;

    const requestId = ++analysisRequestId.current;

    setError(null);
    startTransition(async () => {
      const response = await analyzePortfolio(targetWallet.toBase58(), targetCluster);

      // Only update if this is still the latest request
      if (requestId === analysisRequestId.current) {
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.error.error);
        }
      }
    });
  };


  const toggleCluster = () => {
    const nextCluster = cluster === "mainnet-beta" ? "devnet" : "mainnet-beta";
    setCluster(nextCluster);
    // Clear stale portfolio data to trigger the loading skeleton during network transition
    setData(null);
    performAnalysis(nextCluster);
  };

  // Auto-analyze / react to wallet change or disconnect
  useEffect(() => {
    if (connected && publicKey) {
      setData(null);
      setError(null);
      performAnalysis(cluster, publicKey);
    } else {
      setData(null);
      setError(null);
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-graphite-canvas text-zinc-100 flex flex-col justify-center items-center px-6 py-24 select-none">
        <div className="relative">
          <div className="relative bg-graphite-plate border-milled-bevel shadow-milled-elevated rounded-3xl p-5">
            <img src="/ELDERFORGE.png" alt="Enderforge Logo" className="size-16 object-contain" />
          </div>
        </div>

        <div className="max-w-2xl space-y-4 mt-8 text-center">
          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold tracking-[0.15em] text-zinc-500 border border-zinc-950 bg-graphite-sunk shadow-milled-sunk px-3 py-1.5 rounded-full uppercase">
            OPERATIONAL CREDENTIAL REQUIRED
          </span>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl text-zinc-100 uppercase">
            INITIALIZE.<span className="text-orange-500">OPERATIONS_SHELL</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed font-sans font-light">
            Connect an authorized Solana keypair to calibrate yield metrics, isolate concentration exposure vectors, and synthesize AI risk directives.
          </p>
        </div>

        <WalletMultiButton className="!bg-zinc-100 hover:!bg-zinc-200 !text-zinc-950 !rounded-xl !transition-all !h-11 !px-6 !font-bold !text-xs !tracking-wider !shadow-md mt-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graphite-canvas text-zinc-100 selection:bg-orange-500/20 font-sans select-none">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-950 pb-8">
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-zinc-100 tracking-wider flex items-center gap-3">
              <Link
                href="/"
                aria-label="Go to home"
                className="flex items-center gap-2.5"
              >
                <img src="/ELDERFORGE.png" alt="Enderforge Logo" className="size-8 object-contain" />
                <span className="uppercase text-sm tracking-[0.25em] font-black">
                  <span className="text-zinc-400">ENDER</span>
                  <span className="text-orange-500">FORGE</span>
                </span>
              </Link>
              <div className="bg-graphite-sunk border border-zinc-950 shadow-milled-sunk p-0.5 rounded-xl flex items-center gap-0.5 ml-3">
                <button
                  onClick={() => {
                    if (cluster !== "mainnet-beta") {
                      setCluster("mainnet-beta");
                      // Clear stale portfolio data to trigger the loading skeleton during network transition
                      setData(null);
                      performAnalysis("mainnet-beta");
                    }
                  }}
                  className={cn(
                    "px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                    cluster === "mainnet-beta"
                      ? "bg-orange-500 text-zinc-950 font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Mainnet
                </button>
                <button
                  onClick={() => {
                    if (cluster !== "devnet") {
                      setCluster("devnet");
                      // Clear stale portfolio data to trigger the loading skeleton during network transition
                      setData(null);
                      performAnalysis("devnet");
                    }
                  }}
                  className={cn(
                    "px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                    cluster === "devnet"
                      ? "bg-amber-500 text-zinc-950 font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Devnet
                </button>
              </div>
            </h2>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
              OPERATOR: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-zinc-800 bg-graphite-plate hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 text-[10px] font-bold tracking-[0.1em] border-milled-bevel shadow-milled-elevated h-8 px-3.5"
              disabled={isPending}
              onClick={() => performAnalysis()}
            >
              <RefreshCw className={cn("size-3 mr-2", isPending && "animate-spin")} />
              {isPending ? "SYNCING..." : "REFRESH STATS"}
            </Button>
            <WalletMultiButton className="!bg-graphite-plate hover:!bg-zinc-900 !border !border-zinc-800 !rounded-xl !h-8 !px-3.5 !text-[10px] !font-bold !tracking-[0.1em] !text-zinc-300 hover:!text-zinc-100 !transition-all !shadow-sm" />
          </div>
        </div>

        {error ? (
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-950/40 text-rose-400 text-xs flex items-center gap-3 font-mono">
            <ShieldAlert className="size-4 shrink-0" />
            <p className="uppercase tracking-wider">TELEMETRY SYNC INTERRUPTED: {error}</p>
            <Button variant="ghost" size="sm" className="ml-auto hover:bg-rose-950/40 h-7 text-[10px] font-bold" onClick={() => performAnalysis()}>
              RETRY SYNC
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left: AI & Yield */}
              <div className="lg:col-span-2 space-y-8">
                <AINarrativeCard summary={data.aiSummary} isLoading={isPending} />
                <YieldMatrix
                  opportunities={data.activeYieldOpportunities}
                  stateClassification={
                    data.holdings.length === 0
                      ? "EMPTY_WALLET"
                      : data.activeYieldOpportunities.every((o) => o.stateClassification === "DISCOVERY_OFFLINE")
                        ? "DISCOVERY_OFFLINE"
                        : "NO_IDLE_CAPITAL"
                  }
                />
              </div>

              {/* Right: Risk Analysis */}
              <div className="space-y-8">
                <RiskGauge hhiScore={data.riskReport.hhiScore} tokenCount={data.holdings.length} />
                <div className="p-5 rounded-3xl bg-graphite-plate border-milled-bevel shadow-milled-elevated space-y-4">
                  <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em] flex items-center gap-2 font-mono">
                    <ShieldAlert className="size-3.5 text-orange-500" />
                    RISK BREAKDOWN MATRIX
                  </h3>
                  {data.holdings.length === 0 ? (
                    <p className="text-[10px] text-zinc-400 bg-graphite-sunk shadow-milled-sunk border border-zinc-950 p-3.5 rounded-xl font-mono leading-relaxed">
                      No assets detected – risk analysis unavailable.
                    </p>
                  ) : (
                    data.riskReport.concentrationRisks.length > 0 ? (
                      <div className="space-y-3">
                        {data.riskReport.concentrationRisks.map((risk) => (
                          <div key={risk.symbol} className="flex justify-between items-center text-xs font-mono border-b border-zinc-950/40 pb-2 last:border-0 last:pb-0">
                            <span className="text-zinc-400">{risk.symbol} EXPOSURE</span>
                            <span className={cn("font-bold", risk.severity === "high" ? "text-rose-500" : "text-amber-500")}>{risk.allocationPct.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-400 bg-graphite-sunk shadow-milled-sunk border border-zinc-950 p-3.5 rounded-xl font-mono leading-relaxed">
                        OPTIMAL. ALL ASSETS WITHIN SAFE 25% ALLOCATION THRESHOLDS.
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Table */}
            <div className="space-y-3">
              <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 font-mono">
                <Wallet className="size-3.5 text-zinc-500" />
                ASSET TELEMETRY REGISTER
              </h3>
              <TokenHoldingsTable holdings={data.holdings} />
            </div>
          </div>
        ) : isPending ? (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-3xl bg-graphite-plate border-milled-bevel shadow-milled-elevated animate-pulse" />)}
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 h-96 rounded-3xl bg-graphite-plate border-milled-bevel shadow-milled-elevated animate-pulse" />
              <div className="h-96 rounded-3xl bg-graphite-plate border-milled-bevel shadow-milled-elevated animate-pulse" />
            </div>
          </div>
        ) : null}
      </div>

      {/* Toast Notification HUD */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-350">
          <div className="bg-graphite-plate border border-amber-500/20 text-amber-200 px-4 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3.5 max-w-sm border-milled-bevel">
            <Sparkles className="size-4 text-orange-500 animate-pulse shrink-0 animate-duration-1000" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold font-mono tracking-wider uppercase text-orange-500">
                AI Telemetry Notice
              </p>
              <p className="text-[10px] leading-relaxed text-zinc-300 font-sans font-light">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-500 hover:text-zinc-300 ml-auto cursor-pointer font-bold text-xs select-none h-6 w-6 flex items-center justify-center rounded-lg hover:bg-zinc-950/20"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
