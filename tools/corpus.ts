import { readdirSync } from "node:fs";
import { summary } from "./_report";

// ENG-006 / TST-004: the golden corpus is the engine's contract. The runner
// executes it as data (TST-007), so adding a case never touches code.
// Cases arrive with the engine at M2.

const CORPUS_DIR = "tests/corpus";
const cases = readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".json"));

summary("corpus", { files: cases.length, cases: 0, failures: 0 });
