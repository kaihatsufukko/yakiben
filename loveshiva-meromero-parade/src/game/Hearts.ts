import Phaser from 'phaser';

export interface Heart {
  sprite: Phaser.GameObjects.Image;
  active: boolean;
  angle: number;
  speed: number;
}

const POOL_SIZE = 56;
/** 誘導の最大旋回速度（ラジアン/秒） */
const TURN_RATE = 3.4;

/**
 * ハート弾のオブジェクトプール。
 * 発射・移動・弱い誘導・回収だけを担当し、命中判定はシーン側が行う。
 */
export class HeartPool {
  readonly hearts: Heart[] = [];

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < POOL_SIZE; i += 1) {
      const sprite = scene.add.image(-100, -100, 'heart').setVisible(false).setDepth(12);
      this.hearts.push({ sprite, active: false, angle: -Math.PI / 2, speed: 0 });
    }
  }

  /** (x, y) から target 方向へ1発発射する。target がなければ真上 */
  fire(x: number, y: number, speed: number, target: { x: number; y: number } | null): void {
    const heart = this.hearts.find((h) => !h.active);
    if (!heart) {
      return;
    }
    let angle = -Math.PI / 2;
    if (target) {
      angle = Phaser.Math.Angle.Between(x, y, target.x, target.y);
    }
    angle += Phaser.Math.FloatBetween(-0.07, 0.07);
    heart.angle = angle;
    heart.speed = speed;
    heart.active = true;
    heart.sprite.setPosition(x, y).setScale(0.9).setAlpha(1).setVisible(true).setActive(true);
  }

  update(dtSec: number, targets: { x: number; y: number }[]): void {
    for (const heart of this.hearts) {
      if (!heart.active) {
        continue;
      }
      const sprite = heart.sprite;
      // 最も近い敵へ弱く誘導
      let nearest: { x: number; y: number } | null = null;
      let nearestDist = Number.POSITIVE_INFINITY;
      for (const t of targets) {
        const d = Phaser.Math.Distance.Squared(sprite.x, sprite.y, t.x, t.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = t;
        }
      }
      if (nearest) {
        const desired = Phaser.Math.Angle.Between(sprite.x, sprite.y, nearest.x, nearest.y);
        heart.angle = Phaser.Math.Angle.RotateTo(heart.angle, desired, TURN_RATE * dtSec);
      }
      sprite.x += Math.cos(heart.angle) * heart.speed * dtSec;
      sprite.y += Math.sin(heart.angle) * heart.speed * dtSec;
      sprite.rotation = Math.sin(performance.now() * 0.02 + sprite.x) * 0.18;
      if (sprite.y < -60 || sprite.y > 1400 || sprite.x < -60 || sprite.x > 780) {
        this.despawn(heart);
      }
    }
  }

  despawn(heart: Heart): void {
    heart.active = false;
    heart.sprite.setVisible(false).setActive(false);
  }

  activeHearts(): Heart[] {
    return this.hearts.filter((h) => h.active);
  }
}
