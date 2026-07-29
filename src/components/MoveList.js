import React, { memo, useEffect, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Txt } from './ui';
import { useSettings } from '../store/SettingsContext';
import { toMovePairs } from '../chess/core';
import { formatSan } from '../chess/notation';
import { RADIUS, SPACING } from '../theme/themes';

function MoveChip({ move, active, onPress, notation, lang }) {
  const { theme } = useSettings();
  if (!move) return <View style={{ flex: 1 }} />;
  return (
    <Pressable
      onPress={() => onPress?.(move.ply + 1)}
      style={{
        flex: 1,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: RADIUS.sm,
        backgroundColor: active ? theme.primarySoft : 'transparent',
      }}
    >
      <Txt size={14} weight={active ? '800' : '600'} color={active ? theme.primary : theme.text}>
        {formatSan(move.san, notation, lang)}
      </Txt>
    </Pressable>
  );
}

/**
 * Hamle tablosu. `horizontal` kipi tahtanın altına sığan tek satırlık şeridi,
 * dikey kip ise numaralı iki sütunlu klasik listeyi verir.
 */
function MoveList({ moves, cursor, onSelect, horizontal = false, style, maxHeight }) {
  const { theme, settings, lang, t } = useSettings();
  const scrollRef = useRef(null);
  const rows = toMovePairs(moves);

  useEffect(() => {
    // Yeni hamlede son satıra kaydır; kullanıcı geçmişi gezerken de imleci takip et.
    const id = setTimeout(() => {
      if (horizontal) scrollRef.current?.scrollToEnd({ animated: true });
      else scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(id);
  }, [moves.length, horizontal]);

  if (!moves.length) {
    return (
      <View style={[{ paddingVertical: SPACING.md, alignItems: 'center' }, style]}>
        <Txt size={12} faint>
          {t('board.noMoves')}
        </Txt>
      </View>
    );
  }

  if (horizontal) {
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', gap: 2, paddingHorizontal: SPACING.sm }}
        style={[{ maxHeight: 40 }, style]}
      >
        {rows.map((row) => (
          <View key={row.no} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Txt size={12} faint style={{ marginRight: 3 }}>
              {row.no}.
            </Txt>
            {row.white ? (
              <Pressable
                onPress={() => onSelect?.(row.white.ply + 1)}
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 6,
                  borderRadius: RADIUS.sm,
                  backgroundColor: cursor === row.white.ply + 1 ? theme.primarySoft : 'transparent',
                }}
              >
                <Txt
                  size={13}
                  weight="700"
                  color={cursor === row.white.ply + 1 ? theme.primary : theme.text}
                >
                  {formatSan(row.white.san, settings.notation, lang)}
                </Txt>
              </Pressable>
            ) : null}
            {row.black ? (
              <Pressable
                onPress={() => onSelect?.(row.black.ply + 1)}
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 6,
                  borderRadius: RADIUS.sm,
                  backgroundColor: cursor === row.black.ply + 1 ? theme.primarySoft : 'transparent',
                }}
              >
                <Txt
                  size={13}
                  weight="700"
                  color={cursor === row.black.ply + 1 ? theme.primary : theme.text}
                >
                  {formatSan(row.black.san, settings.notation, lang)}
                </Txt>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[{ maxHeight }, style]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: SPACING.sm }}
    >
      {rows.map((row, i) => (
        <View
          key={row.no}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 1,
            backgroundColor: i % 2 ? 'transparent' : theme.surfaceAlt + '80',
            borderRadius: RADIUS.sm,
          }}
        >
          <Txt size={12} faint style={{ width: 30, paddingLeft: 6 }}>
            {row.no}.
          </Txt>
          <MoveChip
            move={row.white}
            active={cursor === (row.white?.ply ?? -1) + 1}
            onPress={onSelect}
            notation={settings.notation}
            lang={lang}
          />
          <MoveChip
            move={row.black}
            active={cursor === (row.black?.ply ?? -1) + 1}
            onPress={onSelect}
            notation={settings.notation}
            lang={lang}
          />
        </View>
      ))}
    </ScrollView>
  );
}

export default memo(MoveList);
