// Pure-Node test runner for jz-data.jsx. The file under test is a browser
// module that publishes its API via Object.assign(window, …), so we evaluate
// it with a stub window and read the exports back off it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = [
  readFileSync(resolve(here, '..', 'jz-generator-mandarin-number.jsx'), 'utf8'),
  readFileSync(resolve(here, '..', 'jz-data.jsx'), 'utf8'),
].join('\n');

const win = {};
new Function('window', src)(win);
const {
  sayAs, stripTones, splitPinyinSyllables, pinyinSpaced,
  tokensToPinyin, tokensToSay, renderPattern,
  mandarinNumberToken, generatedSlotOptions, generatedSlotSize,
} = win;

let pass = 0, fail = 0;
function eq(label, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else {
    fail++;
    console.error(`  FAIL  ${label}`);
    console.error(`        got:  ${JSON.stringify(got)}`);
    console.error(`        want: ${JSON.stringify(want)}`);
  }
}
function group(name, body) {
  const before = fail;
  body();
  const localFail = fail - before;
  console.log(`${localFail ? 'x' : '.'} ${name}`);
}
function table(fn, cases) {
  for (const [input, want] of Object.entries(cases)) {
    eq(`${fn.name}(${JSON.stringify(input)})`, fn(input), want);
  }
}

// ─── sayAs ────────────────────────────────────────────────────────────────

group('sayAs — every initial × bare-a', () => table(sayAs, {
  ba:'bah', pa:'pah', ma:'mah', fa:'fah',
  da:'dah', ta:'tah', na:'nah', la:'lah',
  ga:'gah', ka:'kah', ha:'hah',
  za:'dzah', ca:'tsah', sa:'sah',
  zha:'jah', cha:'chah', sha:'shah',
}));

group('sayAs — every final × representative initial', () => table(sayAs, {
  // 1-char
  a:'ah', o:'aw', e:'uh',
  // 2-char (consonant-headed)
  bai:'beye', bei:'bay', bao:'baow', dou:'doh',
  ban:'bahn', ben:'buhn', bang:'bahng', beng:'bung', dong:'doong',
  // i-family after consonant
  bi:'bee', bia:'byah', bie:'byeh', biao:'byow', bian:'byen',
  bin:'been', bing:'bing', diu:'dyoh',
  // u-family after consonant
  duan:'dwahn', dui:'dway', dun:'dwun', duo:'dwaw',
  gua:'gwah', guai:'gwhy', guang:'gwahng',
  // er
  er:'are',
}));

group('sayAs — j/q/x + ü drop-y rule', () => table(sayAs, {
  ju:'joo',   qu:'choo',  xu:'shoo',
  jue:'jweh', que:'chweh', xue:'shweh',
  juan:'jwen', quan:'chwen', xuan:'shwen',
  jun:'joon',  qun:'choon',  xun:'shoon',
}));

group('sayAs — j/q/x + i finals (i is regular, not buzzed)', () => table(sayAs, {
  ji:'jee', qi:'chee', xi:'shee',
  jia:'jyah', qiang:'chyahng', xiong:'shyoong',
  jin:'jeen', qing:'ching', xin:'sheen',
}));

group('sayAs — buzzed-i after retroflex/sibilant', () => table(sayAs, {
  shi:'shrr', chi:'chrr', zhi:'jrr', ri:'rrr',
  zi:'dzrr',  ci:'tsrr',  si:'srr',
}));

group('sayAs — y/w bare syllables (silent glide)', () => table(sayAs, {
  yi:'ee',   wu:'oo',   yu:'yoo',
  yin:'een', ying:'ing',                  // regression: previously 'iin'/'iing'
  ya:'yah',  ye:'yeh',  yao:'yow', you:'yoh',
  yan:'yen', yang:'yahng', yong:'yoong',
  yue:'yweh', yuan:'ywen', yun:'yoon',
  wa:'wah', wai:'why', wei:'way',
  wan:'wahn', wen:'wun', wang:'wahng', weng:'wung', wo:'waw',
}));

group('sayAs — ü after l/n preserves rounded vowel', () => table(sayAs, {
  // Toned ü is required so stripTones routes through the ü class.
  'lǚ':'lyoo', 'nǚ':'nyoo',
  'lüè':'lyweh', 'nüè':'nyweh',
}));

group('sayAs — ao final reads as [aʊ] not [oʊ]', () => table(sayAs, {
  lao:'laow', mao:'maow', bao:'baow', tao:'taow', dao:'daow',
  hao:'haow', sao:'saow', zhao:'jaow', chao:'chaow', shao:'shaow',
}));

group('sayAs — iou/iu finals drop into "yoh"', () => table(sayAs, {
  you:'yoh', jiu:'jyoh', liu:'lyoh', niu:'nyoh', xiu:'shyoh',
  diu:'dyoh',
}));

group('sayAs — compound words split by rules', () => table(sayAs, {
  xiexie:    'shyeh-shyeh',
  zaijian:   'dzeye-jyen',
  duibuqi:   'dway-boo-chee',
  keqi:      'kuh-chee',
  bukeqi:    'boo-kuh-chee',
  xuesheng:  'shweh-shung',
  pengyou:   'pung-yoh',
  laoshi:    'laow-shrr',
  yinyue:    'een-yweh',
  wushi:     'oo-shrr',     // compound 'wu' must route via normalizeYW, not the
                            // override that only covered standalone 'wu'.
  nihao:     'nee-haow',
}));

group('sayAs — multi-word phrases (whitespace branch)', () => table(sayAs, {
  'ni hao':       'nee haow',
  'wo ai ni':     'waw eye nee',
  'bu keqi':      'boo kuh-chee',
  'duo shao qian':'dwaw shaow chyen',
}));

group('sayAs — tone marks transparent to output', () => table(sayAs, {
  'mā':'mah', 'má':'mah', 'mǎ':'mah', 'mà':'mah',     // 4 tones × a
  'mēng':'mung', 'méng':'mung', 'měng':'mung', 'mèng':'mung',
  'lǐ':'lee', 'wǒ':'waw', 'nǐ':'nee', 'hǎo':'haow',
}));

group('sayAs — sentence punctuation stripped on input', () => table(sayAs, {
  'hǎo?':'haow', 'nǐ.':'nee', 'wǒ!':'waw', 'lái，':'leye',
}));

group('sayAs — empty / falsy input', () => table(sayAs, {
  '':'', // empty string
}));

group('sayAs — null / undefined safety', () => {
  eq('sayAs(null)',      sayAs(null),      '');
  eq('sayAs(undefined)', sayAs(undefined), '');
});

group('sayAs — the surviving override', () => table(sayAs, {
  mingzi:'ming-dzuh',
  'míngzi':'ming-dzuh',
}));

// ─── stripTones ───────────────────────────────────────────────────────────

group('stripTones — every tone × vowel', () => table(stripTones, {
  'ā':'a','á':'a','ǎ':'a','à':'a',
  'ē':'e','é':'e','ě':'e','è':'e',
  'ī':'i','í':'i','ǐ':'i','ì':'i',
  'ō':'o','ó':'o','ǒ':'o','ò':'o',
  'ū':'u','ú':'u','ǔ':'u','ù':'u',
}));

group('stripTones — toned ü stays in ü class', () => table(stripTones, {
  'ǖ':'ü','ǘ':'ü','ǚ':'ü','ǜ':'ü',
}));

group('stripTones — case-fold and punctuation', () => table(stripTones, {
  'Yǒu':'you', 'Cèsuǒ':'cesuo', 'Xièxie?':'xiexie', '"Nǐ"':'ni',
}));

// ─── splitPinyinSyllables ─────────────────────────────────────────────────

group('splitPinyinSyllables — compact splits', () => {
  eq('Duìbuqǐ',  splitPinyinSyllables('Duìbuqǐ'),  ['Duì','bu','qǐ']);
  eq('Xièxie',   splitPinyinSyllables('Xièxie'),   ['Xiè','xie']);
  eq('Zàijiàn',  splitPinyinSyllables('Zàijiàn'),  ['Zài','jiàn']);
  eq('Pengyou',  splitPinyinSyllables('péngyou'),  ['péng','you']);
});

group('splitPinyinSyllables — already-spaced passes through', () => {
  eq('nǐ hǎo',     splitPinyinSyllables('nǐ hǎo'),     ['nǐ','hǎo']);
  eq('Wǒ ài nǐ',   splitPinyinSyllables('Wǒ ài nǐ'),   ['Wǒ','ài','nǐ']);
});

group('splitPinyinSyllables — trailing punctuation rides last syllable', () => {
  eq('Xièxie!', splitPinyinSyllables('Xièxie!'), ['Xiè','xie!']);
  eq('hǎo?',    splitPinyinSyllables('hǎo?'),    ['hǎo?']);
});

group('splitPinyinSyllables — unsplittable / empty', () => {
  eq('hǎo',          splitPinyinSyllables('hǎo'),  ['hǎo']);     // single syllable
  eq('empty',        splitPinyinSyllables(''),     []);
  eq('null',         splitPinyinSyllables(null),   []);
  eq('undefined',    splitPinyinSyllables(undefined), []);
});

group('pinyinSpaced — joins splitter output', () => table(pinyinSpaced, {
  'Duìbuqǐ':'Duì bu qǐ',
  'xièxie':'xiè xie',
  'nǐ hǎo':'nǐ hǎo',
  'hǎo':'hǎo',
}));

// ─── token helpers ────────────────────────────────────────────────────────

group('tokensToPinyin', () => {
  eq('single', tokensToPinyin([{pinyin:'wǒ'}]), 'wǒ');
  eq('triple', tokensToPinyin([{pinyin:'wǒ'},{pinyin:'ài'},{pinyin:'nǐ'}]), 'wǒ ài nǐ');
  eq('multi-syllable token expanded',
    tokensToPinyin([{pinyin:'Duìbuqǐ'}]),
    'Duì bu qǐ');
});

group('tokensToSay', () => {
  eq('triple', tokensToSay([{pinyin:'wǒ'},{pinyin:'ài'},{pinyin:'nǐ'}]), 'waw eye nee');
  eq('compact token', tokensToSay([{pinyin:'Pengyou'}]), 'pung-yoh');
});

// ─── renderPattern ────────────────────────────────────────────────────────

group('renderPattern — slot infill and answer', () => {
  const card = {
    template: [
      { hanzi: '我', pinyin: 'wǒ' },
      { hanzi: '要', pinyin: 'yào' },
      { hanzi: '去', pinyin: 'qù' },
      { slot: 'place' },
    ],
    slot: {
      options: [
        { hanzi: '机场', pinyin: 'jīchǎng' },
        { hanzi: '酒店', pinyin: 'jiǔdiàn' },
      ],
    },
  };
  const r0 = renderPattern(card, 0);
  eq('idx 0 tokens', r0.tokens, [
    { hanzi: '我', pinyin: 'wǒ' },
    { hanzi: '要', pinyin: 'yào' },
    { hanzi: '去', pinyin: 'qù' },
    { hanzi: '机场', pinyin: 'jīchǎng' },
  ]);
  eq('idx 0 answer', r0.answer, { hanzi: '机场', pinyin: 'jīchǎng' });
  eq('idx 1 answer', renderPattern(card, 1).answer, { hanzi: '酒店', pinyin: 'jiǔdiàn' });
});

group('mandarinNumberToken - generated Mandarin number tokens', () => {
  eq('0', mandarinNumberToken(0), { id: 'number:0', char: '\u96f6', pinyin: 'l\u00edng', gloss: '0', value: 0 });
  eq('10', mandarinNumberToken(10), { id: 'number:10', char: '\u5341', pinyin: 'sh\u00ed', gloss: '10', value: 10 });
  eq('23', mandarinNumberToken(23), { id: 'number:23', char: '\u4e8c\u5341\u4e09', pinyin: '\u00e8r sh\u00ed s\u0101n', gloss: '23', value: 23 });
  eq('105', mandarinNumberToken(105), { id: 'number:105', char: '\u4e00\u767e\u96f6\u4e94', pinyin: 'y\u012b b\u01cei l\u00edng w\u01d4', gloss: '105', value: 105 });
  eq('440', mandarinNumberToken(440), { id: 'number:440', char: '\u56db\u767e\u56db\u5341', pinyin: 's\u00ec b\u01cei s\u00ec sh\u00ed', gloss: '440', value: 440 });
  eq('999', mandarinNumberToken(999), { id: 'number:999', char: '\u4e5d\u767e\u4e5d\u5341\u4e5d', pinyin: 'ji\u01d4 b\u01cei ji\u01d4 sh\u00ed ji\u01d4', gloss: '999', value: 999 });
  eq('1000', mandarinNumberToken(1000), { id: 'number:1000', char: '\u4e00\u5343', pinyin: 'y\u012b qi\u0101n', gloss: '1000', value: 1000 });
  eq('1001', mandarinNumberToken(1001), { id: 'number:1001', char: '\u4e00\u5343\u96f6\u4e00', pinyin: 'y\u012b qi\u0101n l\u00edng y\u012b', gloss: '1001', value: 1001 });
  eq('1010', mandarinNumberToken(1010), { id: 'number:1010', char: '\u4e00\u5343\u96f6\u4e00\u5341', pinyin: 'y\u012b qi\u0101n l\u00edng y\u012b sh\u00ed', gloss: '1010', value: 1010 });
  eq('1100', mandarinNumberToken(1100), { id: 'number:1100', char: '\u4e00\u5343\u4e00\u767e', pinyin: 'y\u012b qi\u0101n y\u012b b\u01cei', gloss: '1100', value: 1100 });
  eq('9999', mandarinNumberToken(9999), { id: 'number:9999', char: '\u4e5d\u5343\u4e5d\u767e\u4e5d\u5341\u4e5d', pinyin: 'ji\u01d4 qi\u0101n ji\u01d4 b\u01cei ji\u01d4 sh\u00ed ji\u01d4', gloss: '9999', value: 9999 });
  eq('10000', mandarinNumberToken(10000), { id: 'number:10000', char: '\u4e00\u4e07', pinyin: 'y\u012b w\u00e0n', gloss: '10000', value: 10000 });
  eq('10001', mandarinNumberToken(10001), { id: 'number:10001', char: '\u4e00\u4e07\u96f6\u4e00', pinyin: 'y\u012b w\u00e0n l\u00edng y\u012b', gloss: '10001', value: 10001 });
  eq('10100', mandarinNumberToken(10100), { id: 'number:10100', char: '\u4e00\u4e07\u96f6\u4e00\u767e', pinyin: 'y\u012b w\u00e0n l\u00edng y\u012b b\u01cei', gloss: '10100', value: 10100 });
  eq('12034', mandarinNumberToken(12034), { id: 'number:12034', char: '\u4e00\u4e07\u4e8c\u5343\u96f6\u4e09\u5341\u56db', pinyin: 'y\u012b w\u00e0n \u00e8r qi\u0101n l\u00edng s\u0101n sh\u00ed s\u00ec', gloss: '12034', value: 12034 });
  eq('99999', mandarinNumberToken(99999), { id: 'number:99999', char: '\u4e5d\u4e07\u4e5d\u5343\u4e5d\u767e\u4e5d\u5341\u4e5d', pinyin: 'ji\u01d4 w\u00e0n ji\u01d4 qi\u0101n ji\u01d4 b\u01cei ji\u01d4 sh\u00ed ji\u01d4', gloss: '99999', value: 99999 });
});

group('generatedSlotOptions - target plus distractors', () => {
  const generator = { kind: 'mandarin-number', range: [20, 22] };
  const options = generatedSlotOptions(generator, 21, 'rotate', 4);
  eq('size', options.length, 3);
  eq('range size', generatedSlotSize(generator), 3);
  eq('one target', options.filter(o => o.target).length, 1);
  eq('target rotates from last value', options.find(o => o.target).value, 22);
  eq('unique option values', new Set(options.map(o => o.value)).size, 3);
  eq('stale last value starts at range minimum',
    generatedSlotOptions(generator, 2, 'rotate', 4).find(o => o.target).value,
    20);
});

// ─── results ──────────────────────────────────────────────────────────────

console.log('');
if (fail) {
  console.error(`${fail}/${pass + fail} cases failed.`);
  process.exit(1);
}
console.log(`OK  ${pass}/${pass} cases passed.`);
