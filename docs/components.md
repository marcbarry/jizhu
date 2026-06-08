# UI components

How the interface is put together, and the rule for where a given piece of
styling should live. The goal is **one way to render each thing** — when you
need something that already exists, reuse it or extend it; don't inline a
near-copy.

## Convention: CSS for leaves, JSX for structure

| Kind of thing | Lives as | Where |
| --- | --- | --- |
| Purely-visual leaf styles (buttons, pills, bars, swatches) | a **CSS class** | `index.html` `<style>` |
| Anything with layout, slots, or state (rows, tiles, headers, tokens) | a **JSX component** | `vd-primitives.jsx` (cross-screen) or the screen file (local) |
| Colours, spacing scale | **CSS custom properties** | `:root` in `index.html` |

Rule of thumb: if it's a single styled element you'd describe with a class
name (`.btn-primary`), make it a class. If it arranges multiple elements or
branches on props/state, make it a component. Avoid one-off `style={{…}}` for
anything that appears more than once — promote it instead.

## Design tokens (`:root`)

`--bg / --bg-2 / --bg-3`, `--ink / --ink-2 / --ink-3 / --ink-4`,
`--rule / --rule-2`, `--accent / --accent-2`, `--pos`, `--neg`.
Always reference these — never hard-code a hex value in JSX.

## Leaf classes (CSS)

| Class | Purpose |
| --- | --- |
| `.btn-primary` | Solid dark primary action (full width). |
| `.btn-secondary` | Dashed quiet action — cancel / back / paste / study-more. |
| `.grade` (+ `.again` / `.easy`) | Anki grade pill. |
| `.panel`, `.panel-tight`, `.divide-rule` | Card surfaces + interior dividers. |
| `.tag`, `.tag-on` | Uppercase micro-labels. |
| `.heat` (+ `.l1`–`.l4`, `.now`) | Mastery swatch. |
| `.toggle` (+ `.on`, `.knob`) | Settings switch. |
| `.stepper-btn` | +/- number control. |
| `.bar` (+ `i.accent`) | Progress bar. |
| `.sc`, `.mono` | Chinese / monospace type. |

## JSX primitives (`vd-primitives.jsx`)

| Component | Purpose |
| --- | --- |
| `Phone` | The app shell / screen frame. |
| `TopBar` | Bottom-ruled header row with `left` / `center` / `right` slots. |
| `BackButton` | Chevron + label; `tag` renders the label as a micro-label. |
| `AppHeader` | `TopBar` composed as back + title + right slot. |
| `Stat` | Stat tile (value + label, optional `accent`). |
| `GradeRow` | The 4-up grade buttons. |
| `HintToken` | The single canonical "stacked word": hanzi · pinyin · phonetic · gloss. See below. |

Screen-local components: `SettingRow` (`jz-meta.jsx`) is the one settings-row
frame (label/hint + optional control); `ToggleRow` / `StepperRow` / `ChoiceRow`
compose it. `ReviewTopBar` (`jz-review.jsx`) composes `TopBar` + `BackButton`.

## `HintToken` and the two other "word" renderings

A word (hanzi + pinyin + phonetic + gloss) is drawn in **three** places. They
are intentionally **not** one component — the layouts differ — but they all
draw from the same tokens and the same source fields.

| Context | Where | Layout | Shared? |
| --- | --- | --- | --- |
| Review token | `HintToken` (phrase card + pattern card) | Tall centered column, reveal-on-tap / on-pick | **One component.** The phrase card and pattern card both use it; props (`tone`, `pinyinAlways`, `affordance`) cover the slot vs fixed-word differences. |
| Answer option | `PatternCard` option tiles (`jz-review.jsx`) | Compact grid tile, reveals after pick | Separate — grid-tile layout, not a column. |
| Deck list row | `DeckLanding` card rows (`jz-home.jsx`) | One-line hanzi + right-aligned pinyin/English | Separate — dense list row, not a flashcard. |

If a fourth "word" presentation is ever needed, decide first whether it's
really the review token (`HintToken`) before adding a new one.

## When adding UI

1. Reuse an existing class/component. If it's *almost* right, add a prop or a
   modifier class rather than copying it.
2. New reusable leaf style → add a class in `index.html`.
3. New reusable structure → add a component (cross-screen in
   `vd-primitives.jsx`, otherwise local) and export it on `window`.
4. Reach for inline `style={{…}}` only for genuinely one-off values.
