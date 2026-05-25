// Shared shell + headers + reusable display elements

function Phone({ children }) {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="phone-statusbar">
          <span>9:24</span>
          <span style={{ letterSpacing: '0.1em', opacity: 0.55 }}>· · ·</span>
        </div>
        <div className="phone-body">{children}</div>
      </div>
    </div>
  );
}

// Standard app header: back arrow on the left, optional title, optional right slot.
function AppHeader({ back = "Back", title, right, onBack }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between"
         style={{ borderBottom: '1px solid var(--rule)' }}>
      <button className="flex items-center gap-1.5"
              onClick={onBack}
              style={{ color: 'var(--ink-2)', fontSize: 14, fontWeight: 500 }}>
        <IconChevLeft size={18} />
        {back}
      </button>
      {title && <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>}
      <div className="flex items-center gap-2" style={{ color: 'var(--ink-2)' }}>
        {right}
      </div>
    </div>
  );
}

// Compact metric "chip" used in stats strips.
function Metric({ value, label }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>{value}</div>
      <div className="tag" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}

// 4-up Anki grade row. Pass onGrade(grade) to wire taps.
function GradeRow({ disabled = false, onGrade }) {
  const grades = [
    { k: 'again', lbl: 'Again', sub: '<1m', cls: 'again' },
    { k: 'hard',  lbl: 'Hard',  sub: '6m',  cls: '' },
    { k: 'good',  lbl: 'Good',  sub: '1d',  cls: '' },
    { k: 'easy',  lbl: 'Easy',  sub: '4d',  cls: '' },
  ];
  return (
    <div className="grid grid-cols-4 gap-2" style={{ opacity: disabled ? 0.4 : 1 }}>
      {grades.map(g => (
        <button key={g.k} className={"grade " + g.cls}
                onClick={() => onGrade && onGrade(g.k)}
                disabled={disabled}>
          <div className="lbl">{g.lbl}</div>
          <div className="sub">{g.sub}</div>
        </button>
      ))}
    </div>
  );
}

// Per-token ruby block (used in review screens).
// A hint on a single token reveals the English for that one item; once every token has been
// hinted, the parent auto-reveals the full sentence translation.
//   hanzi-test (default):    bare hanzi · hint reveals pinyin + pronunciation + gloss together.
//   pinyin-test (hanziOff):  pinyin big + pronunciation always shown · hint reveals gloss.
function HintToken({ char, pinyin, say, gloss, hinted = false, hanziOff = false }) {
  if (hanziOff) {
    return (
      <span className="flex flex-col items-center" style={{ padding: '0 8px', minWidth: 112 }}>
        <span className="sc" style={{
          height: 28, fontSize: 24, lineHeight: 1, color: 'var(--ink-3)', fontWeight: 400,
        }}>{char}</span>
        <span style={{
          fontSize: 48, lineHeight: 1.02, marginTop: 8, color: 'var(--ink)',
          fontWeight: 500,
          borderBottom: hinted ? '1.5px solid transparent' : '1.5px dotted var(--ink-4)',
          paddingBottom: 3,
        }}>{pinyin}</span>
        <span style={{
          fontSize: 14, fontWeight: 500, color: 'var(--accent)', marginTop: 10,
          height: 18, lineHeight: 1, fontStyle: 'italic',
        }}>"{say}"</span>
        <span style={{
          fontSize: 14, color: 'var(--ink-3)', marginTop: 6, height: 18, lineHeight: 1,
          opacity: hinted ? 1 : 0,
        }}>{gloss}</span>
      </span>
    );
  }

  // Hanzi-test mode — hanzi anchored at top; all reveal info stacks underneath it
  // so pinyin + pronunciation + gloss read as a vertical column under the character.
  return (
    <span className="flex flex-col items-center" style={{ padding: '0 8px', minWidth: 112 }}>
      <span className="sc" style={{
        fontSize: 88, lineHeight: 1, color: 'var(--ink)',
        fontWeight: 500,
        borderBottom: hinted ? '1.5px solid transparent' : '1.5px dotted var(--ink-4)',
        paddingBottom: 3,
      }}>{char}</span>
      <span style={{
        marginTop: 24, height: 23, fontSize: 19, fontWeight: 500, color: 'var(--ink-2)', lineHeight: 1,
        opacity: hinted ? 1 : 0,
      }}>{pinyin}</span>
      <span style={{
        marginTop: 12, height: 18, fontSize: 14, fontWeight: 500, color: 'var(--accent)',
        lineHeight: 1, fontStyle: 'italic',
        opacity: hinted ? 1 : 0,
      }}>"{say}"</span>
      <span style={{
        marginTop: 14, height: 18, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1,
        opacity: hinted ? 1 : 0,
      }}>{gloss}</span>
    </span>
  );
}

// Shared demo data for review screens — same example everywhere.
const DEMO_TOKENS = [
  { char: "我", pinyin: "wǒ",  say: "waw",  gloss: "I",    level: 0 },
  { char: "吃", pinyin: "chī", say: "chrr", gloss: "eat",  level: 2 },
  { char: "饭", pinyin: "fàn", say: "fahn", gloss: "meal", level: 1 },
  { char: "了", pinyin: "le",  say: "luh",  gloss: "·",    level: 0 },
];

Object.assign(window, { Phone, AppHeader, Metric, GradeRow, HintToken, DEMO_TOKENS });
