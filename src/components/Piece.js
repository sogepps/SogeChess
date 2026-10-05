import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// Taşlar 100x100 kutuda çizilir, taban y=92 civarındadır.
// Her taş tek bir <G> döndürür; renk/kontur dışarıdan verilir.

const Pawn = () => (
  <G>
    <Circle cx="50" cy="27" r="13.5" />
    <Path d="M38 40 C38 52 30 62 30 76 L70 76 C70 62 62 52 62 40 Z" />
    <Path d="M26 76 L74 76 C78 76 80 79 80 83 L80 88 C80 90 78 92 76 92 L24 92 C22 92 20 90 20 88 L20 83 C20 79 22 76 26 76 Z" />
  </G>
);

const Rook = () => (
  <G>
    <Path d="M22 14 H34 V22 H43 V14 H57 V22 H66 V14 H78 V36 L69 44 V64 L79 76 H21 L31 64 V44 L22 36 Z" />
    <Path d="M18 76 H82 C84 76 86 78 86 81 V88 C86 90 84 92 82 92 H18 C16 92 14 90 14 88 V81 C14 78 16 76 18 76 Z" />
  </G>
);

const Knight = () => (
  <G>
    <Path d="M32 84 C30 70 33 60 42 52 C49 46 53 41 51 34 L43 41 L37 32 C41 22 50 13 62 11 C72 9 79 16 81 28 C84 44 79 60 72 72 C69 78 69 81 70 84 Z" />
    <Circle cx="66" cy="27" r="3.4" fill="#00000000" />
    <Path d="M18 84 H82 C84 84 86 86 86 88 V90 C86 91 84 92 82 92 H18 C16 92 14 91 14 90 V88 C14 86 16 84 18 84 Z" />
  </G>
);

const Bishop = () => (
  <G>
    <Circle cx="50" cy="15" r="6.5" />
    <Path d="M50 22 C63 31 71 45 69 58 C67 68 59 73 50 73 C41 73 33 68 31 58 C29 45 37 31 50 22 Z" />
    <Path d="M30 73 H70 C72 73 73 74 73 76 V79 C73 80 72 81 70 81 H30 C28 81 27 80 27 79 V76 C27 74 28 73 30 73 Z" />
    <Path d="M20 81 H80 C83 81 85 83 85 86 V89 C85 91 83 92 80 92 H20 C17 92 15 91 15 89 V86 C15 83 17 81 20 81 Z" />
  </G>
);

const Queen = () => (
  <G>
    <Circle cx="17" cy="24" r="6" />
    <Circle cx="33" cy="16" r="6" />
    <Circle cx="50" cy="12" r="6.5" />
    <Circle cx="67" cy="16" r="6" />
    <Circle cx="83" cy="24" r="6" />
    <Path d="M17 28 L28 60 H72 L83 28 L68 44 L57 18 L50 46 L43 18 L32 44 Z" />
    <Path d="M28 60 H72 C74 66 74 70 72 74 H28 C26 70 26 66 28 60 Z" />
    <Path d="M20 74 H80 C83 74 85 77 85 81 V88 C85 90 83 92 80 92 H20 C17 92 15 90 15 88 V81 C15 77 17 74 20 74 Z" />
  </G>
);

const King = () => (
  <G>
    <Path d="M46 4 H54 V12 H62 V20 H54 V30 H46 V20 H38 V12 H46 Z" />
    <Path d="M50 30 C36 30 24 40 24 54 C24 62 28 68 34 72 H66 C72 68 76 62 76 54 C76 40 64 30 50 30 Z" />
    <Path d="M30 72 H70 C72 76 72 80 70 84 H30 C28 80 28 76 30 72 Z" />
    <Path d="M20 84 H80 C83 84 85 86 85 88 V90 C85 91 83 92 80 92 H20 C17 92 15 91 15 90 V88 C15 86 17 84 20 84 Z" />
  </G>
);

const SHAPES = { p: Pawn, r: Rook, n: Knight, b: Bishop, q: Queen, k: King };

// Taş setleri yalnızca dolgu/kontur ve köşe yumuşaklığında farklılaşır;
// böylece tek bir geometri seti üç ayrı görsel kimlik verir.
export const PIECE_SETS = {
  classic: {
    key: 'classic',
    nameKey: 'pieceSet.classic',
    premium: false,
    white: { fill: '#FCFCFA', stroke: '#1C1C1C', strokeWidth: 4 },
    black: { fill: '#2A2A2C', stroke: '#0A0A0A', strokeWidth: 4 },
  },
  outline: {
    key: 'outline',
    nameKey: 'pieceSet.outline',
    premium: false,
    white: { fill: 'transparent', stroke: '#F2F2F2', strokeWidth: 5 },
    black: { fill: 'transparent', stroke: '#141414', strokeWidth: 5 },
  },
  neo: {
    key: 'neo',
    nameKey: 'pieceSet.neo',
    premium: false,
    white: { fill: '#F5EFE3', stroke: '#8A7355', strokeWidth: 3 },
    black: { fill: '#3A3F4B', stroke: '#12151B', strokeWidth: 3 },
  },
  bold: {
    key: 'bold',
    nameKey: 'pieceSet.bold',
    premium: false,
    white: { fill: '#FFFFFF', stroke: '#000000', strokeWidth: 7 },
    black: { fill: '#101010', stroke: '#FFFFFF', strokeWidth: 3 },
  },
};

function Piece({ type, color, size = 44, set = 'classic' }) {
  const Shape = SHAPES[type];
  if (!Shape) return null;
  const style = (PIECE_SETS[set] || PIECE_SETS.classic)[color === 'w' ? 'white' : 'black'];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <Shape />
      </G>
    </Svg>
  );
}

export default memo(Piece);
