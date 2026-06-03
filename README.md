# 记住 (jì zhù • "jee joo")

Jizhu (from 记住 — *to remember*) is a static, minimal flashcard system designed for learning Chinese through Pinyin and phonetic pronunciation.

Hanzi can be hidden so you can focus purely on speaking — drilling Pinyin, tones and pronunciation as flashcards rather than getting stuck on characters.

The default starter deck builds on HSK-1 foundations and extends into practical travel and conversation units: greetings, ordering at restaurants, food vocabulary, checking into hotels, getting around on foot and by transport, telling time, and making plans.

**Open the app: [https://marcbarry.github.io/jizhu/](https://marcbarry.github.io/jizhu/)**

*Progress against your deck is saved in your browser's local storage so won't follow to a different browser or a private/incognito window, but remains until you clear site data. Nothing is uploaded to a server.*

## Make your own decks

A deck is a JSON file formatted according to the [docs/spec/deck.md](docs/spec/deck.md) hosted somewhere on the web. Write the file, put it online, and paste the URL into Jìzhù.

1. **Write the deck.** Cards should contain Hanzi, Pinyin, an English translation, and a per-character token breakdown.

2. **Host on a CORS-friendly server.** Jìzhù fetches your file directly from the browser, so the host has to allow cross-origin reads. GitHub Pages, jsDelivr, Netlify, Cloudflare Pages and similar static hosts all work out of the box. Plain web servers that don't send `Access-Control-Allow-Origin` will not.

3. **Open it in Jìzhù.** From the home screen, paste the URL to your deck file and load it. Your progress is stored locally in the browser, keyed by that URL.

The starter deck in this repo (`decks/jizhu-starter.json` plus the files under `decks/jizhu-starter/`) is a working example, copy its layout and replace the content.
