# Word Rogue — Software Requirements Specification (v1)

**Status:** Draft 6 · **Date:** 2026-09-20 · **Owner:** Khaled AbuShqear
**Source of truth for:** the v1 Android release of Word Rogue
**Derived from:** `docs/word-rogue-brief.md` (concept brief)
**Reference implementation for stack and tooling:** the `flick-dot` repo (`moiris-games/flick-dot`)

---

## 0. How to read this document

### 0.1 Requirement format

Every requirement is one line, independently testable, with a stable ID:

```
**AREA-NNN** (LEVEL, ORIGIN) — requirement text.
```

- **AREA** — subsystem prefix (see §0.3).
- **NNN** — stable number. Never reuse a retired number; mark it `[RETIRED]` instead.
- **LEVEL**
  - `MUST` — v1 does not ship without it.
  - `SHOULD` — expected in v1; cut only with an explicit decision.
  - `MAY` — optional, post-v1 acceptable.
- **ORIGIN**
  - `B` — stated in the concept brief. Treat as settled.
  - `C` — **confirmed decision**: not in the brief, decided explicitly by the owner. Binding, same as `B`.
  - `D` — **derived**: a reasonable engineering decision made while writing this SRS, neither stated in the brief nor yet confirmed. Every remaining `D` is listed in §18.

### 0.2 Testability rule

A requirement that cannot be turned into an automated test, a golden-corpus case, or a scripted manual check does not belong here — it belongs in §2 (product framing) or §18 (open questions).

### 0.3 Area prefixes

| Prefix | Area | Section |
|---|---|---|
| `DATA` | Content schemas and the `data/` pipeline | §4 |
| `ENG` | Grammar engine: parse, validate, meaning, diagnose | §5 |
| `SCR` | Scorer | §6 |
| `ENC` | Encounter loop | §7 |
| `RUN` | Run structure, economy, shop, items, save | §8 |
| `LRN` | Learning layer | §9 |
| `UI` | Screens, layout, RTL, accessibility | §10 |
| `AUD` | Audio | §11 |
| `TEC` | Stack, project layout, determinism, i18n mechanics, build and CI | §12 |
| `LB` | Leaderboard: boards, identity, verification, moderation | §13 |
| `BIZ` | Monetization and privacy | §14 |
| `NFR` | Non-functional | §15 |
| `TST` | Test and acceptance | §16 |

### 0.4 What changed in draft 3

Draft 2 specified **Godot 4.7 + GDScript**, with the grammar engine written twice (GDScript for the game, Python as the content-pipeline reference). Draft 3 moves the whole project onto the **Expo / React Native / TypeScript** stack already proven in `flick-dot`, so one toolchain, one CI setup and one deployment pipeline serve both games.

Everything about the *game* — the design, the numbers, the content scope, the learning layer, the economy — is unchanged. What changed is §12 in full, the engine's implementation count (`ENG-005`–`ENG-007`), the parts of §15 and §16 that named Godot, and the milestone list. A line-by-line changelog is in §18.7.

### 0.5 What changed in draft 4

The game gains a **leaderboard**. That single addition turns the optional companion service of draft 3 into a required backend, adds §13 (`LB`), and amends the handful of privacy and offline requirements that assumed nothing ever left the device.

It also turns out to be the stack decision paying for itself twice: because the engine is framework-free TypeScript and a run is reproducible from seed + command log, the Node backend replays every submission through the identical engine file. Scores are verified rather than trusted — something the Godot plan could not have done without writing the engine a third time, and something `flick-dot` cannot do at all. Draft 4's changelog is §18.8.

### 0.6 What changed in draft 5

One product decision, and its consequences: **Word Rogue never limits how long anyone plays.** No energy, cooldowns, timers or quotas, and no screen-time advice — the game has no business telling a learner they have played enough (`BIZ-014`, `BIZ-015`).

The daily leaderboard's attempt cap survives, but as what it always was: a **board rule**, not a play limit. Two ranked attempts, auto-submitted, then unlimited unranked replays of the same seed and no closed door anywhere (`LB-012`–`LB-016`). The cap exists because a fixed seed plus uncapped retries makes brute force optimal, which would rank players by spare time rather than skill — the wrong answer for an audience of students and working learners.

Draft 5 also folds in the draft-4 recommendations: generated handles instead of free-text names, the closed card vocabulary as its own moderation filter, engine-compat seasons, a split API and verification worker, and vector cards. Changelog in §18.9.

### 0.7 What changed in draft 6

Nothing new was designed. Seventeen decisions that had been sitting as recommendations were made, and the document now says what the game is rather than what it might be. Six new requirements carry choices that previously had nowhere to live — Ink Level scaling, the type family, the Satchel archetypes, the seal authoring passes, the commissioned art scope, and a property-based fuzzer that replaces the bug-catching the second engine implementation would have given.

What remains open is only what evidence can settle: the balance numbers, the daily attempt count, and the visual direction. Changelog in §18.10.

---

## 1. Purpose and scope

### 1.1 In scope (v1)

A single-player, offline-first Android game: 4 chapters, 12 encounters, 600 words, 14 grammar structures, 7 tones, a deterministic grammar engine, a learning layer (mastery, codex, report, workshop), Arabic-first UI, and a one-time purchase unlocking chapters 2–4.

### 1.2 Out of scope (v1)

- iOS release (the codebase must not block it — see `TEC-040`).
- Any account system, cloud save, or sign-in. Leaderboard identity is anonymous and device-local (`LB-020`).
- Any server dependency **in the gameplay path**. A backend is required for the leaderboard (§12.9, §13), but every gameplay feature — including playing the Daily Run itself — MUST work with no network. Content, save data and scoring never depend on it.
- Multiplayer, daily challenges, live events, seasonal content.
- Any runtime LLM or network call for grammar, hints, or content.
- Languages other than Arabic and English.

### 1.3 Audience for this document

The implementing developer and the AI coding agents working from the repo. It is written to be read top-to-bottom once, then referenced by ID.

---

## 2. Product framing (non-testable context)

**What it is.** A mobile roguelike deckbuilder where the deck is English word cards and the combo engine is grammar. The player drags word cards plus free function-word tiles into a Sentence Line, fixes each word's form, and commits. A deterministic parser scores the sentence; the score damages an enemy made of silence.

**Pitch.** *"Balatro meets English class."*

**Players.** Arabic speakers learning English, 13–35, CEFR A1–B1, who already play mobile games.

**Promise.** 20–35 minute runs that are fun on their own, with measurable English progress as a side effect.

**Design stance.** There is no quiz screen and no failure screen. An invalid sentence simply scores low and earns one short, kind note. Teaching is a consequence of scoring, never an interruption of it.

**Hard product rules (these generate requirements in §14):** no ads, no energy, no loot boxes, no streak shaming, offline-first, analytics opt-in only, and the paid unlock gives content — never power.

**Story frame.** The city *Madinat al-Qalam* ("City of the Pen") has been robbed of its words by **the Hush**, a creeping silence. Ink-creatures (Hushlings) infest the districts. The player is a young scribe who restores speech by writing true sentences in the traveller's tongue — English — brought by a merchant caravan. Chapters are districts: **The Market** → **The Garden** → **The Observatory** → **The Grand Library**, where the Hush waits.

**Why this stack.** The game is a card UI over a pure-function text engine — no physics, no 3D, no per-frame simulation. React Native's strengths (declarative screen layout, first-class RTL, a huge text/typography surface) line up with what this game actually is, and its one real weakness for games (per-frame JS work) is avoided because the only animation is the scoring readout, which plays from a pre-computed trace on the UI thread. The deciding factor is operational: `flick-dot` already carries a working Expo → GitHub Actions → signed APK/AAB → Play Store pipeline, and reusing it costs days where a second engine costs weeks.

---

## 3. Glossary

| Term | Meaning |
|---|---|
| **Breath** | One committed sentence. An encounter allows 4. |
| **Rethink** | A discard-and-redraw action. An encounter allows 3. |
| **Sentence Line** | The build area where cards and tiles are placed, left-to-right. |
| **Line Capacity** | Max deck cards in the Sentence Line at once (base 5). Tiles are free. |
| **Toolbelt tile** | A free function word (the, is, not, will…). Never consumed, never in the deck. |
| **Form Wheel** | The control that cycles a placed card through its inflected forms. |
| **Weight (W)** | The additive half of the score. |
| **Force (F)** | The multiplicative half of the score. |
| **Structure** | One of 14 recognised sentence patterns (S1–S14). |
| **Tone** | One of 7 tenses/moods that adds Force. |
| **Mumble** | An ungrammatical commit: raw card weights only, no structure, no tone. |
| **Poetic** | A grammatical sentence that fails the meaning check. Scores, but loses the +1 Force. |
| **Silence** | An enemy's HP: the total score the player must reach. |
| **Constraint** | An enemy rule that modifies scoring. |
| **Ink** | The in-run currency. |
| **Seal** | A passive scoring modifier held in an ordered slot row. |
| **Scroll** | A one-shot consumable. |
| **Tablet** | A consumable that permanently levels up one structure. |
| **Satchel** | A starting deck. |
| **Ink Level** | A difficulty tier unlocked by winning. |
| **Scribe's Note** | The one-line feedback shown after a flawed commit. |
| **Codex** | The in-game grammar reference, unlocked by play. |
| **Golden corpus** | The test corpus that defines correct engine behaviour. It is the engine's contract. |
| **Daily Run** | The Chapter-1 run everyone plays from the same daily seed. The basis of both v1 leaderboards. |
| **Verified entry** | A leaderboard entry whose command log the server successfully replayed to the claimed score. Only verified entries are shown. |
| **Engine core** | The framework-free TypeScript modules under `lib/engine/` and `lib/run/` — no React, no React Native, no Expo imports. Runs identically in the app, in Node tooling and in CI. |

---

## 4. Content data requirements (`DATA`)

### 4.1 General rules

**DATA-001** (MUST, B) — All content and balance values MUST live in JSON files under `data/`. No content string, weight, cost, or threshold may be hard-coded in TypeScript.

**DATA-002** (MUST, D) — Every `data/` file MUST validate against a JSON Schema stored in `data/schema/`. A schema violation MUST fail the content-validation job, not surface at runtime.

**DATA-003** (MUST, D) — Every data record MUST carry a stable string `id` that is unique within its file and never reused after removal. Saves and the command log reference records by `id` only, never by array index.

**DATA-004** (MUST, D) — All numeric balance values in `data/` MUST be integers. Multipliers that are conceptually fractional (e.g. ×0.5, ×1.5) MUST be expressed as an integer numerator/denominator pair or as integer basis points, so no float enters run state (see `TEC-020`).

**DATA-005** (MUST, B) — Every English example sentence appearing anywhere in `data/` MUST parse successfully with the engine core, at or below the chapter it belongs to, and MUST pass the meaning check. Content validation MUST run the real engine, not a mock (see `TEC-023`).

**DATA-006** (MUST, D) — Every player-visible string MUST exist in the localisation files for both `ar` and `en`. A missing key MUST fail the build, not render as a key at runtime.

**DATA-007** (SHOULD, D) — `data/` MUST be loadable in full at startup in under 1 second on the reference device (§15), or MUST be split so that only the active chapter's content loads.

**DATA-008** (MUST, D) — `data/` JSON MUST be imported as typed modules, with the TypeScript types generated from the JSON Schemas of `DATA-002` rather than hand-written. A schema change that the code has not accounted for MUST fail `npm run typecheck`, not runtime.

### 4.2 Words

**DATA-010** (MUST, B) — v1 MUST ship 600 word cards, 150 per chapter.

**DATA-011** (MUST, B) — Each chapter's 150 words MUST follow the part-of-speech mix: ≈68 nouns, 45 verbs, 27 adjectives, 10 adverbs. Content validation MUST report the actual mix and fail if any count deviates by more than ±3.

**DATA-012** (MUST, B) — Words MUST be drawn from the CEFR-J list, banded: Chapter 1 = A1 only; Chapters 2–3 = up to A2; Chapter 4 = up to B1. A word above its chapter's band MUST fail validation.

**DATA-013** (MUST, B) — Each word record MUST contain: `id`, `lemma`, `pos`, `cefr`, `weight`, `theme`, Arabic gloss(es), two example sentences (English + Arabic translation), the complete set of inflected forms, semantic classes, and countability (nouns) / transitivity (verbs).

**DATA-014** (MUST, B) — Card Weight MUST be assigned by level: pronoun = 1, A1 = 2, A2 = 3, B1 = 5.

**DATA-015** (MUST, B) — Each word MUST carry a theme tag. Chapter themes are: Ch1 market, Ch2 garden, Ch3 sky/travel, Ch4 knowledge.

**DATA-016** (MUST, B) — Irregular forms (past, past participle, plurals, comparatives) MUST be stored explicitly per word. The engine MUST NOT infer an irregular form by rule.

**DATA-017** (MUST, D) — Regular inflections MAY be generated at build time by rule, but the generated forms MUST be written into `data/` and committed, so the shipped data is fully explicit and diffable.

**DATA-018** (MUST, B) — Each noun MUST list its semantic classes (e.g. HUMAN, ANIMAL, FOOD, PLACE, ABSTRACT). Each verb MUST list the classes admissible as its subject and as its object. Each adjective MUST list the classes it can describe. Each preposition MUST list the classes it can take.

**DATA-019** (MUST, D) — The semantic class vocabulary MUST be a closed, versioned enum in `data/semantic_classes.json`. An unknown class string MUST fail validation.

**DATA-020** (SHOULD, B) — Each word SHOULD carry pronunciation data sufficient to render the long-press detail panel.

### 4.3 Structures and tones

**DATA-030** (MUST, B) — `data/structures.json` MUST define 14 structures with id, chapter of unlock, base Weight, base Force, pattern definition, and a canonical example:

| # | Structure | Ch | Example |
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

**DATA-031** (MUST, B) — Structures MUST be levelable. `data/structures.json` MUST define, per structure, the Weight and/or Force gained per level and the maximum level.

**DATA-032** (MUST, B) — `data/tones.json` MUST define 7 tones with their Force bonus: present simple +0; present continuous, past simple, future *will*, past continuous, and modal +1 each; present perfect +2.

**DATA-033** (MUST, B) — Structure availability MUST be gated by chapter exactly as tabled in `DATA-030`. A structure not yet unlocked MUST NOT be recognised by the scorer during that chapter.

**DATA-034** (MUST, C) — Base Weight and base Force per structure MUST be exactly:

| S | base W | base F | Ch |
|---|---|---|---|
| S1 | 5 | 2 | 1 |
| S2 | 10 | 3 | 1 |
| S3 | 10 | 3 | 1 |
| S4 | 10 | 3 | 1 |
| S5 | 18 | 4 | 2 |
| S6 | 18 | 4 | 2 |
| S7 | 22 | 5 | 2 |
| S8 | 26 | 6 | 3 |
| S9 | 30 | 7 | 3 |
| S10 | 30 | 7 | 3 |
| S11 | 36 | 8 | 4 |
| S12 | 42 | 9 | 4 |
| S13 | 50 | 10 | 4 |
| S14 | 55 | 11 | 4 |

S1 and S2 are forced by the worked examples (only one sensible factorisation each). S13 is solved to land on 1,092; the intervening values are a monotonic ladder chosen to fit. Verified in `SCR-041`.

**DATA-035** (MUST, C) — Structure levelling MUST follow: at level `L` (base level = 1), `W = base_W + (L-1) × ceil(base_W / 4)` and `F = base_F + (L-1)`. Maximum level MUST be 5. Both values MUST remain integers at every level.

### 4.4 Toolbelt tiles

**DATA-040** (MUST, B) — `data/tiles.json` MUST define ≈54 toolbelt tiles covering at minimum: `the`, `a`, `an`, `is/are/was/were`, `not`, `do/does/did`, `will`, `can/should/must`, `have/has/been`, `and/but/so`, `because/when/if`, `who/which/that`, prepositions, and wh-words.

**DATA-041** (MUST, B) — Tiles MUST be free, unlimited, and never consumed. Using a tile MUST NOT affect the deck, the hand, or Line Capacity.

**DATA-042** (MUST, B) — Each tile MUST declare the chapter at which it unlocks. A locked tile MUST NOT appear in the toolbelt tray.

**DATA-043** (MUST, B) — Tiles MUST contribute 0 Weight of their own. (Their value is the structure and tone they enable.)

### 4.5 Forms

**DATA-050** (MUST, B) — The Form Wheel MUST support: noun singular↔plural; verb base → `-s` → past → `-ing` → past participle; adjective base → comparative → superlative; pronoun subject↔object.

**DATA-051** (MUST, B) — Form availability MUST be gated by chapter: `-ing` unlocks in Ch2; past and comparatives in Ch3; past participle in Ch4. Singular/plural, `-s`, and subject/object are available from Ch1.

**DATA-052** (MUST, D) — A form that does not exist for a given word (e.g. the comparative of a three-syllable adjective, an uncountable noun's plural) MUST be absent from that word's wheel rather than generated.

### 4.6 Error codes, items, enemies, story

**DATA-060** (MUST, B) — `data/error_codes.json` MUST define 30 error codes. Each MUST carry: `id`, an Arabic player-facing note, an English note, a severity, the Codex page it links to, and at least two test sentences that trigger it.

**DATA-061** (MUST, B) — The error code set MUST be Arabic-L1 aware and MUST include at minimum: missing copula ("She happy"), adjective after noun ("the car red"), missing article, a/an confusion, double subject pronoun, subject–verb agreement, missing do-support, word order, and *if + will*.

**DATA-062** (MUST, B) — `data/seals.json` MUST define ≈44 seals. Each MUST declare its effect as data the scorer can apply (not as a script), its shop cost, and its rarity.

**DATA-071** (MUST, C) — Seals MUST be authored in two passes: **at least 12 by the end of M5**, covering all four effect shapes of `RUN-031`, and the full ≈44 by M8. The simulator MUST be used between the two passes to establish which shapes are worth expanding, so the remaining seals are authored against evidence rather than guesswork.

**DATA-063** (MUST, B) — `data/scrolls.json` MUST define 20 one-shot consumables; `data/tablets.json` MUST define 14 tablets, each naming the structure it levels.

**DATA-064** (MUST, B) — `data/enemies.json` MUST define 16 enemies. Each MUST declare: `id`, tier (Wanderer / Hushling / Warden), chapter, Silence value, Ink reward, and an optional Constraint.

**DATA-069** (MUST, C) — The 16 enemies MUST be distributed 4 per chapter: **2 Wanderer variants, 1 Hushling, 1 Warden**. Exactly one of the two Wanderer variants MUST be selected per run from the enemy RNG stream. The Hushling and Warden of a chapter are fixed, so each district's boss stays iconic.

**DATA-065** (MUST, B) — `data/satchels.json` MUST define 4 starting decks.

**DATA-070** (MUST, C) — The 4 Satchels MUST be **pedagogical archetypes, not stat archetypes**: Balanced, Verb-heavy, Description-heavy (nouns and adjectives), and Question-words. Each MUST bias which structures come easily rather than how much raw Weight the deck carries, so choosing a Satchel chooses what the player practises. They MUST be authored at M5.

**DATA-066** (MUST, B) — `data/codex.json` MUST define 52 pages: 14 structures, 7 tones, contractions, and the 30 error codes.

**DATA-067** (MUST, B) — `data/story.json` MUST define 10 story panels totalling roughly 600 words of in-game story text.

**DATA-068** (MUST, D) — Constraints MUST be expressed as a closed, data-driven predicate vocabulary (theme filter, structure filter, repetition penalty, hand-size delta, capacity delta, minimum structure index, tense-repeat penalty). Adding a new constraint shape is a code change plus a schema version bump — never an ad-hoc script string in JSON.

---

## 5. Grammar engine (`ENG`)

> This is the risky part of the project. Everything else is ordinary game code.

### 5.1 Contract and determinism

**ENG-001** (MUST, B) — The engine MUST be fully deterministic and MUST make no network call and use no LLM at runtime.

**ENG-002** (MUST, D) — The engine's public contract MUST be a single pure function: given (ordered token list, chapter, unlocked structures/tones/forms, structure levels), return an `Analysis` result. The same input MUST always produce byte-identical output.

**ENG-003** (MUST, D) — The `Analysis` result MUST contain: the chosen structure, the chosen tone, per-token readings, validity verdict, meaning-check verdict, the error code and offending token index when invalid, and a full scoring trace (see `SCR-050`).

**ENG-004** (MUST, D) — The engine MUST NOT read game state, RNG, wall-clock time, or the filesystem. All content it needs MUST be passed in or injected once at construction.

**ENG-005** (MUST, C) — The engine MUST exist as **one** implementation: framework-free TypeScript under `lib/engine/`, importing nothing from React, React Native or Expo. That same module MUST be the engine used by the game, by the content-validation CLI, by the headless simulator and by the test suite. *(Supersedes draft 2's GDScript + Python dual implementation; see §18.7.)*

**ENG-006** (MUST, C) — The golden corpus is the engine's contract. Every case in it MUST be asserted against the engine in CI, and any divergence MUST fail the build. Where draft 2 cross-checked two implementations against each other, draft 3 checks one implementation against a corpus that is reviewed and extended whenever a bug is found (`TST-002`).

**ENG-007** (MUST, D) — The engine MUST hold no private tables. All content it consumes MUST come from `data/`, loaded through the same typed modules the app uses (`DATA-008`).

**ENG-008** (MUST, D) — The engine MUST NOT depend on any Node built-in (`fs`, `path`, `crypto`, `process`) or any browser/DOM global, so the identical file runs under Hermes, under Node and under the test runner. A lint rule MUST enforce this import boundary (`TEC-007`).

**ENG-009** (MUST, D) — The engine MUST NOT mutate its inputs, and MUST NOT rely on object key iteration order for any decision. Any map it iterates for a decision MUST be sorted explicitly first.

### 5.2 Tokenizing and parsing

**ENG-010** (MUST, B) — Stage 1 MUST convert the Sentence Line into tokens, expand each card into its candidate readings (a placed card may be ambiguous across forms or parts of speech), and produce structure candidates.

**ENG-011** (MUST, B) — When several structures match, the engine MUST compute the full score for each candidate and return the highest-scoring one.

**ENG-012** (MUST, D) — Ties between candidates of equal score MUST be broken deterministically by lowest structure index (S1 before S2), then by lowest tone index. Never by iteration order.

**ENG-013** (MUST, D) — The candidate search MUST be bounded: if the reading space exceeds a configured cap, the engine MUST return a deterministic partial result rather than run unbounded. The cap MUST be large enough that no legal 5-card + tiles line can reach it.

**ENG-014** (MUST, B) — Parsing MUST respect the chapter gate: structures, tones, and forms not yet unlocked MUST NOT be considered as candidates.

### 5.3 Validation

**ENG-020** (MUST, B) — Stage 2 MUST validate at minimum: subject–verb agreement, article use, countability, word order, question inversion, tense/adverb agreement, comparatives, passive construction, and relative pronoun choice.

**ENG-021** (MUST, B) — Validation MUST map every failure onto one of the 30 error codes in `DATA-060`.

**ENG-022** (MUST, D) — When several validation failures apply, the engine MUST report exactly one — the one whose repair is smallest per `ENG-040`, with ties broken by the error code's declared severity, then by lowest token index.

**ENG-023** (MUST, D) — A validation failure MUST identify the offending token by its index in the Sentence Line, so the UI can highlight it.

### 5.4 Meaning check

**ENG-030** (MUST, B) — Stage 3 MUST check semantic sanity, not truth. It MUST verify subject/object class admissibility for the verb, adjective–noun admissibility, and preposition–complement admissibility, using the classes from `DATA-018`.

**ENG-031** (MUST, B) — A grammatical sentence that fails the meaning check MUST still score, MUST lose the +1 Force from `SCR-021`, and MUST be tagged **Poetic**.

**ENG-032** (MUST, B) — "The cat eats fish." MUST pass the meaning check. "The cat drinks the table." MUST parse, fail the meaning check, and be tagged Poetic.

**ENG-033** (MUST, D) — The meaning check MUST NOT block, warn about, or penalise a sentence for being false, odd, or fantastical when the classes admit it. Poetic is a flavour tag, never a scolding.

### 5.5 Diagnosis

**ENG-040** (MUST, B) — For an invalid sentence, Stage 4 MUST search for the smallest repair among: change one card's form, add one tile, or swap two adjacent tokens — and report the corresponding error code plus the offending token.

**ENG-041** (MUST, D) — The repair search MUST be bounded to edit distance 2 and MUST be deterministic in its ordering (form change, then tile insertion, then swap).

**ENG-042** (MUST, B) — The diagnosis result MUST drive the Scribe's Note shown in the UI (see `LRN-030`).

**ENG-043** (SHOULD, D) — When no repair within the bound is found, the engine MUST return a generic fallback error code rather than no code at all. The fallback rate on the golden corpus SHOULD be under 2%.

---

## 6. Scoring (`SCR`)

### 6.1 Order of operations

**SCR-001** (MUST, B) — The scorer MUST execute in exactly this order, and the score animation MUST replay this same order:

1. Start with the chosen structure's base Weight (W) and base Force (F), at its current level.
2. Add each card's Weight, left to right, including card enhancements.
3. Apply phrase bonuses (`SCR-010`).
4. Add the tone bonus, plus +1 if the sentence's two clauses use different tones.
5. Add +1 F if the sentence passes the meaning check.
6. Apply Seals in slot order.
7. Apply enemy constraints.
8. `score = floor(W × F)`.

**SCR-002** (MUST, D) — The order in `SCR-001` is normative. Reordering any step is a behaviour change requiring a spec change, not an optimisation.

**SCR-003** (MUST, B) — Seal order MUST be player-controllable, and the scorer MUST honour slot order. Two seals in swapped slots MUST be able to produce different scores.

**SCR-004** (MUST, D) — W and F MUST each be carried through steps 1–7 as an exact rational — an integer `{num, den}` pair, never a JavaScript float. Step 8 MUST be the only rounding in the whole pipeline, computed as an integer floor division (see `TEC-025`).

### 6.2 Bonuses

**SCR-010** (MUST, B) — Phrase bonuses MUST be: +3 W per prepositional phrase; +2 W per adverb; +3 W per infinitive; +2 W for a superlative; +3 W for a correctly chosen irregular past or past participle.

**SCR-011** (MUST, B) — Compound and conditional sentences MUST add each clause's own structure Weight.

**SCR-012** (MUST, B) — A sentence whose two clauses use different tones MUST receive +1 F.

**SCR-013** (MUST, C) — Clauses contribute **Weight only, never Force**. In a compound or conditional sentence the outer structure's base Force stands alone, plus the tone bonus and the `SCR-012` contrast bonus. Summing clause Forces would make S7 and S13 strictly dominant and break the score curve.

**SCR-014** (MUST, C) — For a multi-clause sentence, the tone bonus of step 4 MUST be the **highest** tone bonus among its clauses, not the sum.

**SCR-020** (MUST, B) — The tone bonus MUST be applied per `DATA-032`.

**SCR-021** (MUST, B) — A sentence that passes the meaning check MUST receive +1 F.

### 6.3 Mumbles

**SCR-030** (MUST, B) — An ungrammatical commit is a **Mumble**: it MUST score the raw sum of card Weights only — no structure Weight, no structure Force, no tone, no phrase bonus, no meaning bonus.

**SCR-031** (MUST, D) — Seals MUST NOT apply to a Mumble unless a seal explicitly declares that it does.

**SCR-032** (MUST, B) — A Mumble MUST NOT produce a failure screen or a red X. The UI MUST show a small "Mumble…" banner plus the Scribe's Note.

**SCR-033** (MUST, B) — A Mumble MUST still consume the Breath and MUST still deal its (small) damage.

### 6.4 Worked examples (acceptance)

**SCR-040** (MUST, B) — The scorer MUST reproduce these exactly:

| Sentence | Chapter context | Expected score |
|---|---|---|
| Birds fly. | Ch1 | **27** |
| The cat eats fish. | Ch1 | **64** |
| If it rains, we will stay at home. | Ch4 | **1,092** |

**SCR-041** (MUST, D) — These three cases MUST be the first entries in the golden corpus and MUST be asserted on every CI run.

**Verification against `DATA-034`:**

*Birds fly.* — W = 5 + (2+2) = **9**; F = 2 + 0 tone + 1 meaning = **3**; 9 × 3 = **27** ✓

*The cat eats fish.* — W = 10 + (2+2+2) = **16**; F = 3 + 0 tone + 1 meaning = **4**; 16 × 4 = **64** ✓ (*the* is a free tile, 0 W)

*If it rains, we will stay at home.* — cards `it`1 + `rains`2 + `we`1 + `stay`2 + `home`2 = 8, exactly 5 deck cards (`if`/`will`/`at` are free tiles). W = 50 + 8 + 3 (prep phrase *at home*) + 5 (clause 1 = S1) + 18 (clause 2 = S5) = **84**. F = 10 + 1 (future *will*, per `SCR-014`) + 1 (tone contrast) + 1 (meaning) = **13**. 84 × 13 = **1,092** ✓

This solution depends on reading clause 2 as S5 and on `SCR-013`/`SCR-014`. It is not the only arithmetic solution, but it is the one this spec adopts.

### 6.5 Trace

**SCR-050** (MUST, B) — The scorer MUST emit a step-by-step trace: for each of the 8 steps, the W and F before and after, the reason, and the entity responsible (card id, seal id, constraint id).

**SCR-051** (MUST, D) — The animation layer MUST render from the trace only. It MUST NOT recompute any part of the score.

**SCR-052** (MUST, D) — The trace MUST be serialisable to canonical JSON (`TEC-024`), so a disputed score can be dumped and diffed against a known-good run.

**SCR-053** (MUST, D) — The trace MUST be a plain serialisable object containing no functions, class instances or circular references, so it can cross the JS ↔ UI-thread boundary into a Reanimated worklet without transformation (`TEC-035`).

---

## 7. Encounter loop (`ENC`)

### 7.1 Structure of an encounter

**ENC-001** (MUST, B) — An encounter MUST be won by reaching the enemy's Silence value within **4 Breaths**.

**ENC-002** (MUST, B) — The player MUST have **3 Rethinks** per encounter. One Rethink discards 1–5 chosen cards and draws back up.

**ENC-003** (MUST, B) — Hand size MUST be 8 and Line Capacity MUST be 5 deck cards, before modifiers.

**ENC-004** (MUST, B) — Toolbelt tiles MUST NOT count against Line Capacity.

**ENC-005** (MUST, B) — An encounter MUST take 2–4 minutes of play at default animation speed.

**ENC-006** (MUST, D) — Committing MUST be blocked only when the Sentence Line is empty. Any non-empty line MUST be committable — a bad sentence is a Mumble, not a blocked action.

**ENC-007** (MUST, D) — Cards placed in the Sentence Line MUST return to the hand when removed, and MUST move to the discard pile only on commit.

**ENC-008** (MUST, D) — When the draw pile empties, the discard pile MUST be reshuffled into it using the encounter's RNG stream (see `TEC-012`).

**ENC-009** (MUST, D) — The encounter loop MUST live in the engine core (`lib/run/`) as pure reducers over plain state, with no React imports. React state MUST hold a reference to that state and dispatch commands into it; game rules MUST NOT be expressed as component state, effects or refs.

### 7.2 Enemies and constraints

**ENC-010** (MUST, B) — Each enemy MUST have a Silence value: the cumulative score the player must reach.

**ENC-011** (MUST, B) — Enemy tiers MUST be Wanderer → Hushling → Warden, in that order within a chapter.

**ENC-016** (MUST, C) — Silence values MUST start from this ladder (~×3.5 per chapter) and MUST then be tuned by the simulator against `TST-031`:

| Ch | Wanderer | Hushling | Warden |
|---|---|---|---|
| 1 | 120 | 180 | 260 |
| 2 | 450 | 650 | 950 |
| 3 | 1,800 | 2,600 | 3,800 |
| 4 | 6,000 | 9,000 | 14,000 |

**ENC-012** (MUST, B) — Most enemies MUST carry a Constraint that changes scoring. The v1 Constraint set MUST include at minimum:

- Ch1 boss — "Cards without the Market theme give 0 Weight."
- Ch2 boss — "Repeating the previous sentence's structure scores ×0.5."
- Ch3 boss — "Only the first sentence of each tense scores fully; repeats ×0.25."
- "−1 hand size"
- "−1 Line Capacity"
- "Only S5 and above score."

**ENC-013** (MUST, B) — The active Constraint MUST be visible at all times as a chip on the encounter screen.

**ENC-014** (MUST, D) — Constraints MUST apply at step 7 of `SCR-001`, after seals, and MUST be visible in the trace.

**ENC-015** (MUST, D) — A Constraint MUST never make an encounter unwinnable from a legal starting state. The balance simulator (`TST-030`) MUST assert a non-zero win rate for every enemy under the greedy bot.

### 7.3 Win and loss

**ENC-020** (MUST, B) — Reaching or exceeding Silence MUST win the encounter immediately, without spending remaining Breaths.

**ENC-021** (MUST, B) — Failing to reach Silence within 4 Breaths MUST lose the encounter and end the run.

**ENC-022** (MUST, B) — One **Second Wind** per run MUST be available to buy one extra Breath.

**ENC-023** (MUST, C) — Second Wind MUST be offered at the moment of loss, not pre-emptively, and MUST be declinable.

**ENC-025** (MUST, C) — Second Wind MUST cost no Ink. Charging for it would penalise exactly the players who need it, which contradicts the no-shaming stance of `BIZ-004`.

**ENC-024** (MUST, B) — Winning MUST award Ink per `RUN-010`.

---

## 8. Run structure, economy and persistence (`RUN`)

### 8.1 Run shape

**RUN-001** (MUST, B) — A run MUST be 4 chapters × 3 encounters = 12 fights, followed by a win state.

**RUN-002** (MUST, B) — A full run MUST take 20–35 minutes at default animation speed.

**RUN-003** (MUST, B) — Chapters MUST unlock content cumulatively: structures, tones, forms, tiles and word bands per `DATA-033`, `DATA-042`, `DATA-051`, `DATA-012`.

**RUN-004** (MUST, D) — A run MUST be resumable: quitting mid-encounter and reopening the app MUST restore the exact state, including hand, Sentence Line, Breaths and Rethinks used. On Android this MUST hold across process death, not just backgrounding (`TEC-034`).

### 8.2 Economy

**RUN-010** (MUST, B) — Ink rewards MUST be 3 / 4 / 6 per win for Wanderer / Hushling / Warden respectively.

**RUN-011** (MUST, B) — The player MUST earn +1 Ink per unused Breath.

**RUN-012** (MUST, B) — The player MUST earn +1 Ink interest per 5 Ink held, at the point defined in `RUN-013`.

**RUN-013** (MUST, C) — Interest MUST be computed once, on entering the shop, on the Ink held at that moment, and MUST be shown as a separate line in the reward panel. Interest MUST be capped at **+5** per shop, so Ink held above 25 earns nothing further.

**RUN-014** (MUST, D) — Ink MUST be an integer and MUST never go negative.

### 8.3 Shop

**RUN-020** (MUST, B) — A shop MUST appear after every encounter.

**RUN-021** (MUST, B) — The shop MUST offer: 2 Seals, 2 consumables, word packs (buying new word cards), a card-erase service, and a reroll.

**RUN-022** (MUST, B) — Shop stock MUST favour words that are due for review (see `LRN-012`).

**RUN-023** (MUST, D) — Shop stock MUST be generated from the run's shop RNG stream so a seeded run produces identical shops on replay.

**RUN-024** (MUST, D) — Every shop item MUST show its price before purchase and MUST be non-purchasable, not merely error-producing, when Ink is insufficient.

**RUN-025** (MUST, C) — Starting shop prices MUST be: Seal 5 / 7 / 10 by rarity · Scroll 3 · Tablet 8 · word pack 4 (draw 3, keep 1) · erase a card 3 · reroll 1, rising by +1 for each further reroll within the same shop. Sized against ~15–20 Ink earned per chapter, ~70 per run.

### 8.4 Items

**RUN-030** (MUST, B) — Seals MUST be passive, held in ordered slots, and applied at step 6 of `SCR-001`.

**RUN-031** (MUST, B) — The v1 seal set MUST include effects of these shapes: flat Weight per part of speech ("+4 Weight per adjective"), Force multipliers conditioned on structure ("×1.5 Force on questions", "×2 Force on relative clauses"), positional effects ("double the leftmost card"), and capacity effects ("+1 Line Capacity").

**RUN-032** (MUST, D) — The player MUST be able to reorder seals outside of a commit, and the UI MUST make it clear that order changes the score.

**RUN-033** (MUST, C) — Base seal slot count MUST be **4**, expandable to a maximum of **6** by items. (Balatro's 5 assumes ~24 blinds; a 12-fight run needs a tighter start.)

**RUN-034** (MUST, B) — Scrolls MUST be one-shot and consumed on use.

**RUN-035** (MUST, B) — Tablets MUST permanently raise one structure's level for the remainder of the run.

**RUN-036** (MUST, D) — Structure levels gained from Tablets MUST NOT persist between runs.

### 8.5 Meta progression

**RUN-040** (MUST, B) — Winning a run MUST unlock harder **Ink Levels** (difficulty tiers).

**RUN-044** (MUST, C) — Ink Levels MUST scale by **Silence multiplier alone**: ×1.25 per tier over the base ladder of `ENC-016`, for **5 tiers** total. Constraints MUST NOT stack across tiers and the starting deck MUST NOT be penalised. One number keeps the tiers simulator-tunable; stacked constraints are a combinatorial balance problem, and deck penalties punish exactly the learners this game exists for.

**RUN-041** (MUST, B) — Winning MUST unlock new starting decks (**Satchels**), up to the 4 defined in `DATA-065`.

**RUN-042** (MUST, B) — Learned words, unlocked Codex pages, and unlocked Satchels MUST persist across runs.

**RUN-043** (MUST, D) — Meta progression MUST NOT grant in-run power beyond deck composition and difficulty choice — no permanent stat upgrades. (This protects the "paid unlock gives content, never power" stance and keeps balance tractable.)

### 8.6 Save and load

**RUN-050** (MUST, D) — The save file MUST be versioned, and loading a save from an older version MUST either migrate it or refuse cleanly with a readable message — never crash or silently corrupt.

**RUN-051** (MUST, D) — Save writes MUST be atomic: no partially-written save may ever be readable. The mechanism is specified in `TEC-032`.

**RUN-052** (MUST, B) — Run state MUST contain no floating-point values (`TEC-020`).

**RUN-053** (MUST, B) — A run MUST be reproducible from its seed plus its command log to an identical end state, compared by canonical-JSON hash (`TEC-024`).

**RUN-054** (MUST, D) — The command log MUST record every player action that affects state: card placement, removal, form change, tile placement, seal reorder, rethink, commit, purchase, item use.

**RUN-055** (MUST, D) — Save payload size MUST be bounded: the command log of a completed run MUST be truncated to its final-state hash once the run ends, so saved data does not grow without limit across many runs. A Daily Run's log MUST be retained until its leaderboard submission is accepted or abandoned (`LB-050`), since it is the verification payload.

---

## 9. Learning layer (`LRN`)

### 9.1 Word mastery

**LRN-010** (MUST, B) — Every word MUST carry a per-player mastery state: `new` → `seen` → `practised` → `mastered`.

**LRN-011** (MUST, C) — Mastery MUST advance only on correct use in a committed, valid sentence — never on merely drawing or placing the card. Thresholds MUST live in `data/learning.json` and MUST start at: `new` → `seen` on first draw; `seen` → `practised` after 3 valid uses; `practised` → `mastered` after 6 valid uses spanning at least 2 different structures on at least 2 separate days.

**LRN-012** (MUST, B) — Words MUST be scheduled for spaced review, and a due word MUST be offered more often in shops.

**LRN-015** (MUST, C) — Review intervals MUST start at 1, 3, 7, 16 and 35 days. A due word MUST carry **3× weight** in the shop word pool.

**LRN-013** (MUST, B) — A mastered word MUST give +1 Weight.

**LRN-014** (MUST, D) — Mastery MUST NOT decay to a lower state. Review scheduling may bring a word back into rotation, but the player must never watch progress go backwards (no streak shaming — see `BIZ-004`).

**LRN-016** (MUST, D) — "Separate days" in `LRN-011` and the review schedule in `LRN-015` MUST be evaluated against a single, explicitly chosen clock — UTC calendar days, read once per app session — and MUST be resistant to the device clock moving backwards: a clock set into the past MUST NOT mark reviews due again or reset a day counter.

### 9.2 Codex

**LRN-020** (MUST, B) — The first correct use of a structure MUST unlock its Codex page.

**LRN-021** (MUST, B) — Each structure Codex page MUST contain: an Arabic explanation, the pattern, 3 examples, 2 common Arabic-speaker mistakes, and one tip.

**LRN-022** (MUST, B) — The Codex MUST hold 52 pages total: 14 structures, 7 tones, contractions, and the 30 error codes.

**LRN-023** (MUST, D) — An error code's Codex page MUST be reachable in one tap from its Scribe's Note.

### 9.3 Scribe's Note

**LRN-030** (MUST, B) — After a flawed commit, the game MUST show one short, kind note derived from the diagnosis (`ENG-042`).

**LRN-031** (MUST, B) — The note MUST have three player-selectable levels: **Guided** (note shown immediately), **Standard** (a button reveals it), **Expert** (icon only).

**LRN-032** (MUST, B) — The note MUST NOT use failure language, a red X, or a penalty screen.

**LRN-033** (MUST, D) — Exactly one note MUST be shown per commit, never a list of problems.

**LRN-034** (MUST, D) — The note MUST be written in Arabic by default, with the English sentence fragment it refers to rendered LTR inline (see `UI-021`, `TEC-062`).

### 9.4 Workshop, report, onboarding

**LRN-040** (MUST, B) — A **Workshop** sandbox MUST let the player build any sentence from known words and see the full analysis, with no enemies and no scoring pressure.

**LRN-041** (MUST, B) — A **Learning report** MUST show: words by mastery state, top recurring error codes, per-structure accuracy trend, and an estimated band (A1/A2/B1).

**LRN-042** (MUST, B) — The estimated band MUST always be labelled "based on your play" and MUST never be presented as a certificate, test result, or official CEFR level.

**LRN-043** (MUST, B) — A scripted tutorial MUST teach the core loop in about 4 minutes.

**LRN-044** (MUST, B) — An optional 6-puzzle quick check MUST be offered after the tutorial, and its result MUST set the initial Scribe's Note level.

**LRN-045** (MUST, D) — The quick check MUST be skippable, and skipping MUST default the note level to Guided.

---

## 10. UI and UX (`UI`)

### 10.1 Layout

**UI-001** (MUST, B) — The game MUST be portrait-only.

**UI-002** (MUST, B) — The encounter screen MUST lay out top to bottom: enemy + Silence meter + constraint chip + Breaths remaining; seal row; Sentence Line; toolbelt tray; hand of 8 cards; action bar (Rethink · Commit · consumables).

**UI-003** (MUST, B) — A word card MUST display: the word, its part of speech (colour + icon), its Weight, its CEFR badge, and its theme tag.

**UI-004** (MUST, B) — Long-pressing a card MUST show the Arabic meaning, an example sentence, all forms, and pronunciation.

**UI-005** (MUST, B) — Tapping a placed card MUST open the Form Wheel.

**UI-006** (SHOULD, D) — Placement MUST work by drag and also by tap-to-place, so the game is playable one-handed on a large phone.

**UI-007** (MUST, D) — Card drag MUST run on the UI thread via gesture-handler + Reanimated worklets, so a drag stays smooth while the JS thread is busy (`TEC-035`). A drag MUST NOT be implemented with per-frame React state updates.

**UI-008** (MUST, D) — Screens MUST be file-based routes under `app/`, one screen per file, with all game logic imported from the engine core — a route file holds layout and dispatch, never rules.

**UI-009** (MUST, C) — Word cards and toolbelt tiles MUST be rendered as vector and live text — theme tokens plus `react-native-svg` — never as raster images. This is forced by `UI-041` (four text sizes) and `UI-044` (no baked text): a card bitmap cannot reflow at the largest text step or swap language. Commissioned art therefore covers enemies and district backdrops; cards are code.

### 10.2 RTL and bidirectional text

**UI-020** (MUST, B) — The Arabic UI MUST be fully RTL.

**UI-021** (MUST, B) — The Sentence Line, the hand, the tiles, and any English example MUST always be left-to-right, regardless of UI direction. The mechanism is specified in `TEC-061`–`TEC-062`.

**UI-022** (MUST, D) — The RTL framework and theme tokens MUST be built before any screen is built (see `TEC-050`). Mirroring MUST be a layout property, not a per-screen hack: layout MUST use `start`/`end` rather than `left`/`right` everywhere, enforced by lint (`TEC-063`).

**UI-023** (MUST, D) — Mixed Arabic/English strings MUST be rendered with correct bidi isolation so an embedded English word never reverses the surrounding Arabic (`TEC-062`).

**UI-024** (MUST, D) — Numbers MUST use one consistent digit set throughout, chosen once in `data/` and applied globally through a single formatting helper. Raw number interpolation into a user-visible string MUST fail lint.

### 10.3 Animation and pacing

**UI-030** (MUST, B) — The scoring animation MUST complete in ≤ 3.5 seconds at 1× speed.

**UI-031** (MUST, B) — Speed settings of 1× / 2× / 4× MUST be available, and tap-to-skip MUST jump to the final value immediately.

**UI-032** (MUST, D) — Skipping MUST never change the resulting score or state.

**UI-033** (MUST, D) — The scoring animation MUST be driven entirely from the serialised trace on the UI thread (`SCR-051`, `SCR-053`). No engine call may occur during the animation.

### 10.4 Accessibility

**UI-040** (MUST, B) — Minimum touch target MUST be 48 dp.

**UI-041** (MUST, B) — Text size MUST have 4 steps, and all layouts MUST remain usable at the largest step without clipping.

**UI-042** (MUST, B) — The palette MUST be colourblind-safe.

**UI-043** (MUST, B) — Parts of speech MUST be distinguished by icon as well as by colour. Colour alone MUST never carry meaning.

**UI-044** (MUST, B) — No text may be baked into images. Every string MUST be localised (Arabic + English).

**UI-045** (SHOULD, D) — A reduced-motion setting SHOULD cut non-essential animation while preserving the scoring trace readout. It MUST default to on when the OS reports reduced-motion.

**UI-046** (MUST, C) — v1 MUST support TalkBack on all menus, and MUST announce card and Sentence Line contents as word + part of speech + Weight. Full screen-reader playability is an explicit post-v1 goal, not a v1 commitment.

**UI-047** (MUST, D) — Every touchable MUST be built from one shared pressable component that enforces the 48 dp minimum and requires an accessibility label. Using a raw `Pressable`/`Touchable*` outside that component MUST fail lint (`TST-040`).

---

## 11. Audio (`AUD`)

**AUD-001** (SHOULD, D) — Music and SFX MUST be independently mutable, and the game MUST be fully playable with sound off.

**AUD-002** (SHOULD, D) — Each scoring step MUST have a distinct audio beat so the score build is legible by ear at 1× speed.

**AUD-003** (MUST, D) — A Mumble MUST NOT use a harsh failure sting. Its audio must read as "not quite", consistent with `SCR-032`.

**AUD-004** (SHOULD, D) — No audio asset may contain spoken instruction text, so the game remains localisable without re-recording. Word pronunciation audio (`DATA-020`) is the exception.

**AUD-005** (MUST, C) — v1 audio scope MUST be: 4 district ambient loops (one per chapter), ~12 SFX, one distinct tone per scoring step, and no voice-over beyond the per-word pronunciation of `DATA-020`. Total audio budget ≤ 15 MB.

**AUD-006** (MUST, D) — Audio MUST be played through a single wrapper module so the underlying Expo audio API is replaceable in one place, and so muting is enforced centrally rather than per call site.

> Apart from `AUD-005`, audio is not covered by the concept brief; the rest of this section is derived.

---

## 12. Technology, determinism and build (`TEC`)

> This section was rewritten in full for draft 3. Draft 2 specified Godot 4.7 + GDScript; the project now runs on the Expo / React Native / TypeScript stack proven in `flick-dot`. See §18.7 for the changelog.

### 12.1 Stack

**TEC-001** (MUST, C) — The game MUST be built with **Expo (SDK 54 line) on React Native 0.81 / React 19**, in **TypeScript** with `strict: true`, using **expo-router** file-based routing. Package versions MUST track `flick-dot` unless a documented reason says otherwise. *(Supersedes draft 2's Godot 4.7 + GDScript.)*

**TEC-002** (MUST, C) — The app MUST run on **Hermes** with the **New Architecture** enabled (`newArchEnabled: true`) and the React Compiler experiment on, matching `flick-dot`'s `app.json`. *(Supersedes draft 2's Compatibility renderer.)*

**TEC-003** (MUST, D) — Type strictness MUST be enforced in CI: `tsc --noEmit` and `expo lint` MUST both pass on every pull request. The engine core MUST contain no `any`, no non-null assertion (`!`) and no `@ts-expect-error`; a lint rule MUST enforce this for `lib/engine/` and `lib/run/`.

**TEC-004** (MUST, D) — The runtime dependency set MUST stay close to `flick-dot`'s: `expo`, `expo-router`, `expo-font`, `expo-haptics`, `expo-crypto`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `@react-native-async-storage/async-storage`. Adding a dependency outside this set is a decision to record, not a convenience. The server-side half of `flick-dot`'s dependency list (Express, Drizzle, `pg`) MUST stay out of the mobile bundle; it belongs to `server/` only (§12.9). `@tanstack/react-query` is the one exception — it is a client dependency, used for leaderboard state and nothing else (`TEC-074`).

**TEC-005** (MUST, D) — Expo packages MUST be installed with `npx expo install` so SDK-compatible versions are picked, never with a bare `npm install`.

### 12.2 Project layout and boundaries

**TEC-006** (MUST, D) — The repository MUST use this layout:

| Path | Contents |
|---|---|
| `app/` | expo-router screens, one per file. Layout and dispatch only. |
| `components/` | Presentational components; `components/game/` for encounter-screen pieces. |
| `constants/` | Theme tokens (colour, type scale, spacing). No literals elsewhere. |
| `lib/engine/` | Grammar engine core: tokenize, parse, validate, meaning, diagnose, score. Framework-free. |
| `lib/run/` | Encounter loop, run state, economy, shop, items. Framework-free pure reducers. |
| `lib/rng/` | Seeded `xoshiro128**` streams. |
| `lib/persistence/` | Save format, versioning, migration, atomic write. |
| `lib/i18n/` | Locale strings, direction handling, bidi and digit helpers. |
| `lib/platform/` | The only place any Expo/native module is imported (audio, haptics, fonts, billing). |
| `data/` | All content and balance JSON; `data/schema/` holds the JSON Schemas. |
| `tools/` | Node CLIs run with `tsx`: content validation, corpus runner, balance simulator. |
| `server/` | The backend of §12.9: Express app, routes, verification worker, static pages. Never imported by the app. |
| `shared/` | Drizzle schema and types shared by client and server. No React, no Expo. |
| `tests/` | Unit tests and `tests/corpus/` — the golden corpus. |
| `assets/` | Fonts, images, audio. |
| `plugins/` | Expo config plugins (signing, Play publisher, ABI restriction). |
| `.github/workflows/` | `ci.yml`, `android-build.yml`, `release-please.yml`. |

**TEC-007** (MUST, D) — The engine core (`lib/engine/`, `lib/run/`, `lib/rng/`) MUST import nothing from React, React Native, Expo, Node built-ins or the DOM. An ESLint `no-restricted-imports` boundary rule MUST enforce this, and violating it MUST fail CI. This is what lets the same code run in the app, in `tools/` under Node and in the test runner.

**TEC-008** (MUST, D) — Path aliases MUST be configured in `tsconfig.json`: `@/*` for the repo root (as in `flick-dot`) and `@engine/*` for `lib/engine/*`. Deep relative imports (`../../../`) across top-level folders MUST fail lint.

**TEC-009** (MUST, D) — Every native or Expo capability MUST be reached through a single wrapper module in `lib/platform/`. No screen, component or engine file may import an Expo package directly. This is what keeps `TEC-040` (iOS later) cheap and makes the native surface auditable in one place.

### 12.3 Randomness

**TEC-010** (MUST, B) — All randomness MUST come from seeded **xoshiro128\*\*** streams implemented in `lib/rng/`. `Math.random()` MUST NOT appear anywhere in the repo, enforced by lint.

**TEC-011** (MUST, B) — The run seed MUST be visible to the player.

**TEC-012** (MUST, D) — RNG MUST be split into independent named streams (deck shuffle, shop stock, enemy selection, cosmetic) so that a change in one does not shift the others.

**TEC-013** (MUST, D) — Cosmetic randomness MUST NOT draw from a run-affecting stream.

**TEC-014** (MUST, D) — The generator MUST operate on unsigned 32-bit integers throughout: state held in a `Uint32Array(4)`, rotations written as `(x << k | x >>> (32 - k)) >>> 0`, multiplications done with `Math.imul`. No intermediate value may become a float. A unit test MUST assert the implementation against a published `xoshiro128**` reference vector.

**TEC-015** (MUST, D) — Bounded draws MUST be unbiased: rejection sampling, never `% n` on a raw 32-bit word. Shuffles MUST be Fisher–Yates driven by the stream; a comparator-based shuffle MUST NOT be used.

### 12.4 Exact arithmetic and serialisation

**TEC-020** (MUST, B) — Run state MUST contain no floating-point values. Every number in run state MUST be a safe integer, and a development-mode assertion MUST verify `Number.isSafeInteger` over the whole state before every save.

**TEC-021** — `[RETIRED]` — draft 2's command-log requirement. Superseded by `RUN-053` and `RUN-054`, which already state it.

**TEC-022** — `[RETIRED]` — draft 2's headless replay-assertion requirement. Superseded by `TST-021`.

**TEC-023** (MUST, D) — Content validation, the corpus runner and the balance simulator MUST import the shipped engine modules directly and run under `tsx`. No tool may reimplement, stub or mock engine behaviour.

**TEC-024** (MUST, D) — Anything hashed, diffed or compared across runs (state hashes, traces, replay results) MUST be serialised through one canonical-JSON helper: object keys sorted, no floats, stable array order. `JSON.stringify` MUST NOT be used directly for these purposes.

**TEC-025** (MUST, D) — Weight and Force MUST be carried as exact rationals — `{ num: number; den: number }` with integer fields — through steps 1–7 of `SCR-001`. The single floor at step 8 MUST be computed in `BigInt` (`(Wn * Fn) / (Wd * Fd)` as integer division) and converted back to a `number` only after asserting the result is a safe integer.

**TEC-026** (MUST, D) — The engine core MUST NOT use `Intl`, `toLocaleString`, `localeCompare`, `Date`, or any other API whose result depends on locale, timezone or platform. Sorting MUST use explicit numeric or code-unit comparators.

### 12.5 Runtime behaviour and persistence

**TEC-030** (MUST, B) — Android MUST be the primary target. The app MUST be portrait-only (`UI-001`), declared in `app.json`.

**TEC-031** (MUST, B) — Every gameplay feature MUST work offline, including playing the Daily Run. The app declares the network permission and uses it for exactly three things: the purchase flow (`BIZ-009`), leaderboard traffic (§13), and — if it ever ships — opt-in analytics (`BIZ-010`). Losing the network MUST degrade features, never block play (`LB-050`–`LB-053`).

**TEC-032** (MUST, D) — Save writes MUST be atomic from the reader's point of view: write the new payload under a staging key, then flip a single pointer key to it, then delete the old payload. A kill at any point MUST leave either the previous save or the new one fully readable, never a partial one.

**TEC-033** (MUST, D) — Saves MUST be stored in `AsyncStorage` through `lib/persistence/` only, under a documented key namespace, with an explicit integer `schemaVersion` in the payload and a registered migration per version step (`RUN-050`).

**TEC-034** (MUST, D) — The app MUST persist enough state on every command (or on a short debounce) that Android killing the process mid-encounter loses at most the last uncommitted interaction. Restoration MUST be verified by an automated test that loads a saved payload into a fresh engine instance and compares state hashes.

**TEC-035** (MUST, D) — Gesture handling and the scoring animation MUST run on the UI thread via `react-native-gesture-handler` and `react-native-reanimated` worklets. No game-visible animation may be driven by per-frame React re-renders, and no engine function may be called from inside a worklet.

**TEC-036** (MUST, D) — The engine MUST be called exactly once per commit, on the JS thread, before the animation starts. Calling it during animation, on every card placement, or on every keystroke-equivalent interaction is forbidden — a preview of the current line, if one is added later, MUST be explicitly debounced and marked as a separate call site.

### 12.6 Platform, signing and distribution

**TEC-040** (MUST, B) — Nothing in the architecture may block a later iOS build: no Android-only module outside `lib/platform/`, and no platform-specific code outside it.

**TEC-041** (MUST, D) — The three Expo config plugins from `flick-dot` MUST be carried over and kept in `plugins/`: release signing from environment variables, Gradle Play Publisher wiring, and ABI restriction to `armeabi-v7a,arm64-v8a`. Keystores, service-account keys and passwords MUST NEVER be committed; they MUST arrive as GitHub secrets decoded at build time.

**TEC-042** (MUST, D) — Android `versionCode` MUST be derived from the release tag (`vX.Y.Z` → `X*10000 + Y*100 + Z`) at build time, as in `flick-dot`, so every Play upload is monotonic with no manual bookkeeping.

**TEC-043** (MUST, D) — `app.json` MUST declare: name "Word Rogue", slug `word-rogue`, Android package `com.moirisgames.wordrogue`, portrait orientation, `newArchEnabled: true`, typed routes, and the adaptive-icon set.

**TEC-044** (MUST, C) — Fonts MUST be bundled as local files loaded with `expo-font` — not fetched from a font CDN and not pulled from an `@expo-google-fonts` package — so `NFR-009`'s single bilingual variable family and the 5 MB data-and-fonts budget are both enforceable.

**TEC-081** (MUST, C) — The type family MUST be **Cairo** — variable, covering Arabic and Latin, OFL — bundled as a local variable font file. Its Latin quality at the game's sizes MUST be judged on a device at M6; if it is rejected there, the replacement MUST also be a single variable family covering both scripts (`NFR-009`), never a Latin family paired with an Arabic one.

**TEC-045** (MUST, D) — The app MUST be developed and tested as an Expo **development build**, not in Expo Go, because billing (`BIZ-009`) is a native module. `npx expo prebuild --platform android` MUST be reproducible from a clean checkout; the generated `android/` directory MUST NOT be committed.

**TEC-046** (MUST, C) — Billing MUST use **`expo-iap`** (the OpenIAP-conforming Expo library) accessed only through `lib/platform/billing.ts`. A subscription-management service such as RevenueCat MUST NOT be used: it requires a network round trip and a third-party account, which conflicts with `BIZ-005` and `BIZ-008`.

### 12.7 Build order, tooling and CI

**TEC-050** (MUST, B) — Build order MUST be: (0) repo scaffold and CI, (1) data model, (2) grammar engine with golden corpus first, (3) scorer, (4) headless encounter loop, (5) shop/items/run state/save, (6) UI — theme tokens and RTL framework first, (7) learning layer, (8) balance tuning in JSON only.

**TEC-051** (MUST, B) — The headless balance simulator MUST be able to play whole runs with bot policies (greedy, novice) to tune Silence targets. It MUST run as `tools/simulate.ts` under `tsx`, with no React Native runtime.

**TEC-052** (MUST, B) — Balance tuning MUST change only JSON values, never code.

**TEC-053** (MUST, D) — CI MUST run on every pull request and every push to `main`, on Node 22, and MUST include: `npm ci`, lint, typecheck, unit tests, the golden-corpus run, content validation, and the engine performance benchmark (`TST-024`). Any failure MUST block merge.

**TEC-054** (MUST, D) — Repository hygiene MUST match `flick-dot`: `lefthook` pre-commit lint on staged files, `commitlint` with conventional commits, `release-please` driving version bumps and the changelog from commit messages, and a `.gitattributes` forcing LF so a Windows checkout does not rewrite the tree.

**TEC-055** (MUST, D) — The release path MUST be: conventional commits → `release-please` opens a release PR → merging it tags `vX.Y.Z` → the Android workflow builds the signed APK (attached to the GitHub Release) and the AAB (published to the Play Store **internal** track) in a single Gradle invocation, with Gradle and ccache caching as in `flick-dot`.

**TEC-056** (MUST, D) — The test runner MUST be **Vitest**, running in a Node environment against the engine core, the run loop, the RNG, persistence serialisation and the data schemas. Component and screen tests are out of v1 scope; the checks in `TST-040`–`TST-042` cover the UI instead.

**TEC-057** (MUST, D) — Every `tools/` CLI MUST be runnable locally with one npm script, exit non-zero on failure, and print a machine-readable summary line so CI output is greppable.

### 12.8 Internationalisation mechanics

**TEC-060** (MUST, D) — The app MUST ship exactly two locales, `ar` (default) and `en`, loaded from `lib/i18n/`. There MUST be no runtime string concatenation of translated fragments; every user-visible string MUST be a single keyed entry with named interpolations.

**TEC-061** (MUST, C) — Layout direction MUST be applied once, before the first render, from the selected locale (`I18nManager.allowRTL` / `forceRTL`). LTR islands — the Sentence Line, the hand, the toolbelt tray and any English example — MUST be forced with the `direction: 'ltr'` style on their container rather than by conditionally flipping `flexDirection` per screen. Direction handling is the one part of this stack with no precedent in `flick-dot`, so it MUST be proven twice: a throwaway spike on a physical Android device during **M0** — one Arabic screen, one LTR island, one embedded English fragment — and the full check of `TST-043` at M6. The M0 spike MUST happen before the scaffold is considered complete.

**TEC-062** (MUST, D) — Any English fragment embedded in an Arabic string MUST be wrapped in Unicode bidi isolates (U+2066 LRI … U+2069 PDI) by a single i18n helper. Raw interpolation of an English word into an Arabic template string MUST fail lint.

**TEC-063** (MUST, D) — Styles MUST use the direction-relative properties (`marginStart`, `paddingEnd`, `start`, `end`, `textAlign: 'left' | 'right'` only inside an explicitly-LTR island). `marginLeft`, `marginRight`, `left` and `right` MUST fail lint outside `lib/i18n/` and the LTR-island components.

**TEC-064** (MUST, C) — Changing the app language MUST take effect on the whole UI at the **next launch**, and the app MUST say so plainly at the moment of the change. The app MUST NOT reload itself for this, and MUST NOT add a dependency to do so. Language is changed approximately once in a player's lifetime; it does not justify the machinery.

### 12.9 Backend service (required)

> Draft 3 made this optional, justified only by the Play Store's hosted-privacy-policy requirement. The leaderboard (§13) makes it load-bearing. It is still deployed and versioned separately from the game, and the game still runs without it.

**TEC-070** (MUST, C) — A backend service MUST be deployed, reusing `flick-dot`'s pattern verbatim: **Express 5 + Drizzle ORM + PostgreSQL**, containerised, published to GHCR by GitHub Actions and run behind Traefik on the VPS via `docker compose`.

**TEC-079** (MUST, C) — The **API** and the **verification worker** MUST be separate services from day one, even on a single host, with an explicit CPU limit on the worker. Verification replays whole runs and is the only CPU-heavy thing in the stack; keeping it separable means it can be throttled or moved to its own machine without a rewrite, and cannot starve anything it shares a host with.

**TEC-080** (MUST, C) — Word Rogue's backend MUST run on the **existing VPS**, as its own compose project with its own database, sharing only the Traefik proxy network with anything else on the host. No schema, volume or container may be shared with another product. The isolation of `TEC-079` and this requirement is what makes sharing a host safe, and moving to a dedicated host later a configuration change rather than a migration.

**TEC-071** (MUST, D) — The service MUST live in `server/`, with the database schema in `shared/schema.ts` so client and server share one set of types. `shared/` MUST NOT import anything from `app/` or `components/`.

**TEC-072** (MUST, D) — Migrations MUST be generated with `drizzle-kit`, committed as SQL, and applied automatically on server boot. There MUST be no manual migration step in the deploy path.

**TEC-073** (MUST, D) — The server MUST import the engine from `lib/engine/` directly, as a source dependency, and MUST NOT hold a second copy, a port, or a compiled snapshot of it (`LB-032`).

**TEC-074** (MUST, D) — All server state on the client MUST go through `@tanstack/react-query`. `AsyncStorage` MUST hold only local game state plus the pending-submission queue (`LB-050`) — never a cache of server data.

**TEC-075** (MUST, D) — The HTTP surface MUST be limited to: a health endpoint, country detection, leaderboard read and submit, and the admin endpoints of `LB-042`, gated by a shared-secret header as in `flick-dot`. Every other route MUST be a static page.

**TEC-076** (MUST, D) — The service MUST also serve the landing page and the **privacy policy** the Play Store listing requires.

**TEC-077** (MUST, D) — Deployment MUST be gated on a health check: pull the tagged image, recreate, wait for healthy, fail the deploy if it does not become healthy — `flick-dot`'s `deploy.sh` behaviour.

**TEC-078** (MUST, D) — The backend MUST NOT be required to build, test or run the game. `npm run typecheck`, the test suite and the Android build MUST all pass with `server/` absent.

---

## 13. Leaderboard (`LB`)

> New in draft 4. The leaderboard is the one part of this game that is genuinely online, and it is the reason §12.9 is a required backend rather than an optional one.
>
> The property that makes it work: a Word Rogue score is fully determined by seed + command log (`RUN-053`), and the engine is framework-free TypeScript (`ENG-005`). The server runs **the same engine file** and replays every submission. A forged score requires a legal command log, which means actually playing the run.

### 13.1 Boards and scope

**LB-001** (MUST, C) — v1 MUST ship two ranked boards, both computed from the same daily seed: **Daily Run** (total score) and **Daily Best Sentence** (highest single Breath).

**LB-002** (MUST, C) — The Daily Run MUST be **Chapter 1 only** — its 3 encounters — so every player can complete it on the free-forever content of `BIZ-001`. The paid unlock MUST NOT grant any leaderboard access, advantage, extra attempt or separate ranked tier (`BIZ-003`).

**LB-003** (MUST, C) — Daily Best Sentence MUST rank the highest-scoring single Breath committed during that day's Daily Run, not a sentence built anywhere else. The Workshop (`LRN-040`) MUST NOT feed any board.

**LB-004** (MUST, D) — Every board MUST be viewable **global or country-filtered**, and **daily or all-time**, following `flick-dot`'s leaderboard shape.

**LB-005** (MUST, D) — One entry per player per board per day. A better score MUST replace the player's previous entry rather than adding a row.

**LB-006** (MAY, D) — These boards are post-v1 and are named here only so the schema leaves room for them: **Weekly Gauntlet** (one seed per week under a fixed constraint), **Efficiency** (highest score with Breaths unused), **Hall of Fame** (best sentence ever per structure), **Wall of Poetry** (community-voted Poetic sentences).

**LB-007** (MUST, D) — Learning statistics — mastery counts, structures used, error-code frequencies, the estimated band — MUST NOT be ranked, published or transmitted. They cannot be replay-verified, they are grind-gameable, and publishing them would break `BIZ-008`. The learning report stays local.

### 13.2 The daily seed

**LB-010** (MUST, D) — The daily seed MUST be derived from the UTC date key by a pure function shared by client and server, so no seed-distribution endpoint exists and an offline player gets the correct day's run.

**LB-011** (MUST, D) — The Daily Run MUST fix every run-shaping variable for the day: satchel, Ink Level, enemy selection, shop stock. Two players on the same day MUST face byte-identical conditions.

**LB-012** (MUST, C) — **Ranked** attempts MUST be limited to **2 per day**, enforced on the client for UX and on the server for correctness. A third submission for the same date key MUST be rejected.

This cap exists for board integrity, **not** to limit play. The daily seed is fixed and the game is deterministic, so with uncapped ranked attempts brute force becomes optimal and the board stops measuring skill and starts measuring free time — which would rank a player by how many spare hours they have, exactly the inequity this game should not create among students and working learners.

**LB-014** (MUST, C) — Both ranked attempts MUST submit **automatically** on completion. The player MUST NOT choose which attempt to submit; otherwise a player could rehearse a seed unranked and submit only a perfected run.

**LB-015** (MUST, C) — Once ranked attempts are spent, the player MUST be able to replay the same daily seed **without limit**, unranked. Those replays MUST NOT submit, MUST NOT count against anything, and MUST be reachable in one tap from the daily screen.

**LB-016** (MUST, C) — Spending the daily's ranked attempts MUST NOT gate, interrupt or restrict any other part of the game. The app MUST NOT show a lockout modal, a countdown to the next daily, an "out of attempts" barrier, or a "come back tomorrow" message. The screen shown when ranked attempts are spent MUST offer onward play — an unranked replay, a normal run, the Workshop — never a closed door.

**LB-013** (MUST, D) — The Daily Run MUST be fully playable offline. A submission made offline MUST queue locally and retry on next launch (`LB-050`).

### 13.3 Identity

**LB-020** (MUST, D) — Player identity MUST be anonymous: a random UUID generated on device, plus a player-chosen display name of at most 20 characters. No account, no email, no sign-in, no third-party identity provider. This is `flick-dot`'s `lib/player.ts` pattern, reused.

**LB-021** (MUST, C) — Display names MUST be **generated from an authored pool**, not typed. The player MUST be offered a scribe-styled handle assembled from approved in-world word lists, rerollable until they are happy with it, and MUST be able to reroll later. Free-text display names MUST NOT ship in v1.

Rationale: free text is the only genuinely open moderation surface in this game, and Arabic is the hard half of it — dialect variation across Levantine, Gulf and Egyptian, plus **Arabizi** (Arabic written in Latin letters and digits), defeats most Arabic-script filters. Generated handles remove the surface rather than police it, and they fit Madinat al-Qalam.

**LB-024** (MUST, C) — The generated-handle pool MUST live in `data/` under the same schema and validation rules as every other content file (`DATA-002`), and MUST be authored in both Arabic and English.

**LB-022** (MUST, D) — Country MUST be derived server-side from the request IP. The app MUST NOT request a location permission and MUST NOT use GPS for this.

**LB-023** (MUST, D) — The player MUST be able to reset their identity from settings. A reset MUST issue a new UUID and MUST offer to delete the previous identity's entries.

### 13.4 Verification

**LB-030** (MUST, C) — Every submitted score MUST be verified server-side by replaying the submitted seed + command log through the same engine module the client ran, and comparing canonical-JSON state hashes (`TEC-024`). A submission that fails to replay, or whose replayed score differs from the claimed score, MUST be rejected and MUST never appear on a board.

**LB-031** (MUST, D) — The stored score MUST be the score the **server computed**, never the value the client reported. The client-reported score MUST be treated as a claim to check, not data to store.

**LB-032** (MUST, D) — The server MUST import the engine from the same source tree as the app, with no reimplementation. CI MUST assert that the engine module hash in the server bundle equals the one in the app bundle, and MUST fail on drift.

**LB-033** (MUST, D) — Verification MUST be asynchronous: accept the submission, store it as `pending`, queue the replay, then mark it `verified` or `rejected`. A `pending` entry MUST NOT appear on a public board. A full run is roughly 48 commits at up to 50 ms each, so synchronous verification would not survive traffic.

**LB-034** (MUST, D) — The command log MUST be size-capped on submission, and an oversized or malformed payload MUST be rejected before any replay work is scheduled.

**LB-035** (MUST, D) — Submissions MUST be rate-limited per player id and per IP.

**LB-036** (MUST, C) — The engine MUST carry a **scoring-compatibility version**, separate from the app version, bumped only when a change alters scoring output. Changes that do not alter output — new error codes, reworded notes, performance work — MUST NOT bump it. Every entry MUST record the compat version that verified it, and a board MUST never mix scores produced by compat versions that disagree.

**LB-037** (MUST, C) — Each daily board MUST be pinned to the compat version in force when its UTC day opened. A deployment mid-day MUST NOT change that day's scoring, and no entry may ever be re-scored retroactively.

**LB-038** (MUST, C) — The all-time board MUST be scoped to a compat version. When the compat version bumps, the current all-time board MUST be archived read-only as a completed **season** and a new one started. A season MUST NOT be monetised, gated, or tied to any reward that confers scoring power (`BIZ-013`).

### 13.5 Sentence text and moderation

**LB-040** (MUST, D) — Sentence text MUST NOT be transmitted by default. Publishing a sentence to the Best Sentence board MUST be a separate, explicit, per-submission opt-in — the score submits automatically, the text only on an affirmative tap. *(This is the one amendment to `BIZ-010`'s "sentence text never leaves the device"; see `BIZ-013`.)*

**LB-041** (MUST, C) — A published sentence is built only from the authored card pool (`DATA-010`) and the fixed toolbelt tiles (`DATA-040`), so the vocabulary itself is the filter: it is curated at authoring time and the player cannot introduce a word. What MUST additionally be guarded is **combination** — a short authored denylist of phrases, checked server-side before publication — and every published sentence MUST be reportable by any player.

**LB-044** (MUST, C) — The word list MUST be audited for unfortunate combinations as part of content acceptance (`TST-011`), and any phrase found MUST be added to the `LB-041` denylist in `data/`, never patched in code.

**LB-042** (MUST, D) — Reported entries MUST be hideable from an admin view without a deployment, following `flick-dot`'s admin-feedback pattern.

**LB-043** (MUST, D) — A published sentence and a display name are the **only** player-authored content that may leave the device. Save data, the learning profile, the command log's contents beyond verification, and any free-text field MUST NOT be published.

### 13.6 Offline behaviour and failure

**LB-050** (MUST, D) — A failed submission MUST never block play, never surface an error screen, and MUST retry silently on next launch. The queue MUST survive process death.

**LB-051** (MUST, D) — When boards are unreachable, the screen MUST show the last cached standings with a quiet offline note — never an error state and never an empty screen.

**LB-052** (MUST, D) — Missing a day MUST NOT be surfaced as a loss, a broken streak, a lost position or a notification, in keeping with `BIZ-004`. The leaderboard MUST NOT become the streak-shaming mechanic the product rules forbid.

**LB-053** (MUST, D) — Leaderboard features MUST be entirely removable behind one flag, leaving a working offline game, so a backend outage is a degraded feature and never a broken release.

---

## 14. Monetization and privacy (`BIZ`)

**BIZ-001** (MUST, B) — Chapter 1 MUST be free forever and complete — not a trial, not time-limited.

**BIZ-002** (MUST, B) — A single one-time purchase MUST unlock Chapters 2–4 and the extra modes.

**BIZ-003** (MUST, B) — The paid unlock MUST grant content only. It MUST NOT grant scoring power, currency, or difficulty advantage.

**BIZ-004** (MUST, B) — The game MUST contain no ads, no energy system, no loot boxes, and no streak shaming.

**BIZ-014** (MUST, C) — The game MUST NOT limit how long a player may play, by any mechanism: no energy, hearts, lives, stamina, cooldowns, session timers, forced breaks, or daily play quotas. The ranked-attempt cap of `LB-012` is a leaderboard rule and MUST NOT be implemented as, or presented as, a limit on play (`LB-015`, `LB-016`).

**BIZ-015** (MUST, C) — The game MUST NOT give screen-time advice, wellbeing nudges, "you've played enough" prompts, or any message judging how much the player has played. This is the same shaming register `BIZ-004` and `LRN-032` exclude everywhere else. A satisfying end-of-run summary that shows what was practised is the permitted way to offer a natural stopping point — it invites a stop, it never instructs one.

**BIZ-005** (MUST, B) — The game MUST be offline-first: every feature except the purchase itself and leaderboard *viewing and submission* MUST work with no network. Playing the Daily Run offline MUST be fully supported; only seeing other players' standings requires connectivity (`LB-013`, `LB-051`).

**BIZ-006** (MUST, B) — Analytics MUST be opt-in only. No event may be collected before explicit consent.

**BIZ-007** (MUST, D) — With analytics declined, the game MUST behave identically in every other respect, and MUST NOT re-ask more than once per major version.

**BIZ-008** (MUST, D) — No personal data may leave the device. The learning report, the mastery profile and all save data are local-only (`LB-007`). The only outbound player-authored content is a chosen display name and, on explicit per-submission opt-in, a single published sentence (`LB-043`).

**BIZ-009** (MUST, C) — The unlock MUST be a single non-consumable Google Play Billing product, purchased through `expo-iap` (`TEC-046`). The entitlement MUST be cached locally after first validation so the unlock survives indefinitely offline, and a failed network check MUST never revoke a previously granted entitlement.

**BIZ-010** (MUST, C) — If analytics is accepted, the collected event set MUST be limited to: `run_start`, `run_end`, `encounter_result`, `commit` (structure, tone, validity, error code, score bucket), `shop_purchase`, `codex_unlock`, `setting_changed`. No free text, no account, and a resettable random install id only. **Sentence text MUST never be collected as analytics** — the sole route by which a sentence may leave the device is the explicit opt-in of `LB-040`, and it MUST NOT be reused for any other purpose.

**BIZ-011** (MUST, C) — **v1 MUST ship no analytics at all.** No third-party analytics, attribution, crash-reporting or advertising SDK may be bundled, and no event may be collected. The leaderboard already yields score distributions per seed, which is the signal that matters, and analytics is the likeliest thing to slip the release. `BIZ-006` and `BIZ-010` stand as the shape analytics MUST take **if** it ships after v1 — they are not a v1 commitment.

**BIZ-013** (MUST, D) — The leaderboard MUST NOT be monetised in any form: no paid entry, no paid retry, no purchasable extra daily attempt, and no cosmetic tied to rank that confers scoring power. Rank MUST be earnable only by play (`BIZ-003`, `LB-002`).

**BIZ-012** (MUST, D) — The purchase flow MUST be restorable: reinstalling the app and restoring purchases MUST re-grant the unlock without a second charge, and the restore action MUST be reachable from settings, not only on first launch.

---

## 15. Non-functional requirements (`NFR`)

**NFR-001** (MUST, D) — Reference device for all performance targets: a mid-range Android phone, 4 GB RAM, Android 11, 60 Hz display. Targets MUST be met on this device, not on a flagship.

**NFR-002** (MUST, D) — Frame rate MUST hold 60 fps during normal play and MUST NOT drop below 30 fps during the scoring animation. Because the animation and all gestures run on the UI thread (`TEC-035`), a busy JS thread MUST NOT be able to cause a dropped frame in either.

**NFR-003** (MUST, D) — A commit MUST produce its `Analysis` in under 50 ms on the reference device under Hermes, so the animation starts without perceptible lag. The worst case in the golden corpus MUST be the case that is measured.

**NFR-004** (MUST, D) — Cold start to the main menu MUST be under 3 seconds on the reference device. Fonts and the active chapter's `data/` MUST be the only blocking work before first paint; everything else MUST load after.

**NFR-005** (MUST, D) — Installed size MUST stay under 150 MB.

**NFR-009** (MUST, C) — The size budget MUST be allocated: ≤ 60 MB art (one texture atlas per chapter), ≤ 15 MB audio, ≤ 5 MB data and fonts. Text MUST be rendered with a **single variable font family covering both Arabic and Latin**, to avoid mixed-metric bidi defects.

**NFR-013** (MUST, C) — Commissioned art scope for v1 MUST be exactly **16 enemies and 4 district backdrops**. Everything else — cards, tiles, seals, UI chrome, icons — MUST be built from theme tokens and vector primitives (`UI-009`). Art style and pipeline remain open (§18.6); the scope does not.

**NFR-006** (MUST, D) — Memory use MUST stay under 400 MB during an encounter.

**NFR-007** (MUST, D) — The game MUST survive process death and restore per `RUN-004` and `TEC-034`.

**NFR-008** (MUST, D) — Battery: a 30-minute run SHOULD consume no more than a comparable 2D mobile card game; no busy-wait loops, no uncapped idle rendering, no animation left running on an inactive screen.

**NFR-010** (MUST, D) — The JavaScript bundle MUST stay under 4 MB minified for the Android release build, measured in CI. `data/` MUST NOT be bundled wholesale into the JS bundle when chapter splitting (`DATA-007`) applies.

**NFR-011** (MUST, D) — Backend unavailability MUST be invisible to gameplay: no blocking call, no spinner on a gameplay screen, no startup dependency. Every leaderboard request MUST have a short timeout and a cached fallback (`LB-051`).

**NFR-012** (MUST, D) — Verification throughput MUST keep the `pending` queue draining faster than submissions arrive at the expected daily-active count. This MUST be measured before launch, not after.

---

## 16. Test and acceptance (`TST`)

### 16.1 Golden corpus

**TST-001** (MUST, B) — A golden corpus of parsed sentences with expected verdicts MUST be written **before** the game screens exist.

**TST-002** (MUST, B) — The corpus MUST start at ~200 cases and grow with every bug found. A fixed bug without a new corpus case MUST NOT be merged.

**TST-003** (MUST, D) — Every case MUST record: tokens, chapter, expected structure, expected tone, expected validity, expected meaning verdict, expected error code (if any), and expected score.

**TST-004** (MUST, C) — The engine MUST reproduce every corpus case exactly, and any divergence MUST fail CI. *(Draft 2 required two implementations to agree with each other; draft 3 has one implementation checked against the corpus — see `ENG-005`, `ENG-006` and §18.7.)*

**TST-005** (MUST, D) — Every one of the 30 error codes MUST have at least 2 positive cases and 1 near-miss negative case in the corpus.

**TST-006** (MUST, D) — Every one of the 14 structures MUST have at least 5 cases, including one ambiguous case that exercises `ENG-011`.

**TST-007** (MUST, D) — The corpus MUST be stored as data (JSON under `tests/corpus/`), not as hand-written test code, and MUST be executed by a single runner so that adding a case requires no code change.

**TST-008** (MUST, C) — A **property-based fuzzer** MUST ship with the engine from M2: it MUST generate random legal Sentence Lines and assert the engine's invariants — never throws, always returns a verdict, a valid sentence never scores below its Mumble floor, the same input always returns byte-identical output, and the candidate search always terminates within its bound (`ENG-013`). This is what replaces the bug-catching-by-disagreement that draft 2's second implementation would have provided (§18.4).

### 16.2 Content acceptance

**TST-010** (MUST, B) — Every example sentence in the word list MUST parse at its own chapter and pass the meaning check.

**TST-011** (MUST, B) — Each chapter's word list MUST be able to build at least 20 distinct sensible sentences for every structure that chapter unlocks. This MUST be verified by a generator, not by hand.

**TST-012** (MUST, D) — Content validation MUST run in CI on every change to `data/`, and MUST cover both schema validity (`DATA-002`) and engine-parseability (`DATA-005`).

### 16.3 System acceptance

**TST-020** (MUST, B) — The scorer MUST reproduce the three worked examples of `SCR-040` exactly.

**TST-021** (MUST, B) — A run MUST replay from its seed + command log to an identical end state, asserted headlessly in CI by comparing canonical-JSON hashes (`TEC-024`).

**TST-022** (MUST, D) — The headless encounter loop MUST be testable with no React renderer at all, so the loop is covered before any UI exists.

**TST-023** (MUST, D) — Save/load round-trip MUST be asserted: save, reload, and compare state hashes. A save written by every previous `schemaVersion` MUST have a fixture and MUST migrate successfully.

**TST-024** (MUST, D) — CI MUST run an engine benchmark over the corpus and fail if the worst-case analysis exceeds a committed Node-time budget, chosen to leave headroom under `NFR-003` on the reference device. The device-side measurement MUST be taken once per milestone from M4.

### 16.4 Balance acceptance

**TST-030** (MUST, B) — The balance simulator MUST report, per enemy and per Ink Level, the win rate of the greedy bot and the novice bot.

**TST-031** (MUST, C) — Target bands for v1, to be confirmed by the balance pass: the **novice** bot clears Chapter 1 in ~70% of runs; the **greedy** bot clears a full run at base Ink Level in 25–35% of runs; every enemy has a non-zero win rate and none exceeds 95% under the greedy bot. These numbers are placeholders, but falsifiable ones — the simulator can disprove them, which "a meaningful fraction" could not.

### 16.5 Accessibility and localisation acceptance

**TST-040** (MUST, D) — A lint rule MUST assert that every touchable is the shared pressable of `UI-047` — which enforces the 48 dp minimum and a required accessibility label — so the check is structural rather than visual.

**TST-041** (MUST, D) — An automated check MUST assert that no localisation key is missing in either language, that no key is unused, and that no image asset contains baked text.

**TST-042** (SHOULD, D) — Screens MUST be checked at the largest text step in both languages to catch clipping. In v1 this MAY be a scripted manual pass on a device; automating it is a post-v1 goal.

**TST-043** (MUST, D) — The direction handling of `TEC-061` MUST have a dedicated check: an Arabic screen containing an English fragment and an LTR island, verified on a device at M6 and captured as a reference screenshot in the repo.

### 16.6 Leaderboard acceptance

**TST-050** (MUST, D) — A round-trip test MUST assert that a run played in the app, submitted, and replayed by the server produces the identical score and state hash.

**TST-051** (MUST, D) — A **forged submission** test MUST assert rejection of: an inflated claimed score with a valid log, a valid score with a tampered log, a log for a different seed, a log exceeding the size cap, and a fourth attempt for the same date key.

**TST-052** (MUST, D) — An engine-drift test MUST fail CI when the engine module hash differs between the app bundle and the server bundle (`LB-032`).

**TST-053** (MUST, D) — An offline test MUST assert that with the network unavailable the Daily Run is fully playable, the submission queues, the board screen shows cached standings, and nothing surfaces an error (`LB-050`, `LB-051`).

---

## 17. Milestones

Derived from the build order (`TEC-050`). Each milestone ends with its acceptance check green.

| # | Milestone | Ends when |
|---|---|---|
| M0 | Repo scaffold: Expo app, TS strict, layout of `TEC-006`, lint boundaries, lefthook, commitlint, release-please, CI, Android build workflow | A signed APK builds from a tag and CI is green on an empty app |
| M1 | Data model + 40–60 hand-authored Ch1 words | Schemas validate; `TST-012` green |
| M2 | Grammar engine + golden corpus | `TST-004`, `TST-005`, `TST-006`, `TST-024` green |
| M3 | Scorer with trace | `TST-020` green |
| M4 | Headless encounter loop | `TST-021`, `TST-022` green; first device timing check |
| M5 | Shop, items, chapters, run state, save/load | `TST-023` green; a full run completes headless |
| M6 | UI: theme tokens + RTL framework, then encounter screen, then the rest | `TST-040`, `TST-041`, `TST-043` green |
| M7 | Learning layer: mastery, codex, notes, report, workshop | All `LRN` requirements met |
| M8 | Full content (600 words) + balance | `TST-010`, `TST-011`, `TST-030` green |
| M9 | Leaderboard: backend, identity, submission queue, server-side verification | `TST-050`–`TST-053` green; a forged submission is rejected |

M0 is new in draft 3: on this stack the scaffold and the release pipeline are a known, finite piece of work that `flick-dot` has already solved, and doing it first means every later milestone ships to a device.

---

## 18. Decisions made, and what is still open

### 18.1 Resolved on 2026-09-20 (now `C`)

All sixteen gaps raised in draft 1 have been decided and written into the requirements above. Recorded here for traceability:

| Was | Decision | Requirement |
|---|---|---|
| Base W/F per structure | Full S1–S14 table; reproduces all three worked scores | `DATA-034`, `SCR-041` |
| Structure level curve | `+ceil(base_W/4)` W and `+1` F per level, max 5 | `DATA-035` |
| Silence values | Starting ladder, ×3.5 per chapter, simulator-tuned | `ENC-016` |
| Shop prices | Seal 5/7/10 · Scroll 3 · Tablet 8 · pack 4 · erase 3 · reroll 1+1 | `RUN-025` |
| Seal slot count | 4 base, 6 max | `RUN-033` |
| Mastery thresholds | 3 uses → practised, 6 across 2 structures / 2 days → mastered | `LRN-011` |
| Review intervals | 1 / 3 / 7 / 16 / 35 days, 3× shop weight when due | `LRN-015` |
| 16 enemies, 12 slots | 4 per chapter: 2 Wanderer variants, 1 Hushling, 1 Warden | `DATA-069` |
| Interest timing | Shop entry, capped at +5 | `RUN-013` |
| Second Wind cost | Free, once per run | `ENC-025` |
| Seals on a Mumble | Do not apply unless the seal says so | `SCR-031` |
| Single-clause tone | Own tone bonus only; contrast bonus needs 2 clauses | `SCR-012` |
| Clause Force in compounds | Weight only, never Force | `SCR-013`, `SCR-014` |
| Audio scope | 4 ambients, ~12 SFX, step tones, ≤15 MB | `AUD-005` |
| Asset budget | 60 MB art / 15 MB audio / 5 MB data, one bilingual variable font | `NFR-009` |
| Screen reader | TalkBack menus + card labels in v1; full play post-v1 | `UI-046` |
| Analytics schema | 7 events, no free text, resettable install id | `BIZ-010` |

### 18.2 Decided in draft 3 (now `C`)

| Was | Decision | Requirement |
|---|---|---|
| Engine and language | Expo SDK 54 / React Native 0.81 / React 19 / TypeScript strict, expo-router, Hermes, New Architecture — the `flick-dot` stack | `TEC-001`, `TEC-002` |
| Engine implementations | One TypeScript implementation, framework-free, shared by the app, the tools and the tests | `ENG-005`, `ENG-006` |
| Corpus role | The golden corpus is the contract, replacing the two-implementation cross-check | `ENG-006`, `TST-004` |
| Billing | `expo-iap` (OpenIAP), no RevenueCat, entitlement cached locally | `TEC-046`, `BIZ-009` |
| Test runner | Vitest over the framework-free core; no component tests in v1 | `TEC-056` |
| Release pipeline | Conventional commits → release-please → tag → signed APK on the Release + AAB to Play internal | `TEC-054`, `TEC-055` |

### 18.3 Decided in drafts 4, 5 and 6 (now `C`)

| Was | Decision | Requirement |
|---|---|---|
| Leaderboard | In scope. It is the reason the backend is required | §13, `TEC-070` |
| Which boards | Daily Run **and** Daily Best Sentence, both off the same daily seed | `LB-001` |
| Daily Run scope | **Chapter 1 only**, so free players compete on equal terms and the unlock never buys rank | `LB-002`, `BIZ-013` |
| Anti-cheat | Server-side replay of seed + command log through the same engine file | `LB-030`–`LB-032` |
| Backend | Required, not optional: Express + Drizzle + Postgres + Docker + Traefik, per `flick-dot` | §12.9 |
| Play time | **Never limited.** No energy, cooldowns, session timers or play quotas, and no screen-time advice | `BIZ-014`, `BIZ-015` |
| Ranked attempts | 2 per day, auto-submitted — a board rule, not a play limit | `LB-012`, `LB-014` |
| After attempts | Unlimited **unranked** replays of the same seed; no lockout, no countdown, no "come back tomorrow" | `LB-015`, `LB-016` |

**Draft 6** closed every remaining recommendation. The seventeen below were `D` in draft 5 and are binding now:

| Decision | Requirement |
|---|---|
| Ink Levels scale by Silence multiplier alone, ×1.25 per tier, 5 tiers | `RUN-044` |
| Type family is Cairo — one variable family covering Arabic and Latin | `TEC-081` |
| Language change applies at next launch; no self-reload, no new dependency | `TEC-064` |
| v1 ships **no analytics at all** | `BIZ-011` |
| Seals authored in two passes: ≥12 by M5, ≈44 by M8, simulator between them | `DATA-071` |
| Satchels are pedagogical archetypes: Balanced, Verb-heavy, Description-heavy, Question-words | `DATA-070` |
| RTL proven twice — throwaway spike at M0, full check at M6 | `TEC-061` |
| Display names generated from an authored pool; free text never ships | `LB-021`, `LB-024` |
| The closed card vocabulary is the sentence filter; only a phrase denylist is added | `LB-041`, `LB-044` |
| Engine scoring-compat version; daily boards pinned; all-time archived as seasons | `LB-036`–`LB-038` |
| API and verification worker split, worker CPU-capped | `TEC-079` |
| Backend runs on the existing VPS, own compose project and database | `TEC-080` |
| Cards are vector and live text | `UI-009` |
| Commissioned art scope is 16 enemies and 4 backdrops, nothing else | `NFR-013` |
| Balance bands adopted as falsifiable placeholders | `TST-031` |
| Property-based fuzzer ships with the engine from M2 | `TST-008` |
| The 2,000-line `word-rogue-spec.md` is declared dead if it has not surfaced by the start of M1 | §18.5 |

### 18.4 The decisions worth revisiting

These are commitments that will be felt, not number-filling:

1. **Second Wind is free** (`ENC-025`). Generous by design. If playtesting shows runs feel weightless, the first lever is to make it Chapter 1–2 only rather than to charge Ink.
2. **Clauses give Weight but not Force** (`SCR-013`). This is what keeps S7 and S13 from dominating, and it is load-bearing for the 1,092 verification. Changing it invalidates `DATA-034`.
3. **One engine implementation instead of two** (`ENG-005`). The dual GDScript/Python rule existed to catch bugs by disagreement. With one language that safety net is gone, and the corpus is carrying its weight alone — so `TST-002`'s rule (no bug fix without a new case) is now load-bearing rather than good practice. If engine bugs start slipping through to content, the cheapest restoration is a property-based fuzzer that generates random legal lines and asserts invariants, not a second hand-written implementation.

### 18.5 Recommended dispositions — all closed

This section held thirteen recommendations through drafts 4 and 5. All were confirmed on 2026-09-20 and are now requirements; the table in §18.3 lists them with their IDs. Nothing is pending here.

One of them is not a requirement and lives only here: **`docs/word-rogue-spec.md`, the ~2,000-line specification referenced by the concept brief, is declared dead.** It has never been in the repo. If it has not surfaced by the day M1 starts, this document is the sole source of truth and the reference to it MUST be removed from the brief. A phantom document that might supersede the spec is worse than no document, because it makes every number here provisional.

### 18.6 Still genuinely open

Three items, all correctly blocked — none can be closed by argument, only by evidence.

1. **Balance target band numbers.** `TST-031` holds falsifiable placeholders. Only the M4 simulator can confirm or disprove them. Blocked until M4.
2. **The ranked attempt count.** `LB-012` sets 2. Verifiable from the board itself with no analytics: if most players' best score is their second attempt, 2 is right; if attempts 1 and 2 cluster, 1 is enough. Review after the first month of real play.
3. **Art style and pipeline.** Scope is fixed (`NFR-013`), cards are settled (`UI-009`), the font is chosen (`TEC-081`). The visual direction itself needs deciding with someone who draws — it is not a thing to argue into a specification.

### 18.7 Changelog: draft 2 → draft 3

Everything in this table is a stack consequence. No game design, number, or content requirement was changed.

| Requirement | Draft 2 | Draft 3 |
|---|---|---|
| `DATA-001` | "hard-coded in GDScript" | "hard-coded in TypeScript" |
| `DATA-005` | "the reference engine" | the engine core, run under `tsx` (`TEC-023`) |
| `DATA-008` | — | **new**: `data/` types generated from the JSON Schemas |
| `ENG-005` | Two implementations: GDScript + Python | One framework-free TypeScript implementation |
| `ENG-006` | Both implementations must agree on the corpus | The corpus is the contract; divergence fails CI |
| `ENG-007` | Both implementations share `data/` verbatim | The engine holds no private tables |
| `ENG-008`, `ENG-009` | — | **new**: import-boundary and iteration-order rules that JS needs and GDScript did not |
| `SCR-004`, `SCR-053` | — | **new**: exact-rational carry, and a trace that can cross into a worklet |
| `SCR-041`, `SCR-052` | "both engine implementations" | asserted on every CI run; canonical JSON |
| `ENC-009` | — | **new**: game rules live in pure reducers, not React state |
| `RUN-004`, `RUN-051`, `RUN-053` | Generic | Pointed at the Android/AsyncStorage mechanisms in §12.5 |
| `RUN-055` | — | **new**: bound the saved command log |
| `LRN-016` | — | **new**: one explicit clock, resistant to a backwards device clock |
| `UI-007`, `UI-008`, `UI-033`, `UI-047` | — | **new**: UI-thread gestures, route/logic separation, trace-driven animation, one pressable |
| `UI-021`–`UI-024` | Stated as outcomes | Same outcomes, now with named mechanisms in §12.8 |
| **§12 entire** | Godot 4.7, GDScript, Compatibility renderer | Rewritten: Expo/RN/TS stack, project layout, JS-specific determinism, i18n mechanics, CI/CD, optional companion service |
| `TEC-021`, `TEC-022` | Command log; headless replay assertion | `[RETIRED]` — they duplicated `RUN-053`/`RUN-054` and `TST-021` |
| `BIZ-009` | "Play Billing v7 product" | Same product, purchased via `expo-iap` (`TEC-046`) |
| `BIZ-011`, `BIZ-012` | — | **new**: no third-party SDKs; purchase restore |
| `NFR-002`, `NFR-003`, `NFR-004` | Generic targets | Same numbers, tied to Hermes and the UI-thread split |
| `NFR-010` | — | **new**: JS bundle size budget |
| `TST-004` | Both implementations must agree | Engine must reproduce every corpus case |
| `TST-007`, `TST-024`, `TST-043` | — | **new**: corpus as data, CI perf benchmark, RTL check |
| `TST-040` | "automated check for 48 dp" | A structural lint rule, which is actually achievable |
| **§17** | M1–M8 | M0 added: scaffold and release pipeline first |

---

### 18.8 Changelog: draft 3 → draft 4

Draft 4 adds one feature — the leaderboard — and everything below follows from it. No game design, number, or content requirement changed.

| Requirement | Draft 3 | Draft 4 |
|---|---|---|
| **§13 entire** | — | **new**: `LB`, 30 requirements — boards, daily seed, identity, verification, moderation, offline behaviour |
| **§12.9** | Optional companion service, `SHOULD` | Required backend, `MUST`. `TEC-070`–`TEC-078` |
| §1.2 scope | Leaderboard out of scope | In scope; accounts and cloud save still out |
| `TEC-004` | React Query excluded from the app | React Query is the one permitted client-side server-state dependency |
| `TEC-031` | No network permission for gameplay | Network permission declared; gameplay still fully offline |
| `RUN-055` | Truncate the command log at run end | Retain a Daily Run's log until its submission settles — it is the verification payload |
| `BIZ-005` | Everything but the purchase works offline | Same, plus the carve-out for viewing standings |
| `BIZ-008` | No personal data leaves the device | Same, with display name and opt-in published sentence named as the only exceptions |
| `BIZ-010` | Sentence text never leaves the device | Never as *analytics*; `LB-040`'s per-submission opt-in is the sole route |
| `BIZ-013` | — | **new**: the leaderboard may not be monetised in any form |
| `NFR-011`, `NFR-012` | — | **new**: backend outages invisible to gameplay; verification queue must outpace submissions |
| §16.6 `TST-050`–`TST-053` | — | **new**: leaderboard acceptance, including a forged-log rejection test |
| §17 milestones | M0–M8 | M9 added: leaderboard, backend and verification |
| §18.3, §18.5, §18.8 | — | **new**: draft 4 decisions, recommended dispositions, this changelog |

---

### 18.9 Changelog: draft 4 → draft 5

Draft 5 settles the play-time question and folds in the draft-4 flag recommendations. No board, number, or content requirement changed.

| Requirement | Draft 4 | Draft 5 |
|---|---|---|
| `LB-012` | 3 attempts/day, rationale unstated | 2 **ranked** attempts, with the reason written down: board integrity, not time limiting |
| `LB-014`–`LB-016` | — | **new**: attempts auto-submit; unlimited unranked replays of the same seed; no lockout, countdown or "come back tomorrow" |
| `BIZ-014`, `BIZ-015` | — | **new**: play time is never limited by any mechanism; no screen-time advice or wellbeing nudges |
| `LB-021`, `LB-024` | Free-text names behind an Arabic + English filter | Generated handles from an authored pool; free text does not ship |
| `LB-041`, `LB-044` | "Same filter as display names" | The closed card vocabulary *is* the filter; only a phrase denylist plus reporting is added |
| `LB-036` | Entries record engine version | Scoring-compat version distinct from app version |
| `LB-037`, `LB-038` | — | **new**: daily boards pinned to their opening day; all-time boards archived as seasons on a compat bump |
| `TEC-079`, `TEC-080` | Single backend service | API and verification worker split, worker CPU-capped; own compose project and database |
| `UI-009` | — | **new**: cards are vector and live text, forced by `UI-041` and `UI-044` |
| `TST-031` | "a meaningful fraction" | ~70% novice Ch1, 25–35% greedy full run, no enemy above 95% |
| §18.3 | Draft 4 decisions | Plus the four play-time decisions |
| §18.5, §18.6 | 8 recommendations, 6 open | 13 recommendations, 4 open |

---

### 18.10 Changelog: draft 5 → draft 6

Draft 6 closes decisions; it does not add features. Seventeen items moved from recommendation to requirement.

| Requirement | Draft 5 | Draft 6 |
|---|---|---|
| `RUN-044` | — | **new**: Ink Level scaling, ×1.25 Silence per tier, 5 tiers |
| `TEC-081` | — | **new**: Cairo as the type family |
| `DATA-070` | — | **new**: the four Satchels as pedagogical archetypes |
| `DATA-071` | — | **new**: seals authored in two passes with the simulator between |
| `NFR-013` | — | **new**: commissioned art scope is 16 enemies, 4 backdrops |
| `TST-008` | — | **new**: property-based fuzzer from M2, replacing the lost cross-check |
| `TEC-061` | Device check at M6 | M0 spike **and** M6 check; `D` → `C` |
| `TEC-064` | `SHOULD, D`, mechanism undecided | `MUST, C`: next launch, no self-reload |
| `BIZ-011` | `D`, analytics deferred by recommendation | `C`: v1 ships no analytics at all |
| `TEC-080` | `D`, host undecided | `C`: existing VPS, own compose project |
| `TEC-044`, `TEC-079`, `UI-009`, `TST-031`, `LB-021`, `LB-024`, `LB-036`–`LB-038`, `LB-041`, `LB-044` | `D` | `C`, text unchanged |
| §18.3 | Draft 4 and 5 decisions | Plus the seventeen closed in draft 6 |
| §18.5 | 13 recommendations pending | All closed; holds only the dead-spec declaration |
| §18.6 | 4 open | 3 open, each blocked on evidence rather than a decision |

---

*End of SRS v1 draft 6.*
