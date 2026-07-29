import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const TICK_MS = 80;

function stagesFor(control, side) {
  const perSide = control?.perSide?.[side];
  return perSide?.stages || control?.stages || [];
}

function delayFor(control, side) {
  const perSide = control?.perSide?.[side];
  return perSide?.delay ?? control?.delay ?? 0;
}

function initialRemaining(control) {
  return {
    w: stagesFor(control, 'w')[0]?.base ?? 0,
    b: stagesFor(control, 'b')[0]?.base ?? 0,
  };
}

/**
 * Turnuva seviyesinde satranç saati.
 *
 * Süre, her tick'te çıkarma yaparak değil, sıranın başladığı andaki damgadan
 * hesaplanarak bulunur. setInterval gecikirse ya da uygulama arka plana alınıp
 * geri gelirse bile kalan süre doğru kalır; sayaç yalnızca ekranı tazelemek için
 * çalışır.
 */
export function useChessClock(control, options = {}) {
  const { onFlag, onMove, lowTimeThreshold = 10000, onLowTime } = options;

  const [remaining, setRemaining] = useState(() => initialRemaining(control));
  const [active, setActive] = useState(null); // 'w' | 'b' | null
  const [running, setRunning] = useState(false);
  const [moveCount, setMoveCount] = useState({ w: 0, b: 0 });
  const [stageIndex, setStageIndex] = useState({ w: 0, b: 0 });
  const [flagged, setFlagged] = useState(null);
  const [moveTimes, setMoveTimes] = useState([]); // [{side, ms, remaining}]
  const [tick, setTick] = useState(0);

  // Sıra başlangıcının anlık görüntüsü: kalan süre bundan türetilir.
  const turnRef = useRef({ startedAt: 0, base: 0, oppBase: 0 });
  const lowFiredRef = useRef({ w: false, b: false });
  const activeRef = useRef(active);
  activeRef.current = active;
  const controlRef = useRef(control);
  controlRef.current = control;

  const reset = useCallback(
    (nextControl) => {
      const c = nextControl || controlRef.current;
      controlRef.current = c;
      setRemaining(initialRemaining(c));
      setActive(null);
      setRunning(false);
      setMoveCount({ w: 0, b: 0 });
      setStageIndex({ w: 0, b: 0 });
      setFlagged(null);
      setMoveTimes([]);
      lowFiredRef.current = { w: false, b: false };
      turnRef.current = { startedAt: 0, base: 0, oppBase: 0 };
    },
    []
  );

  // Kontrol değişirse (başka bir hazır ayar seçilirse) saati baştan kur.
  useEffect(() => {
    reset(control);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [control]);

  // Sıradaki oyuncunun bu turda harcadığı, gecikme düşülmüş süre.
  const consumedNow = useCallback(
    (side, now) => {
      const c = controlRef.current;
      const elapsed = now - turnRef.current.startedAt;
      if (c?.mode === 'delay') {
        return Math.max(0, elapsed - delayFor(c, side));
      }
      return Math.max(0, elapsed);
    },
    []
  );

  // Ekranda gösterilecek anlık süreler.
  const display = useMemo(() => {
    if (!running || !active) return remaining;
    const now = Date.now();
    const used = consumedNow(active, now);
    const c = controlRef.current;
    const mine = Math.max(0, turnRef.current.base - used);
    if (c?.mode === 'hourglass') {
      const opp = active === 'w' ? 'b' : 'w';
      return { [active]: mine, [opp]: turnRef.current.oppBase + used };
    }
    return { ...remaining, [active]: mine };
    // `tick` her sayaç adımında değişerek yeniden hesaplamayı tetikler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, active, remaining, consumedNow, tick]);

  // Gecikme modunda kalan bekleme süresi (göstergede halka olarak gösterilir).
  const delayRemaining = useMemo(() => {
    const c = controlRef.current;
    if (!running || !active || c?.mode !== 'delay') return 0;
    const d = delayFor(c, active);
    return Math.max(0, d - (Date.now() - turnRef.current.startedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, active, tick]);

  const stopWithFlag = useCallback(
    (side) => {
      setRunning(false);
      setFlagged(side);
      setRemaining((prev) => ({ ...prev, [side]: 0 }));
      onFlag?.(side);
    },
    [onFlag]
  );

  // Görüntü döngüsü + bayrak kontrolü.
  useEffect(() => {
    if (!running || !active) return undefined;
    const id = setInterval(() => {
      const now = Date.now();
      const used = consumedNow(active, now);
      const left = turnRef.current.base - used;
      if (left <= 0) {
        stopWithFlag(active);
        return;
      }
      if (
        left <= lowTimeThreshold &&
        !lowFiredRef.current[active] &&
        lowTimeThreshold > 0
      ) {
        lowFiredRef.current[active] = true;
        onLowTime?.(active);
      }
      setTick((n) => n + 1);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, active, consumedNow, stopWithFlag, lowTimeThreshold, onLowTime]);

  const beginTurn = useCallback((side, base, oppBase) => {
    turnRef.current = { startedAt: Date.now(), base, oppBase };
  }, []);

  /** Saati ilk kez başlatır. Genelde siyah, beyazın saatini başlatmak için basar. */
  const start = useCallback(
    (side = 'w') => {
      if (flagged) return;
      setActive(side);
      setRunning(true);
      lowFiredRef.current[side] = false;
      setRemaining((prev) => {
        beginTurn(side, prev[side], prev[side === 'w' ? 'b' : 'w']);
        return prev;
      });
    },
    [flagged, beginTurn]
  );

  /**
   * `side` hamlesini bitirir; ekleme/gecikme uygulanır ve sıra rakibe geçer.
   * Sırası olmayan oyuncu basarsa yok sayılır (yanlış tarafa basma koruması).
   */
  const pressSide = useCallback(
    (side) => {
      const c = controlRef.current;
      if (flagged) return;

      if (!running) {
        // Duraklatılmışken kendi tarafına basmak sırayı rakibe verir; hiç
        // başlamamışsa basan kişi rakibinin saatini başlatır.
        if (active === null) start(side === 'w' ? 'b' : 'w');
        return;
      }
      if (side !== active) return;

      const now = Date.now();
      const used = consumedNow(side, now);
      const rawElapsed = now - turnRef.current.startedAt;
      const opp = side === 'w' ? 'b' : 'w';

      const stages = stagesFor(c, side);
      const idx = stageIndex[side];
      const currentStage = stages[idx] || stages[stages.length - 1] || { increment: 0 };

      let mine = turnRef.current.base - used;
      if (mine <= 0) {
        stopWithFlag(side);
        return;
      }

      let oppTime = c?.mode === 'hourglass' ? turnRef.current.oppBase + used : remaining[opp];

      if (c?.mode === 'fischer') {
        mine += currentStage.increment || 0;
      } else if (c?.mode === 'bronstein') {
        // Harcanandan fazlası geri verilmez: gecikmeyi tavan kabul ederiz.
        mine += Math.min(delayFor(c, side), rawElapsed);
      }

      const nextCount = moveCount[side] + 1;

      // Aşama tamamlandıysa bir sonraki aşamanın ana süresi eklenir.
      let nextIdx = idx;
      if (currentStage.moves && nextCount >= cumulativeMoves(stages, idx)) {
        const upcoming = stages[idx + 1];
        if (upcoming) {
          mine += upcoming.base;
          nextIdx = idx + 1;
        }
      }

      lowFiredRef.current[side] = mine > lowTimeThreshold ? false : lowFiredRef.current[side];
      lowFiredRef.current[opp] = remaining[opp] > lowTimeThreshold ? false : lowFiredRef.current[opp];

      setRemaining({ [side]: mine, [opp]: oppTime });
      setMoveCount((prev) => ({ ...prev, [side]: nextCount }));
      setStageIndex((prev) => ({ ...prev, [side]: nextIdx }));
      setMoveTimes((prev) => [...prev, { side, ms: rawElapsed, remaining: mine }]);
      setActive(opp);
      beginTurn(opp, oppTime, mine);
      onMove?.({ side, elapsed: rawElapsed, remaining: mine, moveNumber: nextCount });
    },
    [
      flagged,
      running,
      active,
      start,
      consumedNow,
      stageIndex,
      moveCount,
      remaining,
      stopWithFlag,
      beginTurn,
      lowTimeThreshold,
      onMove,
    ]
  );

  const pause = useCallback(() => {
    if (!running || !active) return;
    const now = Date.now();
    const used = consumedNow(active, now);
    const c = controlRef.current;
    const opp = active === 'w' ? 'b' : 'w';
    setRemaining((prev) => ({
      ...prev,
      [active]: Math.max(0, turnRef.current.base - used),
      ...(c?.mode === 'hourglass' ? { [opp]: turnRef.current.oppBase + used } : null),
    }));
    setRunning(false);
  }, [running, active, consumedNow]);

  const resume = useCallback(() => {
    if (running || !active || flagged) return;
    setRemaining((prev) => {
      beginTurn(active, prev[active], prev[active === 'w' ? 'b' : 'w']);
      return prev;
    });
    setRunning(true);
  }, [running, active, flagged, beginTurn]);

  const toggle = useCallback(() => (running ? pause() : resume()), [running, pause, resume]);

  /** Yanlışlıkla basılan hamleyi geri alır. */
  const undoPress = useCallback(() => {
    if (!moveTimes.length) return;
    const last = moveTimes[moveTimes.length - 1];
    setMoveTimes((prev) => prev.slice(0, -1));
    setMoveCount((prev) => ({ ...prev, [last.side]: Math.max(0, prev[last.side] - 1) }));
    setActive(last.side);
    setFlagged(null);
    setRunning(false);
    setRemaining((prev) => ({ ...prev, [last.side]: last.remaining }));
  }, [moveTimes]);

  const addTime = useCallback((side, ms) => {
    setRemaining((prev) => {
      const next = { ...prev, [side]: Math.max(0, prev[side] + ms) };
      if (turnRef.current.startedAt && side === activeRef.current) {
        turnRef.current.base += ms;
      }
      return next;
    });
    setFlagged((f) => (f === side ? null : f));
  }, []);

  const currentStage = useMemo(() => {
    const stages = stagesFor(controlRef.current, active || 'w');
    return stages[stageIndex[active || 'w']] || stages[0] || null;
  }, [active, stageIndex]);

  return {
    remaining: display,
    exactRemaining: remaining,
    active,
    running,
    flagged,
    moveCount,
    moveTimes,
    stageIndex,
    currentStage,
    delayRemaining,
    started: active !== null,
    start,
    pressSide,
    pause,
    resume,
    toggle,
    reset,
    undoPress,
    addTime,
  };
}

// idx'inci aşamanın bitmesi için gereken toplam hamle sayısı.
function cumulativeMoves(stages, idx) {
  let total = 0;
  for (let i = 0; i <= idx; i++) {
    if (!stages[i]?.moves) return Infinity;
    total += stages[i].moves;
  }
  return total;
}
