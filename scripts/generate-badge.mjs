/**
 * Generate a monochrome badge icon for Web Push (Android).
 * Android uses the badge as a small icon and expects alpha-only (white on transparent).
 * Run: node scripts/generate-badge.mjs
 */
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'public', 'assets');
const BADGE_SIZES = [72, 96]; // 72 for legacy; 96 recommended for Android 4x (MDN)

const SOURCE_CANDIDATES = [
  join(assetsDir, 'web-app-manifest-192x192.png'),
  join(assetsDir, 'android-splash-512x512.png'),
  join(assetsDir, 'favicon-96x96.png'),
];

async function makeBadge(sourcePath, size, outPath) {
  const { data: alphaData } = await sharp(sourcePath)
    .resize(size, size)
    .ensureAlpha()
    .extractChannel('alpha')
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = 255;
    rgba[i * 4 + 1] = 255;
    rgba[i * 4 + 2] = 255;
    rgba[i * 4 + 3] = alphaData[i];
  }
  await sharp(rgba, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toFile(outPath);
}

async function makeCircleBadge(size, outPath) {
  const radius = size / 2 - 4;
  const center = size / 2;
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const d = Math.sqrt(dx * dx + dy * dy);
      const a = d <= radius ? 255 : 0;
      const i = (y * size + x) * 4;
      pixels[i] = 255;
      pixels[i + 1] = 255;
      pixels[i + 2] = 255;
      pixels[i + 3] = a;
    }
  }
  await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toFile(outPath);
}

async function main() {
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
  }

  const sourcePath = SOURCE_CANDIDATES.find((p) => existsSync(p));

  if (sourcePath) {
    for (const size of BADGE_SIZES) {
      const outPath = join(assetsDir, `badge-${size}x${size}.png`);
      await makeBadge(sourcePath, size, outPath);
      console.log('Generated badge from', sourcePath, '->', outPath);
    }
  } else {
    for (const size of BADGE_SIZES) {
      const outPath = join(assetsDir, `badge-${size}x${size}.png`);
      await makeCircleBadge(size, outPath);
      console.log('Generated placeholder circle badge (no app icon found) ->', outPath);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
