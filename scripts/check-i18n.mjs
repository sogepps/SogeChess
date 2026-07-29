/**
 * Çeviri bütünlüğü denetimi.
 *
 * Üç şeyi doğrular:
 *  1. Her dil dosyası İngilizce ile birebir aynı anahtar kümesine sahip mi
 *     (eksik veya fazla anahtar yok mu).
 *  2. Bir çeviri, İngilizce metindeki {param} yer tutucularının hepsini
 *     koruyor mu — biri düşerse arayüzde ham "{n}" görünür.
 *  3. Kodda `t()` ile çağrılan her anahtar sözlükte var mı, ve sözlükteki her
 *     anahtar kodda kullanılıyor mu.
 *
 *   npm run i18n:check
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES_DIR = 'src/i18n/locales';
const FALLBACK = 'en';

// --- sözlükleri yükle ----------------------------------------------------------

const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.js'));
const dicts = {};
for (const f of files) {
  const mod = await import(`../${LOCALES_DIR}/${f}`);
  dicts[f.replace(/\.js$/, '')] = mod.default;
}

const reference = dicts[FALLBACK];
if (!reference) {
  console.error(`Referans sözlük yok: ${LOCALES_DIR}/${FALLBACK}.js`);
  process.exit(1);
}
const refKeys = Object.keys(reference);
const problems = [];

// --- 1 & 2: anahtar kümesi ve yer tutucular ------------------------------------

const PLACEHOLDER = /\{(\w+)\}/g;
const placeholdersOf = (s) => new Set([...String(s).matchAll(PLACEHOLDER)].map((m) => m[1]));

for (const [lang, dict] of Object.entries(dicts)) {
  if (lang === FALLBACK) continue;

  const missing = refKeys.filter((k) => !(k in dict));
  const extra = Object.keys(dict).filter((k) => !(k in reference));
  if (missing.length) problems.push(`${lang}: ${missing.length} eksik anahtar → ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ' …' : ''}`);
  if (extra.length) problems.push(`${lang}: ${extra.length} fazla anahtar → ${extra.slice(0, 8).join(', ')}${extra.length > 8 ? ' …' : ''}`);

  for (const key of refKeys) {
    if (!(key in dict)) continue;
    const want = placeholdersOf(reference[key]);
    const got = placeholdersOf(dict[key]);
    const lost = [...want].filter((p) => !got.has(p));
    if (lost.length) problems.push(`${lang}: ${key} → eksik yer tutucu {${lost.join('}, {')}}`);
  }

  const empty = refKeys.filter((k) => typeof dict[k] === 'string' && !dict[k].trim());
  if (empty.length) problems.push(`${lang}: ${empty.length} boş çeviri → ${empty.slice(0, 5).join(', ')}`);
}

// --- 3: kodla sözlüğün örtüşmesi ------------------------------------------------

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

const sources = [...walk('app'), ...walk('src')].filter((f) => !f.includes(join('src', 'i18n')));
const used = new Set();
// Şablon anahtarlar (`t(\`piece.${type}\`)`) için önek listesi: bu öneklerle
// başlayan sözlük anahtarları "kullanılıyor" sayılır.
const DYNAMIC_PREFIXES = [
  'level.',
  'piece.',
  'puzzle.theme.',
  'opening.base.',
  'opening.mod.',
  'clock.group.',
  'clock.mode.',
  'premium.perk.',
  'result.',
  'reason.',
  'age.band.',
  'home.greeting.',
  'settings.notation.',
  'library.sort.',
  'theme.ui.',
  'theme.board.',
  'pieceSet.',
  'share.file.',
  'error.',
];

// Anahtarlar `t('x')` dışında sabit tablolardan da geliyor (`planKey: 'x'`,
// `MODE_LABEL_KEYS`, `resultLabelKey()` …). Bu yüzden koddaki tüm dizge
// sabitlerini tarayıp sözlükte karşılığı olanları "kullanılıyor" sayıyoruz.
const called = new Set();
for (const file of sources) {
  const code = readFileSync(file, 'utf8');
  for (const m of code.matchAll(/'([^'\n\\]+)'/g)) used.add(m[1]);
  for (const m of code.matchAll(/"([^"\n\\]+)"/g)) used.add(m[1]);
  for (const m of code.matchAll(/\bt\(\s*'([^']+)'/g)) called.add(m[1]);
}

const unknown = [...called].filter((k) => !(k in reference));
if (unknown.length) problems.push(`kodda var, sözlükte yok: ${unknown.join(', ')}`);

const unused = refKeys.filter(
  (k) => !used.has(k) && !DYNAMIC_PREFIXES.some((p) => k.startsWith(p))
);
if (unused.length) {
  console.warn(`Uyarı — sözlükte var, kodda görünmüyor (${unused.length}): ${unused.join(', ')}`);
}

// --- rapor ---------------------------------------------------------------------

if (problems.length) {
  console.error('\nÇeviri sorunları:\n');
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error(`\n${problems.length} sorun bulundu.`);
  process.exit(1);
}

console.log(`${Object.keys(dicts).length} dil × ${refKeys.length} anahtar — hepsi eksiksiz.`);
