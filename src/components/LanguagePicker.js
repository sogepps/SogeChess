import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../store/SettingsContext';
import { LANGUAGES } from '../i18n/languages';
import { RADIUS, SPACING } from '../theme/themes';
import { Txt } from './ui';

/**
 * Aranabilir dil listesi.
 *
 * Her satır o dilin kendi yazımıyla görünür ve altında dilin İngilizce adı
 * yazar; kullanıcı hangi dilde olursa olsun aradığını bulabilsin diye arama
 * her ikisini de tarar. Satır etiketleri çevrilmez — bir dilin adı, o dilin
 * kendi adıdır.
 */
export function LanguageList({ selected, onSelect, autoOption = false, style }) {
  const { theme, t, isRTL } = useSettings();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('en');
    const langs = LANGUAGES.filter(
      (l) =>
        !q ||
        l.label.toLocaleLowerCase(l.code).includes(query.trim().toLocaleLowerCase(l.code)) ||
        l.english.toLocaleLowerCase('en').includes(q) ||
        l.code.toLocaleLowerCase('en').includes(q)
    );
    // "Otomatik" cihazın diline uyar; aramada gizlenmesi kafa karıştırır,
    // bu yüzden yalnızca arama boşken en üstte durur.
    return autoOption && !q ? [{ code: null }, ...langs] : langs;
  }, [query, autoOption]);

  return (
    <View style={[{ flex: 1 }, style]}>
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.md,
          marginBottom: SPACING.md,
        }}
      >
        <Ionicons name="search" size={16} color={theme.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('language.search')}
          placeholderTextColor={theme.textFaint}
          autoCorrect={false}
          style={{
            flex: 1,
            paddingVertical: 11,
            color: theme.text,
            fontSize: 15,
            textAlign: isRTL ? 'right' : 'left',
          }}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={theme.textFaint} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.code || 'auto'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = selected === item.code;
          // Satırın adı kendi dilinde yazılır; "Otomatik" ise arayüz dilinde.
          const title = item.code ? item.label : t('settings.languageAuto');

          return (
            <Pressable
              onPress={() => onSelect(item.code)}
              style={({ pressed }) => ({
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: SPACING.md,
                paddingVertical: SPACING.md,
                paddingHorizontal: SPACING.md,
                marginBottom: 6,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: active ? theme.primary : theme.border,
                backgroundColor: active ? theme.primarySoft : theme.surface,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Txt size={16} weight="700" color={active ? theme.primary : theme.text}>
                  {title}
                </Txt>
                {item.code ? (
                  <Txt size={12} faint>
                    {item.english}
                  </Txt>
                ) : null}
              </View>
              {active ? <Ionicons name="checkmark-circle" size={20} color={theme.primary} /> : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}
