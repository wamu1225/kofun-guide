// scripts/generate-ogp.ts — OGP画像（1200×630）を public/ogp.png に生成する。
// 実行: npx tsx scripts/generate-ogp.ts
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const FONT = "'Yu Gothic','Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,'Noto Sans JP',sans-serif";
const SERIF = "'Yu Mincho','Hiragino Mincho ProN','Noto Serif JP',serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f4efe6"/>
  <rect x="0" y="0" width="16" height="630" fill="#9b5440"/>
  <rect x="16" y="0" width="6" height="630" fill="#4f7a5e"/>
  <text x="96" y="208" font-family="${SERIF}" font-size="84" font-weight="700" fill="#6e3a2c">古墳の入門ガイド</text>
  <text x="96" y="300" font-family="${FONT}" font-size="26" fill="#5f574f">前方後円墳の形、竪穴式と横穴式の石室、古墳時代の流れ、</text>
  <text x="96" y="338" font-family="${FONT}" font-size="26" fill="#5f574f">仁徳天皇陵古墳、世界三大墳墓の規模くらべまでを図解と出典で</text>
  <line x1="96" y1="404" x2="720" y2="404" stroke="#ddd3c0" stroke-width="2"/>
  <text x="96" y="456" font-family="${FONT}" font-size="24" fill="#9b5440" font-weight="600">study-apps.com/kofun-guide/</text>
  <!-- 前方後円墳（鍵穴形・上から） -->
  <g transform="translate(1000 315)">
    <path d="M0 -118 A118 118 0 1 1 0 -118 Z" fill="none"/>
    <path d="M0 -120 A40 40 0 1 1 0 -40 L24 96 L-24 96 L0 -40" fill="none" stroke="#cdbfa3" stroke-width="6"/>
    <circle cx="0" cy="-80" r="56" fill="#e7d8bf" stroke="#9b5440" stroke-width="3"/>
    <path d="M0 -28 L-36 96 L36 96 Z" fill="#e7d8bf" stroke="#9b5440" stroke-width="3"/>
    <circle cx="0" cy="-80" r="34" fill="none" stroke="#9b5440" stroke-width="2" opacity="0.55"/>
  </g>
</svg>`;

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const outPath = path.join(PUBLIC_DIR, 'ogp.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ ogp.png (1200x630) を生成: ${outPath}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
