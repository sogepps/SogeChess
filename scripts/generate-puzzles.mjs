// Bulmaca üreteci.
//
// Elle FEN yazmak hataya çok açık olduğu için bulmacalar üretilir: rastgele
// partiler oynanır, her konumda "tek çözümlü mat" aranır ve yalnızca kanıtlanmış
// olanlar kaydedilir. Çıktı src/chess/puzzles.js dosyasına yazılır.
//
// Kullanım: node scripts/generate-puzzles.mjs

import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';

const TARGET_M1 = 14;
const TARGET_M2 = 12;
const MAX_GAMES = 6000;

function matesInOne(chess) {
  return chess
    .moves({ verbose: true })
    .filter((m) => m.san.includes('#'))
    .map((m) => m.san);
}

/** Konumda tek bir mat-2 hattı varsa onu döndürür. */
function uniqueMateInTwo(fen) {
  const root = new Chess(fen);
  if (root.isGameOver()) return null;
  if (matesInOne(root).length) return null; // mat-1 varsa bu bir mat-2 bulmacası değil

  const solutions = [];
  for (const first of root.moves({ verbose: true })) {
    const afterFirst = new Chess(fen);
    afterFirst.move(first.san);
    if (afterFirst.isCheckmate()) continue;
    if (afterFirst.isStalemate() || afterFirst.isDraw()) continue;

    const replies = afterFirst.moves({ verbose: true });
    if (!replies.length) continue;

    let forced = true;
    let mainLine = null;
    for (const reply of replies) {
      const afterReply = new Chess(afterFirst.fen());
      afterReply.move(reply.san);
      const mates = matesInOne(afterReply);
      if (!mates.length) {
        forced = false;
        break;
      }
      if (!mainLine) mainLine = [first.san, reply.san, mates[0]];
    }
    if (forced && mainLine) {
      solutions.push(mainLine);
      if (solutions.length > 1) return null; // birden fazla çözüm: belirsiz bulmaca
    }
  }
  return solutions.length === 1 ? solutions[0] : null;
}

const mateInOne = [];
const mateInTwo = [];
const seenFens = new Set();

function pieceCount(chess) {
  return chess
    .board()
    .flat()
    .filter(Boolean).length;
}

for (let g = 0; g < MAX_GAMES; g++) {
  if (mateInOne.length >= TARGET_M1 && mateInTwo.length >= TARGET_M2) break;

  const chess = new Chess();
  for (let ply = 0; ply < 160; ply++) {
    const moves = chess.moves({ verbose: true });
    if (!moves.length || chess.isGameOver()) break;

    const fen = chess.fen();
    const key = fen.split(' ').slice(0, 4).join(' ');

    if (!seenFens.has(key) && pieceCount(chess) >= 5) {
      const m1 = matesInOne(chess);
      if (m1.length === 1 && mateInOne.length < TARGET_M1) {
        seenFens.add(key);
        mateInOne.push({ fen, line: [m1[0]], pieces: pieceCount(chess) });
      } else if (m1.length === 0 && mateInTwo.length < TARGET_M2) {
        // Mat-2 araması pahalı; yalnızca şah çekilebilen konumlarda dene.
        const hasCheck = moves.some((m) => m.san.includes('+'));
        if (hasCheck) {
          const line = uniqueMateInTwo(fen);
          if (line) {
            seenFens.add(key);
            mateInTwo.push({ fen, line, pieces: pieceCount(chess) });
          }
        }
      }
    }

    // Mat fırsatlarını artırmak için şah çeken ve alan hamleleri biraz kayır.
    const scored = moves.map((m) => ({
      m,
      w: (m.san.includes('+') ? 3 : 0) + (m.captured ? 2 : 0) + Math.random() * 4,
    }));
    scored.sort((a, b) => b.w - a.w);
    chess.move(scored[Math.floor(Math.random() * Math.min(3, scored.length))].m.san);
  }
}

function themeFor(entry, index) {
  const chess = new Chess(entry.fen);
  const last = entry.line[entry.line.length - 1];
  const piece = last[0];
  // Tema adı çeviriden gelir; burada yalnızca anahtarı saklıyoruz.
  const byPiece = { Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', K: 'king' };
  const theme = byPiece[piece] || 'pawn';
  const side = chess.turn() === 'w' ? 'w' : 'b';
  return { theme, side };
}

const all = [
  ...mateInOne.map((e, i) => ({ ...e, id: `m1-${i + 1}`, mateIn: 1, ...themeFor(e, i) })),
  ...mateInTwo.map((e, i) => ({ ...e, id: `m2-${i + 1}`, mateIn: 2, ...themeFor(e, i) })),
];

// Kolaydan zora: mat-1'ler önce, kendi içlerinde az taşlı olan önce.
all.sort((a, b) => a.mateIn - b.mateIn || a.pieces - b.pieces);

const rated = all.map((p, i) => ({
  id: p.id,
  fen: p.fen,
  line: p.line,
  mateIn: p.mateIn,
  side: p.side,
  theme: p.theme,
  rating: p.mateIn === 1 ? 700 + i * 25 : 1200 + i * 30,
}));

const body = `// OTOMATİK ÜRETİLDİ — elle düzenlemeyin.
// Kaynak: scripts/generate-puzzles.mjs
// Her bulmaca üretim sırasında chess.js ile doğrulanmıştır: \`line\` hattının
// son hamlesi mat eder ve mat-1 bulmacalarında çözüm tektir.

export const PUZZLES = ${JSON.stringify(rated, null, 2)};

export function activePuzzles() {
  return PUZZLES;
}

export function puzzleById(id) {
  return PUZZLES.find((p) => p.id === id) || null;
}
`;

writeFileSync(new URL('../src/chess/puzzles.js', import.meta.url), body);
console.log(`Üretildi: ${mateInOne.length} mat-1, ${mateInTwo.length} mat-2 (toplam ${rated.length})`);
