/**
 * コンボ判定の純粋ロジック（Phaser 非依存）。
 *
 * - メロメロが発生したら registerMelomelo を呼ぶ
 * - 前回のメロメロから windowSec 以内ならコンボが継続・加算され、
 *   超えていればコンボは 1 から数え直す
 * - 状態はイミュータブルに扱い、新しい状態を返す
 */

export interface ComboState {
  /** 現在継続中のコンボ数（0 = コンボなし） */
  count: number;
  /** このステージでの最大コンボ */
  maxCombo: number;
  /** 最後にメロメロにした時刻（秒）。未発生なら null */
  lastMelomeloAtSec: number | null;
}

export function createComboState(): ComboState {
  return { count: 0, maxCombo: 0, lastMelomeloAtSec: null };
}

export function registerMelomelo(state: ComboState, nowSec: number, windowSec: number): ComboState {
  const continues =
    state.lastMelomeloAtSec !== null && nowSec - state.lastMelomeloAtSec <= windowSec;
  const count = continues ? state.count + 1 : 1;
  return {
    count,
    maxCombo: Math.max(state.maxCombo, count),
    lastMelomeloAtSec: nowSec,
  };
}

/** 指定時刻時点で有効なコンボ数。時間切れなら 0 を返す（状態は変更しない） */
export function currentCombo(state: ComboState, nowSec: number, windowSec: number): number {
  if (state.lastMelomeloAtSec === null) {
    return 0;
  }
  return nowSec - state.lastMelomeloAtSec <= windowSec ? state.count : 0;
}
