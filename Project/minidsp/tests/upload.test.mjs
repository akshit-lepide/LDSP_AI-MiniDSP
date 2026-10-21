import assert from "node:assert/strict";
import test from "node:test";
import { processUpload } from "../src/lib/process-upload.ts";
import { MAX_UPLOAD_BYTES, validateUpload } from "../src/lib/upload-validation.ts";

test("accepts valid UTF-8 CSV and TXT uploads up to the 1 MiB limit", async () => {
  const small = await validateUpload(new File(["café"], "notes.TXT"));
  assert.equal(small.ok, true);
  if (small.ok) assert.equal(small.text, "café");

  const atLimit = await validateUpload(new File(["a".repeat(MAX_UPLOAD_BYTES)], "data.csv"));
  assert.equal(atLimit.ok, true);
});

test("rejects empty, unsupported, and oversized uploads", async () => {
  const empty = await validateUpload(new File([], "empty.txt"));
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.status, 400);

  const unsupported = await validateUpload(new File(["text"], "records.json"));
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) assert.equal(unsupported.status, 415);

  const oversized = await validateUpload(
    new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "large.txt"),
  );
  assert.equal(oversized.ok, false);
  if (!oversized.ok) assert.equal(oversized.status, 413);
});

test("rejects invalid UTF-8 and binary control bytes", async () => {
  const invalidUtf8 = await validateUpload(
    new File([new Uint8Array([0xc3, 0x28])], "invalid.txt"),
  );
  assert.equal(invalidUtf8.ok, false);

  const binary = await validateUpload(
    new File([new Uint8Array([0x61, 0x00, 0x62])], "binary.csv"),
  );
  assert.equal(binary.ok, false);
});

test("processing returns masked scan data without raw file content", async () => {
  const result = await processUpload(new File(["alex@example.test"], "contacts.csv"));

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.risk, "Low");
    assert.equal(result.findings[0].maskedExample, "a***@example.test");
    assert.equal(JSON.stringify(result).includes("alex@example.test"), false);
  }
});