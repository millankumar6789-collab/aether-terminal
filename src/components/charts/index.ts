/* ──────────────────────────────────────────────────────────────────────────
 * Chart entry point — re-exports LiveChart for both static + dynamic import.
 * This ensures Turbopack on Vercel doesn't tree-shake the chart library.
 * ────────────────────────────────────────────────────────────────────────── */
export { default } from "./live-chart";