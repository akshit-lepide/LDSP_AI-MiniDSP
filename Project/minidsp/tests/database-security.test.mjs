import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const migrationPath = resolve(
  import.meta.dirname,
  "../supabase/migrations/20261021010000_enforce_masked_findings.sql",
);
const migration = readFileSync(migrationPath, "utf8");

test("authenticated users cannot bypass the atomic RPC with direct inserts", () => {
  assert.match(migration, /revoke\s+insert\s+on\s+public\.scans\s*,\s*public\.findings\s+from\s+authenticated/i);
  assert.match(migration, /security\s+definer/i);
  assert.match(migration, /set\s+search_path\s*=\s*''/i);
  assert.match(migration, /grant\s+execute\s+on\s+function\s+public\.create_scan_with_findings[\s\S]+to\s+authenticated/i);
});

test("atomic RPC validates each detector's masked example and risk", () => {
  for (const expectedPattern of [
    /item\.finding_type\s*=\s*'Email'[\s\S]+item\.risk\s*<>\s*'Low'[\s\S]+item\.masked_example\s*!~/,
    /item\.finding_type\s*=\s*'UK phone'[\s\S]+item\.risk\s*<>\s*'Medium'[\s\S]+item\.masked_example\s*!~/,
    /item\.finding_type\s*=\s*'UK NINO'[\s\S]+item\.risk\s*<>\s*'High'[\s\S]+item\.masked_example\s*!~/,
    /item\.finding_type\s*=\s*'Payment card'[\s\S]+item\.risk\s*<>\s*'Critical'[\s\S]+item\.masked_example\s*!~/,
  ]) {
    assert.match(migration, expectedPattern);
  }
  assert.match(migration, /if\s+auth\.uid\(\)\s+is\s+null/i);
  assert.match(migration, /jsonb_typeof\(p_findings\)\s+is\s+distinct\s+from\s+'array'/i);
});