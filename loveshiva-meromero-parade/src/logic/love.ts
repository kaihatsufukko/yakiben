/**
 * LOVE% と ★評価 の純粋ロジック（Phaser 非依存）。
 *
 * 仕様メモ（仮実装）:
 * - LOVE% = メロメロにした敵の数 / 登場した敵の総数 * 100（0〜100 に丸める）
 * - ★評価は LOVE% とクリア状況から決まる:
 *   - 未クリア: ★0
 *   - クリア済み: LOVE% >= 85 で ★3、>= 50 で ★2、それ以外は ★1
 * しきい値は今後のバランス調整で変更する前提。
 */

export function calculateLovePercent(melomeloCount: number, totalEnemies: number): number {
  if (totalEnemies <= 0) {
    return 0;
  }
  const safeMelomelo = Math.max(0, melomeloCount);
  const percent = (safeMelomelo / totalEnemies) * 100;
  return Math.min(100, Math.max(0, percent));
}

export type StarRating = 0 | 1 | 2 | 3;

export const STAR_THRESHOLDS = {
  threeStars: 85,
  twoStars: 50,
} as const;

export function getStarRating(lovePercent: number, cleared: boolean): StarRating {
  if (!cleared) {
    return 0;
  }
  const percent = Math.min(100, Math.max(0, lovePercent));
  if (percent >= STAR_THRESHOLDS.threeStars) {
    return 3;
  }
  if (percent >= STAR_THRESHOLDS.twoStars) {
    return 2;
  }
  return 1;
}
