import { parsePine } from "./pine-parser";
import { parseMql } from "./mql-parser";
import { parsePython } from "./python-parser";
import type { StrategyDef } from "@/lib/validators/strategy";

export type ParseResult = {
  success: boolean;
  definition?: StrategyDef;
  error?: string;
  warnings?: string[];
};

export async function parseStrategy(
  content: string,
  file_type: string,
  file_name: string
): Promise<ParseResult> {
  switch (file_type.toUpperCase()) {
    case "PINE":
      return parsePine(content, file_name);
    case "MQL4":
    case "MQL5":
      return parseMql(content, file_type);
    case "PYTHON":
      return parsePython(content);
    case "JSON":
    case "YAML":
    case "MD":
    case "TXT":
      return {
        success: true,
        definition: {
          name: file_name.replace(/\.[^.]+$/, ""),
          type: "HYBRID",
          entry_conditions: [
            "(unstructured — manual review required)",
          ],
          exit_conditions: [
            "(unstructured — manual review required)",
          ],
        },
        warnings: [
          "Unstructured format — manual review recommended",
        ],
      };
    default:
      return {
        success: false,
        error: `Unsupported format: ${file_type}`,
      };
  }
}