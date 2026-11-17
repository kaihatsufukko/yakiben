/**
 * 計測データの localStorage 保存ラッパー。
 * 集計ロジックは src/logic/metrics.ts にあり、ここは読み書きだけを担当する。
 * localStorage が使えない環境ではメモリ上に保持して落とさない。
 */
import {
  createMetrics,
  parseMetrics,
  recordClear,
  recordReplay,
  recordStart,
  serializeMetrics,
  type MetricsData,
  type RunRecord,
} from '../logic/metrics';

const STORAGE_KEY = 'loveshiva.metrics.v1';

class MetricsStore {
  private data: MetricsData;
  private persistent = true;

  constructor() {
    this.data = this.load();
  }

  private load(): MetricsData {
    try {
      return parseMetrics(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      this.persistent = false;
      return createMetrics();
    }
  }

  private save(): void {
    if (!this.persistent) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeMetrics(this.data));
    } catch {
      this.persistent = false;
    }
  }

  recordStart(): void {
    this.data = recordStart(this.data);
    this.save();
  }

  recordReplay(): void {
    this.data = recordReplay(this.data);
    this.save();
  }

  recordClear(run: RunRecord): void {
    this.data = recordClear(this.data, run);
    this.save();
  }

  get snapshot(): MetricsData {
    return this.data;
  }
}

export const metricsStore = new MetricsStore();
