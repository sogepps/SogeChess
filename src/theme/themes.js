// Renk paletleri: uygulama teması (UI) ve tahta temaları ayrı tutulur.

export const UI_THEMES = {
  midnight: {
    key: 'midnight',
    nameKey: 'theme.ui.midnight',
    dark: true,
    bg: '#0E1116',
    surface: '#171B22',
    surfaceAlt: '#1F242D',
    border: '#2A313C',
    text: '#EDF1F7',
    textDim: '#98A2B3',
    textFaint: '#5F6B7C',
    primary: '#5B9DFF',
    primarySoft: '#1B3557',
    accent: '#F5C451',
    success: '#3FBF7F',
    danger: '#F0605F',
    warning: '#FFA940',
  },
  slate: {
    key: 'slate',
    nameKey: 'theme.ui.slate',
    dark: true,
    bg: '#121212',
    surface: '#1C1C1E',
    surfaceAlt: '#252528',
    border: '#333338',
    text: '#F2F2F5',
    textDim: '#9A9AA2',
    textFaint: '#66666E',
    primary: '#7C8CF8',
    primarySoft: '#282C4D',
    accent: '#E8B44A',
    success: '#43C08A',
    danger: '#EF5F63',
    warning: '#F5A623',
  },
  paper: {
    key: 'paper',
    nameKey: 'theme.ui.paper',
    dark: false,
    bg: '#F6F4EF',
    surface: '#FFFFFF',
    surfaceAlt: '#EFEBE2',
    border: '#DED8CC',
    text: '#1E2228',
    textDim: '#5E6672',
    textFaint: '#98A0AC',
    primary: '#2F6FD0',
    primarySoft: '#DCE8FA',
    accent: '#B7791F',
    success: '#248A5A',
    danger: '#C7423F',
    warning: '#B4770F',
  },
  forest: {
    key: 'forest',
    nameKey: 'theme.ui.forest',
    dark: true,
    bg: '#0D1512',
    surface: '#15201B',
    surfaceAlt: '#1D2B24',
    border: '#27392F',
    text: '#E8F2EC',
    textDim: '#8FA79A',
    textFaint: '#5C7268',
    primary: '#4FBF87',
    primarySoft: '#173A2A',
    accent: '#D9B44A',
    success: '#4FBF87',
    danger: '#E4665F',
    warning: '#E0A03C',
  },
};

// Tahta temaları. premium:true olanlar kilitli.
export const BOARD_THEMES = {
  classic: {
    key: 'classic',
    nameKey: 'theme.board.classic',
    light: '#EFD9B4',
    dark: '#B58863',
    premium: false,
  },
  green: {
    key: 'green',
    nameKey: 'theme.board.green',
    light: '#EEEED2',
    dark: '#769656',
    premium: false,
  },
  blue: {
    key: 'blue',
    nameKey: 'theme.board.blue',
    light: '#DEE3E6',
    dark: '#788A9E',
    premium: false,
  },
  slateBoard: {
    key: 'slateBoard',
    nameKey: 'theme.board.slate',
    light: '#C9CDD3',
    dark: '#6E747E',
    premium: false,
  },
  walnut: {
    key: 'walnut',
    nameKey: 'theme.board.walnut',
    light: '#E8CFA9',
    dark: '#8B5E3C',
    premium: true,
  },
  marble: {
    key: 'marble',
    nameKey: 'theme.board.marble',
    light: '#F2F2F0',
    dark: '#9A9B97',
    premium: true,
  },
  purple: {
    key: 'purple',
    nameKey: 'theme.board.purple',
    light: '#E5DDF5',
    dark: '#8267AE',
    premium: true,
  },
  contrast: {
    key: 'contrast',
    nameKey: 'theme.board.contrast',
    light: '#FFFFFF',
    dark: '#3A3A3A',
    premium: true,
  },
  coral: {
    key: 'coral',
    nameKey: 'theme.board.coral',
    light: '#FCE3D6',
    dark: '#C9695A',
    premium: true,
  },
};

// Tahta üstü işaretleyici renkleri, tahta temasından bağımsız sabit.
export const MARKS = {
  lastMove: 'rgba(255, 214, 74, 0.45)',
  selected: 'rgba(90, 175, 255, 0.50)',
  check: 'rgba(240, 80, 80, 0.65)',
  hint: 'rgba(40, 40, 40, 0.28)',
  premove: 'rgba(150, 90, 220, 0.40)',
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export function getUiTheme(key) {
  return UI_THEMES[key] || UI_THEMES.midnight;
}

export function getBoardTheme(key) {
  return BOARD_THEMES[key] || BOARD_THEMES.classic;
}
