import Phaser from 'phaser';
import type { GateConfig } from '../data/stage1';
import { formatGateEffect } from '../logic/pack';

const PANEL_HEIGHT = 96;

/**
 * 左右2択の増殖ゲート1組。
 * 上から流れてきて、群れの Y ラインを通過した瞬間に一度だけ判定される。
 */
export class GatePair {
  readonly cfg: GateConfig;
  crossed = false;

  private readonly container: Phaser.GameObjects.Container;
  private readonly leftPanel: Phaser.GameObjects.Rectangle;
  private readonly rightPanel: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, cfg: GateConfig, screenWidth: number) {
    this.cfg = cfg;
    const half = screenWidth / 2;

    this.leftPanel = scene.add
      .rectangle(half / 2, 0, half - 10, PANEL_HEIGHT, 0x4dabf7, 0.88)
      .setStrokeStyle(4, 0xffffff, 0.9);
    this.rightPanel = scene.add
      .rectangle(half + half / 2, 0, half - 10, PANEL_HEIGHT, 0xff77aa, 0.88)
      .setStrokeStyle(4, 0xffffff, 0.9);

    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'sans-serif',
      fontSize: '52px',
      color: '#ffffff',
      fontStyle: 'bold',
    };
    const leftLabel = scene.add
      .text(half / 2, 0, formatGateEffect(cfg.left), labelStyle)
      .setOrigin(0.5);
    const rightLabel = scene.add
      .text(half + half / 2, 0, formatGateEffect(cfg.right), labelStyle)
      .setOrigin(0.5);

    this.container = scene.add
      .container(0, -80, [this.leftPanel, this.rightPanel, leftLabel, rightLabel])
      .setDepth(6);
  }

  get y(): number {
    return this.container.y;
  }

  update(dtSec: number, speedPxPerSec: number): void {
    this.container.y += speedPxPerSec * dtSec;
  }

  /** 通過後に選ばれた側を強調し、選ばれなかった側を薄くする */
  markResolved(choseLeft: boolean): void {
    const chosen = choseLeft ? this.leftPanel : this.rightPanel;
    const other = choseLeft ? this.rightPanel : this.leftPanel;
    other.setAlpha(0.3);
    chosen.setAlpha(1);
  }

  get offscreen(): boolean {
    return this.container.y > 1560;
  }

  destroy(): void {
    this.container.destroy();
  }
}

/** ゲートの出現・落下・通過判定の管理 */
export class GateManager {
  private active: GatePair[] = [];

  spawn(scene: Phaser.Scene, cfg: GateConfig, screenWidth: number): void {
    this.active.push(new GatePair(scene, cfg, screenWidth));
  }

  update(
    dtSec: number,
    speedPxPerSec: number,
    packY: number,
    onCross: (pair: GatePair) => void,
  ): void {
    const remaining: GatePair[] = [];
    for (const pair of this.active) {
      pair.update(dtSec, speedPxPerSec);
      if (!pair.crossed && pair.y >= packY) {
        pair.crossed = true;
        onCross(pair);
      }
      if (pair.offscreen) {
        pair.destroy();
      } else {
        remaining.push(pair);
      }
    }
    this.active = remaining;
  }
}
