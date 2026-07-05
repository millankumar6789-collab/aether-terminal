/* ──────────────────────────────────────────────────────────────────────────
 * Chart loader — ensures lightweight-charts is bundled on Turbopack.
 *
 * Turbopack needs import() at module scope, not inside useEffect.
 * This file is imported statically by terminal/page.tsx, forcing
 * Turbopack to include the chart library chunk.
 * ────────────────────────────────────────────────────────────────────────── */

// Force Turbopack to discover the dynamic import at module scope
export const loadChart = () => import("./live-chart");

export { default } from "./live-chart";