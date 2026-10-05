import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Constants from 'expo-constants';
import { KEYS, readJson, writeJson } from './db';

export const PRODUCTS = [
  {
    id: 'soge_premium_monthly',
    planKey: 'premium.monthly',
    price: '₺49,99',
    period: 'premium.perMonth',
    badge: null,
  },
  {
    id: 'soge_premium_yearly',
    planKey: 'premium.yearly',
    price: '₺299,99',
    period: 'premium.perMonth',
    perMonth: '₺25,00',
    badge: 'premium.bestValue',
    savePct: 50,
  },
  {
    id: 'soge_premium_lifetime',
    planKey: 'premium.lifetime',
    price: '₺699,99',
    period: 'premium.oneTime',
    badge: null,
  },
];

// Ödeme katmanı bir adaptörün arkasında duruyor. Şu an takılı olan adaptör
// TEST adaptörü: mağazaya hiç gitmez, "satın al"a basıldığı anda yetkiyi açar.
// Böylece reklamsız deneyim gerçek bir ödeme kurmadan denenebilir.
//
// Yayına çıkarken yalnızca bu nesneyi gerçek adaptörle (RevenueCat veya
// expo-in-app-purchases) değiştirmek yeterli; uygulamanın geri kalanı aynı
// kalır. `TEST_BILLING` false olduğunda arayüzdeki test rozetleri de kaybolur.
export const TEST_BILLING = true;

const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

// Son verilen yetki; "geri yükle" testinin anlamlı çalışması için tutuluyor.
let lastGranted = null;

const testBilling = {
  available: false,
  async getOfferings() {
    return PRODUCTS;
  },
  async purchase(productId) {
    const lifetime = productId.endsWith('lifetime');
    lastGranted = {
      active: true,
      productId,
      demo: true,
      purchasedAt: Date.now(),
      expiresAt: lifetime
        ? null
        : Date.now() + (productId.endsWith('yearly') ? 365 : 30) * 24 * 3600 * 1000,
    };
    return lastGranted;
  },
  async restore() {
    return lastGranted;
  },
};

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [entitlement, setEntitlement] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await readJson(KEYS.premium, null);
      if (alive) {
        setEntitlement(stored);
        setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isPremium = useMemo(() => {
    if (!entitlement?.active) return false;
    if (entitlement.expiresAt && entitlement.expiresAt < Date.now()) return false;
    return true;
  }, [entitlement]);

  const purchase = useCallback(async (productId) => {
    setBusy(true);
    try {
      const result = await testBilling.purchase(productId);
      setEntitlement(result);
      await writeJson(KEYS.premium, result);
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setBusy(true);
    try {
      const result = await testBilling.restore();
      if (result) {
        setEntitlement(result);
        await writeJson(KEYS.premium, result);
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  const setDemoPremium = useCallback(async (on) => {
    const next = on
      ? { active: true, productId: 'demo', demo: true, purchasedAt: Date.now(), expiresAt: null }
      : null;
    setEntitlement(next);
    await writeJson(KEYS.premium, next);
  }, []);

  const value = useMemo(
    () => ({
      isPremium,
      entitlement,
      loaded,
      busy,
      products: PRODUCTS,
      purchase,
      restore,
      setDemoPremium,
      showAds: !isPremium,
      billingAvailable: testBilling.available,
      isExpoGo,
      testMode: TEST_BILLING,
    }),
    [isPremium, entitlement, loaded, busy, purchase, restore, setDemoPremium]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used inside PremiumProvider');
  return ctx;
}
