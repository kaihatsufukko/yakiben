/**
 * サウンド管理（WebAudio 合成音のみ）。
 *
 * 外部 API・音声ファイルは使わず、オシレータで効果音と BGM を合成する。
 * 音声素材を差し替える場合はこのクラスの実装だけを置き換える。
 *
 * - AudioContext はユーザー操作（タップ等）のタイミングで unlock() すること
 * - enabled の切り替えは右上「♪」ボタンから setEnabled() を呼ぶ
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private lastShootAt = 0;
  enabled = true;

  /** ユーザー操作時に呼んで AudioContext を生成・再開する */
  unlock(): void {
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        return;
      }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBgm();
    }
  }

  /** ハート発射音（短いピッ。連射で煩くならないよう間引きする） */
  playShoot(): void {
    const now = performance.now();
    if (now - this.lastShootAt < 60) {
      return;
    }
    this.lastShootAt = now;
    this.tone(880, 0.06, 'square', 0.05, 0, 1320);
  }

  /** ハート命中音 */
  playHit(): void {
    this.tone(660, 0.05, 'sine', 0.06);
  }

  /** メロメロ成立音（3音アルペジオ） */
  playMelomelo(): void {
    this.tone(523, 0.12, 'sine', 0.14);
    this.tone(659, 0.12, 'sine', 0.14, 0.07);
    this.tone(784, 0.2, 'sine', 0.16, 0.14);
  }

  /** ゲート通過音（上昇2音） */
  playGate(): void {
    this.tone(392, 0.1, 'triangle', 0.16);
    this.tone(587, 0.18, 'triangle', 0.16, 0.09);
  }

  /** コンボ音（コンボ数でピッチが上がる） */
  playCombo(combo: number): void {
    const base = 523 * Math.pow(2, Math.min(combo, 12) / 12);
    this.tone(base, 0.09, 'square', 0.08);
    this.tone(base * 1.5, 0.12, 'square', 0.08, 0.06);
  }

  /** 豆柴の鳴き声（短い2連音で「ワン！ワン！」の代用） */
  playBark(): void {
    this.tone(300, 0.07, 'sawtooth', 0.1, 0, 180);
    this.tone(300, 0.07, 'sawtooth', 0.1, 0.12, 180);
  }

  /** ステージクリアのファンファーレ風アルペジオ */
  playClear(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.tone(freq, 0.22, 'triangle', 0.16, i * 0.11);
    });
    this.tone(1319, 0.4, 'triangle', 0.14, notes.length * 0.11);
  }

  /** 軽い BGM ループ（コード進行を 8 分音符で刻む簡易シーケンサ） */
  startBgm(): void {
    if (!this.enabled || this.bgmTimer !== null) {
      return;
    }
    this.unlock();
    if (!this.ctx) {
      return;
    }
    // C - Am - F - G のバスライン + アルペジオ
    const bassLine = [131, 110, 87, 98];
    const chords = [
      [262, 330, 392],
      [220, 262, 330],
      [175, 220, 262],
      [196, 247, 294],
    ];
    const stepMs = 240;
    this.bgmTimer = window.setInterval(() => {
      if (!this.enabled || !this.ctx) {
        return;
      }
      const bar = Math.floor(this.bgmStep / 8) % 4;
      const beat = this.bgmStep % 8;
      if (beat === 0) {
        this.tone(bassLine[bar], 0.3, 'triangle', 0.1);
      }
      const chord = chords[bar];
      this.tone(chord[beat % chord.length] * 2, 0.16, 'sine', 0.035);
      this.bgmStep += 1;
    }, stepMs);
  }

  stopBgm(): void {
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.bgmStep = 0;
  }

  private tone(
    freq: number,
    durationSec: number,
    type: OscillatorType,
    volume: number,
    delaySec = 0,
    slideToFreq?: number,
  ): void {
    if (!this.enabled) {
      return;
    }
    this.unlock();
    if (!this.ctx || !this.master) {
      return;
    }
    const start = this.ctx.currentTime + delaySec;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideToFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideToFreq), start + durationSec);
    }
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + durationSec);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + durationSec + 0.02);
  }
}

/** アプリ全体で共有する単一インスタンス（BootScene の♪ボタンと GameScene で共用） */
export const soundManager = new SoundManager();
