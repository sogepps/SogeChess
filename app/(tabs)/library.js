import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  Row,
  Sheet,
  Txt,
} from '../../src/components/ui';
import MiniBoard from '../../src/components/MiniBoard';
import AdBanner from '../../src/components/AdBanner';
import { useSettings } from '../../src/store/SettingsContext';
import { useLibrary } from '../../src/store/LibraryContext';
import { KEYS, readJson } from '../../src/store/db';
import { gameTitle, parsePgnFile } from '../../src/chess/pgn';
import { openingName } from '../../src/chess/openings';
import { exportGamesToFile } from '../../src/services/share';
import { errorMessage } from '../../src/i18n/errors';
import { useTabContentPadding } from '../../src/hooks/useSafeLayout';
import { RADIUS, SPACING } from '../../src/theme/themes';

const SORTS = [
  { id: 'newest', labelKey: 'library.sort.newest' },
  { id: 'oldest', labelKey: 'library.sort.oldest' },
  { id: 'name', labelKey: 'library.sort.name' },
];

export default function LibraryScreen() {
  const { theme, t } = useSettings();
  const { games, positions, removeGame, removePosition, importGames, toggleGameFavorite } =
    useLibrary();
  const router = useRouter();
  // Listenin son satırı sekme çubuğunun ve sistem gezinme çubuğunun altında kalmasın.
  const listBottomPad = useTabContentPadding(SPACING.lg);

  const [tab, setTab] = useState('games');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [favOnly, setFavOnly] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selection, setSelection] = useState([]);
  const [pin, setPin] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await readJson(KEYS.libraryPin, null);
      if (!alive) return;
      setPin(stored);
      setUnlocked(!stored);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const tryUnlock = () => {
    if (pinInput === String(pin)) {
      setUnlocked(true);
      setPinInput('');
    } else {
      Alert.alert(t('library.title'), t('library.pinWrong'));
    }
  };

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = games.filter((g) => {
      if (favOnly && !g.favorite) return false;
      if (!q) return true;
      return [
        g.white,
        g.black,
        g.event,
        g.site,
        g.opening ? openingName(g.opening, t) : null,
        ...(g.tags || []),
      ]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
    if (sort === 'oldest') list = [...list].sort((a, b) => a.createdAt - b.createdAt);
    else if (sort === 'name') list = [...list].sort((a, b) => gameTitle(a).localeCompare(gameTitle(b)));
    else list = [...list].sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [games, query, sort, favOnly, t]);

  const filteredPositions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return positions.filter((p) => {
      if (favOnly && !p.favorite) return false;
      if (!q) return true;
      return [p.name, p.collection, ...(p.tags || [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
  }, [positions, query, favOnly]);

  const doImport = useCallback(async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/x-chess-pgn', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.length) return;
      setImporting(true);
      const file = new File(picked.assets[0].uri);
      const text = await file.text();
      const { games: parsed, errors, total } = parsePgnFile(text);
      if (!parsed.length) {
        Alert.alert(t('library.import'), t('library.importNone'));
        return;
      }
      await importGames(parsed);
      const done = t('library.importDone', { n: parsed.length, total });
      const skipped = errors.length ? ` ${t('library.importSkipped', { n: errors.length })}` : '';
      Alert.alert(t('library.import'), done + skipped);
    } catch (err) {
      Alert.alert(t('library.import'), errorMessage(err, t));
    } finally {
      setImporting(false);
    }
  }, [importGames, t]);

  const doExportAll = useCallback(async () => {
    try {
      await exportGamesToFile(games.map((g) => g.id), t, 'share.file.archive');
    } catch (err) {
      Alert.alert(t('library.export'), errorMessage(err, t));
    }
  }, [games, t]);

  const toggleSelect = (id) =>
    setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const renderGame = ({ item }) => {
    const selecting = selection.length > 0;
    const isSelected = selection.includes(item.id);
    return (
      <Card
        padded={false}
        style={{
          borderColor: isSelected ? theme.primary : theme.border,
          marginBottom: SPACING.sm,
        }}
        onPress={() =>
          selecting
            ? toggleSelect(item.id)
            : router.push(`/studio?id=${encodeURIComponent(item.id)}&mode=analyse`)
        }
      >
        <Pressable onLongPress={() => toggleSelect(item.id)} delayLongPress={280}>
          <Row style={{ padding: SPACING.md }} gap={SPACING.md}>
            <MiniBoard fen={item.finalFen || item.startFen} size={54} />
            <View style={{ flex: 1, gap: 3 }}>
              <Txt size={15} weight="700" numberOfLines={1}>
                {gameTitle(item, t('game.untitled'))}
              </Txt>
              <Txt size={11} faint numberOfLines={1}>
                {[item.event, item.date].filter(Boolean).join(' · ') || '—'}
              </Txt>
              <Row gap={6} wrap>
                <Badge
                  label={item.result}
                  color={
                    item.result === '1-0'
                      ? theme.success
                      : item.result === '0-1'
                      ? theme.danger
                      : theme.textDim
                  }
                />
                {item.opening ? <Badge label={item.opening.eco} color={theme.primary} /> : null}
                <Txt size={11} faint>
                  {item.moveCount} {t('library.movesAbbr')}
                </Txt>
              </Row>
            </View>
            <View style={{ gap: SPACING.sm, alignItems: 'center' }}>
              <Pressable onPress={() => toggleGameFavorite(item.id)} hitSlop={8}>
                <Ionicons
                  name={item.favorite ? 'star' : 'star-outline'}
                  size={18}
                  color={item.favorite ? theme.accent : theme.textFaint}
                />
              </Pressable>
              {selecting ? (
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isSelected ? theme.primary : theme.textFaint}
                />
              ) : null}
            </View>
          </Row>
        </Pressable>
      </Card>
    );
  };

  const renderPosition = ({ item }) => (
    <Card
      padded={false}
      style={{ flex: 1, margin: SPACING.xs }}
      onPress={() =>
        router.push(
          `/studio?mode=setup&fen=${encodeURIComponent(item.fen)}`
        )
      }
    >
      <View style={{ padding: SPACING.sm, gap: SPACING.sm, alignItems: 'center' }}>
        <MiniBoard fen={item.fen} size={110} radius={8} />
        <Txt size={12} weight="700" numberOfLines={1} style={{ alignSelf: 'stretch' }}>
          {item.name || t('common.unknown')}
        </Txt>
        <Row gap={6} style={{ alignSelf: 'stretch' }}>
          {item.collection ? <Badge label={item.collection} color={theme.primary} /> : null}
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() =>
              Alert.alert(t('library.positions'), t('library.deletePosition'), [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: () => removePosition(item.id),
                },
              ])
            }
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={15} color={theme.textFaint} />
          </Pressable>
        </Row>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {!unlocked ? (
        <View
          style={{
            flex: 1,
            padding: SPACING.xl,
            justifyContent: 'center',
            gap: SPACING.lg,
          }}
        >
          <View style={{ alignItems: 'center', gap: SPACING.sm }}>
            <Ionicons name="lock-closed" size={36} color={theme.accent} />
            <Txt size={20} weight="800">
              {t('library.locked')}
            </Txt>
            <Txt size={13} faint style={{ textAlign: 'center' }}>
              {t('library.pinHint')}
            </Txt>
          </View>
          <Field
            label={t('library.pin')}
            value={pinInput}
            onChangeText={setPinInput}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
          />
          <Button title={t('library.unlock')} icon="lock-open" variant="accent" full onPress={tryUnlock} />
        </View>
      ) : (
        <>
      <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm }}>
        <Row style={{ marginBottom: SPACING.md }}>
          <Txt size={26} weight="800" style={{ flex: 1 }}>
            {t('library.title')}
          </Txt>
          <IconButton name="download-outline" onPress={doImport} disabled={importing} />
          <IconButton name="share-outline" onPress={doExportAll} />
          <IconButton name="add" onPress={() => router.push('/studio?mode=record')} />
        </Row>

        <Row gap={SPACING.sm} style={{ marginBottom: SPACING.md }}>
          <Chip
            label={`${t('library.games')} (${games.length})`}
            active={tab === 'games'}
            onPress={() => setTab('games')}
          />
          <Chip
            label={`${t('library.positions')} (${positions.length})`}
            active={tab === 'positions'}
            onPress={() => setTab('positions')}
          />
        </Row>

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
            marginBottom: SPACING.sm,
          }}
        >
          <Ionicons name="search" size={16} color={theme.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('library.searchGames')}
            placeholderTextColor={theme.textFaint}
            style={{ flex: 1, height: 42, color: theme.text, fontSize: 14 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textFaint} />
            </Pressable>
          ) : null}
        </View>

        <Row gap={SPACING.sm} wrap>
          <Chip
            label={t('library.favorites')}
            icon="star"
            active={favOnly}
            onPress={() => setFavOnly((f) => !f)}
          />
          {tab === 'games'
            ? SORTS.map((s) => (
                <Chip
                  key={s.id}
                  label={t(s.labelKey)}
                  active={sort === s.id}
                  onPress={() => setSort(s.id)}
                />
              ))
            : null}
        </Row>
      </View>

      {selection.length ? (
        <Row
          gap={SPACING.sm}
          style={{
            marginHorizontal: SPACING.lg,
            marginBottom: SPACING.sm,
            padding: SPACING.sm,
            borderRadius: RADIUS.md,
            backgroundColor: theme.primarySoft,
          }}
        >
          <Txt size={13} weight="700" style={{ flex: 1 }}>
            {t('library.selectedCount', { n: selection.length })}
          </Txt>
          <Button
            title={t('common.share')}
            size="sm"
            variant="secondary"
            icon="share-outline"
            onPress={() =>
              exportGamesToFile(selection, t, 'share.file.selection').catch((err) =>
                Alert.alert(t('library.export'), errorMessage(err, t))
              )
            }
          />
          <Button
            title={t('common.delete')}
            size="sm"
            variant="danger"
            onPress={() => {
              selection.forEach((id) => removeGame(id));
              setSelection([]);
            }}
          />
          <IconButton name="close" size={16} onPress={() => setSelection([])} />
        </Row>
      ) : null}

      {tab === 'games' ? (
        <FlatList
          data={filteredGames}
          keyExtractor={(item) => item.id}
          renderItem={renderGame}
          contentContainerStyle={{ padding: SPACING.lg, paddingTop: 0, paddingBottom: listBottomPad }}
          ListEmptyComponent={
            <EmptyState
              icon="albums-outline"
              title={t('home.noGames')}
              action={t('library.import')}
              onAction={doImport}
            />
          }
          ListFooterComponent={<AdBanner placement="library" style={{ marginTop: SPACING.md }} />}
        />
      ) : (
        <FlatList
          data={filteredPositions}
          key="positions"
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={renderPosition}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: listBottomPad }}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              title={t('library.noPositions')}
              action={t('editor.title')}
              onAction={() => router.push('/studio?mode=setup')}
            />
          }
          ListFooterComponent={<AdBanner placement="library" style={{ margin: SPACING.sm }} />}
        />
      )}
        </>
      )}
    </SafeAreaView>
  );
}
