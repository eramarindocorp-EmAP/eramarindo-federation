import test from "node:test";
import assert from "node:assert/strict";
import { constantTimeEqual, createRateLimiter, isAuthorized, parseEnabledProviders } from "../src/security.js";

test("constantTimeEqual rejects mismatched values", () => {
  assert.equal(constantTimeEqual("secret", "secret"), true);
  assert.equal(constantTimeEqual("secret", "other"), false);
  assert.equal(constantTimeEqual("short", "longer"), false);
});

test("authorization requires a configured long bearer token", () => {
  const request = { headers: { authorization: `Bearer ${"x".repeat(40)}` } };
  assert.equal(isAuthorized(request, "x".repeat(40)), true);
  assert.equal(isAuthorized(request, "short"), false);
  assert.equal(isAuthorized({ headers: {} }, "x".repeat(40)), false);
});

test("provider allowlist ignores unknown provider names", () => {
  assert.deepEqual([...parseEnabledProviders("openai,deepseek,unknown,gemini")].sort(), ["deepseek", "gemini", "openai"]);
});

test("rate limiter blocks requests after the configured threshold", () => {
  const allow = createRateLimiter(2, 1000);
  assert.equal(allow("client", 100), true);
  assert.equal(allow("client", 101), true);
  assert.equal(allow("client", 102), false);
  assert.equal(allow("other", 102), true);
  assert.equal(allow("client", 1200), true);
});
