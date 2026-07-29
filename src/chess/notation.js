// SAN gösterimini kullanıcının seçtiği biçime çevirir.
// Dosya/kare harfleri (a-h) hiçbir zaman çevrilmez, yalnızca taş harfleri değişir.

const FIGURINE = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘' };

/**
 * Yerelleştirilmiş taş harfleri.
 *
 * Her dilin kendi satranç notasyonu vardır (TR "Af3", DE "Sf3", FR "Cf3").
 * Burada listelenmeyen diller için yerelleştirilmiş notasyon İngilizce
 * harflere düşer — uydurma bir harf üretmektense standart SAN daha doğrudur.
 * Sıralama: K(şah) Q(vezir) R(kale) B(fil) N(at).
 */
const LOCALIZED = {
  tr: { K: 'Ş', Q: 'V', R: 'K', B: 'F', N: 'A' },
  de: { K: 'K', Q: 'D', R: 'T', B: 'L', N: 'S' },
  fr: { K: 'R', Q: 'D', R: 'T', B: 'F', N: 'C' },
  es: { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' },
  it: { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' },
  pt: { K: 'R', Q: 'D', R: 'T', B: 'B', N: 'C' },
  nl: { K: 'K', Q: 'D', R: 'T', B: 'L', N: 'P' },
  pl: { K: 'K', Q: 'H', R: 'W', B: 'G', N: 'S' },
  cs: { K: 'K', Q: 'D', R: 'V', B: 'S', N: 'J' },
  da: { K: 'K', Q: 'D', R: 'T', B: 'L', N: 'S' },
  no: { K: 'K', Q: 'D', R: 'T', B: 'L', N: 'S' },
  sv: { K: 'K', Q: 'D', R: 'T', B: 'L', N: 'S' },
  fi: { K: 'K', Q: 'D', R: 'T', B: 'L', N: 'R' },
  hu: { K: 'K', Q: 'V', R: 'B', B: 'F', N: 'H' },
  ro: { K: 'R', Q: 'D', R: 'T', B: 'N', N: 'C' },
  ru: { K: 'Кр', Q: 'Ф', R: 'Л', B: 'С', N: 'К' },
  uk: { K: 'Кр', Q: 'Ф', R: 'Т', B: 'С', N: 'К' },
  el: { K: 'Ρ', Q: 'Β', R: 'Π', B: 'Α', N: 'Ι' },
  az: { K: 'Ş', Q: 'V', R: 'T', B: 'F', N: 'A' },
  id: { K: 'R', Q: 'M', R: 'B', B: 'G', N: 'K' },
};

export const NOTATION_STYLES = ['san', 'figurine', 'localized'];

export function formatSan(san, style = 'san', lang = 'en') {
  if (!san || style === 'san') return san;

  const map = style === 'figurine' ? FIGURINE : LOCALIZED[lang];
  if (!map) return san;

  // Yalnızca baştaki taş harfini ve terfi harfini (=Q) çeviriyoruz.
  let out = san;
  const first = out[0];
  if (map[first]) out = map[first] + out.slice(1);
  out = out.replace(/=([KQRBN])/, (_, p) => '=' + (map[p] || p));
  return out;
}

/** Terfi seçim ekranındaki taş adları; çeviriden gelir. */
export function pieceName(type, t) {
  return t(`piece.${type}`);
}

/** Seçili dilin yerelleştirilmiş notasyonu var mı? Ayarlar ekranı sorar. */
export function hasLocalizedNotation(lang) {
  return !!LOCALIZED[lang];
}

/** Ayarlar ekranında örnek gösterimi ("Af3", "Sf3"…). */
export function localizedNotationSample(lang) {
  const map = LOCALIZED[lang];
  return `${map ? map.N : 'N'}f3`;
}
