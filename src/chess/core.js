import { Chess, validateFen, SQUARES } from 'chess.js';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
export const ALL_SQUARES = SQUARES;

export function newGame(fen) {
  try {
    return new Chess(fen || START_FEN);
  } catch {
    return new Chess(START_FEN);
  }
}

export function isFenValid(fen) {
  // Hata metni chess.js'ten İngilizce gelir; boş girdiyi kendimiz yakalayıp
  // çevrilebilir bir anahtar döndürüyoruz.
  if (typeof fen !== 'string' || !fen.trim()) return { ok: false, errorKey: 'error.emptyFen' };
  const res = validateFen(fen.trim());
  return { ok: !!res.ok, error: res.ok ? null : res.error };
}

// Tahtayı [{square, type, color}] dizisine indirger. null kareler atlanır.
export function piecesFromFen(fen) {
  const game = newGame(fen);
  const out = [];
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell) out.push({ square: cell.square, type: cell.type, color: cell.color });
    }
  }
  return out;
}

export function squareToCoords(square, flipped = false) {
  const file = FILES.indexOf(square[0]);
  const rank = 8 - parseInt(square[1], 10);
  return flipped ? { col: 7 - file, row: 7 - rank } : { col: file, row: rank };
}

export function coordsToSquare(col, row, flipped = false) {
  const c = flipped ? 7 - col : col;
  const r = flipped ? 7 - row : row;
  if (c < 0 || c > 7 || r < 0 || r > 7) return null;
  return FILES[c] + RANKS[r];
}

export function isLightSquare(square) {
  const file = FILES.indexOf(square[0]);
  const rank = parseInt(square[1], 10);
  return (file + rank) % 2 === 0;
}

// Seçili kareden oynanabilecek hamleler; tahtada nokta göstermek için.
export function legalTargets(game, from) {
  try {
    return game.moves({ square: from, verbose: true });
  } catch {
    return [];
  }
}

export function kingSquare(game, color) {
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === color) return cell.square;
    }
  }
  return null;
}

// Bir hamlenin terfi gerektirip gerektirmediği; terfi diyaloğunu buna göre açarız.
export function needsPromotion(game, from, to) {
  const moves = legalTargets(game, from);
  return moves.some((m) => m.to === to && m.flags.includes('p'));
}

export const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// Materyal farkı ve yenen taşlar. Tahta kenarındaki "esir" göstergesi için.
export function materialBalance(fen) {
  const startCount = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
  const live = { w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 } };
  for (const p of piecesFromFen(fen)) live[p.color][p.type] += 1;

  const capturedByWhite = [];
  const capturedByBlack = [];
  let score = 0;
  for (const type of ['q', 'r', 'b', 'n', 'p']) {
    const missingBlack = Math.max(0, startCount[type] - live.b[type]);
    const missingWhite = Math.max(0, startCount[type] - live.w[type]);
    for (let i = 0; i < missingBlack; i++) capturedByWhite.push(type);
    for (let i = 0; i < missingWhite; i++) capturedByBlack.push(type);
    score += (live.w[type] - live.b[type]) * PIECE_VALUES[type];
  }
  return { score, capturedByWhite, capturedByBlack };
}

export function gameStatus(game) {
  if (game.isCheckmate()) {
    return {
      over: true,
      result: game.turn() === 'w' ? '0-1' : '1-0',
      reasonKey: 'reason.checkmate',
    };
  }
  if (game.isStalemate()) return { over: true, result: '1/2-1/2', reasonKey: 'reason.stalemate' };
  if (game.isThreefoldRepetition())
    return { over: true, result: '1/2-1/2', reasonKey: 'reason.repetition' };
  if (game.isInsufficientMaterial())
    return { over: true, result: '1/2-1/2', reasonKey: 'reason.insufficient' };
  if (game.isDrawByFiftyMoves())
    return { over: true, result: '1/2-1/2', reasonKey: 'reason.fiftyMove' };
  return { over: false, result: '*', reasonKey: null, check: game.isCheck() };
}

// Hamle listesini { no, white, black } satırlarına böler; hamle tablosu için.
export function toMovePairs(moves) {
  const rows = [];
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const isWhite = m.color === 'w';
    if (isWhite || rows.length === 0) {
      rows.push({
        no: rows.length + 1,
        white: isWhite ? { ...m, ply: i } : null,
        black: isWhite ? null : { ...m, ply: i },
      });
    } else {
      rows[rows.length - 1].black = { ...m, ply: i };
    }
  }
  return rows;
}

// Bir hamle dizisini baştan oynayarak istenen ply'daki FEN'i verir.
export function fenAtPly(startFen, moves, ply) {
  const game = newGame(startFen);
  for (let i = 0; i < Math.min(ply, moves.length); i++) {
    try {
      game.move(moves[i].san);
    } catch {
      break;
    }
  }
  return game.fen();
}

// FEN'in sadece taş yerleşimi kısmı; tekrar/karşılaştırma kontrollerinde kullanılır.
export function fenPlacement(fen) {
  return String(fen || '').split(' ')[0];
}

export function sideToMoveFromFen(fen) {
  const parts = String(fen || '').split(' ');
  return parts[1] === 'b' ? 'b' : 'w';
}
