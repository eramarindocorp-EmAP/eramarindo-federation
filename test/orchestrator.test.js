import test from "node:test";
import assert from "node:assert/strict";
import { orchestrate } from "../src/orchestrator.js";

const enabledProviders = new Set(["openai", "deepseek", "gemini"]);
const messages = [{ role: "user", content: "test" }];
const answer = (content) => ({ model: "test-model", message: { role: "assistant", content } });

test("single mode calls only the selected provider", async () => {
  const calls = [];
  const result = await orchestrate({
    plan: { mode: "single", provider: "openai" }, messages, enabledProviders,
    call: async ({ provider }) => { calls.push(provider); return answer("one"); }
  });
  assert.deepEqual(calls, ["openai"]);
  assert.equal(result.selected, "openai");
});

test("parallel mode invokes providers concurrently and returns all outcomes", async () => {
  const result = await orchestrate({
    plan: { mode: "parallel", providers: ["openai", "gemini"] }, messages, enabledProviders,
    call: async ({ provider }) => answer(provider)
  });
  assert.equal(result.status, "completed");
  assert.equal(result.results.length, 2);
});

test("consensus requires a strict majority of selected providers", async () => {
  const result = await orchestrate({
    plan: { mode: "consensus", providers: ["openai", "deepseek", "gemini"] }, messages, enabledProviders,
    call: async ({ provider }) => answer(provider === "gemini" ? "different" : "Same answer")
  });
  assert.equal(result.status, "consensus");
  assert.equal(result.agreementCount, 2);
});

test("consensus reports no consensus when there is no majority", async () => {
  const result = await orchestrate({
    plan: { mode: "consensus", providers: ["openai", "deepseek"] }, messages, enabledProviders,
    call: async ({ provider }) => answer(provider)
  });
  assert.equal(result.status, "no_consensus");
  assert.equal(result.consensus, null);
});

test("fallback stops after first successful non-empty response", async () => {
  const calls = [];
  const result = await orchestrate({
    plan: { mode: "fallback", providers: ["openai", "deepseek", "gemini"] }, messages, enabledProviders,
    call: async ({ provider }) => {
      calls.push(provider);
      if (provider === "openai") throw new Error("unavailable");
      return answer("recovered");
    }
  });
  assert.deepEqual(calls, ["openai", "deepseek"]);
  assert.equal(result.selected, "deepseek");
});

test("rejects disabled providers and invalid plans", async () => {
  await assert.rejects(() => orchestrate({
    plan: { mode: "single", provider: "gemini" }, messages,
    enabledProviders: new Set(), call: async () => answer("x")
  }), /provider disabled/);
  await assert.rejects(() => orchestrate({
    plan: { mode: "consensus", providers: ["openai"] }, messages, enabledProviders,
    call: async () => answer("x")
  }), /requires at least two providers/);
});
