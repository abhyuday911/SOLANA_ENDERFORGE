"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface MetricPopoverProps {
  id: string;
  title: string;
  badgeText: string;
  badgeVariant?: "info" | "warning" | "success" | "critical";
  footerLeft?: string;
  footerRight?: string;
  align?: "center" | "left" | "right";
  position?: "top" | "bottom";
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function MetricPopover({
  id,
  title,
  badgeText,
  badgeVariant = "info",
  footerLeft,
  footerRight,
  align = "center",
  position = "top",
  content,
  children,
  className,
}: MetricPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setCoords(null);
  };

  // Recalculate coordinates during scroll and resize to keep alignment exact
  useEffect(() => {
    if (!isOpen) return;

    const updateCoords = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    window.addEventListener("scroll", updateCoords, { passive: true });
    window.addEventListener("resize", updateCoords);

    return () => {
      window.removeEventListener("scroll", updateCoords);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  // Click outside listener for mobile tap support
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return;
      }
      handleClose();
    };

    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction);

    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
    };
  }, [isOpen]);

  const badgeColorClass = cn(
    "text-[8px] font-bold px-1.5 py-0.5 rounded border leading-none uppercase tracking-wider font-mono select-none",
    badgeVariant === "info" && "border-zinc-800 bg-graphite-sunk text-zinc-400",
    badgeVariant === "warning" && "border-orange-500/20 bg-orange-500/10 text-orange-400",
    badgeVariant === "success" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    badgeVariant === "critical" && "border-rose-500/20 bg-rose-500/10 text-rose-400"
  );

  let positioningStyle: React.CSSProperties = {};
  if (coords) {
    const isTop = position === "top";
    const topCoord = isTop ? coords.top : coords.top + coords.height;
    const transformY = isTop ? "-100%" : "0%";
    const marginY = isTop ? "-10px" : "10px";

    if (align === "center") {
      positioningStyle = {
        position: "fixed",
        top: topCoord,
        left: coords.left + coords.width / 2,
        transform: `translate(-50%, ${transformY})`,
        marginTop: marginY,
        zIndex: 9999,
      };
    } else if (align === "right") {
      positioningStyle = {
        position: "fixed",
        top: topCoord,
        left: coords.left + coords.width,
        transform: `translate(-100%, ${transformY})`,
        marginTop: marginY,
        zIndex: 9999,
      };
    } else {
      positioningStyle = {
        position: "fixed",
        top: topCoord,
        left: coords.left,
        transform: `translate(0%, ${transformY})`,
        marginTop: marginY,
        zIndex: 9999,
      };
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    // Prevent default touch/click triggers from doubling events
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle(e as any);
    } else if (e.key === "Escape" && isOpen) {
      handleClose();
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("inline-flex items-center focus:outline-none cursor-help select-none", className)}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
      >
        {children}
      </div>

      {mounted && isOpen && coords && typeof document !== "undefined" &&
        createPortal(
          <div style={positioningStyle} className="pointer-events-none">
            <div
              id={id}
              role="tooltip"
              className={cn(
                "w-64 p-3.5 bg-graphite-plate border border-zinc-800 rounded-xl shadow-2xl animate-in fade-in duration-150 text-[10px] font-mono text-zinc-300",
                position === "top" ? "slide-in-from-bottom-2" : "slide-in-from-top-2"
              )}
            >
              <div className="flex items-center justify-between border-b border-zinc-950/60 pb-1.5 mb-2 select-none">
                <span className="font-bold text-[9px] text-orange-500 uppercase tracking-widest font-mono">
                  {title}
                </span>
                <span className={badgeColorClass}>
                  {badgeText}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="leading-relaxed font-sans font-light text-zinc-400 text-left">
                  {content}
                </div>
                {(footerLeft || footerRight) && (
                  <div className="pt-2 border-t border-zinc-950/20 flex justify-between items-center text-[8px] text-zinc-500 uppercase tracking-wider font-mono select-none">
                    <span>{footerLeft || ""}</span>
                    <span>{footerRight || ""}</span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </>
  );
}
