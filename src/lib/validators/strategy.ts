import { z } from "zod";

export const STRATEGY_TYPES = [
  "SCALPING", "DAY", "SWING", "POSITION", "QUANT", "SMC", "ICT", "HYBRID"
] as const;

export const TIMEFRAMES = [
  "1m", "5m", "15m", "1h", "4h", "1D", "1W", "1M"
] as const;

export const ASSET_CLASSES = [
  "EQUITY", "FOREX", "CRYPTO", "COMMODITY", "INDEX", "BOND"
] as const;

export const strategyUploadSchema = z.object({
  name: z.string().min(1).max(120),
  market: z.string().optional(),
  asset_class: z.enum(ASSET_CLASSES).optional(),
  timeframe: z.enum(TIMEFRAMES).optional(),
  strategy_type: z.enum(STRATEGY_TYPES),
  source_file: z.string(),
  file_type: z.enum(["PINE", "MQL4", "MQL5", "PYTHON", "TXT", "MD", "JSON", "YAML"] as const),
  file_name: z.string().min(1),
});

export type StrategyUpload = z.infer<typeof strategyUploadSchema>;

export const strategyDefSchema = z.object({
  name: z.string(),
  type: z.enum(STRATEGY_TYPES),
  market: z.string().optional(),
  asset_class: z.enum(ASSET_CLASSES).optional(),
  timeframe: z.enum(TIMEFRAMES).optional(),
  entry_conditions: z.array(z.string()).optional(),
  exit_conditions: z.array(z.string()).optional(),
  risk_parameters: z.object({
    max_position_size_pct: z.number().min(0).max(100).optional(),
    stop_loss_pct: z.number().min(0).optional(),
    take_profit_pct: z.number().min(0).optional(),
    max_daily_loss_pct: z.number().min(0).max(100).optional(),
  }).optional(),
});

export type StrategyDef = z.infer<typeof strategyDefSchema>;