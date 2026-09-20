/** One machine-readable summary line per tool, per TEC-057. */
export function summary(tool: string, fields: Record<string, string | number>): void {
  const body = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`SUMMARY ${tool} ${body}`);
}

export function fail(tool: string, message: string): never {
  console.error(`ERROR ${tool}: ${message}`);
  process.exit(1);
}
