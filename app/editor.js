import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Chess } from 'chess.js';
import Board from '../src/components/Board';
import Piece from '../src/components/Piece';
import { Badge, Button, Chip, Field, IconButton, Row, Sheet, Txt } from '../src/components/ui';
import { useSettings } from '../src/store/SettingsContext';
import { useLibrary } from '../src/store/LibraryContext';
import { usePremium } from '../src/store/PremiumContext';
import { EMPTY_FEN, START_FEN, isFenValid } from '../src/chess/core';
import { RADIUS, SPACING } from '../src/theme/themes';

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

// FEN'in taş yerleşimi dışındaki alanlarını ayrı tutmak, düzenleme sırasında
// rok/hamle sırası bilgisinin kaybolmasını önler.
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

export default function EditorScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme, board, settings, t } = useSettings();
  const { addPosition, positions } = useLibrary();
  const { isAtLimit } = usePremium();
  const { width, height } = useWindowDimensions();

  const [state, setState] = useState(() => splitFen(String(params.fen || START_FEN)));
  const [brush, setBrush] = useState({ type: 'p', color: 'w' });
  const [erasing, setErasing] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showFen, setShowFen] = useState(false);
  const [fenInput, setFenInput] = useState('');
  const [name, setName] = useState('');
  const [collection, setCollection] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const fen = useMemo(() => joinFen(state), [state]);
  const validity = useMemo(() => isFenValid(fen), [fen]);

  // chess.js'ten gelen hata metni İngilizcedir; çeviri anahtarı varsa o kazanır.
  const fenError = (res) => (res.errorKey ? t(res.errorKey) : res.error || t('editor.invalidShort'));

  const boardSize = Math.floor(Math.min(width - SPACING.lg * 2, height * 0.44));

  // Kare yerleşimini değiştirmek için chess.js'in put/remove API'sini kullanırız;
  // böylece FEN'i elle kurcalamaya gerek kalmaz.
  const editSquare = useCallback(
    (square) => {
      setState((prev) => {
        const chess = new Chess();
        chess.clear();
        // Mevcut yerleşimi geçici bir tahtaya yükle.
        try {
          chess.load(joinFen({ ...prev, castling: '', enPassant: '' }), {
            skipValidation: true,
          });
        } catch {
          return prev;
        }
        const existing = chess.get(square);
        if (erasing) {
          chess.remove(square);
        } else if (existing && existing.type === brush.type && existing.color === brush.color) {
          chess.remove(square);
        } else {
          // Aynı renkten ikinci şah konamaz; sessizce yok saymak yerine eskisini kaldırırız.
          if (brush.type === 'k') {
            const found = chess.findPiece({ type: 'k', color: brush.color });
            for (const sq of found) chess.remove(sq);
          }
          chess.put({ type: brush.type, color: brush.color }, square);
        }
        return { ...prev, placement: chess.fen().split(' ')[0] };
      });
    },
    [brush, erasing]
  );

  const toggleCastling = (flag) =>
    setState((prev) => ({
      ...prev,
      castling: prev.castling.includes(flag)
        ? prev.castling.replace(flag, '')
        : prev.castling + flag,
    }));

  const applyFen = () => {
    const check = isFenValid(fenInput.trim());
    if (!check.ok) {
      Alert.alert(t('editor.pasteFen'), t('editor.invalid', { reason: fenError(check) }));
      return;
    }
    setState(splitFen(fenInput.trim()));
    setShowFen(false);
    setFenInput('');
  };

  const savePosition = async () => {
    if (!validity.ok) {
      Alert.alert(t('editor.title'), t('editor.invalid', { reason: fenError(validity) }));
      return;
    }
    if (isAtLimit('positions', positions.length)) {
      Alert.alert(t('common.premium'), t('library.limitReached', { n: 15 }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('premium.subscribe'), onPress: () => router.push('/premium') },
      ]);
      return;
    }
    await addPosition({
      id: params.id ? String(params.id) : undefined,
      name: name.trim() || t('editor.defaultName', { n: positions.length + 1 }),
      fen,
      collection: collection.trim(),
      tags: tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      notes,
    });
    setShowSave(false);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <Row style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
        <Txt size={17} weight="800" style={{ flex: 1, marginLeft: SPACING.sm }}>
          {t('editor.title')}
        </Txt>
        <IconButton name="code-slash" onPress={() => setShowFen(true)} />
      </Row>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: 0, paddingBottom: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            alignSelf: 'center',
            borderRadius: RADIUS.md,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: theme.border,
            marginBottom: SPACING.md,
          }}
        >
          <Board
            fen={fen}
            size={boardSize}
            boardTheme={board}
            pieceSet={settings.pieceSet}
            coordinates={settings.coordinates}
            showLegalMoves={false}
            animate={false}
            onSquarePress={editSquare}
            onMoveAttempt={(from, to) => {
              // Düzenleyicide sürükleme taşı taşır.
              setState((prev) => {
                const chess = new Chess();
                chess.clear();
                try {
                  chess.load(joinFen({ ...prev, castling: '', enPassant: '' }), {
                    skipValidation: true,
                  });
                } catch {
                  return prev;
                }
                const piece = chess.get(from);
                if (!piece) return prev;
                chess.remove(from);
                chess.put(piece, to);
                return { ...prev, placement: chess.fen().split(' ')[0] };
              });
            }}
          />
        </View>

        <Row gap={SPACING.sm} style={{ marginBottom: SPACING.md }} wrap>
          <Badge
            label={validity.ok ? t('editor.valid') : fenError(validity)}
            color={validity.ok ? theme.success : theme.danger}
            style={{ paddingHorizontal: 10, paddingVertical: 5 }}
          />
        </Row>

        <Txt size={12} weight="800" dim style={{ marginBottom: SPACING.sm }}>
          {t('editor.pieces').toUpperCase()}
        </Txt>
        <Row wrap gap={6} style={{ marginBottom: SPACING.md }}>
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
                  width: 46,
                  height: 46,
                  borderRadius: RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? theme.primarySoft : theme.surface,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? theme.primary : theme.border,
                }}
              >
                <Piece type={p.type} color={p.color} size={34} set={settings.pieceSet} />
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setErasing((e) => !e)}
            style={{
              width: 46,
              height: 46,
              borderRadius: RADIUS.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: erasing ? theme.danger : theme.surface,
              borderWidth: 1,
              borderColor: erasing ? theme.danger : theme.border,
            }}
          >
            <Ionicons name="backspace-outline" size={20} color={erasing ? '#FFF' : theme.text} />
          </Pressable>
        </Row>

        <Row gap={SPACING.sm} style={{ marginBottom: SPACING.md }} wrap>
          <Button
            title={t('editor.startPos')}
            size="sm"
            variant="secondary"
            onPress={() => setState(splitFen(START_FEN))}
          />
          <Button
            title={t('editor.clearBoard')}
            size="sm"
            variant="secondary"
            onPress={() => setState(splitFen(EMPTY_FEN))}
          />
        </Row>

        <Txt size={12} weight="800" dim style={{ marginBottom: SPACING.sm }}>
          {t('editor.sideToMove').toUpperCase()}
        </Txt>
        <Row gap={SPACING.sm} style={{ marginBottom: SPACING.md }}>
          <Chip
            label={t('common.white')}
            active={state.turn === 'w'}
            onPress={() => setState((p) => ({ ...p, turn: 'w' }))}
          />
          <Chip
            label={t('common.black')}
            active={state.turn === 'b'}
            onPress={() => setState((p) => ({ ...p, turn: 'b' }))}
          />
        </Row>

        <Txt size={12} weight="800" dim style={{ marginBottom: SPACING.sm }}>
          {t('editor.castling').toUpperCase()}
        </Txt>
        <Row gap={SPACING.sm} wrap style={{ marginBottom: SPACING.md }}>
          {CASTLING_FLAGS.map((c) => (
            <Chip
              key={c.flag}
              label={c.label}
              active={state.castling.includes(c.flag)}
              onPress={() => toggleCastling(c.flag)}
            />
          ))}
        </Row>

        <Field
          label={t('editor.enPassant')}
          value={state.enPassant}
          onChangeText={(v) => setState((p) => ({ ...p, enPassant: v.trim().toLowerCase() }))}
          placeholder="—"
          style={{ marginBottom: SPACING.lg }}
        />

        <Row gap={SPACING.sm}>
          <Button
            title={t('board.savePosition')}
            icon="bookmark"
            onPress={() => setShowSave(true)}
            style={{ flex: 1 }}
            disabled={!validity.ok}
          />
          <Button
            title={t('editor.playFromHere')}
            icon="play"
            variant="secondary"
            disabled={!validity.ok}
            onPress={() =>
              router.push(`/game/play?mode=analysis&fen=${encodeURIComponent(fen)}`)
            }
            style={{ flex: 1 }}
          />
        </Row>
      </ScrollView>

      <Sheet visible={showFen} onClose={() => setShowFen(false)} title={t('common.fen')}>
        <View style={{ gap: SPACING.md }}>
          <Field label={t('editor.currentFen')} value={fen} onChangeText={() => {}} multiline />
          <Field
            label={t('editor.pasteFen')}
            value={fenInput}
            onChangeText={setFenInput}
            placeholder="rnbqkbnr/..."
            multiline
          />
          <Button title={t('common.apply')} onPress={applyFen} full />
        </View>
      </Sheet>

      <Sheet visible={showSave} onClose={() => setShowSave(false)} title={t('board.savePosition')}>
        <View style={{ gap: SPACING.md }}>
          <Field label={t('common.rename')} value={name} onChangeText={setName} placeholder="—" />
          <Field
            label={t('library.collections')}
            value={collection}
            onChangeText={setCollection}
            placeholder={t('editor.collectionHint')}
          />
          <Field
            label={t('game.tags')}
            value={tags}
            onChangeText={setTags}
            placeholder={t('editor.tagsHint')}
          />
          <Field label={t('game.notes')} value={notes} onChangeText={setNotes} multiline />
          <Button title={t('common.save')} icon="save" onPress={savePosition} full size="lg" />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
