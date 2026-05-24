// SM-2 inspired SRS scheduling.
// Per-card state shape:
//   { ease, interval, dueAt, lastReviewedAt, reps, lapses, lastInfillIdx?, version }

const SRS_VERSION = 1;
const MIN_EASE = 1.3;
const INITIAL_EASE = 2.5;

// Returns ms representing the grade's interval extension.
// New cards (interval === 0) use short intervals (minutes).
function gradeToInterval(state, grade) {
  const isNew = !state.interval || state.interval === 0;
  const MINUTE = 60_000;
  const DAY    = 24 * 60 * MINUTE;

  let ease = state.ease ?? INITIAL_EASE;
  let interval = state.interval ?? 0;
  let lapses = state.lapses ?? 0;

  if (isNew) {
    // Learning steps
    switch (grade) {
      case 'again': return { ease, interval: 1 * MINUTE, lapses, reps: 0 };
      case 'hard':  return { ease, interval: 6 * MINUTE, lapses, reps: 1 };
      case 'good':  return { ease, interval: 1 * DAY,    lapses, reps: 1 };
      case 'easy':  return { ease: ease + 0.15, interval: 4 * DAY, lapses, reps: 1 };
    }
  }

  // Mature cards
  switch (grade) {
    case 'again':
      // Lapse: reset to short interval, lower ease
      return {
        ease: Math.max(MIN_EASE, ease - 0.2),
        interval: 1 * MINUTE,
        lapses: lapses + 1,
        reps: 0,
      };
    case 'hard':
      return {
        ease: Math.max(MIN_EASE, ease - 0.15),
        interval: Math.max(MINUTE, interval * 1.2),
        lapses,
        reps: (state.reps ?? 0) + 1,
      };
    case 'good':
      return {
        ease,
        interval: interval * ease,
        lapses,
        reps: (state.reps ?? 0) + 1,
      };
    case 'easy':
      return {
        ease: ease + 0.15,
        interval: interval * ease * 1.3,
        lapses,
        reps: (state.reps ?? 0) + 1,
      };
  }
  return { ease, interval, lapses, reps: state.reps ?? 0 };
}

// Apply a grade to a card. Returns a new state object.
function applyGrade(currentState, grade, now = Date.now()) {
  const base = currentState ?? {
    ease: INITIAL_EASE,
    interval: 0,
    lapses: 0,
    reps: 0,
    dueAt: 0,
    lastReviewedAt: 0,
    version: SRS_VERSION,
  };
  const next = gradeToInterval(base, grade);
  return {
    ...base,
    ease: next.ease,
    interval: next.interval,
    lapses: next.lapses,
    reps: next.reps,
    lastReviewedAt: now,
    dueAt: now + next.interval,
    version: SRS_VERSION,
  };
}

// Classify a card into one of: 'new' | 'learning' | 'reviewing' | 'mature'
function mastery(state) {
  const DAY = 24 * 60 * 60_000;
  if (!state || state.reps === 0) return 'new';
  if (!state.interval || state.interval < DAY) return 'learning';
  if (state.interval < 21 * DAY) return 'reviewing';
  return 'mature';
}

// Build the review queue for a deck.
// - Includes any card whose dueAt <= now (existing cards that need review)
// - Plus up to `newAllowance` new cards (cards with no state yet)
// - Capped at `sessionLimit` total
// - Sorted: due cards first (oldest due first), then new cards
function buildQueue(cards, progress, opts) {
  const now = opts.now ?? Date.now();
  const sessionLimit = opts.sessionLimit ?? 20;
  const newAllowance = Math.max(0, opts.newAllowance ?? 8);

  const due = [];
  const fresh = [];
  for (const card of cards) {
    const s = progress[card.id];
    if (!s) {
      fresh.push(card);
    } else if (s.dueAt <= now) {
      due.push({ card, dueAt: s.dueAt });
    }
  }
  due.sort((a, b) => a.dueAt - b.dueAt);

  const queue = [];
  for (const d of due) {
    if (queue.length >= sessionLimit) break;
    queue.push(d.card);
  }
  for (const f of fresh) {
    if (queue.length >= sessionLimit) break;
    if (queue.filter(c => !progress[c.id]).length >= newAllowance) break;
    queue.push(f);
  }
  return queue;
}

// Stats for the deck landing screen
function deckStats(cards, progress, now = Date.now()) {
  let due = 0, newCount = 0, learned = 0, mature = 0;
  for (const card of cards) {
    const s = progress[card.id];
    if (!s) { newCount++; continue; }
    if (s.dueAt <= now) due++;
    learned++;
    if (mastery(s) === 'mature') mature++;
  }
  return {
    total: cards.length,
    due,
    new: newCount,
    learned,
    mature,
    reviewedPct: cards.length ? Math.round((learned / cards.length) * 100) : 0,
  };
}

Object.assign(window, {
  SRS_VERSION,
  applyGrade, gradeToInterval, mastery,
  buildQueue, deckStats,
});
