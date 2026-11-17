import { describe, expect, it } from 'vitest';
import {
  applyGateEffect,
  countDrawShibas,
  formationOffset,
  formatGateEffect,
  heartVolleyCount,
} from './pack';

describe('applyGateEffect', () => {
  it('multiplies the count', () => {
    expect(applyGateEffect(1, { kind: 'multiply', value: 2 })).toBe(2);
    expect(applyGateEffect(6, { kind: 'multiply', value: 4 })).toBe(24);
  });

  it('adds to the count', () => {
    expect(applyGateEffect(1, { kind: 'add', value: 5 })).toBe(6);
    expect(applyGateEffect(3, { kind: 'add', value: 15 })).toBe(18);
  });

  it('never goes below 1', () => {
    expect(applyGateEffect(1, { kind: 'add', value: -10 })).toBe(1);
    expect(applyGateEffect(0, { kind: 'multiply', value: 2 })).toBe(2);
  });

  it('clamps at the max shiba count (999 by default)', () => {
    expect(applyGateEffect(500, { kind: 'multiply', value: 4 })).toBe(999);
    expect(applyGateEffect(999, { kind: 'add', value: 5 })).toBe(999);
  });

  it('respects a custom max', () => {
    expect(applyGateEffect(90, { kind: 'multiply', value: 2 }, 100)).toBe(100);
  });
});

describe('formatGateEffect', () => {
  it('formats multiply and add effects', () => {
    expect(formatGateEffect({ kind: 'multiply', value: 2 })).toBe('×2');
    expect(formatGateEffect({ kind: 'add', value: 5 })).toBe('+5');
  });
});

describe('countDrawShibas', () => {
  it('draws the actual count when below the cap', () => {
    expect(countDrawShibas(1)).toBe(1);
    expect(countDrawShibas(24)).toBe(24);
  });

  it('caps drawing at 110 by default even for 999 shibas', () => {
    expect(countDrawShibas(999)).toBe(110);
    expect(countDrawShibas(500, 110)).toBe(110);
  });

  it('handles zero and invalid counts', () => {
    expect(countDrawShibas(0)).toBe(0);
    expect(countDrawShibas(-5)).toBe(0);
    expect(countDrawShibas(Number.NaN)).toBe(0);
  });
});

describe('heartVolleyCount', () => {
  it('starts at the base volley for a single shiba', () => {
    expect(heartVolleyCount(1, 1, 8, 6)).toBe(1);
  });

  it('grows with the pack size', () => {
    expect(heartVolleyCount(9, 1, 8, 6)).toBe(2);
    expect(heartVolleyCount(24, 1, 8, 6)).toBe(3);
  });

  it('caps at the max volley', () => {
    expect(heartVolleyCount(999, 1, 8, 6)).toBe(6);
  });
});

describe('formationOffset', () => {
  it('puts the leader at the origin', () => {
    expect(formationOffset(0)).toEqual({ x: 0, y: 0 });
  });

  it('spreads followers behind the leader (positive y)', () => {
    for (let i = 1; i < 110; i += 1) {
      expect(formationOffset(i).y).toBeGreaterThan(0);
    }
  });

  it('keeps offsets symmetric around the center column', () => {
    // 2行目の6匹は左右対称になる
    const row = [1, 2, 3, 4, 5, 6].map((i) => formationOffset(i).x);
    expect(row[0]).toBe(-row[5]);
    expect(row[1]).toBe(-row[4]);
    expect(row[2]).toBe(-row[3]);
  });

  it('gives every drawn shiba a distinct position up to the draw cap', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 110; i += 1) {
      const o = formationOffset(i);
      seen.add(`${o.x},${o.y}`);
    }
    expect(seen.size).toBe(110);
  });
});
