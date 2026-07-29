/**
 * Karışık kitle (Families / her yaş) için nötr yaş bantları.
 *
 * Play politikası "çocuk musun?" diye sormayı istemez; kullanıcı kendi yaş
 * aralığını seçer. 13 altı → çocuk reklamı, 13–17 → ergen muamelesi,
 * 18+ → standart yetişkin akışı. Yaş seçilmeden önce reklam başlatılmaz —
 * bilinmeyen yaşa çocuk muamelesi uygulanırdı ama rıza/ATT sormamak için
 * seçimi bekliyoruz.
 */

export const AGE_BANDS = [
  { id: 'under13', childDirected: true, teen: false },
  { id: 'teen', childDirected: false, teen: true },
  { id: 'adult', childDirected: false, teen: false },
];

export function ageBandInfo(id) {
  return AGE_BANDS.find((b) => b.id === id) || null;
}

/** Reklam ve gizlilik için çocuk muamelesi gerekir mi? */
export function isChildAudience(ageBand) {
  return ageBand === 'under13' || !ageBand;
}

/** Ergen (13–17) bandı mı? */
export function isTeenAudience(ageBand) {
  return ageBand === 'teen';
}
