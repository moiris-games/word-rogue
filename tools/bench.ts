import { performance } from "node:perf_hooks";
import { createStream, nextUint32 } from "../lib/rng/xoshiro";
import { summary } from "./_report";

// TST-024: CI fails if the worst corpus case exceeds its Node-time budget,
// chosen to leave headroom under NFR-003's 50 ms on the reference device.
// Until the engine exists (M2), this benchmarks the one hot path that does:
// the RNG, which every shuffle and shop roll goes through.

const DRAWS = 1_000_000;
const stream = createStream(20260920);

const start = performance.now();
let sink = 0;
for (let i = 0; i < DRAWS; i++) sink = (sink ^ nextUint32(stream)) >>> 0;
const elapsed = performance.now() - start;

summary("bench", {
  target: "rng",
  draws: DRAWS,
  ms: elapsed.toFixed(1),
  nsPerDraw: ((elapsed * 1e6) / DRAWS).toFixed(1),
  checksum: sink,
});
