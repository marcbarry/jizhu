// Pinyin → English approximation, plus small token helpers.
// Per requirements: the deck stores pinyin only; the say-as approximation is
// an app concern. Mandarin has ~400 syllables (1300 with tones); the function
// below covers them all via initial + final rewrite rules, with a handful of
// overrides for awkward cases the rules would mishandle.

// Pinyin initials → English-friendly consonant sound.
const INITIAL_MAP = {
  ''  : '',
  b: 'b', p: 'p', m: 'm', f: 'f',
  d: 'd', t: 't', n: 'n', l: 'l',
  g: 'g', k: 'k', h: 'h',
  j: 'j', q: 'ch', x: 'sh',
  r: 'r',
  z: 'dz', c: 'ts', s: 's',
  zh: 'j', ch: 'ch', sh: 'sh',
  y: '',  w: 'w',
};

// Pinyin finals → English-friendly vowel/coda. Longest-match wins; the lookup
// is keyed on the exact final string, so iang/iong/uang/ueng (4-char) and the
// 3-char finals come before their 2-char prefixes by virtue of object lookup.
const FINAL_MAP = {
  // 4-char
  iang: 'yahng', iong: 'yoong', uang: 'wahng', ueng: 'wung',
  // 3-char
  iao: 'yow', ian: 'yen', iou: 'yo', ing: 'ing',
  uai: 'why', uan: 'wahn',
  uei: 'way', uen: 'wun',
  ang: 'ahng', eng: 'ung', ong: 'oong',
  'üan': 'ywen',
  // 2-char
  ia: 'yah', ie: 'yeh', iu: 'yo', in: 'een',
  ua: 'wah', uo: 'waw', ui: 'way', un: 'wun',
  'üe': 'yweh', 'ün': 'yun',
  ai: 'eye', ei: 'ay', ao: 'ow', ou: 'oh',
  an: 'ahn', en: 'uhn', er: 'are',
  // 1-char
  a: 'ah', o: 'aw', e: 'uh',
  i: 'ee', u: 'oo', 'ü': 'yoo',
};

// After zh/ch/sh/r/z/c/s, bare 'i' is the buzzed retroflex/sibilant — sounds
// like "rr", not "ee". (chī → "chrr", not "chee".)
const BUZZED_I_INITIALS = new Set(['zh', 'ch', 'sh', 'r', 'z', 'c', 's']);

// After j/q/x/y, an orthographic 'u' actually represents the ü sound.
const JQXY = new Set(['j', 'q', 'x', 'y']);

// Whole-syllable overrides for cases where the rule output reads awkwardly to
// English speakers. Keep this small — the rules cover the vast majority.
const OVERRIDES = {
  // Common compact multi-syllable words with neutral-tone reductions.
  xiexie: 'shyeh-shyeh',
  zaijian: 'dzeye-jyen',
  duibuqi: 'dway-boo-chee',
  keqi: 'kuh-chee',
  'bu keqi': 'boo kuh-chee',
  bukeqi: 'boo kuh-chee',
  xuesheng: 'shweh-shung',
  mingzi: 'ming-dzuh',
  pengyou: 'pung-yo',
  laoshi: 'laow-shrr',
  // w-/y- bare syllables
  wu: 'oo',
  yi: 'ee',
  // j/q/x + ü-merged spellings — rules would produce y-prefixed glides
  xue:  'shweh',  que:  'chweh',  jue:  'jweh',
  xuan: 'shwen',  quan: 'chwen',  juan: 'jwen',
  xun:  'shoon',  qun:  'choon',  jun:  'joon',
};

// Strip sentence punctuation around a pinyin syllable.
function cleanPinyinSyllable(p) {
  return p
    .replace(/^[“"'<([{]+|[”"'>)\]}.,!?;:。？！、，；：]+$/g, '')
    .toLowerCase();
}

// Strip tone marks → bare syllable, lowercased, for rule lookup. Toned ü vowels
// stay in the ü class so nü/lü remain distinct from nu/lu.
function stripTones(p) {
  const map = {
    'ā':'a','á':'a','ǎ':'a','à':'a',
    'ē':'e','é':'e','ě':'e','è':'e',
    'ī':'i','í':'i','ǐ':'i','ì':'i',
    'ō':'o','ó':'o','ǒ':'o','ò':'o',
    'ū':'u','ú':'u','ǔ':'u','ù':'u',
    'ǖ':'ü','ǘ':'ü','ǚ':'ü','ǜ':'ü',
  };
  return cleanPinyinSyllable(p).split('').map(c => map[c] || c).join('');
}

function normalizeYW(bare) {
  if (bare === 'yi') return bare;
  if (bare === 'wu') return bare;
  if (bare === 'yu') return 'ü';

  // y marks i-/ü-family finals when no consonant initial is written.
  if (bare.startsWith('y')) {
    const rest = bare.slice(1);
    if (['ue', 'uan', 'un'].includes(rest)) return 'ü' + rest.slice(1);
    if (rest === 'ong') return 'iong';
    return 'i' + rest;
  }

  // w marks u-family finals when no consonant initial is written.
  if (bare.startsWith('w')) {
    const rest = bare.slice(1);
    if (rest === 'u') return 'u';
    return 'u' + rest;
  }

  return bare;
}

function splitSyllable(bare) {
  if (/^(zh|ch|sh)/.test(bare)) return [bare.slice(0, 2), bare.slice(2)];
  if (/^[bpmfdtnlgkhjqxrzcsyw]/.test(bare)) return [bare[0], bare.slice(1)];
  return ['', bare];
}

function isKnownSyllable(bare) {
  if (!bare) return false;
  if (OVERRIDES[bare]) return true;
  const normalized = normalizeYW(bare);
  if (OVERRIDES[normalized]) return true;
  const [initial, rawFinal] = splitSyllable(normalized);
  let final = rawFinal;
  if (JQXY.has(initial) && final.startsWith('u')) {
    final = 'ü' + final.slice(1);
  }
  return final === 'i' && BUZZED_I_INITIALS.has(initial) || Object.prototype.hasOwnProperty.call(FINAL_MAP, final);
}

function splitCompactPinyin(bare) {
  const memo = new Map();

  function walk(start) {
    if (start === bare.length) return [];
    if (memo.has(start)) return memo.get(start);

    const maxLen = Math.min(6, bare.length - start);
    for (let len = maxLen; len >= 1; len--) {
      const piece = bare.slice(start, start + len);
      if (!isKnownSyllable(piece)) continue;
      const rest = walk(start + len);
      if (rest) {
        const result = [piece, ...rest];
        memo.set(start, result);
        return result;
      }
    }

    memo.set(start, null);
    return null;
  }

  return walk(0);
}

function sayAsSyllable(pinyin) {
  const bare = normalizeYW(stripTones(pinyin));
  if (!bare) return '';

  if (OVERRIDES[bare]) return OVERRIDES[bare];

  let [initial, final] = splitSyllable(bare);

  // j/q/x/y + u-final → ü-final orthography
  if (JQXY.has(initial) && final.startsWith('u')) {
    final = 'ü' + final.slice(1);
  }

  // Buzzed-i after retroflex/sibilant initials
  if (final === 'i' && BUZZED_I_INITIALS.has(initial)) {
    return (INITIAL_MAP[initial] ?? '') + 'rr';
  }

  const initialSound = INITIAL_MAP[initial] ?? '';
  const finalSound   = FINAL_MAP[final]    ?? final;
  return initialSound + finalSound;
}

// Pinyin (with or without tone marks) → English approximation.
function sayAs(pinyin) {
  if (!pinyin) return '';
  // A multi-syllable phrase falls back to per-syllable lookup. Pinyin in our
  // decks is mostly one token = one syllable, but we handle space-separated
  // input defensively.
  if (/\s/.test(pinyin)) {
    const barePhrase = pinyin.split(/\s+/).map(stripTones).join(' ');
    if (OVERRIDES[barePhrase]) return OVERRIDES[barePhrase];
    return pinyin.split(/\s+/).map(sayAs).join(' ');
  }

  const bare = stripTones(pinyin);
  if (OVERRIDES[bare]) return OVERRIDES[bare];
  const compact = splitCompactPinyin(bare);
  if (compact && compact.length > 1) {
    return compact.map(sayAsSyllable).join('-');
  }
  return sayAsSyllable(pinyin);
}

// Split a compact pinyin token like "Duìbuqǐ" into its syllables preserving
// tone marks and trailing punctuation — used for display so multi-syllable
// tokens read as "Duì bu qǐ" instead of one run-on string. Reuses the same
// syllable detector as sayAs, so the boundaries line up with pronunciation.
function splitPinyinSyllables(s) {
  if (!s) return [];

  // Honour any explicit separators the deck author included.
  if (/\s/.test(s)) {
    return s.split(/\s+/).filter(Boolean).flatMap(splitPinyinSyllables);
  }

  // Detach trailing punctuation so the splitter only sees the linguistic part.
  const m = s.match(/^(.*?)([.,!?;:。？！、，；：]*)$/);
  const main = m ? m[1] : s;
  const tail = m ? m[2] : '';
  if (!main) return [s];

  const bare = stripTones(main);
  const parts = splitCompactPinyin(bare);

  // If the splitter can't decompose (single syllable, or unrecognised string),
  // return the whole token as-is rather than mangling it.
  if (!parts || parts.length <= 1) {
    return [s];
  }

  // stripTones is char-by-char (with outer punctuation removed), so bare maps
  // 1:1 to slices of `main`. Walking by part lengths recovers the original
  // characters (including tone marks) per syllable.
  const result = [];
  let pos = 0;
  for (const part of parts) {
    result.push(main.slice(pos, pos + part.length));
    pos += part.length;
  }
  if (tail && result.length) {
    result[result.length - 1] += tail;
  }
  return result;
}

// Convenience: pinyin string with syllables space-separated.
function pinyinSpaced(s) {
  return splitPinyinSyllables(s).join(' ');
}

// Render a pattern card with a specific infill chosen (used during review)
function renderPattern(card, infillIdx) {
  const fill = card.slot.options[infillIdx];
  return {
    tokens: card.template.map(t => t.slot ? fill : t),
    answer: fill,
  };
}

function tokensToPinyin(tokens) {
  return tokens.map(t => pinyinSpaced(t.pinyin)).join(' ');
}
function tokensToSay(tokens) {
  return tokens.map(t => sayAs(t.pinyin)).join(' ');
}

Object.assign(window, {
  sayAs, stripTones, renderPattern,
  splitPinyinSyllables, pinyinSpaced,
  tokensToPinyin, tokensToSay,
});
