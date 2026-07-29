import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Badge,
  Button,
  Card,
  Chip,
  Row,
  Screen,
  SectionHeader,
  Txt,
} from '../../src/components/ui';
import AdBanner from '../../src/components/AdBanner';
import { useSettings } from '../../src/store/SettingsContext';
import { usePremium } from '../../src/store/PremiumContext';
import { DIFFICULTY } from '../../src/chess/engine';
import { CLOCK_PRESETS, presetName } from '../../src/chess/clock';
import { RADIUS, SPACING } from '../../src/theme/themes';

function ModeCard({ icon, title, description, tint, onPress, badge }) {
  const { theme } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: theme.border,
        padding: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.lg,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: RADIUS.md,
          backgroundColor: tint + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={21} color={tint} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Row gap={6}>
          <Txt size={16} weight="700">
            {title}
          </Txt>
          {badge ? <Badge label={badge} /> : null}
        </Row>
        <Txt size={12} faint>
          {description}
        </Txt>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textFaint} />
    </Pressable>
  );
}

export default function PlayScreen() {
  const { theme, t } = useSettings();
  const { isPremium } = usePremium();
  const router = useRouter();

  const [level, setLevel] = useState(2);
  const [side, setSide] = useState('w');
  const [clockId, setClockId] = useState(null);

  const startEngineGame = () => {
    const chosen = side === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : side;
    const params = new URLSearchParams({ mode: 'engine', level: String(level), side: chosen });
    if (clockId) params.set('clock', clockId);
    router.push(`/game/play?${params.toString()}`);
  };

  const quickClocks = CLOCK_PRESETS.filter((p) =>
    ['blitz-3-2', 'blitz-5-3', 'rapid-10-5', 'rapid-15-10'].includes(p.id)
  );

  return (
    <Screen scroll tabBar>
      <Txt size={26} weight="800" style={{ marginBottom: SPACING.lg }}>
        {t('play.title')}
      </Txt>

      <Card style={{ gap: SPACING.lg, marginBottom: SPACING.lg }}>
        <Row>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS.md,
              backgroundColor: theme.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="hardware-chip" size={20} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={17} weight="800">
              {t('play.vsEngine')}
            </Txt>
            <Txt size={12} faint>
              {DIFFICULTY[level].elo} · {t(DIFFICULTY[level].labelKey)}
            </Txt>
          </View>
        </Row>

        <View style={{ gap: SPACING.sm }}>
          <Txt size={12} weight="700" dim>
            {t('play.level')}
          </Txt>
          <Row wrap gap={SPACING.sm}>
            {DIFFICULTY.map((d) => {
              const locked = d.premium && !isPremium;
              return (
                <Chip
                  key={d.id}
                  label={t(d.labelKey)}
                  active={level === d.id}
                  locked={locked}
                  onPress={() => (locked ? router.push('/premium') : setLevel(d.id))}
                />
              );
            })}
          </Row>
        </View>

        <View style={{ gap: SPACING.sm }}>
          <Txt size={12} weight="700" dim>
            {t('play.side')}
          </Txt>
          <Row gap={SPACING.sm}>
            <Chip label={t('common.white')} active={side === 'w'} onPress={() => setSide('w')} />
            <Chip label={t('common.black')} active={side === 'b'} onPress={() => setSide('b')} />
            <Chip
              label={t('play.random')}
              icon="shuffle"
              active={side === 'r'}
              onPress={() => setSide('r')}
            />
          </Row>
        </View>

        <View style={{ gap: SPACING.sm }}>
          <Txt size={12} weight="700" dim>
            {t('play.withClock')}
          </Txt>
          <Row wrap gap={SPACING.sm}>
            <Chip label={t('common.none')} active={!clockId} onPress={() => setClockId(null)} />
            {quickClocks.map((p) => (
              <Chip
                key={p.id}
                label={presetName(p, t)}
                active={clockId === p.id}
                onPress={() => setClockId(p.id)}
              />
            ))}
          </Row>
        </View>

        <Button title={t('play.startGame')} icon="play" onPress={startEngineGame} full size="lg" />
      </Card>

      <SectionHeader title={t('common.all')} icon="apps" />
      <View style={{ gap: SPACING.md, marginBottom: SPACING.lg }}>
        <ModeCard
          icon="people"
          title={t('play.vsFriend')}
          description={t('play.vsFriendDesc')}
          tint={theme.success}
          onPress={() => router.push('/game/play?mode=friend')}
        />
        <ModeCard
          icon="create"
          title={t('play.otbRecord')}
          description={t('play.otbRecordDesc')}
          tint={theme.accent}
          onPress={() => router.push('/game/play?mode=record')}
        />
        <ModeCard
          icon="analytics"
          title={t('play.analyse')}
          description={t('play.analyseDesc')}
          tint={theme.primary}
          onPress={() => router.push('/game/play?mode=analysis')}
        />
        <ModeCard
          icon="construct"
          title={t('play.fromPosition')}
          description={t('play.fromPositionDesc')}
          tint={theme.warning}
          onPress={() => router.push('/editor')}
        />
        <ModeCard
          icon="extension-puzzle"
          title={t('puzzles.title')}
          description={t('play.puzzlesDesc')}
          tint={theme.danger}
          badge={isPremium ? null : t('common.premium')}
          onPress={() => router.push('/puzzles')}
        />
      </View>

      <AdBanner placement="play" />
    </Screen>
  );
}
