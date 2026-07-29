import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

import Board from '../../src/components/Board';
import MoveList from '../../src/components/MoveList';
import {
  EvalBar,
  GameOverCard,
  PlayerStrip,
  PromotionSheet,
  materialAdvantage,
} from '../../src/components/GameChrome';
import { Badge, Button, Field, IconButton, Row, Sheet, Txt, tap } from '../../src/components/ui';
import { useSettings } from '../../src/store/SettingsContext';
import { usePremium } from '../../src/store/PremiumContext';
import { useLibrary } from '../../src/store/LibraryContext';
import { useChessGame } from '../../src/hooks/useChessGame';
import { useChessClock } from '../../src/hooks/useChessClock';
import { useConditionalKeepAwake } from '../../src/hooks/useConditionalKeepAwake';
import { findBestMove, evaluatePosition, formatEval, suggestMove } from '../../src/chess/engine';
import { CLOCK_PRESETS, toPgnTimeControl } from '../../src/chess/clock';
import { RESULTS, pgnDate, resultLabelKey } from '../../src/chess/pgn';
import { START_FEN } from '../../src/chess/core';
import { bookContinuations, openingName } from '../../src/chess/openings';
import { maybeShowInterstitial } from '../../src/services/ads';
import { RADIUS, SPACING } from '../../src/theme/themes';

const MODE_TITLES = {
  engine: 'play.vsEngine',
  friend: 'play.vsFriend',
  record: 'play.otbRecord',
  analysis: 'play.analyse',
};

export default function PlayGameScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme, board, settings, t, lang } = useSettings();
  const { isPremium } = usePremium();
  const { width, height } = useWindowDimensions();

  const mode = String(params.mode || 'analysis');
  const level = Number(params.level ?? 2);
  const userSide = String(params.side || 'w') === 'b' ? 'b' : 'w';
  const startFen = String(params.fen || START_FEN);
  const clockPreset = useMemo(
    () => CLOCK_PRESETS.find((p) => p.id === params.clock) || null,
    [params.clock]
  );

  const game = useChessGame({ initialFen: startFen });
  const [flipped, setFlipped] = useState(mode === 'engine' && userSide === 'b');
  const [selected, setSelected] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [hintSquares, setHintSquares] = useState(null);
  const [showSave, setShowSave] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [manualResult, setManualResult] = useState(null);
  const [manualReason, setManualReason] = useState(null);
  const [showMoves, setShowMoves] = useState(false);

  const clockOn = !!clockPreset;
  useConditionalKeepAwake(clockOn && settings.clockKeepAwake, 'soge-game');

  const clock = useChessClock(clockPreset?.control, {
    lowTimeThreshold: (settings.clockLowWarning || 10) * 1000,
    onFlag: (side) => {
      setManualResult(side === 'w' ? '0-1' : '1-0');
      setManualReason('reason.timeout');
      setShowGameOver(true);
      if (settings.clockHaptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    onLowTime: () => {
      if (settings.clockHaptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },
  });

  // Saat, ekran açıldığında beyaz için işlemeye başlar; ilk hamlenin düşünme
  // süresi de sayılsın diye ilk hamleyi beklemeyiz.
  const clockStartedRef = useRef(false);
  useEffect(() => {
    if (clockOn && !clockStartedRef.current) {
      clockStartedRef.current = true;
      clock.start('w');
    }
  }, [clockOn, clock]);

  const status = manualResult
    ? { over: true, result: manualResult, reasonKey: manualReason }
    : game.status;
  const isOver = status.over;

  useEffect(() => {
    if (game.status.over) {
      setShowGameOver(true);
      if (clockOn) clock.pause();
      if (settings.haptics)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status.over]);

  // --- Hamle uygulama ---------------------------------------------------------

  const afterMove = useCallback(
    (color) => {
      setSelected(null);
      setHintSquares(null);
      if (settings.haptics) tap(true, Haptics.ImpactFeedbackStyle.Light);
      if (clockOn && !clock.flagged) clock.pressSide(color);
      // Ortaya koyup karşılıklı oyna: sıradaki oyuncunun taşları alta gelsin.
      if (mode === 'friend' || (mode === 'record' && settings.autoFlip)) {
        setFlipped(color === 'w');
      }
    },
    [settings.haptics, settings.autoFlip, clockOn, clock, mode]
  );

  const applyMove = useCallback(
    (from, to, promotion) => {
      const mover = game.turn;
      const record = game.makeMove(from, to, promotion, { at: Date.now() });
      if (record) afterMove(mover);
      return record;
    },
    [game, afterMove]
  );

  const attemptMove = useCallback(
    (from, to) => {
      if (isOver || !game.atLive) return false;
      if (mode === 'engine' && game.turn !== userSide) return false;

      const legal = game.legalMoves.some((m) => m.from === from && m.to === to);
      if (!legal) return false;

      if (game.requiresPromotion(from, to)) {
        if (settings.autoPromoteQueen) return !!applyMove(from, to, 'q');
        setPendingPromotion({ from, to, color: game.turn });
        return true;
      }
      return !!applyMove(from, to);
    },
    [isOver, game, mode, userSide, settings.autoPromoteQueen, applyMove]
  );

  const onSquarePress = useCallback(
    (square) => {
      if (isOver) return;
      if (!game.atLive) {
        // Geçmişe bakarken tahtaya dokunmak canlı konuma döndürür.
        game.goEnd();
        setSelected(null);
        return;
      }
      if (mode === 'engine' && game.turn !== userSide) return;

      const piece = game.chess.get(square);
      if (selected && selected !== square) {
        if (attemptMove(selected, square)) return;
      }
      if (piece && piece.color === game.turn) {
        setSelected((prev) => (prev === square ? null : square));
      } else {
        setSelected(null);
      }
    },
    [isOver, game, mode, userSide, selected, attemptMove]
  );

  const onMoveAttempt = useCallback(
    (from, to) => {
      if (!attemptMove(from, to)) setSelected(null);
    },
    [attemptMove]
  );

  const confirmPromotion = useCallback(
    (piece) => {
      if (!pendingPromotion) return;
      applyMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    },
    [pendingPromotion, applyMove]
  );

  // --- Motor cevabı -----------------------------------------------------------

  const engineTurn =
    mode === 'engine' && !isOver && game.atLive && game.turn !== userSide && !pendingPromotion;

  useEffect(() => {
    if (!engineTurn) return undefined;
    let cancelled = false;
    setThinking(true);
    findBestMove(game.fen, level)
      .then((move) => {
        if (cancelled || !move) return;
        const mover = game.turn;
        const record = game.makeMove(move.from, move.to, move.promotion);
        if (record) afterMove(mover);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setThinking(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineTurn, game.fen]);

  // --- Türetilmiş görsel veriler ----------------------------------------------

  const score = useMemo(
    () => (settings.showEvalBar && mode !== 'engine' ? evaluatePosition(game.fen) : null),
    [settings.showEvalBar, mode, game.fen]
  );

  const bookMoves = useMemo(
    () => (mode === 'analysis' ? bookContinuations(game.moves.slice(0, game.cursor).map((m) => m.san)) : []),
    [mode, game.moves, game.cursor]
  );

  const legalTargets = useMemo(
    () => (selected ? game.targetsFrom(selected) : []),
    [selected, game]
  );

  const boardSize = useMemo(() => {
    const maxByWidth = width - SPACING.lg * 2 - (score != null ? 20 : 0);
    const maxByHeight = height - 330;
    return Math.floor(Math.min(maxByWidth, Math.max(maxByHeight, 240)));
  }, [width, height, score]);

  const engineName = t('game.engine', { level: t(`level.${level}`) });
  const whiteName =
    mode === 'engine' ? (userSide === 'w' ? t('game.you') : engineName) : t('common.white');
  const blackName =
    mode === 'engine' ? (userSide === 'b' ? t('game.you') : engineName) : t('common.black');

  const material = game.material;

  // --- Eylemler ---------------------------------------------------------------

  const doHint = useCallback(async () => {
    if (isOver || thinking) return;
    setThinking(true);
    try {
      const move = await suggestMove(game.fen, isPremium ? 4 : 2);
      if (move) setHintSquares({ from: move.from, to: move.to });
    } finally {
      setThinking(false);
    }
  }, [isOver, thinking, game.fen, isPremium]);

  const doResign = useCallback(() => {
    Alert.alert(t('board.resign'), t('board.confirmResign'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('board.resign'),
        style: 'destructive',
        onPress: () => {
          const loser = mode === 'engine' ? userSide : game.turn;
          setManualResult(loser === 'w' ? '0-1' : '1-0');
          setManualReason('reason.resignation');
          setShowGameOver(true);
          if (clockOn) clock.pause();
        },
      },
    ]);
  }, [t, mode, userSide, game.turn, clockOn, clock]);

  const doDraw = useCallback(() => {
    setManualResult('1/2-1/2');
    setManualReason('reason.agreement');
    setShowGameOver(true);
    if (clockOn) clock.pause();
  }, [clockOn, clock]);

  const doUndo = useCallback(() => {
    if (!game.moves.length) return;
    const lastColor = game.moves[game.moves.length - 1]?.color;
    if (mode === 'engine') game.undoPair();
    else game.undo();
    setManualResult(null);
    setShowGameOver(false);
    setSelected(null);
    // Geri alınca oynayacak taraf (son hamleyi yapan) alta gelsin.
    if (mode === 'friend' || (mode === 'record' && settings.autoFlip)) {
      setFlipped(lastColor === 'b');
    }
  }, [game, mode, settings.autoFlip]);

  const restart = useCallback(() => {
    // Parti bitti, kullanıcı yeniden başlatıyor: oyunun akışını kesmeyen tek
    // doğal duraklama anı burası. Sıklık sınırlarına ads.js karar veriyor.
    maybeShowInterstitial(isPremium);
    game.reset(startFen);
    setManualResult(null);
    setManualReason(null);
    setShowGameOver(false);
    setSaved(false);
    setSelected(null);
    if (mode === 'friend' || mode === 'record') setFlipped(false);
    if (clockOn) {
      clock.reset();
      clockStartedRef.current = false;
    }
  }, [game, startFen, clockOn, clock, isPremium, mode]);

  /** Geri çıkış: yalnızca gerçekten oynanmış bir parti sonrası reklam denenir. */
  const leaveScreen = useCallback(() => {
    if (game.moves.length >= 8) maybeShowInterstitial(isPremium);
    router.back();
  }, [game.moves.length, isPremium, router]);

  const extraHighlights = useMemo(() => {
    if (!hintSquares) return null;
    return {
      [hintSquares.from]: 'rgba(90,220,140,0.45)',
      [hintSquares.to]: 'rgba(90,220,140,0.45)',
    };
  }, [hintSquares]);

  const displayResult = status.result === '*' ? '*' : status.result;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <Row style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <IconButton name="chevron-back" onPress={leaveScreen} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt size={15} weight="800">
            {t(MODE_TITLES[mode] || 'play.title')}
          </Txt>
          <Txt size={11} faint numberOfLines={1}>
            {game.opening
              ? `${game.opening.eco} · ${openingName(game.opening, t)}`
              : t('app.tagline')}
          </Txt>
        </View>
        <IconButton name="swap-vertical" onPress={() => setFlipped((f) => !f)} />
        <IconButton name="list" onPress={() => setShowMoves(true)} />
      </Row>

      <ScrollView
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <PlayerStrip
          name={flipped ? whiteName : blackName}
          color={flipped ? 'w' : 'b'}
          captured={flipped ? material.capturedByWhite : material.capturedByBlack}
          advantage={
            flipped
              ? materialAdvantage(material.capturedByWhite, material.capturedByBlack)
              : materialAdvantage(material.capturedByBlack, material.capturedByWhite)
          }
          clockMs={clockOn ? clock.remaining[flipped ? 'w' : 'b'] : null}
          clockActive={clockOn && clock.active === (flipped ? 'w' : 'b') && clock.running}
          lowTime={clockOn && clock.remaining[flipped ? 'w' : 'b'] < 30000}
          thinking={thinking && game.turn === (flipped ? 'w' : 'b')}
        />

        <Row gap={SPACING.sm} style={{ paddingHorizontal: SPACING.lg }} align="flex-start">
          {score != null ? <EvalBar score={score} height={boardSize} flipped={flipped} /> : null}
          <View
            style={{
              borderRadius: RADIUS.md,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: theme.border,
            }}
          >
            <Board
              fen={game.fen}
              size={boardSize}
              boardTheme={board}
              pieceSet={settings.pieceSet}
              flipped={flipped}
              selected={selected}
              legalTargets={legalTargets}
              lastMove={game.lastMove}
              checkSquare={game.checkSquare}
              coordinates={settings.coordinates}
              showLegalMoves={settings.showLegalMoves}
              animate={settings.animations}
              interactive={!isOver}
              onSquarePress={onSquarePress}
              onMoveAttempt={onMoveAttempt}
              extraHighlights={extraHighlights}
            />
          </View>
        </Row>

        <PlayerStrip
          name={flipped ? blackName : whiteName}
          color={flipped ? 'b' : 'w'}
          captured={flipped ? material.capturedByBlack : material.capturedByWhite}
          advantage={
            flipped
              ? materialAdvantage(material.capturedByBlack, material.capturedByWhite)
              : materialAdvantage(material.capturedByWhite, material.capturedByBlack)
          }
          clockMs={clockOn ? clock.remaining[flipped ? 'b' : 'w'] : null}
          clockActive={clockOn && clock.active === (flipped ? 'b' : 'w') && clock.running}
          lowTime={clockOn && clock.remaining[flipped ? 'b' : 'w'] < 30000}
          thinking={thinking && game.turn === (flipped ? 'b' : 'w')}
        />

        <Row
          style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xs }}
          gap={SPACING.sm}
        >
          {score != null ? (
            <Badge
              label={formatEval(score)}
              color={score > 50 ? theme.success : score < -50 ? theme.danger : theme.textDim}
            />
          ) : null}
          {game.check && !isOver ? <Badge label={t('board.check')} color={theme.danger} /> : null}
          {!game.atLive ? (
            <Badge label={`${game.cursor}/${game.moves.length}`} color={theme.primary} />
          ) : null}
          {clockOn ? (
            <Badge
              label={`${t('clock.moveCount')} ${clock.moveCount.w}/${clock.moveCount.b}`}
              color={theme.textDim}
            />
          ) : null}
        </Row>

        <MoveList
          moves={game.moves}
          cursor={game.cursor}
          onSelect={game.goTo}
          horizontal
          style={{ marginTop: SPACING.sm }}
        />

        {mode === 'analysis' && bookMoves.length ? (
          <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.sm, gap: 6 }}>
            <Txt size={11} weight="800" dim>
              {t('openings.title').toUpperCase()}
            </Txt>
            <Row wrap gap={6}>
              {bookMoves.slice(0, 8).map((b) => (
                <Pressable
                  key={b.san}
                  onPress={() => {
                    const mover = game.turn;
                    if (game.makeSanMove(b.san)) afterMove(mover);
                  }}
                  style={{
                    paddingHorizontal: SPACING.md,
                    paddingVertical: 6,
                    borderRadius: RADIUS.pill,
                    backgroundColor: theme.surfaceAlt,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Txt size={13} weight="700">
                    {b.san}
                  </Txt>
                </Pressable>
              ))}
            </Row>
          </View>
        ) : null}

        <Row
          gap={SPACING.sm}
          style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}
          wrap
        >
          <IconButton name="play-skip-back" onPress={game.goStart} disabled={game.cursor === 0} />
          <IconButton name="chevron-back" onPress={game.stepBack} disabled={game.cursor === 0} />
          <IconButton name="chevron-forward" onPress={game.stepForward} disabled={game.atLive} />
          <IconButton name="play-skip-forward" onPress={game.goEnd} disabled={game.atLive} />
          <View style={{ flex: 1 }} />
          <IconButton
            name="arrow-undo"
            onPress={doUndo}
            disabled={!game.moves.length || isOver}
          />
          {mode !== 'record' ? (
            <IconButton name="bulb" onPress={doHint} disabled={isOver || thinking} />
          ) : null}
          <IconButton name="save" onPress={() => setShowSave(true)} />
        </Row>

        {!isOver && mode !== 'analysis' ? (
          <Row gap={SPACING.sm} style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.md }}>
            <Button
              title={t('board.offerDraw')}
              variant="secondary"
              size="sm"
              icon="hand-left"
              onPress={doDraw}
              style={{ flex: 1 }}
            />
            <Button
              title={t('board.resign')}
              variant="secondary"
              size="sm"
              icon="flag"
              onPress={doResign}
              style={{ flex: 1 }}
            />
          </Row>
        ) : null}
      </ScrollView>

      <PromotionSheet
        visible={!!pendingPromotion}
        color={pendingPromotion?.color || 'w'}
        onSelect={confirmPromotion}
        onCancel={() => setPendingPromotion(null)}
      />

      <GameOverCard
        visible={showGameOver && isOver}
        title={t(resultLabelKey(displayResult))}
        detail={status.reasonKey ? t(status.reasonKey) : null}
        saved={saved}
        onSave={() => setShowSave(true)}
        onRematch={restart}
        onClose={() => setShowGameOver(false)}
      />

      <SaveGameSheet
        visible={showSave}
        onClose={() => setShowSave(false)}
        game={game}
        clock={clockOn ? clock : null}
        clockPreset={clockPreset}
        mode={mode}
        userSide={mode === 'engine' ? userSide : null}
        defaultResult={displayResult}
        engineLevel={level}
        onSaved={() => {
          setSaved(true);
          setShowSave(false);
        }}
      />

      <Sheet visible={showMoves} onClose={() => setShowMoves(false)} title={t('board.moveList')}>
        <MoveList moves={game.moves} cursor={game.cursor} onSelect={game.goTo} />
      </Sheet>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------

function SaveGameSheet({
  visible,
  onClose,
  game,
  clock,
  clockPreset,
  mode,
  userSide,
  defaultResult,
  engineLevel,
  onSaved,
}) {
  const { t } = useSettings();
  const { addGame, games } = useLibrary();
  const { isAtLimit } = usePremium();
  const router = useRouter();

  const [white, setWhite] = useState('');
  const [black, setBlack] = useState('');
  const [event, setEvent] = useState('');
  const [site, setSite] = useState('');
  const [round, setRound] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(defaultResult);
  const [busy, setBusy] = useState(false);

  useEffect(() => setResult(defaultResult), [defaultResult]);

  useEffect(() => {
    if (!visible) return;
    if (mode === 'engine') {
      const engine = t('game.engine', { level: t(`level.${engineLevel}`) });
      setWhite((w) => w || (userSide === 'w' ? t('game.you') : engine));
      setBlack((b) => b || (userSide === 'b' ? t('game.you') : engine));
    }
  }, [visible, mode, userSide, engineLevel, t]);

  const save = async () => {
    if (isAtLimit('games', games.length)) {
      Alert.alert(
        t('common.premium'),
        t('library.limitReached', { n: 25 }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('premium.subscribe'), onPress: () => router.push('/premium') },
        ]
      );
      return;
    }
    setBusy(true);
    try {
      // Saat kullanıldıysa her hamlenin kalan süresi PGN'e [%clk] olarak yazılır.
      const moves = game.moves.map((m, i) => {
        const timing = clock?.moveTimes?.[i];
        return timing ? { ...m, clock: timing.remaining, spent: timing.ms } : m;
      });

      await addGame({
        headers: {
          Event: event || t('play.title'),
          Site: site || 'Soge Chess',
          Date: pgnDate(),
          Round: round || '-',
          White: white || '?',
          Black: black || '?',
          Result: result,
          ...(clockPreset ? { TimeControl: toPgnTimeControl(clockPreset.control) } : null),
        },
        startFen: game.startFen,
        moves,
        finalFen: game.fen,
        notes,
        userSide,
        source: mode,
        clockPresetId: clockPreset?.id || null,
      });
      onSaved?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('board.saveGame')}>
      <View style={{ gap: SPACING.md }}>
        <Row gap={SPACING.md} align="flex-start">
          <Field
            label={t('game.whitePlayer')}
            value={white}
            onChangeText={setWhite}
            placeholder="?"
            style={{ flex: 1 }}
          />
          <Field
            label={t('game.blackPlayer')}
            value={black}
            onChangeText={setBlack}
            placeholder="?"
            style={{ flex: 1 }}
          />
        </Row>
        <Field label={t('game.event')} value={event} onChangeText={setEvent} placeholder="—" />
        <Row gap={SPACING.md} align="flex-start">
          <Field
            label={t('game.site')}
            value={site}
            onChangeText={setSite}
            placeholder="—"
            style={{ flex: 1 }}
          />
          <Field
            label={t('game.round')}
            value={round}
            onChangeText={setRound}
            placeholder="—"
            style={{ width: 90 }}
          />
        </Row>

        <View style={{ gap: 6 }}>
          <Txt size={12} weight="700" dim>
            {t('game.result')}
          </Txt>
          <Row gap={SPACING.sm} wrap>
            {RESULTS.map((r) => (
              <Pressable key={r} onPress={() => setResult(r)}>
                <Badge
                  label={r}
                  color={result === r ? undefined : '#7A7A7A'}
                  style={{ paddingHorizontal: 12, paddingVertical: 7 }}
                />
              </Pressable>
            ))}
          </Row>
        </View>

        <Field
          label={t('game.notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder="—"
          multiline
        />

        <Button
          title={t('common.save')}
          icon="save"
          onPress={save}
          loading={busy}
          full
          size="lg"
        />
      </View>
    </Sheet>
  );
}
