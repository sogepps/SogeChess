import { Game as EngineGame } from 'js-chess-engine';
import { newGame, PIECE_VALUES } from './core';

// js-chess-engine senkron çalışır ve JS thread'ini bloklar. Doğrudan çağırırsak
// "Düşünüyor…" göstergesi hiç boyanmadan ekran donar. Bu yüzden her arama bir
// sonraki frame'e ertelenir; React önce durumu çizer, hesap ondan sonra başlar.
function deferred(fn, delay = 30) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    }, delay);
  });
}

export const DIFFICULTY = [
  { id: 0, labelKey: 'level.0', engineLevel: 0, elo: '~600', premium: false },
  { id: 1, labelKey: 'level.1', engineLevel: 1, elo: '~900', premium: false },
  { id: 2, labelKey: 'level.2', engineLevel: 2, elo: '~1200', premium: false },
  { id: 3, labelKey: 'level.3', engineLevel: 3, elo: '~1500', premium: false },
  { id: 4, labelKey: 'level.4', engineLevel: 4, elo: '~1800', premium: true },
];

// Seviye 0 motoru kullanmaz: acemi hissi vermek için çoğunlukla rastgele,
// ara sıra bariz alışı gören bir seçim yapar.
function beginnerMove(fen) {
  const game = newGame(fen);
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  const captures = moves.filter((m) => m.captured);
  const mates = moves.filter((m) => m.san.includes('#'));
  if (mates.length) return mates[0];
  if (captures.length && Math.random() < 0.55) {
    captures.sort((a, b) => PIECE_VALUES[b.captured] - PIECE_VALUES[a.captured]);
    return captures[0];
  }
  return moves[Math.floor(Math.random() * moves.length)];
}

/**
 * Verilen konumda motorun hamlesini bulur.
 * @returns chess.js move nesnesi (san, from, to, promotion...) veya null
 */
export async function findBestMove(fen, difficultyId = 2) {
  const level = DIFFICULTY.find((d) => d.id === difficultyId)?.engineLevel ?? 2;

  if (level === 0) return deferred(() => beginnerMove(fen), 250);

  return deferred(() => {
    const engine = new EngineGame(fen);
    const raw = engine.aiMove(level); // { "E2": "E4" } biçiminde döner
    const [from, to] = Object.entries(raw)[0] || [];
    if (!from || !to) return beginnerMove(fen);

    // Motor terfi taşını bildirmez; her zaman vezire terfi ettiriyoruz.
    const game = newGame(fen);
    const candidates = game.moves({ verbose: true });
    const match =
      candidates.find(
        (m) => m.from === from.toLowerCase() && m.to === to.toLowerCase() && m.promotion === 'q'
      ) || candidates.find((m) => m.from === from.toLowerCase() && m.to === to.toLowerCase());
    return match || beginnerMove(fen);
  }, 30);
}

// --- Değerlendirme -------------------------------------------------------------

// Basit taş-kare tabloları. Amaç güçlü analiz değil, değerlendirme çubuğunun
// makul ve anlık tepki vermesi; derin arama yapmadan konumun havasını verir.
const PST = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};

const CENTIPAWN = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

/**
 * Konumu beyazın gözünden santipiyon cinsinden puanlar.
 * Mat varsa ±100000 döner.
 */
export function evaluatePosition(fen) {
  const game = newGame(fen);
  if (game.isCheckmate()) return game.turn() === 'w' ? -100000 : 100000;
  if (game.isDraw() || game.isStalemate()) return 0;

  let score = 0;
  const board = game.board();
  let bishops = { w: 0, b: 0 };

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      if (!cell) continue;
      if (cell.type === 'b') bishops[cell.color] += 1;
      // PST tabloları beyaz bakışıyla yazılı; siyah için satırı aynalıyoruz.
      const idx = cell.color === 'w' ? row * 8 + col : (7 - row) * 8 + col;
      const value = CENTIPAWN[cell.type] + (PST[cell.type]?.[idx] ?? 0);
      score += cell.color === 'w' ? value : -value;
    }
  }
  if (bishops.w >= 2) score += 30;
  if (bishops.b >= 2) score -= 30;
  return score;
}

// Değerlendirme çubuğu için 0..1 aralığına sıkıştırılmış beyaz avantajı.
export function evalToBarRatio(centipawns) {
  if (centipawns >= 99000) return 1;
  if (centipawns <= -99000) return 0;
  const pawns = centipawns / 100;
  return 1 / (1 + Math.pow(10, -pawns / 4));
}

export function formatEval(centipawns) {
  if (centipawns >= 99000) return '#';
  if (centipawns <= -99000) return '-#';
  const pawns = centipawns / 100;
  return (pawns >= 0 ? '+' : '') + pawns.toFixed(1);
}

/**
 * İpucu için, oyuncunun tarafından iyi bir hamle önerir.
 */
export async function suggestMove(fen, strength = 3) {
  return findBestMove(fen, strength);
}
