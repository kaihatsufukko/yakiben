import { describe, expect, it } from 'vitest';
import { calculateLovePercent, getStarRating } from './love';

describe('calculateLovePercent', () => {
  it('returns 0 when there are no enemies', () => {
    expect(calculateLovePercent(0, 0)).toBe(0);
  });

  it('calculates a basic percentage', () => {
    expect(calculateLovePercent(5, 10)).toBe(50);
    expect(calculateLovePercent(10, 10)).toBe(100);
  });

  it('clamps to 100 when melomelo count exceeds total', () => {
    expect(calculateLovePercent(15, 10)).toBe(100);
  });

  it('clamps negative counts to 0', () => {
    expect(calculateLovePercent(-3, 10)).toBe(0);
  });
});

describe('getStarRating', () => {
  it('returns 0 stars when not cleared, regardless of LOVE%', () => {
    expect(getStarRating(100, false)).toBe(0);
    expect(getStarRating(0, false)).toBe(0);
  });

  it('returns 3 stars at high LOVE%', () => {
    expect(getStarRating(85, true)).toBe(3);
    expect(getStarRating(100, true)).toBe(3);
  });

  it('returns 2 stars at mid LOVE%', () => {
    expect(getStarRating(50, true)).toBe(2);
    expect(getStarRating(84, true)).toBe(2);
  });

  it('returns 1 star when cleared with low LOVE%', () => {
    expect(getStarRating(0, true)).toBe(1);
    expect(getStarRating(49, true)).toBe(1);
  });
});
