import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { RADIUS, SPACING } from '../theme/themes';
import { useSettings } from '../store/SettingsContext';
import { useBottomInset, useTabContentPadding } from '../hooks/useSafeLayout';

export function tap(enabled = true, style = Haptics.ImpactFeedbackStyle.Light) {
  if (!enabled) return;
  Haptics.impactAsync(style).catch(() => {});
}

/**
 * Ekran gövdesi.
 *
 * `tabBar` verildiğinde alta sekme çubuğu + sistem gezinme çubuğu kadar boşluk
 * bırakır; aksi halde yalnızca sistem çubuğu kadar. Edge-to-edge çizim
 * zorunlu olduğu için bu boşluk olmadan son satırlar Samsung'un gezinme
 * çubuğunun altında kalır.
 */
// Sağdan sola dillerde metnin hizası ve yazım yönü. Tek yerde tanımlı ki
// bileşenler arasında tutarlı kalsın.
const RTL_TEXT = { writingDirection: 'rtl', textAlign: 'right' };

export function Screen({ children, scroll = false, padded = true, edges = ['top'], tabBar = false, style }) {
  const { theme } = useSettings();
  const tabReserve = useTabContentPadding(SPACING.lg);
  const plainReserve = useBottomInset(SPACING.xl);
  const reserve = tabBar ? tabReserve : plainReserve;

  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? {
        contentContainerStyle: [
          padded && { padding: SPACING.lg },
          { paddingBottom: reserve },
          style,
        ],
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled',
        contentInsetAdjustmentBehavior: 'never',
      }
    : {
        style: [
          { flex: 1 },
          padded && { padding: SPACING.lg },
          { paddingBottom: reserve },
          style,
        ],
      };

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Body {...bodyProps}>{children}</Body>
    </SafeAreaView>
  );
}

export function Txt({ children, size = 15, weight = '500', dim, faint, color, style, ...rest }) {
  const { theme, isRTL } = useSettings();
  return (
    <Text
      style={[
        {
          color: color || (faint ? theme.textFaint : dim ? theme.textDim : theme.text),
          fontSize: size,
          fontWeight: weight,
        },
        isRTL && { writingDirection: 'rtl', textAlign: 'right' },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style, onPress, padded = true }) {
  const { theme } = useSettings();
  const content = (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: theme.border,
        },
        padded && { padding: SPACING.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      {content}
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
  full,
  haptic = true,
}) {
  const { theme, settings } = useSettings();
  const palette = {
    primary: { bg: theme.primary, fg: '#FFFFFF', border: 'transparent' },
    secondary: { bg: theme.surfaceAlt, fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.text, border: 'transparent' },
    outline: { bg: 'transparent', fg: theme.primary, border: theme.primary },
    danger: { bg: theme.danger, fg: '#FFFFFF', border: 'transparent' },
    accent: { bg: theme.accent, fg: '#1A1A1A', border: 'transparent' },
    success: { bg: theme.success, fg: '#FFFFFF', border: 'transparent' },
  }[variant];

  const dims = {
    sm: { h: 36, px: SPACING.md, fs: 13, ic: 15 },
    md: { h: 46, px: SPACING.lg, fs: 15, ic: 18 },
    lg: { h: 56, px: SPACING.xl, fs: 17, ic: 20 },
  }[size];

  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        tap(haptic && settings.haptics);
        onPress?.();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: dims.h,
          paddingHorizontal: dims.px,
          borderRadius: RADIUS.md,
          backgroundColor: palette.bg,
          borderWidth: palette.border === 'transparent' ? 0 : 1.5,
          borderColor: palette.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          alignSelf: full ? 'stretch' : 'auto',
          flex: full ? undefined : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={dims.ic} color={palette.fg} />
      ) : null}
      {title ? (
        <Text style={{ color: palette.fg, fontSize: dims.fs, fontWeight: '700' }}>{title}</Text>
      ) : null}
    </Pressable>
  );
}

export function IconButton({ name, onPress, size = 20, color, style, disabled, badge }) {
  const { theme, settings } = useSettings();
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        tap(settings.haptics);
        onPress?.();
      }}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: size + 18,
          height: size + 18,
          borderRadius: RADIUS.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.surfaceAlt,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color || theme.text} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.accent,
          }}
        />
      ) : null}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon, locked, style }) {
  const { theme, settings, isRTL } = useSettings();
  return (
    <Pressable
      onPress={() => {
        tap(settings.haptics);
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          borderRadius: RADIUS.pill,
          backgroundColor: active ? theme.primarySoft : theme.surfaceAlt,
          borderWidth: 1,
          borderColor: active ? theme.primary : theme.border,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 6,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? theme.primary : theme.textDim} /> : null}
      <Text
        style={{
          color: active ? theme.primary : theme.textDim,
          fontWeight: '700',
          fontSize: 13,
        }}
      >
        {label}
      </Text>
      {locked ? <Ionicons name="lock-closed" size={12} color={theme.accent} /> : null}
    </Pressable>
  );
}

export function SectionHeader({ title, action, onAction, icon }) {
  const { theme, isRTL } = useSettings();
  return (
    <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <Ionicons name={icon} size={16} color={theme.textDim} /> : null}
        <Text
          style={{
            color: theme.textDim,
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Yatay dizilim. Arapça, Farsça ve İbranice'de satır sağdan sola akar.
 * Tahta ve saat gibi yönü sabit olması gereken yerler `mirror={false}` der.
 */
export function Row({ children, gap = SPACING.md, style, align = 'center', wrap, mirror = true }) {
  const { isRTL } = useSettings();
  return (
    <View
      style={[
        {
          flexDirection: isRTL && mirror ? 'row-reverse' : 'row',
          alignItems: align,
          gap,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  secureTextEntry,
  maxLength,
  style,
}) {
  const { theme, isRTL } = useSettings();
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? (
        <Text style={[{ color: theme.textDim, fontSize: 12, fontWeight: '700' }, isRTL && RTL_TEXT]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textFaint}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        style={{
          backgroundColor: theme.surfaceAlt,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.md,
          paddingVertical: multiline ? SPACING.md : 11,
          color: theme.text,
          fontSize: 15,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
          ...(isRTL ? RTL_TEXT : null),
        }}
      />
    </View>
  );
}

export function ToggleRow({ label, description, value, onValueChange, icon, locked, onLockedPress }) {
  const { theme, isRTL } = useSettings();
  return (
    <Pressable
      onPress={() => (locked ? onLockedPress?.() : onValueChange?.(!value))}
      style={[styles.toggleRow, isRTL && { flexDirection: 'row-reverse' }]}
    >
      {icon ? (
        <View style={[styles.toggleIcon, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name={icon} size={16} color={theme.textDim} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[{ color: theme.text, fontSize: 15, fontWeight: '600' }, isRTL && RTL_TEXT]}>
          {label}
        </Text>
        {description ? (
          <Text style={[{ color: theme.textFaint, fontSize: 12, marginTop: 2 }, isRTL && RTL_TEXT]}>
            {description}
          </Text>
        ) : null}
      </View>
      {locked ? (
        <Ionicons name="lock-closed" size={16} color={theme.accent} />
      ) : (
        <Switch
          value={!!value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      )}
    </Pressable>
  );
}

export function ListRow({ title, subtitle, icon, right, onPress, danger, badge }) {
  const { theme, isRTL } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        isRTL && { flexDirection: 'row-reverse' },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {icon ? (
        <View style={[styles.toggleIcon, { backgroundColor: theme.surfaceAlt }]}>
          <Ionicons name={icon} size={17} color={danger ? theme.danger : theme.textDim} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Row gap={6}>
          <Text
            style={[
              { color: danger ? theme.danger : theme.text, fontSize: 15, fontWeight: '600' },
              isRTL && RTL_TEXT,
            ]}
          >
            {title}
          </Text>
          {badge ? <Badge label={badge} /> : null}
        </Row>
        {subtitle ? (
          <Text
            style={[{ color: theme.textFaint, fontSize: 12, marginTop: 2 }, isRTL && RTL_TEXT]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right !== undefined ? (
        right
      ) : onPress ? (
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={theme.textFaint} />
      ) : null}
    </Pressable>
  );
}

export function Badge({ label, color, style }) {
  const { theme } = useSettings();
  return (
    <View
      style={[
        {
          paddingHorizontal: 7,
          paddingVertical: 2,
          borderRadius: RADIUS.sm,
          backgroundColor: (color || theme.accent) + '26',
          borderWidth: 1,
          borderColor: (color || theme.accent) + '55',
        },
        style,
      ]}
    >
      <Text style={{ color: color || theme.accent, fontSize: 10, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

export function Sheet({ visible, onClose, title, children, height }) {
  const { theme, isRTL } = useSettings();
  // Sayfa ekranın en altına yaslandığı için içeriğin son satırı gezinme
  // çubuğunun altında kalmasın.
  const bottomPad = useBottomInset(SPACING.lg);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: theme.surface, borderColor: theme.border, maxHeight: height || '85%' },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        {title ? (
          <Row style={{ marginBottom: SPACING.lg, paddingHorizontal: SPACING.lg }}>
            <Text
              style={[
                { color: theme.text, fontSize: 18, fontWeight: '800', flex: 1 },
                isRTL && RTL_TEXT,
              ]}
            >
              {title}
            </Text>
            <IconButton name="close" size={18} onPress={onClose} />
          </Row>
        ) : null}
        <ScrollView
          contentContainerStyle={{
            padding: SPACING.lg,
            paddingTop: title ? 0 : SPACING.lg,
            paddingBottom: bottomPad,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, message, action, onAction }) {
  const { theme } = useSettings();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name={icon} size={28} color={theme.textFaint} />
      </View>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
        {title}
      </Text>
      {message ? (
        <Text
          style={{
            color: theme.textFaint,
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 19,
            maxWidth: 300,
          }}
        >
          {message}
        </Text>
      ) : null}
      {action ? <Button title={action} onPress={onAction} variant="secondary" size="sm" /> : null}
    </View>
  );
}

export function Divider({ style }) {
  const { theme } = useSettings();
  return <View style={[{ height: 1, backgroundColor: theme.border }, style]} />;
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  toggleIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    paddingTop: SPACING.sm,
  },
  grabber: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
