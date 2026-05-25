// Review session — handles phrase (self-hint) + pattern (multiple-choice) cards.

function ReviewTopBar({ progress, onExit }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between"
         style={{ borderBottom: '1px solid var(--rule)' }}>
      <button className="flex items-center gap-1.5" onClick={onExit}
              style={{ color: 'var(--ink-2)', fontSize: 13, fontWeight: 500 }}>
        <IconChevLeft size={18} />
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exit</span>
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

function PhraseCard({ card, onGrade }) {
  const { settings } = useStore();
  // Each token is hinted or not (binary). Hinting reveals the English for that one token.
  const [hinted, setHinted] = React.useState(() => card.tokens.map(() => false));
  const [transRevealed, setTransRevealed] = React.useState(false);

  // Reset state when card changes
  React.useEffect(() => {
    setHinted(card.tokens.map(() => false));
    setTransRevealed(false);
  }, [card.id]);

  // When every token has been hinted, auto-reveal the full sentence translation.
  React.useEffect(() => {
    if (hinted.length && hinted.every(Boolean)) {
      setTransRevealed(true);
    }
  }, [hinted]);

  function hintToken(i) {
    setHinted(H => H.map((v, j) => j === i ? true : v));
  }

  // Reveal the translation directly AND hint every token at the same time.
  function revealAll() {
    setHinted(H => H.map(() => true));
    setTransRevealed(true);
  }

  return (
    <div className="flex-1 flex flex-col px-5 pt-10">
      <div className="flex items-end justify-center" style={{ gap: '22px 12px', flexWrap: 'wrap' }}>
        {card.tokens.map((t, i) => (
          <button key={i} onClick={() => hintToken(i)}>
            <HintToken
              char={t.char} pinyin={t.pinyin} say={sayAs(t.pinyin)} gloss={t.gloss}
              hinted={hinted[i]} hanziOff={!settings.showHanzi}
            />
          </button>
        ))}
      </div>

      {/* Translation reveal — clicking also hints every token.
          minHeight keeps the button the same height in both states so the
          tokens above don't shift when the text size changes. */}
      <button className="mt-10 mx-1 flex items-center justify-between"
              onClick={revealAll}
              style={{
                border: '1px solid var(--rule)', borderRadius: 10,
                padding: '18px 20px', background: 'var(--bg)',
                minHeight: 72,
              }}>
        <span className="tag">Translation</span>
        {transRevealed
          ? <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)', lineHeight: '28px', textAlign: 'right' }}>{card.translation}</span>
          : <span className="flex items-center gap-1.5" style={{ fontSize: 16, color: 'var(--ink-2)', fontWeight: 500, lineHeight: '24px' }}>
              Tap to reveal <IconChevRight size={14} stroke={2} />
            </span>}
      </button>

      <div className="flex-1" />

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

  // Renderers — produce a row of the sentence using a chosen field (char or pinyin).
  // Always available; we render both rows and let the layout switch emphasis based on mode.
  function renderRow(field, filledMinWidth, blankPlaceholder) {
    return card.template.map((t, i) => {
      if (t.slot) {
        if (chosen != null) {
          return (
            <span key={i} style={{
              color: 'var(--accent)', background: 'var(--accent-2)',
              padding: '0 8px', borderRadius: 4,
            }}>{target[field]}</span>
          );
        }
        return (
          <span key={i} style={{
            display: 'inline-block', minWidth: filledMinWidth,
            padding: '0 8px', borderBottom: '2px solid var(--ink)', color: 'var(--ink-4)',
          }}>{blankPlaceholder}</span>
        );
      }
      return <React.Fragment key={i}>{t[field]}</React.Fragment>;
    }).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ' ', el], []);
  }
  const hanziSentence  = renderRow('char',   56, '?');
  const pinyinSentence = renderRow('pinyin', 80, '__');

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

      <div className="flex-1 flex flex-col justify-evenly min-h-0">
        {/* Sentence — both rows render; emphasis swaps with mode. */}
        <div className="text-center">
          {settings.showHanzi ? (
            <>
              <div className="sc" style={{
                fontSize: 92, lineHeight: 1.02, fontWeight: 500, color: 'var(--ink)',
              }}>{hanziSentence}</div>
              <div style={{ fontSize: 22, color: 'var(--ink-2)', marginTop: 16, lineHeight: 1.35 }}>{pinyinSentence}</div>
            </>
          ) : (
            <>
              <div className="sc" style={{ fontSize: 28, color: 'var(--ink-3)', fontWeight: 400, lineHeight: 1.1 }}>{hanziSentence}</div>
              <div style={{
                fontSize: 52, lineHeight: 1.1, fontWeight: 500, color: 'var(--ink)',
                marginTop: 12,
              }}>{pinyinSentence}</div>
            </>
          )}
          <div style={{ fontSize: 16, color: 'var(--accent)', fontStyle: 'italic', marginTop: 16, lineHeight: 1.35 }}>
            "{sayRow}"
          </div>
        </div>

        {/* English clue / answer state */}
        {chosen == null ? (
          <div className="flex items-center justify-center gap-4"
               style={{
                 background: 'var(--accent-2)',
                 border: '1px solid var(--accent)',
                 borderRadius: 12,
                 padding: '16px 18px',
               }}>
            <span className="tag" style={{ color: 'var(--accent)' }}>Missing word</span>
            <span style={{ fontSize: 24, fontWeight: 650, color: 'var(--accent)' }}>"{target.gloss}"</span>
          </div>
        ) : (
          <div className="text-center">
            <div style={{ fontSize: 24, fontWeight: 550 }}>
              "I {target.gloss}{target.gloss.endsWith('e') ? 'd' : 'ed'}." {/* tiny English-ish */}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5"
                 style={{ fontSize: 14, color: isCorrect ? 'var(--pos)' : 'var(--neg)', fontWeight: 600 }}>
              {isCorrect
                ? <><IconCheck size={16} stroke={2.5} /> Correct</>
                : <><IconClose size={16} stroke={2.5} /> Not quite — answer was <span className="sc">{target.char}</span></>}
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {card.slot.options.map((o, i) => {
          const isPick = chosen === i;
          const isAnswer = chosen != null && i === targetIdx;
          const dimWrong = chosen != null && !isPick && !isAnswer;
          let style = { padding: '22px 12px', textAlign: 'center', transition: 'border-color .15s, background .15s', minHeight: 124 };
          if (isAnswer)       style = { ...style, borderColor: 'var(--pos)', background: '#f0fdf4' };
          else if (isPick)    style = { ...style, borderColor: 'var(--neg)', background: '#fef2f2' };
          else if (dimWrong)  style = { ...style, opacity: 0.4 };
          return (
            <button key={i} className="panel" style={style} onClick={() => pick(i)} disabled={chosen != null}>
              {settings.showHanzi ? (
                <>
                  <div className="sc" style={{ fontSize: 46, fontWeight: 500, lineHeight: 1 }}>{o.char}</div>
                  <div style={{ fontSize: 17, color: 'var(--ink-2)', marginTop: 10 }}>{o.pinyin}</div>
                </>
              ) : (
                <>
                  <div className="sc" style={{ fontSize: 20, fontWeight: 400, lineHeight: 1, color: 'var(--ink-3)' }}>{o.char}</div>
                  <div style={{ fontSize: 32, fontWeight: 500, marginTop: 8, color: 'var(--ink)' }}>{o.pinyin}</div>
                </>
              )}
              <div style={{ fontSize: 13, color: 'var(--accent)', fontStyle: 'italic', marginTop: 6 }}>"{sayAs(o.pinyin)}"</div>
            </button>
          );
        })}
      </div>

      <div className="pt-4 pb-6">
        {chosen != null
          ? <GradeRow onGrade={onGrade} />
          : <div className="text-center" style={{ fontSize: 11, color: 'var(--ink-3)', padding: '14px 0' }}>
              Pick an option to reveal the full sentence
            </div>}
      </div>
    </div>
  );
}

Object.assign(window, { ReviewScreen });
