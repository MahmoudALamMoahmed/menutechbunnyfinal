/**
 * Calculate dynamic YAxis width based on the max value in the dataset.
 * Returns a clamped width that adapts to number length.
 */
export function calcYAxisWidth(maxValue: number, formatter?: (v: number) => string): number {
  const label = formatter ? formatter(maxValue) : String(maxValue);
  // ~8px per character + 16px padding, clamped between 40 and 120
  const raw = label.length * 8 + 16;
  return Math.max(40, Math.min(120, raw));
}
