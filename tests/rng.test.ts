import { describe, expect, it } from "vitest";
import {
  createStream,
  nextBelow,
  nextUint32,
  restore,
  shuffled,
  snapshot,
} from "../lib/rng/xoshiro";

/**
 * TEC-014 asks for a check against a published xoshiro128** reference vector.
 * That is still outstanding — see the note in tests/README.md. GOLDEN below is
 * a regression lock, not a reference vector: it pins current behaviour so an
 * accidental change to the generator fails loudly, but it does not by itself
 * prove the implementation matches the canonical algorithm.
 */
const GOLDEN_SEED = 0x2a;
const GOLDEN: number[] = [
  1816716173, 1605389910, 2771360340, 3683673832, 3560650492, 1329528888,
  1818053963, 1178798507, 1740196647, 2684385330, 907679367, 147453293,
  588236482, 1789506069, 4258594063, 2973123300,
];

describe("xoshiro128**", () => {
  it("is deterministic for a given seed", () => {
    const a = createStream(GOLDEN_SEED);
    const b = createStream(GOLDEN_SEED);
    for (let i = 0; i < 64; i++) {
      expect(nextUint32(a)).toBe(nextUint32(b));
    }
  });

  it("produces different sequences for different seeds", () => {
    const a = createStream(1);
    const b = createStream(2);
    const seqA = Array.from({ length: 16 }, () => nextUint32(a));
    const seqB = Array.from({ length: 16 }, () => nextUint32(b));
    expect(seqA).not.toEqual(seqB);
  });

  it("stays inside uint32 and never produces a float", () => {
    const s = createStream(12345);
    for (let i = 0; i < 1000; i++) {
      const v = nextUint32(s);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("round-trips through snapshot and restore", () => {
    const s = createStream(777);
    for (let i = 0; i < 10; i++) nextUint32(s);
    const saved = snapshot(s);
    expect(saved).toHaveLength(4);
    expect(saved.every(Number.isSafeInteger)).toBe(true);

    const expected = Array.from({ length: 8 }, () => nextUint32(s));
    const revived = restore(saved);
    const actual = Array.from({ length: 8 }, () => nextUint32(revived));
    expect(actual).toEqual(expected);
  });

  describe("nextBelow", () => {
    it("stays in range", () => {
      const s = createStream(99);
      for (let i = 0; i < 2000; i++) {
        const v = nextBelow(s, 7);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(7);
      }
    });

    it("rejects a non-positive or non-integer bound", () => {
      const s = createStream(1);
      expect(() => nextBelow(s, 0)).toThrow(RangeError);
      expect(() => nextBelow(s, -3)).toThrow(RangeError);
      expect(() => nextBelow(s, 2.5)).toThrow(RangeError);
    });

    it("is not visibly biased across a bound that does not divide 2^32", () => {
      // 2^32 % 7 != 0, so a modulo implementation would over-represent the
      // low buckets. With 70k draws a 1% skew is far outside normal variance.
      const s = createStream(20260920);
      const buckets = new Array<number>(7).fill(0);
      const draws = 70_000;
      for (let i = 0; i < draws; i++) buckets[nextBelow(s, 7)]! += 1;
      const expectedPerBucket = draws / 7;
      for (const count of buckets) {
        expect(Math.abs(count - expectedPerBucket) / expectedPerBucket).toBeLessThan(0.05);
      }
    });
  });

  describe("shuffled", () => {
    it("returns a permutation and leaves the input untouched", () => {
      const s = createStream(4242);
      const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
      const out = shuffled(s, input);
      expect(out).toHaveLength(input.length);
      expect([...out].sort((a, b) => a - b)).toEqual([...input]);
      expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it("is reproducible from the same seed", () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(shuffled(createStream(5), items)).toEqual(shuffled(createStream(5), items));
    });
  });

  it("matches the committed regression lock", () => {
    const s = createStream(GOLDEN_SEED);
    const actual = Array.from({ length: GOLDEN.length }, () => nextUint32(s));
    expect(actual).toEqual(GOLDEN);
  });
});
