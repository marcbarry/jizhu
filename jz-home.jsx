// Home + DeckLanding (wired)

function Home() {
  const { loadDeck } = useStore();
  const { go } = useRoute();
  const [urlValue, setUrlValue] = React.useState('');
  const [showInput, setShowInput] = React.useState(false);

  function start() {
    loadDeck(STARTER_DECK);
    go('deck');
  }

  function loadFromUrl() {
    // In production this would fetch the JSON. In the prototype we map
    // the canonical starter URL → STARTER_DECK and fall back for anything else.
    loadDeck(STARTER_DECK);
    go('deck');
  }

  return (
    <Phone>
      {/* Hero — centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <h1 className="sc"
            style={{
              fontSize: 124,
              lineHeight: 1,
              fontWeight: 500,
              color: 'var(--ink)',
              letterSpacing: '0.02em',
            }}>
          记住
        </h1>
        <div style={{
          marginTop: 14,
          fontSize: 34,
          fontWeight: 500,
          color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}>
          jì zhù
        </div>
        <p style={{
          marginTop: 22,
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          maxWidth: 220,
        }}>
          A a flashcard system built specifically for learning Chinese with Pinyin and Hanzi.
        </p>

        {showInput && (
          <div className="w-full mt-8" style={{ maxWidth: 280 }}>
            <input
              type="text"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="jizhu.app/d/starter.json"
              autoFocus
              className="w-full px-3 py-3 mono text-center"
              style={{
                border: '1px solid var(--rule)', borderRadius: 8, fontSize: 12,
                color: 'var(--ink)', background: 'var(--bg)',
              }}
            />
            <button className="btn-primary" style={{ marginTop: 10 }} onClick={loadFromUrl}>
              Load this URL
            </button>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="px-6 pb-8 space-y-2.5">
        {showInput ? (
          <button onClick={() => setShowInput(false)}
                  style={{
                    background: 'transparent',
                    color: 'var(--ink)',
                    border: '1.5px dashed var(--ink-3)',
                    borderRadius: 10,
                    padding: '12.5px 20px',
                    font: '500 14px/1 Inter',
                    width: '100%',
                  }}>
            Back
          </button>
        ) : (
          <>
            <button className="btn-primary" onClick={start}>
              Try the starter deck
            </button>
            <button onClick={() => setShowInput(true)}
                    style={{
                      background: 'transparent',
                      color: 'var(--ink)',
                      border: '1.5px dashed var(--ink-3)',
                      borderRadius: 10,
                      padding: '12.5px 20px',
                      font: '500 14px/1 Inter',
                      width: '100%',
                    }}>
              Paste a deck URL...
            </button>
          </>
        )}
      </div>
    </Phone>
  );
}

function DeckLanding() {
  const { deck, progress, settings, newAllowance } = useStore();
  const { go } = useRoute();

  if (!deck) return <Phone><div className="p-8">No deck loaded.</div></Phone>;

  const stats = deckStats(deck.cards, progress);
  const queue = buildQueue(deck.cards, progress, {
    sessionLimit: settings.cardsPerSession,
    newAllowance,
  });

  return (
    <Phone>
      <AppHeader
        back="Decks"
        right={<button onClick={() => go('settings')} style={{ color: 'var(--ink-2)' }}><IconCog size={20} /></button>}
        onBack={() => go('home')}
      />

      <div className="px-5 pt-4">
        <div className="flex items-start justify-between">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>{deck.name}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{deck.url}</div>
          </div>
          <button onClick={() => go('stats')} className="flex items-center gap-1" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 500 }}>
            <IconFlame size={14} stroke={2} />
            Stats
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: 'var(--accent)' }}>{stats.due}</div>
            <div className="tag" style={{ marginTop: 2 }}>Due</div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{stats.new}</div>
            <div className="tag" style={{ marginTop: 2 }}>New</div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{stats.learned}</div>
            <div className="tag" style={{ marginTop: 2 }}>Learned</div>
          </div>
        </div>

        <div className="mt-4 bar"><i className="accent" style={{ width: stats.reviewedPct + '%' }} /></div>
        <div className="flex justify-between mt-2">
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{stats.learned} / {stats.total} reviewed</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{stats.reviewedPct}%</span>
        </div>
      </div>

      <div className="px-5 mt-5 flex items-center justify-between">
        <span className="tag-on">All cards</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{deck.cards.length}</span>
      </div>

      <div className="px-5 mt-2 flex-1 overflow-hidden">
        <div className="panel" style={{ height: '100%' }}>
          <div className="divide-rule" style={{ height: '100%', overflowY: 'auto' }}>
            {deck.cards.map((c) => {
              const m = mastery(progress[c.id]);
              const lvl = { new: 'l1', learning: 'l2', reviewing: 'l3', mature: 'l4' }[m];
              const heading = c.kind === 'pattern' ? renderPattern(c, 0).tokens : c.tokens;
              const hz = heading.map(t => t.char).join('');
              const py = heading.map(t => t.pinyin).join(' ');
              const en = c.kind === 'pattern' ? `pattern · slot: ${c.slot.id}` : c.translation;
              return (
                <div key={c.id} className="flex items-center justify-between" style={{ padding: '10px 14px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-baseline gap-2">
                      <span className="sc" style={{ fontSize: 16, fontWeight: 500 }}>{hz}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{py}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{en}</div>
                  </div>
                  <span className={"heat " + lvl} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <button className="btn-primary flex items-center justify-center gap-2"
                onClick={() => queue.length && go('review')}
                disabled={!queue.length}
                style={queue.length ? {} : { opacity: 0.4 }}>
          {queue.length ? <>Start review <span className="mono" style={{ fontSize: 12, opacity: 0.6 }}>· {queue.length} card{queue.length === 1 ? '' : 's'}</span></> : 'Nothing due'}
        </button>
        {stats.due === 0 && stats.new > 0 && newAllowance === 0 && (
          <p className="text-center mt-2" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Daily new-card cap reached. Reset in Settings or come back tomorrow.
          </p>
        )}
      </div>
    </Phone>
  );
}

Object.assign(window, { Home, DeckLanding });
