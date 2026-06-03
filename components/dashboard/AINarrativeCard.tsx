"use client";

import { Terminal, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";

interface AINarrativeCardProps {
  summary?: string;
  isLoading?: boolean;
}

export function AINarrativeCard({ summary, isLoading }: AINarrativeCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-graphite-plate border-milled-bevel shadow-milled-elevated flex flex-col space-y-3 font-mono relative overflow-hidden group select-text">
      
      {/* Subtle CAD Background Grid Element */}
      <div className="absolute top-0 right-0 p-4 opacity-3 pointer-events-none">
        <Terminal className="size-24 text-orange-500 rotate-12" />
      </div>

      {/* Terminal Titlebar HUD */}
      <div className="flex items-center justify-between border-b border-zinc-950/40 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-orange-500" />
            AI DIAGNOSTIC INSIGHTS
          </h3>
          <p className="text-[10px] text-zinc-400 uppercase">
            Tactical risk directive & portfolio diagnostics
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-zinc-800" />
          <span className="size-1.5 rounded-full bg-zinc-800" />
          <span className="size-1.5 rounded-full bg-zinc-800" />
        </div>
      </div>

      {/* Monospace Code Terminal Content */}
      <div className="bg-graphite-sunk shadow-milled-sunk border border-zinc-950/80 rounded-xl p-4 md:p-5 overflow-y-auto scrollbar-hide max-h-[320px] font-mono text-[11px] leading-relaxed text-zinc-300">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-500 text-[9px] uppercase tracking-wider">
              <span className="animate-spin text-orange-500">⚡</span>
              <span>COMPILING SOLANA RISK DIRECTIVES...</span>
            </div>
            <Skeleton className="h-4 w-3/4 bg-graphite-plate/80 rounded-md" />
            <Skeleton className="h-4 w-full bg-graphite-plate/80 rounded-md" />
            <Skeleton className="h-4 w-5/6 bg-graphite-plate/80 rounded-md" />
            <Skeleton className="h-20 w-full bg-graphite-plate/60 rounded-xl" />
          </div>
        ) : summary ? (
          <div className="prose prose-invert max-w-none text-zinc-300">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => (
                  <h1 
                    className="text-orange-500 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-950/40 pb-1.5 mb-3 mt-5 first:mt-0" 
                    {...props} 
                  />
                ),
                h2: ({ ...props }) => (
                  <h2 
                    className="text-zinc-200 font-bold uppercase tracking-wide text-[10px] mb-2 mt-4" 
                    {...props} 
                  />
                ),
                h3: ({ ...props }) => (
                  <h3 
                    className="text-zinc-300 font-bold text-[10px] uppercase tracking-wide mb-2 mt-4" 
                    {...props} 
                  />
                ),
                h4: ({ ...props }) => (
                  <h4 
                    className="text-zinc-200 font-bold text-[10px] mb-1.5" 
                    {...props} 
                  />
                ),
                strong: ({ ...props }) => (
                  <strong className="text-amber-500 font-bold" {...props} />
                ),
                p: ({ ...props }) => (
                  <p className="mb-3 last:mb-0 text-zinc-400 font-sans font-light" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc pl-4 space-y-1.5 mb-3 text-zinc-400" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal pl-4 space-y-1.5 mb-3 text-zinc-400" {...props} />
                ),
                li: ({ ...props }) => (
                  <li className="marker:text-orange-500 font-sans text-xs" {...props} />
                ),
                code: ({ ...props }) => (
                  <code 
                    className="bg-graphite-plate border border-zinc-900 px-1.5 py-0.5 rounded text-amber-500 font-mono text-[10px] font-bold" 
                    {...props} 
                  />
                ),
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-zinc-500 italic text-center font-sans text-xs">
            Connect your Solana wallet to compile localized artificial intelligence directives.
          </div>
        )}
      </div>

      {/* Telemetry Status Line */}
      <div className="flex justify-between items-center text-[8px] text-zinc-600 uppercase tracking-widest font-mono select-text">
        <span>AI_ENGINE: LLAMA-3-SOLANA-OPERATOR</span>
        <span>LATENCY: ZERO_CACHE</span>
      </div>

    </div>
  );
}
