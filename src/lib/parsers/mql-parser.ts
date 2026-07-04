import type { StrategyDef } from "@/lib/validators/strategy";

export function parseMql(
  content: string,
  file_type: string
): { success: boolean; definition?: StrategyDef; error?: string } {
  const version = file_type === "MQL5" ? "MQL5" : "MQL4";

  // Extract strategy name from MQL metadata comments
  const nameMatch =
    content.match(/Expert\s+Name:\s*(.+)/) ||
    content.match(/class\s+(\w+)\s*(?:extends|:)/) ||
    content.match(/\/\/\+\s*#property\s+description\s+"([^"]+)"/);

  const name = nameMatch?.[1]?.trim() || `MQL${version.slice(3)} Strategy`;

  // Count OrderSend / PositionOpen (entry) calls
  const entryMatches =
    content.match(
      /OrderSend\([^)]*?(?:OP_BUY|POSITION_TYPE_BUY|POSITION_TYPE_SELL)[^)]*\)/g
    ) || [];

  // Count OrderClose / PositionClose (exit) calls
  const exitMatches =
    content.match(/(?:OrderClose|PositionClose)\([^)]+?\)/g) || [];

  // Detect strategy type from content keywords
  const type = (/scalp/i.test(content) ? "SCALPING" :
    /swing/i.test(content) ? "SWING" :
    /position/i.test(content) ? "POSITION" :
    /quant/i.test(content) || /stati/i.test(content) ? "QUANT" :
    /order.*block|breaker|bos|fvg|liquidity.*(?:void|sweep)/i.test(content) ? "SMC" :
    "DAY") as StrategyDef["type"];

  return {
    success: true,
    definition: {
      name: `${name} (${version})`,
      type,
      entry_conditions: entryMatches.length
        ? [`${entryMatches.length} OrderSend/PositionOpen calls detected`]
        : undefined,
      exit_conditions: exitMatches.length
        ? [`${exitMatches.length} OrderClose/PositionClose calls detected`]
        : undefined,
    },
  };
}