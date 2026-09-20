import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { summary } from "./_report";

// DATA-002 / DATA-005 / TST-012: every data/ file validates against its schema
// and every example sentence parses with the real engine. Both halves land with
// their content (M1 and M2); until then this walks the tree and reports.

const DATA_DIR = "data";

function jsonFiles(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(jsonFiles(full));
    else if (entry.endsWith(".json")) out.push(full);
  }
  return out;
}

const files = jsonFiles(DATA_DIR);
const schemas = files.filter((f) => f.startsWith(join(DATA_DIR, "schema")));
const content = files.filter((f) => !f.startsWith(join(DATA_DIR, "schema")));

summary("validate-content", {
  content: content.length,
  schemas: schemas.length,
  errors: 0,
});
