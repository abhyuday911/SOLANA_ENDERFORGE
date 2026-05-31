import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SolanaProviders } from "@/components/providers/solana-providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ENDERFORGE | AI-Powered DeFi Insights",
  description: "Analyze your wallet risks and optimize yields with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "dark",
        geistSans.variable,
        geistMono.variable,
        inter.variable
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-graphite-canvas text-zinc-100 font-sans selection:bg-orange-500/20">
        <SolanaProviders>{children}</SolanaProviders>
      </body>
    </html>
  );
}

