import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../src/store/SettingsContext';
import { LanguageList } from '../src/components/LanguagePicker';
import { Button, Txt } from '../src/components/ui';
import { RADIUS, SPACING } from '../src/theme/themes';
import { translate } from '../src/i18n/strings';

/**
 * İlk açılışta bir kez gösterilen dil seçimi.
 *
 * Ekran, seçilen dili anında önizler: başlık ve devam düğmesi listeye
 * dokunduğun anda o dile geçer, böylece onaylamadan önce ne seçtiğini
 * görürsün. Onaydan sonra `langChosen` kaydedilir ve bu ekran bir daha açılmaz.
 */
export default function LanguageOnboarding() {
  const { theme, lang, setLanguage, settings } = useSettings();
  const [picked, setPicked] = useState(lang);

  const tPreview = (key) => translate(picked, key);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: SPACING.lg }}>
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
            <Ionicons name="language" size={28} color={theme.primary} />
          </View>
          <Txt size={22} weight="800" style={{ textAlign: 'center' }}>
            {tPreview('language.pickTitle')}
          </Txt>
          <Txt size={13} faint style={{ textAlign: 'center' }}>
            {tPreview('language.pickSubtitle')}
          </Txt>
        </View>

        <LanguageList selected={picked} onSelect={setPicked} />

        <Button
          title={tPreview('language.continue')}
          onPress={() => {
            setLanguage(picked);
            router.replace(settings.ageChosen ? '/(tabs)' : '/age');
          }}
          style={{ marginTop: SPACING.md }}
        />
      </View>
    </SafeAreaView>
  );
}
