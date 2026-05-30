"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

import ReactMarkdown from "react-markdown";

interface AINarrativeCardProps {
  summary?: string;
  isLoading?: boolean;
}

export function AINarrativeCard({ summary, isLoading }: AINarrativeCardProps) {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Sparkles className="size-24 text-emerald-400 rotate-12" />
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
          <Sparkles className="size-4" />
          Strategic Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
            <Skeleton className="h-4 w-full bg-zinc-800" />
            <Skeleton className="h-4 w-5/6 bg-zinc-800" />
            <Skeleton className="h-32 w-full bg-zinc-800 rounded-xl" />
          </div>
        ) : summary ? (
          <div className="prose prose-invert prose-sm max-w-none prose-emerald text-zinc-300 leading-relaxed font-sans">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 className="text-emerald-400 font-bold" {...props} />,
                h2: ({ ...props }) => <h2 className="text-emerald-400 font-bold mt-6 mb-2" {...props} />,
                h3: ({ ...props }) => <h3 className="text-emerald-400 font-semibold mt-4 mb-2" {...props} />,
                h4: ({ ...props }) => <h4 className="text-emerald-400 font-semibold" {...props} />,
                strong: ({ ...props }) => <strong className="text-emerald-400/60 font-bold" {...props} />,
              }}
            >
              {summary}
            </ReactMarkdown>

          </div>

        ) : (
          <p className="text-sm text-zinc-500 italic">
            Connect your wallet to generate an AI-powered strategic summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

