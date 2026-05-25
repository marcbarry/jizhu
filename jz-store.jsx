// Store: React context + localStorage persistence.
// All app + deck state lives here. Keys are versioned for migration safety.

const STORAGE = {
  settings:    'jizhu:settings:v1',
  progress:    (deckUrl) => `jizhu:progress:${deckUrl}:v1`,
  session:     (deckUrl) => `jizhu:session:${deckUrl}:v1`,
  daily:       'jizhu:daily:v1',
  lastDeckUrl: 'jizhu:lastDeckUrl:v1',
};

// Routes that need a deck loaded — mirrored in jz-app.jsx.
const DECK_HASH_ROUTES = new Set(['deck', 'review']);

const DEFAULT_SETTINGS = {
  showHanzi: false,        // true → test on hanzi · false → test on pinyin (hanzi stays visible, dim)
  newCardsPerDay: 20,      // app-wide (matches Anki default)
  maxReviewsPerDay: 200,   // app-wide (matches Anki default)
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

  // Daily counters (app-wide, by date).
  // extraNew/extraReview are one-tap bumps from "Study more" — reset at midnight with the rest.
  const FRESH_DAILY = () => ({ date: todayKey(), newSeen: 0, reviewSeen: 0, extraNew: 0, extraReview: 0 });
  const [daily, setDaily] = React.useState(() => {
    const d = readJSON(STORAGE.daily, FRESH_DAILY());
    if (d.date !== todayKey()) return FRESH_DAILY();
    return { reviewSeen: 0, extraNew: 0, extraReview: 0, ...d };
  });
  React.useEffect(() => { writeJSON(STORAGE.daily, daily); }, [daily]);

  // Current deck (in-memory only). status: 'idle' | 'loading' | 'ready' | 'error'
  // If we landed on a deck-bound route with a remembered URL, start in 'loading'
  // so the loader paints immediately on refresh rather than flashing the empty
  // deck screen before the autoload kicks in.
  const [deck, setDeck] = React.useState(null);
  const [deckStatus, setDeckStatus] = React.useState(() => {
    const initialHash = window.location.hash.replace('#', '');
    if (DECK_HASH_ROUTES.has(initialHash) && readJSON(STORAGE.lastDeckUrl, null)) {
      return 'loading';
    }
    return 'idle';
  });
  const [deckError, setDeckError] = React.useState(null);
  const lastUrlRef = React.useRef(null);

  // Per-deck progress
  const [progress, setProgress] = React.useState({});
  // Per-deck in-flight review session: { cardIds, idx, date }.
  // Persisted so refresh / exit-and-resume keeps the user at the same card.
  // Cleared only when the user completes the queue or resets deck progress.
  // Hydrated synchronously inside openDeck (not via [deck?.url] effect) so
  // ReviewScreen never sees deck-without-session and races to overwrite it.
  const [session, setSession] = React.useState(null);

  function persistProgress(next) {
    setProgress(next);
    if (deck) writeJSON(STORAGE.progress(deck.url), next);
  }

  function startSession(cardIds) {
    const s = { cardIds, idx: 0, date: todayKey() };
    setSession(s);
    if (deck) writeJSON(STORAGE.session(deck.url), s);
  }
  function advanceSession() {
    setSession(s => {
      if (!s) return s;
      const next = { ...s, idx: s.idx + 1 };
      if (deck) writeJSON(STORAGE.session(deck.url), next);
      return next;
    });
  }
  function clearSession() {
    setSession(null);
    if (deck) localStorage.removeItem(STORAGE.session(deck.url));
  }

  // Async load — fetches and resolves the deck manifest into the in-memory shape.
  // The most recent call wins: if the user kicks off a second load while the
  // first is in flight, the first's result is discarded.
  async function openDeck(url) {
    lastUrlRef.current = url;
    writeJSON(STORAGE.lastDeckUrl, url);
    setDeckStatus('loading');
    setDeckError(null);
    try {
      const d = await loadDeckFromUrl(url);
      if (lastUrlRef.current !== url) return; // superseded
      // Batch deck + per-deck state so ReviewScreen never renders with deck
      // set but session still null (that race would clobber the saved idx).
      setDeck(d);
      setProgress(readJSON(STORAGE.progress(d.url), {}));
      setSession(readJSON(STORAGE.session(d.url), null));
      setDeckStatus('ready');
    } catch (e) {
      if (lastUrlRef.current !== url) return;
      setDeckError(e);
      setDeckStatus('error');
      setDeck(null);
      setSession(null);
    }
  }

  // On refresh into a deck-bound route, reopen the last-used deck so the user
  // stays where they were instead of getting bounced to home.
  React.useEffect(() => {
    if (deckStatus !== 'loading' || lastUrlRef.current) return;
    const last = readJSON(STORAGE.lastDeckUrl, null);
    if (last) openDeck(last);
    // eslint-disable-next-line
  }, []);

  function retryDeck() {
    if (lastUrlRef.current) openDeck(lastUrlRef.current);
  }

  function gradeCard(cardId, grade, wasNew) {
    const now = Date.now();
    const next = { ...progress, [cardId]: applyGrade(progress[cardId], grade, now) };
    persistProgress(next);
    setDaily(d => {
      const base = d.date === todayKey() ? d : FRESH_DAILY();
      return wasNew
        ? { ...base, newSeen: base.newSeen + 1 }
        : { ...base, reviewSeen: base.reviewSeen + 1 };
    });
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
    clearSession();
    setSettings({ ...DEFAULT_SETTINGS });
    setDaily(FRESH_DAILY());
  }

  // One-tap "Study more": ignore today's caps by bumping both allowances.
  // Mirrors Anki's Custom Study — lets the user keep going past the daily limits.
  function studyMore(n = 20) {
    setDaily(d => {
      const base = d.date === todayKey() ? d : FRESH_DAILY();
      return { ...base, extraNew: (base.extraNew ?? 0) + n, extraReview: (base.extraReview ?? 0) + n };
    });
  }

  // Daily caps remaining (include any "Study more" bumps)
  const newAllowance    = Math.max(0, settings.newCardsPerDay   + (daily.extraNew ?? 0)    - daily.newSeen);
  const reviewAllowance = Math.max(0, settings.maxReviewsPerDay + (daily.extraReview ?? 0) - (daily.reviewSeen ?? 0));

  const value = {
    settings, updateSettings,
    deck, deckStatus, deckError, openDeck, retryDeck,
    progress, gradeCard, setLastInfill, resetDeckProgress,
    session, startSession, advanceSession, clearSession,
    daily, newAllowance, reviewAllowance, studyMore,
  };
  return <JzCtx.Provider value={value}>{children}</JzCtx.Provider>;
}

// ─── Routing (URL hash) ───────────────────────────────────────────────────

const RouteCtx = React.createContext({ route: 'home', go: () => {} });
function useRoute() { return React.useContext(RouteCtx); }

function RouterProvider({ children }) {
  const [route, setRoute] = React.useState(() => {
    const h = window.location.hash.replace('#', '');
    if (h) return h;
    // Cold load with no route — if we have a remembered deck, land on its
    // landing page instead of Home. JzProvider's autoload picks up from here.
    if (readJSON(STORAGE.lastDeckUrl, null)) {
      window.location.hash = 'deck';
      return 'deck';
    }
    return 'home';
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
