import assert from "node:assert/strict";
import test from "node:test";
import { getRecoveryCallbackUrl } from "../src/lib/auth-urls.ts";

test("recovery callback stays on the current local app port", () => {
  const callback = new URL(getRecoveryCallbackUrl("http://localhost:3001"));

  assert.equal(callback.origin, "http://localhost:3001");
  assert.equal(callback.pathname, "/auth/callback");
  assert.equal(callback.searchParams.get("next"), "/reset-password");
});

test("recovery callback preserves the current HTTPS production origin", () => {
  const callback = new URL(getRecoveryCallbackUrl("https://minidsp.example.com"));

  assert.equal(callback.origin, "https://minidsp.example.com");
  assert.equal(callback.pathname, "/auth/callback");
});