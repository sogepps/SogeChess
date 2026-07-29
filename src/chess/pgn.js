import { Chess } from 'chess.js';
import { newGame, START_FEN } from './core';

const SEVEN_TAGS = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];

function pad(n) {
  return String(n).padStart(2, '0');
}

export function pgnDate(d = new Date()) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/**
 * Çok partili bir PGN metnini tek tek parti bloklarına ayırır.
 * Yeni parti, hamle metni görüldükten sonra gelen ilk [Event ...] etiketidir.
 */
export function splitPgnGames(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  const games = [];
  let current = [];
  let sawMovetext = false;

  for (const line of lines) {
    const isTag = /^\s*\[\s*\w+\s+"/.test(line);
    if (isTag && sawMovetext) {
      if (current.join('').trim()) games.push(current.join('\n'));
      current = [];
      sawMovetext = false;
    }
    if (!isTag && line.trim()) sawMovetext = true;
    current.push(line);
  }
  if (current.join('').trim()) games.push(current.join('\n'));
  return games.filter((g) => g.trim().length > 0);
}

/**
 * Tek bir PGN bloğunu uygulama içi parti kaydına çevirir.
 * @returns {{ok:boolean, game?:object, error?:string}}
 */
export function parseSinglePgn(pgnText) {
  const chess = new Chess();
  try {
    chess.loadPgn(pgnText, { strict: false });
  } catch (err) {
    return { ok: false, error: err?.message || null, errorKey: 'error.pgnUnreadable' };
  }

  const headers = chess.getHeaders() || {};
  const history = chess.history({ verbose: true });
  // FEN etiketi varsa parti başlangıç konumu standart değildir.
  const startFen = headers.FEN || START_FEN;

  return {
    ok: true,
    game: {
      headers: { ...headers },
      startFen,
      moves: history.map((m) => ({
        san: m.san,
        from: m.from,
        to: m.to,
        piece: m.piece,
        color: m.color,
        captured: m.captured || null,
        promotion: m.promotion || null,
        flags: m.flags,
        fenAfter: m.after,
      })),
      finalFen: chess.fen(),
      source: 'import',
    },
  };
}

export function parsePgnFile(text) {
  const blocks = splitPgnGames(text);
  const games = [];
  const errors = [];
  blocks.forEach((block, i) => {
    const res = parseSinglePgn(block);
    if (res.ok) games.push(res.game);
    else errors.push({ index: i, error: res.error });
  });
  return { games, errors, total: blocks.length };
}

/**
 * Uygulama içi parti kaydını PGN metnine çevirir.
 * Hamle başına süre varsa {[%clk h:mm:ss]} yorumu olarak eklenir.
 */
export function serializeGameToPgn(game, { includeClock = true } = {}) {
  const chess = newGame(game.startFen || START_FEN);
  const headers = { ...(game.headers || {}) };

  for (const tag of SEVEN_TAGS) {
    if (!headers[tag]) {
      headers[tag] =
        tag === 'Result' ? '*' : tag === 'Date' ? pgnDate(new Date(game.createdAt || Date.now())) : '?';
    }
  }
  if (game.startFen && game.startFen !== START_FEN) {
    headers.FEN = game.startFen;
    headers.SetUp = '1';
  }

  for (const [k, v] of Object.entries(headers)) {
    if (v != null && v !== '') chess.setHeader(k, String(v));
  }

  const moves = game.moves || [];
  for (let i = 0; i < moves.length; i++) {
    try {
      chess.move(moves[i].san);
    } catch {
      break; // Bozuk hamleden sonrasını yazmayı bırak, elimizdekini kaydet.
    }
    const clk = moves[i].clock;
    if (includeClock && typeof clk === 'number') {
      chess.setComment(`[%clk ${formatClockTag(clk)}]`);
    }
  }

  let out = chess.pgn({ maxWidth: 80, newline: '\n' });
  if (game.notes) out += `\n\n{ ${String(game.notes).replace(/[{}]/g, '')} }\n`;
  return out;
}

export function serializeManyToPgn(games) {
  return games.map((g) => serializeGameToPgn(g)).join('\n\n');
}

function formatClockTag(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${pad(m)}:${pad(s)}`;
}

/**
 * Parti kaydından okunabilir bir başlık üretir: "Ali – Veli, 1-0".
 */
export function gameTitle(meta, fallback = '') {
  const w = meta.white || meta.headers?.White;
  const b = meta.black || meta.headers?.Black;
  if (w || b) {
    return `${w || '?'} – ${b || '?'}`;
  }
  return meta.event || meta.headers?.Event || fallback;
}

export const RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];

export function resultLabelKey(result) {
  switch (result) {
    case '1-0':
      return 'result.whiteWins';
    case '0-1':
      return 'result.blackWins';
    case '1/2-1/2':
      return 'result.drawn';
    default:
      return 'result.ongoing';
  }
}
