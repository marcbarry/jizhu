// Minimal inline SVG icon set — stroke-based, currentColor.
// 1.6px stroke at 24x24 → matches Inter's weight at small sizes.

function Icon({ children, size = 20, stroke = 1.6, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, ...style }}>
      {children}
    </svg>
  );
}

const IconChevLeft  = (p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>;
const IconChevRight = (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>;
const IconChevDown  = (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>;
const IconClose     = (p) => <Icon {...p}><path d="M6 6l12 12M6 18L18 6"/></Icon>;
const IconCog       = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
  </Icon>
);
const IconFilter = (p) => <Icon {...p}><path d="M4 5h16M7 12h10M10 19h4"/></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></Icon>;
const IconCheck  = (p) => <Icon {...p}><path d="M4 12l5 5L20 6"/></Icon>;
const IconPlus   = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IconLink   = (p) => <Icon {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></Icon>;
const IconFlame  = (p) => <Icon {...p}><path d="M8 14a4 4 0 0 0 8 0c0-3-2-5-3-7-1 2-1.5 3.5-2 4-.5-1-1-1.5-2-3-1 3-3 4-3 7a5 5 0 0 0 5 5"/></Icon>;

// Tiny brand mark — "记" in a square, used in chrome.
function BrandMark({ size = 22 }) {
  return (
    <span style={{
      width: size, height: size,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--ink)', color: '#fff',
      borderRadius: 6,
      fontFamily: 'Noto Sans SC', fontWeight: 700, fontSize: size * 0.55,
      lineHeight: 1,
    }}>记</span>
  );
}

Object.assign(window, {
  Icon, BrandMark,
  IconChevLeft, IconChevRight, IconChevDown,
  IconClose, IconCog, IconFilter, IconSearch, IconCheck, IconPlus, IconLink, IconFlame,
});
