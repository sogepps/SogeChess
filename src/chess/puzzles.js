// OTOMATİK ÜRETİLDİ — elle düzenlemeyin.
// Kaynak: scripts/generate-puzzles.mjs
// Her bulmaca üretim sırasında chess.js ile doğrulanmıştır: `line` hattının
// son hamlesi mat eder ve mat-1 bulmacalarında çözüm tektir.

export const PUZZLES = [
  {
    "id": "m1-5",
    "fen": "r7/1p2kpp1/4bn2/p7/8/8/r2b4/3K4 b - - 3 33",
    "line": [
      "Bg4#"
    ],
    "mateIn": 1,
    "side": "b",
    "theme": "bishop",
    "rating": 700
  },
  {
    "id": "m1-1",
    "fen": "r7/4qk2/p7/2b1n3/2P3b1/2N3P1/3P4/4KB2 b - - 3 26",
    "line": [
      "Nd3#"
    ],
    "mateIn": 1,
    "side": "b",
    "theme": "knight",
    "rating": 725
  },
  {
    "id": "m1-8",
    "fen": "1r3Q1r/p7/2pR3n/4k3/8/4P2N/P4K2/2B5 w - - 2 31",
    "line": [
      "Qf4#"
    ],
    "mateIn": 1,
    "side": "w",
    "theme": "queen",
    "rating": 750
  },
  {
    "id": "m1-7",
    "fen": "1r3Qnr/p7/2p1k2p/8/7R/4P2N/P2R1K2/2B5 w - - 7 29",
    "line": [
      "Re4#"
    ],
    "mateIn": 1,
    "side": "w",
    "theme": "rook",
    "rating": 775
  },
  {
    "id": "m1-14",
    "fen": "3qk3/3bpp2/6N1/1pp5/8/1PN5/4KPPR/2B5 w - - 0 21",
    "line": [
      "Rh8#"
    ],
    "mateIn": 1,
    "side": "w",
    "theme": "rook",
    "rating": 800
  },
  {
    "id": "m1-3",
    "fen": "rn4rk/p4R2/4p2p/3b2N1/1P5K/B2P4/P1N4P/R7 w - - 1 28",
    "line": [
      "Rh7#"
    ],
    "mateIn": 1,
    "side": "w",
    "theme": "rook",
    "rating": 825
  },
  {
    "id": "m1-4",
    "fen": "rn4rk/p4R2/7p/3bp1N1/1P5K/3P4/PBN4P/R7 w - - 0 29",
    "line": [
      "Rh7#"
    ],
    "mateIn": 1,
    "side": "w",
    "theme": "rook",
    "rating": 850
  },
  {
    "id": "m1-10",
    "fen": "3r1B2/p1p2p2/4pP2/7k/P6p/3B1P2/2PK3P/3Q2NR w - - 2 24",
    "line": [
      "f4#"
    ],
    "mateIn": 1,
    "side": "w",
    "theme": "pawn",
    "rating": 875
  },
  {
    "id": "m1-9",
    "fen": "3R3r/p1p1Bp1k/B3pP2/8/P6p/8/2PK1P1P/3Q2NR w - - 0 21",
    "line": [
      "Qh5#"
    ],
    "mateIn": 1,
    "side": "w",
    "theme": "queen",
    "rating": 900
  },
  {
    "id": "m1-6",
    "fen": "5bnr/5ppp/2p1R3/5k2/7P/3b1PP1/1PPB2Q1/4K1NR w K - 1 21",
    "line": [
      "Qh3#"
    ],
    "mateIn": 1,
    "side": "w",
    "theme": "queen",
    "rating": 925
  },
  {
    "id": "m1-13",
    "fen": "r1b3nr/pppp2pp/6k1/4p2q/1bPnP3/8/P4PPP/RNB2KNR b - - 0 9",
    "line": [
      "Qd1#"
    ],
    "mateIn": 1,
    "side": "b",
    "theme": "queen",
    "rating": 950
  },
  {
    "id": "m1-12",
    "fen": "r1b2bnr/pppp2pp/6k1/4p2q/1P1nP3/8/P1P2PPP/RNB2KNR b - - 0 8",
    "line": [
      "Qd1#"
    ],
    "mateIn": 1,
    "side": "b",
    "theme": "queen",
    "rating": 975
  },
  {
    "id": "m1-2",
    "fen": "rnb1kbr1/3pp1p1/p2p1p2/1p5p/3P2n1/P2KPP2/2P3PP/R1B1qBNR b q - 1 12",
    "line": [
      "Nf2#"
    ],
    "mateIn": 1,
    "side": "b",
    "theme": "knight",
    "rating": 1000
  },
  {
    "id": "m1-11",
    "fen": "r1b2bnr/pppp2pp/2n3k1/4p2q/3PP3/8/PPP2PPP/RNB2KNR b - - 0 7",
    "line": [
      "Qd1#"
    ],
    "mateIn": 1,
    "side": "b",
    "theme": "queen",
    "rating": 1025
  },
  {
    "id": "m2-2",
    "fen": "2Q5/8/7P/1B6/6B1/8/3k4/7K w - - 1 68",
    "line": [
      "Qc5",
      "Ke1",
      "Qe3#"
    ],
    "mateIn": 2,
    "side": "w",
    "theme": "queen",
    "rating": 1620
  },
  {
    "id": "m2-11",
    "fen": "7b/8/4N2B/8/k7/1R6/3N4/4K3 w - - 3 39",
    "line": [
      "Nc5+",
      "Ka5",
      "Nc4#"
    ],
    "mateIn": 2,
    "side": "w",
    "theme": "knight",
    "rating": 1650
  },
  {
    "id": "m2-6",
    "fen": "3r4/1p2kpp1/5n2/p7/8/1bK5/r7/2b5 b - - 9 36",
    "line": [
      "Ba4",
      "Kc4",
      "Rc2#"
    ],
    "mateIn": 2,
    "side": "b",
    "theme": "rook",
    "rating": 1680
  },
  {
    "id": "m2-9",
    "fen": "4r3/3k2p1/8/5P1p/3P3P/1pn2P2/8/2K5 b - - 2 42",
    "line": [
      "Re2",
      "f6",
      "b2#"
    ],
    "mateIn": 2,
    "side": "b",
    "theme": "pawn",
    "rating": 1710
  },
  {
    "id": "m2-1",
    "fen": "r7/4qk2/p3b3/2b1n3/2P5/2N3P1/3PK3/5B2 b - - 1 25",
    "line": [
      "Bg4+",
      "Ke1",
      "Nd3#"
    ],
    "mateIn": 2,
    "side": "b",
    "theme": "knight",
    "rating": 1740
  },
  {
    "id": "m2-7",
    "fen": "6nr/6p1/2p5/3k1P1p/1B5P/3P1P2/6Q1/4K1NR w K - 1 26",
    "line": [
      "f4+",
      "Kd4",
      "Qe4#"
    ],
    "mateIn": 2,
    "side": "w",
    "theme": "queen",
    "rating": 1770
  },
  {
    "id": "m2-8",
    "fen": "6nr/6p1/6Q1/2pk1P1p/1B5P/3P1P2/8/4K1NR w K - 0 27",
    "line": [
      "Qe6+",
      "Kd4",
      "Qe4#"
    ],
    "mateIn": 2,
    "side": "w",
    "theme": "queen",
    "rating": 1800
  },
  {
    "id": "m2-3",
    "fen": "1n5r/1pp2p2/7n/6p1/3Pk1P1/1P6/5P2/3QKBN1 w - - 0 23",
    "line": [
      "Bg2+",
      "Kf4",
      "Qf3#"
    ],
    "mateIn": 2,
    "side": "w",
    "theme": "queen",
    "rating": 1830
  },
  {
    "id": "m2-5",
    "fen": "b6k/n7/p6B/1P1p1p2/1P6/8/2PPP1P1/RN2QBK1 w - - 3 34",
    "line": [
      "Qg3",
      "Bb7",
      "Qg7#"
    ],
    "mateIn": 2,
    "side": "w",
    "theme": "queen",
    "rating": 1860
  },
  {
    "id": "m2-10",
    "fen": "1R1n2kr/p1p1Bp2/4pP2/7p/P7/8/2PKBP1P/3Q2NR w - - 1 19",
    "line": [
      "Bd3",
      "Rh7",
      "Rxd8#"
    ],
    "mateIn": 2,
    "side": "w",
    "theme": "rook",
    "rating": 1890
  },
  {
    "id": "m2-12",
    "fen": "rnb2b2/pp1pnkp1/5p2/2q5/P7/2PPP3/1P5r/RNBK4 b - - 0 17",
    "line": [
      "Qh5+",
      "Ke1",
      "Qe2#"
    ],
    "mateIn": 2,
    "side": "b",
    "theme": "queen",
    "rating": 1920
  },
  {
    "id": "m2-4",
    "fen": "1nb3nr/rppk1p1p/p4B2/3p3R/P2N4/1P6/2PPPKP1/RN1Q1B2 w - - 0 14",
    "line": [
      "Rxd5+",
      "Ke8",
      "Rd8#"
    ],
    "mateIn": 2,
    "side": "w",
    "theme": "rook",
    "rating": 1950
  }
];

export function activePuzzles() {
  return PUZZLES;
}

export function puzzleById(id) {
  return PUZZLES.find((p) => p.id === id) || null;
}
