const formulaTriggers = /^[\s]*[=+\-@\t\r]/;

export function escapeCsvField(value: string): string {
  const neutralized = formulaTriggers.test(value) ? `'${value}` : value;
  return `"${neutralized.replaceAll('"', '""')}"`;
}

export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
}
