import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Chess } from 'chess.js';
import Board from '../src/components/Board';
import MiniBoard from '../src/components/MiniBoard';
import { Badge, Button, Card, IconButton, Row, Sheet, Txt } from '../src/components/ui';
import { useSettings } from '../src/store/SettingsContext';
import { openingName, searchOpenings } from '../src/chess/openings';
import { useBottomInset } from '../src/hooks/useSafeLayout';
import { RADIUS, SPACING } from '../src/theme/themes';

// Bir açılış hattının belirli bir ply'daki FEN'i.
function fenAfter(sanLine, plies) {
  const chess = new Chess();
  const moves = sanLine.split(' ');
  for (let i = 0; i < Math.min(plies, moves.length); i++) {
    try {
      chess.move(moves[i]);
    } catch {
      break;
    }
  }
  return chess.fen();
}

export default function OpeningsScreen() {
  const router = useRouter();
  const { theme, board, settings, t } = useSettings();
  const bottomPad = useBottomInset(SPACING.xl);
  const { width, height } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(null);
  const [ply, setPly] = useState(0);

  const results = useMemo(() => searchOpenings(query, t), [query, t]);

  const openStudy = (opening) => {
    setActive(opening);
    setPly(opening.san.split(' ').length);
  };

  const totalPlies = active ? active.san.split(' ').length : 0;
  const boardSize = Math.floor(Math.min(width - SPACING.lg * 2, height * 0.42));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <Row style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
        <Txt size={17} weight="800" style={{ flex: 1, marginLeft: SPACING.sm }}>
          {t('openings.title')}
        </Txt>
        <Badge label={`${results.length}`} color={theme.primary} />
      </Row>

      <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.sm,
            backgroundColor: theme.surfaceAlt,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: SPACING.md,
          }}
        >
          <Ionicons name="search" size={16} color={theme.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('openings.search')}
            placeholderTextColor={theme.textFaint}
            autoCorrect={false}
            style={{ flex: 1, height: 44, color: theme.text, fontSize: 14 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, i) => `${item.eco}-${i}`}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: 0, paddingBottom: bottomPad }}
        renderItem={({ item }) => (
          <Card padded={false} style={{ marginBottom: SPACING.sm }} onPress={() => openStudy(item)}>
            <Row style={{ padding: SPACING.md }} gap={SPACING.md}>
              <MiniBoard fen={fenAfter(item.san, 99)} size={52} />
              <View style={{ flex: 1, gap: 3 }}>
                <Txt size={15} weight="700" numberOfLines={1}>
                  {openingName(item, t)}
                </Txt>
                <Txt size={11} faint numberOfLines={1}>
                  {item.san}
                </Txt>
              </View>
              <Badge label={item.eco} color={theme.primary} />
            </Row>
          </Card>
        )}
      />

      <Sheet
        visible={!!active}
        onClose={() => setActive(null)}
        title={active ? openingName(active, t) : ''}
      >
        {active ? (
          <View style={{ gap: SPACING.md, alignItems: 'center' }}>
            <Row gap={SPACING.sm}>
              <Badge label={active.eco} color={theme.primary} />
              <Badge label={t('openings.halfMoves', { n: totalPlies })} color={theme.textDim} />
            </Row>

            <View
              style={{
                borderRadius: RADIUS.md,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: theme.border,
              }}
            >
              <Board
                fen={fenAfter(active.san, ply)}
                size={boardSize}
                boardTheme={board}
                pieceSet={settings.pieceSet}
                coordinates={settings.coordinates}
                showLegalMoves={false}
                animate={settings.animations}
                interactive={false}
              />
            </View>

            <Row gap={4} wrap style={{ justifyContent: 'center' }}>
              {active.san.split(' ').map((san, i) => (
                <Pressable
                  key={`${san}-${i}`}
                  onPress={() => setPly(i + 1)}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: RADIUS.sm,
                    backgroundColor: ply === i + 1 ? theme.primarySoft : theme.surfaceAlt,
                    borderWidth: 1,
                    borderColor: ply === i + 1 ? theme.primary : theme.border,
                  }}
                >
                  <Txt size={12} weight="700" color={ply === i + 1 ? theme.primary : theme.text}>
                    {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}
                    {san}
                  </Txt>
                </Pressable>
              ))}
            </Row>

            <Row gap={SPACING.sm} style={{ alignSelf: 'stretch' }}>
              <IconButton name="play-skip-back" onPress={() => setPly(0)} />
              <IconButton name="chevron-back" onPress={() => setPly((p) => Math.max(0, p - 1))} />
              <IconButton
                name="chevron-forward"
                onPress={() => setPly((p) => Math.min(totalPlies, p + 1))}
              />
              <IconButton name="play-skip-forward" onPress={() => setPly(totalPlies)} />
              <View style={{ flex: 1 }} />
            </Row>

            <Button
              title={t('editor.playFromHere')}
              icon="play"
              full
              onPress={() => {
                const fen = fenAfter(active.san, ply);
                setActive(null);
                router.push(`/studio?mode=analyse&fen=${encodeURIComponent(fen)}`);
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}
