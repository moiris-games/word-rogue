# Word Rogue — concept brief for an AI builder

A condensed, self-contained description of the game. Paste this into an AI coding agent as the
source of truth for a first build. (The full production spec is ~2,000 lines: `docs/word-rogue-spec.md`.)

---

## 1. One paragraph

Word Rogue is a mobile roguelike deckbuilder where the deck is made of **English word cards** and the
"combo" is **grammar**. The player draws a hand of words, drags them into a Sentence Line together with
free function-word tiles (the/a/is/not/will…), fixes each word's form (eat → eats → ate), and commits the
sentence. A grammar engine parses it: the richer and more correct the structure, the bigger the score.
Score damages an enemy made of silence. The audience is **Arabic speakers learning English**, CEFR A1→B1.
The whole UI is Arabic (RTL); the sentences are English (always LTR). It teaches without a single quiz
screen: an invalid sentence just scores low and gets one short, kind note explaining the mistake.

Pitch: *"Balatro meets English class."*

---

## 2. Audience and promise

- Primary players: Arabic-speaking learners, 13–35, level A1–B1, who already play mobile games.
- Promise: 20–35 minute runs that are fun on their own, and measurable English progress as a side effect.
- Hard rules (non-negotiable): no ads, no energy, no loot boxes, no streak shaming, offline-first,
  analytics opt-in only. The paid unlock gives content, never power.

---

## 3. The three loops

**Micro (5–20 s)** — look at hand → drag word cards + tiles into the Sentence Line → adjust forms →
Commit → watch the score build (Weight, then Force) → draw back up.

**Meso (2–4 min)** — an encounter: reach the enemy's Silence value within **4 Breaths** (sentences),
using **3 Rethinks** (discard 1–5 cards, redraw) → win Ink → shop → next encounter.

**Macro (20–35 min)** — a run: 4 chapters × 3 encounters (Wanderer → Hushling → Warden) = 12 fights,
then win. Progress (learned words, unlocked grammar pages, new starting decks) carries across runs.

---

## 4. Story frame (light, ~600 words total in game)

The city *Madinat al-Qalam* ("City of the Pen") has been robbed of its words by **the Hush**, a creeping
silence. Small ink-creatures (Hushlings) infest the districts. The player is a young scribe who can give
speech back by writing true sentences, using the traveller's tongue — English — brought by a merchant caravan.

Chapters = districts: **The Market** (Ch1) → **The Garden** (Ch2) → **The Observatory** (Ch3) →
**The Grand Library** (Ch4), where the Hush waits.

---

## 5. Cards, tiles, forms

- **Word cards** (the deck): a word, its part of speech (colour + icon), its Weight, CEFR badge, theme tag.
  Long-press shows the Arabic meaning, an example sentence, all forms, and pronunciation.
- **Toolbelt tiles** (free, never consumed, unlocked by chapter): the, a, an, is/are/was/were, not, do/does/did,
  will, can/should/must, have/has/been, and/but/so, because/when/if, who/which/that, prepositions, wh-words.
- **Form Wheel**: tap a placed card to cycle its form — noun sg↔pl, verb base → -s → past → -ing → past
  participle, adjective base → comparative → superlative, pronoun subject↔object. Forms unlock by chapter
  (-ing in Ch2, past and comparatives in Ch3, past participle in Ch4).
- **Line Capacity 5** deck cards per sentence (tiles don't count), hand size 8.
- Card Weight by level: pronoun 1, A1 word 2, A2 word 3, B1 word 5.

---

## 6. Grammar = the scoring system

Fourteen **structures** unlock across the chapters. Each has a base Weight and base Force, and levels up
when used (a Tablet item raises a structure's level).

| # | Structure | Chapter | Example |
|---|---|---|---|
| S1 | Simple statement | 1 | Birds fly. |
| S2 | Action (S+V+O) | 1 | The cat eats fish. |
| S3 | Description (be + adj) | 1 | The sky is blue. |
| S4 | Command | 1 | Open the door. |
| S5 | Place (prepositional phrase) | 2 | She sits under the tree. |
| S6 | Negative | 2 | He does not like tea. |
| S7 | Compound (and/but/so) | 2 | I cook and you eat. |
| S8 | Yes/no question | 3 | Do you like apples? |
| S9 | Wh-question | 3 | Where does she live? |
| S10 | Comparison | 3 | The moon is smaller than the sun. |
| S11 | Reason/time (because/when) | 4 | We stay at home because it rains. |
| S12 | Passive | 4 | The book was written by a scribe. |
| S13 | Condition (if) | 4 | If it rains, we will stay at home. |
| S14 | Relative (who/which/that) | 4 | The girl who reads books is happy. |

Seven **tones** (tenses) add Force: present simple (+0), present continuous, past simple, future will,
past continuous, modal (+1 each), present perfect (+2).

**Scoring order** (deterministic, animated in this order):

1. Start with the structure's base Weight (W) and Force (F).
2. Add each card's Weight left→right (plus enhancements).
3. Phrase bonuses: +3 W per prepositional phrase, +2 per adverb, +3 per infinitive, +2 superlative,
   +3 for a correctly chosen irregular past/participle. Compound and conditional sentences add each
   clause's own structure Weight.
4. Add the tone bonus (+1 if the two clauses use different tones).
5. +1 F if the sentence also makes sense (see §7).
6. Apply Seals in slot order (the player can reorder them — order matters).
7. Apply enemy constraints.
8. `score = floor(W × F)`.

Worked examples: *"Birds fly."* = 27. *"The cat eats fish."* = 64.
*"If it rains, we will stay at home."* (Ch4) = 1,092.

An ungrammatical sentence is a **Mumble**: it scores only the raw sum of card weights, no structure, no tone.
No failure screen, no red X — just a small "Mumble…" banner and a note.

---

## 7. The engine (the heart of the project)

A deterministic parser + scorer, no LLM at runtime:

1. **Parse**: tokens → candidate readings (each card can be several forms) → structure candidates.
   If several structures match, compute the full score for each and take the highest.
2. **Validate**: agreement, articles, countability, word order, question inversion, tense/adverb
   agreement, comparatives, passives, relative pronouns, and about 30 error codes in total.
3. **Meaning check** (semantic sanity, not truth): each noun has semantic classes (HUMAN, ANIMAL, FOOD,
   PLACE, ABSTRACT…), each verb lists what can be its subject/object, each adjective what it can describe,
   each preposition what it can take. "The cat eats fish" passes; "The cat drinks the table" parses but
   fails the meaning check — it still scores, just without the +1 Force, and it is tagged **Poetic**.
4. **Diagnosis**: for an invalid sentence, find the smallest repair (change a form, add a tile, swap two
   tokens) and report the corresponding error code + the offending token. That drives the hint.

The 30 error codes are Arabic-L1 aware: missing copula ("She happy"), adjective after noun ("the car red"),
article missing, a/an, double subject pronoun, agreement, do-support, word order, if + will, and so on.

Feedback ("the Scribe's Note") has three levels the player can set: Guided (show the note immediately),
Standard (a button reveals it), Expert (icon only).

---

## 8. Run structure, enemies, items

- 4 chapters × 3 encounters. Each enemy has a **Silence value** (the score you must reach) and most have a
  **Constraint** that changes scoring, e.g.:
  - "Cards without the Market theme give 0 Weight" (Ch1 boss)
  - "Repeating the previous sentence's structure scores ×0.5" (Ch2 boss)
  - "Only the first sentence of each tense scores fully; repeats ×0.25" (Ch3 boss)
  - "−1 hand size", "−1 Line Capacity", "only S5 and above score" …
- **Ink** is the currency: 3/4/6 per win by enemy type, +1 per unused Breath, +1 interest per 5 Ink held.
- **Shop** after every encounter: 2 Seals, 2 consumables, word packs (buy new word cards), erase a card, reroll.
- **Seals** (~44) are the passive combo pieces: "+4 Weight per adjective", "×1.5 Force on questions",
  "×2 Force on relative clauses", "double the leftmost card", "+1 Line Capacity"…
- **Scrolls** (one-shot) and **Tablets** (permanently level up a structure) are the consumables.
- Losing an encounter ends the run (one "Second Wind" per run can buy an extra Breath).
- Winning unlocks harder **Ink Levels** (difficulty tiers) and new starting decks ("Satchels").

---

## 9. Learning layer

- Every word has a mastery state: new → seen → practised → mastered, with spaced review; a due word is
  offered more often in shops and gives +1 Weight when mastered.
- The first correct use of a structure unlocks its **Codex page**: Arabic explanation, the pattern,
  3 examples, 2 common Arabic-speaker mistakes, one tip. 52 pages total (14 structures, 7 tones,
  contractions, 30 error codes).
- **Workshop**: a sandbox to build any sentence with known words and see the analysis, no enemies.
- **Learning report**: words by state, top recurring error codes, per-structure accuracy trend, and an
  estimated band (A1/A2/B1) always labelled "based on your play", never as a certificate.
- A 4-minute scripted tutorial plus an optional 6-puzzle quick check that sets the hint level.

---

## 10. Content scope (v1)

- **600 words**, 150 per chapter (≈68 nouns, 45 verbs, 27 adjectives, 10 adverbs), chosen from the CEFR-J
  list: Ch1 A1, Ch2–3 up to A2, Ch4 up to B1. Every word carries: Arabic glosses, 2 example sentences
  (EN + AR), all inflected forms, semantic classes, countability/transitivity, theme tag.
- Themes by chapter: market → garden → sky/travel → knowledge.
- 14 structures, 7 tones, ~54 toolbelt tiles, 30 error codes, 44 seals, 20 scrolls, 14 tablets,
  16 enemies, 4 satchels, 52 codex pages, 10 story panels.
- Every English example sentence must be parsable by the engine itself — content is validated by the
  same code that scores the game.

---

## 11. UI rules that matter

- Portrait only. Encounter screen top→bottom: enemy + Silence meter + constraint chip + breaths,
  seal row, Sentence Line, toolbelt tray, hand of 8 cards, action bar (Rethink · Commit · consumables).
- Arabic UI is fully RTL — **except** the Sentence Line, the hand, the tiles and any English example,
  which are always left-to-right.
- Scoring animation ≤ 3.5 s, with 1×/2×/4× speed and tap-to-skip.
- Minimum touch target 48 dp; text size has 4 steps; a colourblind-safe palette; parts of speech are
  distinguished by icon as well as colour.
- No text baked into images; every string localised (Arabic + English).

---

## 12. Tech

- **Godot 4.7**, GDScript with static typing, Compatibility renderer, Android first (iOS not blocked).
- All content and balance live in JSON under `data/` — never in code.
- Deterministic by design: seeded RNG streams (xoshiro128**), a visible run seed, and every action
  recorded as a command so a run can be replayed exactly. No floats in run state.
- The grammar engine exists twice on purpose: in GDScript for the game, and in Python as an executable
  reference used by the content pipeline. Both must pass the same golden corpus of parsed sentences
  (~200 cases and growing) — that is how the two stay in sync.
- A headless balance simulator plays whole runs with bot policies (greedy / novice) to tune the
  Silence targets.
- Free/paid: full Chapter 1 free forever; one purchase unlocks chapters 2–4 and the extra modes.

---

## 13. If you are building this with an AI, build in this order

1. **Data model first**: the word schema, the structure/tone tables, the toolbelt, the error codes.
   Author 40–60 Chapter 1 words by hand to work with.
2. **Grammar engine**: tokenizer → parser → validator → meaning check → diagnosis. Write a golden
   corpus of sentences with expected verdicts *before* the game screens exist. This is the risky part;
   everything else is ordinary game code.
3. **Scorer**: the exact order of operations above, with a trace so the animation can replay it.
4. **Encounter loop headless**: deck, hand, breaths, rethinks, commit, win/lose, seeded RNG, replay test.
5. **Shop, items, chapters, run state, save/load.**
6. **UI**: theme tokens and the RTL framework first, then the encounter screen, then everything else.
7. **Learning layer**: mastery, codex, notes, report.
8. **Balance**: simulate, then tune only the JSON numbers.

**Acceptance checks worth writing early**

- Every example sentence in the word list parses at its own chapter and passes the meaning check.
- Each chapter's word list can build at least 20 distinct sensible sentences for every structure it unlocks.
- The scorer reproduces the worked examples above exactly.
- A run replays from its seed + command log to an identical end state.
- Both engines (game and reference) agree on the whole golden corpus.
