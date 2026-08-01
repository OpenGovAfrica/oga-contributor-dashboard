import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { windowToDays, windowToStartDate } from './zod-schemas';

describe('Time Window Logic (zod-schemas)', () => {
  beforeEach(() => {
    // Mock the system time to ensure consistent test results
    const mockDate = new Date('2026-08-01T15:30:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('correctly maps window strings to exact day counts', () => {
    expect(windowToDays('7d')).toBe(7);
    expect(windowToDays('30d')).toBe(30);
    expect(windowToDays('90d')).toBe(90);
  });

  it('calculates the correct start date aligned to midnight (00:00:00) for 7d window', () => {
    const startDate = windowToStartDate('7d');
    
    // 7 days before Aug 1 is July 25
    expect(startDate.getDate()).toBe(25);
    expect(startDate.getMonth()).toBe(6); // July is 0-indexed month 6
    expect(startDate.getFullYear()).toBe(2026);
    
    // Time should be strictly midnight local time
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(startDate.getSeconds()).toBe(0);
    expect(startDate.getMilliseconds()).toBe(0);
  });
});
