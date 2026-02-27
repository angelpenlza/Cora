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
const outPath = join(assetsDir, 'badge-72x72.png');

const SOURCE_CANDIDATES = [
  join(assetsDir, 'web-app-manifest-192x192.png'),
  join(assetsDir, 'android-splash-512x512.png'),
  join(assetsDir, 'favicon-96x96.png'),
];

const SIZE = 72;

async function main() {
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
  }

  const sourcePath = SOURCE_CANDIDATES.find((p) => existsSync(p));

  if (sourcePath) {
    const { data: alphaData } = await sharp(sourcePath)
      .resize(SIZE, SIZE)
      .ensureAlpha()
      .extractChannel('alpha')
      .raw()
      .toBuffer({ resolveWithObject: true });
    const rgba = Buffer.alloc(SIZE * SIZE * 4);
    for (let i = 0; i < SIZE * SIZE; i++) {
      rgba[i * 4] = 255;
      rgba[i * 4 + 1] = 255;
      rgba[i * 4 + 2] = 255;
      rgba[i * 4 + 3] = alphaData[i];
    }
    await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } })
      .png()
      .toFile(outPath);
    console.log('Generated badge from', sourcePath, '->', outPath);
  } else {
    // Fallback: simple white circle on transparent (so Android has a proper badge)
    const radius = SIZE / 2 - 4;
    const center = SIZE / 2;
    const pixels = Buffer.alloc(SIZE * SIZE * 4);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x - center;
        const dy = y - center;
        const d = Math.sqrt(dx * dx + dy * dy);
        const a = d <= radius ? 255 : 0;
        const i = (y * SIZE + x) * 4;
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
        pixels[i + 3] = a;
      }
    }
    await sharp(pixels, {
      raw: { width: SIZE, height: SIZE, channels: 4 },
    })
      .png()
      .toFile(outPath);
    console.log('Generated placeholder circle badge (no app icon found) ->', outPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
