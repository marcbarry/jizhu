// Jizhu starter deck + pinyin → English approximation
// Both are app concerns per the requirements (say-as is deterministic, not in
// the deck file). This file is loaded as plain JS attached to window.

const SAY_AS = {
  // Greetings + common syllables — tone-stripped lookup
  "ni": "nee", "hao": "how",
  "zai": "dzigh", "jian": "jyen",
  "xie": "shyeh",
  "dui": "dway", "bu": "boo", "qi": "chee",
  // Phrases
  "wo": "waw", "chi": "chrr", "fan": "fahn", "le": "luh",
  "he": "huh", "cha": "chah",
  "ming": "ming", "tian": "tyen",
  "xia": "shyah", "xue": "shweh",
  "kan": "kahn", "mai": "my", "shui": "shway",
  "zou": "dzoh", "lai": "lai", "qu": "chyoo",
  "shi": "shrr",
  "ta": "tah", "men": "men",
  "ai": "eye",
  "shang": "shahng", "xue2": "shweh",  // school
  "lao": "lao", "shi2": "shrr",        // teacher
};

// Strip tone marks → bare syllable for lookup
function stripTones(p) {
  const map = {
    'ā':'a','á':'a','ǎ':'a','à':'a',
    'ē':'e','é':'e','ě':'e','è':'e',
    'ī':'i','í':'i','ǐ':'i','ì':'i',
    'ō':'o','ó':'o','ǒ':'o','ò':'o',
    'ū':'u','ú':'u','ǔ':'u','ù':'u',
    'ǖ':'u','ǘ':'u','ǚ':'u','ǜ':'u','ü':'u',
  };
  return p.split('').map(c => map[c] || c).join('').toLowerCase();
}

// pinyin (with tones) → English approximation
function sayAs(pinyin) {
  const bare = stripTones(pinyin);
  if (SAY_AS[bare]) return SAY_AS[bare];
  // Fallback: return the bare pinyin so we always have something to display.
  return bare;
}

// ─── Starter Deck ────────────────────────────────────────────────────────
// Each card is one of:
//   { kind: "phrase", id, tokens: [{char, pinyin, gloss}, ...], translation }
//   { kind: "pattern", id, template: [(token | {slot})…], slot: {id, options: [token, ...]} }
//
// The English gloss on each token is also used by pattern cards as the
// "missing word means: ___" clue when that token is the answer.

const STARTER_DECK = {
  id: "jizhu-starter",
  name: "Jizhu Starter",
  url: "jizhu.app/d/starter.json",
  cards: [
    // — Greetings —
    { kind: "phrase", id: "g01", translation: "Hello",
      tokens: [
        { char: "你", pinyin: "nǐ",  gloss: "you"  },
        { char: "好", pinyin: "hǎo", gloss: "good" },
      ] },
    { kind: "phrase", id: "g02", translation: "Goodbye",
      tokens: [
        { char: "再", pinyin: "zài",  gloss: "again" },
        { char: "见", pinyin: "jiàn", gloss: "see"   },
      ] },
    { kind: "phrase", id: "g03", translation: "Thank you",
      tokens: [
        { char: "谢", pinyin: "xiè", gloss: "thank" },
        { char: "谢", pinyin: "xie", gloss: "thank" },
      ] },
    { kind: "phrase", id: "g04", translation: "Sorry",
      tokens: [
        { char: "对", pinyin: "duì", gloss: "right" },
        { char: "不", pinyin: "bu",  gloss: "not"   },
        { char: "起", pinyin: "qǐ",  gloss: "rise"  },
      ] },

    // — Simple sentences —
    { kind: "phrase", id: "v01", translation: "I ate.",
      tokens: [
        { char: "我", pinyin: "wǒ",  gloss: "I"    },
        { char: "吃", pinyin: "chī", gloss: "eat"  },
        { char: "饭", pinyin: "fàn", gloss: "meal" },
        { char: "了", pinyin: "le",  gloss: "·"    },
      ] },
    { kind: "phrase", id: "v02", translation: "I drink tea.",
      tokens: [
        { char: "我", pinyin: "wǒ", gloss: "I"     },
        { char: "喝", pinyin: "hē", gloss: "drink" },
        { char: "茶", pinyin: "chá", gloss: "tea"  },
      ] },
    { kind: "phrase", id: "v03", translation: "See you tomorrow.",
      tokens: [
        { char: "明", pinyin: "míng", gloss: "bright" },
        { char: "天", pinyin: "tiān", gloss: "day"    },
        { char: "见", pinyin: "jiàn", gloss: "see"    },
      ] },
    { kind: "phrase", id: "v04", translation: "It snowed.",
      tokens: [
        { char: "下", pinyin: "xià",  gloss: "down" },
        { char: "雪", pinyin: "xuě",  gloss: "snow" },
        { char: "了", pinyin: "le",   gloss: "·"    },
      ] },

    // — Pattern cards —
    { kind: "pattern", id: "p01",
      template: [
        { char: "我", pinyin: "wǒ", gloss: "I" },
        { slot: "verb" },
        { char: "了", pinyin: "le", gloss: "·" },
      ],
      slot: { id: "verb", options: [
        { char: "吃", pinyin: "chī", gloss: "eat"   },
        { char: "喝", pinyin: "hē",  gloss: "drink" },
        { char: "看", pinyin: "kàn", gloss: "watch" },
        { char: "写", pinyin: "xiě", gloss: "write" },
      ] },
    },
    { kind: "pattern", id: "p02",
      template: [
        { char: "明", pinyin: "míng", gloss: "bright" },
        { char: "天", pinyin: "tiān", gloss: "day"    },
        { slot: "verb" },
      ],
      slot: { id: "verb", options: [
        { char: "见", pinyin: "jiàn", gloss: "see"   },
        { char: "走", pinyin: "zǒu",  gloss: "leave" },
        { char: "来", pinyin: "lái",  gloss: "come"  },
        { char: "去", pinyin: "qù",   gloss: "go"    },
      ] },
    },
  ],
};

// Render a pattern card with a specific infill chosen (used during review)
function renderPattern(card, infillIdx) {
  const fill = card.slot.options[infillIdx];
  return {
    tokens: card.template.map(t => t.slot ? fill : t),
    answer: fill,
  };
}

// Toned pinyin from a list of tokens (e.g. "wǒ chī fàn le")
function tokensToPinyin(tokens) {
  return tokens.map(t => t.pinyin).join(' ');
}
function tokensToSay(tokens) {
  return tokens.map(t => sayAs(t.pinyin)).join(' ');
}

Object.assign(window, {
  STARTER_DECK, sayAs, stripTones, renderPattern,
  tokensToPinyin, tokensToSay,
});
