// src/features/overview/transforms.ts

/**
 * Format a signed number delta for display with +/- prefix.
 * e.g. 12 → "+12" | -5 → "-5"
 */
export function formatDelta(delta: number): string {
  return delta >= 0 ? `+${delta}` : `${delta}`;
}

/**
 * Classify a delta for semantic color usage.
 */
export function deltaClassification(
  delta: number,
  inverse = false,
): "positive" | "negative" | "neutral" {
  if (delta === 0) return "neutral";
  const isPositive = delta > 0;
  return (isPositive && !inverse) || (!isPositive && inverse)
    ? "positive"
    : "negative";
}
