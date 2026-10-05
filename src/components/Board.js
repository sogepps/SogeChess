import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Piece from './Piece';
import { MARKS } from '../theme/themes';
import { FILES, RANKS, coordsToSquare, piecesFromFen, squareToCoords } from '../chess/core';

let pieceSeq = 0;
const nextId = () => `pc${++pieceSeq}`;

/**
 * Önceki taş listesiyle yeni FEN'i eşleştirir; her taşa kalıcı bir kimlik verir.
 * Kimlik olmadan taşlar her hamlede yeniden monte olur ve kayma animasyonu
 * yapılamaz. Eşleştirme "aynı tür + aynı renk, en yakın kare" açgözlü kuralıyla
 * yapılır, böylece hamle bilgisi olmadan rastgele konum atlamaları da düzgün
 * animasyon üretir.
 */
function reconcilePieces(prev, fen) {
  const target = piecesFromFen(fen);
  const pool = [...prev];
  const pairs = [];

  target.forEach((t, ti) => {
    pool.forEach((p, pi) => {
      if (p.type !== t.type || p.color !== t.color) return;
      const a = squareToCoords(p.square);
      const b = squareToCoords(t.square);
      const dist = Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
      pairs.push({ ti, pi, dist });
    });
  });
  pairs.sort((x, y) => x.dist - y.dist);

  const takenTarget = new Set();
  const takenPrev = new Set();
  const result = new Array(target.length).fill(null);

  for (const { ti, pi } of pairs) {
    if (takenTarget.has(ti) || takenPrev.has(pi)) continue;
    takenTarget.add(ti);
    takenPrev.add(pi);
    result[ti] = { ...target[ti], id: pool[pi].id, fresh: false };
  }
  for (let i = 0; i < target.length; i++) {
    if (!result[i]) result[i] = { ...target[i], id: nextId(), fresh: true };
  }
  return result;
}

function AnimatedPiece({ piece, square: sq, flipped, pieceSet, animate, hidden }) {
  const { col, row } = squareToCoords(piece.square, flipped);
  const x = useSharedValue(col * sq);
  const y = useSharedValue(row * sq);
  const opacity = useSharedValue(piece.fresh ? 0 : 1);
  const mounted = useRef(false);

  useEffect(() => {
    const target = squareToCoords(piece.square, flipped);
    const tx = target.col * sq;
    const ty = target.row * sq;
    if (!mounted.current || !animate) {
      x.value = tx;
      y.value = ty;
      mounted.current = true;
    } else {
      x.value = withTiming(tx, { duration: 170 });
      y.value = withTiming(ty, { duration: 170 });
    }
  }, [piece.square, flipped, sq, animate, x, y]);

  useEffect(() => {
    opacity.value = hidden ? 0 : animate ? withTiming(1, { duration: 130 }) : 1;
  }, [hidden, animate, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.pieceLayer, { width: sq, height: sq }, style]}>
      <Piece type={piece.type} color={piece.color} size={sq * 0.92} set={pieceSet} />
    </Animated.View>
  );
}

function Board({
  fen,
  size,
  boardTheme,
  pieceSet = 'classic',
  flipped = false,
  selected = null,
  legalTargets = [],
  lastMove = null,
  checkSquare = null,
  coordinates = true,
  showLegalMoves = true,
  animate = true,
  interactive = true,
  onSquarePress,
  onMoveAttempt,
  extraHighlights = null,
}) {
  const sq = size / 8;
  const [pieces, setPieces] = useState(() => piecesFromFen(fen).map((p) => ({ ...p, id: nextId() })));
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    setPieces((prev) => reconcilePieces(prev, fen));
    // Bir hamle tamamlandığında jestin onFinalize olayı cihaz tarafından
    // kaçırılsa bile geçici sürükleme katmanı tahtada hayalet taş bırakmasın.
    dragRef.current = null;
    setDrag(null);
  }, [fen]);

  const targetSet = useMemo(() => new Set(legalTargets), [legalTargets]);
  const occupied = useMemo(() => new Set(pieces.map((p) => p.square)), [pieces]);

  const squareAt = useCallback(
    (px, py) => {
      const col = Math.floor(px / sq);
      const row = Math.floor(py / sq);
      if (col < 0 || col > 7 || row < 0 || row > 7) return null;
      return coordsToSquare(col, row, flipped);
    },
    [sq, flipped]
  );

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  // Sürükleme durumu ayrıca ref'te tutulur: jest state güncellemesi asenkron
  // olsa da hamle yalnızca bir kez işlenir.

  const beginDrag = useCallback(
    (px, py) => {
      if (!interactive) return;
      const square = squareAt(px, py);
      if (!square) return;
      const piece = pieces.find((p) => p.square === square);
      // Seçili taşın yasal hedefindeki rakip taşı ayrı bir sürükleme katmanı
      // olarak çizmek, dokunarak yemede hayalet taş bırakabiliyordu.
      const draggablePiece = targetSet.has(square) ? null : piece || null;
      dragRef.current = { from: square, piece: draggablePiece };
      setDrag(dragRef.current);
      // Dokunma geri bildirimini burada vermiyoruz: parent/FEN'i jest bitmeden
      // güncellemek, sürükleme katmanının hayalet taş olarak kalmasına yol açıyordu.
    },
    [interactive, squareAt, pieces, targetSet]
  );

  const endDrag = useCallback(
    (px, py, travelled) => {
      const current = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!interactive || !current) return;

      // Önce sürükleme katmanı temizlenir, sonra dokunma/hamle işlenir.
      if (travelled <= sq * 0.4) {
        onSquarePress?.(current.from);
        return;
      }

      const to = squareAt(px, py);
      if (to && to !== current.from) onMoveAttempt?.(current.from, to);
    },
    [interactive, squareAt, onMoveAttempt, onSquarePress, sq]
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          dragX.value = e.x;
          dragY.value = e.y;
          runOnJS(beginDrag)(e.x, e.y);
        })
        .onUpdate((e) => {
          dragX.value = e.x;
          dragY.value = e.y;
        })
        // Yalnızca onFinalize kullanılır: onEnd iptal edilen jestlerde
        // çağrılmaz ve sürüklenen taş ekranda asılı kalırdı.
        .onFinalize((e) => {
          const travelled = Math.hypot(e.translationX ?? 0, e.translationY ?? 0);
          runOnJS(endDrag)(e.x, e.y, travelled);
        }),
    [beginDrag, endDrag, dragX, dragY]
  );

  const dragStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - sq / 2 },
      // Parmağın taşı kapatmaması için biraz yukarı kaydırılır.
      { translateY: dragY.value - sq * 0.85 },
      { scale: 1.1 },
    ],
  }));

  const squares = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = coordsToSquare(col, row, flipped);
      const light = (col + row) % 2 === 0;
      squares.push({ square, col, row, light });
    }
  }

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.board, { width: size, height: size }]} collapsable={false}>
        {squares.map(({ square, col, row, light }) => {
          const isTarget = showLegalMoves && targetSet.has(square);
          const isCapture = isTarget && occupied.has(square);
          const isLast =
            lastMove && (square === lastMove.from || square === lastMove.to);
          const extra = extraHighlights?.[square];
          return (
            <View
              key={square}
              style={[
                styles.square,
                {
                  width: sq,
                  height: sq,
                  left: col * sq,
                  top: row * sq,
                  backgroundColor: light ? boardTheme.light : boardTheme.dark,
                },
              ]}
            >
              {isLast ? <View style={[styles.fill, { backgroundColor: MARKS.lastMove }]} /> : null}
              {square === selected ? (
                <View style={[styles.fill, { backgroundColor: MARKS.selected }]} />
              ) : null}
              {square === checkSquare ? (
                <View
                  style={[
                    styles.fill,
                    styles.checkGlow,
                    { backgroundColor: MARKS.check, borderRadius: sq / 2 },
                  ]}
                />
              ) : null}
              {extra ? <View style={[styles.fill, { backgroundColor: extra }]} /> : null}

              {isTarget && !isCapture ? (
                <View
                  style={{
                    width: sq * 0.28,
                    height: sq * 0.28,
                    borderRadius: sq * 0.14,
                    backgroundColor: MARKS.hint,
                  }}
                />
              ) : null}
              {isCapture ? (
                <View
                  style={{
                    position: 'absolute',
                    width: sq * 0.92,
                    height: sq * 0.92,
                    borderRadius: sq * 0.46,
                    borderWidth: sq * 0.07,
                    borderColor: MARKS.hint,
                  }}
                />
              ) : null}

              {coordinates && col === 0 ? (
                <Text
                  style={[
                    styles.rankLabel,
                    { color: light ? boardTheme.dark : boardTheme.light, fontSize: sq * 0.2 },
                  ]}
                >
                  {flipped ? RANKS[7 - row] : RANKS[row]}
                </Text>
              ) : null}
              {coordinates && row === 7 ? (
                <Text
                  style={[
                    styles.fileLabel,
                    { color: light ? boardTheme.dark : boardTheme.light, fontSize: sq * 0.2 },
                  ]}
                >
                  {flipped ? FILES[7 - col] : FILES[col]}
                </Text>
              ) : null}
            </View>
          );
        })}

        {pieces.map((piece) => (
          <AnimatedPiece
            key={piece.id}
            piece={piece}
            square={sq}
            flipped={flipped}
            pieceSet={pieceSet}
            animate={animate}
            hidden={drag?.piece?.id === piece.id}
          />
        ))}

        {drag?.piece ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.pieceLayer, { width: sq, height: sq }, dragStyle]}
          >
            <Piece type={drag.piece.type} color={drag.piece.color} size={sq * 0.92} set={pieceSet} />
          </Animated.View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    overflow: 'hidden',
  },
  square: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { ...StyleSheet.absoluteFillObject },
  checkGlow: { margin: '6%' },
  pieceLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankLabel: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontWeight: '700',
    opacity: 0.75,
  },
  fileLabel: {
    position: 'absolute',
    bottom: 1,
    right: 3,
    fontWeight: '700',
    opacity: 0.75,
  },
});

export default memo(Board);
