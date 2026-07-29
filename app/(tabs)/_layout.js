import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../src/store/SettingsContext';
import { TAB_BAR_BASE_HEIGHT } from '../../src/hooks/useSafeLayout';

export default function TabsLayout() {
  const { theme, t } = useSettings();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textFaint,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          // Gezinme çubuğu (Samsung'da 3 tuşlu bar ~48dp) sekmelerin üstüne
          // binmesin diye çubuk kadar büyüyoruz, altına da o kadar dolgu.
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: t('tab.play'),
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clock"
        options={{
          title: t('tab.clock'),
          tabBarIcon: ({ color, size }) => <Ionicons name="timer" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('tab.library'),
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tab.more'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal-circle" size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
