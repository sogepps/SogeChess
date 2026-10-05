import React, { useMemo } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Card, Row, Screen, SectionHeader, Txt } from '../../src/components/ui';
import AdBanner from '../../src/components/AdBanner';
import { useSettings } from '../../src/store/SettingsContext';
import { useLibrary } from '../../src/store/LibraryContext';
import { usePremium } from '../../src/store/PremiumContext';
import { RADIUS, SPACING } from '../../src/theme/themes';
import { gameTitle } from '../../src/chess/pgn';

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting.morning';
  if (h < 18) return 'home.greeting.day';
  return 'home.greeting.evening';
}

/**
 * Ana sayfadaki tek tip özellik kartı. Sabit genişlik yerine ekranı ikiye
 * bölen hesaplanmış ölçü kullanılır; küçük telefon ve tablette düzen değişmez.
 */
function FeatureTile({ width, icon, title, subtitle, tint, badge, onPress }) {
  const { theme } = useSettings();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        minHeight: 132,
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        opacity: pressed ? 0.72 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Row gap={SPACING.sm} style={{ marginBottom: SPACING.md }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: RADIUS.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tint + '20',
          }}
        >
          <Ionicons name={icon} size={21} color={tint} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {badge ? <Badge label={badge} color={tint} /> : null}
        </View>
      </Row>

      <Txt size={15} weight="800" numberOfLines={2} style={{ lineHeight: 19 }}>
        {title}
      </Txt>
      <Txt size={11} faint numberOfLines={2} style={{ lineHeight: 15, marginTop: 4 }}>
        {subtitle}
      </Txt>
    </Pressable>
  );
}

function Stat({ value, label, color }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Txt size={18} weight="800" color={color}>
        {value}
      </Txt>
      <Txt size={10} faint numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

export default function HomeScreen() {
  const { theme, t } = useSettings();
  const { games, stats } = useLibrary();
  const { isPremium } = usePremium();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const tileWidth = Math.floor((screenWidth - SPACING.lg * 2 - SPACING.md) / 2);
  const recent = useMemo(() => games.slice(0, 3), [games]);

  const features = [
    {
      icon: 'hardware-chip',
      title: t('play.vsEngine'),
      subtitle: t('play.startGame'),
      tint: theme.primary,
      route: '/(tabs)/play',
    },
    {
      icon: 'people',
      title: t('play.vsFriend'),
      subtitle: t('play.vsFriendDesc'),
      tint: theme.success,
      route: '/game/play?mode=friend',
    },
    {
      icon: 'timer',
      title: t('clock.title'),
      subtitle: t('clock.tapToStart'),
      tint: theme.accent,
      route: '/(tabs)/clock',
    },
    {
      icon: 'extension-puzzle',
      title: t('puzzles.title'),
      subtitle: t('tools.puzzlesDesc'),
      tint: theme.danger,
      route: '/puzzles',
    },
    {
      icon: 'grid',
      title: t('studio.title'),
      subtitle: t('studio.subtitle'),
      tint: '#8B7CF6',
      route: '/studio?mode=record',
    },
    {
      icon: 'library',
      title: t('openings.title'),
      subtitle: t('openings.study'),
      tint: '#5E9FE6',
      route: '/openings',
    },
    {
      icon: 'albums',
      title: t('library.title'),
      subtitle: t('library.games'),
      tint: '#B77CE8',
      route: '/(tabs)/library',
    },
    {
      icon: 'settings',
      title: t('settings.title'),
      subtitle: t('settings.appearance'),
      tint: theme.textDim,
      route: '/settings',
    },
  ];

  return (
    <Screen scroll tabBar>
      <Row style={{ marginBottom: SPACING.lg }}>
        <View style={{ flex: 1 }}>
          <Txt size={12} faint>
            {t(greetingKey())}
          </Txt>
          <Row gap={8}>
            <Txt size={25} weight="800">
              {t('app.name')}
            </Txt>
            {isPremium ? <Badge label={t('common.premium')} /> : null}
          </Row>
        </View>
        <Pressable
          onPress={() => router.push('/premium')}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: RADIUS.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isPremium ? theme.primarySoft : theme.surface,
            borderWidth: 1,
            borderColor: isPremium ? theme.primary : theme.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons
            name={isPremium ? 'sparkles' : 'diamond-outline'}
            size={19}
            color={isPremium ? theme.primary : theme.accent}
          />
        </Pressable>
      </Row>

      <SectionHeader title={t('home.quickActions')} icon="grid" />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: SPACING.md,
          marginBottom: SPACING.lg,
        }}
      >
        {features.map((item) => (
          <FeatureTile
            key={item.route}
            width={tileWidth}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            tint={item.tint}
            badge={item.badge}
            onPress={() => router.push(item.route)}
          />
        ))}
      </View>

      <Card style={{ marginBottom: SPACING.lg }}>
        <Row gap={SPACING.sm}>
          <Stat value={stats.games} label={t('stats.games')} color={theme.primary} />
          <View style={{ width: 1, height: 34, backgroundColor: theme.border }} />
          <Stat value={stats.wins} label={t('stats.wins')} color={theme.success} />
          <View style={{ width: 1, height: 34, backgroundColor: theme.border }} />
          <Stat value={stats.positions} label={t('stats.positions')} color={theme.accent} />
          <View style={{ width: 1, height: 34, backgroundColor: theme.border }} />
          <Stat
            value={t('unit.percent', { n: stats.winRate })}
            label={t('stats.winRate')}
            color={theme.text}
          />
        </Row>
      </Card>

      <AdBanner placement="home" style={{ marginBottom: SPACING.lg }} />

      {recent.length ? (
        <>
          <SectionHeader
            title={t('home.recentGames')}
            icon="time"
            action={t('home.viewAll')}
            onAction={() => router.push('/(tabs)/library')}
          />
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {recent.map((game, index) => (
              <Pressable
                key={game.id}
                onPress={() => router.push(`/game/${game.id}`)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.md,
                  padding: SPACING.md,
                  borderTopWidth: index ? 1 : 0,
                  borderTopColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: RADIUS.sm,
                    backgroundColor: theme.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="grid-outline" size={17} color={theme.textDim} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={14} weight="700" numberOfLines={1}>
                    {gameTitle(game, t('game.untitled'))}
                  </Txt>
                  <Txt size={11} faint numberOfLines={1}>
                    {game.date || t('result.ongoing')} · {game.moveCount} {t('library.movesAbbr')}
                  </Txt>
                </View>
                <Badge label={game.result} color={theme.textDim} />
                <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
