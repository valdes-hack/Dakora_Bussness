import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('./public/icon', { recursive: true });

const src = './src/assets/logos.png';
const sizes = [57, 60, 72, 76, 96, 114, 120, 144, 152, 180, 192, 310];

for (const size of sizes) {
  const prefix = size >= 192 ? 'android-icon' : size === 180 ? 'apple-icon' : size >= 144 ? 'android-icon' : 'apple-icon';
  await sharp(src).resize(size, size, { fit: 'cover' }).png().toFile(`./public/icon/${prefix}-${size}x${size}.png`);
  console.log(`✓ ${size}x${size}`);
}
// Favicon
await sharp(src).resize(32, 32).png().toFile('./public/icon/favicon-32x32.png');
await sharp(src).resize(16, 16).png().toFile('./public/icon/favicon-16x16.png');
await sharp(src).resize(32, 32).png().toFile('./public/icon/favicon.ico');
// ms-icon
await sharp(src).resize(310, 310, { fit: 'cover' }).png().toFile('./public/icon/ms-icon-310x310.png');
await sharp(src).resize(144, 144, { fit: 'cover' }).png().toFile('./public/icon/ms-icon-144x144.png');
console.log('✅ Toutes les icônes PWA générées !');
