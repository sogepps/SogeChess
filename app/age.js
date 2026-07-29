import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../src/store/SettingsContext';
import { AGE_BANDS } from '../src/i18n/age';
import { Button, Txt } from '../src/components/ui';
import { RADIUS, SPACING } from '../src/theme/themes';

/**
 * Nötr yaş seçimi — Play Families / karışık kitle zorunluluğu.
 *
 * "Çocuk musun?" diye sormuyoruz; kullanıcı kendi yaş bandını seçiyor.
 * Seçim bir kez kaydedilir; reklam SDK'sı bundan sonra doğru muameleyle açılır.
 * Ayarlardan sonradan değiştirilebilir (veli / cihaz paylaşımı için).
 */
export default function AgeOnboarding() {
  const { theme, t, setAgeBand, settings, isRTL } = useSettings();
  const [picked, setPicked] = useState(settings.ageBand || 'adult');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: SPACING.lg, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xl }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: RADIUS.lg,
              backgroundColor: theme.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="people" size={28} color={theme.primary} />
          </View>
          <Txt size={22} weight="800" style={{ textAlign: 'center' }}>
            {t('age.pickTitle')}
          </Txt>
          <Txt size={13} faint style={{ textAlign: 'center', lineHeight: 19 }}>
            {t('age.pickSubtitle')}
          </Txt>
        </View>

        <View style={{ gap: SPACING.sm, marginBottom: SPACING.xl }}>
          {AGE_BANDS.map((band) => {
            const active = picked === band.id;
            return (
              <Pressable
                key={band.id}
                onPress={() => setPicked(band.id)}
                style={({ pressed }) => ({
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: SPACING.md,
                  paddingVertical: SPACING.lg,
                  paddingHorizontal: SPACING.lg,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: active ? theme.primary : theme.border,
                  backgroundColor: active ? theme.primarySoft : theme.surface,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Txt size={17} weight="800" color={active ? theme.primary : theme.text}>
                    {t(`age.band.${band.id}`)}
                  </Txt>
                  <Txt size={12} faint style={{ marginTop: 2 }}>
                    {t(`age.band.${band.id}.hint`)}
                  </Txt>
                </View>
                {active ? <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Txt size={11} faint style={{ textAlign: 'center', marginBottom: SPACING.md, lineHeight: 16 }}>
          {t('age.privacyNote')}
        </Txt>

        <Button
          title={t('age.continue')}
          onPress={() => {
            setAgeBand(picked);
            router.replace('/(tabs)');
          }}
        />
      </View>
    </SafeAreaView>
  );
}
