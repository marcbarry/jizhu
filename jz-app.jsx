// App shell — wires routing to screens, gates deck-bound routes on the deck
// being loaded (showing a loader while in flight, an error screen if it failed).

const DECK_ROUTES = new Set(['deck', 'review']);

function App() {
  const { route, go } = useRoute();
  const { deck, deckStatus, deckError, retryDeck } = useStore();

  // If a deck-bound route is open but nothing has ever been requested,
  // bounce back to home rather than getting stuck.
  React.useEffect(() => {
    if (DECK_ROUTES.has(route) && deckStatus === 'idle') {
      go('home');
    }
  }, [route, deckStatus]);

  let screen;
  if (DECK_ROUTES.has(route) && deckStatus === 'loading') {
    screen = <LoadingScreen onCancel={() => go('home')} />;
  } else if (DECK_ROUTES.has(route) && deckStatus === 'error') {
    screen = <DeckErrorScreen error={deckError} onRetry={retryDeck} onHome={() => go('home')} />;
  } else {
    switch (route) {
      case 'home':     screen = <Home />;         break;
      case 'deck':     screen = <DeckLanding />;  break;
      case 'review':   screen = <ReviewScreen />; break;
      case 'settings': screen = <Settings />;     break;
      default:         screen = <Home />;
    }
  }

  return (
    <div className="canvas-pad">
      <div className="phone-mount">
        {screen}
      </div>
    </div>
  );
}

// ─── Loading + Error screens ─────────────────────────────────────────────

function LoadingScreen({ onCancel }) {
  return (
    <Phone>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="sc" style={{ fontSize: 56, color: 'var(--ink-3)', fontWeight: 500 }}>记</div>
        <div className="mt-5" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Loading deck…
        </div>
      </div>
      <div className="px-6 pb-8">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </Phone>
  );
}

const ERROR_MESSAGES = {
  cors: "Couldn't reach the deck — either the URL is unreachable or the host doesn't allow this app to read its files. Try a deck hosted on GitHub Pages, jsDelivr, Netlify, or another CORS-friendly host.",
  fetch: "The deck file responded with an error. Check the URL and try again.",
  parse: "The deck file isn't valid JSON.",
  schema: "The deck doesn't match the expected shape.",
};

function DeckErrorScreen({ error, onRetry, onHome }) {
  const kind = error?.kind || 'fetch';
  const headline = ERROR_MESSAGES[kind] || "Couldn't load the deck.";
  return (
    <Phone>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="sc" style={{ fontSize: 56, color: 'var(--ink-4)', fontWeight: 500 }}>×</div>
        <div className="mt-4" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Couldn't load deck
        </div>
        <p className="mt-3" style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 280 }}>
          {headline}
        </p>
        {error?.message && (
          <p className="mt-3 mono" style={{ fontSize: 11, color: 'var(--ink-3)', maxWidth: 280, wordBreak: 'break-all' }}>
            {error.message}
          </p>
        )}
      </div>
      <div className="px-6 pb-8 space-y-2.5">
        <button className="btn-primary" onClick={onRetry}>Try again</button>
        <button className="btn-secondary" onClick={onHome}>
          Back
        </button>
      </div>
    </Phone>
  );
}

function Root() {
  return (
    <RouterProvider>
      <JzProvider>
        <App />
      </JzProvider>
    </RouterProvider>
  );
}

Object.assign(window, { App, Root });
