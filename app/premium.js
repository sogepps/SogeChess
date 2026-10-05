import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge, Button, Card, IconButton, Row, Txt } from '../src/components/ui';
import { useSettings } from '../src/store/SettingsContext';
import { usePremium } from '../src/store/PremiumContext';
import { RADIUS, SPACING } from '../src/theme/themes';

const PERKS = [
  { icon: 'ban', key: 'noAds' },
];

export default function PremiumScreen() {
  const { theme, t } = useSettings();
  const { isPremium, products, purchase, restore, busy, setDemoPremium, testMode, entitlement } =
    usePremium();
  const router = useRouter();
  const [plan, setPlan] = useState('soge_premium_yearly');

  const onSubscribe = async () => {
    const result = await purchase(plan);
    if (result?.active) {
      Alert.alert(t('premium.title'), t('premium.active'), [
        { text: t('common.done'), onPress: () => router.back() },
      ]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <Row style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm }}>
        <View style={{ flex: 1 }} />
        <IconButton name="close" onPress={() => router.back()} />
      </Row>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[theme.accent, '#A9761F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: RADIUS.xl,
            padding: SPACING.xl,
            alignItems: 'center',
            gap: SPACING.sm,
            marginBottom: SPACING.xl,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(255,255,255,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles" size={28} color="#FFFFFF" />
          </View>
          <Txt size={23} weight="800" color="#161616">
            {t('premium.title')}
          </Txt>
          <Txt size={13} color="rgba(0,0,0,0.7)" style={{ textAlign: 'center' }}>
            {t('premium.subtitle')}
          </Txt>
          {isPremium ? <Badge label={t('premium.active')} color="#1A1A1A" /> : null}
        </LinearGradient>

        <View style={{ gap: SPACING.md, marginBottom: SPACING.xl }}>
          {PERKS.map((perk) => (
            <Row key={perk.key} gap={SPACING.md} align="flex-start">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: RADIUS.md,
                  backgroundColor: theme.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={perk.icon} size={17} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={15} weight="700">
                  {t(`premium.perk.${perk.key}`)}
                </Txt>
                <Txt size={12} faint>
                  {t(`premium.perk.${perk.key}.desc`)}
                </Txt>
              </View>
            </Row>
          ))}
        </View>

        {!isPremium ? (
          <>
            <View style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
              {products.map((p) => {
                const active = plan === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPlan(p.id)}
                    style={{
                      borderRadius: RADIUS.lg,
                      borderWidth: 2,
                      borderColor: active ? theme.primary : theme.border,
                      backgroundColor: active ? theme.primarySoft : theme.surface,
                      padding: SPACING.lg,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: SPACING.md,
                    }}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={active ? theme.primary : theme.textFaint}
                    />
                    <View style={{ flex: 1 }}>
                      <Row gap={6}>
                        <Txt size={16} weight="800">
                          {t(p.planKey)}
                        </Txt>
                        {p.badge ? <Badge label={t(p.badge)} color={theme.success} /> : null}
                      </Row>
                      {p.perMonth ? (
                        <Txt size={12} faint>
                          {p.perMonth} {t('premium.perMonth')}
                          {p.savePct ? ` · ${t('premium.savePct', { n: p.savePct })}` : ''}
                        </Txt>
                      ) : (
                        <Txt size={12} faint>
                          {t(p.period)}
                        </Txt>
                      )}
                    </View>
                    <Txt size={17} weight="800">
                      {p.price}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>

            <Button
              title={t('premium.subscribe')}
              icon="sparkles"
              variant="accent"
              size="lg"
              full
              loading={busy}
              onPress={onSubscribe}
            />
            <Button
              title={t('premium.restore')}
              variant="ghost"
              onPress={async () => {
                const r = await restore();
                if (!r) Alert.alert(t('premium.restore'), t('premium.devNote'));
              }}
              full
              style={{ marginTop: SPACING.sm }}
            />
          </>
        ) : (
          <Card style={{ alignItems: 'center', gap: SPACING.sm }}>
            <Ionicons name="checkmark-circle" size={26} color={theme.success} />
            <Txt size={15} weight="800">
              {t('premium.active')}
            </Txt>
            <Txt size={12} faint style={{ textAlign: 'center' }}>
              {t('premium.subtitle')}
            </Txt>
          </Card>
        )}

        {/* Test adaptörü takılıyken mağazaya hiç gidilmiyor: hangi plana
            basılırsa basılsın premium anında açılıyor. Aşağıdaki kart bunu
            açıkça söylüyor ve premium'u tekrar kapatmayı sağlıyor, böylece
            reklamlı/reklamsız akış aynı build içinde denenebiliyor. */}
        {testMode ? (
          <Card style={{ marginTop: SPACING.xl, gap: SPACING.md }}>
            <Row gap={SPACING.sm} align="flex-start">
              <Ionicons name="flask" size={18} color={theme.warning} />
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={6}>
                  <Txt size={13} weight="800">
                    {t('premium.testMode')}
                  </Txt>
                  <Badge label={t('premium.badgeTest')} color={theme.warning} />
                </Row>
                <Txt size={12} faint style={{ lineHeight: 18 }}>
                  {t('premium.testModeNote')}
                </Txt>
              </View>
            </Row>
            <Button
              title={isPremium ? t('premium.demoDeactivate') : t('premium.demoActivate')}
              variant="secondary"
              size="sm"
              full
              onPress={() => setDemoPremium(!isPremium)}
            />
          </Card>
        ) : null}

        {entitlement?.demo ? (
          <Txt size={11} faint style={{ marginTop: SPACING.lg, textAlign: 'center' }}>
            {t('premium.testGrantActive')}
          </Txt>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
