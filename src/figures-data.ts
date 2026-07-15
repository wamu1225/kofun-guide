// 自作SVG模式図のHTML文字列を一元管理する単一の真実源（SSOT）。
// React版（App.tsx の {{figure:KEY}} 展開）と prerender（scripts/prerender.ts）の双方がここを使い、
// 二重レンダラの食い違い（生タグ露出）を防ぐ。写真は著作権リスクのため使わず、模式図で補う。
// テーマ：弁柄テラコッタ(#9b5440) × 古墳の緑(#4f7a5e) × 砂色(#f4efe6)。

const BG = '#f4efe6';
const TERRA = '#9b5440';
const TERRA_DEEP = '#6e3a2c';
const GREEN = '#4f7a5e';
const EARTH = '#e7d8bf';
const MOAT = '#bcd0d6';
const INK = '#2f2a26';

// 1) 墳形5種（上から見た輪郭）
function funkeiSvg(): string {
  const panel = (x: number, label: string, shape: string) =>
    `<g transform="translate(${x} 0)">` +
    `<rect x="4" y="10" width="52" height="58" rx="6" fill="#ffffff" stroke="${TERRA}" stroke-width="1.3"/>` +
    shape +
    `<text x="30" y="82" font-size="9" font-weight="700" fill="${TERRA_DEEP}" text-anchor="middle">${label}</text>` +
    `</g>`;
  const fill = `fill="${EARTH}" stroke="${TERRA}" stroke-width="1.6"`;
  // 前方後円（鍵穴）: 円＋台形
  const zenpoEn = `<path d="M30 20 a11 11 0 1 1 -0.1 0 Z" ${fill}/><path d="M22 36 L20 60 L40 60 L38 36 Z" ${fill}/>`;
  // 前方後方: 方＋台形
  const zenpoHo = `<rect x="19" y="20" width="22" height="20" ${fill}/><path d="M22 40 L20 60 L40 60 L38 40 Z" ${fill}/>`;
  // 円墳
  const en = `<circle cx="30" cy="40" r="15" ${fill}/>`;
  // 方墳
  const ho = `<rect x="16" y="26" width="28" height="28" ${fill}/>`;
  // 帆立貝形: 円＋極短台形
  const hotate = `<path d="M30 22 a12 12 0 1 1 -0.1 0 Z" ${fill}/><path d="M24 44 L23 54 L37 54 L36 44 Z" ${fill}/>`;
  return (
    `<svg class="diagram-single" viewBox="0 0 300 92" width="100%" role="img" aria-label="古墳の主な五つの形（前方後円墳・前方後方墳・円墳・方墳・帆立貝形）を上から見た輪郭の図">` +
    `<rect width="300" height="92" fill="${BG}"/>` +
    panel(0, '前方後円墳', zenpoEn) +
    panel(60, '前方後方墳', zenpoHo) +
    panel(120, '円墳', en) +
    panel(180, '方墳', ho) +
    panel(240, '帆立貝形', hotate) +
    `</svg>`
  );
}

// 2) 竪穴式石室と横穴式石室（断面）
function sekishitsuSvg(): string {
  const panel = (x: number, title: string, body: string) =>
    `<g transform="translate(${x} 0)">` +
    `<rect x="6" y="12" width="126" height="92" rx="8" fill="#ffffff" stroke="${TERRA}" stroke-width="1.3"/>` +
    body +
    `<text x="69" y="118" font-size="10" font-weight="700" fill="${TERRA_DEEP}" text-anchor="middle">${title}</text>` +
    `</g>`;
  // 墳丘の山形
  const mound = (cx: number) => `<path d="M${cx - 56} 96 Q${cx} 34 ${cx + 56} 96 Z" fill="${EARTH}" stroke="${TERRA}" stroke-width="1.4"/>`;
  // 竪穴式: 墳頂から縦穴・棺・天井石でふさぐ
  const tate = mound(69) +
    `<rect x="60" y="58" width="18" height="22" fill="#cdb290" stroke="${TERRA_DEEP}" stroke-width="1.2"/>` +
    `<rect x="63" y="62" width="12" height="14" fill="#8a6f4e"/>` + // 棺
    `<rect x="58" y="53" width="22" height="5" fill="#9a9388"/>` + // 天井石
    `<line x1="69" y1="40" x2="69" y2="53" stroke="${TERRA_DEEP}" stroke-width="1" stroke-dasharray="3 2"/>` +
    `<text x="69" y="92" font-size="7.5" fill="${INK}" text-anchor="middle">上から縦穴・密閉</text>`;
  // 横穴式: 側面入口・羨道・玄室
  const yoko = mound(69) +
    `<rect x="40" y="74" width="40" height="16" fill="#8a6f4e" stroke="${TERRA_DEEP}" stroke-width="1.2"/>` + // 玄室
    `<rect x="80" y="80" width="34" height="9" fill="#a98c66" stroke="${TERRA_DEEP}" stroke-width="1"/>` + // 羨道
    `<text x="60" y="84" font-size="7" fill="#fff" text-anchor="middle">玄室</text>` +
    `<text x="97" y="87" font-size="6.5" fill="${INK}" text-anchor="middle">羨道</text>` +
    `<path d="M120 84 l-6 -3 M120 84 l-6 3" stroke="${TERRA_DEEP}" stroke-width="1.2" fill="none"/>` +
    `<text x="69" y="100" font-size="7.5" fill="${INK}" text-anchor="middle">横から出入り・追葬可</text>`;
  return (
    `<svg class="diagram-single" viewBox="0 0 300 128" width="100%" role="img" aria-label="竪穴式石室と横穴式石室の断面の比較図">` +
    `<rect width="300" height="128" fill="${BG}"/>` +
    panel(0, '竪穴式石室', tate) +
    panel(150, '横穴式石室', yoko) +
    `</svg>`
  );
}

// 3) 世界三大墳墓の規模くらべ（側面のシルエット・相対比）
function sandaiSvg(): string {
  // 高さの相対：ピラミッド146 / 始皇帝76 / 仁徳35.8 を約 0.6 倍で
  const ground = 150;
  // 仁徳陵（長く低い前方後円・側面）
  const nintoku =
    `<path d="M16 ${ground} Q40 ${ground - 22} 70 ${ground - 22} Q104 ${ground - 22} 120 ${ground} Z" fill="${EARTH}" stroke="${TERRA}" stroke-width="1.6"/>` +
    `<path d="M10 ${ground} h120" stroke="${MOAT}" stroke-width="3"/>` +
    `<text x="68" y="${ground + 16}" font-size="10" font-weight="700" fill="${TERRA_DEEP}" text-anchor="middle">仁徳天皇陵古墳</text>` +
    `<text x="68" y="${ground + 27}" font-size="8.5" fill="${INK}" text-anchor="middle">全長 約486m</text>` +
    `<text x="68" y="${ground + 39}" font-size="8.5" fill="${INK}" text-anchor="middle">高 約36m</text>`;
  // ピラミッド（高い三角）
  const pyramid =
    `<path d="M150 ${ground} L182 ${ground - 92} L214 ${ground} Z" fill="${EARTH}" stroke="${TERRA}" stroke-width="1.6"/>` +
    `<text x="182" y="${ground + 16}" font-size="10" font-weight="700" fill="${TERRA_DEEP}" text-anchor="middle">クフ王のピラミッド</text>` +
    `<text x="182" y="${ground + 27}" font-size="8.5" fill="${INK}" text-anchor="middle">底辺 約230m</text>` +
    `<text x="182" y="${ground + 39}" font-size="8.5" fill="${INK}" text-anchor="middle">高 約146m</text>`;
  // 始皇帝陵（中くらいの台形マウンド）
  const qin =
    `<path d="M234 ${ground} L248 ${ground - 48} L280 ${ground - 48} L294 ${ground} Z" fill="${EARTH}" stroke="${TERRA}" stroke-width="1.6"/>` +
    `<text x="264" y="${ground + 16}" font-size="10" font-weight="700" fill="${TERRA_DEEP}" text-anchor="middle">秦の始皇帝陵</text>` +
    `<text x="264" y="${ground + 27}" font-size="8.5" fill="${INK}" text-anchor="middle">全長 約350m</text>` +
    `<text x="264" y="${ground + 39}" font-size="8.5" fill="${INK}" text-anchor="middle">高 約76m</text>`;
  return (
    `<svg class="diagram-single" viewBox="0 0 304 200" width="100%" role="img" aria-label="仁徳天皇陵古墳とクフ王のピラミッドと秦の始皇帝陵を側面の高さと長さで比べた図">` +
    `<rect width="304" height="200" fill="${BG}"/>` +
    `<line x1="6" y1="${ground}" x2="298" y2="${ground}" stroke="${TERRA}" stroke-width="1"/>` +
    nintoku + pyramid + qin +
    `<text x="152" y="14" font-size="8.5" fill="${GREEN}" text-anchor="middle">高さはピラミッド、長さは仁徳陵、体積は始皇帝陵が最大（おおよその比）</text>` +
    `</svg>`
  );
}

const FIGURE_DATA: Record<string, { caption: string; inner: string }> = {
  'funkei': {
    caption: '古墳の主な五つの形（模式図）。上から見た輪郭で見分ける。円と方形をつないだ鍵穴形が前方後円墳で、最も格式が高いとされる。帆立貝形は前方部が短い変形にあたる。',
    inner: `<div class="diagram-wrap">${funkeiSvg()}</div>`,
  },
  'sekishitsu': {
    caption: '竪穴式石室と横穴式石室の断面（模式図）。竪穴式は墳頂から縦に穴を掘って密閉し、ひとりを葬る。横穴式は側面に入り口を開け、玄室と羨道をもち、あとから追葬ができる。',
    inner: `<div class="diagram-wrap">${sekishitsuSvg()}</div>`,
  },
  'sandai-hikaku': {
    caption: '世界三大墳墓の規模くらべ（模式図・おおよその相対比）。ピラミッドは高さで、始皇帝陵は体積で、仁徳天皇陵古墳は平面の長さで最大とされる。日本の巨大古墳は高くそびえるより水平に長く広がる。',
    inner: `<div class="diagram-wrap">${sandaiSvg()}</div>`,
  },
};

export const FIGURE_KEYS = Object.keys(FIGURE_DATA);

export function figureHtml(id: string): string | null {
  const f = FIGURE_DATA[id];
  if (!f) return null;
  return `<div class="content-figure">${f.inner}<p class="figure-caption">${f.caption}</p></div>`;
}
