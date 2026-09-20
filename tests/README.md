# Tests

Vitest, Node environment, framework-free core only (TEC-056).

## Outstanding

- **TEC-014 reference vector.** `tests/rng.test.ts` currently locks behaviour
  against a regression golden, not against the published xoshiro128\*\* output.
  Before M2 closes, generate the canonical vector from the reference C
  implementation and assert against that instead — the difference matters: a
  regression lock proves we did not change, a reference vector proves we are
  right.
- **Golden corpus** (`tests/corpus/`) lands at M2, written before the engine
  (TST-001).
