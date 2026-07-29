import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSettings } from '../store/SettingsContext';
import { usePremium } from '../store/PremiumContext';
import { Badge, Txt } from './ui';
import { bannerParts } from '../services/ads';
import { RADIUS, SPACING } from '../theme/themes';

/**
 * Reklam yuvası.
 *
 * EAS build'de gerçek AdMob banner'ı (şu an Google test birimi) gösterir.
 * Expo Go'da native modül olmadığı için premium'a yönlendiren kendi tanıtım
 * kutumuza düşer. Reklam yüklenemezse de aynı kutuya düşer, böylece düzen
 * hiçbir zaman boş bir delik bırakmaz.
 *
 * Premium kullanıcıda hiç render edilmez.
 */
export default function AdBanner({ placement = 'generic', style }) {
  const { showAds } = usePremium();
  const [failed, setFailed] = useState(false);
  const parts = bannerParts();

  const onFailed = useCallback(() => setFailed(true), []);

  if (!showAds) return null;
  if (!parts || failed) return <HouseAd style={style} />;

  const { BannerAd, BannerAdSize, unitId, requestOptions } = parts;
  return (
    // Uyarlanabilir banner yüksekliğini genişlikten hesapladığı için sarmalayıcı
    // tam genişlik olmalı.
    <View style={[{ width: '100%', alignItems: 'center', overflow: 'hidden' }, style]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={requestOptions}
        onAdFailedToLoad={onFailed}
      />
    </View>
  );
}

/** Reklam yokken gösterilen kendi tanıtımımız; yuva boyutunu korur. */
function HouseAd({ style }) {
  const { theme, t } = useSettings();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/premium')}
      style={({ pressed }) => [
        {
          height: 58,
          borderRadius: RADIUS.md,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceAlt,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACING.md,
          gap: SPACING.md,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: RADIUS.sm,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="sparkles" size={17} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt size={13} weight="700">
          {t('ads.removeCta')}
        </Txt>
        <Txt size={11} faint>
          {t('premium.subtitle')}
        </Txt>
      </View>
      <Badge label={t('ads.label')} color={theme.textFaint} />
      <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
    </Pressable>
  );
}
