export const CLOCK_MODES = ['fischer', 'bronstein', 'delay', 'simple', 'hourglass'];

export const MODE_LABEL_KEYS = {
  fischer: 'clock.mode.fischer',
  bronstein: 'clock.mode.bronstein',
  delay: 'clock.mode.delay',
  simple: 'clock.mode.simple',
  hourglass: 'clock.mode.hourglass',
};

const S = 1000;
const M = 60 * S;

/**
 * Aşama (stage) tanımı:
 *   { moves: number|null, base: ms, increment: ms }
 * `moves` null ise aşama partinin sonuna kadar sürer. Bir oyuncu aşamanın
 * hamle sayısını tamamladığında bir sonraki aşamanın `base` süresi eklenir —
 * FIDE turnuva kontrollerinin çalışma şekli budur.
 */
export function stage(moves, baseMs, incrementMs = 0) {
  return { moves, base: baseMs, increment: incrementMs };
}

export function simpleControl(baseMs, incrementMs = 0, mode = 'fischer') {
  return {
    mode,
    stages: [stage(null, baseMs, incrementMs)],
    delay: mode === 'delay' || mode === 'bronstein' ? incrementMs : 0,
  };
}

/**
 * Hazır ayarların adları çoğunlukla sayıdan ibarettir ("5 | 3") ve her dilde
 * aynıdır; bunlar `name` alanında sabit durur. Dile göre değişen kısımlar —
 * "5 dk", "3 sn gecikme", "Kum Saati" — `nameKey` ve `nameParams` ile
 * çeviriden gelir. `presetName(preset, t)` ikisini birleştirir.
 */
export const CLOCK_PRESETS = [
  {
    id: 'bullet-1-0',
    group: 'bullet',
    nameKey: 'clock.name.minutes',
    nameParams: { n: 1 },
    premium: false,
    control: simpleControl(1 * M, 0, 'simple'),
  },
  { id: 'bullet-1-1', group: 'bullet', name: '1 | 1', premium: false, control: simpleControl(1 * M, 1 * S) },
  { id: 'bullet-2-1', group: 'bullet', name: '2 | 1', premium: false, control: simpleControl(2 * M, 1 * S) },
  {
    id: 'blitz-3-0',
    group: 'blitz',
    nameKey: 'clock.name.minutes',
    nameParams: { n: 3 },
    premium: false,
    control: simpleControl(3 * M, 0, 'simple'),
  },
  { id: 'blitz-3-2', group: 'blitz', name: '3 | 2', premium: false, control: simpleControl(3 * M, 2 * S) },
  {
    id: 'blitz-5-0',
    group: 'blitz',
    nameKey: 'clock.name.minutes',
    nameParams: { n: 5 },
    premium: false,
    control: simpleControl(5 * M, 0, 'simple'),
  },
  { id: 'blitz-5-3', group: 'blitz', name: '5 | 3', premium: false, control: simpleControl(5 * M, 3 * S) },
  { id: 'blitz-5-5', group: 'blitz', name: '5 | 5', premium: false, control: simpleControl(5 * M, 5 * S) },
  {
    id: 'rapid-10-0',
    group: 'rapid',
    nameKey: 'clock.name.minutes',
    nameParams: { n: 10 },
    premium: false,
    control: simpleControl(10 * M, 0, 'simple'),
  },
  { id: 'rapid-10-5', group: 'rapid', name: '10 | 5', premium: false, control: simpleControl(10 * M, 5 * S) },
  { id: 'rapid-15-10', group: 'rapid', name: '15 | 10', premium: false, control: simpleControl(15 * M, 10 * S) },
  { id: 'rapid-25-10', group: 'rapid', name: '25 | 10', premium: false, control: simpleControl(25 * M, 10 * S) },
  {
    id: 'classic-30-0',
    group: 'classic',
    nameKey: 'clock.name.minutes',
    nameParams: { n: 30 },
    premium: false,
    control: simpleControl(30 * M, 0, 'simple'),
  },
  { id: 'classic-30-30', group: 'classic', name: '30 | 30', premium: false, control: simpleControl(30 * M, 30 * S) },
  { id: 'classic-60-30', group: 'classic', name: '60 | 30', premium: false, control: simpleControl(60 * M, 30 * S) },
  { id: 'classic-90-30', group: 'classic', name: '90 | 30', premium: false, control: simpleControl(90 * M, 30 * S) },
  {
    id: 'delay-5-3',
    group: 'delayed',
    nameKey: 'clock.name.minutesDelay',
    nameParams: { n: 5, d: 3 },
    premium: false,
    control: { mode: 'delay', stages: [stage(null, 5 * M, 0)], delay: 3 * S },
  },
  {
    id: 'delay-90-30',
    group: 'delayed',
    nameKey: 'clock.name.minutesDelay',
    nameParams: { n: 90, d: 30 },
    premium: true,
    control: { mode: 'delay', stages: [stage(null, 90 * M, 0)], delay: 30 * S },
  },
  {
    id: 'bronstein-5-3',
    group: 'delayed',
    name: 'Bronstein 5 | 3',
    premium: true,
    control: { mode: 'bronstein', stages: [stage(null, 5 * M, 0)], delay: 3 * S },
  },
  {
    id: 'fide-classical',
    group: 'tournament',
    nameKey: 'clock.name.fideClassical',
    premium: true,
    control: {
      mode: 'fischer',
      stages: [stage(40, 90 * M, 30 * S), stage(null, 30 * M, 30 * S)],
      delay: 0,
    },
  },
  {
    id: 'fide-40-40',
    group: 'tournament',
    name: '40/120, 20/60, +15 | 30',
    premium: true,
    control: {
      mode: 'fischer',
      stages: [stage(40, 120 * M, 0), stage(20, 60 * M, 0), stage(null, 15 * M, 30 * S)],
      delay: 0,
    },
  },
  {
    id: 'hourglass-3',
    group: 'fun',
    nameKey: 'clock.name.hourglass',
    nameParams: { n: 3 },
    premium: true,
    control: { mode: 'hourglass', stages: [stage(null, 3 * M, 0)], delay: 0 },
  },
];

/** Hazır ayarın görünen adı; çevrilmesi gereken kısımları `t` ile çözer. */
export function presetName(preset, t) {
  if (!preset) return '';
  if (preset.nameKey) return t(preset.nameKey, preset.nameParams);
  return preset.name;
}

export const CLOCK_GROUP_KEYS = {
  bullet: 'clock.group.bullet',
  blitz: 'clock.group.blitz',
  rapid: 'clock.group.rapid',
  classic: 'clock.group.classic',
  delayed: 'clock.group.delayed',
  tournament: 'clock.group.tournament',
  fun: 'clock.group.fun',
};

export function presetGroups() {
  const groups = new Map();
  for (const p of CLOCK_PRESETS) {
    if (!groups.has(p.group)) groups.set(p.group, []);
    groups.get(p.group).push(p);
  }
  return [...groups.entries()].map(([group, items]) => ({
    group,
    labelKey: CLOCK_GROUP_KEYS[group] || group,
    items,
  }));
}

/**
 * Kalan süreyi okunur biçime çevirir.
 * 20 sn altında saliseyi de gösteririz; turnuva saatlerinin standardı budur.
 */
export function formatTime(ms, { showTenths = 'auto' } = {}) {
  const clamped = Math.max(0, ms);
  const total = Math.floor(clamped / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const tenths = Math.floor((clamped % 1000) / 100);

  const wantTenths = showTenths === true || (showTenths === 'auto' && clamped < 20000);
  const pad = (n) => String(n).padStart(2, '0');

  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  if (wantTenths) return `${m}:${pad(s)}.${tenths}`;
  return `${m}:${pad(s)}`;
}

export function formatDuration(ms, t) {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}${t('unit.hourAbbr')} ${m}${t('unit.minAbbr')}`;
  if (m) return `${m}${t('unit.minAbbr')} ${s}${t('unit.secAbbr')}`;
  return `${s}${t('unit.secAbbr')}`;
}

/**
 * Süre kontrolünü PGN TimeControl etiketine çevirir (ör. "40/5400+30:1800+30").
 */
export function toPgnTimeControl(control) {
  if (!control?.stages?.length) return '';
  return control.stages
    .map((st) => {
      const base = Math.round(st.base / 1000);
      const inc = Math.round((st.increment || 0) / 1000);
      const head = st.moves ? `${st.moves}/${base}` : `${base}`;
      return inc ? `${head}+${inc}` : head;
    })
    .join(':');
}

export function describeControl(control, t) {
  if (!control?.stages?.length) return '';
  const min = t('unit.minAbbr');
  const parts = control.stages.map((st) => {
    const mins = Math.round(st.base / 60000);
    const inc = Math.round((st.increment || 0) / 1000);
    const head = st.moves ? `${st.moves}/${mins}${min}` : `${mins}${min}`;
    return inc ? `${head}+${inc}` : head;
  });
  const delay = control.delay
    ? ` · ${Math.round(control.delay / 1000)}${t('unit.secAbbr')} ${t('clock.delay')}`
    : '';
  return parts.join(' → ') + delay;
}
