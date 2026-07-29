import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Alt kenar boşluğu hesapları.
 *
 * Android 15+ (ve Expo SDK 54) uygulamayı zorunlu olarak edge-to-edge çizer:
 * içerik sistem çubuklarının *altına* uzanır. Samsung gibi 3 tuşlu gezinme
 * çubuğu kullanan cihazlarda bu çubuk ~48dp yer kaplar ve boşluk elle
 * bırakılmazsa en alttaki butonlar/satırlar çubuğun altında kalıp tıklanamaz
 * hale gelir. Jest çubuğunda bu değer ~16dp, iPhone'larda ~34dp'dir.
 *
 * Buradaki yardımcılar tek doğruluk kaynağıdır; ekranlar sabit sayı yazmaz.
 */

// Gezinme çubuğu hiç yoksa bile içerik ekranın en dibine yapışmasın.
const MIN_BOTTOM = Platform.OS === 'android' ? 12 : 8;

// Sekme çubuğunun sistem çubuğu hariç yüksekliği.
export const TAB_BAR_BASE_HEIGHT = 58;

/** Ekranın altına bırakılması gereken güvenli boşluk. */
export function useBottomInset(extra = 0) {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, MIN_BOTTOM) + extra;
}

/** Sekme çubuğunun gerçek (sistem çubuğu dahil) yüksekliği. */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 0);
}

/**
 * Sekmeli ekranlarda kaydırılabilir içeriğin altına eklenecek boşluk:
 * sekme çubuğu + sistem çubuğu + biraz nefes payı.
 */
export function useTabContentPadding(extra = 16) {
  return useTabBarHeight() + extra;
}

/** Ekranın altına sabitlenmiş bir çubuk (buton barı vb.) için padding. */
export function useStickyBarPadding(base = 12) {
  const insets = useSafeAreaInsets();
  return base + Math.max(insets.bottom, 0);
}
