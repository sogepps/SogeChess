import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Chess } from 'chess.js';

import Board from '../src/components/Board';
import MoveList from '../src/components/MoveList';
import Piece from '../src/components/Piece';
import {
  EvalBar,
  PlayerStrip,
  PromotionSheet,
  materialAdvantage,
} from '../src/components/GameChrome';
import { Badge, Button, Chip, Field, IconButton, Row, Sheet, Txt, tap } from '../src/components/ui';
import { useSettings } from '../src/store/SettingsContext';
import { useLibrary } from '../src/store/LibraryContext';
import { useChessGame } from '../src/hooks/useChessGame';
import { evaluatePosition, formatEval, suggestMove } from '../src/chess/engine';
import { EMPTY_FEN, START_FEN, isFenValid, materialBalance } from '../src/chess/core';
import { RESULTS, pgnDate, resultLabelKey } from '../src/chess/pgn';
import { bookContinuations, openingName } from '../src/chess/openings';
import { RADIUS, SPACING } from '../src/theme/themes';

const MODES = [
  { id: 'record', icon: 'create-outline', labelKey: 'studio.mode.record' },
  { id: 'analyse', icon: 'analytics-outline', labelKey: 'studio.mode.analyse' },
  { id: 'setup', icon: 'construct-outline', labelKey: 'studio.mode.setup' },
];

const PALETTE = [
  { type: 'k', color: 'w' },
  { type: 'q', color: 'w' },
  { type: 'r', color: 'w' },
  { type: 'b', color: 'w' },
  { type: 'n', color: 'w' },
  { type: 'p', color: 'w' },
  { type: 'k', color: 'b' },
  { type: 'q', color: 'b' },
  { type: 'r', color: 'b' },
  { type: 'b', color: 'b' },
  { type: 'n', color: 'b' },
  { type: 'p', color: 'b' },
];

const CASTLING_FLAGS = [
  { flag: 'K', label: '♔ 0-0' },
  { flag: 'Q', label: '♔ 0-0-0' },
  { flag: 'k', label: '♚ 0-0' },
  { flag: 'q', label: '♚ 0-0-0' },
];

function splitFen(fen) {
  const parts = String(fen).split(' ');
  return {
    placement: parts[0] || '8/8/8/8/8/8/8/8',
    turn: parts[1] === 'b' ? 'b' : 'w',
    castling: parts[2] && parts[2] !== '-' ? parts[2] : '',
    enPassant: parts[3] && parts[3] !== '-' ? parts[3] : '',
    halfmove: parts[4] || '0',
    fullmove: parts[5] || '1',
  };
}

function joinFen({ placement, turn, castling, enPassant, halfmove, fullmove }) {
  return [placement, turn, castling || '-', enPassant || '-', halfmove || '0', fullmove || '1'].join(
    ' '
  );
}

export default function StudioScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme, board, settings, t } = useSettings();
  const { getGame, addGame } = useLibrary();
  const { width, height } = useWindowDimensions();

  const initialMode = ['record', 'analyse', 'setup'].includes(String(params.mode))
    ? String(params.mode)
    : 'record';

  const [studioMode, setStudioMode] = useState(initialMode);
  const [recordId, setRecordId] = useState(params.id ? String(params.id) : null);
  const [meta, setMeta] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [hintSquares, setHintSquares] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [setup, setSetup] = useState(() => splitFen(String(params.fen || START_FEN)));
  const [brush, setBrush] = useState({ type: 'p', color: 'w' });
  const [erasing, setErasing] = useState(false);

  const game = useChessGame({
    initialFen: String(params.fen || START_FEN),
  });

  // Arşivden açılış: kayıtlı partiyi yükle, istenen ply'a git.
  useEffect(() => {
    const id = params.id ? String(params.id) : null;
    if (!id) return;
    let alive = true;
    (async () => {
      const g = await getGame(id);
      if (!alive || !g) return;
      setRecordId(g.id);
      setMeta(g);
      game.loadGame(g.startFen || START_FEN, g.moves || []);
      const ply = params.ply != null ? Number(params.ply) : (g.moves || []).length;
      if (Number.isFinite(ply)) game.goTo(ply);
      setDirty(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const setupFen = useMemo(() => joinFen(setup), [setup]);
  const setupValidity = useMemo(() => isFenValid(setupFen), [setupFen]);

  const boardFen = studioMode === 'setup' ? setupFen : game.fen;
  const score = useMemo(
    () => (settings.showEvalBar && studioMode === 'analyse' ? evaluatePosition(game.fen) : null),
    [settings.showEvalBar, studioMode, game.fen]
  );
  const material = useMemo(() => materialBalance(boardFen), [boardFen]);
  const bookMoves = useMemo(
    () => (studioMode === 'analyse' ? bookContinuations(game.moves.map((m) => m.san)) : []),
    [studioMode, game.moves]
  );

  const boardSize = Math.floor(
    Math.min(width - SPACING.lg * 2 - (score != null ? 20 : 0), height * 0.42)
  );

  const legalTargets = useMemo(() => {
    if (studioMode === 'setup' || !selected) return [];
    return game.targetsFrom(selected);
  }, [studioMode, selected, game]);

  const afterMove = useCallback(
    (color) => {
      setSelected(null);
      setHintSquares(null);
      setDirty(true);
      if (settings.haptics) tap(true, Haptics.ImpactFeedbackStyle.Light);
      if (studioMode === 'record' && settings.autoFlip) setFlipped(color === 'w');
    },
    [settings.haptics, settings.autoFlip, studioMode]
  );

  const applyMove = useCallback(
    (from, to, promotion) => {
      const mover = game.turn;
      const record = game.makeMove(from, to, promotion);
      if (record) afterMove(mover);
      return record;
    },
    [game, afterMove]
  );

  const attemptMove = useCallback(
    (from, to) => {
      if (studioMode === 'setup') return false;
      // Geçmiş ply'dayken hamle: o noktadan sonrası kesilir (kütüphane düzenleme).
      const legal = game.legalMoves.some((m) => m.from === from && m.to === to);
      if (!legal) return false;
      if (game.requiresPromotion(from, to)) {
        if (settings.autoPromoteQueen) return !!applyMove(from, to, 'q');
        setPendingPromotion({ from, to, color: game.turn });
        return true;
      }
      return !!applyMove(from, to);
    },
    [studioMode, game, settings.autoPromoteQueen, applyMove]
  );

  const onSquarePress = useCallback(
    (square) => {
      if (studioMode === 'setup') {
        setSetup((prev) => {
          const chess = new Chess();
          chess.clear();
          try {
            chess.load(joinFen({ ...prev, castling: '', enPassant: '' }), { skipValidation: true });
          } catch {
            return prev;
          }
          if (erasing || chess.get(square)) {
            chess.remove(square);
          } else {
            chess.put({ type: brush.type, color: brush.color }, square);
          }
          return { ...prev, placement: chess.fen().split(' ')[0] };
        });
        return;
      }

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
    [studioMode, erasing, brush, game, selected, attemptMove]
  );

  const onMoveAttempt = useCallback(
    (from, to) => {
      if (studioMode === 'setup') {
        setSetup((prev) => {
          const chess = new Chess();
          chess.clear();
          try {
            chess.load(joinFen({ ...prev, castling: '', enPassant: '' }), { skipValidation: true });
          } catch {
            return prev;
          }
          const piece = chess.get(from);
          if (!piece) return prev;
          chess.remove(from);
          chess.put(piece, to);
          return { ...prev, placement: chess.fen().split(' ')[0] };
        });
        return;
      }
      if (!attemptMove(from, to)) setSelected(null);
    },
    [studioMode, attemptMove]
  );

  const switchMode = useCallback(
    (next) => {
      if (next === studioMode) return;

      if (studioMode === 'setup' && next !== 'setup') {
        if (!setupValidity.ok) {
          Alert.alert(
            t('studio.title'),
            t('editor.invalid', {
              reason: setupValidity.errorKey ? t(setupValidity.errorKey) : setupValidity.error,
            })
          );
          return;
        }
        const apply = () => {
          game.reset(setupFen);
          setSelected(null);
          setHintSquares(null);
          setDirty(true);
          setStudioMode(next);
        };
        if (game.moves.length) {
          Alert.alert(t('studio.title'), t('studio.applySetupWarn'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.confirm'), onPress: apply },
          ]);
          return;
        }
        apply();
        return;
      }

      if (next === 'setup') {
        setSetup(splitFen(game.fen));
      }
      setSelected(null);
      setStudioMode(next);
    },
    [studioMode, setupValidity, setupFen, game, t]
  );

  const doUndo = useCallback(() => {
    game.undo();
    setSelected(null);
    setDirty(true);
    if (studioMode === 'record' && settings.autoFlip && game.moves.length) {
      const last = game.moves[game.moves.length - 1];
      setFlipped(last.color === 'b');
    }
  }, [game, studioMode, settings.autoFlip]);

  const doHint = useCallback(async () => {
    if (studioMode !== 'analyse' || thinking) return;
    setThinking(true);
    try {
      const move = await suggestMove(game.fen, 4);
      if (move) setHintSquares({ from: move.from, to: move.to });
    } finally {
      setThinking(false);
    }
  }, [studioMode, thinking, game.fen]);

  const extraHighlights = useMemo(() => {
    if (!hintSquares) return null;
    return {
      [hintSquares.from]: 'rgba(90,220,140,0.45)',
      [hintSquares.to]: 'rgba(90,220,140,0.45)',
    };
  }, [hintSquares]);

  const title =
    meta?.headers?.Event ||
    (recordId ? t('game.untitled') : t('studio.title'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <Row style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt size={15} weight="800" numberOfLines={1}>
            {title}
          </Txt>
          <Txt size={11} faint numberOfLines={1}>
            {game.opening
              ? `${game.opening.eco} · ${openingName(game.opening, t)}`
              : t('studio.subtitle')}
          </Txt>
        </View>
        {studioMode !== 'record' || !settings.autoFlip ? (
          <IconButton name="swap-vertical" onPress={() => setFlipped((f) => !f)} />
        ) : (
          <View style={{ width: 40 }} />
        )}
        <IconButton name="save" onPress={() => setShowSave(true)} />
      </Row>

      <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm }}>
        <Row gap={6} wrap>
          {MODES.map((m) => (
            <Chip
              key={m.id}
              icon={m.icon}
              label={t(m.labelKey)}
              active={studioMode === m.id}
              onPress={() => switchMode(m.id)}
            />
          ))}
        </Row>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {studioMode !== 'setup' ? (
          <PlayerStrip
            name={flipped ? t('common.white') : t('common.black')}
            color={flipped ? 'w' : 'b'}
            captured={flipped ? material.capturedByWhite : material.capturedByBlack}
            advantage={
              flipped
                ? materialAdvantage(material.capturedByWhite, material.capturedByBlack)
                : materialAdvantage(material.capturedByBlack, material.capturedByWhite)
            }
          />
        ) : null}

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
              fen={boardFen}
              size={boardSize}
              boardTheme={board}
              pieceSet={settings.pieceSet}
              flipped={flipped}
              selected={studioMode === 'setup' ? null : selected}
              legalTargets={legalTargets}
              lastMove={studioMode === 'setup' ? null : game.lastMove}
              checkSquare={studioMode === 'setup' ? null : game.checkSquare}
              coordinates={settings.coordinates}
              showLegalMoves={studioMode !== 'setup' && settings.showLegalMoves}
              animate={studioMode !== 'setup' && settings.animations}
              interactive
              onSquarePress={onSquarePress}
              onMoveAttempt={onMoveAttempt}
              extraHighlights={studioMode === 'setup' ? null : extraHighlights}
            />
          </View>
        </Row>

        {studioMode !== 'setup' ? (
          <PlayerStrip
            name={flipped ? t('common.black') : t('common.white')}
            color={flipped ? 'b' : 'w'}
            captured={flipped ? material.capturedByBlack : material.capturedByWhite}
            advantage={
              flipped
                ? materialAdvantage(material.capturedByBlack, material.capturedByWhite)
                : materialAdvantage(material.capturedByWhite, material.capturedByBlack)
            }
          />
        ) : null}

        <Row style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xs }} gap={SPACING.sm} wrap>
          {score != null ? (
            <Badge
              label={formatEval(score)}
              color={score > 50 ? theme.success : score < -50 ? theme.danger : theme.textDim}
            />
          ) : null}
          {studioMode === 'setup' ? (
            <Badge
              label={
                setupValidity.ok
                  ? t('editor.valid')
                  : setupValidity.errorKey
                    ? t(setupValidity.errorKey)
                    : t('editor.invalidShort')
              }
              color={setupValidity.ok ? theme.success : theme.danger}
            />
          ) : null}
          {dirty ? <Badge label={t('studio.unsaved')} color={theme.warning} /> : null}
          {!game.atLive && studioMode !== 'setup' ? (
            <Badge label={`${game.cursor}/${game.moves.length}`} color={theme.primary} />
          ) : null}
          {game.check && studioMode !== 'setup' ? (
            <Badge label={t('board.check')} color={theme.danger} />
          ) : null}
        </Row>

        {studioMode !== 'setup' ? (
          <>
            <MoveList
              moves={game.moves}
              cursor={game.cursor}
              onSelect={(ply) => {
                game.goTo(ply);
                setSelected(null);
              }}
              horizontal
              style={{ marginTop: SPACING.sm }}
            />

            {studioMode === 'analyse' && bookMoves.length ? (
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
              <IconButton
                name="chevron-forward"
                onPress={game.stepForward}
                disabled={game.atLive}
              />
              <IconButton name="play-skip-forward" onPress={game.goEnd} disabled={game.atLive} />
              <View style={{ flex: 1 }} />
              <IconButton name="arrow-undo" onPress={doUndo} disabled={!game.moves.length} />
              {studioMode === 'analyse' ? (
                <IconButton name="bulb" onPress={doHint} disabled={thinking} />
              ) : null}
            </Row>
          </>
        ) : (
          <SetupPanel
            setup={setup}
            setSetup={setSetup}
            brush={brush}
            setBrush={setBrush}
            erasing={erasing}
            setErasing={setErasing}
            onApply={() => switchMode('analyse')}
          />
        )}

        <Row gap={SPACING.sm} style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
          <Button
            title={t('board.saveGame')}
            icon="save-outline"
            variant="accent"
            full
            onPress={() => {
              if (studioMode === 'setup') {
                if (!setupValidity.ok) {
                  Alert.alert(
                    t('studio.title'),
                    t('editor.invalid', {
                      reason: setupValidity.errorKey
                        ? t(setupValidity.errorKey)
                        : setupValidity.error,
                    })
                  );
                  return;
                }
                game.reset(setupFen);
                setDirty(true);
                setStudioMode('analyse');
              }
              setShowSave(true);
            }}
          />
        </Row>
      </ScrollView>

      <PromotionSheet
        visible={!!pendingPromotion}
        color={pendingPromotion?.color || 'w'}
        onPick={(piece) => {
          if (!pendingPromotion) return;
          applyMove(pendingPromotion.from, pendingPromotion.to, piece);
          setPendingPromotion(null);
        }}
        onCancel={() => setPendingPromotion(null)}
      />

      <SaveStudioSheet
        visible={showSave}
        onClose={() => setShowSave(false)}
        game={game}
        recordId={recordId}
        meta={meta}
        source={studioMode === 'setup' ? 'analyse' : studioMode}
        onSaved={(saved) => {
          setRecordId(saved.id);
          setMeta(saved);
          setDirty(false);
          setShowSave(false);
        }}
      />
    </SafeAreaView>
  );
}

function SetupPanel({ setup, setSetup, brush, setBrush, erasing, setErasing, onApply }) {
  const { theme, settings, t } = useSettings();

  return (
    <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.md }}>
      <Txt size={12} weight="800" dim>
        {t('editor.pieces').toUpperCase()}
      </Txt>
      <Row wrap gap={6}>
        {PALETTE.map((p) => {
          const active = !erasing && brush.type === p.type && brush.color === p.color;
          return (
            <Pressable
              key={`${p.color}${p.type}`}
              onPress={() => {
                setErasing(false);
                setBrush(p);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? theme.primarySoft : theme.surfaceAlt,
                borderWidth: 1,
                borderColor: active ? theme.primary : theme.border,
              }}
            >
              <Piece type={p.type} color={p.color} size={30} set={settings.pieceSet} />
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setErasing(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: RADIUS.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: erasing ? theme.surfaceAlt : theme.surfaceAlt,
            borderWidth: 1,
            borderColor: erasing ? theme.danger : theme.border,
          }}
        >
          <Ionicons name="backspace-outline" size={18} color={erasing ? theme.danger : theme.textDim} />
        </Pressable>
      </Row>

      <Txt size={12} weight="800" dim>
        {t('editor.sideToMove').toUpperCase()}
      </Txt>
      <Row gap={SPACING.sm}>
        <Chip
          label={t('common.white')}
          active={setup.turn === 'w'}
          onPress={() => setSetup((s) => ({ ...s, turn: 'w' }))}
        />
        <Chip
          label={t('common.black')}
          active={setup.turn === 'b'}
          onPress={() => setSetup((s) => ({ ...s, turn: 'b' }))}
        />
      </Row>

      <Txt size={12} weight="800" dim>
        {t('editor.castling').toUpperCase()}
      </Txt>
      <Row wrap gap={6}>
        {CASTLING_FLAGS.map(({ flag, label }) => {
          const on = setup.castling.includes(flag);
          return (
            <Chip
              key={flag}
              label={label}
              active={on}
              onPress={() =>
                setSetup((s) => ({
                  ...s,
                  castling: on
                    ? s.castling.replace(flag, '')
                    : `${s.castling}${flag}`,
                }))
              }
            />
          );
        })}
      </Row>

      <Row gap={SPACING.sm}>
        <Button
          title={t('editor.clearBoard')}
          variant="secondary"
          size="sm"
          icon="trash-outline"
          onPress={() => setSetup(splitFen(EMPTY_FEN))}
          style={{ flex: 1 }}
        />
        <Button
          title={t('editor.startPos')}
          variant="secondary"
          size="sm"
          icon="refresh"
          onPress={() => setSetup(splitFen(START_FEN))}
          style={{ flex: 1 }}
        />
      </Row>

      <Button
        title={t('studio.usePosition')}
        icon="checkmark"
        variant="accent"
        full
        onPress={onApply}
      />
    </View>
  );
}

function SaveStudioSheet({ visible, onClose, game, recordId, meta, source, onSaved }) {
  const { t } = useSettings();
  const { addGame } = useLibrary();

  const [title, setTitle] = useState('');
  const [white, setWhite] = useState('');
  const [black, setBlack] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('*');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const headers = meta?.headers || {};
    setTitle(headers.Event || '');
    setWhite(headers.White || '');
    setBlack(headers.Black || '');
    setNotes(meta?.notes || '');
    setResult(headers.Result || game.status?.result || '*');
  }, [visible, meta, game.status?.result]);

  const persist = async ({ asNew }) => {
    setBusy(true);
    try {
      const saved = await addGame({
        id: asNew ? undefined : recordId || undefined,
        createdAt: asNew ? undefined : meta?.createdAt,
        headers: {
          Event: title.trim() || t('studio.defaultTitle'),
          Site: meta?.headers?.Site || 'Soge Chess',
          Date: meta?.headers?.Date || pgnDate(),
          Round: meta?.headers?.Round || '-',
          White: white.trim() || '?',
          Black: black.trim() || '?',
          Result: result,
        },
        startFen: game.startFen,
        moves: game.moves,
        finalFen: game.fen,
        notes,
        source: source || 'studio',
      });
      onSaved?.(saved);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('board.saveGame')}>
      <View style={{ gap: SPACING.md }}>
        <Field
          label={t('studio.saveTitle')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('studio.defaultTitle')}
        />
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
        <Field
          label={t('game.notes')}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ minHeight: 72 }}
        />
        <Txt size={12} weight="700" dim>
          {t('game.result')}
        </Txt>
        <Row wrap gap={6}>
          {RESULTS.map((r) => (
            <Chip
              key={r}
              label={t(resultLabelKey(r))}
              active={result === r}
              onPress={() => setResult(r)}
            />
          ))}
        </Row>

        {recordId ? (
          <Row gap={SPACING.sm}>
            <Button
              title={t('studio.update')}
              variant="accent"
              full
              loading={busy}
              onPress={() => persist({ asNew: false })}
              style={{ flex: 1 }}
            />
            <Button
              title={t('studio.saveAs')}
              variant="secondary"
              full
              loading={busy}
              onPress={() => persist({ asNew: true })}
              style={{ flex: 1 }}
            />
          </Row>
        ) : (
          <Button
            title={t('common.save')}
            variant="accent"
            full
            loading={busy}
            onPress={() => persist({ asNew: true })}
          />
        )}
      </View>
    </Sheet>
  );
}
