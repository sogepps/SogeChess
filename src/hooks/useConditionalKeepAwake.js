import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

/**
 * Ekranı yalnızca `enabled` doğruyken açık tutar.
 *
 * expo-keep-awake'in `useKeepAwake` hook'u koşulsuzdur: bir kez çağrıldığında
 * ekran hep açık kalır. Saat çalışmıyorken pili boşuna tüketmemek için
 * etkinleştirmeyi kendimiz yönetiyoruz.
 */
export function useConditionalKeepAwake(enabled, tag = 'soge-chess') {
  useEffect(() => {
    if (!enabled) return undefined;
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [enabled, tag]);
}
