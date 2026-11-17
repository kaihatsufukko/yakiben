import { describe, expect, it } from 'vitest';
import {
  createMetrics,
  parseMetrics,
  recordClear,
  recordReplay,
  recordStart,
  serializeMetrics,
  type RunRecord,
} from './metrics';

const run: RunRecord = {
  clearedAt: '2026-11-17T00:00:00.000Z',
  clearTimeSec: 24.5,
  lovePercent: 92,
  maxShibas: 24,
  maxCombo: 7,
  stars: 3,
};

describe('metrics logic', () => {
  it('starts at zero', () => {
    const m = createMetrics();
    expect(m.starts).toBe(0);
    expect(m.clears).toBe(0);
    expect(m.replays).toBe(0);
    expect(m.lastRun).toBeNull();
  });

  it('counts starts and replays', () => {
    let m = createMetrics();
    m = recordStart(m);
    m = recordStart(m);
    m = recordReplay(m);
    expect(m.starts).toBe(2);
    expect(m.replays).toBe(1);
  });

  it('records a clear and updates the best record', () => {
    let m = recordClear(createMetrics(), run);
    expect(m.clears).toBe(1);
    expect(m.lastRun).toEqual(run);
    expect(m.best.lovePercent).toBe(92);
    expect(m.best.maxShibas).toBe(24);
    expect(m.best.maxCombo).toBe(7);
    expect(m.best.stars).toBe(3);
    expect(m.best.clearTimeSec).toBe(24.5);

    const slower: RunRecord = { ...run, clearTimeSec: 30, lovePercent: 50, stars: 2 };
    m = recordClear(m, slower);
    expect(m.clears).toBe(2);
    expect(m.best.clearTimeSec).toBe(24.5); // 最速は維持
    expect(m.best.lovePercent).toBe(92);
    expect(m.lastRun).toEqual(slower);
  });

  it('round-trips through JSON', () => {
    let m = recordStart(createMetrics());
    m = recordClear(m, run);
    const restored = parseMetrics(serializeMetrics(m));
    expect(restored).toEqual(m);
  });

  it('falls back to empty metrics for broken data', () => {
    expect(parseMetrics(null)).toEqual(createMetrics());
    expect(parseMetrics('not json')).toEqual(createMetrics());
    expect(parseMetrics('42')).toEqual(createMetrics());
    expect(parseMetrics('{"starts":"x"}').starts).toBe(0);
  });
});
