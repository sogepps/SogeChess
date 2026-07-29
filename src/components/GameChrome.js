import React, { memo, useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import Piece from './Piece';
import { Txt } from './ui';
import { useSettings } from '../store/SettingsContext';
import { useBottomInset } from '../hooks/useSafeLayout';
import { evalToBarRatio, formatEval } from '../chess/engine';
import { formatTime } from '../chess/clock';
import { PIECE_VALUES } from '../chess/core';
import { pieceName } from '../chess/notation';
import { RADIUS, SPACING } from '../theme/themes';

/** Tahtanın yanındaki dikey değerlendirme çubuğu. */
export const EvalBar = memo(function EvalBar({ score, height, width = 12, flipped }) {
  const ratio = evalToBarRatio(score);
  const whiteShare = useSharedValue(ratio);

  // Paylaşılan değere render sırasında yazmak Reanimated'de uyarı üretir.
  useEffect(() => {
    whiteShare.value = withTiming(ratio, { duration: 250 });
  }, [ratio, whiteShare]);

  const style = useAnimatedStyle(() => {
    const share = flipped ? 1 - whiteShare.value : whiteShare.value;
    return { height: `${share * 100}%` };
  });

  return (
    <View
      style={{
        width,
        height,
        borderRadius: width / 2,
        overflow: 'hidden',
        backgroundColor: '#2C2C30',
        justifyContent: flipped ? 'flex-start' : 'flex-end',
      }}
    >
      <Animated.View style={[{ width: '100%', backgroundColor: '#F0F0EC' }, style]} />
    </View>
  );
});

/** Oyuncu şeridi: isim, yenen taşlar, materyal farkı ve saat. */
export const PlayerStrip = memo(function PlayerStrip({
  name,
  color,
  captured = [],
  advantage = 0,
  clockMs,
  clockActive,
  lowTime,
  thinking,
  compact,
}) {
  const { theme, settings } = useSettings();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: compact ? 4 : SPACING.sm,
        paddingHorizontal: SPACING.sm,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: color === 'w' ? '#F2F2EE' : '#26262A',
          borderWidth: 1.5,
          borderColor: theme.border,
        }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt size={14} weight="700" numberOfLines={1}>
            {name}
          </Txt>
          {thinking ? <Ionicons name="ellipsis-horizontal" size={14} color={theme.primary} /> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 16 }}>
          {captured.map((type, i) => (
            <View key={`${type}-${i}`} style={{ marginLeft: i === 0 ? 0 : -6 }}>
              <Piece
                type={type}
                color={color === 'w' ? 'b' : 'w'}
                size={15}
                set={settings.pieceSet}
              />
            </View>
          ))}
          {advantage > 0 ? (
            <Txt size={11} faint style={{ marginLeft: 4 }}>
              +{advantage}
            </Txt>
          ) : null}
        </View>
      </View>
      {clockMs != null ? (
        <View
          style={{
            paddingHorizontal: SPACING.md,
            paddingVertical: 6,
            borderRadius: RADIUS.md,
            minWidth: 84,
            alignItems: 'center',
            backgroundColor: clockActive
              ? lowTime
                ? theme.danger
                : theme.primary
              : theme.surfaceAlt,
          }}
        >
          <Txt
            size={18}
            weight="800"
            color={clockActive ? '#FFFFFF' : lowTime ? theme.danger : theme.text}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatTime(clockMs)}
          </Txt>
        </View>
      ) : null}
    </View>
  );
});

/** Terfi taşı seçimi. */
export const PromotionSheet = memo(function PromotionSheet({ visible, color, onSelect, onCancel }) {
  const { theme, settings, t } = useSettings();
  const options = ['q', 'r', 'b', 'n'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={onCancel}
      >
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: RADIUS.xl,
            borderWidth: 1,
            borderColor: theme.border,
            padding: SPACING.lg,
            gap: SPACING.md,
          }}
        >
          <Txt size={13} weight="800" dim style={{ textAlign: 'center' }}>
            {t('board.promotion')}
          </Txt>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            {options.map((type) => (
              <Pressable
                key={type}
                onPress={() => onSelect(type)}
                style={({ pressed }) => ({
                  width: 68,
                  height: 84,
                  borderRadius: RADIUS.md,
                  backgroundColor: pressed ? theme.primarySoft : theme.surfaceAlt,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                })}
              >
                <Piece type={type} color={color} size={46} set={settings.pieceSet} />
                <Txt size={10} faint>
                  {pieceName(type, t)}
                </Txt>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
});

/** Parti sonu kartı. */
export const GameOverCard = memo(function GameOverCard({
  visible,
  title,
  detail,
  onRematch,
  onSave,
  onAnalyse,
  onClose,
  saved,
}) {
  const { theme, t } = useSettings();
  // Kart ekranın altına yaslandığı için gezinme çubuğunun üstünde kalmalı.
  const bottomInset = useBottomInset(SPACING.lg);
  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: SPACING.lg,
        right: SPACING.lg,
        bottom: bottomInset,
        backgroundColor: theme.surface,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: theme.border,
        padding: SPACING.lg,
        gap: SPACING.md,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.accent + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="flag" size={19} color={theme.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={17} weight="800">
            {title}
          </Txt>
          {detail ? (
            <Txt size={12} faint>
              {detail}
            </Txt>
          ) : null}
        </View>
        <Pressable onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={20} color={theme.textFaint} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        {onSave ? (
          <Pressable
            onPress={onSave}
            disabled={saved}
            style={{
              flex: 1,
              height: 42,
              borderRadius: RADIUS.md,
              backgroundColor: saved ? theme.surfaceAlt : theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Ionicons
              name={saved ? 'checkmark' : 'save'}
              size={16}
              color={saved ? theme.success : '#FFF'}
            />
            <Txt size={14} weight="700" color={saved ? theme.success : '#FFF'}>
              {saved ? t('common.done') : t('board.saveGame')}
            </Txt>
          </Pressable>
        ) : null}
        {onRematch ? (
          <Pressable
            onPress={onRematch}
            style={{
              flex: 1,
              height: 42,
              borderRadius: RADIUS.md,
              backgroundColor: theme.surfaceAlt,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Ionicons name="refresh" size={16} color={theme.text} />
            <Txt size={14} weight="700">
              {t('common.new')}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

/** Değerlendirme rozetinin metni. */
export function evalLabel(score) {
  return formatEval(score);
}

export function materialAdvantage(captured, opponentCaptured) {
  const sum = (list) => list.reduce((acc, type) => acc + PIECE_VALUES[type], 0);
  return Math.max(0, sum(captured) - sum(opponentCaptured));
}
