// Deck loader — fetches a deck manifest, resolves any linked vocabulary
// and unit files, validates the shape, and assembles the in-memory deck
// structure the rest of the app consumes.
//
// Spec on disk (docs/spec/deck.md) vs in-memory shape diverge in two places:
//   - Spec uses `hanzi` on tokens; the rendering code uses `char`. We rename.
//   - Spec uses `slots: { name: { group: "..." } }` + `{ slot: "name" }` tokens.
//     In-memory pattern cards use a single resolved `slot: { id, options: [...] }`
//     plus a `template` mixing literal tokens and `{ slot: name }` markers.
// The loader does that translation once, here.
//
// All errors thrown have a `kind` field: 'fetch' | 'cors' | 'parse' | 'schema'.

async function fetchJSON(url) {
  let res;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch (e) {
    // Browsers surface CORS failures as TypeError on fetch — indistinguishable
    // from network failures at this layer. We tag both as 'cors' because the
    // remediation hint (use a CORS-friendly host) is the same and useful.
    const err = new Error(`Couldn't reach ${url}.`);
    err.kind = 'cors';
    err.cause = e;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`${url} responded with ${res.status} ${res.statusText}.`);
    err.kind = 'fetch';
    throw err;
  }
  try {
    return await res.json();
  } catch (e) {
    const err = new Error(`${url} isn't valid JSON.`);
    err.kind = 'parse';
    err.cause = e;
    throw err;
  }
}

function resolveUrl(relative, base) {
  return new URL(relative, base).href;
}

function normalizePinyin(pinyin) {
  return (pinyin ?? '').toLowerCase();
}

// Convert a spec-format token to the in-memory shape (rename hanzi → char).
// Slot tokens pass through unchanged.
function toMemToken(t) {
  if (t && typeof t.slot === 'string') return { slot: t.slot };
  return {
    char: t?.hanzi ?? '',
    pinyin: normalizePinyin(t?.pinyin),
    gloss: t?.gloss ?? '',
  };
}

// Convert a spec-format VocabItem to the in-memory token shape.
function vocabItemToToken(item) {
  return {
    id: item?.id,
    char: item?.hanzi ?? '',
    pinyin: normalizePinyin(item?.pinyin),
    gloss: item?.gloss ?? '',
  };
}

// Spec card → in-memory card. v1 supports a single slot per pattern card
// (the deck data on disk only uses one slot per card; multi-slot is spec'd
// but not yet authored).
function toMemCard(card, vocabulary) {
  const slotNames = Object.keys(card.slots || {});

  if (slotNames.length === 0) {
    return {
      kind: 'phrase',
      id: card.id,
      translation: card.translation ?? '',
      tokens: (card.tokens || []).map(toMemToken),
    };
  }

  const slotName = slotNames[0];
  const slotDef = card.slots[slotName];
  const generator = normalizeSlotGenerator(slotDef, card.id, slotName);

  if (generator) {
    return {
      kind: 'pattern',
      id: card.id,
      translation: card.translation ?? '',
      template: (card.tokens || []).map(toMemToken),
      slot: {
        id: slotName,
        generator,
      },
    };
  }

  const groupItems = vocabulary[slotDef.group] || [];
  const options = groupItems.map(vocabItemToToken);

  // Proper-noun groups (person names, etc.) carry a gloss that is just the
  // pinyin transliteration. Pick-the-word offers no semantic discrimination
  // there — the learner is matching syllables, not meaning — so demote to a
  // phrase card with the first option baked into the template.
  if (options.length > 0 && options.every(isProperNounOption)) {
    const filler = options[0];
    const tokens = (card.tokens || []).map(t => {
      const mem = toMemToken(t);
      if (mem.slot) return { char: filler.char, pinyin: filler.pinyin, gloss: filler.gloss };
      return mem;
    });
    return {
      kind: 'phrase',
      id: card.id,
      translation: fillSlotInText(card.translation ?? '', slotName, filler.gloss),
      tokens,
    };
  }

  return {
    kind: 'pattern',
    id: card.id,
    translation: card.translation ?? '',
    template: (card.tokens || []).map(toMemToken),
    slot: {
      id: slotName,
      group: slotDef.group,
      options,
    },
  };
}

function normalizeSlotGenerator(slotDef, cardId, slotName) {
  if (!slotDef?.generator) return null;
  if (slotDef.generator !== 'mandarin-number') {
    throwSchema(`Card ${cardId} slot "${slotName}" uses unsupported generator "${slotDef.generator}".`);
  }

  const range = normalizeMandarinNumberRange(slotDef.range);
  if (!range) {
    throwSchema(`Card ${cardId} slot "${slotName}" has an invalid mandarin-number range.`);
  }

  return { kind: 'mandarin-number', range };
}

function normalizeMandarinNumberRange(range) {
  if (!Array.isArray(range) || range.length !== 2) return null;
  const min = Number(range[0]);
  const max = Number(range[1]);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max > window.MANDARIN_NUMBER_MAX || min > max) return null;
  return [min, max];
}

function throwSchema(message) {
  const err = new Error(message);
  err.kind = 'schema';
  throw err;
}

function isProperNounOption(opt) {
  if (!opt?.gloss || !opt?.pinyin) return false;
  const norm = s => stripTones(s).replace(/\s+/g, '').toLowerCase();
  return norm(opt.gloss) === norm(opt.pinyin);
}

function fillSlotInText(text, slotName, value) {
  return text.replace(new RegExp(`\\{${slotName}\\}`, 'g'), value);
}

function validateManifest(m, url) {
  if (!m || typeof m !== 'object') {
    const err = new Error(`Deck manifest at ${url} isn't an object.`);
    err.kind = 'schema';
    throw err;
  }
  if (!m.title || typeof m.title !== 'string') {
    const err = new Error(`Deck manifest is missing a "title".`);
    err.kind = 'schema';
    throw err;
  }
  if (!Array.isArray(m.units)) {
    const err = new Error(`Deck manifest "units" must be an array.`);
    err.kind = 'schema';
    throw err;
  }
}

async function resolveVocabulary(rawVocab, baseUrl) {
  const entries = Object.entries(rawVocab || {});
  const resolved = await Promise.all(entries.map(async ([id, ref]) => {
    if (typeof ref === 'string') {
      const file = await fetchJSON(resolveUrl(ref, baseUrl));
      return [id, Array.isArray(file?.items) ? file.items : []];
    }
    // Inline form — already an array of VocabItems per spec.
    return [id, Array.isArray(ref) ? ref : []];
  }));
  return Object.fromEntries(resolved);
}

async function resolveUnits(rawUnits, baseUrl) {
  return Promise.all((rawUnits || []).map(async (u) => {
    if (typeof u === 'string') return await fetchJSON(resolveUrl(u, baseUrl));
    return u;
  }));
}

// Public entry: load a deck from a URL into the in-memory shape.
async function loadDeckFromUrl(manifestUrl) {
  const manifest = await fetchJSON(manifestUrl);
  validateManifest(manifest, manifestUrl);

  const [vocabulary, units] = await Promise.all([
    resolveVocabulary(manifest.vocabulary, manifestUrl),
    resolveUnits(manifest.units, manifestUrl),
  ]);

  // Emit BOTH the unit-grouped structure (for the deck-landing list) and a
  // flat `cards` array (for the SRS layer, which doesn't care about units).
  const memUnits = [];
  const cards = [];
  for (const unit of units) {
    if (!unit) continue;
    const unitCards = [];
    for (const c of (unit.cards || [])) {
      if (!c || !c.id) continue; // skip malformed
      const mc = toMemCard(c, vocabulary);
      unitCards.push(mc);
      cards.push(mc);
    }
    memUnits.push({
      id: unit.id || '',
      title: unit.title || '',
      description: unit.description || '',
      cards: unitCards,
    });
  }

  if (cards.length === 0) {
    const err = new Error(`Deck has no cards.`);
    err.kind = 'schema';
    throw err;
  }

  return {
    url: manifestUrl,           // canonical identity for localStorage scoping
    id: manifestUrl,
    name: manifest.title,
    description: manifest.description || '',
    languageProfile: manifest.languageProfile || null,
    units: memUnits,
    cards,
  };
}

Object.assign(window, { loadDeckFromUrl, fetchJSON });
