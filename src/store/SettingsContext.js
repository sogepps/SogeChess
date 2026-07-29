import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import { KEYS, readJson, writeJson } from './db';
import { translate } from '../i18n/strings';
import { isRtl, matchDeviceLanguage } from '../i18n/languages';
import { isChildAudience } from '../i18n/age';
import { getUiTheme, getBoardTheme } from '../theme/themes';

function deviceLang() {
  try {
    return matchDeviceLanguage(getLocales());
  } catch {
    return 'en';
  }
}

export const DEFAULT_SETTINGS = {
  // null => cihaz dilini kullan. Kullanıcı ilk açılışta seçim yapınca
  // `langChosen` true olur ve seçim ekranı bir daha gösterilmez.
  lang: null,
  langChosen: false,
  // Karışık kitle: 'under13' | 'teen' | 'adult'. Seçilmeden reklam açılmaz.
  ageBand: null,
  ageChosen: false,
  uiTheme: 'midnight',
  boardTheme: 'classic',
  pieceSet: 'classic',
  coordinates: true,
  showLegalMoves: true,
  highlightLastMove: true,
  animations: true,
  sounds: true,
  haptics: true,
  confirmMoves: false,
  autoPromoteQueen: false,
  notation: 'san',
  // Friend / OTB'de hamle sonrası tahtayı sıradaki oyuncuya çevir.
  autoFlip: true,
  showEvalBar: true,
  clockSound: true,
  clockHaptics: true,
  clockLowWarning: 10,
  clockKeepAwake: true,
  clockLayout: 'facing',
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await readJson(KEYS.settings, null);
      if (alive) {
        if (stored) setSettings({ ...DEFAULT_SETTINGS, ...stored });
        setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJson(KEYS.settings, next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    // Dil ve yaş seçimi korunur — sıfırlama gizlilik/onboarding'i bozmasın.
    const next = {
      ...DEFAULT_SETTINGS,
      lang: settings.lang,
      langChosen: settings.langChosen,
      ageBand: settings.ageBand,
      ageChosen: settings.ageChosen,
    };
    setSettings(next);
    writeJson(KEYS.settings, next);
  }, [settings.lang, settings.langChosen, settings.ageBand, settings.ageChosen]);

  const setLanguage = useCallback(
    (code) => {
      update({ lang: code, langChosen: true });
    },
    [update]
  );

  const setAgeBand = useCallback(
    (band) => {
      update({ ageBand: band, ageChosen: true });
    },
    [update]
  );

  const lang = settings.lang || deviceLang();
  const rtl = isRtl(lang);

  useEffect(() => {
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    }
  }, [rtl]);

  const t = useCallback((key, params) => translate(lang, key, params), [lang]);

  const value = useMemo(
    () => ({
      settings,
      update,
      resetSettings,
      setLanguage,
      setAgeBand,
      loaded,
      lang,
      needsLanguagePick: loaded && !settings.langChosen,
      needsAgePick: loaded && settings.langChosen && !settings.ageChosen,
      isChildAudience: isChildAudience(settings.ageBand),
      ageBand: settings.ageBand,
      isRTL: rtl,
      t,
      theme: getUiTheme(settings.uiTheme),
      board: getBoardTheme(settings.boardTheme),
    }),
    [settings, update, resetSettings, setLanguage, setAgeBand, loaded, lang, t, rtl]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

export function useTheme() {
  const { theme, board, t, lang, isRTL, settings } = useSettings();
  return { theme, board, t, lang, isRTL, settings };
}
