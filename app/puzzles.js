import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Chess } from 'chess.js';
import Board from '../src/components/Board';
import { PromotionSheet } from '../src/components/GameChrome';
import { Badge, Button, Card, IconButton, Row, Txt } from '../src/components/ui';
import AdBanner from '../src/components/AdBanner';
import { useSettings } from '../src/store/SettingsContext';
import { usePremium } from '../src/store/PremiumContext';
import { PUZZLES } from '../src/chess/puzzles';
import { kingSquare } from '../src/chess/core';
import { KEYS, readJson, writeJson } from '../src/store/db';
import { maybeShowInterstitial } from '../src/services/ads';
import { RADIUS, SPACING } from '../src/theme/themes';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function PuzzlesScreen() {
  const router = useRouter();
  const { theme, board, settings, t } = useSettings();
  const { isPremium, limitFor } = usePremium();
  const { width, height } = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [chess, setChess] = useState(() => new Chess(PUZZLES[0].fen));
  const [step, setStep] = useState(0); // çözüm hattında kaçıncı hamledeyiz
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'right' | 'wrong' | 'solved'
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(null);
  const [progress, setProgress] = useState({ solved: [], streak: 0, best: 0, day: todayKey(), count: 0 });

  const puzzle = PUZZLES[index];
  const dailyLimit = limitFor('dailyPuzzles');
  const limitReached = progress.day === todayKey() && progress.count >= dailyLimit;

  useEffect(() => {
    (async () => {
      const stored = await readJson(KEYS.progress, null);
      if (stored) {
        setProgress(
          stored.day === todayKey() ? stored : { ...stored, day: todayKey(), count: 0 }
        );
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setProgress(next);
    await writeJson(KEYS.progress, next);
  }, []);

  const loadPuzzle = useCallback((i) => {
    const p = PUZZLES[i];
    setChess(new Chess(p.fen));
    setStep(0);
    setSelected(null);
    setFeedback(null);
    setRevealed(false);
  }, []);

  const goNext = useCallback(() => {
    const next = (index + 1) % PUZZLES.length;
    // Bulmacalar arası geçiş doğal bir duraklama; ads.js zaten üst üste
    // gösterime izin vermiyor, burada sadece uygun anı bildiriyoruz.
    maybeShowInterstitial(isPremium);
    setIndex(next);
    loadPuzzle(next);
  }, [index, loadPuzzle, isPremium]);

  const solvedNow = useCallback(async () => {
    setFeedback('solved');
    if (settings.haptics)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const already = progress.solved.includes(puzzle.id);
    const streak = progress.streak + 1;
    await persist({
      ...progress,
      solved: already ? progress.solved : [...progress.solved, puzzle.id],
      streak,
      best: Math.max(progress.best, streak),
      day: todayKey(),
      count: progress.count + 1,
    });
  }, [progress, puzzle.id, persist, settings.haptics]);

  const wrongMove = useCallback(async () => {
    setFeedback('wrong');
    if (settings.haptics)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    await persist({ ...progress, streak: 0 });
  }, [progress, persist, settings.haptics]);

  // Kullanıcının hamlesi hattın beklenen hamlesiyle eşleşiyor mu?
  const submitMove = useCallback(
    (from, to, promotion) => {
      const expected = puzzle.line[step];
      const probe = new Chess(chess.fen());
      let applied;
      try {
        applied = probe.move({ from, to, promotion: promotion || undefined });
      } catch {
        return false;
      }

      // Mat-1 bulmacalarında üretim sırasında çözümün tekliği kanıtlandığı için
      // mat eden her hamle doğrudur; yine de SAN karşılaştırması yeterlidir.
      if (applied.san !== expected) {
        wrongMove();
        return false;
      }

      setChess(probe);
      setSelected(null);
      setFeedback('right');

      const nextStep = step + 1;
      if (nextStep >= puzzle.line.length) {
        setStep(nextStep);
        solvedNow();
        return true;
      }

      // Rakibin zorunlu cevabını kısa bir gecikmeyle oynat.
      setTimeout(() => {
        const withReply = new Chess(probe.fen());
        try {
          withReply.move(puzzle.line[nextStep]);
          setChess(withReply);
          setStep(nextStep + 1);
        } catch {
          /* hat bozuksa olduğu yerde kal */
        }
      }, 420);
      setStep(nextStep);
      return true;
    },
    [puzzle, step, chess, wrongMove, solvedNow]
  );

  const onMoveAttempt = useCallback(
    (from, to) => {
      if (feedback === 'solved' || limitReached) return;
      const legal = chess.moves({ verbose: true }).filter((m) => m.from === from && m.to === to);
      if (!legal.length) {
        setSelected(null);
        return;
      }
      if (legal.some((m) => m.flags.includes('p'))) {
        setPending({ from, to, color: chess.turn() });
        return;
      }
      submitMove(from, to);
    },
    [chess, feedback, limitReached, submitMove]
  );

  const onSquarePress = useCallback(
    (square) => {
      if (feedback === 'solved' || limitReached) return;
      const piece = chess.get(square);
      if (selected && selected !== square) {
        onMoveAttempt(selected, square);
        return;
      }
      if (piece && piece.color === chess.turn()) setSelected((s) => (s === square ? null : square));
      else setSelected(null);
    },
    [chess, selected, feedback, limitReached, onMoveAttempt]
  );

  const reveal = useCallback(() => {
    setRevealed(true);
    const solved = new Chess(puzzle.fen);
    for (const san of puzzle.line) {
      try {
        solved.move(san);
      } catch {
        break;
      }
    }
    setChess(solved);
    setStep(puzzle.line.length);
    setFeedback('solved');
    persist({ ...progress, streak: 0 });
  }, [puzzle, progress, persist]);

  const boardSize = Math.floor(Math.min(width - SPACING.lg * 2, height * 0.46));
  const legalTargets = useMemo(
    () => (selected ? chess.moves({ square: selected, verbose: true }).map((m) => m.to) : []),
    [selected, chess]
  );

  const sideToMove = new Chess(puzzle.fen).turn();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <Row style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt size={16} weight="800">
            {t('puzzles.title')}
          </Txt>
          <Txt size={11} faint>
            {index + 1} / {PUZZLES.length} · {puzzle.rating}
          </Txt>
        </View>
        <Row gap={6}>
          <Badge label={`🔥 ${progress.streak}`} color={theme.accent} />
        </Row>
      </Row>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: 0, paddingBottom: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ marginBottom: SPACING.md }}>
          <Row gap={SPACING.md}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: RADIUS.md,
                backgroundColor:
                  feedback === 'solved'
                    ? theme.success + '22'
                    : feedback === 'wrong'
                    ? theme.danger + '22'
                    : theme.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={
                  feedback === 'solved'
                    ? 'checkmark-circle'
                    : feedback === 'wrong'
                    ? 'close-circle'
                    : 'extension-puzzle'
                }
                size={19}
                color={
                  feedback === 'solved'
                    ? theme.success
                    : feedback === 'wrong'
                    ? theme.danger
                    : theme.primary
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={15} weight="700">
                {feedback === 'solved'
                  ? revealed
                    ? t('puzzles.showSolution')
                    : t('puzzles.solved')
                  : feedback === 'wrong'
                  ? t('puzzles.wrong')
                  : sideToMove === 'w'
                  ? t('puzzles.whiteToMove')
                  : t('puzzles.blackToMove')}
              </Txt>
              <Txt size={12} faint>
                {t(`puzzle.theme.${puzzle.theme}`)} · {t('puzzles.mateIn', { n: puzzle.mateIn })}
              </Txt>
            </View>
          </Row>
        </Card>

        {limitReached ? (
          <Card style={{ marginBottom: SPACING.md, gap: SPACING.md }}>
            <Row gap={SPACING.sm}>
              <Ionicons name="lock-closed" size={18} color={theme.accent} />
              <Txt size={13} weight="700" style={{ flex: 1 }}>
                {t('puzzles.dailyLimit')}
              </Txt>
            </Row>
            <Button
              title={t('premium.subscribe')}
              variant="accent"
              full
              onPress={() => router.push('/premium')}
            />
          </Card>
        ) : null}

        <View
          style={{
            alignSelf: 'center',
            borderRadius: RADIUS.md,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor:
              feedback === 'solved'
                ? theme.success
                : feedback === 'wrong'
                ? theme.danger
                : theme.border,
            marginBottom: SPACING.lg,
          }}
        >
          <Board
            fen={chess.fen()}
            size={boardSize}
            boardTheme={board}
            pieceSet={settings.pieceSet}
            flipped={sideToMove === 'b'}
            selected={selected}
            legalTargets={legalTargets}
            checkSquare={chess.isCheck() ? kingSquare(chess, chess.turn()) : null}
            coordinates={settings.coordinates}
            showLegalMoves={settings.showLegalMoves}
            animate={settings.animations}
            interactive={feedback !== 'solved' && !limitReached}
            onSquarePress={onSquarePress}
            onMoveAttempt={onMoveAttempt}
          />
        </View>

        <Row gap={SPACING.sm} style={{ marginBottom: SPACING.md }}>
          <Button
            title={t('common.reset')}
            icon="refresh"
            variant="secondary"
            onPress={() => loadPuzzle(index)}
            style={{ flex: 1 }}
          />
          <Button
            title={t('puzzles.showSolution')}
            icon="eye"
            variant="secondary"
            onPress={reveal}
            disabled={feedback === 'solved'}
            style={{ flex: 1 }}
          />
        </Row>

        <Button
          title={t('puzzles.next')}
          icon="arrow-forward"
          onPress={goNext}
          full
          size="lg"
          disabled={limitReached}
        />

        <Row gap={SPACING.md} style={{ marginTop: SPACING.lg }}>
          <Card style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Txt size={20} weight="800">
              {progress.solved.length}
            </Txt>
            <Txt size={11} faint>
              {t('puzzles.solved')}
            </Txt>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Txt size={20} weight="800">
              {progress.best}
            </Txt>
            <Txt size={11} faint>
              {t('puzzles.streak')}
            </Txt>
          </Card>
          {!isPremium ? (
            <Card style={{ flex: 1, alignItems: 'center', gap: 2 }}>
              <Txt size={20} weight="800">
                {Math.max(0, dailyLimit - progress.count)}
              </Txt>
              <Txt size={11} faint>
                {t('puzzles.remainingToday')}
              </Txt>
            </Card>
          ) : null}
        </Row>

        <AdBanner placement="puzzles" style={{ marginTop: SPACING.lg }} />
      </ScrollView>

      <PromotionSheet
        visible={!!pending}
        color={pending?.color || 'w'}
        onSelect={(piece) => {
          if (pending) submitMove(pending.from, pending.to, piece);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </SafeAreaView>
  );
}
