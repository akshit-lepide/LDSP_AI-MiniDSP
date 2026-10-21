import assert from "node:assert/strict";
import test from "node:test";
import { escapeCsvField, toCsv } from "../src/lib/csv.ts";

test("quotes fields and escapes embedded quotes, commas and newlines", () => {
  assert.equal(escapeCsvField("Email"), '"Email"');
  assert.equal(escapeCsvField('say "hi", now'), '"say ""hi"", now"');
  assert.equal(escapeCsvField("line1\nline2"), '"line1\nline2"');
});

test("neutralises spreadsheet formula triggers in untrusted text", () => {
  for (const dangerous of ["=cmd()", "+1+1", "-2+3", "@SUM(A1)", "\t=1", "\r=1", "  =1"]) {
    assert.equal(escapeCsvField(dangerous).startsWith(`"'`), true, `${JSON.stringify(dangerous)} must be prefixed`);
  }
  assert.equal(escapeCsvField("sample-mixed.txt"), '"sample-mixed.txt"');
});

test("builds CRLF-delimited rows for the findings export", () => {
  const csv = toCsv([
    ["File name", "Finding type", "Masked example"],
    ["=injection.csv", "Email", "a***@example.test"],
  ]);

  assert.equal(csv, '"File name","Finding type","Masked example"\r\n"\'=injection.csv","Email","a***@example.test"');
});
