// Home + DeckLanding (wired)

// The canonical default deck — relative to the page origin so it works in
// local Docker (http://localhost:8080) and GitHub Pages (https://user.github.io/repo/) alike.
const DEFAULT_DECK_URL = new URL('decks/jizhu-starter.json', window.location.href).href;

function Home() {
  const { openDeck } = useStore();
  const { go } = useRoute();
  const [urlValue, setUrlValue] = React.useState('');
  const [showInput, setShowInput] = React.useState(false);

  function start() {
    openDeck(DEFAULT_DECK_URL);
    go('deck');
  }

  function loadFromUrl() {
    const url = urlValue.trim() || DEFAULT_DECK_URL;
    openDeck(url);
    go('deck');
  }

  return (
    <Phone>
      <div style={{
        position: 'relative',
        flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
      }}>
        <a href="https://github.com/marcbarry/jee-joo"
           target="_blank" rel="noopener noreferrer"
           aria-label="View source on GitHub"
           style={{
             position: 'absolute', top: 14, right: 14, zIndex: 10,
             color: 'var(--ink-2)', display: 'inline-flex',
           }}>
          <IconGitHub size={20} />
        </a>

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
        <p className="mono" style={{
          marginTop: 22,
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          maxWidth: 350,
        }}>
          A minimal flashcard system designed for learning Chinese through Pinyin and phonetic pronunciation.
        </p>

        {showInput && (
          <div className="w-full mt-8" style={{ marginLeft: -8, marginRight: -8 }}>
            <input
              type="text"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder={DEFAULT_DECK_URL}
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
      </div>
    </Phone>
  );
}

function DeckLanding() {
  const { deck, progress, settings, newAllowance, reviewAllowance, daily, studyMore, session } = useStore();
  const { go } = useRoute();
  const [expandedUnits, setExpandedUnits] = React.useState(() => new Set());

  const STUDY_MORE_BUMP = 20; // matches Anki Custom Study default

  function toggleUnit(unitId) {
    setExpandedUnits(s => {
      const next = new Set(s);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }

  if (!deck) return <Phone><div className="p-8">No deck loaded.</div></Phone>;

  const stats = deckStats(deck.cards, progress);
  const queue = buildQueue(deck.cards, progress, { newAllowance, reviewAllowance });

  // Detect an in-flight session so the primary button reads "Resume" instead
  // of "Start review" when the user paused mid-deck. Idx > 0 means at least
  // one card was graded; we also confirm every saved cardId still exists in
  // the current deck (a deck swap or content edit invalidates the session).
  const byId = React.useMemo(() => new Map(deck.cards.map(c => [c.id, c])), [deck]);
  const inFlight = !!(session
    && session.idx > 0
    && session.idx < session.cardIds.length
    && session.cardIds.every(id => byId.has(id)));
  const remaining = inFlight ? session.cardIds.length - session.idx : queue.length;

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

        <div className="mt-5">
          <button className="btn-primary flex items-center justify-center gap-2"
                  onClick={() => (inFlight || queue.length) && go('review')}
                  disabled={!inFlight && !queue.length}
                  style={(inFlight || queue.length) ? {} : { opacity: 0.4 }}>
            {inFlight ? (
              <>
                <span style={{ lineHeight: 1 }}>Resume</span>
                <span className="mono" style={{ fontSize: 12, opacity: 0.6, lineHeight: 1 }}>
                  · {remaining} left
                </span>
              </>
            ) : queue.length ? (
              <>
                <span style={{ lineHeight: 1 }}>Start review</span>
                <span className="mono" style={{ fontSize: 12, opacity: 0.6, lineHeight: 1 }}>
                  · {queue.length} card{queue.length === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <span style={{ lineHeight: 1 }}>Congratulations! You've finished for now.</span>
            )}
          </button>
          <button onClick={() => { if (stats.new > 0) { studyMore(STUDY_MORE_BUMP); go('review'); } }}
                  disabled={stats.new === 0}
                  style={{
                    background: 'transparent',
                    color: 'var(--ink)',
                    border: '1.5px dashed var(--ink-3)',
                    borderRadius: 10,
                    padding: '10px 20px',
                    font: '500 13px/1 Inter',
                    width: '100%',
                    marginTop: 10,
                    opacity: stats.new === 0 ? 0.4 : 1,
                  }}>
            <span style={{ lineHeight: 1 }}>Study more</span>
            <span className="mono" style={{ fontSize: 11, opacity: 0.6, lineHeight: 1, marginLeft: 6 }}>
              · +{STUDY_MORE_BUMP} new
            </span>
          </button>
          <p className="text-center mt-2" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            <span className="mono">{daily.newSeen}</span> of <span className="mono">{settings.newCardsPerDay + (daily.extraNew ?? 0)}</span> new cards shown today
            {stats.due === 0 && stats.new === 0 && (
              <> · deck complete, come back tomorrow</>
            )}
          </p>
        </div>
      </div>

      <div className="px-5 mt-6 flex items-center justify-between">
        <span className="tag-on">Units</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {(deck.units || []).length} units · {deck.cards.length} cards
        </span>
      </div>

      <div className="px-5 mt-2 pb-6 flex-1 overflow-hidden">
        <div className="panel" style={{ height: '100%' }}>
          <div className="divide-rule" style={{ height: '100%', overflowY: 'auto' }}>
            {(deck.units || []).map((u) => {
              const isOpen = expandedUnits.has(u.id);
              return (
                <div key={u.id}>
                  <button onClick={() => toggleUnit(u.id)}
                          className="flex items-center justify-between w-full"
                          style={{ padding: '12px 14px', textAlign: 'left' }}>
                    <span className="flex items-center gap-2" style={{ minWidth: 0 }}>
                      <IconChevRight size={14} stroke={2}
                        style={{
                          transform: isOpen ? 'rotate(90deg)' : 'none',
                          transition: 'transform .15s',
                          color: 'var(--ink-3)',
                          flexShrink: 0,
                        }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{u.title}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {u.cards.length}
                    </span>
                  </button>

                  {isOpen && u.cards.map((c) => {
                    const m = mastery(progress[c.id]);
                    const lvl = { new: 'l1', learning: 'l2', reviewing: 'l3', mature: 'l4' }[m];
                    const heading = c.kind === 'pattern' ? renderPattern(c, 0).tokens : c.tokens;
                    const hz = heading.map(t => t.char).join('');
                    const py = heading.map(t => pinyinSpaced(t.pinyin)).join(' ');
                    const en = c.kind === 'pattern' ? `pattern · slot: ${c.slot.id}` : c.translation;
                    return (
                      <div key={c.id}
                           className="flex items-center gap-3"
                           style={{ padding: '8px 14px 8px 36px', borderTop: '1px solid var(--rule)' }}>
                        <span className="sc" style={{ fontSize: 16, fontWeight: 500, flexShrink: 0 }}>{hz}</span>
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{py}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{en}</div>
                        </div>
                        <span className={"heat " + lvl} style={{ flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </Phone>
  );
}

Object.assign(window, { Home, DeckLanding });
