import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -z-10 opacity-50" />
      
      <header className="px-6 py-8 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
            <Zap className="size-5 text-zinc-950 fill-zinc-950" />
          </div>
          Solana <span className="text-emerald-400">Yield</span>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800">
            DASHBOARD
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
            <Sparkles className="size-3" />
            V1.0 Live on Mainnet
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Optimize Your Solana <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Yield with AI
            </span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Professional-grade risk analysis and automated yield discovery for the modern Solana degen. 
            Connect. Analyze. Optimize.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto px-8 h-14 rounded-2xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold text-lg shadow-xl shadow-emerald-500/20">
              LAUNCH ANALYSIS
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="px-8 h-14 rounded-2xl border-zinc-800 bg-transparent text-zinc-300 font-bold text-lg">
            VIEW DOCS
          </Button>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12 pb-24">
          <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm text-left space-y-3 group hover:border-emerald-500/30 transition-colors">
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="size-6" />
            </div>
            <h3 className="font-bold text-lg">Yield Matcher</h3>
            <p className="text-zinc-500 text-sm">Real-time matching against Kamino, Drift, and MarginFi liquidity pools.</p>
          </div>
          <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm text-left space-y-3 group hover:border-emerald-500/30 transition-colors">
            <div className="size-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="font-bold text-lg">Risk Engine</h3>
            <p className="text-zinc-500 text-sm">HHI diversification scores and concentration risk monitoring for your wallet.</p>
          </div>
          <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm text-left space-y-3 group hover:border-emerald-500/30 transition-colors">
            <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Sparkles className="size-6" />
            </div>
            <h3 className="font-bold text-lg">AI Orchestration</h3>
            <p className="text-zinc-500 text-sm">Synthesized strategic summaries powered by Groq Llama3-70B model.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center border-t border-zinc-900 text-zinc-600 text-sm">
        Built for the Solana 2026 kit infrastructure. Dark mode default.
      </footer>
    </div>
  );
}

