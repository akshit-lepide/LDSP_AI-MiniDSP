import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { detectSensitiveData } from "../src/lib/detection.ts";

const fixturesDirectory = resolve(
  import.meta.dirname,
  "../../../tests/fixtures/additional",
);
const expectedResults = JSON.parse(
  readFileSync(join(fixturesDirectory, "EXPECTED_RESULTS.json"), "utf8"),
);

test("classifies all supported synthetic acceptance fixtures", () => {
  const supportedFixtures = expectedResults.filter(
    ({ expected_file_risk }) => expected_file_risk !== "Reject",
  );

  for (const fixture of supportedFixtures) {
    const text = readFileSync(join(fixturesDirectory, fixture.file), "utf8");
    assert.equal(
      detectSensitiveData(text).risk,
      fixture.expected_file_risk,
      `${fixture.file} should classify as ${fixture.expected_file_risk}`,
    );
  }
});

test("counts repeated detections and returns masked examples only", () => {
  const result = detectSensitiveData(
    "alex@example.test; alex@example.test; 4111 1111 1111 1111",
  );

  assert.equal(result.risk, "Critical");
  assert.deepEqual(
    result.findings.map(({ type, count }) => ({ type, count })),
    [
      { type: "Email", count: 2 },
      { type: "Payment card", count: 1 },
    ],
  );
  assert.equal(JSON.stringify(result).includes("alex@example.test"), false);
  assert.equal(JSON.stringify(result).includes("4111 1111 1111 1111"), false);
});

test("masks examples for each detected data type", () => {
  const result = detectSensitiveData(
    "alex@example.test 07700 900123 AB123456C 4111 1111 1111 1111",
  );

  assert.deepEqual(
    result.findings.map(({ type, maskedExample }) => ({ type, maskedExample })),
    [
      { type: "Email", maskedExample: "a***@example.test" },
      { type: "UK phone", maskedExample: "07******123" },
      { type: "UK NINO", maskedExample: "AB******C" },
      { type: "Payment card", maskedExample: "************1111" },
    ],
  );
});

test("ignores malformed values and resolves mixed-file risk by precedence", () => {
  assert.deepEqual(detectSensitiveData("alex@@example.test 12345").findings, []);
  assert.equal(
    detectSensitiveData("alex@example.test 07700 900123 AB123456C").risk,
    "High",
  );
  assert.equal(detectSensitiveData("4111 1111 1111 1112").risk, "None");
});