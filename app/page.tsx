import { HeroSection } from "@/components/landing/HeroSection";
import { Sparkles, TrendingUp, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden select-none">
      
      {/* 1. Master WebGL Concentric Chronolith Hero Fold */}
      <HeroSection />

      {/* 2. Calibration Telemetry Section (Transition Fold) */}
      <section className="relative px-6 py-28 max-w-7xl mx-auto w-full border-t border-zinc-900/60 bg-zinc-950">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800/80 text-[9px] font-bold tracking-[0.15em] text-orange-400 uppercase">
              <Zap className="size-3" />
              SOVEREIGN RISK & YIELD AUDITS
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] uppercase">
              Forged Yields,<br />
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                De-risked.
              </span>
            </h2>
            
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light font-sans">
              Traditional DeFi optimization is chaotic and blind to concentration hazards. Enderforge runs localized Herfindahl-Hirschman index audits to isolate exposure boundaries, while routing real-time yield signals through micrometric telemetry arrays.
            </p>
          </div>

          {/* Precision Bento Cards Fold */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-xs text-left space-y-4 group hover:border-orange-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="size-10 rounded-xl bg-orange-500/5 flex items-center justify-center text-orange-400 border border-orange-500/10 shadow-lg shadow-orange-500/5">
                <TrendingUp className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-zinc-100 flex items-center gap-1.5 uppercase tracking-wide">
                  Signal Lathe
                  <ArrowUpRight className="size-3 text-zinc-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-light">
                  Continuous discovery of premium yields directly routed from Kamino vaults, Jito staking, and Drift lending pools.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-xs text-left space-y-4 group hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="size-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-400 border border-amber-500/10 shadow-lg shadow-amber-500/5">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-zinc-100 flex items-center gap-1.5 uppercase tracking-wide">
                  Caliper Core
                  <ArrowUpRight className="size-3 text-zinc-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-light">
                  Advanced caliper audits analyzing wallet diversification index factors, locking out volatility flags.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-900/80 backdrop-blur-xs text-left space-y-4 group hover:border-orange-600/20 transition-all duration-300 hover:-translate-y-1 md:col-span-2">
              <div className="size-10 rounded-xl bg-orange-600/5 flex items-center justify-center text-orange-500 border border-orange-600/10 shadow-lg shadow-orange-600/5">
                <Sparkles className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-zinc-100 flex items-center gap-1.5 uppercase tracking-wide">
                  AI Crucible Synthesis
                  <ArrowUpRight className="size-3 text-zinc-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-light">
                  Custom-milled portfolio summaries and strategy suggestions compiled in real-time by our decentralized Llama3 AI orchestrator.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Deep Graphite Footer */}
      <footer className="py-12 text-center border-t border-zinc-900/60 text-zinc-600 text-[10px] font-mono tracking-[0.2em] bg-zinc-950 uppercase">
        Designed for Solana 2026 kit infrastructure. Enderforge foundry. All rights reserved.
      </footer>
    </div>
  );
}
