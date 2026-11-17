/**
 * プレイ計測データの純粋ロジック（Phaser / localStorage 非依存）。
 *
 * 保存先への読み書きは MetricsStore が担当し、
 * 集計ルールはここでテスト可能な形に保つ。
 */

export interface RunRecord {
  /** クリアした日時（ISO 文字列） */
  clearedAt: string;
  clearTimeSec: number;
  lovePercent: number;
  maxShibas: number;
  maxCombo: number;
  stars: number;
}

export interface BestRecord {
  lovePercent: number;
  maxShibas: number;
  maxCombo: number;
  stars: number;
  /** 最速クリア時間（秒）。未クリアなら null */
  clearTimeSec: number | null;
}

export interface MetricsData {
  /** ステージ開始回数 */
  starts: number;
  /** クリア回数 */
  clears: number;
  /** リスタート（リプレイ）回数 */
  replays: number;
  /** 直近のクリア記録 */
  lastRun: RunRecord | null;
  /** 自己ベスト */
  best: BestRecord;
}

export function createMetrics(): MetricsData {
  return {
    starts: 0,
    clears: 0,
    replays: 0,
    lastRun: null,
    best: { lovePercent: 0, maxShibas: 0, maxCombo: 0, stars: 0, clearTimeSec: null },
  };
}

export function recordStart(data: MetricsData): MetricsData {
  return { ...data, starts: data.starts + 1 };
}

export function recordReplay(data: MetricsData): MetricsData {
  return { ...data, replays: data.replays + 1 };
}

export function recordClear(data: MetricsData, run: RunRecord): MetricsData {
  const best: BestRecord = {
    lovePercent: Math.max(data.best.lovePercent, run.lovePercent),
    maxShibas: Math.max(data.best.maxShibas, run.maxShibas),
    maxCombo: Math.max(data.best.maxCombo, run.maxCombo),
    stars: Math.max(data.best.stars, run.stars),
    clearTimeSec:
      data.best.clearTimeSec === null
        ? run.clearTimeSec
        : Math.min(data.best.clearTimeSec, run.clearTimeSec),
  };
  return { ...data, clears: data.clears + 1, lastRun: run, best };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function toSeconds(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function toRunRecord(value: unknown): RunRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.clearedAt !== 'string') {
    return null;
  }
  return {
    clearedAt: value.clearedAt,
    clearTimeSec: toSeconds(value.clearTimeSec),
    lovePercent: toCount(value.lovePercent),
    maxShibas: toCount(value.maxShibas),
    maxCombo: toCount(value.maxCombo),
    stars: toCount(value.stars),
  };
}

/** JSON 文字列から計測データを復元する。壊れたデータは初期値を返す */
export function parseMetrics(json: string | null): MetricsData {
  if (!json) {
    return createMetrics();
  }
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) {
      return createMetrics();
    }
    const base = createMetrics();
    const bestRaw = isRecord(parsed.best) ? parsed.best : {};
    return {
      starts: toCount(parsed.starts),
      clears: toCount(parsed.clears),
      replays: toCount(parsed.replays),
      lastRun: toRunRecord(parsed.lastRun),
      best: {
        lovePercent: toCount(bestRaw.lovePercent),
        maxShibas: toCount(bestRaw.maxShibas),
        maxCombo: toCount(bestRaw.maxCombo),
        stars: toCount(bestRaw.stars),
        clearTimeSec:
          typeof bestRaw.clearTimeSec === 'number' && Number.isFinite(bestRaw.clearTimeSec)
            ? bestRaw.clearTimeSec
            : base.best.clearTimeSec,
      },
    };
  } catch {
    return createMetrics();
  }
}

export function serializeMetrics(data: MetricsData): string {
  return JSON.stringify(data);
}
