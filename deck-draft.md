# Deck Draft — Jizhu Starter

A first deck for Jizhu, drawn from `hsk-1.md` and `first-trip-china.md`. English-only planning doc — this is the shape and content we'd hand to whoever (or whatever) writes the actual JSON.

## Working title

**Jizhu Starter — HSK 1 + First Trip to China**

HSK 1 building blocks (pronouns, numbers, question words, core verbs, particles, common nouns) alongside practical "First Trip" units (restaurants, hotels, directions, polite responses) so the deck is useful for both grammar drilling and real-world situations.

## Design principles

1. **Single words and phrases mix freely.** Both are cards; both have `tokens[]`. A single-word card just has one token.
2. **Pattern phrases via slots, not duplication.** Where the same sentence frame applies to many infills (foods, places, durations), use a single pattern card referencing a shared vocabulary group — see the spec's `slots` and `vocabulary` sections.
3. **Keep token decomposition meaningful.** Tokens split at word boundaries (e.g. `喜欢` is one token), not per-character, so glosses stay learnable.
4. **Units are buckets, not steps.** A unit groups thematically related cards. There is no prerequisite chain and no intended study order — the SRS surfaces cards from across the whole deck.

## Shared vocabulary groups

Defined at the deck level and referenced by slot tokens in pattern cards. The food groups are also the source content for the Food Vocabulary unit, so they double as both drill material and slot infills.

- `vegetables` — bok choy, Chinese cabbage, spinach, lettuce, broccoli, carrot, potato, sweet potato, tomato, cucumber, eggplant, bell pepper, chili pepper, garlic, ginger, onion, spring onion, leek, mushroom, wood ear mushroom, bean sprouts, green beans, snow peas, corn, tofu, seaweed.
- `meats` — pork, beef, lamb, chicken, duck, egg.
- `seafood` — fish, shrimp, crab, squid, clam, scallop.
- `staples` — rice, noodles, dumplings, steamed bun, bread, soup.
- `seasonings` — soy sauce, vinegar, chili oil, sugar, salt, pepper.
- `directions` — left, right, straight ahead.
- `durations` — a moment, a few minutes, an hour, a day, a week.
- `places-in-town` — bathroom, subway, train station, airport, hotel, hospital, shop, restaurant, school.
- `person-names` — common example names used for practice cards.
- `nationalities` — Chinese, American, British.
- `ages` — one through ninety-nine.
- `night-counts` — one through fourteen.

## Units

### Greetings & Politeness

Mostly fixed phrases.

- Hello.
- Hello (on the phone).
- Goodbye.
- See you tomorrow.
- Thank you.
- You're welcome.
- Sorry.
- It's nothing. / No problem.
- Please come in.
- Please sit down.

### People & Pronouns

- I / me
- you (singular)
- he / him
- she / her
- we / us
- you (plural)
- they (mixed or masculine)
- they (feminine)
- this
- that
- name
- friend
- student
- teacher
- classmate
- doctor
- Mr. / sir
- Miss
- China
- Beijing
- What is your name?
- My name is `{person-names}`. *(pattern, slot → `person-names`)*
- What is your surname?
- Nice to meet you.
- Where are you from?
- I am `{nationalities}`. *(pattern, slot → `nationalities`)*
- This is my teacher.
- He is my friend.

### Numbers, Time & Measure Words

Numbers 0–10, everyday time words, and the five HSK 1 measure words taught in the contexts where they actually appear (`岁` for age, `本` for books, etc.).

- zero, one, two, three, four, five, six, seven, eight, nine, ten
- general measure word (个)
- years old (岁)
- volume — for books (本)
- some / a few (些)
- piece / unit of currency (块)
- now
- later
- soon
- earlier
- today
- tomorrow
- yesterday
- morning
- noon
- afternoon
- when?
- What time is it?
- It's still early.
- It's getting late.
- How old are you?
- I am `{ages}` years old. *(pattern, slot → `ages`)*

### Asking Questions

- who
- what
- where
- which
- how
- how about?
- how many (small)
- how much / how many
- How much is this?
- Where is `{places-in-town}`? *(pattern, slot → `places-in-town`)*

### Essential Verbs

- to be
- to have / there is
- to be at / in
- to want / would like
- to like
- to love
- to go
- to come
- to return
- to eat
- to drink
- to look / watch
- to see
- to listen
- to speak
- to read
- to write
- to understand (会)
- to know / recognize (people)
- to study
- to work
- to buy
- to ask
- to be able to (learned skill)
- to be able to (capability / permission)
- not
- not (with "have")
- also
- all / both
- very
- too / excessively
- a little
- (question particle — yes/no)
- (question particle — and you?)
- (possessive / modifier particle)
- (completed-action / change-of-state particle)

### Calendar & Weather

- year
- month
- day (of the month)
- week
- What day is today?
- What is the date today?
- January through December (by number)
- weather
- to rain
- It's hot today.
- It's cold today.
- Is it going to rain?
- happy / pleased
- pretty / beautiful

### Things Around You

Common nouns for home and tech.

- book
- (Chinese) character
- clothes
- money
- cup
- table
- chair
- thing / stuff
- cat
- dog
- television
- computer
- (tele)phone
- movie
- This book is good.
- What is this?
- Whose is this?

### At the Restaurant

Pattern phrases use the food slot groups.

- It's difficult to choose.
- Sorry, I'm thinking slowly.
- I don't know what to order yet.
- I'm not sure what I want yet.
- Please can I have `{staples}`. *(pattern, slot → `staples`)*
- I'd like something with `{staples}`. *(pattern, slot → `staples`)*
- I'd like something with `{vegetables}`. *(pattern, slot → `vegetables`)*
- I'd like something with `{meats}`. *(pattern, slot → `meats`)*
- Lots of vegetables, please.
- Not too spicy, please.
- Is this spicy?
- I don't eat meat.
- I don't want this.
- I don't want that.
- Can you recommend something?
- The same as theirs, please.
- One more, please.
- The bill, please.
- Can I pay by phone?

### At the Table

Reacting to food.

- It smells delicious.
- It looks delicious.
- It's delicious.
- Delicious!
- Very good.
- I'm full, thank you.
- A little more, please.
- Cheers!

### Food Vocabulary

Surfaces the items in the shared vocabulary groups (`vegetables`, `meats`, `seafood`, `staples`, `seasonings`) as drillable cards in their own right. Same source of truth as the restaurant slots — the learner drills the items here, encounters them again in pattern phrases.

Coverage by group:

- Vegetables (~26 items): full `vegetables` group.
- Meats (~6 items): full `meats` group.
- Seafood (~6 items): full `seafood` group.
- Staples (~6 items): full `staples` group.
- Seasonings (~6 items): full `seasonings` group.

### Polite Social Responses

- No, thank you.
- Yes please, I appreciate that.
- Thank you, you're very kind.
- Great.
- Good.
- That's fine.
- I will work hard.
- I don't really smoke.
- I don't really drink.
- Just a little, please.

### Getting Around (On Foot)

Directions and survival phrases for being out in a city.

- left
- right
- straight ahead
- turn around / go back
- here
- there
- Turn `{directions}`. *(pattern, slot → `directions`)*
- How far is it?
- How long does it take?
- Is it walkable?
- Can you show me on the map?
- I'm lost.
- Where is the bathroom?
- Where is the subway?

### Getting Around (Transport)

Vehicles and transport hubs.

- airplane
- taxi
- bus
- subway / metro
- train station
- I want to take a taxi.
- Where is the train station?
- I am going to the airport.
- How much to `{places-in-town}`? *(pattern, slot → `places-in-town`)*
- Please take me to `{places-in-town}`. *(pattern, slot → `places-in-town`)*
- Please stop here.

### At the Hotel

Check-in, check-out, and the small requests in between.

- I have a reservation.
- I'd like to check in.
- I'd like to check out.
- My name is `{person-names}`. *(pattern, slot → `person-names`)*
- Here is my passport.
- Do you have any rooms available?
- I'd like a single room.
- I'd like a double room.
- For how many nights?
- For `{night-counts}` nights. *(pattern, slot → `night-counts`)*
- How much per night?
- Is breakfast included?
- What time is breakfast?
- Is there Wi-Fi?
- What is the Wi-Fi password?
- The key, please.
- I've lost my key.
- The room is too hot.
- The room is too cold.
- The air conditioning isn't working.
- The hot water isn't working.
- Could I have another towel?
- Could I have more water?
- When is checkout time?
- Could you call me a taxi?
- Could you keep my bags?
- I'd like to leave my bags here.
- I'll pick them up later.
- Thank you for your help.

### Getting By

Phrases for when the conversation outpaces the learner.

- It's difficult.
- I don't understand.
- Please say it again.
- Please speak more slowly.
- A little.
- I'm still learning.
- How do you say this in Chinese?
- What does this mean?

## Open questions for the JSON pass

- **Card IDs.** `unit-id.card-slug`? Or globally unique slugs? The spec only requires uniqueness within the deck, so unit-scoped IDs are fine.
- **Token granularity for fixed compounds.** `你好` — one token or two? Probably one (it's a fixed compound), with the gloss "hello". Same for `谢谢`, `再见`, `对不起`.
- **Romanization style.** Spec already says tone marks, not tone numbers. Reaffirm here.
- **Pattern card progress.** When the SRS surfaces a pattern card, does it pick a random infill each review, cycle through, or treat infills as separate progress targets? Out of scope for the JSON; flagged for the runtime design.
- **Deck size sanity check.** Roughly 230–270 cards across 15 units once pattern cards are counted singly. Manageable because pattern phrases collapse what would otherwise be many near-duplicates.
