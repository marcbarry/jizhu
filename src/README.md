# Jizhu — Working Prototype

Mobile-first flashcard app for learning Chinese. This is a fully interactive prototype.

## Run it

The simplest way:

```sh
# from this directory
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server works. You can also open `index.html` directly in some browsers, but most will block the `<script src="...jsx">` requests from `file://` due to CORS — a local server avoids that.

## What's wired up

- **Home** — Try the starter deck, or "Paste a deck URL" (prototype is offline-only; any URL loads the baked-in starter)
- **Deck landing** — real stats from localStorage, real card list, Start button gated on what's due
- **Self-hint review** — tap any character to cycle `bare → pinyin → sound + meaning` independently per token; translation has its own reveal; 4-button Anki grading
- **Pattern cards** — sentence with a blank, English clue for the missing word, pick from 4 options shown in your current hanzi/pinyin display mode; sentence fills in with the answer highlighted
- **Settings** — display toggles (hanzi/pinyin/translation), new-cards-per-day cap (app-wide), cards-per-session, pattern infill mode, reset progress
- **Stats** — heatmap from real `lastReviewedAt` timestamps, mastery breakdown, per-card list

## Persistence

Everything is in `localStorage`, scoped per deck URL. Versioned keys for safe schema evolution:

```
jizhu:settings:v1
jizhu:progress:<deck-url>:v1
jizhu:daily:v1                # global new-card counter (resets daily)
```

To wipe and start fresh, clear `localStorage` for the page in your browser devtools.

## Code map

```
index.html              entry — Tailwind CDN, fonts, design tokens, mounts <Root/>
jz-data.jsx             starter deck + sayAs() (pinyin → English approximation)
jz-srs.jsx              SM-2 scheduling, queue builder, mastery classifier
jz-store.jsx            JzProvider context + RouterProvider (hash routing)
jz-app.jsx              <Root> = router + store + screen switch
jz-home.jsx             Home, DeckLanding
jz-review.jsx           ReviewScreen (PhraseCard + PatternCard)
jz-meta.jsx             Settings, Stats
vd-icons.jsx            inline SVG icons + BrandMark
vd-primitives.jsx       Phone shell, AppHeader, HintToken, GradeRow
```

## Stack notes

- React 18 + Babel standalone (inline JSX from `<script type="text/babel">`)
- Tailwind CDN for utility classes
- Inter (English), Noto Sans SC (Chinese), JetBrains Mono (numerics)
- No build step, no backend. Deploy by dropping the folder onto any static host (GitHub Pages, Netlify, etc.). For production, swap Babel/Tailwind CDN for a build pipeline.

## Known prototype limitations

- URL paste UI doesn't actually fetch — it always loads the starter
- No deck-validation or error states
- No animation between cards
- Stats heatmap uses last 14 weeks of recorded reviews; on first run it will be empty
