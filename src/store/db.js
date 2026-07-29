import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18nError } from '../i18n/errors';

// Depolama şeması
// -----------------------------------------------------------------------------
// soge:v1:settings          -> ayarlar nesnesi
// soge:v1:premium           -> yetki (entitlement) durumu
// soge:v1:games:index       -> [meta] hafif liste, tek okumada gelir
// soge:v1:game:<id>         -> tam parti (PGN, hamleler, saat verisi, notlar)
// soge:v1:positions:index   -> [meta]
// soge:v1:position:<id>     -> tam konum kaydı
// soge:v1:clock:presets     -> özel saat ayarları
// soge:v1:session:<name>    -> yarım kalmış oturumlar (aktif parti, saat)
// soge:v1:progress          -> bulmaca/istatistik ilerlemesi
//
// Listeler ayrı tutulduğu için arşiv büyüdükçe liste ekranı yavaşlamaz;
// tam kayıt yalnızca açıldığında okunur.

const P = 'soge:v1:';
export const KEYS = {
  settings: P + 'settings',
  premium: P + 'premium',
  gamesIndex: P + 'games:index',
  positionsIndex: P + 'positions:index',
  clockPresets: P + 'clock:presets',
  progress: P + 'progress',
  game: (id) => `${P}game:${id}`,
  position: (id) => `${P}position:${id}`,
  session: (name) => `${P}session:${name}`,
};

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function readJson(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function removeKey(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// --- Partiler -----------------------------------------------------------------

// Listede gösterilen alanlar; tam kaydı okumadan kart çizebilmek için.
function toGameMeta(game) {
  return {
    id: game.id,
    white: game.headers?.White || '',
    black: game.headers?.Black || '',
    event: game.headers?.Event || '',
    site: game.headers?.Site || '',
    date: game.headers?.Date || '',
    round: game.headers?.Round || '',
    result: game.headers?.Result || '*',
    timeControl: game.headers?.TimeControl || '',
    opening: game.opening || null,
    moveCount: Array.isArray(game.moves) ? game.moves.length : 0,
    tags: game.tags || [],
    source: game.source || 'manual',
    favorite: !!game.favorite,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}

export async function listGames() {
  return (await readJson(KEYS.gamesIndex, [])) || [];
}

export async function getGame(id) {
  return await readJson(KEYS.game(id), null);
}

export async function saveGame(game) {
  const now = Date.now();
  const record = {
    ...game,
    id: game.id || uid('g'),
    createdAt: game.createdAt || now,
    updatedAt: now,
  };
  await writeJson(KEYS.game(record.id), record);

  const index = await listGames();
  const meta = toGameMeta(record);
  const at = index.findIndex((g) => g.id === record.id);
  if (at >= 0) index[at] = meta;
  else index.unshift(meta);
  await writeJson(KEYS.gamesIndex, index);
  return record;
}

export async function deleteGame(id) {
  await removeKey(KEYS.game(id));
  const index = (await listGames()).filter((g) => g.id !== id);
  await writeJson(KEYS.gamesIndex, index);
}

export async function deleteGames(ids) {
  const set = new Set(ids);
  await Promise.all([...set].map((id) => removeKey(KEYS.game(id))));
  const index = (await listGames()).filter((g) => !set.has(g.id));
  await writeJson(KEYS.gamesIndex, index);
}

// Toplu içe aktarımda index'i her kayıtta bir kez değil, sonda bir kez yazarız.
export async function saveGamesBulk(games) {
  const now = Date.now();
  const records = games.map((g) => ({
    ...g,
    id: g.id || uid('g'),
    createdAt: g.createdAt || now,
    updatedAt: now,
  }));
  await AsyncStorage.multiSet(
    records.map((r) => [KEYS.game(r.id), JSON.stringify(r)])
  );
  const index = await listGames();
  await writeJson(KEYS.gamesIndex, [...records.map(toGameMeta), ...index]);
  return records;
}

// --- Konumlar -----------------------------------------------------------------

function toPositionMeta(pos) {
  return {
    id: pos.id,
    name: pos.name || '',
    fen: pos.fen,
    tags: pos.tags || [],
    collection: pos.collection || '',
    favorite: !!pos.favorite,
    createdAt: pos.createdAt,
    updatedAt: pos.updatedAt,
  };
}

export async function listPositions() {
  return (await readJson(KEYS.positionsIndex, [])) || [];
}

export async function getPosition(id) {
  return await readJson(KEYS.position(id), null);
}

export async function savePosition(pos) {
  const now = Date.now();
  const record = {
    ...pos,
    id: pos.id || uid('p'),
    createdAt: pos.createdAt || now,
    updatedAt: now,
  };
  await writeJson(KEYS.position(record.id), record);

  const index = await listPositions();
  const meta = toPositionMeta(record);
  const at = index.findIndex((p) => p.id === record.id);
  if (at >= 0) index[at] = meta;
  else index.unshift(meta);
  await writeJson(KEYS.positionsIndex, index);
  return record;
}

export async function deletePosition(id) {
  await removeKey(KEYS.position(id));
  const index = (await listPositions()).filter((p) => p.id !== id);
  await writeJson(KEYS.positionsIndex, index);
}

// --- Yedekleme ----------------------------------------------------------------

export async function exportBackup() {
  const gamesIdx = await listGames();
  const posIdx = await listPositions();
  const gameKeys = gamesIdx.map((g) => KEYS.game(g.id));
  const posKeys = posIdx.map((p) => KEYS.position(p.id));
  const pairs = await AsyncStorage.multiGet([
    ...gameKeys,
    ...posKeys,
    KEYS.settings,
    KEYS.clockPresets,
    KEYS.progress,
  ]);
  const blob = {};
  for (const [k, v] of pairs) if (v != null) blob[k] = v;
  return {
    format: 'soge-chess-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: blob,
  };
}

export async function importBackup(backup, { merge = true } = {}) {
  if (!backup || backup.format !== 'soge-chess-backup') {
    throw i18nError('error.unknownBackup');
  }
  const entries = Object.entries(backup.entries || {});
  if (!merge) await clearAll();

  // Yedekteki index'leri mevcutlarla birleştirmek gerekiyor; ham yazarsak
  // birleştirme modunda eski kayıtların index girdileri kaybolur.
  const incomingGamesIdx = JSON.parse(backup.entries[KEYS.gamesIndex] || '[]');
  const incomingPosIdx = JSON.parse(backup.entries[KEYS.positionsIndex] || '[]');
  const plain = entries.filter(
    ([k]) => k !== KEYS.gamesIndex && k !== KEYS.positionsIndex
  );
  if (plain.length) await AsyncStorage.multiSet(plain);

  const mergeIndex = async (key, incoming) => {
    const current = merge ? (await readJson(key, [])) || [] : [];
    const byId = new Map(current.map((x) => [x.id, x]));
    for (const item of incoming) byId.set(item.id, item);
    await writeJson(key, [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt));
  };
  await mergeIndex(KEYS.gamesIndex, incomingGamesIdx);
  await mergeIndex(KEYS.positionsIndex, incomingPosIdx);

  return { games: incomingGamesIdx.length, positions: incomingPosIdx.length };
}

export async function clearAll() {
  const keys = await AsyncStorage.getAllKeys();
  const mine = keys.filter((k) => k.startsWith(P));
  if (mine.length) await AsyncStorage.multiRemove(mine);
}

export async function storageFootprint() {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(P));
  const pairs = await AsyncStorage.multiGet(keys);
  let bytes = 0;
  for (const [k, v] of pairs) bytes += k.length + (v ? v.length : 0);
  return { keys: keys.length, bytes };
}
