// src/features/activity/transforms.ts

/**
 * Format a decimal close ratio to a readable percentage string.
 * e.g. 0.682 → "68%"
 */
export function formatCloseRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/**
 * Classify PR cycle time into a sentiment label.
 */
export function classifyPRCycleTime(avgDays: number): "fast" | "moderate" | "slow" {
  if (avgDays <= 3) return "fast";
  if (avgDays <= 10) return "moderate";
  return "slow";
}
