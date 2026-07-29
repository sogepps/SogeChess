import React, { memo } from 'react';
import { View } from 'react-native';
import Piece from './Piece';
import { useSettings } from '../store/SettingsContext';
import { START_FEN, piecesFromFen, squareToCoords } from '../chess/core';

/**
 * Etkileşimsiz küçük tahta. Liste kartlarında ve konum ızgarasında kullanılır;
 * animasyon, koordinat, dokunma yoktur ki uzun listelerde ucuz kalsın.
 */
function MiniBoard({ fen = START_FEN, size = 56, flipped = false, radius = 6 }) {
  const { board, settings } = useSettings();
  const sq = size / 8;
  const pieces = piecesFromFen(fen);

  const cells = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      cells.push({ key: `${row}-${col}`, row, col, light: (row + col) % 2 === 0 });
    }
  }

  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
      {cells.map(({ key, row, col, light }) => (
        <View
          key={key}
          style={{
            position: 'absolute',
            left: col * sq,
            top: row * sq,
            width: sq,
            height: sq,
            backgroundColor: light ? board.light : board.dark,
          }}
        />
      ))}
      {pieces.map((p) => {
        const { col, row } = squareToCoords(p.square, flipped);
        return (
          <View
            key={p.square}
            style={{
              position: 'absolute',
              left: col * sq,
              top: row * sq,
              width: sq,
              height: sq,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Piece type={p.type} color={p.color} size={sq} set={settings.pieceSet} />
          </View>
        );
      })}
    </View>
  );
}

export default memo(MiniBoard);
