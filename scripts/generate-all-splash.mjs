/**
 * Generate iOS splash images at exact pixel dimensions for every device size.
 * Sizes aligned with https://www.ios-resolution.com/ (physical pixel dimensions).
 * Each entry: [logicalW, logicalH, dpr] or [logicalW, logicalH, dpr, physicalW, physicalH] when native pixels differ from logical*dpr.
 * Run: node scripts/generate-all-splash.mjs
 */
import sharp from 'sharp';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public', 'assets', 'splash_screens');

// Source: prefer existing portrait, otherwise create a white 1320x2868 placeholder
const SOURCE_CANDIDATES = [
  join(publicDir, 'iPhone_17_Pro_Max_1320x2868.png'),
  join(publicDir, 'iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait.png'),
  join(publicDir, '1320x2868.png'),
];

// [logicalW, logicalH, dpr] or [logicalW, logicalH, dpr, physicalW, physicalH] — from ios-resolution.com
const SIZES = [
  [440, 956, 3], [440, 996, 3], [402, 874, 3], [420, 912, 3], // iPhone 17 Pro Max, 17 Pro, Air
  [1024, 1366, 2], [1032, 1376, 2], [834, 1194, 2], [834, 1210, 2], [768, 1024, 2], [744, 1133, 2],
  [820, 1180, 2], [834, 1112, 2], [810, 1080, 2],
  [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3],
  [375, 812, 3, 1080, 2340],   // 13 mini, 12 mini, 11 Pro, XS, X — native 1080×2340 per ios-resolution
  [414, 896, 3], [414, 896, 2],
  [414, 736, 3, 1080, 1920],   // 8 Plus, 7 Plus, 6s Plus, 6 Plus — native 1080×1920 per ios-resolution
  [375, 667, 2], [320, 568, 2],
];

const uniqueSizes = new Set();
for (const row of SIZES) {
  const dpr = row[2];
  const w = row.length === 5 ? row[3] : row[0] * dpr;
  const h = row.length === 5 ? row[4] : row[1] * dpr;
  uniqueSizes.add(`${w}x${h}`);
  uniqueSizes.add(`${h}x${w}`);
}

let sourcePath = SOURCE_CANDIDATES.find((p) => existsSync(p));
if (!sourcePath) {
  const { mkdirSync } = await import('fs');
  mkdirSync(publicDir, { recursive: true });
  sourcePath = join(publicDir, '1320x2868.png');
  await sharp({
    create: { width: 1320, height: 2868, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .png()
    .toFile(sourcePath);
  console.log('Created placeholder source:', sourcePath);
}

for (const size of [...uniqueSizes].sort()) {
  const out = join(publicDir, `${size}.png`);
  if (out === sourcePath) {
    console.log('Skip (same as source):', size + '.png');
    continue;
  }
  const [w, h] = size.split('x').map(Number);
  await sharp(sourcePath).resize(w, h).toFile(out);
  console.log('Written:', size + '.png');
}

console.log('Done. Generated', uniqueSizes.size, 'splash images.');

// Android: Chrome uses manifest background_color + theme_color + 512px icon + name for splash.
// Generate a 512×512 from the same source so Android splash matches iOS branding.
const assetsDir = join(__dirname, '..', 'public', 'assets');
const androidSplash512 = join(assetsDir, 'android-splash-512x512.png');
await sharp(sourcePath)
  .resize(512, 512, { fit: 'cover', position: 'center' })
  .toFile(androidSplash512);
console.log('Written (Android splash): android-splash-512x512.png');
