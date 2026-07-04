import type { StrategyDef } from "@/lib/validators/strategy";

export function parsePython(
  content: string
): { success: boolean; definition?: StrategyDef; error?: string } {
  // Check for common trading framework imports
  const hasFramework =
    /import\s+(?:zipline|backtrader|vectorbt|alpaca|ccxt)/i.test(content);

  // Extract class name or header comment
  const nameMatch =
    content.match(/#\s*(?:Strategy|Name|Title):\s*(.+)/) ||
    content.match(/class\s+(\w+(?:Strategy|Bot|Trader))\s*(?:\(|:)/);

  const name = nameMatch?.[1]?.trim() || "Python Strategy";

  // Detect entry/exit function presence
  const hasEntry = /def\s+(?:buy|enter|long|signal)/i.test(content);
  const hasExit = /def\s+(?:sell|exit|short|close)/i.test(content);
  const hasRisk =
    /(?:stop_loss|take_profit|risk|max_drawdown)/i.test(content);

  // Infer type from imports / docstrings
  const type = (/quant/i.test(content) || /stati/i.test(content) || /model/i.test(content) ? "QUANT" :
    /swing/i.test(content) ? "SWING" :
    "DAY") as StrategyDef["type"];

  const warnings = hasFramework
    ? undefined
    : ["No recognised trading framework import detected"];

  return {
    success: true,
    definition: {
      name,
      type,
      entry_conditions: hasEntry
        ? ["(detected entry function — validate signals in backtest)"]
        : ["⚠️ No entry function detected"],
      exit_conditions: hasExit
        ? ["(detected exit function)"]
        : ["⚠️ No exit function detected"],
    },
    ...(warnings && { warnings }),
  };
}