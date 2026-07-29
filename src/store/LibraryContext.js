import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as db from './db';
import { detectOpening } from '../chess/openings';

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [games, setGames] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const [g, p] = await Promise.all([db.listGames(), db.listPositions()]);
    setGames(g);
    setPositions(p);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addGame = useCallback(async (game) => {
    const withOpening = {
      ...game,
      opening: game.opening ?? detectOpening((game.moves || []).map((m) => m.san)),
    };
    const saved = await db.saveGame(withOpening);
    setGames(await db.listGames());
    return saved;
  }, []);

  const importGames = useCallback(async (list) => {
    const withOpenings = list.map((g) => ({
      ...g,
      opening: g.opening ?? detectOpening((g.moves || []).map((m) => m.san)),
    }));
    const saved = await db.saveGamesBulk(withOpenings);
    setGames(await db.listGames());
    return saved;
  }, []);

  const removeGame = useCallback(async (id) => {
    await db.deleteGame(id);
    setGames((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const removeGames = useCallback(async (ids) => {
    await db.deleteGames(ids);
    const set = new Set(ids);
    setGames((prev) => prev.filter((g) => !set.has(g.id)));
  }, []);

  const addPosition = useCallback(async (pos) => {
    const saved = await db.savePosition(pos);
    setPositions(await db.listPositions());
    return saved;
  }, []);

  const removePosition = useCallback(async (id) => {
    await db.deletePosition(id);
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleGameFavorite = useCallback(async (id) => {
    const full = await db.getGame(id);
    if (!full) return;
    await db.saveGame({ ...full, favorite: !full.favorite });
    setGames(await db.listGames());
  }, []);

  const togglePositionFavorite = useCallback(async (id) => {
    const full = await db.getPosition(id);
    if (!full) return;
    await db.savePosition({ ...full, favorite: !full.favorite });
    setPositions(await db.listPositions());
  }, []);

  const wipe = useCallback(async () => {
    await db.clearAll();
    setGames([]);
    setPositions([]);
  }, []);

  // Ana sayfadaki istatistik kartları. Kullanıcının kendi adını bilmediğimiz
  // için galibiyet sayımı "oynanan" partilerin kaydedilmiş perspektifine dayanır.
  const stats = useMemo(() => {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let moves = 0;
    for (const g of games) {
      moves += g.moveCount || 0;
      if (!g.userSide) {
        if (g.result === '1/2-1/2') draws += 1;
        continue;
      }
      if (g.result === '1/2-1/2') draws += 1;
      else if (g.result === '1-0') g.userSide === 'w' ? (wins += 1) : (losses += 1);
      else if (g.result === '0-1') g.userSide === 'b' ? (wins += 1) : (losses += 1);
    }
    const decided = wins + losses + draws;
    return {
      games: games.length,
      positions: positions.length,
      wins,
      draws,
      losses,
      moves,
      winRate: decided ? Math.round(((wins + draws * 0.5) / decided) * 100) : 0,
    };
  }, [games, positions]);

  const value = useMemo(
    () => ({
      games,
      positions,
      loaded,
      stats,
      refresh,
      addGame,
      importGames,
      removeGame,
      removeGames,
      addPosition,
      removePosition,
      toggleGameFavorite,
      togglePositionFavorite,
      wipe,
      getGame: db.getGame,
      getPosition: db.getPosition,
    }),
    [
      games,
      positions,
      loaded,
      stats,
      refresh,
      addGame,
      importGames,
      removeGame,
      removeGames,
      addPosition,
      removePosition,
      toggleGameFavorite,
      togglePositionFavorite,
      wipe,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
}
