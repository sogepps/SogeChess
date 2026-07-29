import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getGame, exportBackup, importBackup } from '../store/db';
import { serializeGameToPgn, serializeManyToPgn } from '../chess/pgn';
import { i18nError } from '../i18n/errors';

// Dosyalar önbellek klasörüne yazılır: paylaşım sayfası kapandıktan sonra
// sistem temizleyebilir, kalıcı yer kaplamaz.
function cacheFile(name) {
  return new File(Paths.cache, name);
}

/** Dosya adında güvenli olmayan karakterleri temizler. */
function slug(text, fallback) {
  const safe = String(text || '')
    .replace(/[^\p{L}\p{N}_-]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return safe || fallback;
}

async function writeAndShare(name, contents, mimeType, dialogTitle) {
  const file = cacheFile(name);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);

  if (!(await Sharing.isAvailableAsync())) {
    throw i18nError('error.shareUnavailable');
  }
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle, UTI: 'public.plain-text' });
  return file.uri;
}

/** Tek bir partiyi PGN olarak paylaşır. */
export async function shareGame(gameId, t) {
  const game = await getGame(gameId);
  if (!game) throw i18nError('error.gameNotFound');
  const pgn = serializeGameToPgn(game);
  const white = game.headers?.White || t('common.white');
  const black = game.headers?.Black || t('common.black');
  const name = slug(`${white}-${black}`, slug(t('share.file.game'), 'game'));
  return writeAndShare(`${name}.pgn`, pgn, 'application/x-chess-pgn', 'PGN');
}

/** Birden çok partiyi tek dosyada paylaşır. */
export async function exportGamesToFile(gameIds, t, filenameKey = 'share.file.games') {
  const games = [];
  for (const id of gameIds) {
    const g = await getGame(id);
    if (g) games.push(g);
  }
  if (!games.length) throw i18nError('error.noGamesToExport');
  const name = `${slug(t(filenameKey), 'games')}.pgn`;
  return writeAndShare(name, serializeManyToPgn(games), 'application/x-chess-pgn', 'PGN');
}

/** Ham metni paylaşır (FEN, tek PGN, analiz çıktısı). */
export async function shareText(text, filename = 'soge.txt') {
  return writeAndShare(filename, text, 'text/plain', filename);
}

/** Tüm veritabanının JSON yedeğini paylaşır. */
export async function shareBackup(t) {
  const backup = await exportBackup();
  const stamp = new Date().toISOString().slice(0, 10);
  return writeAndShare(
    `${slug(t('share.file.backup'), 'backup')}-${stamp}.json`,
    JSON.stringify(backup),
    'application/json',
    t('settings.exportBackup')
  );
}

/** Seçilen yedek dosyasını okuyup geri yükler. */
export async function restoreBackupFromUri(uri, options) {
  const file = new File(uri);
  const text = await file.text();
  return importBackup(JSON.parse(text), options);
}
