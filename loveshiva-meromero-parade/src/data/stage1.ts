/**
 * ステージ設定のデータ駆動用モジュール。
 *
 * ステージ・敵・ゲート・数値はすべてここにデータとして持たせ、
 * シーン側のロジックはこの設定を読むだけにする。
 * バランス調整はこのファイルの数値を変えるだけで行える。
 */

export interface EnemySpawnConfig {
  /** 出現時刻（ステージ開始からの秒数） */
  timeSec: number;
  /** 敵の種類 ID（enemyTypes のキー） */
  enemyType: string;
  /** 出現位置 X の中心（0〜1 の画面幅比率）。count が複数の場合はこの比率を中心に横へ広げる */
  xRatio: number;
  /** この出現で出す数 */
  count: number;
}

export interface GateConfig {
  /** ゲートが現れる時刻（ステージ開始からの秒数） */
  timeSec: number;
  /** 左ゲートの効果（例: { kind: 'multiply', value: 2 }） */
  left: GateEffect;
  /** 右ゲートの効果 */
  right: GateEffect;
}

export interface GateEffect {
  kind: 'multiply' | 'add';
  value: number;
}

export interface EnemyTypeConfig {
  /** メロメロになるまでに必要なハート命中数 */
  loveRequired: number;
  /** 下方向への移動速度（px/秒）。ボスは停止位置まで進んだら止まる */
  speedPxPerSec: number;
  /** 描画スケール */
  scale: number;
  /** キャラクターの色合い（ドレス色のティント） */
  tint: number;
  /** ボスかどうか */
  isBoss?: boolean;
}

export interface GameplayConfig {
  /** ハート発射間隔（ミリ秒） */
  heartIntervalMs: number;
  /** ハートの速度（px/秒） */
  heartSpeedPxPerSec: number;
  /** 基本の同時発射数 */
  heartBaseVolley: number;
  /** 豆柴がこの数増えるごとに同時発射数が +1 */
  heartVolleyPerShibas: number;
  /** 同時発射数の上限 */
  heartMaxVolley: number;
  /** コンボが継続する間隔（秒）。この時間内に次のメロメロでコンボ加算 */
  comboWindowSec: number;
  /** 実頭数の上限 */
  maxShibas: number;
  /** 描画する豆柴の上限 */
  maxDrawShibas: number;
  /** ゲートの落下速度（px/秒） */
  gateSpeedPxPerSec: number;
  /** 群れの Y 位置（画面高さに対する比率） */
  packYRatio: number;
  /** この秒数を過ぎたら強制的にクリア扱いにするフォールバック（無操作クリア保証） */
  stageTimeLimitSec: number;
}

export interface StageConfig {
  id: string;
  name: string;
  /** 目標クリア時間（秒）。ステージ1は 20〜30 秒想定 */
  targetDurationSec: number;
  /** 背景テーマ ID（素材差し替え用） */
  backgroundTheme: string;
  enemySpawns: EnemySpawnConfig[];
  gates: GateConfig[];
  /** ボス出現の有無 */
  hasBoss: boolean;
  enemyTypes: Record<string, EnemyTypeConfig>;
  gameplay: GameplayConfig;
}

/**
 * ステージ1 タイムライン（目標 20〜30 秒）:
 * - 0.5s: 最初の敵（弱い個体。3秒以内にメロメロ可能）
 * - 2.0s: ゲート1 出現 → 約7秒で通過（左 ×2 / 右 +5）
 * - 6〜16s: 敵が複数出現し、ゲート2（出現 10.5s → 約15秒で通過）で大きく増殖
 * - 18s: 簡易ボス出現。撃破で最終演出 → クリア評価
 */
export const stage1Config: StageConfig = {
  id: 'stage-1',
  name: 'ステージ1',
  targetDurationSec: 25,
  backgroundTheme: 'park-day',
  enemySpawns: [
    { timeSec: 0.5, enemyType: 'girl-first', xRatio: 0.5, count: 1 },
    { timeSec: 6.0, enemyType: 'girl-normal', xRatio: 0.5, count: 2 },
    { timeSec: 9.0, enemyType: 'girl-normal', xRatio: 0.5, count: 3 },
    { timeSec: 13.0, enemyType: 'girl-normal', xRatio: 0.5, count: 3 },
    { timeSec: 15.5, enemyType: 'girl-normal', xRatio: 0.5, count: 4 },
    { timeSec: 18.0, enemyType: 'boss', xRatio: 0.5, count: 1 },
  ],
  gates: [
    {
      timeSec: 2.0,
      left: { kind: 'multiply', value: 2 },
      right: { kind: 'add', value: 5 },
    },
    {
      timeSec: 10.5,
      left: { kind: 'add', value: 15 },
      right: { kind: 'multiply', value: 4 },
    },
  ],
  hasBoss: true,
  enemyTypes: {
    'girl-first': {
      loveRequired: 2,
      speedPxPerSec: 140,
      scale: 1,
      tint: 0xffffff,
    },
    'girl-normal': {
      loveRequired: 3,
      speedPxPerSec: 175,
      scale: 1,
      tint: 0xffffff,
    },
    boss: {
      loveRequired: 45,
      speedPxPerSec: 110,
      scale: 2.1,
      tint: 0xffffff,
      isBoss: true,
    },
  },
  gameplay: {
    heartIntervalMs: 220,
    heartSpeedPxPerSec: 640,
    heartBaseVolley: 1,
    heartVolleyPerShibas: 8,
    heartMaxVolley: 6,
    comboWindowSec: 2.5,
    maxShibas: 999,
    maxDrawShibas: 110,
    gateSpeedPxPerSec: 240,
    packYRatio: 0.84,
    stageTimeLimitSec: 45,
  },
};
