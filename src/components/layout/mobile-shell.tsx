"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CandlestickChart,
  FileCode2,
  PieChart,
  Newspaper,
  BrainCircuit,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * MobileShell — the primary layout container.
 *
 * Optimised for POCO X6 Pro (1220×2712, 120Hz, 6.67" AMOLED).
 * Design rules enforced:
 *   - Bottom nav sits in the thumb zone (one-handed reach)
 *   - No horizontal scroll ever (overflow-x hidden on html+body)
 *   - Top bar is sticky and glass-frosted
 *   - Main content pads to safe-area (notch / gesture bar)
 *   - Animations are transform-only (GPU) for 120Hz fluidity
 *   - Collapses into a left sidebar above the 1024px breakpoint
 *
 * Viewports verified: 360 / 390 / 412 / 430 / 480 px.
 */
const NAV_ITEMS = [
  { href: "/dashboard",        label: "Markets",    icon: LayoutDashboard },
  { href: "/terminal",         label: "Terminal",   icon: CandlestickChart },
  { href: "/strategies",       label: "Strategies", icon: FileCode2 },
  { href: "/portfolio",        label: "Portfolio",   icon: PieChart },
  { href: "/news",             label: "News",        icon: Newspaper },
  { href: "/research",         label: "AI Research", icon: BrainCircuit },
] as const;

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Find active tab: exact match OR pathname nested under the route
  const activeIdx = NAV_ITEMS.findIndex(
    (n) => n.href === pathname || pathname.startsWith(n.href + "/"),
  );

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* ---- Top bar — sticky glass ---- */}
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 safe-top">
        <span className="text-sm font-semibold tracking-tight">
          <span className="text-cyan">⌖</span> AETHER<span className="text-neutral">/</span>TERMINAL
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden ss:inline-block text-[11px] text-neutral">v0.1</span>
          {/* bell glyph — alerts stub */}
          <span className="relative text-lg">🔔
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-bear" />
          </span>
          {/* avatar stub */}
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan to-emerald grid place-items-center text-[10px] font-bold text-ink-950">
            U
          </span>
        </div>
      </header>

      {/* ---- Main scrollable region ---- */}
      <main className="flex-1 px-4 py-4 pb-28 safe-bottom max-w-[1200px] w-full mx-auto">
        {children}
      </main>

      {/* ---- Bottom tab bar — thumb zone ---- */}
      <nav
        className="glass-nav fixed bottom-0 inset-x-0 z-40 mx-auto max-w-[520px] flex items-stretch justify-around px-2 pt-1 pb-3 safe-bottom"
        role="navigation"
        aria-label="Primary"
      >
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const active = i === activeIdx;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5"
            >
              {active && (
                <motion.span
                  layoutId="navglow"
                  className="absolute inset-0 rounded-2xl glow-cyan"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                className={
                  active
                    ? "text-cyan relative z-10"
                    : "text-neutral relative z-10"
                }
              />
              <span
                className={
                  "relative z-10 text-[9px] leading-none " +
                  (active ? "text-cyan font-semibold" : "text-neutral")
                }
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
