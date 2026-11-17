import Phaser from 'phaser';
import { stage1Config } from '../data/stage1';
import { calculateLovePercent, getStarRating } from '../logic/love';
import { applyGateEffect, formatGateEffect, heartVolleyCount } from '../logic/pack';
import {
  createComboState,
  currentCombo,
  registerMelomelo,
  type ComboState,
} from '../logic/combo';
import { soundManager } from '../audio/SoundManager';
import { createGameTextures } from '../render/textures';
import { ShibaPack } from '../game/ShibaPack';
import { EnemyManager, type Enemy } from '../game/Enemies';
import { HeartPool } from '../game/Hearts';
import { GateManager, type GatePair } from '../game/Gates';
import { Hud } from '../game/Hud';
import { metricsStore } from '../game/MetricsStore';

type Phase = 'playing' | 'finale' | 'result';

/**
 * ステージ1 本体シーン。
 *
 * タイムライン（敵出現・ゲート）は stage1Config のデータを消化して進める。
 * ゲームオーバーはなく、ボス撃破か制限時間到達で必ずクリアになる。
 * ハートは自動発射で敵へ弱く誘導するため、無操作でもクリアできる。
 */
export class GameScene extends Phaser.Scene {
  private pack!: ShibaPack;
  private enemies!: EnemyManager;
  private hearts!: HeartPool;
  private gates!: GateManager;
  private hud!: Hud;
  private background!: Phaser.GameObjects.TileSprite;
  private burst!: Phaser.GameObjects.Particles.ParticleEmitter;

  private phase: Phase = 'playing';
  private elapsedSec = 0;
  private spawnIndex = 0;
  private gateIndex = 0;
  private fireTimerMs = 0;
  private melomeloCount = 0;
  private totalEnemies = 0;
  private maxShibas = 1;
  private combo: ComboState = createComboState();
  private clearTimeSec = 0;
  private pointerTargetX: number | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private debugVisible = true;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    createGameTextures(this);
    const { width, height } = this.scale;
    const gp = stage1Config.gameplay;

    // scene.restart() で再利用されるため、状態はここで初期化する
    this.phase = 'playing';
    this.elapsedSec = 0;
    this.spawnIndex = 0;
    this.gateIndex = 0;
    this.fireTimerMs = 0;
    this.melomeloCount = 0;
    this.maxShibas = 1;
    this.combo = createComboState();
    this.clearTimeSec = 0;
    this.pointerTargetX = null;
    this.totalEnemies = stage1Config.enemySpawns.reduce((sum, s) => sum + s.count, 0);

    metricsStore.recordStart();

    this.background = this.add
      .tileSprite(0, 0, width, height, 'ground')
      .setOrigin(0, 0)
      .setDepth(0);

    this.pack = new ShibaPack(this, width / 2, height * gp.packYRatio, gp.maxDrawShibas);
    this.enemies = new EnemyManager(this);
    this.hearts = new HeartPool(this);
    this.gates = new GateManager();
    this.hud = new Hud(this, () => this.toggleSound());
    this.hud.setSoundButton(soundManager.enabled);
    this.hud.setCount(this.pack.count);
    this.hud.setLove(0);

    // メロメロ時のハートパーティクル（上限付きで使い回す）
    this.burst = this.add.particles(0, 0, 'heart', {
      emitting: false,
      speed: { min: 60, max: 260 },
      lifespan: { min: 350, max: 750 },
      scale: { start: 0.75, end: 0 },
      rotate: { min: -40, max: 40 },
      maxParticles: 220,
    });
    this.burst.setDepth(15);

    // 入力: ドラッグで目標 X、左右キーでも移動
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      soundManager.unlock();
      this.pointerTargetX = pointer.x;
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.pointerTargetX = pointer.x;
      }
    });
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.keyboard.on('keydown-D', () => {
        this.debugVisible = !this.debugVisible;
      });
    }

    soundManager.startBgm();
  }

  update(_time: number, deltaMs: number): void {
    if (this.phase === 'result') {
      return;
    }
    const { width, height } = this.scale;
    const gp = stage1Config.gameplay;
    const dtSec = Math.min(deltaMs, 50) / 1000;
    this.elapsedSec += dtSec;

    // 背景スクロール（前進感）
    this.background.tilePositionY -= 170 * dtSec;

    this.updateTimeline();
    this.updatePack(deltaMs);
    this.updateFiring(deltaMs);
    this.hearts.update(
      dtSec,
      this.enemies.walkingEnemies().map((e) => e.sprite),
    );
    this.checkHits();
    this.enemies.update(dtSec, this.elapsedSec, height, () => {
      // 取り逃がし: ゲームオーバーにはせず、LOVE% の分母に残るだけ
    });
    this.gates.update(dtSec, gp.gateSpeedPxPerSec, this.pack.y, (pair) =>
      this.onGateCross(pair, width),
    );

    const comboNow = currentCombo(this.combo, this.elapsedSec, gp.comboWindowSec);
    if (comboNow >= 2) {
      this.hud.showCombo(comboNow);
    } else {
      this.hud.hideCombo();
    }

    if (this.phase === 'playing' && this.elapsedSec >= gp.stageTimeLimitSec) {
      this.startFinale();
    }

    this.hud.setDebug(
      `FPS ${Math.round(this.game.loop.actualFps)}  🐶 ${this.pack.count}  ${this.elapsedSec.toFixed(1)}s`,
      this.debugVisible,
    );
  }

  private updateTimeline(): void {
    const { width } = this.scale;
    const spawns = stage1Config.enemySpawns;
    while (this.spawnIndex < spawns.length && spawns[this.spawnIndex].timeSec <= this.elapsedSec) {
      const spawn = spawns[this.spawnIndex];
      const typeCfg = stage1Config.enemyTypes[spawn.enemyType];
      if (typeCfg) {
        for (let i = 0; i < spawn.count; i += 1) {
          const offset = (i - (spawn.count - 1) / 2) * 0.16;
          const xRatio = Phaser.Math.Clamp(spawn.xRatio + offset, 0.12, 0.88);
          this.enemies.spawn(typeCfg, xRatio * width, -90 - i * 24);
        }
      }
      this.spawnIndex += 1;
    }
    const gates = stage1Config.gates;
    while (this.gateIndex < gates.length && gates[this.gateIndex].timeSec <= this.elapsedSec) {
      this.gates.spawn(this, gates[this.gateIndex], width);
      this.gateIndex += 1;
    }
  }

  private updatePack(deltaMs: number): void {
    let keyDir = 0;
    if (this.cursors) {
      if (this.cursors.left.isDown) {
        keyDir = -1;
      } else if (this.cursors.right.isDown) {
        keyDir = 1;
      }
    }
    this.pack.update(deltaMs, this.pointerTargetX, keyDir);
  }

  private updateFiring(deltaMs: number): void {
    if (this.phase !== 'playing') {
      return;
    }
    this.fireTimerMs -= deltaMs;
    if (this.fireTimerMs > 0 || !this.enemies.hasWalking()) {
      return;
    }
    const gp = stage1Config.gameplay;
    this.fireTimerMs = gp.heartIntervalMs;
    const volley = heartVolleyCount(
      this.pack.count,
      gp.heartBaseVolley,
      gp.heartVolleyPerShibas,
      gp.heartMaxVolley,
    );
    const targets = this.enemies.walkingEnemies();
    const muzzles = this.pack.muzzlePositions(volley);
    for (let i = 0; i < muzzles.length; i += 1) {
      // 発射ごとに最も近い敵を狙う（無操作でも当たるように）
      const from = muzzles[i];
      let nearest: Enemy | null = null;
      let nearestDist = Number.POSITIVE_INFINITY;
      for (const enemy of targets) {
        const d = Phaser.Math.Distance.Squared(from.x, from.y, enemy.sprite.x, enemy.sprite.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = enemy;
        }
      }
      this.hearts.fire(from.x, from.y, gp.heartSpeedPxPerSec, nearest ? nearest.sprite : null);
    }
    soundManager.playShoot();
  }

  private checkHits(): void {
    const targets = this.enemies.walkingEnemies();
    if (targets.length === 0) {
      return;
    }
    for (const heart of this.hearts.activeHearts()) {
      for (const enemy of targets) {
        const dx = heart.sprite.x - enemy.sprite.x;
        const dy = heart.sprite.y - enemy.sprite.y;
        const hitDist = enemy.radius + 16;
        if (dx * dx + dy * dy <= hitDist * hitDist) {
          this.hearts.despawn(heart);
          const becameMelomelo = this.enemies.applyHit(enemy);
          if (becameMelomelo) {
            this.onMelomelo(enemy);
          } else {
            soundManager.playHit();
            this.burst.explode(2, heart.sprite.x, heart.sprite.y);
          }
          break;
        }
      }
    }
  }

  private onMelomelo(enemy: Enemy): void {
    this.melomeloCount += 1;
    const gp = stage1Config.gameplay;
    this.combo = registerMelomelo(this.combo, this.elapsedSec, gp.comboWindowSec);
    soundManager.playMelomelo();
    if (this.combo.count >= 2) {
      soundManager.playCombo(this.combo.count);
    }
    if (Math.random() < 0.3) {
      soundManager.playBark();
    }
    this.burst.explode(enemy.isBoss ? 30 : 11, enemy.sprite.x, enemy.sprite.y);
    this.hud.setLove(calculateLovePercent(this.melomeloCount, this.totalEnemies));
    if (enemy.isBoss) {
      this.startFinale();
    }
  }

  private onGateCross(pair: GatePair, width: number): void {
    if (this.phase !== 'playing') {
      return;
    }
    const choseLeft = this.pack.x < width / 2;
    const effect = choseLeft ? pair.cfg.left : pair.cfg.right;
    const next = applyGateEffect(this.pack.count, effect, stage1Config.gameplay.maxShibas);
    this.pack.setCount(next);
    this.maxShibas = Math.max(this.maxShibas, next);
    pair.markResolved(choseLeft);
    soundManager.playGate();
    this.hud.setCount(next);
    this.hud.floatText(
      this.pack.x,
      this.pack.y - 150,
      `${formatGateEffect(effect)}  🐶 ${next}匹!`,
    );
  }

  /** ボス撃破 or 制限時間到達 → 最終演出 → 評価画面 */
  private startFinale(): void {
    if (this.phase !== 'playing') {
      return;
    }
    this.phase = 'finale';
    this.clearTimeSec = this.elapsedSec;
    soundManager.stopBgm();
    soundManager.playClear();
    // 最終演出: 画面いっぱいのハート
    const { width, height } = this.scale;
    this.burst.explode(36, width / 2, height * 0.3);
    this.burst.explode(28, this.pack.x, this.pack.y - 120);
    this.time.delayedCall(350, () => this.burst.explode(24, width * 0.3, height * 0.45));
    this.time.delayedCall(700, () => this.burst.explode(24, width * 0.7, height * 0.45));
    this.hud.floatText(width / 2, height * 0.42, 'クリア!', '#ff5c8a');
    this.time.delayedCall(1500, () => this.showResult());
  }

  private showResult(): void {
    this.phase = 'result';
    const lovePercent = calculateLovePercent(this.melomeloCount, this.totalEnemies);
    const stars = getStarRating(lovePercent, true);
    const clearTime = Math.round(this.clearTimeSec * 10) / 10;
    metricsStore.recordClear({
      clearedAt: new Date().toISOString(),
      clearTimeSec: clearTime,
      lovePercent: Math.round(lovePercent),
      maxShibas: this.maxShibas,
      maxCombo: this.combo.maxCombo,
      stars,
    });
    this.hud.showResult(
      {
        lovePercent,
        stars,
        maxShibas: this.maxShibas,
        maxCombo: this.combo.maxCombo,
        clearTimeSec: clearTime,
        melomeloCount: this.melomeloCount,
        totalEnemies: this.totalEnemies,
      },
      () => {
        metricsStore.recordReplay();
        this.scene.restart();
      },
      () => {
        soundManager.stopBgm();
        this.scene.start('BootScene');
      },
    );
  }

  private toggleSound(): boolean {
    soundManager.unlock();
    soundManager.setEnabled(!soundManager.enabled);
    if (soundManager.enabled) {
      soundManager.startBgm();
    }
    return soundManager.enabled;
  }
}
