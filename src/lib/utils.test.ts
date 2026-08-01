import { describe, it, expect } from 'vitest';
import { formatNumber, cn } from './utils';

describe('Utility Functions (utils.ts)', () => {
  it('correctly formats numbers over 1000 with k suffix', () => {
    expect(formatNumber(1500)).toBe('1.5k');
    expect(formatNumber(1000)).toBe('1.0k');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(12500)).toBe('12.5k');
  });

  it('correctly formats numbers under 1000 without suffix', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(999)).toBe('999');
  });

  it('merges tailwind classes intelligently', () => {
    // Should resolve conflicts (px-2 overrides p-4 for x-axis)
    const result = cn('p-4 bg-red-500', 'px-2 bg-blue-500');
    expect(result).toContain('px-2');
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-red-500');
  });
});
