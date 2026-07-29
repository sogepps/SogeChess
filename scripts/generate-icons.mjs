/**
 * Uygulama ikonlarını üretir.
 *
 * Tek bir SVG kaynağından tüm hedefleri (iOS ikonu, Android uyarlanabilir
 * ikon katmanları, açılış ekranı, favicon) rasterize eder. Görsel kimlik
 * uygulama içindeki at (knight) taşıyla aynıdır, böylece mağaza ikonu ile
 * tahtadaki taşlar aynı çizgiyi paylaşır.
 *
 *   node scripts/generate-icons.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');

// Marka renkleri (src/theme/themes.js midnight temasıyla uyumlu)
const NAVY_TOP = '#1E2536';
const NAVY_BOTTOM = '#0B0E14';
const GOLD_TOP = '#F6D276';
const GOLD_BOTTOM = '#D89B2E';

// At taşının geometrisi, 100x100 kutuda, geleneksel yönüyle sola bakar.
// Dış hat burun ucundan başlayıp saat yönünde ilerler: alın, iki kulak, yele,
// ense, taban, boyun önü, çene ve ağız hattı.
const KNIGHT_HEAD =
  'M11 55 C11 48 15 40 22 33 C28 27 34 22 40 17 L43 2 L50 13 L57 1 L64 17 ' +
  'L71 14 L68 25 L78 25 L74 36 L82 39 L78 50 C79 59 78 68 76 76 C75 80 75 82 75 84 ' +
  'L36 84 C36 74 36 68 40 62 C33 67 25 68 18 65 C13 63 11 59 11 55 Z';
// İki kademeli kaide; taşa oturmuşluk hissi verir.
const KNIGHT_COLLAR = 'M31 84 H78 C79 88 79 90 78 92 H31 C30 90 30 88 31 84 Z';
const KNIGHT_BASE =
  'M16 92 H84 C87 92 89 94 89 96.5 V99 C89 101 87 102.5 84 102.5 H16 ' +
  'C13 102.5 11 101 11 99 V96.5 C11 94 13 92 16 92 Z';

/**
 * Ata yele, göz ve burun deliği detayı ekler; düz siluet yerine okunur bir
 * figür verir.
 * @param {string} fill dolgu (düz renk ya da url(#...))
 * @param {string|null} detail göz/yele rengi; null ise yalnız siluet çizilir
 */
function knight(fill, detail) {
  return `
    <g fill="${fill}">
      <path d="${KNIGHT_HEAD}"/>
      <path d="${KNIGHT_COLLAR}"/>
      <path d="${KNIGHT_BASE}"/>
    </g>
    ${
      detail
        ? `<g fill="${detail}">
             <circle cx="37" cy="30" r="3.3"/>
             <ellipse cx="16" cy="50" rx="2.5" ry="1.9"/>
             <path d="M14 57 C20 59 27 60 34 59.5 C27 62 20 61.5 14 59.5 Z"/>
             <path d="M51 14 C59 21 65 31 69 43 C72 54 72 65 70 76
                      C69 64 68 53 65 43 C61 31 56 21 51 14 Z" opacity="0.35"/>
           </g>`
        : ''
    }`;
}

/** Arka planda hafifçe görünen satranç tahtası dokusu. */
function checkerTexture(opacity) {
  const cells = [];
  const n = 8;
  const size = 1024 / n;
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if ((r + c) % 2 === 0) continue;
      cells.push(
        `<rect x="${c * size}" y="${r * size}" width="${size}" height="${size}"/>`
      );
    }
  }
  return `<g fill="#FFFFFF" opacity="${opacity}">${cells.join('')}</g>`;
}

const DEFS = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${NAVY_TOP}"/>
      <stop offset="1" stop-color="${NAVY_BOTTOM}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="${GOLD_TOP}"/>
      <stop offset="1" stop-color="${GOLD_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

// Yukarıdaki yolların gerçek sınırlayıcı kutusu (100x100 kutunun tamamı değil).
const BBOX = { x: 11, y: 1, w: 78, h: 101.5 };

/** Taşı 1024'lük tuvalde ortalar. `scale` yüksekliğin tuvale oranıdır. */
function placeKnight(inner, scale) {
  const k = (1024 * scale) / BBOX.h;
  const tx = (1024 - BBOX.w * k) / 2 - BBOX.x * k;
  const ty = (1024 - BBOX.h * k) / 2 - BBOX.y * k;
  return `<g transform="translate(${tx} ${ty}) scale(${k})">${inner}</g>`;
}

function background() {
  return `<rect width="1024" height="1024" fill="url(#bg)"/>
          ${checkerTexture(0.035)}
          <rect width="1024" height="1024" fill="url(#glow)"/>`;
}

const svgs = {
  // Mağaza / iOS ikonu: tam kare, şeffaflık yok (App Store alfa kanalını reddeder).
  'icon.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${DEFS}${background()}
    ${placeKnight(knight('url(#gold)', NAVY_BOTTOM), 0.6)}
  </svg>`,

  // Android uyarlanabilir ikon: ön plan güvenli alanda kalmalı (merkez %66),
  // aksi halde yuvarlak maskede kenarlar kesilir.
  'android-icon-foreground.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${DEFS}${placeKnight(knight('url(#gold)', NAVY_BOTTOM), 0.42)}
  </svg>`,

  'android-icon-background.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${DEFS}${background()}
  </svg>`,

  // Tek renk katman: Android 13+ temalı ikonlar için, yalnız siluet.
  'android-icon-monochrome.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${placeKnight(knight('#FFFFFF', null), 0.42)}
  </svg>`,

  // Açılış ekranı: arka plan app.json'daki backgroundColor'dan gelir.
  'splash-icon.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${DEFS}${placeKnight(knight('url(#gold)', null), 0.62)}
  </svg>`,

  'favicon.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${DEFS}${background()}
    ${placeKnight(knight('url(#gold)', NAVY_BOTTOM), 0.62)}
  </svg>`,
};

const SIZES = { 'favicon.png': 96 };

await mkdir(ASSETS, { recursive: true });

for (const [name, svg] of Object.entries(svgs)) {
  const size = SIZES[name] ?? 1024;
  let pipeline = sharp(Buffer.from(svg), { density: 384 }).resize(size, size);
  // iOS ikonu alfa kanalı içeremez.
  if (name === 'icon.png') pipeline = pipeline.flatten({ background: NAVY_BOTTOM });
  const out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  await writeFile(join(ASSETS, name), out);
  console.log(`✓ ${name} (${size}x${size}, ${(out.length / 1024).toFixed(1)} kB)`);
}

console.log('\nİkonlar assets/ altına yazıldı.');
