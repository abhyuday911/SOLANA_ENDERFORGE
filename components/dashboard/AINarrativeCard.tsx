"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

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
          <div 
            className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ 
              // Basic line break handling if it's not perfect markdown
              __html: summary.replace(/\n/g, '<br/>') 
            }}
          />
        ) : (
          <p className="text-sm text-zinc-500 italic">
            Connect your wallet to generate an AI-powered strategic summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
