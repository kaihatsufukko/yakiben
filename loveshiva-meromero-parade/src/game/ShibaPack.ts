import Phaser from 'phaser';
import { countDrawShibas, formationOffset } from '../logic/pack';

/**
 * 豆柴の群れの描画・移動管理。
 *
 * 実頭数（最大 999）は count が持ち、描画は maxDraw 匹までに制限する。
 * スプライトは最初に最大数だけ生成して使い回し、表示/非表示と配置で表現する。
 */
export class ShibaPack {
  count = 1;
  x: number;
  readonly y: number;

  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly sprites: Phaser.GameObjects.Image[] = [];
  private readonly baseOffsets: { x: number; y: number }[] = [];
  private readonly maxDraw: number;
  private elapsedMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, maxDraw: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.maxDraw = maxDraw;
    this.container = scene.add.container(x, y).setDepth(10);

    for (let i = 0; i < maxDraw; i += 1) {
      const sprite = scene.add.image(0, 0, 'shiba');
      sprite.setScale(i === 0 ? 1.05 : 0.88);
      sprite.setVisible(false);
      this.sprites.push(sprite);
      this.baseOffsets.push({ x: 0, y: 0 });
      this.container.add(sprite);
    }
    this.setCount(1);
  }

  setCount(next: number): void {
    this.count = Math.max(1, Math.floor(next));
    const draw = countDrawShibas(this.count, this.maxDraw);
    // 行数が多い場合は行間を詰めて、群れ全体が画面内に収まるようにする
    const rows = draw <= 1 ? 0 : Math.ceil((draw - 1) / 6);
    const spacingY = rows > 0 ? Math.min(50, Math.max(14, 190 / rows)) : 50;
    for (let i = 0; i < this.sprites.length; i += 1) {
      const offset = formationOffset(i, 58, spacingY);
      this.baseOffsets[i] = offset;
      this.sprites[i].setPosition(offset.x, offset.y);
      this.sprites[i].setVisible(i < draw);
    }
  }

  /**
   * 移動と走行バウンス。
   * targetX があればドラッグ先へ追随し、keyDir があればキー移動を優先する。
   */
  update(deltaMs: number, targetX: number | null, keyDir: number): void {
    const dtSec = deltaMs / 1000;
    this.elapsedMs += deltaMs;
    const { width } = this.scene.scale;

    if (keyDir !== 0) {
      this.x += keyDir * 560 * dtSec;
    } else if (targetX !== null) {
      const factor = Math.min(1, dtSec * 16);
      this.x = Phaser.Math.Linear(this.x, targetX, factor);
    }
    this.x = Phaser.Math.Clamp(this.x, 64, width - 64);
    this.container.setPosition(this.x, this.y);

    const draw = countDrawShibas(this.count, this.maxDraw);
    for (let i = 0; i < draw; i += 1) {
      const bounce = Math.sin(this.elapsedMs * 0.014 + i * 0.9) * 3;
      this.sprites[i].setY(this.baseOffsets[i].y + bounce);
    }
  }

  /** ハートの発射位置（先頭側の数匹分）を返す */
  muzzlePositions(howMany: number): { x: number; y: number }[] {
    const draw = countDrawShibas(this.count, this.maxDraw);
    const positions: { x: number; y: number }[] = [];
    const n = Math.min(howMany, draw);
    for (let i = 0; i < n; i += 1) {
      positions.push({
        x: this.x + this.baseOffsets[i].x,
        y: this.y + this.baseOffsets[i].y - 34,
      });
    }
    return positions;
  }
}
