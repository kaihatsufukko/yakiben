import { describe, expect, it } from 'vitest';
import { createComboState, currentCombo, registerMelomelo } from './combo';

const WINDOW = 2.5;

describe('combo logic', () => {
  it('starts empty', () => {
    const s = createComboState();
    expect(s.count).toBe(0);
    expect(s.maxCombo).toBe(0);
    expect(currentCombo(s, 0, WINDOW)).toBe(0);
  });

  it('counts the first melomelo as combo 1', () => {
    const s = registerMelomelo(createComboState(), 1.0, WINDOW);
    expect(s.count).toBe(1);
    expect(s.maxCombo).toBe(1);
    expect(currentCombo(s, 1.0, WINDOW)).toBe(1);
  });

  it('chains melomelos inside the window', () => {
    let s = createComboState();
    s = registerMelomelo(s, 1.0, WINDOW);
    s = registerMelomelo(s, 2.0, WINDOW);
    s = registerMelomelo(s, 4.4, WINDOW);
    expect(s.count).toBe(3);
    expect(s.maxCombo).toBe(3);
  });

  it('restarts the combo after the window expires', () => {
    let s = createComboState();
    s = registerMelomelo(s, 1.0, WINDOW);
    s = registerMelomelo(s, 2.0, WINDOW);
    s = registerMelomelo(s, 10.0, WINDOW);
    expect(s.count).toBe(1);
    expect(s.maxCombo).toBe(2);
  });

  it('reports 0 once the window has passed without mutating state', () => {
    let s = createComboState();
    s = registerMelomelo(s, 1.0, WINDOW);
    s = registerMelomelo(s, 2.0, WINDOW);
    expect(currentCombo(s, 4.5, WINDOW)).toBe(2);
    expect(currentCombo(s, 4.6, WINDOW)).toBe(0);
    expect(s.count).toBe(2);
  });

  it('does not mutate the previous state', () => {
    const s0 = createComboState();
    const s1 = registerMelomelo(s0, 1.0, WINDOW);
    expect(s0.count).toBe(0);
    expect(s1.count).toBe(1);
  });
});
