// Settings + Stats (wired to store)

function Settings() {
  const { settings, updateSettings, deck, resetDeckProgress, daily, newAllowance } = useStore();
  const { go } = useRoute();

  return (
    <Phone>
      <AppHeader back="Back" title="Settings" onBack={() => deck ? go('deck') : go('home')} />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* App-wide: Display */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="tag-on">Display</span>
            <span className="tag">app-wide</span>
          </div>
          <div className="panel">
            <ToggleRow label="Show hanzi 汉字" hint="Master toggle for characters."
              on={settings.showHanzi} onChange={(v) => updateSettings({ showHanzi: v })} />
            <ToggleRow label="Show pinyin"
              on={settings.showPinyin} onChange={(v) => updateSettings({ showPinyin: v })} />
            <ToggleRow label="Show translation"
              on={settings.showTranslation} onChange={(v) => updateSettings({ showTranslation: v })} last />
          </div>
        </div>

        {/* App-wide: Review */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="tag-on">Review</span>
            <span className="tag">app-wide</span>
          </div>
          <div className="panel">
            <StepperRow label="New cards / day"
              hint={`Global cap. ${daily.newSeen} seen today · ${newAllowance} left.`}
              value={settings.newCardsPerDay} min={0} max={50}
              onChange={(v) => updateSettings({ newCardsPerDay: v })} />
            <StepperRow label="Cards per session"
              value={settings.cardsPerSession} min={1} max={100}
              onChange={(v) => updateSettings({ cardsPerSession: v })} />
            <ChoiceRow label="Pattern infill"
              value={settings.patternInfill}
              options={[['rotate','Rotate'], ['random','Random']]}
              onChange={(v) => updateSettings({ patternInfill: v })} last />
          </div>
        </div>

        {/* Deck-level */}
        {deck && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="tag-on">Deck</span>
              <span className="tag">this deck</span>
            </div>
            <div className="panel">
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Source</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{deck.url}</div>
              </div>
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--rule)' }}>
                <button onClick={() => { if (confirm('Reset all SRS progress for this deck?')) resetDeckProgress(); }}
                        style={{ fontSize: 14, fontWeight: 500, color: 'var(--neg)' }}>
                  Reset progress
                </button>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Clears SRS state for this deck only.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Phone>
  );
}

function ToggleRow({ label, hint, on, onChange, last }) {
  return (
    <div className="flex items-center justify-between"
         style={{ padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--rule)' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{hint}</div>}
      </div>
      <button className={"toggle " + (on ? "on" : "")} onClick={() => onChange(!on)}>
        <span className="knob" />
      </button>
    </div>
  );
}

function StepperRow({ label, hint, value, min, max, step = 1, onChange, last }) {
  return (
    <div className="flex items-center justify-between"
         style={{ padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--rule)' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{hint}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - step))}
                disabled={value <= min}>−</button>
        <span className="mono" style={{ fontSize: 14, fontWeight: 500, minWidth: 28, textAlign: 'center' }}>{value}</span>
        <button className="stepper-btn" onClick={() => onChange(Math.min(max, value + step))}
                disabled={value >= max}>+</button>
      </div>
    </div>
  );
}

function ChoiceRow({ label, value, options, onChange, last }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--rule)' }}>
      <div className="flex items-center justify-between">
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div className="flex gap-1" style={{ background: 'var(--bg-2)', borderRadius: 8, padding: 2 }}>
          {options.map(([v, lbl]) => (
            <button key={v} onClick={() => onChange(v)}
                    style={{
                      fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 6,
                      background: value === v ? 'var(--bg)' : 'transparent',
                      color: value === v ? 'var(--ink)' : 'var(--ink-3)',
                      boxShadow: value === v ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──── Stats ────────────────────────────────────────────────────────────

function Stats() {
  const { deck, progress } = useStore();
  const { go } = useRoute();

  if (!deck) { go('home'); return null; }

  // Group cards by mastery
  const buckets = { new: [], learning: [], reviewing: [], mature: [] };
  for (const c of deck.cards) {
    buckets[mastery(progress[c.id])].push(c);
  }

  // Build a mini heatmap from review timestamps in progress
  const weeks = 14, days = 7;
  const now = new Date();
  const startMs = now - (weeks * days - 1) * 24 * 60 * 60_000;
  const dailyCount = new Map();
  for (const cardId in progress) {
    const t = progress[cardId].lastReviewedAt;
    if (!t || t < startMs) continue;
    const key = new Date(t).toISOString().slice(0, 10);
    dailyCount.set(key, (dailyCount.get(key) ?? 0) + 1);
  }
  function dateKeyFor(w, d) {
    const offsetDays = (weeks - 1 - w) * days + (days - 1 - d);
    const dt = new Date(now);
    dt.setDate(dt.getDate() - offsetDays);
    return dt.toISOString().slice(0, 10);
  }
  function heatLvl(count) {
    if (!count) return '';
    if (count <= 2) return 'l1';
    if (count <= 5) return 'l2';
    if (count <= 10) return 'l3';
    return 'l4';
  }
  const todayK = todayKey(now);

  const totalReviews = Object.values(progress).reduce((sum, s) => sum + (s.reps || 0) + (s.lapses || 0), 0);
  const totalLearned = deck.cards.length - buckets.new.length;

  return (
    <Phone>
      <AppHeader back="Back" title="Progress" onBack={() => go('deck')} />

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        <div className="panel" style={{ padding: '14px 16px' }}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: 'var(--accent)' }}>
                {[...dailyCount.keys()].length || 0}
              </div>
              <div className="tag" style={{ marginTop: 2 }}>active days</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{totalReviews}</div>
              <div className="tag" style={{ marginTop: 2 }}>reviews</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{totalLearned}</div>
              <div className="tag" style={{ marginTop: 2 }}>learned</div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mt-5">
          <div className="tag-on mb-3">Last 14 weeks</div>
          <div className="panel" style={{ padding: '14px 12px' }}>
            <div className="flex justify-between" style={{ gap: 3 }}>
              {Array.from({ length: weeks }).map((_, w) => (
                <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {Array.from({ length: days }).map((_, d) => {
                    const k = dateKeyFor(w, d);
                    const lvl = heatLvl(dailyCount.get(k));
                    const isToday = k === todayK;
                    return <span key={d} className={"heat " + (isToday ? "now" : lvl)} />;
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-3" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
              <span className="mono">less</span>
              <span className="heat" />
              <span className="heat l1" />
              <span className="heat l2" />
              <span className="heat l3" />
              <span className="heat l4" />
              <span className="mono">more</span>
            </div>
          </div>
        </div>

        {/* By mastery */}
        <div className="mt-5">
          <div className="tag-on mb-3">By mastery</div>
          <div className="space-y-3">
            {[
              ['New',       buckets.new.length,       ''],
              ['Learning',  buckets.learning.length,  'accent'],
              ['Reviewing', buckets.reviewing.length, ''],
              ['Mature',    buckets.mature.length,    ''],
            ].map(([name, n, mod], i) => {
              const pct = deck.cards.length ? Math.round((n / deck.cards.length) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: 13 }}>{name}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{n}</span>
                  </div>
                  <div className="bar"><i className={mod} style={{ width: pct + '%' }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cards list */}
        <div className="mt-5">
          <div className="tag-on mb-3">Cards</div>
          <div className="panel">
            <div className="divide-rule">
              {deck.cards.map((c) => {
                const m = mastery(progress[c.id]);
                const lvl = { new: 'l1', learning: 'l2', reviewing: 'l3', mature: 'l4' }[m];
                const heading = c.kind === 'pattern' ? renderPattern(c, 0).tokens : c.tokens;
                const hz = heading.map(t => t.char).join('');
                const py = heading.map(t => t.pinyin).join(' ');
                const s = progress[c.id];
                return (
                  <div key={c.id} className="flex items-center justify-between" style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                      <span className={"heat " + lvl} />
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="sc" style={{ fontSize: 15, fontWeight: 500 }}>{hz}</span>
                          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{py}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1, textTransform: 'capitalize' }}>{m}</div>
                      </div>
                    </div>
                    {s && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>×{s.reps || 0}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

Object.assign(window, { Settings, Stats });
