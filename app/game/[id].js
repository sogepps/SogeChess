import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Board from '../../src/components/Board';
import MoveList from '../../src/components/MoveList';
import { EvalBar, PlayerStrip, materialAdvantage } from '../../src/components/GameChrome';
import { Badge, Button, Card, IconButton, Row, Sheet, Txt } from '../../src/components/ui';
import AdBanner from '../../src/components/AdBanner';
import { useSettings } from '../../src/store/SettingsContext';
import { useLibrary } from '../../src/store/LibraryContext';
import { usePremium } from '../../src/store/PremiumContext';
import { evaluatePosition, formatEval } from '../../src/chess/engine';
import { materialBalance, newGame } from '../../src/chess/core';
import { gameTitle, resultLabelKey, serializeGameToPgn } from '../../src/chess/pgn';
import { openingName } from '../../src/chess/openings';
import { shareGame, shareText } from '../../src/services/share';
import { errorMessage } from '../../src/i18n/errors';
import { formatTime } from '../../src/chess/clock';
import { RADIUS, SPACING } from '../../src/theme/themes';

export default function GameViewerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, board, settings, t } = useSettings();
  const { getGame, removeGame, toggleGameFavorite } = useLibrary();
  const { isPremium } = usePremium();
  const { width, height } = useWindowDimensions();

  const [record, setRecord] = useState(null);
  const [cursor, setCursor] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showPgn, setShowPgn] = useState(false);
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const g = await getGame(String(id));
      if (!alive) return;
      setRecord(g);
      setCursor(g?.moves?.length || 0);
    })();
    return () => {
      alive = false;
    };
  }, [id, getGame]);

  // İmleçteki konumu hamleleri baştan oynatarak buluruz; kaydedilen FEN'e
  // güvenmek yerine yeniden hesaplamak bozuk kayıtlara karşı dayanıklıdır.
  const position = useMemo(() => {
    if (!record) return null;
    const chess = newGame(record.startFen);
    for (let i = 0; i < cursor && i < record.moves.length; i++) {
      try {
        chess.move(record.moves[i].san);
      } catch {
        break;
      }
    }
    return chess;
  }, [record, cursor]);

  useEffect(() => {
    if (!autoplay || !record) return undefined;
    if (cursor >= record.moves.length) {
      setAutoplay(false);
      return undefined;
    }
    const id2 = setTimeout(() => setCursor((c) => c + 1), 700);
    return () => clearTimeout(id2);
  }, [autoplay, cursor, record]);

  const doDelete = useCallback(() => {
    Alert.alert(t('library.title'), t('library.deleteGame'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await removeGame(String(id));
          router.back();
        },
      },
    ]);
  }, [id, removeGame, router, t]);

  if (!record || !position) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  const fen = position.fen();
  const material = materialBalance(fen);
  const lastMove = cursor > 0 ? record.moves[cursor - 1] : null;
  const score = settings.showEvalBar ? evaluatePosition(fen) : null;
  const boardSize = Math.floor(
    Math.min(width - SPACING.lg * 2 - (score != null ? 20 : 0), height * 0.44)
  );
  const currentClock = lastMove?.clock;

  const headers = record.headers || {};
  const whiteName = headers.White || t('common.white');
  const blackName = headers.Black || t('common.black');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <Row style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt size={15} weight="800" numberOfLines={1}>
            {gameTitle(record, t('game.untitled'))}
          </Txt>
          <Txt size={11} faint numberOfLines={1}>
            {[headers.Event, headers.Date].filter(Boolean).join(' · ') || t('common.unknown')}
          </Txt>
        </View>
        <IconButton
          name={record.favorite ? 'star' : 'star-outline'}
          color={record.favorite ? theme.accent : undefined}
          onPress={async () => {
            await toggleGameFavorite(record.id);
            setRecord((r) => ({ ...r, favorite: !r.favorite }));
          }}
        />
        <IconButton name="information-circle-outline" onPress={() => setShowInfo(true)} />
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
              fen={fen}
              size={boardSize}
              boardTheme={board}
              pieceSet={settings.pieceSet}
              flipped={flipped}
              lastMove={lastMove}
              checkSquare={
                position.isCheck()
                  ? position
                      .board()
                      .flat()
                      .find((c) => c && c.type === 'k' && c.color === position.turn())?.square
                  : null
              }
              coordinates={settings.coordinates}
              showLegalMoves={false}
              animate={settings.animations}
              interactive={false}
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
        />

        <Row gap={SPACING.sm} style={{ paddingHorizontal: SPACING.lg }} wrap>
          <Badge label={headers.Result || '*'} color={theme.primary} />
          {score != null ? <Badge label={formatEval(score)} color={theme.textDim} /> : null}
          {record.opening ? (
            <Badge
              label={`${record.opening.eco} ${openingName(record.opening, t)}`}
              color={theme.accent}
            />
          ) : null}
          {currentClock != null ? (
            <Badge label={formatTime(currentClock, { showTenths: false })} color={theme.success} />
          ) : null}
          <Badge label={`${cursor}/${record.moves.length}`} color={theme.textFaint} />
        </Row>

        <Row gap={SPACING.sm} style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.md }}>
          <IconButton name="play-skip-back" onPress={() => setCursor(0)} disabled={cursor === 0} />
          <IconButton
            name="chevron-back"
            onPress={() => setCursor((c) => Math.max(0, c - 1))}
            disabled={cursor === 0}
          />
          <IconButton
            name={autoplay ? 'pause' : 'play'}
            onPress={() => setAutoplay((a) => !a)}
            disabled={cursor >= record.moves.length}
          />
          <IconButton
            name="chevron-forward"
            onPress={() => setCursor((c) => Math.min(record.moves.length, c + 1))}
            disabled={cursor >= record.moves.length}
          />
          <IconButton
            name="play-skip-forward"
            onPress={() => setCursor(record.moves.length)}
            disabled={cursor >= record.moves.length}
          />
          <View style={{ flex: 1 }} />
          <IconButton name="swap-vertical" onPress={() => setFlipped((f) => !f)} />
        </Row>

        <Card style={{ margin: SPACING.lg, marginBottom: SPACING.md }} padded={false}>
          <View style={{ padding: SPACING.md }}>
            <MoveList
              moves={record.moves}
              cursor={cursor}
              onSelect={setCursor}
              maxHeight={220}
            />
          </View>
        </Card>

        <Row gap={SPACING.sm} style={{ paddingHorizontal: SPACING.lg }} wrap>
          <Button
            title={t('common.share')}
            icon="share-outline"
            variant="secondary"
            size="sm"
            onPress={() =>
              shareGame(record.id, t).catch((e) =>
                Alert.alert(t('common.error'), errorMessage(e, t))
              )
            }
            style={{ flex: 1 }}
          />
          <Button
            title={t('common.pgn')}
            icon="document-text-outline"
            variant="secondary"
            size="sm"
            onPress={() => setShowPgn(true)}
            style={{ flex: 1 }}
          />
          <Button
            title={t('play.analyse')}
            icon="analytics"
            variant="secondary"
            size="sm"
            onPress={() => router.push(`/game/play?mode=analysis&fen=${encodeURIComponent(fen)}`)}
            style={{ flex: 1 }}
          />
        </Row>

        <Row style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.sm }}>
          <Button
            title={t('common.delete')}
            icon="trash-outline"
            variant="ghost"
            size="sm"
            onPress={doDelete}
          />
        </Row>

        <AdBanner placement="viewer" style={{ margin: SPACING.lg }} />
      </ScrollView>

      <Sheet visible={showInfo} onClose={() => setShowInfo(false)} title={t('game.details')}>
        <View style={{ gap: SPACING.sm }}>
          {[
            ['game.event', headers.Event],
            ['game.site', headers.Site],
            ['game.date', headers.Date],
            ['game.round', headers.Round],
            ['game.whitePlayer', headers.White],
            ['game.blackPlayer', headers.Black],
            ['game.result', headers.Result],
            ['game.timeControl', headers.TimeControl],
            [
              'game.opening',
              record.opening ? `${record.opening.eco} ${openingName(record.opening, t)}` : null,
            ],
          ]
            .filter(([, v]) => v)
            .map(([key, value]) => (
              <Row key={key}>
                <Txt size={13} dim style={{ flex: 1 }}>
                  {t(key)}
                </Txt>
                <Txt size={13} weight="700">
                  {value}
                </Txt>
              </Row>
            ))}
          {record.notes ? (
            <View style={{ marginTop: SPACING.md, gap: 4 }}>
              <Txt size={12} weight="700" dim>
                {t('game.notes')}
              </Txt>
              <Txt size={13}>{record.notes}</Txt>
            </View>
          ) : null}
          <Row style={{ marginTop: SPACING.md }}>
            <Txt size={13} dim style={{ flex: 1 }}>
              {t('game.result')}
            </Txt>
            <Txt size={13} weight="700">
              {t(resultLabelKey(headers.Result || '*'))}
            </Txt>
          </Row>
        </View>
      </Sheet>

      <Sheet visible={showPgn} onClose={() => setShowPgn(false)} title={t('common.pgn')}>
        <View style={{ gap: SPACING.md }}>
          <Card style={{ backgroundColor: theme.surfaceAlt }}>
            <Txt size={12} style={{ fontFamily: undefined, lineHeight: 18 }}>
              {serializeGameToPgn(record)}
            </Txt>
          </Card>
          <Button
            title={t('common.share')}
            icon="share-outline"
            full
            onPress={() =>
              shareText(serializeGameToPgn(record), `${t('share.file.game')}.pgn`).catch((e) =>
                Alert.alert(t('common.error'), errorMessage(e, t))
              )
            }
          />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
