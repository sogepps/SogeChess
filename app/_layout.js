import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider, useSettings } from '../src/store/SettingsContext';
import { PremiumProvider, usePremium } from '../src/store/PremiumContext';
import { LibraryProvider } from '../src/store/LibraryContext';
import { initAds, preloadInterstitial } from '../src/services/ads';

/**
 * Reklam SDK'sı yalnızca reklam görecek + yaşını seçmiş kullanıcı için açılır.
 * Yaş bandına göre çocuk / ergen / yetişkin muamelesi uygulanır.
 */
function useAdsBootstrap() {
  const { isPremium, loaded } = usePremium();
  const { settings, ageBand } = useSettings();

  useEffect(() => {
    if (!loaded || isPremium) return;
    if (!settings.ageChosen || !ageBand) return;
    let alive = true;
    initAds({ ageBand }).then((ok) => {
      if (ok && alive) preloadInterstitial();
    });
    return () => {
      alive = false;
    };
  }, [loaded, isPremium, settings.ageChosen, ageBand]);
}

function Routes() {
  const { theme, loaded, needsLanguagePick, needsAgePick } = useSettings();
  useAdsBootstrap();

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  }

  // Önce dil, sonra yaş — ikisi de birer kez. Yaş seçilmeden ana uygulama açılmaz.
  let gate = null;
  if (needsLanguagePick) gate = <Redirect href="/language" />;
  else if (needsAgePick) gate = <Redirect href="/age" />;

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {gate}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="game/play" options={{ headerShown: false }} />
        <Stack.Screen name="game/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="clock/run" options={{ headerShown: false, orientation: 'all' }} />
        <Stack.Screen name="studio" options={{ headerShown: false }} />
        <Stack.Screen name="editor" options={{ headerShown: false }} />
        <Stack.Screen name="openings" options={{ headerShown: false }} />
        <Stack.Screen name="puzzles" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="language" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="age" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="premium"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <PremiumProvider>
            <LibraryProvider>
              <Routes />
            </LibraryProvider>
          </PremiumProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
