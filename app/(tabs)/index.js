import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge, Card, EmptyState, Row, Screen, SectionHeader, Txt } from '../../src/components/ui';
import AdBanner from '../../src/components/AdBanner';
import MiniBoard from '../../src/components/MiniBoard';
import { useSettings } from '../../src/store/SettingsContext';
import { useLibrary } from '../../src/store/LibraryContext';
import { usePremium } from '../../src/store/PremiumContext';
import { RADIUS, SPACING } from '../../src/theme/themes';
import { gameTitle } from '../../src/chess/pgn';
import { openingName } from '../../src/chess/openings';

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting.morning';
  if (h < 18) return 'home.greeting.day';
  return 'home.greeting.evening';
}

function StatTile({ label, value, icon, tint }) {
  const { theme } = useSettings();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: theme.border,
        padding: SPACING.md,
        gap: 6,
        minWidth: 84,
      }}
    >
      <Ionicons name={icon} size={16} color={tint || theme.textDim} />
      <Txt size={22} weight="800">
        {value}
      </Txt>
      <Txt size={11} faint>
        {label}
      </Txt>
    </View>
  );
}

function QuickAction({ icon, title, subtitle, onPress, tint }) {
  const { theme } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: '46%',
        backgroundColor: theme.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: theme.border,
        padding: SPACING.lg,
        gap: SPACING.sm,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: RADIUS.md,
          backgroundColor: (tint || theme.primary) + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={19} color={tint || theme.primary} />
      </View>
      <Txt size={15} weight="700">
        {title}
      </Txt>
      <Txt size={11} faint>
        {subtitle}
      </Txt>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { theme, t } = useSettings();
  const { games, stats } = useLibrary();
  const { isPremium } = usePremium();
  const router = useRouter();

  const recent = useMemo(() => games.slice(0, 4), [games]);

  return (
    <Screen scroll tabBar>
      <Row style={{ marginBottom: SPACING.lg }}>
        <View style={{ flex: 1 }}>
          <Txt size={13} faint>
            {t(greetingKey())}
          </Txt>
          <Row gap={8}>
            <Txt size={26} weight="800">
              {t('app.name')}
            </Txt>
            {isPremium ? <Badge label={t('common.premium')} /> : null}
          </Row>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="settings-outline" size={19} color={theme.text} />
        </Pressable>
      </Row>

      <Pressable onPress={() => router.push('/game/play?mode=engine')}>
        <LinearGradient
          colors={[theme.primary, theme.primarySoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: RADIUS.xl,
            padding: SPACING.xl,
            marginBottom: SPACING.lg,
            overflow: 'hidden',
          }}
        >
          <Row>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt size={12} weight="800" color="rgba(255,255,255,0.75)">
                {t('app.tagline').toUpperCase()}
              </Txt>
              <Txt size={21} weight="800" color="#FFFFFF">
                {t('play.vsEngine')}
              </Txt>
              <Txt size={12} color="rgba(255,255,255,0.8)">
                {t('play.startGame')}
              </Txt>
            </View>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </View>
          </Row>
        </LinearGradient>
      </Pressable>

      <SectionHeader title={t('home.quickActions')} icon="flash" />
      <Row wrap gap={SPACING.md} style={{ marginBottom: SPACING.lg }} align="stretch">
        <QuickAction
          icon="timer"
          title={t('clock.title')}
          subtitle={t('clock.tapToStart')}
          tint={theme.accent}
          onPress={() => router.push('/(tabs)/clock')}
        />
        <QuickAction
          icon="create"
          title={t('play.otbRecord')}
          subtitle={t('board.saveGame')}
          tint={theme.success}
          onPress={() => router.push('/game/play?mode=record')}
        />
        <QuickAction
          icon="construct"
          title={t('editor.title')}
          subtitle={t('editor.playFromHere')}
          tint={theme.warning}
          onPress={() => router.push('/editor')}
        />
        <QuickAction
          icon="library"
          title={t('openings.title')}
          subtitle={t('openings.study')}
          tint={theme.primary}
          onPress={() => router.push('/openings')}
        />
      </Row>

      <SectionHeader title={t('home.stats')} icon="stats-chart" />
      <Row gap={SPACING.md} style={{ marginBottom: SPACING.md }} align="stretch">
        <StatTile label={t('stats.games')} value={stats.games} icon="albums-outline" />
        <StatTile
          label={t('stats.wins')}
          value={stats.wins}
          icon="trophy-outline"
          tint={theme.success}
        />
        <StatTile
          label={t('stats.positions')}
          value={stats.positions}
          icon="bookmark-outline"
          tint={theme.accent}
        />
      </Row>
      <Row gap={SPACING.md} style={{ marginBottom: SPACING.lg }} align="stretch">
        <StatTile label={t('stats.draws')} value={stats.draws} icon="remove-outline" />
        <StatTile
          label={t('stats.losses')}
          value={stats.losses}
          icon="close-outline"
          tint={theme.danger}
        />
        <StatTile
          label={t('stats.winRate')}
          value={t('unit.percent', { n: stats.winRate })}
          icon="trending-up-outline"
          tint={theme.primary}
        />
      </Row>

      <AdBanner placement="home" style={{ marginBottom: SPACING.lg }} />

      <SectionHeader
        title={t('home.recentGames')}
        icon="time"
        action={games.length ? t('home.viewAll') : null}
        onAction={() => router.push('/(tabs)/library')}
      />
      {recent.length === 0 ? (
        <Card>
          <EmptyState
            icon="albums-outline"
            title={t('home.noGames')}
            action={t('play.startGame')}
            onAction={() => router.push('/(tabs)/play')}
          />
        </Card>
      ) : (
        <View style={{ gap: SPACING.md }}>
          {recent.map((g) => (
            <Card key={g.id} onPress={() => router.push(`/game/${g.id}`)} padded={false}>
              <Row style={{ padding: SPACING.md }} gap={SPACING.md}>
                <MiniBoard fen={g.finalFen} size={54} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt size={15} weight="700" numberOfLines={1}>
                    {gameTitle(g, t('game.untitled'))}
                  </Txt>
                  <Txt size={11} faint numberOfLines={1}>
                    {[g.event, g.date, g.opening ? openingName(g.opening, t) : null]
                      .filter(Boolean)
                      .join(' · ') || t('common.unknown')}
                  </Txt>
                  <Row gap={6}>
                    <Badge
                      label={g.result}
                      color={
                        g.result === '1-0'
                          ? theme.success
                          : g.result === '0-1'
                          ? theme.danger
                          : theme.textDim
                      }
                    />
                    <Txt size={11} faint>
                      {g.moveCount} {t('stats.moves').toLowerCase()}
                    </Txt>
                  </Row>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textFaint} />
              </Row>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
