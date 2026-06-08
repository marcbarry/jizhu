// Review session — handles phrase (self-hint) + pattern (multiple-choice) cards.

function ReviewTopBar({ progress, onExit }) {
  return (
    <TopBar
      left={<BackButton label="Pause" onBack={onExit} tag />}
      center={
        <div className="flex items-center gap-2.5">
          <div className="bar" style={{ width: 64 }}>
            <i style={{ width: progress + '%' }} />
          </div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{progress}%</span>
        </div>
      }
      right={<span style={{ width: 60 }} />}
    />
  );
}

function ReviewScreen() {
  const {
    deck, progress, settings, gradeCard, setLastInfill, newAllowance, reviewAllowance,
    session, startSession, advanceSession, requeueCurrent, clearSession,
  } = useStore();
  const { go } = useRoute();

  // Card lookup by id — empty map when no deck so hook order stays stable.
  const byId = React.useMemo(
    () => new Map((deck?.cards ?? []).map(c => [c.id, c])),
    [deck?.id]
  );

  // A persisted session is usable if it's from today and every card still exists.
  const sessionValid = !!(deck && session
    && session.date === todayKey()
    && session.cardIds.length > 0
    && session.cardIds.every(id => byId.has(id)));

  // If there's no usable session, compute a fresh queue from the SRS.
  // The effect below persists it so a refresh resumes at the same card.
  const freshQueue = React.useMemo(() => {
    if (!deck || sessionValid) return null;
    return buildQueue(deck.cards, progress, { newAllowance, reviewAllowance });
    // eslint-disable-next-line
  }, [sessionValid, deck?.id]);

  React.useEffect(() => {
    if (!deck || sessionValid) return;
    if (freshQueue && freshQueue.length > 0) {
      startSession(freshQueue.map(c => c.id));
    }
  }, [sessionValid, freshQueue, deck?.id]);

  if (!deck) { go('home'); return null; }

  let queue, idx;
  if (sessionValid) {
    queue = session.cardIds.map(id => byId.get(id));
    idx = session.idx;
  } else {
    if (!freshQueue || freshQueue.length === 0) {
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
    queue = freshQueue;
    idx = 0;
  }

  if (idx >= queue.length) {
    return <DoneScreen total={queue.length} onContinue={() => { clearSession(); go('deck'); }} />;
  }

  const card = queue[idx];
  const wasNew = !progress[card.id];
  const pct = Math.round((idx / queue.length) * 100);

  function handleGrade(grade) {
    gradeCard(card.id, grade, wasNew);
    // Learning-step requeue: Again resurfaces the card ~3 slots later (≈1m);
    // Hard on a still-new card resurfaces it ~10 slots later (≈6m). Other
    // grades graduate the card out of this session.
    const offset = grade === 'again' ? 3 : (grade === 'hard' && wasNew ? 10 : 0);
    if (offset > 0) requeueCurrent(offset);
    else advanceSession();
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
        <div className="mt-4" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>All caught up</div>
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
          <button key={i} onClick={() => hintToken(i)} disabled={hinted[i]} style={{ userSelect: 'text' }}>
            <HintToken
              char={t.char} pinyin={t.pinyin} say={sayAs(t.pinyin)} gloss={t.gloss}
              hinted={hinted[i]} hanziOff={!settings.showHanzi}
            />
          </button>
        ))}
      </div>

      {/* Translation reveal — clicking also hints every token.
          minHeight keeps the button the same height in both states so the
          tokens above don't shift when the text size changes.
          Once revealed, the button is disabled so it stops looking and acting like a control. */}
      <button className="mt-10 mx-1 flex flex-col items-center text-center"
              onClick={revealAll}
              disabled={transRevealed}
              style={{
                border: '1px solid var(--rule)', borderRadius: 10,
                padding: '18px 20px', background: 'var(--bg)',
                minHeight: 84,
                width: 'calc(100% - 8px)',
              }}>
        <span className="tag">Translation</span>
        {transRevealed
          ? <span style={{ marginTop: 10, fontSize: 21, fontWeight: 500, color: 'var(--ink)', lineHeight: '28px' }}>{card.translation}</span>
          : <span className="flex items-center gap-1.5" style={{ marginTop: 10, fontSize: 16, color: 'var(--ink-2)', fontWeight: 500, lineHeight: '24px' }}>
              Tap to reveal <IconChevDown size={14} stroke={2} />
            </span>}
      </button>

      <div className="flex-1" />

      <div className="pt-6 pb-6">
        <GradeRow onGrade={onGrade} />
      </div>
    </div>
  );
}

// ─── Pattern card · Pick the word ────────────────────────────────────────

function PatternCard({ card, onGrade, setLastInfill, cardState, settings, idxInSession, sessionTotal }) {
  // Pick the target infill and build the displayed option set (target + up to
  // 5 random distractors, shuffled). `originalTargetIdx` is the target's index
  // in the underlying `card.slot.options` list — stable across renders, used
  // when persisting last-shown so rotate/random infill mode stays correct.
  const { options, targetIdx, originalTargetIdx } = React.useMemo(() => {
    const last = cardState?.lastInfillIdx;
    if (card.slot.generator) {
      const generated = generatedSlotOptions(card.slot.generator, last, settings.patternInfill, 6);
      return {
        options: generated,
        targetIdx: Math.max(0, generated.findIndex(o => o.target)),
        originalTargetIdx: null,
      };
    }

    const allOptions = card.slot.options;
    const N = allOptions.length;

    let pickIdx;
    if (settings.patternInfill === 'random') {
      if (last == null) {
        pickIdx = Math.floor(Math.random() * N);
      } else {
        do { pickIdx = Math.floor(Math.random() * N); } while (N > 1 && pickIdx === last);
      }
    } else {
      pickIdx = last == null ? 0 : (last + 1) % N;
    }

    const shuffle = (xs) => {
      for (let i = xs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [xs[i], xs[j]] = [xs[j], xs[i]];
      }
      return xs;
    };
    const targetOption = allOptions[pickIdx];
    const distractors = shuffle(allOptions.filter((_, i) => i !== pickIdx)).slice(0, 5);
    const displayed = shuffle([targetOption, ...distractors]);

    return {
      options: displayed,
      targetIdx: displayed.indexOf(targetOption),
      originalTargetIdx: pickIdx,
    };
  // Do not depend on cardState here: setLastInfill runs as soon as the learner
  // picks an answer, and recomputing would change the target during feedback.
  }, [card.id, card.slot, settings.patternInfill]);

  const target = options[targetIdx];

  const [chosen, setChosen] = React.useState(null); // index or null

  // Per-(non-slot)-token hint: tapping a fixed word reveals its phonetic +
  // English early, mirroring the phrase card. The slot is revealed by picking
  // an answer, not by tapping. Keyed by template index.
  const [hinted, setHinted] = React.useState(() => card.template.map(() => false));

  // Reset on card change
  React.useEffect(() => {
    setChosen(null);
    setHinted(card.template.map(() => false));
  }, [card.id]);

  function hintToken(i) {
    setHinted(H => H.map((v, j) => j === i ? true : v));
  }

  // Each sentence word is the shared HintToken, so a single word looks identical
  // here and on the phrase card. The slot uses the accent/dim placeholder states
  // and is driven by picking an answer; fixed words tap to reveal their hint.
  function renderChip(t, i) {
    if (t.slot) {
      // Unfilled: one dim placeholder. Filled: the picked answer, split into
      // one accent chip per word so a multi-word answer (一 本 书) reads as
      // discrete blocks like the rest of the sentence rather than one clump.
      if (chosen == null) {
        return (
          <HintToken key={i} char="?" pinyin="__" say="" gloss=""
            hinted={false} hanziOff={!settings.showHanzi} tone="dim" pinyinAlways />
        );
      }
      // Generator fills (numbers) are one unit and space their syllables, so
      // only split vocab-group phrases into words; keep numbers whole.
      const parts = card.slot.generator ? [target] : splitWordTokens(target);
      return parts.map((w, j) => (
        <HintToken key={`${i}-${j}`}
          char={w.char} pinyin={w.pinyin} say={sayAs(w.pinyin)} gloss={w.gloss}
          hinted hanziOff={!settings.showHanzi} tone="accent" pinyinAlways />
      ));
    }
    // Fixed words are sentence context for the slot, so their pinyin stays
    // visible (unlike the phrase card, which hides it to test recall). Tapping
    // still reveals the phonetic + English.
    const revealed = hinted[i] || chosen != null;
    return (
      <button key={i} onClick={() => hintToken(i)} disabled={revealed} style={{ userSelect: 'text' }}>
        <HintToken
          char={t.char} pinyin={t.pinyin} say={sayAs(t.pinyin)} gloss={t.gloss}
          hinted={revealed} hanziOff={!settings.showHanzi} pinyinAlways
        />
      </button>
    );
  }

  function pick(i) {
    if (chosen != null) return;
    setChosen(i);
    setLastInfill(card.id, card.slot.generator ? target.value : originalTargetIdx);
  }

  const isCorrect = chosen === targetIdx;

  return (
    <div className="flex-1 flex flex-col px-5 pt-5">
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span className="tag">Pattern · pick the word</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{idxInSession + 1} / {sessionTotal}</span>
      </div>

      <div className="flex-1 flex flex-col justify-evenly min-h-0">
        {/* Sentence — each word is the shared HintToken. The slot is
            accent-highlighted and revealed by picking; fixed words tap to
            reveal, exactly as on the phrase card. */}
        <div className="flex flex-wrap items-start justify-center"
             style={{ rowGap: 18, columnGap: 4 }}>
          {card.template.flatMap((t, i) => renderChip(t, i))}
        </div>

        {/* English clue / answer state */}
        {chosen == null ? (
          <div className="flex items-center justify-center gap-4"
               style={{
                 background: 'var(--accent-2)',
                 border: '1px solid var(--accent)',
                 borderRadius: 12,
                 padding: '16px 18px',
                 marginTop: 24,
                 marginBottom: 24,
               }}>
            <span className="tag" style={{ color: 'var(--accent)' }}>Missing word</span>
            <span style={{ fontSize: 24, fontWeight: 650, color: 'var(--accent)' }}>"{target.gloss}"</span>
          </div>
        ) : (
          <div className="text-center" style={{ marginTop: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 550 }}>
              "{(card.translation || '').replace(new RegExp(`\\{${card.slot.id}\\}`, 'g'), target.gloss)}"
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
      <div className="grid grid-cols-2 gap-2">
        {options.map((o, i) => {
          const isPick = chosen === i;
          const isAnswer = chosen != null && i === targetIdx;
          const dimWrong = chosen != null && !isPick && !isAnswer;
          let style = { padding: '8px 10px', textAlign: 'center', transition: 'border-color .15s, background .15s', minHeight: 72 };
          if (isAnswer)       style = { ...style, borderColor: 'var(--pos)', background: '#f0fdf4' };
          else if (isPick)    style = { ...style, borderColor: 'var(--neg)', background: '#fef2f2' };
          else if (dimWrong)  style = { ...style, opacity: 0.4 };
          return (
            <button key={i} className="panel" style={style} onClick={() => pick(i)} disabled={chosen != null}>
              {settings.showHanzi ? (
                <>
                  <div className="sc" style={{ fontSize: 34, fontWeight: 500, lineHeight: 1 }}>{o.char}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.1 }}>{pinyinSpaced(o.pinyin)}</div>
                </>
              ) : (
                <>
                  <div className="sc" style={{ fontSize: 16, fontWeight: 400, lineHeight: 1, color: 'var(--ink-3)' }}>{o.char}</div>
                  <div style={{ fontSize: 23, fontWeight: 500, marginTop: 10, color: 'var(--ink)', lineHeight: 1.1 }}>{pinyinSpaced(o.pinyin)}</div>
                </>
              )}
              <div style={{
                fontSize: 11, color: 'var(--accent)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.1,
                opacity: chosen != null ? 1 : 0,
              }}>"{sayAs(o.pinyin)}"</div>
              <div style={{
                fontSize: 12, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.1,
                opacity: chosen != null ? 1 : 0,
              }}>{o.gloss}</div>
            </button>
          );
        })}
      </div>

      <div className="pt-4 pb-6">
        {chosen != null && <GradeRow onGrade={onGrade} />}
      </div>
    </div>
  );
}

Object.assign(window, { ReviewScreen });
