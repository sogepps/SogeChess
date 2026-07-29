/**
 * Hata mesajlarının yerelleştirilmesi.
 *
 * Veri katmanı (`db.js`, `pgn.js`, `share.js`) hangi dilin seçili olduğunu
 * bilmez ve bilmemeli. Bu yüzden hazır cümle yerine çeviri anahtarı fırlatır;
 * mesajı ekran, kullanıcının diliyle `errorMessage(err, t)` çağırarak kurar.
 */

/** Çeviri anahtarı taşıyan bir Error üretir. */
export function i18nError(key, params) {
  const err = new Error(key);
  err.i18nKey = key;
  if (params) err.i18nParams = params;
  return err;
}

/**
 * Yakalanan hatayı kullanıcıya gösterilecek metne çevirir.
 * Anahtarı olmayan (beklenmeyen) hatalar genel bir mesaja düşer.
 */
export function errorMessage(err, t) {
  if (err?.i18nKey) return t(err.i18nKey, err.i18nParams);
  return t('error.unexpected');
}
