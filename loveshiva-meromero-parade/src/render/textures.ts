import Phaser from 'phaser';

/**
 * 仮素材テクスチャの生成（図形描画）。
 *
 * 画像素材はコードから分離し、ここで生成するテクスチャ名
 * （'shiba', 'heart', 'girl', 'girl-melo', 'boss', 'boss-melo', 'ground'）を
 * シーン側が参照する。AI 生成素材へ差し替える場合は、
 * この関数の代わりに画像を同じキーで読み込めばよい。
 */

const SKIN = 0xffd9c0;
const HAIR = 0x7a4a2b;
const DRESS = 0xff8fb8;
const HEART_PINK = 0xff5c8a;

function drawHeartShape(g: Phaser.GameObjects.Graphics, cx: number, cy: number, size: number): void {
  const r = size * 0.22;
  g.fillStyle(HEART_PINK, 1);
  g.fillCircle(cx - r, cy - size * 0.08, r);
  g.fillCircle(cx + r, cy - size * 0.08, r);
  g.fillTriangle(
    cx - size * 0.42,
    cy + size * 0.02,
    cx + size * 0.42,
    cy + size * 0.02,
    cx,
    cy + size * 0.48,
  );
}

function drawGirl(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
  melo: boolean,
  crown: boolean,
): void {
  const cx = w / 2;
  const headR = w * 0.22;
  const headY = h * 0.3;

  // ドレス（台形）
  g.fillStyle(DRESS, 1);
  g.fillPoints(
    [
      { x: cx - w * 0.13, y: h * 0.46 },
      { x: cx + w * 0.13, y: h * 0.46 },
      { x: cx + w * 0.36, y: h * 0.97 },
      { x: cx - w * 0.36, y: h * 0.97 },
    ],
    true,
  );
  // 髪（後ろ）
  g.fillStyle(HAIR, 1);
  g.fillCircle(cx, headY - headR * 0.15, headR * 1.12);
  g.fillRect(cx - headR * 1.12, headY - headR * 0.2, headR * 0.38, headR * 1.7);
  g.fillRect(cx + headR * 0.74, headY - headR * 0.2, headR * 0.38, headR * 1.7);
  // 顔
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx, headY, headR);
  // 前髪
  g.fillStyle(HAIR, 1);
  g.fillEllipse(cx, headY - headR * 0.72, headR * 1.9, headR * 0.8);

  if (melo) {
    // 目がハート
    drawHeartShape(g, cx - headR * 0.38, headY + headR * 0.05, headR * 0.55);
    drawHeartShape(g, cx + headR * 0.38, headY + headR * 0.05, headR * 0.55);
  } else {
    g.fillStyle(0x333333, 1);
    g.fillCircle(cx - headR * 0.36, headY + headR * 0.08, headR * 0.11);
    g.fillCircle(cx + headR * 0.36, headY + headR * 0.08, headR * 0.11);
  }
  // 口（小さな笑み）
  g.fillStyle(0xd6336c, 1);
  g.fillEllipse(cx, headY + headR * 0.48, headR * 0.34, headR * 0.16);

  if (crown) {
    const top = headY - headR * 1.55;
    g.fillStyle(0xffc93c, 1);
    g.fillPoints(
      [
        { x: cx - headR * 0.8, y: top + headR * 0.5 },
        { x: cx - headR * 0.8, y: top },
        { x: cx - headR * 0.4, y: top + headR * 0.32 },
        { x: cx, y: top - headR * 0.05 },
        { x: cx + headR * 0.4, y: top + headR * 0.32 },
        { x: cx + headR * 0.8, y: top },
        { x: cx + headR * 0.8, y: top + headR * 0.5 },
      ],
      true,
    );
  }
}

function drawShibaBack(g: Phaser.GameObjects.Graphics): void {
  // 体（後ろ姿の楕円）
  g.fillStyle(0xd9a066, 1);
  g.fillEllipse(48, 60, 62, 52);
  // 頭
  g.fillStyle(0xe0aa6e, 1);
  g.fillCircle(48, 28, 20);
  // 耳
  g.fillStyle(0xc98d4e, 1);
  g.fillTriangle(28, 18, 43, 15, 33, 2);
  g.fillTriangle(68, 18, 53, 15, 63, 2);
  // 巻き尾（後ろ姿の目印）
  g.lineStyle(6, 0xc98d4e, 1);
  g.beginPath();
  g.arc(72, 68, 9, Phaser.Math.DegToRad(300), Phaser.Math.DegToRad(140), false);
  g.strokePath();
  // 首元の白
  g.fillStyle(0xfff6ec, 1);
  g.fillEllipse(48, 74, 32, 20);
}

function drawGround(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  // 芝生
  g.fillStyle(0x9ede8a, 1);
  g.fillRect(0, 0, w, h);
  // 中央の道
  g.fillStyle(0xf3e2c7, 1);
  g.fillRect(w / 2 - 190, 0, 380, h);
  g.fillStyle(0xffffff, 0.65);
  g.fillRect(w / 2 - 196, 0, 6, h);
  g.fillRect(w / 2 + 190, 0, 6, h);
  // 道の中央線（破線）
  g.fillStyle(0xe8b4c8, 0.8);
  for (let y = 0; y < h; y += 64) {
    g.fillRect(w / 2 - 4, y + 8, 8, 34);
  }
  // 芝生の小花
  const flowers = [0xff8fb8, 0xffffff, 0xffd93c];
  for (let i = 0; i < 26; i += 1) {
    const x = Phaser.Math.Between(12, w - 12);
    if (Math.abs(x - w / 2) < 215) {
      continue;
    }
    const y = Phaser.Math.Between(6, h - 6);
    g.fillStyle(flowers[i % flowers.length], 0.9);
    g.fillCircle(x, y, 4);
  }
}

/** ゲームで使うテクスチャをまとめて生成する（生成済みなら何もしない） */
export function createGameTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('shiba')) {
    return;
  }
  const g = scene.add.graphics();

  drawShibaBack(g);
  g.generateTexture('shiba', 96, 96);
  g.clear();

  drawHeartShape(g, 20, 17, 40);
  g.generateTexture('heart', 40, 40);
  g.clear();

  drawGirl(g, 120, 160, false, false);
  g.generateTexture('girl', 120, 160);
  g.clear();

  drawGirl(g, 120, 160, true, false);
  g.generateTexture('girl-melo', 120, 160);
  g.clear();

  drawGirl(g, 220, 280, false, true);
  g.generateTexture('boss', 220, 280);
  g.clear();

  drawGirl(g, 220, 280, true, true);
  g.generateTexture('boss-melo', 220, 280);
  g.clear();

  drawGround(g, 720, 256);
  g.generateTexture('ground', 720, 256);
  g.clear();

  g.destroy();
}
