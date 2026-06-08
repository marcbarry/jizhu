// Settings + Stats (wired to store)

function Settings() {
  const { settings, updateSettings, deck, resetDeckProgress, daily, newAllowance, reviewAllowance } = useStore();
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
            <StepperRow label="New cards per day"
              hint={`${daily.newSeen} seen today · ${newAllowance} left.`}
              value={settings.newCardsPerDay} min={0} max={50}
              onChange={(v) => updateSettings({ newCardsPerDay: v })} />
            <StepperRow label="Max reviews per day"
              hint={`${daily.reviewSeen ?? 0} reviewed today · ${reviewAllowance} left. Cap on already-seen cards; tap Study more to keep going past the limit.`}
              value={settings.maxReviewsPerDay} min={0} max={500} step={10}
              onChange={(v) => updateSettings({ maxReviewsPerDay: v })} />
            <ChoiceRow label="Fill-in-the-blank order"
              hint="Some cards are sentences with a missing word, like 'Please give me ___'. Rotate fills the blank with each option in order; Random shuffles them."
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
              <SettingRow label="This Deck" hint={<span className="mono">{deck.url}</span>} />
              <SettingRow last
                label={
                  <button onClick={() => { if (confirm('Reset your progress for this deck?')) { resetDeckProgress(); go('home'); } }}
                          style={{ color: 'var(--neg)' }}>
                    Reset progress
                  </button>
                }
                hint="Forget your stored progress for this deck" />
            </div>
          </div>
        )}
      </div>
    </Phone>
  );
}

// The one settings-row frame: bottom-ruled (unless `last`), label + optional
// hint on the left, an optional control as children on the right.
function SettingRow({ label, hint, last = false, children }) {
  return (
    <div className="flex items-center justify-between gap-3"
         style={{ padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--rule)' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {hint != null && hint !== '' &&
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, hint, on, onChange, last }) {
  return (
    <SettingRow label={label} hint={hint} last={last}>
      <button className={"toggle " + (on ? "on" : "")} onClick={() => onChange(!on)}>
        <span className="knob" />
      </button>
    </SettingRow>
  );
}

function StepperRow({ label, hint, value, min, max, step = 1, onChange, last }) {
  return (
    <SettingRow label={label} hint={hint} last={last}>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - step))}
                disabled={value <= min}>−</button>
        <span className="mono" style={{ fontSize: 14, fontWeight: 500, minWidth: 28, textAlign: 'center' }}>{value}</span>
        <button className="stepper-btn" onClick={() => onChange(Math.min(max, value + step))}
                disabled={value >= max}>+</button>
      </div>
    </SettingRow>
  );
}

function ChoiceRow({ label, hint, value, options, onChange, last }) {
  return (
    <SettingRow label={label} hint={hint} last={last}>
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
    </SettingRow>
  );
}

Object.assign(window, { Settings });
