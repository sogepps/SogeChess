import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Badge,
  Button,
  Card,
  Chip,
  Field,
  Row,
  Screen,
  SectionHeader,
  Sheet,
  Txt,
  ToggleRow,
} from '../../src/components/ui';
import AdBanner from '../../src/components/AdBanner';
import { useSettings } from '../../src/store/SettingsContext';
import {
  CLOCK_MODES,
  CLOCK_PRESETS,
  MODE_LABEL_KEYS,
  describeControl,
  presetGroups,
  presetName,
  stage,
} from '../../src/chess/clock';
import { KEYS, readJson, uid, writeJson } from '../../src/store/db';
import { RADIUS, SPACING } from '../../src/theme/themes';

export default function ClockScreen() {
  const { theme, settings, update, t } = useSettings();
  const router = useRouter();

  const [custom, setCustom] = useState([]);
  const [builderOpen, setBuilderOpen] = useState(false);

  const loadCustom = useCallback(async () => {
    setCustom((await readJson(KEYS.clockPresets, [])) || []);
  }, []);

  useEffect(() => {
    loadCustom();
  }, [loadCustom]);

  const groups = useMemo(() => presetGroups(), []);

  const launch = (preset) => {
    router.push(`/clock/run?preset=${encodeURIComponent(preset.id)}`);
  };

  const launchCustom = (preset) => {
    router.push(`/clock/run?custom=${encodeURIComponent(JSON.stringify(preset.control))}&name=${encodeURIComponent(preset.name)}`);
  };

  const saveCustom = async (preset) => {
    const next = [preset, ...custom];
    setCustom(next);
    await writeJson(KEYS.clockPresets, next);
  };

  const deleteCustom = async (id) => {
    const next = custom.filter((c) => c.id !== id);
    setCustom(next);
    await writeJson(KEYS.clockPresets, next);
  };

  return (
    <Screen scroll tabBar>
      <Row style={{ marginBottom: SPACING.lg }}>
        <View style={{ flex: 1 }}>
          <Txt size={26} weight="800">
            {t('clock.title')}
          </Txt>
          <Txt size={12} faint>
            {t('clock.tapYourSide')}
          </Txt>
        </View>
        <Ionicons name="timer-outline" size={26} color={theme.accent} />
      </Row>

      <Card style={{ marginBottom: SPACING.lg, gap: SPACING.xs }} padded={false}>
        <View style={{ padding: SPACING.md, paddingBottom: 0 }}>
          <Txt size={12} weight="800" dim>
            {t('settings.gameplay').toUpperCase()}
          </Txt>
        </View>
        <View style={{ paddingHorizontal: SPACING.md }}>
          <ToggleRow
            icon="volume-medium"
            label={t('clock.haptics')}
            value={settings.clockHaptics}
            onValueChange={(v) => update({ clockHaptics: v })}
          />
          <ToggleRow
            icon="phone-portrait"
            label={t('clock.keepAwake')}
            value={settings.clockKeepAwake}
            onValueChange={(v) => update({ clockKeepAwake: v })}
          />
          <ToggleRow
            icon="swap-vertical"
            label={t('clock.orientation')}
            description={
              settings.clockLayout === 'facing'
                ? t('clock.orientation.facing')
                : t('clock.orientation.side')
            }
            value={settings.clockLayout === 'facing'}
            onValueChange={(v) => update({ clockLayout: v ? 'facing' : 'side' })}
          />
        </View>
      </Card>

      {custom.length ? (
        <>
          <SectionHeader title={t('clock.custom')} icon="options" />
          <View style={{ gap: SPACING.sm, marginBottom: SPACING.lg }}>
            {custom.map((c) => (
              <Card key={c.id} padded={false} onPress={() => launchCustom(c)}>
                <Row style={{ padding: SPACING.md }}>
                  <View style={{ flex: 1 }}>
                    <Txt size={15} weight="700">
                      {c.name}
                    </Txt>
                    <Txt size={11} faint>
                      {describeControl(c.control, t)} · {t(MODE_LABEL_KEYS[c.control.mode])}
                    </Txt>
                  </View>
                  <Pressable
                    onPress={() =>
                      Alert.alert(c.name, t('common.confirmDelete'), [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('common.delete'),
                          style: 'destructive',
                          onPress: () => deleteCustom(c.id),
                        },
                      ])
                    }
                    hitSlop={10}
                  >
                    <Ionicons name="trash-outline" size={17} color={theme.textFaint} />
                  </Pressable>
                  <Ionicons name="play-circle" size={26} color={theme.primary} />
                </Row>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <Button
        title={t('clock.newPreset')}
        icon="add"
        variant="secondary"
        full
        style={{ marginBottom: SPACING.lg }}
        onPress={() => setBuilderOpen(true)}
      />

      {groups.map((group) => (
        <View key={group.group} style={{ marginBottom: SPACING.lg }}>
          <SectionHeader title={t(group.labelKey)} />
          <Row wrap gap={SPACING.sm}>
            {group.items.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => launch(p)}
                  style={({ pressed }) => ({
                    minWidth: '47%',
                    flexGrow: 1,
                    backgroundColor: theme.surface,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor: theme.border,
                    padding: SPACING.md,
                    gap: 4,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Row gap={6}>
                    <Txt size={15} weight="800" style={{ flex: 1 }} numberOfLines={1}>
                      {presetName(p, t)}
                    </Txt>
                  </Row>
                  <Txt size={11} faint numberOfLines={1}>
                    {t(MODE_LABEL_KEYS[p.control.mode])}
                  </Txt>
                </Pressable>
            ))}
          </Row>
        </View>
      ))}

      <AdBanner placement="clock" />

      <ClockBuilder
        visible={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSave={async (preset) => {
          await saveCustom(preset);
          setBuilderOpen(false);
        }}
      />
    </Screen>
  );
}

// -----------------------------------------------------------------------------

function ClockBuilder({ visible, onClose, onSave }) {
  const { theme, t } = useSettings();

  const [name, setName] = useState('');
  const [mode, setMode] = useState('fischer');
  const [stages, setStages] = useState([{ moves: '', minutes: '10', increment: '5' }]);
  const [delaySec, setDelaySec] = useState('3');
  const [asymmetric, setAsymmetric] = useState(false);
  const [blackMinutes, setBlackMinutes] = useState('10');
  const [blackIncrement, setBlackIncrement] = useState('5');

  const usesDelay = mode === 'delay' || mode === 'bronstein';

  const buildControl = () => {
    const parsed = stages.map((s) =>
      stage(
        s.moves ? Math.max(1, parseInt(s.moves, 10) || 0) : null,
        Math.max(0, parseFloat(s.minutes) || 0) * 60000,
        Math.max(0, parseFloat(s.increment) || 0) * 1000
      )
    );
    const control = {
      mode,
      stages: parsed.length ? parsed : [stage(null, 300000, 0)],
      delay: usesDelay ? Math.max(0, parseFloat(delaySec) || 0) * 1000 : 0,
    };
    if (asymmetric) {
      control.perSide = {
        w: { stages: control.stages, delay: control.delay },
        b: {
          stages: [
            stage(
              parsed[0]?.moves ?? null,
              Math.max(0, parseFloat(blackMinutes) || 0) * 60000,
              Math.max(0, parseFloat(blackIncrement) || 0) * 1000
            ),
          ],
          delay: control.delay,
        },
      };
    }
    return control;
  };

  const submit = () => {
    const control = buildControl();
    onSave({
      id: uid('clk'),
      name: name.trim() || describeControl(control, t),
      control,
      createdAt: Date.now(),
    });
    setName('');
    setStages([{ moves: '', minutes: '10', increment: '5' }]);
  };

  const updateStage = (i, patch) =>
    setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <Sheet visible={visible} onClose={onClose} title={t('clock.newPreset')}>
      <View style={{ gap: SPACING.lg }}>
        <Field label={t('common.rename')} value={name} onChangeText={setName} placeholder="—" />

        <View style={{ gap: SPACING.sm }}>
          <Txt size={12} weight="700" dim>
            {t('clock.mode')}
          </Txt>
          <Row wrap gap={SPACING.sm}>
            {CLOCK_MODES.map((m) => (
              <Chip
                key={m}
                label={t(MODE_LABEL_KEYS[m])}
                active={mode === m}
                onPress={() => setMode(m)}
              />
            ))}
          </Row>
        </View>

        {usesDelay ? (
          <Field
            label={`${t('clock.delay')} (${t('unit.secondsShort')})`}
            value={delaySec}
            onChangeText={setDelaySec}
            keyboardType="numeric"
          />
        ) : null}

        <View style={{ gap: SPACING.sm }}>
          <Row>
            <Txt size={12} weight="700" dim style={{ flex: 1 }}>
              {t('clock.stages')}
            </Txt>
            {stages.length > 1 ? <Badge label={`${stages.length}`} /> : null}
          </Row>

          {stages.map((s, i) => (
            <Card key={i} style={{ gap: SPACING.sm }}>
              <Row>
                <Txt size={12} weight="800" dim style={{ flex: 1 }}>
                  {i + 1}. {t('clock.stages')}
                </Txt>
                {stages.length > 1 ? (
                  <Pressable
                    onPress={() => setStages((prev) => prev.filter((_, idx) => idx !== i))}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color={theme.textFaint} />
                  </Pressable>
                ) : null}
              </Row>
              <Row gap={SPACING.sm} align="flex-start">
                <Field
                  label={`${t('clock.baseTime')} (${t('unit.minutesShort')})`}
                  value={s.minutes}
                  onChangeText={(v) => updateStage(i, { minutes: v })}
                  keyboardType="numeric"
                  style={{ flex: 1 }}
                />
                <Field
                  label={`${t('clock.increment')} (${t('unit.secondsShort')})`}
                  value={s.increment}
                  onChangeText={(v) => updateStage(i, { increment: v })}
                  keyboardType="numeric"
                  style={{ flex: 1 }}
                />
              </Row>
              <Field
                label={t('clock.stageAfter', { n: 'N' })}
                value={s.moves}
                onChangeText={(v) => updateStage(i, { moves: v })}
                keyboardType="numeric"
                placeholder={t('common.none')}
              />
            </Card>
          ))}

          <Button
            title={t('clock.addStage')}
            icon="add"
            variant="secondary"
            size="sm"
            onPress={() =>
              setStages((prev) => [...prev, { moves: '', minutes: '30', increment: '30' }])
            }
          />
        </View>

        <ToggleRow
          icon="git-compare"
          label={t('clock.asymmetric')}
          value={asymmetric}
          onValueChange={setAsymmetric}
        />
        {asymmetric ? (
          <Row gap={SPACING.sm} align="flex-start">
            <Field
              label={`${t('common.black')} (${t('unit.minutesShort')})`}
              value={blackMinutes}
              onChangeText={setBlackMinutes}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
            <Field
              label={`${t('common.black')} (${t('unit.secondsShort')})`}
              value={blackIncrement}
              onChangeText={setBlackIncrement}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
          </Row>
        ) : null}

        <Button title={t('common.save')} icon="save" onPress={submit} full size="lg" />
      </View>
    </Sheet>
  );
}
