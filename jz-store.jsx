// Store: React context + localStorage persistence.
// All app + deck state lives here. Keys are versioned for migration safety.

const STORAGE = {
  settings: 'jizhu:settings:v1',
  progress: (deckUrl) => `jizhu:progress:${deckUrl}:v1`,
  daily:    'jizhu:daily:v1',
};

const DEFAULT_SETTINGS = {
  showHanzi: false,        // true → test on hanzi · false → test on pinyin (hanzi stays visible, dim)
  newCardsPerDay: 8,       // app-wide
  cardsPerSession: 20,
  patternInfill: 'rotate', // 'rotate' | 'random'
  version: 1,
};

function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

// ─── Store / Context ─────────────────────────────────────────────────────

const JzCtx = React.createContext(null);

function useStore() {
  const v = React.useContext(JzCtx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}

function JzProvider({ children }) {
  // App-wide settings
  const [settings, setSettings] = React.useState(() =>
    ({ ...DEFAULT_SETTINGS, ...readJSON(STORAGE.settings, {}) })
  );
  React.useEffect(() => { writeJSON(STORAGE.settings, settings); }, [settings]);

  // Daily new-card counter (app-wide, by date)
  const [daily, setDaily] = React.useState(() => {
    const d = readJSON(STORAGE.daily, { date: todayKey(), newSeen: 0 });
    if (d.date !== todayKey()) return { date: todayKey(), newSeen: 0 };
    return d;
  });
  React.useEffect(() => { writeJSON(STORAGE.daily, daily); }, [daily]);

  // Current deck (in-memory only). status: 'idle' | 'loading' | 'ready' | 'error'
  const [deck, setDeck] = React.useState(null);
  const [deckStatus, setDeckStatus] = React.useState('idle');
  const [deckError, setDeckError] = React.useState(null);
  const lastUrlRef = React.useRef(null);

  // Per-deck progress
  const [progress, setProgress] = React.useState({});
  React.useEffect(() => {
    if (!deck) return;
    setProgress(readJSON(STORAGE.progress(deck.url), {}));
  }, [deck?.url]);

  function persistProgress(next) {
    setProgress(next);
    if (deck) writeJSON(STORAGE.progress(deck.url), next);
  }

  // Async load — fetches and resolves the deck manifest into the in-memory shape.
  // The most recent call wins: if the user kicks off a second load while the
  // first is in flight, the first's result is discarded.
  async function openDeck(url) {
    lastUrlRef.current = url;
    setDeckStatus('loading');
    setDeckError(null);
    try {
      const d = await loadDeckFromUrl(url);
      if (lastUrlRef.current !== url) return; // superseded
      setDeck(d);
      setDeckStatus('ready');
    } catch (e) {
      if (lastUrlRef.current !== url) return;
      setDeckError(e);
      setDeckStatus('error');
      setDeck(null);
    }
  }

  function retryDeck() {
    if (lastUrlRef.current) openDeck(lastUrlRef.current);
  }

  function gradeCard(cardId, grade, wasNew) {
    const now = Date.now();
    const next = { ...progress, [cardId]: applyGrade(progress[cardId], grade, now) };
    persistProgress(next);
    if (wasNew) {
      setDaily(d => d.date === todayKey()
        ? { ...d, newSeen: d.newSeen + 1 }
        : { date: todayKey(), newSeen: 1 });
    }
  }

  // For pattern cards — record which infill we last showed
  function setLastInfill(cardId, idx) {
    const cur = progress[cardId] ?? { ease: 2.5, interval: 0, lapses: 0, reps: 0, dueAt: 0, lastReviewedAt: 0, version: 1 };
    const next = { ...progress, [cardId]: { ...cur, lastInfillIdx: idx } };
    persistProgress(next);
  }

  function updateSettings(patch) {
    setSettings(s => ({ ...s, ...patch }));
  }

  function resetDeckProgress() {
    if (!deck) return;
    persistProgress({});
  }

  // Daily new-card cap remaining
  const newAllowance = Math.max(0, settings.newCardsPerDay - daily.newSeen);

  const value = {
    settings, updateSettings,
    deck, deckStatus, deckError, openDeck, retryDeck,
    progress, gradeCard, setLastInfill, resetDeckProgress,
    daily, newAllowance,
  };
  return <JzCtx.Provider value={value}>{children}</JzCtx.Provider>;
}

// ─── Routing (URL hash) ───────────────────────────────────────────────────

const RouteCtx = React.createContext({ route: 'home', go: () => {} });
function useRoute() { return React.useContext(RouteCtx); }

function RouterProvider({ children }) {
  const [route, setRoute] = React.useState(() => {
    const h = window.location.hash.replace('#', '');
    return h || 'home';
  });
  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace('#', '') || 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  function go(r) {
    window.location.hash = r;
    setRoute(r);
  }
  return <RouteCtx.Provider value={{ route, go }}>{children}</RouteCtx.Provider>;
}

Object.assign(window, {
  JzProvider, useStore,
  RouterProvider, useRoute,
  todayKey,
});
