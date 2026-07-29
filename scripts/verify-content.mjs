// Yerleşik içeriğin (açılış hatları ve bulmacalar) satranç kurallarına
// uygunluğunu doğrular. `npm run verify` ile çalışır; içerik eklendiğinde
// yazım hatalarını erkenden yakalar.

import { Chess } from 'chess.js';
import { OPENINGS } from '../src/chess/openings.js';
import { PUZZLES } from '../src/chess/puzzles.js';

let failures = 0;

function fail(msg) {
  failures += 1;
  console.log('  ✗ ' + msg);
}

console.log('Açılış hatları:');
for (const opening of OPENINGS) {
  const chess = new Chess();
  let ok = true;
  for (const san of opening.san.split(' ')) {
    try {
      chess.move(san);
    } catch {
      fail(`${opening.eco} ${opening.name}: geçersiz hamle "${san}"`);
      ok = false;
      break;
    }
  }
  if (!ok) continue;
}
console.log(`  ${OPENINGS.length} hat kontrol edildi`);

console.log('\nBulmacalar:');
for (const puzzle of PUZZLES) {
  let chess;
  try {
    chess = new Chess(puzzle.fen);
  } catch (err) {
    fail(`${puzzle.id}: FEN yüklenemedi (${err.message})`);
    continue;
  }

  let broke = false;
  for (const san of puzzle.line) {
    try {
      chess.move(san);
    } catch {
      fail(`${puzzle.id}: geçersiz hamle "${san}" (${chess.fen()})`);
      broke = true;
      break;
    }
  }
  if (broke) continue;

  if (!chess.isCheckmate()) {
    fail(`${puzzle.id}: hat mat ile bitmiyor (son konum: ${chess.fen()})`);
    continue;
  }

  // Mat-1 bulmacalarında ilk hamlenin gerçekten tek/geçerli mat olduğunu da göster.
  if (puzzle.line.length === 1) {
    const probe = new Chess(puzzle.fen);
    const mates = probe
      .moves({ verbose: true })
      .filter((m) => m.san.includes('#'))
      .map((m) => m.san);
    if (!mates.includes(puzzle.line[0])) {
      fail(`${puzzle.id}: "${puzzle.line[0]}" mat değil. Mat edenler: ${mates.join(', ') || 'yok'}`);
    }
  }
}
console.log(`  ${PUZZLES.length} bulmaca kontrol edildi`);

if (failures) {
  console.log(`\n${failures} hata bulundu.`);
  process.exit(1);
}
console.log('\nTüm içerik geçerli.');
