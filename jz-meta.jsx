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
            <ToggleRow label="Learn with hanzi 汉字"
              hint="Emphasise hanzi characters on cards"
              on={settings.showHanzi} onChange={(v) => updateSettings({ showHanzi: v })} last />
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
              hint={`${daily.newSeen} seen today · ${newAllowance} left.`}
              value={settings.newCardsPerDay} min={0} max={50}
              onChange={(v) => updateSettings({ newCardsPerDay: v })} />
            <StepperRow label="Cards per session"
              hint="One round between Start review and Session complete. Tap Start again for another batch."
              value={settings.cardsPerSession} min={1} max={100}
              onChange={(v) => updateSettings({ cardsPerSession: v })} />
            <ChoiceRow label="Pattern infill"
              hint="On pattern cards: rotate cycles slot options in order, random picks one each time."
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
            </div>
            <div className="panel">
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>This Deck</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{deck.url}</div>
              </div>
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--rule)' }}>
                <button onClick={() => { if (confirm('Reset all SRS progress for this deck?')) resetDeckProgress(); }}
                        style={{ fontSize: 14, fontWeight: 500, color: 'var(--neg)' }}>
                  Reset progress
                </button>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Forget your stored progress for this deck</div>
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

function ChoiceRow({ label, hint, value, options, onChange, last }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--rule)' }}>
      <div className="flex items-center justify-between gap-3">
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
          {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{hint}</div>}
        </div>
        <div className="flex gap-1 flex-shrink-0" style={{ background: 'var(--bg-2)', borderRadius: 8, padding: 2 }}>
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

Object.assign(window, { Settings });
