import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge, Card, Divider, ListRow, Row, Screen, SectionHeader, Txt } from '../../src/components/ui';
import AdBanner from '../../src/components/AdBanner';
import { useSettings } from '../../src/store/SettingsContext';
import { usePremium } from '../../src/store/PremiumContext';
import { useLibrary } from '../../src/store/LibraryContext';
import { RADIUS, SPACING } from '../../src/theme/themes';

export default function MoreScreen() {
  const { theme, t } = useSettings();
  const { isPremium } = usePremium();
  const { stats } = useLibrary();
  const router = useRouter();

  return (
    <Screen scroll tabBar>
      <Txt size={26} weight="800" style={{ marginBottom: SPACING.lg }}>
        {t('tools.title')}
      </Txt>

      {!isPremium ? (
        <LinearGradient
          colors={[theme.accent, '#B8862A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: RADIUS.xl, marginBottom: SPACING.lg }}
        >
          <Card
            padded={false}
            style={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
            onPress={() => router.push('/premium')}
          >
            <Row style={{ padding: SPACING.lg }} gap={SPACING.md}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="sparkles" size={21} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={17} weight="800" color="#1A1A1A">
                  {t('premium.title')}
                </Txt>
                <Txt size={12} color="rgba(0,0,0,0.65)">
                  {t('premium.subtitle')}
                </Txt>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1A1A1A" />
            </Row>
          </Card>
        </LinearGradient>
      ) : (
        <Card style={{ marginBottom: SPACING.lg }}>
          <Row gap={SPACING.md}>
            <Ionicons name="checkmark-circle" size={26} color={theme.success} />
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="800">
                {t('premium.active')}
              </Txt>
              <Txt size={12} faint>
                {t('premium.subtitle')}
              </Txt>
            </View>
            <Badge label={t('common.premium')} color={theme.success} />
          </Row>
        </Card>
      )}

      <SectionHeader title={t('tools.title')} icon="construct" />
      <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
        <ListRow
          icon="grid"
          title={t('studio.title')}
          subtitle={t('studio.subtitle')}
          onPress={() => router.push('/studio?mode=setup')}
        />
        <Divider />
        <ListRow
          icon="library"
          title={t('tools.openings')}
          subtitle={t('tools.openingsDesc')}
          onPress={() => router.push('/openings')}
        />
        <Divider />
        <ListRow
          icon="extension-puzzle"
          title={t('tools.puzzles')}
          subtitle={t('tools.puzzlesDesc')}
          onPress={() => router.push('/puzzles')}
        />
        <Divider />
        <ListRow
          icon="timer"
          title={t('clock.title')}
          subtitle={t('tools.clockDesc')}
          onPress={() => router.push('/(tabs)/clock')}
        />
      </Card>

      <SectionHeader title={t('home.stats')} icon="stats-chart" />
      <Card style={{ marginBottom: SPACING.lg, gap: SPACING.sm }}>
        <Row>
          <Txt size={13} dim style={{ flex: 1 }}>
            {t('stats.games')}
          </Txt>
          <Txt size={13} weight="700">
            {stats.games}
          </Txt>
        </Row>
        <Row>
          <Txt size={13} dim style={{ flex: 1 }}>
            {t('stats.positions')}
          </Txt>
          <Txt size={13} weight="700">
            {stats.positions}
          </Txt>
        </Row>
        <Row>
          <Txt size={13} dim style={{ flex: 1 }}>
            {t('stats.moves')}
          </Txt>
          <Txt size={13} weight="700">
            {stats.moves}
          </Txt>
        </Row>
        <Row>
          <Txt size={13} dim style={{ flex: 1 }}>
            {t('stats.winRate')}
          </Txt>
          <Txt size={13} weight="700">
            {t('unit.percent', { n: stats.winRate })}
          </Txt>
        </Row>
      </Card>

      <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
        <ListRow icon="settings" title={t('settings.title')} onPress={() => router.push('/settings')} />
        <Divider />
        <ListRow
          icon="information-circle"
          title={t('tools.about')}
          subtitle={`${t('app.name')} · 1.0.0`}
        />
      </Card>

      <AdBanner placement="more" />
    </Screen>
  );
}
