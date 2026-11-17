/**
 * 豆柴の群れに関する純粋ロジック（Phaser 非依存）。
 *
 * - ゲート効果の適用（下限 1、上限 maxShibas でクランプ）
 * - 実頭数 → 描画頭数への制限
 * - フォーメーション配置（中心の豆柴を先頭に、後方へグリッド状に広げる）
 */
import type { GateEffect } from '../data/stage1';

export const MIN_SHIBAS = 1;

export function applyGateEffect(current: number, effect: GateEffect, maxShibas = 999): number {
  const base = Math.max(MIN_SHIBAS, Math.floor(current));
  const next = effect.kind === 'multiply' ? base * effect.value : base + effect.value;
  return Math.min(maxShibas, Math.max(MIN_SHIBAS, Math.floor(next)));
}

/** ゲートラベルの表示文字列（例: "×2", "+5"） */
export function formatGateEffect(effect: GateEffect): string {
  return effect.kind === 'multiply' ? `×${effect.value}` : `+${effect.value}`;
}

/** 実頭数のうち何匹を描画するか（描画上限でクランプ） */
export function countDrawShibas(actual: number, maxDraw = 110): number {
  if (!Number.isFinite(actual) || actual <= 0) {
    return 0;
  }
  return Math.min(Math.floor(actual), maxDraw);
}

/** 同時発射数: 基本数 + 頭数ボーナス（上限あり） */
export function heartVolleyCount(
  shibaCount: number,
  baseVolley: number,
  volleyPerShibas: number,
  maxVolley: number,
): number {
  const bonus = volleyPerShibas > 0 ? Math.floor(Math.max(0, shibaCount - 1) / volleyPerShibas) : 0;
  return Math.min(maxVolley, Math.max(1, baseVolley + bonus));
}

export interface FormationOffset {
  x: number;
  y: number;
}

/** フォーメーションの列数 */
export const FORMATION_COLUMNS = 7;

/**
 * index 番目の豆柴の、群れ中心からの相対オフセット。
 * index 0 が先頭（中心・最前方）で、後ろの行ほど下（= 画面の後方）へ広がる。
 */
export function formationOffset(index: number, spacingX = 58, spacingY = 50): FormationOffset {
  if (index <= 0) {
    return { x: 0, y: 0 };
  }
  const rest = index - 1;
  const row = Math.floor(rest / (FORMATION_COLUMNS - 1)) + 1;
  const col = rest % (FORMATION_COLUMNS - 1);
  // 先頭の後ろは 6 列グリッドで左右対称に配置
  const x = (col - (FORMATION_COLUMNS - 2) / 2) * spacingX;
  const y = row * spacingY;
  return { x, y };
}
