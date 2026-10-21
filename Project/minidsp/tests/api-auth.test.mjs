import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../src/app/api/scan/route.ts";
import { GET } from "../src/app/api/scans/route.ts";

test("scan API rejects a request without a bearer token", async () => {
  const response = await POST(new Request("http://localhost/api/scan", { method: "POST" }));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Sign in to continue." });
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("scan history API rejects a request without a bearer token", async () => {
  const response = await GET(new Request("http://localhost/api/scans"));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Sign in to continue." });
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});