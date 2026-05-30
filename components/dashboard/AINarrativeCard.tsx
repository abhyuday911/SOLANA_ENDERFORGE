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
    <div className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-900/60 backdrop-blur-xs flex flex-col space-y-4 font-mono relative overflow-hidden group">
      
      {/* Subtle CAD Background Grid Element */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Terminal className="size-24 text-orange-500 rotate-12" />
      </div>

      {/* Terminal Titlebar HUD */}
      <div className="flex items-center justify-between border-b border-zinc-900/40 pb-3">
        <div className="space-y-1">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-orange-500" />
            AI Insights
          </h3>
          <p className="text-[11px] text-zinc-500 uppercase">
            Tactical risk directive & portfolio diagnostics
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-zinc-800" />
          <span className="size-2 rounded-full bg-zinc-800" />
          <span className="size-2 rounded-full bg-zinc-800" />
        </div>
      </div>

      {/* Monospace Code Terminal Content */}
      <div className="bg-zinc-950/60 border border-zinc-900/60 rounded-xl p-5 md:p-6 overflow-y-auto max-h-[380px] font-mono text-[11px] leading-relaxed text-zinc-300">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-600 text-[10px]">
              <span className="animate-spin text-orange-500">⚡</span>
              <span>COMPILING LLAMA3 RISK DIRECTIVES...</span>
            </div>
            <Skeleton className="h-4 w-3/4 bg-zinc-900/80 rounded-md" />
            <Skeleton className="h-4 w-full bg-zinc-900/80 rounded-md" />
            <Skeleton className="h-4 w-5/6 bg-zinc-900/80 rounded-md" />
            <Skeleton className="h-24 w-full bg-zinc-900/60 rounded-xl" />
          </div>
        ) : summary ? (
          <div className="prose prose-invert max-w-none text-zinc-300">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => (
                  <h1 
                    className="text-orange-500 font-bold uppercase tracking-wider text-xs border-b border-zinc-900/60 pb-1.5 mb-3 mt-5 first:mt-0" 
                    {...props} 
                  />
                ),
                h2: ({ ...props }) => (
                  <h2 
                    className="text-orange-400 font-bold uppercase tracking-wide text-[11px] mb-2.5 mt-4" 
                    {...props} 
                  />
                ),
                h3: ({ ...props }) => (
                  <h3 
                    className="text-amber-500 font-bold text-[10px] uppercase tracking-wide mb-2 mt-4" 
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
                  <p className="mb-3.5 last:mb-0 text-zinc-300" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc pl-4 space-y-2 mb-4 text-zinc-400" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal pl-4 space-y-2 mb-4 text-zinc-400" {...props} />
                ),
                li: ({ ...props }) => (
                  <li className="marker:text-orange-500" {...props} />
                ),
                code: ({ ...props }) => (
                  <code 
                    className="bg-zinc-900/80 border border-zinc-800/40 px-1.5 py-0.5 rounded-md text-amber-500 font-mono text-[10px] font-bold" 
                    {...props} 
                  />
                ),
              }}
            >
              {summary}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-zinc-500 italic text-center">
            Connect your Solana wallet to compile localized artificial intelligence directives.
          </div>
        )}
      </div>

      {/* Telemetry Status Line */}
      <div className="flex justify-between items-center text-[9px] text-zinc-600">
        <span>AI_ENGINE: LLAMA-3-SOLANA-OPERATOR</span>
        <span>LATENCY: ZERO_CACHE</span>
      </div>

    </div>
  );
}
