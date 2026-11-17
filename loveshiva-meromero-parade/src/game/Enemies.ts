import Phaser from 'phaser';
import type { EnemyTypeConfig } from '../data/stage1';

export type EnemyPhase = 'inactive' | 'walking' | 'melomelo';

export interface Enemy {
  sprite: Phaser.GameObjects.Image;
  phase: EnemyPhase;
  isBoss: boolean;
  love: number;
  loveRequired: number;
  speed: number;
  radius: number;
  baseX: number;
  stopped: boolean;
  normalKey: string;
  meloKey: string;
}

const POOL_SIZE = 12;
const BOSS_STOP_Y = 300;

/**
 * 敵（女の子／ボス）のプール・出現・移動・メロメロ遷移の管理。
 * LOVE ゲージは頭上のバーを Graphics で毎フレーム描き直す（敵数が少ない前提）。
 */
export class EnemyManager {
  readonly enemies: Enemy[] = [];
  private readonly scene: Phaser.Scene;
  private readonly gauge: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (let i = 0; i < POOL_SIZE; i += 1) {
      const sprite = scene.add.image(-200, -200, 'girl').setVisible(false).setDepth(8);
      this.enemies.push({
        sprite,
        phase: 'inactive',
        isBoss: false,
        love: 0,
        loveRequired: 1,
        speed: 0,
        radius: 46,
        baseX: 0,
        stopped: false,
        normalKey: 'girl',
        meloKey: 'girl-melo',
      });
    }
    this.gauge = scene.add.graphics().setDepth(20);
  }

  spawn(cfg: EnemyTypeConfig, x: number, y: number): Enemy | null {
    const enemy = this.enemies.find((e) => e.phase === 'inactive');
    if (!enemy) {
      return null;
    }
    enemy.isBoss = cfg.isBoss === true;
    enemy.normalKey = enemy.isBoss ? 'boss' : 'girl';
    enemy.meloKey = enemy.isBoss ? 'boss-melo' : 'girl-melo';
    enemy.love = 0;
    enemy.loveRequired = cfg.loveRequired;
    enemy.speed = cfg.speedPxPerSec;
    enemy.radius = enemy.isBoss ? 108 : 48 * cfg.scale;
    enemy.baseX = x;
    enemy.stopped = false;
    enemy.phase = 'walking';
    enemy.sprite
      .setTexture(enemy.normalKey)
      .setTint(cfg.tint)
      .setScale(cfg.scale)
      .setAlpha(1)
      .setPosition(x, y)
      .setVisible(true)
      .setActive(true);
    return enemy;
  }

  /**
   * 移動と画面外退場。画面下端を過ぎた敵は onEscape で通知して回収する。
   */
  update(dtSec: number, elapsedSec: number, screenHeight: number, onEscape: (e: Enemy) => void): void {
    for (const enemy of this.enemies) {
      if (enemy.phase !== 'walking') {
        continue;
      }
      const sprite = enemy.sprite;
      if (enemy.isBoss && !enemy.stopped) {
        sprite.y += enemy.speed * dtSec;
        if (sprite.y >= BOSS_STOP_Y) {
          sprite.y = BOSS_STOP_Y;
          enemy.stopped = true;
        }
      } else if (enemy.isBoss) {
        sprite.x = enemy.baseX + Math.sin(elapsedSec * 0.7) * 80;
      } else {
        sprite.y += enemy.speed * dtSec;
      }
      if (sprite.y > screenHeight + 110) {
        this.deactivate(enemy);
        onEscape(enemy);
      }
    }
    this.drawGauges();
  }

  /** ハート命中を適用する。メロメロになったら true を返す */
  applyHit(enemy: Enemy): boolean {
    if (enemy.phase !== 'walking') {
      return false;
    }
    enemy.love += 1;
    // 被弾の小さな跳ね
    this.scene.tweens.add({
      targets: enemy.sprite,
      scale: enemy.sprite.scale * 1.06,
      duration: 60,
      yoyo: true,
    });
    if (enemy.love >= enemy.loveRequired) {
      this.startMelomelo(enemy);
      return true;
    }
    return false;
  }

  walkingEnemies(): Enemy[] {
    return this.enemies.filter((e) => e.phase === 'walking');
  }

  hasWalking(): boolean {
    return this.enemies.some((e) => e.phase === 'walking');
  }

  private startMelomelo(enemy: Enemy): void {
    enemy.phase = 'melomelo';
    enemy.sprite.setTexture(enemy.meloKey);
    // 喜びアニメ → 上へ浮いてフェードアウトして退場
    this.scene.tweens.add({
      targets: enemy.sprite,
      scale: enemy.sprite.scale * 1.18,
      duration: 160,
      yoyo: true,
      repeat: 1,
    });
    this.scene.tweens.add({
      targets: enemy.sprite,
      y: enemy.sprite.y - 170,
      alpha: 0,
      duration: 520,
      delay: 260,
      ease: 'Quad.easeIn',
      onComplete: () => this.deactivate(enemy),
    });
  }

  private deactivate(enemy: Enemy): void {
    this.scene.tweens.killTweensOf(enemy.sprite);
    enemy.phase = 'inactive';
    enemy.sprite.setVisible(false).setActive(false);
  }

  private drawGauges(): void {
    const g = this.gauge;
    g.clear();
    for (const enemy of this.enemies) {
      if (enemy.phase !== 'walking' || enemy.love <= 0) {
        continue;
      }
      const sprite = enemy.sprite;
      const barW = enemy.isBoss ? 150 : 56;
      const x = sprite.x - barW / 2;
      const y = sprite.y - sprite.displayHeight / 2 - 18;
      const ratio = Math.min(1, enemy.love / enemy.loveRequired);
      g.fillStyle(0x000000, 0.35);
      g.fillRect(x - 2, y - 2, barW + 4, 12);
      g.fillStyle(0xff5c8a, 1);
      g.fillRect(x, y, barW * ratio, 8);
    }
  }
}
