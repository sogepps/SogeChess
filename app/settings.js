import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  ListRow,
  Row,
  SectionHeader,
  Sheet,
  ToggleRow,
  Txt,
} from '../src/components/ui';
import MiniBoard from '../src/components/MiniBoard';
import Piece from '../src/components/Piece';
import { PIECE_SETS } from '../src/components/Piece';
import { useSettings } from '../src/store/SettingsContext';
import { usePremium } from '../src/store/PremiumContext';
import { useLibrary } from '../src/store/LibraryContext';
import { BOARD_THEMES, RADIUS, SPACING, UI_THEMES } from '../src/theme/themes';
import { languageInfo } from '../src/i18n/languages';
import { AGE_BANDS } from '../src/i18n/age';
import { LanguageList } from '../src/components/LanguagePicker';
import {
  NOTATION_STYLES,
  hasLocalizedNotation,
  localizedNotationSample,
} from '../src/chess/notation';
import { storageFootprint } from '../src/store/db';
import { restoreBackupFromUri, shareBackup } from '../src/services/share';
import { errorMessage } from '../src/i18n/errors';
import { updateAdsAudience } from '../src/services/ads';
import { useBottomInset } from '../src/hooks/useSafeLayout';

const NOTATION_LABELS = {
  san: 'settings.notation.san',
  figurine: 'settings.notation.figurine',
  localized: 'settings.notation.localized',
};

export default function SettingsScreen() {
  const { theme, settings, update, t, lang, setLanguage, setAgeBand, resetSettings } = useSettings();
  const { isPremium } = usePremium();
  const { wipe, refresh } = useLibrary();
  const router = useRouter();
  const bottomPad = useBottomInset(SPACING.xxl);

  const [footprint, setFootprint] = useState(null);
  const [langSheet, setLangSheet] = useState(false);
  const [ageSheet, setAgeSheet] = useState(false);

  const loadFootprint = useCallback(async () => {
    setFootprint(await storageFootprint());
  }, []);

  useEffect(() => {
    loadFootprint();
  }, [loadFootprint]);

  const requirePremium = () => router.push('/premium');

  const doBackup = async () => {
    try {
      await shareBackup(t);
    } catch (err) {
      Alert.alert(t('settings.exportBackup'), errorMessage(err, t));
    }
  };

  const doRestore = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.length) return;
      const result = await restoreBackupFromUri(picked.assets[0].uri, { merge: true });
      await refresh();
      await loadFootprint();
      Alert.alert(
        t('settings.importBackup'),
        t('settings.restoreDone', { games: result.games, positions: result.positions })
      );
    } catch (err) {
      Alert.alert(t('settings.importBackup'), errorMessage(err, t));
    }
  };

  const doWipe = () => {
    Alert.alert(t('settings.clearAll'), t('settings.clearAllWarn'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await wipe();
          resetSettings();
          await loadFootprint();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <Row style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <IconButton name="chevron-back" onPress={() => router.back()} />
        <Txt size={18} weight="800" style={{ flex: 1, marginLeft: SPACING.sm }}>
          {t('settings.title')}
        </Txt>
      </Row>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title={t('settings.appearance')} icon="color-palette" />

        <Card style={{ marginBottom: SPACING.md, gap: SPACING.md }}>
          <Txt size={12} weight="700" dim>
            {t('settings.uiTheme')}
          </Txt>
          <Row wrap gap={SPACING.sm}>
            {Object.values(UI_THEMES).map((th) => (
              <Pressable
                key={th.key}
                onPress={() => update({ uiTheme: th.key })}
                style={{
                  width: 68,
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 44,
                    borderRadius: RADIUS.md,
                    backgroundColor: th.bg,
                    borderWidth: settings.uiTheme === th.key ? 2.5 : 1,
                    borderColor: settings.uiTheme === th.key ? theme.primary : theme.border,
                    padding: 5,
                    gap: 3,
                  }}
                >
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: th.surface }} />
                  <View
                    style={{ height: 6, width: '60%', borderRadius: 3, backgroundColor: th.primary }}
                  />
                  <View style={{ height: 6, width: '40%', borderRadius: 3, backgroundColor: th.accent }} />
                </View>
                <Txt size={10} faint>
                  {t(th.nameKey)}
                </Txt>
              </Pressable>
            ))}
          </Row>
        </Card>

        <Card style={{ marginBottom: SPACING.md, gap: SPACING.md }}>
          <Row>
            <Txt size={12} weight="700" dim style={{ flex: 1 }}>
              {t('settings.boardTheme')}
            </Txt>
            <MiniBoard size={40} />
          </Row>
          <Row wrap gap={SPACING.sm}>
            {Object.values(BOARD_THEMES).map((bt) => {
              const locked = bt.premium && !isPremium;
              const active = settings.boardTheme === bt.key;
              return (
                <Pressable
                  key={bt.key}
                  onPress={() => (locked ? requirePremium() : update({ boardTheme: bt.key }))}
                  style={{ width: 62, alignItems: 'center', gap: 5 }}
                >
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: RADIUS.md,
                      overflow: 'hidden',
                      borderWidth: active ? 2.5 : 1,
                      borderColor: active ? theme.primary : theme.border,
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      opacity: locked ? 0.55 : 1,
                    }}
                  >
                    {Array.from({ length: 16 }).map((_, i) => {
                      const r = Math.floor(i / 4);
                      const c = i % 4;
                      return (
                        <View
                          key={i}
                          style={{
                            width: '25%',
                            height: '25%',
                            backgroundColor: (r + c) % 2 === 0 ? bt.light : bt.dark,
                          }}
                        />
                      );
                    })}
                  </View>
                  <Row gap={3}>
                    {locked ? <Ionicons name="lock-closed" size={9} color={theme.accent} /> : null}
                    <Txt size={9} faint numberOfLines={1}>
                      {t(bt.nameKey)}
                    </Txt>
                  </Row>
                </Pressable>
              );
            })}
          </Row>
        </Card>

        <Card style={{ marginBottom: SPACING.md, gap: SPACING.md }}>
          <Txt size={12} weight="700" dim>
            {t('settings.pieceSet')}
          </Txt>
          <Row wrap gap={SPACING.md}>
            {Object.values(PIECE_SETS).map((ps) => {
              const locked = ps.premium && !isPremium;
              const active = settings.pieceSet === ps.key;
              return (
                <Pressable
                  key={ps.key}
                  onPress={() => (locked ? requirePremium() : update({ pieceSet: ps.key }))}
                  style={{
                    alignItems: 'center',
                    gap: 4,
                    padding: SPACING.sm,
                    borderRadius: RADIUS.md,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? theme.primary : theme.border,
                    backgroundColor: theme.surfaceAlt,
                    opacity: locked ? 0.6 : 1,
                  }}
                >
                  <Row gap={0}>
                    <Piece type="k" color="w" size={30} set={ps.key} />
                    <Piece type="n" color="b" size={30} set={ps.key} />
                  </Row>
                  <Row gap={3}>
                    {locked ? <Ionicons name="lock-closed" size={9} color={theme.accent} /> : null}
                    <Txt size={10} faint>
                      {t(ps.nameKey)}
                    </Txt>
                  </Row>
                </Pressable>
              );
            })}
          </Row>
        </Card>

        <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          <ToggleRow
            icon="grid-outline"
            label={t('settings.coordinates')}
            value={settings.coordinates}
            onValueChange={(v) => update({ coordinates: v })}
          />
          <Divider />
          <ToggleRow
            icon="ellipse-outline"
            label={t('settings.showLegalMoves')}
            value={settings.showLegalMoves}
            onValueChange={(v) => update({ showLegalMoves: v })}
          />
          <Divider />
          <ToggleRow
            icon="color-wand-outline"
            label={t('settings.highlightLastMove')}
            value={settings.highlightLastMove}
            onValueChange={(v) => update({ highlightLastMove: v })}
          />
          <Divider />
          <ToggleRow
            icon="sparkles-outline"
            label={t('settings.animations')}
            value={settings.animations}
            onValueChange={(v) => update({ animations: v })}
          />
          <Divider />
          <ToggleRow
            icon="analytics-outline"
            label={t('settings.showEvalBar')}
            value={settings.showEvalBar}
            onValueChange={(v) => update({ showEvalBar: v })}
          />
        </Card>

        <SectionHeader title={t('settings.gameplay')} icon="game-controller" />
        <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
          <ToggleRow
            icon="phone-portrait-outline"
            label={t('clock.haptics')}
            value={settings.haptics}
            onValueChange={(v) => update({ haptics: v })}
          />
          <Divider />
          <ToggleRow
            icon="flash-outline"
            label={t('settings.autoPromoteQueen')}
            value={settings.autoPromoteQueen}
            onValueChange={(v) => update({ autoPromoteQueen: v })}
          />
          <Divider />
          <ToggleRow
            icon="swap-vertical"
            label={t('settings.autoFlip')}
            description={t('settings.autoFlipDesc')}
            value={settings.autoFlip}
            onValueChange={(v) => update({ autoFlip: v })}
          />
        </Card>

        <Card style={{ marginBottom: SPACING.md, gap: SPACING.sm }}>
          <Txt size={12} weight="700" dim>
            {t('settings.notation')}
          </Txt>
          <Row wrap gap={SPACING.sm}>
            {/* Seçili dilin kendi taş harfleri yoksa "yerel" seçeneği anlamsız olur. */}
            {NOTATION_STYLES.filter(
              (n) => n !== 'localized' || hasLocalizedNotation(lang)
            ).map((n) => (
              <Chip
                key={n}
                label={t(
                  NOTATION_LABELS[n],
                  n === 'localized' ? { sample: localizedNotationSample(lang) } : undefined
                )}
                active={settings.notation === n}
                onPress={() => update({ notation: n })}
              />
            ))}
          </Row>
        </Card>

        <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          <ListRow
            icon="language"
            title={t('settings.language')}
            subtitle={settings.lang ? languageInfo(lang)?.label : t('settings.languageAuto')}
            onPress={() => setLangSheet(true)}
          />
          <Divider />
          <ListRow
            icon="people-outline"
            title={t('settings.ageBand')}
            subtitle={
              settings.ageBand ? t(`age.band.${settings.ageBand}`) : t('settings.ageBandUnset')
            }
            onPress={() => setAgeSheet(true)}
          />
        </Card>

        <SectionHeader title={t('settings.data')} icon="server" />
        <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          <ListRow
            icon="cloud-upload-outline"
            title={t('settings.exportBackup')}
            subtitle={t('settings.exportBackupDesc')}
            onPress={doBackup}
          />
          <Divider />
          <ListRow
            icon="cloud-download-outline"
            title={t('settings.importBackup')}
            subtitle={t('settings.importBackupDesc')}
            onPress={doRestore}
          />
          <Divider />
          <ListRow
            icon="pie-chart-outline"
            title={t('settings.storageUsed')}
            right={
              <Txt size={13} faint>
                {footprint ? `${(footprint.bytes / 1024).toFixed(0)} KB` : '…'}
              </Txt>
            }
          />
          <Divider />
          <ListRow icon="trash-outline" title={t('settings.clearAll')} danger onPress={doWipe} />
        </Card>

        <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
          <ListRow
            icon="sparkles"
            title={t('common.premium')}
            subtitle={isPremium ? t('premium.active') : t('premium.subtitle')}
            right={isPremium ? <Badge label={t('premium.active')} color={theme.success} /> : undefined}
            onPress={() => router.push('/premium')}
          />
        </Card>

        <Txt size={11} faint style={{ textAlign: 'center', marginTop: SPACING.xl }}>
          {t('app.name')} 1.0.0
        </Txt>
      </ScrollView>

      <Sheet
        visible={langSheet}
        onClose={() => setLangSheet(false)}
        title={t('settings.language')}
        height="80%"
      >
        {/* Liste kendi kaydırmasını yönetiyor; Sheet'in ScrollView'i içinde
            yüksekliği sabitlemezsek FlatList çökmüş görünür. */}
        <View style={{ height: 460 }}>
          <LanguageList
            selected={settings.lang}
            autoOption
            onSelect={(code) => {
              setLanguage(code);
              setLangSheet(false);
            }}
          />
        </View>
      </Sheet>

      <Sheet visible={ageSheet} onClose={() => setAgeSheet(false)} title={t('settings.ageBand')}>
        <Txt size={13} faint style={{ marginBottom: SPACING.md, lineHeight: 18 }}>
          {t('age.pickSubtitle')}
        </Txt>
        <View style={{ gap: SPACING.sm }}>
          {AGE_BANDS.map((band) => {
            const active = settings.ageBand === band.id;
            return (
              <ListRow
                key={band.id}
                title={t(`age.band.${band.id}`)}
                subtitle={t(`age.band.${band.id}.hint`)}
                onPress={() => {
                  setAgeBand(band.id);
                  updateAdsAudience(band.id);
                  setAgeSheet(false);
                }}
                right={
                  active ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  ) : undefined
                }
              />
            );
          })}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
