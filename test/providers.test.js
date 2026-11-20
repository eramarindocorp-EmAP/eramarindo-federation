import test from "node:test";
import assert from "node:assert/strict";
import { providerError } from "../src/providers.js";

test("identifies exhausted API quota without exposing upstream payload", () => {
  const error = providerError("openai", 429, {
    error: {
      message: "Private provider response details",
      type: "insufficient_quota",
      code: "insufficient_quota"
    }
  });
  assert.match(error.message, /quota or credits are exhausted/i);
  assert.match(error.message, /\[insufficient_quota\]/);
  assert.doesNotMatch(error.message, /Private provider response details/);
  assert.equal(error.providerCode, "insufficient_quota");
});

test("identifies provider rate limits separately from quota exhaustion", () => {
  const error = providerError("openai", 429, {
    error: { type: "rate_limit_exceeded", code: "rate_limit_exceeded" }
  });
  assert.match(error.message, /request or token rate limit/i);
  assert.equal(error.providerCode, "rate_limit_exceeded");
});

test("uses safe generic diagnostics for unknown 429 responses", () => {
  const error = providerError("openai", 429, {});
  assert.match(error.message, /HTTP 429/i);
  assert.match(error.message, /billing\/quota/i);
});
