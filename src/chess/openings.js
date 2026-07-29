// Yerleşik açılış kitaplığı. Ağ bağlantısı gerektirmez.
// `san` alanı boşlukla ayrılmış hamle dizisidir; eşleştirme en uzun önek
// kuralıyla yapılır, böylece "Ruy Lopez, Berlin" varyantı ana hattı ezer.

export const OPENINGS = [
  // --- Açık oyunlar: 1.e4 e5 ---
  { eco: 'C20', base: 'kingsPawn', san: 'e4 e5' },
  { eco: 'C40', base: 'kingsKnight', san: 'e4 e5 Nf3' },
  { eco: 'C41', base: 'philidor', san: 'e4 e5 Nf3 d6' },
  { eco: 'C42', base: 'petrov', san: 'e4 e5 Nf3 Nf6' },
  { eco: 'C43', base: 'petrov', proper: 'Steinitz', mod: 'attack', san: 'e4 e5 Nf3 Nf6 d4' },
  { eco: 'C44', base: 'scotch', san: 'e4 e5 Nf3 Nc6 d4' },
  { eco: 'C45', base: 'scotch', mod: 'mainLine', san: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4' },
  { eco: 'C46', base: 'threeKnights', san: 'e4 e5 Nf3 Nc6 Nc3' },
  { eco: 'C47', base: 'fourKnights', san: 'e4 e5 Nf3 Nc6 Nc3 Nf6' },
  { eco: 'C48', base: 'fourKnights', mod: 'spanish', san: 'e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5' },
  { eco: 'C50', base: 'italian', san: 'e4 e5 Nf3 Nc6 Bc4' },
  { eco: 'C50', base: 'giuocoPiano', san: 'e4 e5 Nf3 Nc6 Bc4 Bc5' },
  { eco: 'C53', base: 'italian', mod: 'classical', san: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3' },
  { eco: 'C51', base: 'evansGambit', san: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4' },
  { eco: 'C55', base: 'twoKnights', san: 'e4 e5 Nf3 Nc6 Bc4 Nf6' },
  { eco: 'C57', base: 'friedLiver', san: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7' },
  { eco: 'C60', base: 'ruyLopez', san: 'e4 e5 Nf3 Nc6 Bb5' },
  { eco: 'C65', base: 'ruyLopez', proper: 'Berlin', mod: 'defense', san: 'e4 e5 Nf3 Nc6 Bb5 Nf6' },
  { eco: 'C68', base: 'ruyLopez', mod: 'exchange', san: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6' },
  { eco: 'C70', base: 'ruyLopez', proper: 'Morphy', mod: 'defense', san: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4' },
  { eco: 'C78', base: 'ruyLopez', proper: 'Archangel', san: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O b5 Bb3 Bb7' },
  { eco: 'C84', base: 'ruyLopez', mod: 'closed', san: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7' },
  { eco: 'C89', base: 'ruyLopez', proper: 'Marshall', mod: 'attack', san: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5' },
  { eco: 'C30', base: 'kingsGambit', san: 'e4 e5 f4' },
  { eco: 'C33', base: 'kingsGambit', mod: 'accepted', san: 'e4 e5 f4 exf4' },
  { eco: 'C30', base: 'kingsGambit', mod: 'declined', san: 'e4 e5 f4 Bc5' },
  { eco: 'C21', base: 'centerGame', san: 'e4 e5 d4' },
  { eco: 'C21', base: 'danishGambit', san: 'e4 e5 d4 exd4 c3' },
  { eco: 'C23', base: 'bishopsOpening', san: 'e4 e5 Bc4' },
  { eco: 'C25', base: 'vienna', san: 'e4 e5 Nc3' },
  { eco: 'C27', base: 'vienna', proper: 'Frankenstein-Dracula', san: 'e4 e5 Nc3 Nf6 Bc4 Nxe4' },

  // --- Yarı açık oyunlar ---
  { eco: 'B00', base: 'nimzowitschDef', san: 'e4 Nc6' },
  { eco: 'B00', base: 'owenDef', san: 'e4 b6' },
  { eco: 'B01', base: 'scandinavian', san: 'e4 d5' },
  { eco: 'B01', base: 'scandinavian', mod: 'mainLine', san: 'e4 d5 exd5 Qxd5 Nc3 Qa5' },
  { eco: 'B02', base: 'alekhine', san: 'e4 Nf6' },
  { eco: 'B04', base: 'alekhine', mod: 'modern', san: 'e4 Nf6 e5 Nd5 d4 d6 Nf3' },
  { eco: 'B06', base: 'modernDef', san: 'e4 g6' },
  { eco: 'B07', base: 'pirc', san: 'e4 d6 d4 Nf6 Nc3 g6' },
  { eco: 'B10', base: 'caroKann', san: 'e4 c6' },
  { eco: 'B12', base: 'caroKann', mod: 'advance', san: 'e4 c6 d4 d5 e5' },
  { eco: 'B13', base: 'caroKann', mod: 'exchange', san: 'e4 c6 d4 d5 exd5 cxd5' },
  { eco: 'B15', base: 'caroKann', mod: 'classical', san: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5' },
  { eco: 'B20', base: 'sicilian', san: 'e4 c5' },
  { eco: 'B21', base: 'sicilian', proper: 'Smith-Morra', mod: 'gambit', san: 'e4 c5 d4 cxd4 c3' },
  { eco: 'B22', base: 'sicilian', proper: 'Alapin', san: 'e4 c5 c3' },
  { eco: 'B23', base: 'sicilian', mod: 'closed', san: 'e4 c5 Nc3' },
  { eco: 'B27', base: 'sicilian', mod: 'hyperaccelDragon', san: 'e4 c5 Nf3 g6' },
  { eco: 'B30', base: 'sicilian', mod: 'oldSicilian', san: 'e4 c5 Nf3 Nc6' },
  { eco: 'B31', base: 'sicilian', proper: 'Rossolimo', san: 'e4 c5 Nf3 Nc6 Bb5' },
  { eco: 'B33', base: 'sicilian', proper: 'Sveshnikov', san: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5' },
  { eco: 'B40', base: 'sicilian', mod: 'frenchVariation', san: 'e4 c5 Nf3 e6' },
  { eco: 'B44', base: 'sicilian', proper: 'Taimanov', san: 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6' },
  { eco: 'B50', base: 'sicilian', proper: '2...d6', san: 'e4 c5 Nf3 d6' },
  { eco: 'B54', base: 'sicilian', mod: 'open', san: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4' },
  { eco: 'B70', base: 'sicilian', mod: 'dragon', san: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6' },
  { eco: 'B76', base: 'sicilian', mod: 'dragonYugoslav', san: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3' },
  { eco: 'B80', base: 'sicilian', proper: 'Scheveningen', san: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6' },
  { eco: 'B90', base: 'sicilian', proper: 'Najdorf', san: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6' },
  { eco: 'B96', base: 'sicilian', proper: 'Najdorf', mod: 'poisonedPawn', san: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Qb6' },
  { eco: 'C00', base: 'french', san: 'e4 e6' },
  { eco: 'C02', base: 'french', mod: 'advance', san: 'e4 e6 d4 d5 e5' },
  { eco: 'C03', base: 'french', proper: 'Tarrasch', san: 'e4 e6 d4 d5 Nd2' },
  { eco: 'C11', base: 'french', mod: 'classical', san: 'e4 e6 d4 d5 Nc3 Nf6' },
  { eco: 'C15', base: 'french', proper: 'Winawer', san: 'e4 e6 d4 d5 Nc3 Bb4' },

  // --- Kapalı oyunlar: 1.d4 d5 ---
  { eco: 'D00', base: 'queensPawn', san: 'd4 d5' },
  { eco: 'D00', base: 'blackmarDiemer', san: 'd4 d5 e4' },
  { eco: 'D01', base: 'richterVeresov', san: 'd4 d5 Nc3 Nf6 Bg5' },
  { eco: 'D02', base: 'london', san: 'd4 d5 Nf3 Nf6 Bf4' },
  { eco: 'D03', base: 'torre', san: 'd4 Nf6 Nf3 e6 Bg5' },
  { eco: 'D04', base: 'colle', san: 'd4 d5 Nf3 Nf6 e3' },
  { eco: 'D06', base: 'queensGambit', san: 'd4 d5 c4' },
  { eco: 'D07', base: 'queensGambit', proper: 'Chigorin', san: 'd4 d5 c4 Nc6' },
  { eco: 'D08', base: 'albin', san: 'd4 d5 c4 e5' },
  { eco: 'D10', base: 'slav', san: 'd4 d5 c4 c6' },
  { eco: 'D15', base: 'slav', mod: 'mainLine', san: 'd4 d5 c4 c6 Nf3 Nf6 Nc3' },
  { eco: 'D20', base: 'qga', san: 'd4 d5 c4 dxc4' },
  { eco: 'D30', base: 'qgd', san: 'd4 d5 c4 e6' },
  { eco: 'D32', base: 'tarraschDef', san: 'd4 d5 c4 e6 Nc3 c5' },
  { eco: 'D35', base: 'qgd', mod: 'exchange', san: 'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5' },
  { eco: 'D37', base: 'qgd', mod: 'classical', san: 'd4 d5 c4 e6 Nc3 Nf6 Nf3 Be7' },
  { eco: 'D43', base: 'semiSlav', san: 'd4 d5 c4 e6 Nc3 Nf6 Nf3 c6' },
  { eco: 'D80', base: 'grunfeld', san: 'd4 Nf6 c4 g6 Nc3 d5' },
  { eco: 'D85', base: 'grunfeld', mod: 'exchange', san: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5' },

  // --- Hint savunmaları ---
  { eco: 'A45', base: 'trompowsky', san: 'd4 Nf6 Bg5' },
  { eco: 'A46', base: 'queensPawn', proper: '2.Nf3', san: 'd4 Nf6 Nf3' },
  { eco: 'E00', base: 'catalan', san: 'd4 Nf6 c4 e6 g3' },
  { eco: 'E10', base: 'indianGame', san: 'd4 Nf6 c4 e6' },
  { eco: 'E12', base: 'queensIndian', san: 'd4 Nf6 c4 e6 Nf3 b6' },
  { eco: 'E20', base: 'nimzoIndian', san: 'd4 Nf6 c4 e6 Nc3 Bb4' },
  { eco: 'E32', base: 'nimzoIndian', mod: 'classical', san: 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2' },
  { eco: 'E60', base: 'kingsIndian', san: 'd4 Nf6 c4 g6' },
  { eco: 'E70', base: 'kingsIndian', mod: 'mainLine', san: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6' },
  { eco: 'E97', base: 'kingsIndian', mod: 'classical', san: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6' },
  { eco: 'A40', base: 'modernDef', san: 'd4 g6' },
  { eco: 'A43', base: 'benoni', san: 'd4 c5' },
  { eco: 'A57', base: 'benko', san: 'd4 Nf6 c4 c5 d5 b5' },
  { eco: 'A60', base: 'benoni', mod: 'modern', san: 'd4 Nf6 c4 c5 d5 e6' },
  { eco: 'A80', base: 'dutch', san: 'd4 f5' },
  { eco: 'A85', base: 'dutch', proper: 'Leningrad', san: 'd4 f5 c4 Nf6 Nc3 g6' },
  { eco: 'A87', base: 'dutch', mod: 'stonewall', san: 'd4 f5 g3 Nf6 Bg2 e6 Nf3 d5' },

  // --- Kanat açılışları ---
  { eco: 'A00', base: 'anderssen', san: 'a3' },
  { eco: 'A00', base: 'sokolsky', san: 'b4' },
  { eco: 'A00', base: 'grob', san: 'g4' },
  { eco: 'A01', base: 'nimzoLarsen', san: 'b3' },
  { eco: 'A02', base: 'bird', san: 'f4' },
  { eco: 'A03', base: 'bird', mod: 'stonewall', san: 'f4 d5 e3' },
  { eco: 'A04', base: 'reti', san: 'Nf3' },
  { eco: 'A07', base: 'kingsIndianAttack', san: 'Nf3 d5 g3' },
  { eco: 'A10', base: 'english', san: 'c4' },
  { eco: 'A15', base: 'english', mod: 'angloIndian', san: 'c4 Nf6' },
  { eco: 'A20', base: 'english', mod: 'kingsEnglish', san: 'c4 e5' },
  { eco: 'A25', base: 'english', mod: 'reversedSicilian', san: 'c4 e5 Nc3 Nc6' },
  { eco: 'A30', base: 'english', mod: 'symmetrical', san: 'c4 c5' },
  { eco: 'A80', base: 'polishDef', san: 'd4 b5' },
];

/**
 * Açılışın görünen adı.
 *
 * Adlar 115 ayrı çeviri yerine parçadan kurulur: aile (`base`) ve tanımlayıcı
 * (`mod`) çevrilir, özel isim (`proper` — Najdorf, Marshall, Berlin…) her dilde
 * aynı kaldığı için olduğu gibi yazılır. Böylece "Sicilya Savunması, Najdorf"
 * ile "Sicilian Defence, Najdorf" tek veri satırından üretilir.
 */
export function openingName(opening, t) {
  if (!opening) return '';
  const family = t(`opening.base.${opening.base}`);
  const tail = [opening.proper, opening.mod ? t(`opening.mod.${opening.mod}`) : null]
    .filter(Boolean)
    .join(' ');
  return tail ? `${family}, ${tail}` : family;
}

// Ön ek eşleştirmesi için önceden bölünmüş hamle dizileri.
const INDEXED = OPENINGS.map((o) => ({ ...o, plies: o.san.split(' ') }))
  // Uzun varyantlar önce denensin ki en spesifik isim kazansın.
  .sort((a, b) => b.plies.length - a.plies.length);

/**
 * Oynanan SAN dizisine göre en spesifik açılışı bulur.
 * @param {string[]} sanMoves
 */
export function detectOpening(sanMoves) {
  if (!Array.isArray(sanMoves) || sanMoves.length === 0) return null;
  for (const opening of INDEXED) {
    if (opening.plies.length > sanMoves.length) continue;
    let match = true;
    for (let i = 0; i < opening.plies.length; i++) {
      if (opening.plies[i] !== sanMoves[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      const { plies, ...rest } = opening;
      return rest;
    }
  }
  return null;
}

/**
 * Mevcut konumdan devam eden kitap hamlelerini listeler (açılış gezgini).
 */
export function bookContinuations(sanMoves) {
  const played = sanMoves || [];
  const seen = new Map();
  for (const opening of OPENINGS) {
    const plies = opening.san.split(' ');
    if (plies.length <= played.length) continue;
    let matchesPrefix = true;
    for (let i = 0; i < played.length; i++) {
      if (plies[i] !== played[i]) {
        matchesPrefix = false;
        break;
      }
    }
    if (!matchesPrefix) continue;
    const next = plies[played.length];
    if (!seen.has(next)) {
      seen.set(next, { san: next, examples: [], count: 0 });
    }
    const entry = seen.get(next);
    entry.count += 1;
    if (entry.examples.length < 3) entry.examples.push(opening);
  }
  return [...seen.values()].sort((a, b) => b.count - a.count);
}

/**
 * Açılış arama. Kullanıcının gördüğü ada göre arar; ECO kodu, hamle dizisi ve
 * özel isimler her dilde aynı olduğundan onlar da eşleşir.
 */
export function searchOpenings(query, t) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return OPENINGS;
  return OPENINGS.filter(
    (o) =>
      openingName(o, t).toLowerCase().includes(q) ||
      o.eco.toLowerCase().includes(q) ||
      o.san.toLowerCase().includes(q)
  );
}
