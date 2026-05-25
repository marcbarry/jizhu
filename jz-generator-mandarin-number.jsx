const MANDARIN_NUMBER_MAX = 99999;

const MANDARIN_NUMBER_DIGITS = [
  { char: '\u96f6', pinyin: 'l\u00edng' },
  { char: '\u4e00', pinyin: 'y\u012b' },
  { char: '\u4e8c', pinyin: '\u00e8r' },
  { char: '\u4e09', pinyin: 's\u0101n' },
  { char: '\u56db', pinyin: 's\u00ec' },
  { char: '\u4e94', pinyin: 'w\u01d4' },
  { char: '\u516d', pinyin: 'li\u00f9' },
  { char: '\u4e03', pinyin: 'q\u012b' },
  { char: '\u516b', pinyin: 'b\u0101' },
  { char: '\u4e5d', pinyin: 'ji\u01d4' },
];

function joinMandarinNumberParts(parts) {
  return {
    char: parts.map(p => p.char).join(''),
    pinyin: parts.map(p => p.pinyin).join(' '),
  };
}

function mandarinNumberToken(n) {
  if (!Number.isInteger(n) || n < 0 || n > MANDARIN_NUMBER_MAX) {
    throw new Error(`Mandarin number generator supports integers from 0 to ${MANDARIN_NUMBER_MAX}, got ${n}.`);
  }
  if (n === 0) {
    const digit = MANDARIN_NUMBER_DIGITS[n];
    return { id: `number:${n}`, char: digit.char, pinyin: digit.pinyin, gloss: String(n), value: n };
  }

  return { id: `number:${n}`, ...joinMandarinNumberParts(mandarinNumberParts(n)), gloss: String(n), value: n };
}

function mandarinNumberParts(n) {
  if (n < 10000) return mandarinNumberPartsBelowWan(n);

  const wan = Math.floor(n / 10000);
  const rest = n % 10000;
  const parts = [
    ...mandarinNumberPartsBelowWan(wan),
    { char: '\u4e07', pinyin: 'w\u00e0n' },
  ];
  if (rest) {
    if (rest < 1000) parts.push(MANDARIN_NUMBER_DIGITS[0]);
    parts.push(...mandarinNumberPartsBelowWan(rest));
  }
  return parts;
}

function mandarinNumberPartsBelowWan(n) {
  const parts = [];
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;

  if (thousands) {
    parts.push(MANDARIN_NUMBER_DIGITS[thousands], { char: '\u5343', pinyin: 'qi\u0101n' });
  }

  if (hundreds) {
    parts.push(MANDARIN_NUMBER_DIGITS[hundreds], { char: '\u767e', pinyin: 'b\u01cei' });
  } else if (thousands && (tens || ones)) {
    parts.push(MANDARIN_NUMBER_DIGITS[0]);
  }

  if ((hundreds || thousands) && !tens && ones) {
    if (parts[parts.length - 1] !== MANDARIN_NUMBER_DIGITS[0]) parts.push(MANDARIN_NUMBER_DIGITS[0]);
  }

  if (tens) {
    if (tens > 1 || hundreds || thousands) parts.push(MANDARIN_NUMBER_DIGITS[tens]);
    parts.push({ char: '\u5341', pinyin: 'sh\u00ed' });
  }

  if (ones) parts.push(MANDARIN_NUMBER_DIGITS[ones]);

  return parts;
}

function normalizeGeneratedNumberRange(range) {
  if (!Array.isArray(range) || range.length !== 2) return null;
  const min = Number(range[0]);
  const max = Number(range[1]);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max > MANDARIN_NUMBER_MAX || min > max) return null;
  return [min, max];
}

function generatedSlotSize(generator) {
  const range = normalizeGeneratedNumberRange(generator?.range);
  return range ? range[1] - range[0] + 1 : 0;
}

function generatedSlotOption(generator, value) {
  if (generator?.kind !== 'mandarin-number') return null;
  const range = normalizeGeneratedNumberRange(generator.range);
  if (!range || value < range[0] || value > range[1]) return null;
  return mandarinNumberToken(value);
}

function generatedSlotOptions(generator, lastValue = null, mode = 'rotate', count = 4) {
  const range = normalizeGeneratedNumberRange(generator?.range);
  const size = generatedSlotSize(generator);
  if (generator?.kind !== 'mandarin-number' || !range || size === 0) return [];

  const [min, max] = range;
  const effectiveLast = Number.isInteger(lastValue) && lastValue >= min && lastValue <= max ? lastValue : null;
  const targetValue = mode === 'random'
    ? randomDifferentInt(min, max, effectiveLast)
    : (effectiveLast == null ? min : min + ((effectiveLast - min + 1) % size));

  const values = [targetValue];
  const wanted = Math.min(Math.max(1, count), size);
  while (values.length < wanted) {
    const candidate = randomDifferentInt(min, max, null);
    if (!values.includes(candidate)) values.push(candidate);
  }
  shuffleInPlace(values);

  return values.map(value => ({ ...generatedSlotOption(generator, value), target: value === targetValue }));
}

function randomDifferentInt(min, max, previous) {
  const size = max - min + 1;
  if (size <= 1) return min;
  let pick;
  do {
    pick = min + Math.floor(Math.random() * size);
  } while (pick === previous);
  return pick;
}

function shuffleInPlace(xs) {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

Object.assign(window, {
  MANDARIN_NUMBER_MAX,
  mandarinNumberToken,
  generatedSlotOptions,
  generatedSlotOption,
  generatedSlotSize,
  normalizeGeneratedNumberRange,
});
