// Review session — handles phrase (self-hint) + pattern (multiple-choice) cards.

function ReviewTopBar({ progress, onExit }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between"
         style={{ borderBottom: '1px solid var(--rule)' }}>
      <button className="flex items-center gap-1.5" onClick={onExit}
              style={{ color: 'var(--ink-2)', fontSize: 13, fontWeight: 500 }}>
        <IconChevLeft size={18} />
        <span className="mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exit</span>
      </button>
      <div className="flex items-center gap-2.5">
        <div className="bar" style={{ width: 64 }}>
          <i style={{ width: progress + '%' }} />
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{progress}%</span>
      </div>
      <span style={{ width: 60 }} />
    </div>
  );
}

function ReviewScreen() {
  const { deck, progress, settings, gradeCard, setLastInfill, newAllowance } = useStore();
  const { go } = useRoute();

  // Build the queue once when entering review.
  const queue = React.useMemo(() => {
    if (!deck) return [];
    return buildQueue(deck.cards, progress, {
      sessionLimit: settings.cardsPerSession,
      newAllowance,
    });
    // eslint-disable-next-line
  }, [deck?.id]);

  const [idx, setIdx] = React.useState(0);

  if (!deck) { go('home'); return null; }
  if (!queue.length) {
    return (
      <Phone>
        <AppHeader back="Back" onBack={() => go('deck')} />
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="sc" style={{ fontSize: 56, color: 'var(--ink-4)' }}>完</div>
          <p className="mt-4" style={{ fontSize: 15, color: 'var(--ink-2)' }}>Nothing due right now.</p>
        </div>
      </Phone>
    );
  }
  if (idx >= queue.length) {
    return <DoneScreen total={queue.length} onContinue={() => go('deck')} />;
  }

  const card = queue[idx];
  const wasNew = !progress[card.id];
  const pct = Math.round((idx / queue.length) * 100);

  function handleGrade(grade) {
    gradeCard(card.id, grade, wasNew);
    setIdx(i => i + 1);
  }

  return (
    <Phone>
      <ReviewTopBar progress={pct} onExit={() => go('deck')} />
      {card.kind === 'phrase'
        ? <PhraseCard card={card} onGrade={handleGrade} idxInSession={idx} sessionTotal={queue.length} />
        : <PatternCard card={card} onGrade={handleGrade} setLastInfill={setLastInfill} cardState={progress[card.id]} settings={settings} idxInSession={idx} sessionTotal={queue.length} />
      }
    </Phone>
  );
}

function DoneScreen({ total, onContinue }) {
  return (
    <Phone>
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="sc" style={{ fontSize: 64, fontWeight: 500 }}>好</div>
        <div className="mt-4" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>Session complete</div>
        <div className="mt-2 mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{total} card{total === 1 ? '' : 's'} reviewed</div>
      </div>
      <div className="px-6 pb-8">
        <button className="btn-primary" onClick={onContinue}>Back to deck</button>
      </div>
    </Phone>
  );
}

// ─── Phrase card · Self-hint ─────────────────────────────────────────────

function PhraseCard({ card, onGrade, idxInSession, sessionTotal }) {
  const { settings } = useStore();
  // Per-token reveal levels: 0 → 1 (pinyin) → 2 (sound+gloss)
  const [levels, setLevels] = React.useState(() => card.tokens.map(() => 0));
  const [transRevealed, setTransRevealed] = React.useState(false);

  // Reset state when card changes
  React.useEffect(() => {
    setLevels(card.tokens.map(() => 0));
    setTransRevealed(false);
  }, [card.id]);

  function bumpToken(i) {
    setLevels(L => L.map((v, j) => j === i ? Math.min(2, v + 1) : v));
  }

  const hintedCount = levels.filter(v => v > 0).length;

  return (
    <div className="flex-1 flex flex-col px-5 pt-6">
      <div className="flex items-center justify-between">
        <span className="tag">Self-hint</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
          {idxInSession + 1} / {sessionTotal}  ·  {hintedCount} / {card.tokens.length} hinted
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-end justify-center" style={{ gap: 4, flexWrap: 'wrap' }}>
          {card.tokens.map((t, i) => (
            <button key={i} onClick={() => bumpToken(i)}>
              <HintToken
                char={t.char} pinyin={t.pinyin} say={sayAs(t.pinyin)} gloss={t.gloss}
                level={levels[i]} hanziOff={!settings.showHanzi}
              />
            </button>
          ))}
        </div>

        {/* Translation reveal */}
        <button className="mt-10 mx-1 flex items-center justify-between"
                onClick={() => setTransRevealed(true)}
                style={{
                  border: '1px solid var(--rule)', borderRadius: 10,
                  padding: '14px 16px', background: 'var(--bg)',
                }}>
          <span className="tag">Translation</span>
          {transRevealed
            ? <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{card.translation}</span>
            : <span className="flex items-center gap-1.5" style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
                Tap to reveal <IconChevRight size={14} stroke={2} />
              </span>}
        </button>
      </div>

      <div className="mono text-center" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 14, marginBottom: 10, letterSpacing: '0.04em' }}>
        tap once → pinyin  ·  tap again → sound + meaning
      </div>

      <div className="pb-6">
        <GradeRow onGrade={onGrade} />
      </div>
    </div>
  );
}

// ─── Pattern card · Pick the word ────────────────────────────────────────

function PatternCard({ card, onGrade, setLastInfill, cardState, settings, idxInSession, sessionTotal }) {
  // Pick the target infill based on settings + last-shown
  const targetIdx = React.useMemo(() => {
    const last = cardState?.lastInfillIdx;
    const N = card.slot.options.length;
    if (settings.patternInfill === 'random') {
      if (last == null) return Math.floor(Math.random() * N);
      let pick;
      do { pick = Math.floor(Math.random() * N); } while (N > 1 && pick === last);
      return pick;
    }
    // rotate
    return last == null ? 0 : (last + 1) % N;
  }, [card.id]);

  const target = card.slot.options[targetIdx];

  const [chosen, setChosen] = React.useState(null); // index or null

  // Reset on card change
  React.useEffect(() => {
    setChosen(null);
  }, [card.id]);

  // Render the sentence template with the slot as either blank or filled
  function renderSentence(filled) {
    return card.template.map((t, i) => {
      if (t.slot) {
        if (filled) {
          return (
            <span key={i} style={{
              color: 'var(--accent)', background: 'var(--accent-2)',
              padding: '0 8px', borderRadius: 4,
            }}>{settings.showHanzi ? target.char : target.pinyin}</span>
          );
        }
        return (
          <span key={i} style={{
            display: 'inline-block', minWidth: settings.showHanzi ? 56 : 80,
            padding: '0 8px', borderBottom: '2px solid var(--ink)', color: 'var(--ink-4)',
          }}>{settings.showHanzi ? '?' : '__'}</span>
        );
      }
      return <React.Fragment key={i}>{settings.showHanzi ? t.char : t.pinyin}</React.Fragment>;
    }).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' ', el], []);
  }

  // The pinyin & say-as rows underneath
  const pinyinRow = card.template.map((t, i) => {
    if (t.slot) return chosen != null ? <span key={i} style={{ color: 'var(--accent)' }}>{target.pinyin}</span> : <span key={i} style={{ color: 'var(--ink-4)' }}>____</span>;
    return <React.Fragment key={i}>{t.pinyin}</React.Fragment>;
  }).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' ', el], []);

  const sayRow = card.template.map((t, i) => {
    if (t.slot) return chosen != null ? sayAs(target.pinyin) : '__';
    return sayAs(t.pinyin);
  }).join(' ');

  function pick(i) {
    if (chosen != null) return;
    setChosen(i);
    setLastInfill(card.id, targetIdx);
  }

  const isCorrect = chosen === targetIdx;

  return (
    <div className="flex-1 flex flex-col px-5 pt-5">
      <div className="flex items-center justify-between">
        <span className="tag">Pattern · pick the word</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{idxInSession + 1} / {sessionTotal}</span>
      </div>

      {/* Sentence */}
      <div className="text-center mt-6">
        <div className={settings.showHanzi ? "sc" : ""} style={{
          fontSize: settings.showHanzi ? 44 : 28,
          lineHeight: 1.1, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.005em',
        }}>
          {renderSentence(chosen != null)}
        </div>
        {settings.showHanzi && (
          <div className="mono" style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8 }}>{pinyinRow}</div>
        )}
        <div className="mono" style={{ fontSize: 13, color: 'var(--accent)', fontStyle: 'italic', marginTop: settings.showHanzi ? 4 : 8 }}>
          "{sayRow}"
        </div>
      </div>

      {/* English clue */}
      {chosen == null && (
        <div className="mt-6 flex items-center justify-center gap-3"
             style={{
               background: 'var(--accent-2)',
               border: '1px solid var(--accent)',
               borderRadius: 10,
               padding: '10px 14px',
             }}>
          <span className="tag" style={{ color: 'var(--accent)' }}>Missing word</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>"{target.gloss}"</span>
        </div>
      )}

      {/* After-answer translation */}
      {chosen != null && (
        <div className="mt-6 text-center">
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            "I {target.gloss}{target.gloss.endsWith('e') ? 'd' : 'ed'}." {/* tiny English-ish */}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5"
               style={{ fontSize: 12, color: isCorrect ? 'var(--pos)' : 'var(--neg)', fontWeight: 500 }}>
            {isCorrect
              ? <><IconCheck size={14} stroke={2.5} /> Correct</>
              : <><IconClose size={14} stroke={2.5} /> Not quite — answer was <span className="sc">{target.char}</span></>}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {card.slot.options.map((o, i) => {
          const isPick = chosen === i;
          const isAnswer = chosen != null && i === targetIdx;
          const dimWrong = chosen != null && !isPick && !isAnswer;
          let style = { padding: '14px 12px', textAlign: 'center', transition: 'border-color .15s, background .15s' };
          if (isAnswer)       style = { ...style, borderColor: 'var(--pos)', background: '#f0fdf4' };
          else if (isPick)    style = { ...style, borderColor: 'var(--neg)', background: '#fef2f2' };
          else if (dimWrong)  style = { ...style, opacity: 0.4 };
          return (
            <button key={i} className="panel" style={style} onClick={() => pick(i)} disabled={chosen != null}>
              {settings.showHanzi && (
                <div className="sc" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1 }}>{o.char}</div>
              )}
              <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: settings.showHanzi ? 6 : 0 }}>{o.pinyin}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent)', fontStyle: 'italic', marginTop: 2 }}>"{sayAs(o.pinyin)}"</div>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="pb-6">
        {chosen != null
          ? <GradeRow onGrade={onGrade} />
          : <div className="mono text-center" style={{ fontSize: 10, color: 'var(--ink-3)', padding: '14px 0', letterSpacing: '0.04em' }}>
              pick an option to reveal the full sentence
            </div>}
      </div>
    </div>
  );
}

Object.assign(window, { ReviewScreen });
