# Jizhu Deck Specification

A Jizhu deck is a single JSON file served over HTTP(S). The deck's URL is its unique identifier — all local progress state is keyed by that URL.

## Top-level shape

```json
{
  "title": "HSK 1 Core",
  "vocabulary": {
    "vegetables": [
      { "hanzi": "青菜", "pinyin": "qīngcài", "gloss": "leafy greens" },
      { "hanzi": "蘑菇", "pinyin": "mógu",    "gloss": "mushroom" }
    ]
  },
  "units": [
    {
      "id": "greetings",
      "title": "Greetings",
      "cards": []
    }
  ]
}
```

| Field        | Type                          | Required | Description                                                                              |
| ------------ | ----------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `title`      | string                        | yes      | Human-readable deck name shown in the UI.                                                |
| `vocabulary` | object (group id → VocabItem[]) | no     | Named vocabulary groups that pattern-card slots can draw from. See [Vocabulary](#vocabulary). |
| `units`      | array of Unit                 | yes      | The units that group cards. Order in the array carries no meaning — units are not studied sequentially. |

## Unit

```json
{
  "id": "greetings",
  "title": "Greetings",
  "cards": []
}
```

| Field   | Type          | Required | Description                                                  |
| ------- | ------------- | -------- | ------------------------------------------------------------ |
| `id`    | string        | yes      | Stable identifier for the unit, unique within the deck.      |
| `title` | string        | yes      | Human-readable unit name.                                    |
| `cards` | array of Card | yes      | The cards belonging to this unit. Order in the array carries no meaning. |

## Card

```json
{
  "id": "wo-bu-xihuan-yinyueke",
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
| `id`          | string         | yes      | Stable identifier for the card, unique within the deck.                     |
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
  "id": "i-want-X",
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

| Field   | Type   | Required | Description                                                                                  |
| ------- | ------ | -------- | -------------------------------------------------------------------------------------------- |
| `group` | string | yes      | Identifier of a vocabulary group defined at the deck's top-level `vocabulary` map.           |

### Rendering rules

- A slot in `hanzi` / `pinyin` / `translation` is rendered by substituting the selected `VocabItem`'s `hanzi` / `pinyin` / `gloss` respectively.
- A slot token in `tokens` renders as a literal token using the selected `VocabItem`'s fields.
- The same slot name appearing in multiple places (e.g. once in `hanzi` and once in `tokens`) is filled with the **same** `VocabItem` for that render.
- The same group can be referenced by slots in different cards — that's the point.

### Known limitations (v1)

- A slot references exactly one group. Filtering or multi-group unions are not supported.
- Tone sandhi at slot boundaries (e.g. `不` shifting before a 4th-tone infill) is not resolved automatically; authors should keep slot positions in tone-stable contexts where possible, or accept the simplification.
- Progress tracking treats a pattern card as a single card; whether the SRS layer surfaces different infills on different reviews is a runtime/UI decision, not part of the deck spec.

## Vocabulary

Top-level `vocabulary` is an object mapping each **group id** (string) to an array of `VocabItem`s. Groups are shared across the deck — multiple pattern cards can reference the same group, and a future "vocabulary unit" feature could surface a group's items as cards directly.

### VocabItem

| Field    | Type   | Required | Description                                                          |
| -------- | ------ | -------- | -------------------------------------------------------------------- |
| `hanzi`  | string | yes      | The hanzi for this item.                                             |
| `pinyin` | string | yes      | The pinyin for this item, with tone marks.                           |
| `gloss`  | string | yes      | Short English gloss. Use ` / ` for multiple senses.                  |

A `VocabItem` is structurally identical to a literal `Token` — by design, so the renderer can substitute one for the other without transformation.

## Identifiers and stability

- Deck URLs are the unit of identity for local progress. Changing a deck's hosting URL resets local progress for that deck.
- `unit.id` and `card.id` should be stable across deck revisions. If an `id` changes, the app will treat it as a new card and lose its progress.

## Conventions

- All text is UTF-8.
- Pinyin uses tone marks (`wǒ`, `xǐhuan`) rather than tone numbers (`wo3`, `xi3huan`).
- `tokens` is the one place order is meaningful: concatenating tokens left-to-right should reconstruct the full phrase.
