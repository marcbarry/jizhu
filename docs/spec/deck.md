# Jizhu Deck Specification

A Jizhu deck is loaded from a manifest JSON file served over HTTP(S). The manifest URL is the deck's unique identifier — all local progress state is keyed by that URL.

The manifest may either contain all deck data inline, or it may reference separate unit and vocabulary group files by relative URL. Referenced files are resolved relative to the manifest URL.

## Top-level shape

```json
{
  "title": "HSK 1 Core",
  "description": "Beginner Chinese foundations for first conversations, travel, food, and getting around.",
  "languageProfile": {
    "language": "Mandarin Chinese",
    "script": "Simplified Chinese",
    "standard": "Mainland Putonghua",
    "regionalPreference": "Broad mainland-neutral beginner Mandarin",
    "notes": [
      "Prefer widely understood Mainland forms over strongly regional wording."
    ]
  },
  "vocabulary": {
    "vegetables": "hsk-1-core/vocabulary/vegetables.json"
  },
  "units": [
    "hsk-1-core/units/greetings.json"
  ]
}
```

| Field        | Type                          | Required | Description                                                                              |
| ------------ | ----------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `title`      | string                        | yes      | Human-readable deck name shown in the UI.                                                |
| `description` | string                       | no       | Short learner-facing summary of what the deck covers.                                    |
| `vocabulary` | object (group id → VocabItem[] or string) | no | Named vocabulary groups that pattern-card slots can draw from. A string value is a relative URL to a vocabulary group file. See [Vocabulary](#vocabulary). |
| `languageProfile` | object                  | no       | Authoring metadata describing the target language variety, script, regional preference, and wording policy. The app currently treats this as descriptive metadata. See [Language profile](#language-profile). |
| `units`      | array of Unit or string       | yes      | The units that group cards. A string value is a relative URL to a unit file. Order in the array carries no meaning — units are not studied sequentially. |

## Language profile

`languageProfile` records the deck author's target variety and vocabulary policy. It is optional and descriptive; deck loaders should tolerate it even if they do not expose it in the study UI.

| Field                | Type     | Required | Description                                                                 |
| -------------------- | -------- | -------- | --------------------------------------------------------------------------- |
| `language`           | string   | no       | Human-readable language name, e.g. `Mandarin Chinese`.                      |
| `script`             | string   | no       | Script or orthography target, e.g. `Simplified Chinese`.                    |
| `standard`           | string   | no       | Named standard or curriculum target, e.g. `Mainland Putonghua`.             |
| `regionalPreference` | string   | no       | Short description of the preferred regional/register baseline.              |
| `notes`              | string[] | no       | Specific authoring decisions, such as preferred variants or avoided forms.  |

## Split deck files

For larger decks, the manifest should usually stay small and reference separate files:

```text
decks/
  jizhu-starter.json
  jizhu-starter/
    vocabulary/
      vegetables.json
      places-in-town.json
    units/
      greetings-politeness.json
      at-the-restaurant.json
```

In this layout, `decks/jizhu-starter.json` is the canonical deck URL. Files under `decks/jizhu-starter/` are implementation parts of that deck.

### Referenced vocabulary group file

```json
{
  "id": "vegetables",
  "description": "Vegetables and plant-based ingredients commonly seen on menus.",
  "items": [
    {
      "id": "8b03f4d1-3f0f-4a39-90df-6b7d4fb1d63d",
      "hanzi": "青菜",
      "pinyin": "qīngcài",
      "gloss": "leafy greens"
    }
  ]
}
```

| Field   | Type        | Required | Description                                      |
| ------- | ----------- | -------- | ------------------------------------------------ |
| `id`    | string      | yes      | Vocabulary group id. Must match the manifest key. |
| `description` | string | no       | Short learner-facing summary of what this vocabulary group contains. |
| `items` | VocabItem[] | yes      | Items belonging to this vocabulary group.        |

## Unit

```json
{
  "id": "greetings",
  "title": "Greetings",
  "description": "Basic greetings, polite replies, and simple social openers.",
  "cards": []
}
```

| Field         | Type          | Required | Description                                                  |
| ------------- | ------------- | -------- | ------------------------------------------------------------ |
| `id`          | string        | yes      | Stable identifier for the unit, unique within the deck.      |
| `title`       | string        | yes      | Human-readable unit name.                                    |
| `description` | string        | no       | Short learner-facing summary of what this unit focuses on.   |
| `cards`       | array of Card | yes      | The cards belonging to this unit. Order in the array carries no meaning. |

## Card

```json
{
  "id": "f540cc80-5b7e-46d3-9215-b4d12e79e4f1",
  "hanzi": "我不喜欢音乐课",
  "pinyin": "wǒ bù xǐhuan yīnyuè kè",
  "translation": "I do not like music class",
  "tokens": [
    { "hanzi": "我",   "pinyin": "wǒ",     "gloss": "I / me" },
    { "hanzi": "不",   "pinyin": "bù",     "gloss": "not" },
    { "hanzi": "喜欢", "pinyin": "xǐhuan", "gloss": "like" },
    { "hanzi": "音乐", "pinyin": "yīnyuè", "gloss": "music" },
    { "hanzi": "课",   "pinyin": "kè",     "gloss": "class / lesson" }
  ]
}
```

| Field         | Type           | Required | Description                                                                 |
| ------------- | -------------- | -------- | --------------------------------------------------------------------------- |
| `id`          | string         | yes      | UUID identifier for the card, unique within the deck.                       |
| `hanzi`       | string         | yes      | The full Chinese phrase in hanzi.                                           |
| `pinyin`      | string         | yes      | The full phrase in pinyin, written with tone marks (not tone numbers).      |
| `translation` | string         | yes      | English translation of the phrase.                                          |
| `tokens`      | array of Token | yes      | Decomposition of the phrase into its component words/characters.            |

## Token

A token represents one meaningful unit of the phrase — typically a word, which may be one or more hanzi characters. A token is either a **literal token** (fixed hanzi/pinyin/gloss) or a **slot token** (a placeholder filled at render time from a vocabulary group).

### Literal token

| Field    | Type   | Required | Description                                                  |
| -------- | ------ | -------- | ------------------------------------------------------------ |
| `hanzi`  | string | yes      | The hanzi for this token.                                    |
| `pinyin` | string | yes      | The pinyin for this token, with tone marks.                  |
| `gloss`  | string | yes      | Short English gloss for this token. Use ` / ` for multiple senses. |

### Slot token

| Field  | Type   | Required | Description                                                                                              |
| ------ | ------ | -------- | -------------------------------------------------------------------------------------------------------- |
| `slot` | string | yes      | Name of a slot declared in the parent card's `slots` map. No other fields — the slot's group supplies them. |

## Pattern phrases (cards with slots)

A pattern phrase is a card with one or more **slots** — placeholders that get filled by items from a shared vocabulary group. This lets a single card stand in for many concrete utterances ("I want rice", "I want noodles", "I want vegetables") without duplicating cards or tokens.

A card becomes a pattern card simply by declaring a `slots` object — no separate `type` field. Slot placeholders in the card's `hanzi`, `pinyin`, and `translation` strings are written in curly braces, e.g. `{food}`.

```json
{
  "id": "bbd8d8f2-aee3-42e0-99b0-20abebf25d59",
  "hanzi": "我要{food}",
  "pinyin": "wǒ yào {food}",
  "translation": "I want {food}",
  "slots": {
    "food": { "group": "vegetables" }
  },
  "tokens": [
    { "hanzi": "我", "pinyin": "wǒ",  "gloss": "I" },
    { "hanzi": "要", "pinyin": "yào", "gloss": "want" },
    { "slot": "food" }
  ]
}
```

### Card-level fields (additions for pattern cards)

| Field   | Type                       | Required           | Description                                                                                |
| ------- | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| `slots` | object (slot name → Slot)  | only if card has slots | Maps each slot name used in this card to a Slot definition. Slot names are local to the card. |

### Slot

| Field       | Type             | Required | Description                                                                                  |
| ----------- | ---------------- | -------- | -------------------------------------------------------------------------------------------- |
| `group`     | string           | conditional | Identifier of a vocabulary group defined at the deck's top-level `vocabulary` map. Required for vocabulary-backed slots. |
| `generator` | string           | conditional | Identifier of a runtime generator. Required for generated slots. Currently supported: `mandarin-number`. |
| `range`     | array of numbers | for `mandarin-number` | Inclusive integer range for generated Mandarin numbers. Supported values are `0` through `99999`. |

A slot must use either `group` or `generator`, not both.

### Generated number slots

For mechanical number ranges, use a generated slot instead of authoring a large vocabulary file. The slot renders like a normal vocabulary slot, but the app creates a small answer set for each review.

```json
{
  "id": "31d4f1d2-8bdb-4c41-b512-1c4891e6c1bf",
  "hanzi": "我{age}岁",
  "pinyin": "Wǒ {age} suì",
  "translation": "I am {age} years old",
  "slots": {
    "age": { "generator": "mandarin-number", "range": [10, 99] }
  },
  "tokens": [
    { "hanzi": "我", "pinyin": "wǒ",  "gloss": "I" },
    { "slot": "age" },
    { "hanzi": "岁", "pinyin": "suì", "gloss": "years old" }
  ]
}
```

### Rendering rules

- A slot in `hanzi` / `pinyin` / `translation` is rendered by substituting the selected `VocabItem` or generated option's `hanzi` / `pinyin` / `gloss` respectively.
- A slot token in `tokens` renders as a literal token using the selected `VocabItem` or generated option's fields.
- The same slot name appearing in multiple places (e.g. once in `hanzi` and once in `tokens`) is filled with the **same** `VocabItem` for that render.
- The same group can be referenced by slots in different cards — that's the point.

### Known limitations

- A slot references exactly one group. Filtering or multi-group unions are not supported.
- Tone sandhi at slot boundaries (e.g. `不` shifting before a 4th-tone infill) is not resolved automatically; authors should keep slot positions in tone-stable contexts where possible, or accept the simplification.
- Progress tracking treats a pattern card as a single card; whether the SRS layer surfaces different infills on different reviews is a runtime/UI decision, not part of the deck spec.

## Vocabulary

Top-level `vocabulary` is an object mapping each **group id** (string) to an array of `VocabItem`s. Groups are shared across the deck — multiple pattern cards can reference the same group, and a future "vocabulary unit" feature could surface a group's items as cards directly.

### VocabItem

| Field    | Type   | Required | Description                                                          |
| -------- | ------ | -------- | -------------------------------------------------------------------- |
| `id`     | string | yes      | UUID identifier for this vocabulary item, unique within the deck.     |
| `hanzi`  | string | yes      | The hanzi for this item.                                             |
| `pinyin` | string | yes      | The pinyin for this item, with tone marks.                           |
| `gloss`  | string | yes      | Short English gloss. Use ` / ` for multiple senses.                  |
| `tokens` | array of literal Token | no | Optional per-word breakdown for a multi-word item. When a slot using this item renders inside a sentence, the app shows one chip per token (so `一本书` reads as `一 · 本 · 书` with individual glosses) instead of one merged block. Omit for single-word items. Concatenating tokens should reconstruct `hanzi`/`pinyin`. |

A `VocabItem` has the same language fields as a literal `Token`, plus an `id` so individual vocabulary entries can be referenced consistently. The option tile (when picking) always shows the whole item (`hanzi`/`pinyin`/`gloss`); `tokens` only affects how a chosen multi-word answer is broken up within the sentence.

## Identifiers and stability

- Deck URLs are the unit of identity for local progress. Changing a deck's hosting URL resets local progress for that deck.
- `card.id` and `VocabItem.id` are UUIDs. They are opaque stable identifiers, not display labels or slugs.
- `unit.id` and vocabulary group ids are human-readable authoring identifiers. Slots reference vocabulary groups by group id.
- IDs should be stable across deck revisions. If a card or vocabulary item `id` changes, the app and tooling will treat it as a different object.

## Conventions

- All text is UTF-8.
- Pinyin uses tone marks (`wǒ`, `xǐhuan`) rather than tone numbers (`wo3`, `xi3huan`).
- `tokens` is the one place order is meaningful: concatenating tokens left-to-right should reconstruct the full phrase.
