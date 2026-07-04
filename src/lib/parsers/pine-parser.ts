import type { StrategyDef } from "@/lib/validators/strategy";

export function parsePine(
  content: string,
  file_name: string
): { success: boolean; definition?: StrategyDef; error?: string } {
  // Extract strategy name from known Pine patterns
  const nameMatch =
    content.match(/\/\/\s*@version\s*=\s*\d+\s*\/\/\s*(.+)/) ||
    content.match(/\/\/\s*(?:Title|Strategy|Name):\s*(.+)/) ||
    content.match(/strategy\(["']([^"']+)["']/);

  const name = nameMatch?.[1]?.trim() || file_name.replace(/\.pine$/i, "");

  // Detect SMC / ICT from known keyword patterns
  const isSMC =
    /order[\s-]*block/i.test(content) ||
    /breaker/i.test(content) ||
    /bos\b/i.test(content) ||
    /fvg\b/i.test(content) ||
    /liquidity[\s-]*(?:void|sweep|grab)/i.test(content);

  const isICT =
    /kill[\s-]*zone/i.test(content) ||
    /optimal[\s-]*trade[\s-]*entry/i.test(content) ||
    /ote\b/i.test(content) ||
    /cte\b/i.test(content) ||
    /silver[\s-]*bullet/i.test(content);

  const type = (isSMC || isICT ? "SMC" :
    /scalp/i.test(content) ? "SCALPING" :
    /swing/i.test(content) ? "SWING" :
    /position/i.test(content) ? "POSITION" :
    /quant/i.test(content) ? "QUANT" :
    "DAY") as StrategyDef["type"];

  // Extract entry conditions from Pine patterns
  const entryPatterns = [
    ...(content.match(/(?:long|short)Condition\s*=\s*(.+?)(?:\n|$)/g) || []),
    ...(content.match(/strategy\.entry\([^,]+,\s*[^,]+,\s*(?:when\s*=\s*)?(.+?)\)/g) || []),
  ]
    .map((p) =>
      p
        .replace(/strategy\.entry\(/, "")
        .replace(/longCondition\s*=/, "")
        .replace(/shortCondition\s*=/, "")
        .trim()
    )
    .slice(0, 5);

  // Extract exit patterns from strategy.exit / strategy.close calls
  const exitPatterns =
    content.match(/(?:strategy\.exit|strategy\.close)\(([^)]+?)\)/g) || [];

  return {
    success: true,
    definition: {
      name,
      type,
      market: content.match(/symbol\s*=\s*["']?([A-Z0-9/]+)["']?/)?.[1],
      timeframe: content.match(
        /timeframe\s*=\s*["']?(1[mhDW]|15m|4h)["']?/
      )?.[1] as StrategyDef["timeframe"] | undefined,
      entry_conditions: entryPatterns.length
        ? entryPatterns
        : ["(extracted from Pine strategy entry calls)"],
      exit_conditions: exitPatterns.length
        ? exitPatterns.map((p) => p.trim())
        : ["(extracted from Pine strategy exit calls)"],
    },
  };
}