import { useCallback, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { START_FEN, gameStatus, kingSquare, legalTargets, materialBalance, needsPromotion } from '../chess/core';
import { detectOpening } from '../chess/openings';

/**
 * Tek bir partinin durumunu yönetir.
 *
 * Hamleler doğrusal tutulur (varyant yok): geçmişte bir ply'a gidip hamle
 * yaparsan o noktadan sonrası silinir; satranç uygulamalarında beklenen davranış
 * budur ve veri modelini basit tutar.
 *
 * `cursor` görüntülenen ply'dır, `moves.length` ise partinin sonu. İkisi farklıysa
 * kullanıcı geçmişi geziyor demektir ve tahta salt okunur olmalıdır.
 */
export function useChessGame({ initialFen = START_FEN, initialMoves = null } = {}) {
  const startFenRef = useRef(initialFen);
  const chessRef = useRef(null);

  if (chessRef.current === null) {
    chessRef.current = new Chess(initialFen);
    if (initialMoves) {
      for (const m of initialMoves) {
        try {
          chessRef.current.move(m.san);
        } catch {
          break;
        }
      }
    }
  }

  const [moves, setMoves] = useState(() =>
    chessRef.current.history({ verbose: true }).map(serializeMove)
  );
  const [cursor, setCursor] = useState(() => chessRef.current.history().length);
  const [version, setVersion] = useState(0);

  // Görüntülenen konumu cursor'a göre yeniden oynatarak üretiriz. 500 hamlelik
  // partide bile bu birkaç milisaniye sürer ve tek doğruluk kaynağı korunur.
  const view = useMemo(() => {
    const chess = new Chess(startFenRef.current);
    for (let i = 0; i < cursor && i < moves.length; i++) {
      try {
        chess.move(moves[i].san);
      } catch {
        break;
      }
    }
    const status = gameStatus(chess);
    const turn = chess.turn();
    return {
      fen: chess.fen(),
      turn,
      status,
      check: chess.isCheck(),
      checkSquare: chess.isCheck() ? kingSquare(chess, turn) : null,
      legalMoves: chess.moves({ verbose: true }),
      material: materialBalance(chess.fen()),
      moveNumber: chess.moveNumber(),
      chess,
    };
  }, [cursor, moves, version]);

  const atLive = cursor === moves.length;
  const lastMove = cursor > 0 ? moves[cursor - 1] : null;

  const targetsFrom = useCallback(
    (square) => legalTargets(view.chess, square).map((m) => m.to),
    [view]
  );

  const requiresPromotion = useCallback(
    (from, to) => needsPromotion(view.chess, from, to),
    [view]
  );

  /**
   * Hamleyi uygular. Geçmişteyken oynanırsa sonrası kesilir.
   * @returns uygulanan hamle nesnesi veya null
   */
  const makeMove = useCallback(
    (from, to, promotion, meta = {}) => {
      const chess = new Chess(startFenRef.current);
      for (let i = 0; i < cursor && i < moves.length; i++) {
        try {
          chess.move(moves[i].san);
        } catch {
          break;
        }
      }
      let applied;
      try {
        applied = chess.move({ from, to, promotion: promotion || undefined });
      } catch {
        return null;
      }
      const record = { ...serializeMove(applied), ...meta };
      const next = [...moves.slice(0, cursor), record];
      chessRef.current = chess;
      setMoves(next);
      setCursor(next.length);
      return record;
    },
    [cursor, moves]
  );

  const makeSanMove = useCallback(
    (san, meta = {}) => {
      const chess = new Chess(startFenRef.current);
      for (let i = 0; i < cursor && i < moves.length; i++) {
        try {
          chess.move(moves[i].san);
        } catch {
          break;
        }
      }
      let applied;
      try {
        applied = chess.move(san);
      } catch {
        return null;
      }
      const record = { ...serializeMove(applied), ...meta };
      const next = [...moves.slice(0, cursor), record];
      chessRef.current = chess;
      setMoves(next);
      setCursor(next.length);
      return record;
    },
    [cursor, moves]
  );

  const goTo = useCallback(
    (ply) => setCursor(Math.max(0, Math.min(ply, moves.length))),
    [moves.length]
  );
  const stepBack = useCallback(() => setCursor((c) => Math.max(0, c - 1)), []);
  const stepForward = useCallback(
    () => setCursor((c) => Math.min(moves.length, c + 1)),
    [moves.length]
  );
  const goStart = useCallback(() => setCursor(0), []);
  const goEnd = useCallback(() => setCursor(moves.length), [moves.length]);

  // Son hamleyi kalıcı olarak siler (geri al).
  const undo = useCallback(() => {
    setMoves((prev) => {
      const next = prev.slice(0, -1);
      setCursor(next.length);
      return next;
    });
  }, []);

  // Motora karşı oynarken iki yarım hamle birden geri alınır.
  const undoPair = useCallback(() => {
    setMoves((prev) => {
      const next = prev.slice(0, Math.max(0, prev.length - 2));
      setCursor(next.length);
      return next;
    });
  }, []);

  const reset = useCallback((fen = START_FEN) => {
    startFenRef.current = fen;
    chessRef.current = new Chess(fen);
    setMoves([]);
    setCursor(0);
    setVersion((v) => v + 1);
  }, []);

  const loadGame = useCallback((fen, moveList) => {
    startFenRef.current = fen || START_FEN;
    chessRef.current = new Chess(startFenRef.current);
    const list = (moveList || []).map((m) => ({ ...m }));
    setMoves(list);
    setCursor(list.length);
    setVersion((v) => v + 1);
  }, []);

  // Hamlenin süresini sonradan işaretlemek için (saat entegrasyonu).
  const annotateMove = useCallback((ply, patch) => {
    setMoves((prev) => prev.map((m, i) => (i === ply ? { ...m, ...patch } : m)));
  }, []);

  const opening = useMemo(() => detectOpening(moves.map((m) => m.san)), [moves]);

  return {
    startFen: startFenRef.current,
    moves,
    cursor,
    atLive,
    lastMove,
    opening,
    ...view,
    targetsFrom,
    requiresPromotion,
    makeMove,
    makeSanMove,
    goTo,
    stepBack,
    stepForward,
    goStart,
    goEnd,
    undo,
    undoPair,
    reset,
    loadGame,
    annotateMove,
  };
}

function serializeMove(m) {
  return {
    san: m.san,
    from: m.from,
    to: m.to,
    piece: m.piece,
    color: m.color,
    captured: m.captured || null,
    promotion: m.promotion || null,
    flags: m.flags,
    fenAfter: m.after,
  };
}
