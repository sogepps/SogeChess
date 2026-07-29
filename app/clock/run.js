import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Badge, Row, Txt } from '../../src/components/ui';
import { useSettings } from '../../src/store/SettingsContext';
import { usePremium } from '../../src/store/PremiumContext';
import { maybeShowInterstitial } from '../../src/services/ads';
import { useChessClock } from '../../src/hooks/useChessClock';
import { useConditionalKeepAwake } from '../../src/hooks/useConditionalKeepAwake';
import { CLOCK_PRESETS, formatTime, presetName } from '../../src/chess/clock';
import { RADIUS, SPACING } from '../../src/theme/themes';

export default function ClockRunScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme, settings, t } = useSettings();
  const { isPremium } = usePremium();
  const { width, height } = useWindowDimensions();

  const { control, name } = useMemo(() => {
    if (params.custom) {
      try {
        return {
          control: JSON.parse(String(params.custom)),
          name: String(params.name || t('clock.custom')),
        };
      } catch {
        /* bozuk parametre: hazır ayara düş */
      }
    }
    const preset = CLOCK_PRESETS.find((p) => p.id === params.preset) || CLOCK_PRESETS[4];
    return { control: preset.control, name: presetName(preset, t) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.custom, params.preset, params.name]);

  useConditionalKeepAwake(settings.clockKeepAwake, 'soge-clock');

  const buzz = useCallback(
    (style = Haptics.ImpactFeedbackStyle.Medium) => {
      if (settings.clockHaptics) Haptics.impactAsync(style).catch(() => {});
    },
    [settings.clockHaptics]
  );

  const clock = useChessClock(control, {
    lowTimeThreshold: (settings.clockLowWarning || 10) * 1000,
    onFlag: () => {
      if (settings.clockHaptics)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
    onLowTime: () => buzz(Haptics.ImpactFeedbackStyle.Heavy),
    onMove: () => buzz(Haptics.ImpactFeedbackStyle.Medium),
  });

  const [showStats, setShowStats] = useState(false);

  const landscape = width > height;
  const facing = settings.clockLayout === 'facing' && !landscape;

  const press = (side) => {
    if (clock.flagged) return;
    if (!clock.started) {
      // İlk dokunuş: dokunan oyuncu rakibin saatini başlatır.
      clock.start(side === 'w' ? 'b' : 'w');
      buzz();
      return;
    }
    clock.pressSide(side);
  };

  /**
   * Saatten çıkış. Reklam yalnızca gerçekten bir parti oynandıysa denenir;
   * saati açıp hemen kapatan kullanıcı reklam görmez. Saat çalışırken hiçbir
   * koşulda reklam gösterilmiyor.
   */
  const leaveScreen = useCallback(() => {
    if (clock.started) maybeShowInterstitial(isPremium);
    router.back();
  }, [clock.started, isPremium, router]);

  const confirmReset = () => {
    Alert.alert(t('clock.title'), t('clock.confirmReset'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.reset'), style: 'destructive', onPress: () => clock.reset() },
    ]);
  };

  const sideStats = (side) => {
    const times = clock.moveTimes.filter((m) => m.side === side);
    if (!times.length) return null;
    const total = times.reduce((a, x) => a + x.ms, 0);
    return {
      moves: times.length,
      avg: total / times.length,
      longest: Math.max(...times.map((x) => x.ms)),
    };
  };

  const renderSide = (side) => {
    const ms = clock.remaining[side];
    const isActive = clock.active === side && clock.running;
    const isFlagged = clock.flagged === side;
    const low = ms < (settings.clockLowWarning || 10) * 1000;
    const stats = showStats ? sideStats(side) : null;
    const stages = control?.perSide?.[side]?.stages || control?.stages || [];
    const multiStage = stages.length > 1;

    const bg = isFlagged
      ? theme.danger
      : isActive
      ? low
        ? theme.danger
        : side === 'w'
        ? '#E9E9E4'
        : '#20242B'
      : theme.surface;
    const fg = isFlagged
      ? '#FFFFFF'
      : isActive
      ? low
        ? '#FFFFFF'
        : side === 'w'
        ? '#15181D'
        : '#F2F4F7'
      : theme.textDim;

    const fontSize = Math.min(landscape ? height * 0.32 : width * 0.28, 108);

    return (
      <Pressable
        onPress={() => press(side)}
        style={[
          styles.side,
          {
            backgroundColor: bg,
            transform: facing && side === (settings.clockFlip ? 'w' : 'b') ? [{ rotate: '180deg' }] : undefined,
          },
        ]}
      >
        <Row gap={6} style={{ position: 'absolute', top: SPACING.lg }}>
          <Badge
            label={side === 'w' ? t('common.white') : t('common.black')}
            color={isActive ? fg : theme.textFaint}
          />
          {multiStage ? (
            <Badge
              label={`${t('clock.stages')} ${clock.stageIndex[side] + 1}/${stages.length}`}
              color={isActive ? fg : theme.textFaint}
            />
          ) : null}
        </Row>

        <Txt
          weight="800"
          color={fg}
          style={{ fontSize, fontVariant: ['tabular-nums'], letterSpacing: -2 }}
        >
          {formatTime(ms)}
        </Txt>

        {clock.active === side && clock.delayRemaining > 0 ? (
          <Txt size={14} weight="700" color={fg} style={{ opacity: 0.7 }}>
            {t('clock.delay')} {Math.ceil(clock.delayRemaining / 1000)}
          </Txt>
        ) : null}

        <Row gap={SPACING.md} style={{ position: 'absolute', bottom: SPACING.lg }}>
          <Txt size={12} color={fg} style={{ opacity: 0.65 }}>
            {t('clock.moveCount')} {clock.moveCount[side]}
          </Txt>
          {stats ? (
            <Txt size={12} color={fg} style={{ opacity: 0.65 }}>
              {t('clock.statsAvgMax', {
                avg: (stats.avg / 1000).toFixed(1),
                max: (stats.longest / 1000).toFixed(0),
              })}
            </Txt>
          ) : null}
        </Row>

        {isFlagged ? (
          <View style={styles.flagBadge}>
            <Ionicons name="flag" size={16} color="#FFFFFF" />
            <Txt size={13} weight="800" color="#FFFFFF">
              {t('clock.flagged')}
            </Txt>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    // Saat yatay moda da dönebildiği için dört kenarın da güvenli alanı
    // uygulanıyor; aksi halde çentik/gezinme çubuğu saat panellerini kırpıyor.
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.bg }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={{ flex: 1, flexDirection: landscape ? 'row' : 'column' }}>
        {renderSide('b')}

        <View
          style={[
            styles.bar,
            {
              backgroundColor: theme.bg,
              flexDirection: landscape ? 'column' : 'row',
              paddingHorizontal: landscape ? SPACING.sm : SPACING.lg,
              paddingVertical: landscape ? SPACING.lg : SPACING.sm,
            },
          ]}
        >
          <ControlBtn icon="chevron-back" onPress={leaveScreen} />
          <ControlBtn
            icon={clock.running ? 'pause' : 'play'}
            onPress={() => {
              clock.toggle();
              buzz();
            }}
            highlight
            disabled={!clock.started || !!clock.flagged}
          />
          <ControlBtn icon="arrow-undo" onPress={clock.undoPress} disabled={!clock.moveTimes.length} />
          <ControlBtn icon="refresh" onPress={confirmReset} />
          <ControlBtn
            icon="stats-chart"
            onPress={() => setShowStats((s) => !s)}
            highlight={showStats}
          />
        </View>

        {renderSide('w')}
      </View>

      {!clock.started ? (
        <View pointerEvents="none" style={styles.hint}>
          <View style={[styles.hintPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="hand-left-outline" size={15} color={theme.textDim} />
            <Txt size={12} weight="700" dim>
              {t('clock.tapToStart')} · {name}
            </Txt>
          </View>
        </View>
      ) : null}

      {clock.started && !clock.running && !clock.flagged ? (
        <View pointerEvents="none" style={styles.hint}>
          <View style={[styles.hintPill, { backgroundColor: theme.accent }]}>
            <Ionicons name="pause" size={15} color="#1A1A1A" />
            <Txt size={12} weight="800" color="#1A1A1A">
              {t('clock.paused')}
            </Txt>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function ControlBtn({ icon, onPress, disabled, highlight }) {
  const { theme } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        width: 46,
        height: 46,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: highlight ? theme.primary : theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={highlight ? '#FFFFFF' : theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  side: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.sm,
    borderRadius: RADIUS.xl,
  },
  bar: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    alignItems: 'center',
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  flagBadge: {
    position: 'absolute',
    top: '32%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
});
