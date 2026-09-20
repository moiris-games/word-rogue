/**
 * Bidirectional text helpers (TEC-062).
 *
 * An English fragment dropped into an Arabic sentence will reorder the Arabic
 * around it unless it is isolated. These are the only sanctioned way to build
 * such a string; raw interpolation fails lint.
 */

/** U+2066 LEFT-TO-RIGHT ISOLATE */
const LRI = "⁦";
/** U+2067 RIGHT-TO-LEFT ISOLATE */
const RLI = "⁧";
/** U+2069 POP DIRECTIONAL ISOLATE */
const PDI = "⁩";

/** Wraps an English (or other LTR) fragment so it cannot disturb its host. */
export function ltr(fragment: string): string {
  return `${LRI}${fragment}${PDI}`;
}

/** Wraps an Arabic (or other RTL) fragment embedded in LTR text. */
export function rtl(fragment: string): string {
  return `${RLI}${fragment}${PDI}`;
}

/** True when the string already carries balanced isolates. */
export function isIsolated(value: string): boolean {
  let depth = 0;
  for (const ch of value) {
    if (ch === LRI || ch === RLI) depth += 1;
    else if (ch === PDI) depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}
