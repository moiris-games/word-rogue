/**
 * xoshiro128** — the only source of randomness in the game (TEC-010).
 *
 * Everything here is unsigned 32-bit integer arithmetic (TEC-014): rotations
 * written out longhand, multiplication via Math.imul, every result forced back
 * through `>>> 0`. No intermediate value may become a float, because a float
 * would make a run unreplayable on a different device.
 *
 * The state is four named fields rather than a Uint32Array on purpose: with
 * `noUncheckedIndexedAccess` every indexed read would need a non-null
 * assertion, and assertions are banned in the engine core (TEC-003). Named
 * fields are also marginally faster in the hot path.
 */

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

export interface StreamState {
  s0: number;
  s1: number;
  s2: number;
  s3: number;
}

/** SplitMix32 finalizer — mixes one counter value into a well-spread word. */
function splitmix32(z: number): number {
  let t = z >>> 0;
  t = Math.imul(t ^ (t >>> 16), 0x21f0aaad) >>> 0;
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97) >>> 0;
  return (t ^ (t >>> 15)) >>> 0;
}

/** Creates a stream from a 32-bit seed, warmed so early draws are not correlated. */
export function createStream(seed: number): StreamState {
  let z = seed >>> 0;
  const words: number[] = [];
  for (let i = 0; i < 4; i++) {
    z = (z + 0x9e3779b9) >>> 0;
    words.push(splitmix32(z));
  }
  const [a = 1, b = 0, c = 0, d = 0] = words;
  const state: StreamState = { s0: a, s1: b, s2: c, s3: d };
  // All-zero state is a fixed point of the generator; it must never happen.
  if ((state.s0 | state.s1 | state.s2 | state.s3) === 0) state.s0 = 1;
  for (let i = 0; i < 16; i++) nextUint32(state);
  return state;
}

/** Advances the stream and returns the next unsigned 32-bit word. */
export function nextUint32(state: StreamState): number {
  const { s0, s1, s2, s3 } = state;

  const result = Math.imul(rotl(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0;
  const t = (s1 << 9) >>> 0;

  const n2 = (s2 ^ s0) >>> 0;
  const n3 = (s3 ^ s1) >>> 0;
  state.s1 = (s1 ^ n2) >>> 0;
  state.s0 = (s0 ^ n3) >>> 0;
  state.s2 = (n2 ^ t) >>> 0;
  state.s3 = rotl(n3, 11);

  return result;
}

/**
 * A uniform integer in [0, bound). Rejection sampling, never `% bound`
 * (TEC-015) — modulo biases the low values, which across a 12-fight run is
 * visible in which cards get drawn.
 */
export function nextBelow(state: StreamState, bound: number): number {
  if (!Number.isSafeInteger(bound) || bound <= 0) {
    throw new RangeError(`bound must be a positive integer, got ${bound}`);
  }
  const limit = Math.floor(0x100000000 / bound) * bound;
  let draw = nextUint32(state);
  while (draw >= limit) draw = nextUint32(state);
  return draw % bound;
}

/** Fisher-Yates, driven by the stream. Returns a new array; inputs are never mutated (ENG-009). */
export function shuffled<T>(state: StreamState, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = nextBelow(state, i + 1);
    const atI = out[i];
    const atJ = out[j];
    if (atI === undefined || atJ === undefined) {
      // Unreachable: both indices are within [0, length). Kept as a real
      // guard rather than an assertion so the engine core stays free of `!`.
      throw new RangeError(`shuffle index out of range: ${i}, ${j}`);
    }
    out[i] = atJ;
    out[j] = atI;
  }
  return out;
}

/** Snapshot for the save file — plain safe integers only (TEC-020). */
export function snapshot(state: StreamState): number[] {
  return [state.s0, state.s1, state.s2, state.s3];
}

export function restore(words: readonly number[]): StreamState {
  const [s0, s1, s2, s3] = words;
  if (
    words.length !== 4 ||
    s0 === undefined ||
    s1 === undefined ||
    s2 === undefined ||
    s3 === undefined
  ) {
    throw new RangeError(`expected 4 state words, got ${words.length}`);
  }
  return { s0, s1, s2, s3 };
}
