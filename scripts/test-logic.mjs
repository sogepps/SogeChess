// Saf mantık katmanının (satranç çekirdeği, PGN, saat matematiği) testleri.
// React gerektirmez, Node'da çalışır: node scripts/test-logic.mjs

import { Chess } from 'chess.js';
import {
  START_FEN,
  fenAtPly,
  isFenValid,
  materialBalance,
  needsPromotion,
  coordsToSquare,
  squareToCoords,
  gameStatus,
  toMovePairs,
} from '../src/chess/core.js';
import { parsePgnFile, serializeGameToPgn, splitPgnGames } from '../src/chess/pgn.js';
import { detectOpening, bookContinuations } from '../src/chess/openings.js';
import { formatTime, toPgnTimeControl, simpleControl, stage } from '../src/chess/clock.js';
import { formatSan } from '../src/chess/notation.js';
import { evaluatePosition, evalToBarRatio } from '../src/chess/engine.js';

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
  } else {
    failed += 1;
    console.log(`  ✗ ${name}\n      beklenen: ${e}\n      gelen:    ${a}`);
  }
}

function ok(name, condition, detail = '') {
  if (condition) passed += 1;
  else {
    failed += 1;
    console.log(`  ✗ ${name} ${detail}`);
  }
}

console.log('Çekirdek:');
check('kare/koordinat gidiş-dönüş', coordsToSquare(0, 0), 'a8');
check('çevrilmiş tahtada a8', coordsToSquare(0, 0, true), 'h1');
check('e4 koordinatı', squareToCoords('e4'), { col: 4, row: 4 });
ok('başlangıç FEN geçerli', isFenValid(START_FEN).ok);
ok('bozuk FEN reddedilir', !isFenValid('bu bir fen degil').ok);
ok('şahsız FEN reddedilir', !isFenValid('8/8/8/8/8/8/8/8 w - - 0 1').ok);

{
  const c = new Chess('8/P7/8/8/8/8/8/K6k w - - 0 1');
  ok('terfi algılanır', needsPromotion(c, 'a7', 'a8'));
  ok('terfi olmayan hamlede false', !needsPromotion(c, 'a1', 'b1'));
}

{
  // Beyaz bir vezir ve bir at fazla.
  const { score, capturedByWhite } = materialBalance(
    'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  );
  check('materyal farkı (at eksik siyah)', score, 3);
  check('yenen taşlar', capturedByWhite, ['n']);
}

console.log('Durum tespiti:');
check(
  'mat',
  gameStatus(new Chess('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3')),
  { over: true, result: '0-1', reasonKey: 'reason.checkmate' }
);
check(
  'pat',
  gameStatus(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')),
  { over: true, result: '1/2-1/2', reasonKey: 'reason.stalemate' }
);
check(
  'yetersiz materyal',
  gameStatus(new Chess('7k/8/6K1/8/8/8/8/8 w - - 0 1')).reasonKey,
  'reason.insufficient'
);

console.log('Hamle tablosu:');
{
  const c = new Chess();
  ['e4', 'e5', 'Nf3'].forEach((m) => c.move(m));
  const rows = toMovePairs(c.history({ verbose: true }));
  check('satır sayısı', rows.length, 2);
  check('1. satır beyaz', rows[0].white.san, 'e4');
  check('2. satır siyah boş', rows[1].black, null);
}

console.log('Ply konumu:');
{
  const c = new Chess();
  const moves = [];
  for (const san of ['d4', 'd5', 'c4', 'e6']) moves.push(c.move(san));
  const fen2 = fenAtPly(START_FEN, moves.map((m) => ({ san: m.san })), 2);
  const ref = new Chess();
  ref.move('d4');
  ref.move('d5');
  check('2 ply sonrası FEN', fen2, ref.fen());
}

console.log('Açılışlar:');
check('Najdorf tespiti', detectOpening('e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6'.split(' '))?.eco, 'B90');
check('İtalyan tespiti', detectOpening(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'])?.eco, 'C50');
check('a3 Anderssen olarak tanınır', detectOpening(['a3', 'h6'])?.eco, 'A00');
check('kitapta olmayan hat null', detectOpening(['h3', 'a6']), null);
ok(
  '1.e4 sonrası kitap devamları var',
  bookContinuations(['e4']).length > 3,
  `(${bookContinuations(['e4']).length})`
);

console.log('PGN:');
{
  const sample = `[Event "Test A"]
[Site "?"]
[Date "2024.01.01"]
[Round "1"]
[White "Ali"]
[Black "Veli"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0

[Event "Test B"]
[Site "?"]
[Date "2024.01.02"]
[Round "2"]
[White "Ayse"]
[Black "Fatma"]
[Result "0-1"]

1. d4 d5 2. c4 e6 0-1
`;
  check('iki parti ayrıştırılır', splitPgnGames(sample).length, 2);
  const { games, errors } = parsePgnFile(sample);
  check('parse hatası yok', errors.length, 0);
  check('ilk parti hamle sayısı', games[0].moves.length, 6);
  check('ilk parti beyaz', games[0].headers.White, 'Ali');
  check('ikinci parti sonucu', games[1].headers.Result, '0-1');

  // Gidiş-dönüş: serialize edip tekrar okuduğumuzda hamleler korunmalı.
  const round = parsePgnFile(serializeGameToPgn(games[0])).games[0];
  check('gidiş-dönüş hamleleri', round.moves.map((m) => m.san), games[0].moves.map((m) => m.san));
  check('gidiş-dönüş oyuncusu', round.headers.Black, 'Veli');
}

{
  // FEN'den başlayan parti: SetUp/FEN etiketleri korunmalı.
  const custom = {
    headers: { Event: 'Konumdan', White: 'A', Black: 'B', Result: '*' },
    startFen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
    moves: [{ san: 'e4' }],
    createdAt: Date.now(),
  };
  const pgn = serializeGameToPgn(custom);
  ok('FEN etiketi yazılır', pgn.includes('[FEN "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"]'), pgn);
  const back = parsePgnFile(pgn).games[0];
  check('özel başlangıç korunur', back.startFen, custom.startFen);
  check('özel başlangıç hamlesi', back.moves[0].san, 'e4');
}

{
  // Bozuk hamle içeren kayıt sessizce kesilmeli, çökmemeli.
  const broken = {
    headers: { White: 'X', Black: 'Y', Result: '*' },
    startFen: START_FEN,
    moves: [{ san: 'e4' }, { san: 'Qz9' }, { san: 'e5' }],
  };
  const pgn = serializeGameToPgn(broken);
  ok('bozuk hamlede çökmez', pgn.includes('1. e4'), pgn);
}

console.log('Saat:');
check('5:00 biçimi', formatTime(300000), '5:00');
check('1 saat biçimi', formatTime(3661000), '1:01:01');
check('20 sn altı salise gösterir', formatTime(9500), '0:09.5');
check('negatif sıfırlanır', formatTime(-500), '0:00.0');
check('basit kontrol PGN etiketi', toPgnTimeControl(simpleControl(300000, 3000)), '300+3');
check(
  'çok aşamalı PGN etiketi',
  toPgnTimeControl({ stages: [stage(40, 5400000, 30000), stage(null, 1800000, 30000)] }),
  '40/5400+30:1800+30'
);

console.log('Notasyon:');
check('şekilli at', formatSan('Nf3', 'figurine'), '♘f3');
check('türkçe kale', formatSan('Rxe5', 'localized', 'tr'), 'Kxe5');
check('türkçe terfi', formatSan('e8=Q+', 'localized', 'tr'), 'e8=V+');
check('piyon hamlesi değişmez', formatSan('e4', 'localized', 'tr'), 'e4');
check('ingilizcede değişmez', formatSan('Nf3', 'localized', 'en'), 'Nf3');

console.log('Değerlendirme:');
ok('başlangıç dengeli', Math.abs(evaluatePosition(START_FEN)) < 40, String(evaluatePosition(START_FEN)));
ok(
  'vezir fazlası pozitif',
  evaluatePosition('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') > 700
);
check('mat değeri', evaluatePosition('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'), -100000);
ok('çubuk oranı 0-1 arası', evalToBarRatio(500) > 0.5 && evalToBarRatio(-500) < 0.5);
check('mat oranı uçta', evalToBarRatio(100000), 1);

console.log(`\n${passed} test geçti, ${failed} başarısız.`);
process.exit(failed ? 1 : 0);
