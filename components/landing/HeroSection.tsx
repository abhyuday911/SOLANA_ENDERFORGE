"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Activity } from "lucide-react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP ScrollTrigger plugin on client side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Dynamically import the heavy WebGL Canvas component with a fallback skeleton
const PortfolioIntelligenceCore = dynamic(
  () => import("./PortfolioIntelligenceCore"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 z-0 bg-zinc-950 flex items-center justify-center">
        {/* Glowing molten forge indicator representing engine startup */}
        <div className="relative size-48 rounded-full bg-orange-500/5 blur-3xl animate-pulse flex items-center justify-center border border-orange-500/10">
          <div className="size-24 rounded-full bg-amber-500/5 blur-xl animate-ping" />
        </div>
      </div>
    ),
  }
);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [pointerCoords, setPointerCoords] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [alignmentProgress, setAlignmentProgress] = useState(0);

  // 1. Capture pointer positions (normalized between -1 and 1) for WebGL physics tilt
  const handlePointerMove = (e: React.PointerEvent) => {
    if (typeof window === "undefined") return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    setPointerCoords({ x, y });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Setup initial states for UI typography (reveal from clip mask)
      gsap.set([titleRef.current, subtitleRef.current, actionsRef.current, badgeRef.current, statsRef.current], {
        opacity: 0,
        y: 40
      });

      const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 1.4 } });

      // 2. Entrance Animation: Staggered HUD reveals
      tl.to(badgeRef.current, { opacity: 1, y: 0, delay: 0.3 })
        .to(titleRef.current, { opacity: 1, y: 0 }, "-=1.1")
        .to(subtitleRef.current, { opacity: 1, y: 0 }, "-=1.1")
        .to(actionsRef.current, { opacity: 1, y: 0 }, "-=1.1")
        .to(statsRef.current, { opacity: 1, y: 0 }, "-=1.1");

      // 3. WebGL Alignment Timeline: Continuous calibration loop
      const alignObj = { progress: 0 };
      const loopTl = gsap.timeline({
        repeat: -1,
        delay: 0.4
      });

      loopTl
        // Step A: Converge rings to the center (forged state)
        .to(alignObj, {
          progress: 1,
          duration: 2.2,
          ease: "power3.inOut",
          onUpdate: () => {
            setAlignmentProgress(alignObj.progress);
          }
        })
        // Step B: Hold at the center perfectly aligned (molten lock state)
        .to(alignObj, {
          progress: 1,
          duration: 0.4
        })
        // Step C: Disperse rings back to initial chaotic offsets
        .to(alignObj, {
          progress: 0,
          duration: 2.2,
          ease: "power3.inOut",
          onUpdate: () => {
            setAlignmentProgress(alignObj.progress);
          }
        })
        // Step D: Hold at unaligned chaotic boundaries
        .to(alignObj, {
          progress: 0,
          duration: 2.0
        });

      // 4. GSAP ScrollTrigger: Connect camera movement & visual scaling to scroll progress
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative min-h-screen flex flex-col justify-between px-6 pt-24 pb-16 overflow-hidden bg-zinc-950 text-zinc-50 select-none"
    >
      {/* 3D WebGL Canvas Layer */}
      <PortfolioIntelligenceCore
        pointerCoords={pointerCoords}
        alignmentProgress={alignmentProgress}
        scrollProgress={scrollProgress}
      />

      {/* Grid Pattern Ambient Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293706_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none opacity-5" />

      <header className="absolute top-0 left-0 right-0 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full border-b border-zinc-900/30 backdrop-blur-md z-30">
        <div className="flex items-center gap-3 font-extrabold text-base tracking-[0.2em] text-zinc-100">
          <Link
            href="/"
            aria-label="Go to home"
            className="flex items-center gap-2.5"
          >
            <img src="/ELDERFORGE.png" alt="Enderforge Logo" className="size-8 object-contain" />
            <span className="uppercase tracking-[0.25em] font-black text-xs sm:text-sm">
              <span className="text-zinc-400">ENDER</span>
              <span className="text-orange-500">FORGE</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-[0.15em] text-orange-400 border border-orange-500/20 bg-orange-500/5 px-3 py-1 rounded-full uppercase">
            <span className="size-1.5 rounded-full bg-orange-500" />
            CALIBRATION ENGINE ACTIVE
          </span>

          <Link href="/dashboard">
            <Button variant="outline" className="rounded-xl border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-[10px] font-bold tracking-[0.15em] text-zinc-300">
              LAUNCH TERMINAL
            </Button>
          </Link>
        </div>
      </header>

      {/* Central Hero Core Copy */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-10 z-10 pt-20">

        {/* Subtle Pill Tag */}
        <div ref={badgeRef} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 text-[9px] font-bold tracking-[0.15em] text-orange-400 uppercase shadow-2xl backdrop-blur-sm">
          <Activity className="size-3 text-orange-500" />
          SOVEREIGN RISK CALIBRATION
        </div>

        {/* Typographic Mask Title */}
        <h1
          ref={titleRef}
          className="text-5xl md:text-8xl font-black tracking-tight leading-[1.05] text-zinc-100 uppercase"
        >
          signal.<br />
          <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent filter drop-shadow-[0_2px_15px_rgba(249,115,22,0.15)]">
            extraction.
          </span>
          <br />audited.
        </h1>

        {/* Sophisticated Subtitle */}
        <p
          ref={subtitleRef}
          className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-sans font-light"
        >
          An instrument-grade telemetry console for Solana treasuries. We deploy mathematical concentration audits and map secure, real-time yield routes for idle liquidity.
        </p>

        {/* High-Fidelity Floating Call-to-Actions */}
        <div
          ref={actionsRef}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center"
        >
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="group relative w-full sm:w-auto px-8 h-14 rounded-2xl bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-bold text-sm tracking-wider shadow-2xl transition-all overflow-hidden duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              RUN PORTFOLIO AUDIT
              <ArrowRight className="size-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="px-8 h-14 rounded-2xl border-zinc-800/80 bg-zinc-900/20 backdrop-blur-sm text-zinc-300 font-bold text-sm tracking-wider hover:bg-zinc-900/60"
          >
            VIEW SYSTEM SPECS
          </Button>
        </div>
      </div>

      {/* Hero Footnotes HUD (Real-time simulated metrics block) */}
      <div
        ref={statsRef}
        className="relative w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-zinc-900/40 z-10"
      >
        <div className="flex items-center gap-3.5 bg-zinc-900/10 border border-zinc-900/30 p-4 rounded-2xl backdrop-blur-xs">
          <div className="size-10 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center text-orange-400">
            <Activity className="size-5" />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">HHI Defense Matrix</p>
            <p className="text-xs font-semibold text-zinc-200 font-mono">Mathematical diversification scoring</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 bg-zinc-900/10 border border-zinc-900/30 p-4 rounded-2xl backdrop-blur-xs">
          <div className="size-10 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-400">
            <Zap className="size-5" />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Informational Routing</p>
            <p className="text-xs font-semibold text-zinc-200 font-mono">Real on-chain yield discovery</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 bg-zinc-900/10 border border-zinc-900/30 p-4 rounded-2xl backdrop-blur-xs">
          <div className="size-10 rounded-xl bg-orange-600/5 border border-orange-600/10 flex items-center justify-center text-orange-500">
            <ShieldCheck className="size-5" />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Decentralized AI Synthesis</p>
            <p className="text-xs font-semibold text-zinc-200 font-mono">Explanatory strategy cards by Llama</p>
          </div>
        </div>
      </div>
    </section>
  );
}
