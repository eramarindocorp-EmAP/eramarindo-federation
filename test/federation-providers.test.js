import test from "node:test";
import assert from "node:assert/strict";
import { callProvider } from "../src/providers.js";
import { parseEnabledProviders } from "../src/security.js";
import { orchestrate } from "../src/orchestrator.js";

const message = [{ role: "user", content: "Return a short test response." }];
const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body)
});

test("Perplexity adapter uses server-side bearer credentials and compatible chat payload", async () => {
  const previous = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return jsonResponse({ model: "sonar-test", choices: [{ message: { role: "assistant", content: "verified search answer" } }], usage: { total_tokens: 8 } });
  };
  try {
    const result = await callProvider({
      provider: "perplexity",
      messages: message,
      system: "Be accurate.",
      env: { PERPLEXITY_API_KEY: "test-secret", PERPLEXITY_MODEL: "sonar-test" }
    });
    assert.equal(request.url, "https://api.perplexity.ai/chat/completions");
    assert.equal(request.options.headers.authorization, "Bearer test-secret");
    assert.equal(JSON.parse(request.options.body).messages[0].role, "system");
    assert.equal(result.message.content, "verified search answer");
    assert.equal(result.provider, "perplexity");
  } finally {
    globalThis.fetch = previous;
  }
});

test("Anthropic adapter maps messages API response and keeps key in server header", async () => {
  const previous = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return jsonResponse({ model: "claude-test", content: [{ type: "text", text: "analysis complete" }], usage: { input_tokens: 4, output_tokens: 5 } });
  };
  try {
    const result = await callProvider({
      provider: "anthropic",
      messages: message,
      system: "You are a reviewer.",
      env: { ANTHROPIC_API_KEY: "test-secret", ANTHROPIC_MODEL: "claude-test" }
    });
    assert.equal(request.url, "https://api.anthropic.com/v1/messages");
    assert.equal(request.options.headers["x-api-key"], "test-secret");
    assert.equal(request.options.headers["anthropic-version"], "2023-06-01");
    assert.equal(JSON.parse(request.options.body).system, "You are a reviewer.");
    assert.equal(result.message.content, "analysis complete");
    assert.equal(result.provider, "anthropic");
  } finally {
    globalThis.fetch = previous;
  }
});

test("provider allowlist accepts five providers and remains opt-in", () => {
  assert.deepEqual([...parseEnabledProviders("openai,deepseek,gemini,perplexity,anthropic,unknown")],
    ["openai", "deepseek", "gemini", "perplexity", "anthropic"]);
  assert.equal(parseEnabledProviders("").size, 0);
});

test("orchestrator supports a five-provider parallel plan", async () => {
  const providers = ["openai", "deepseek", "gemini", "perplexity", "anthropic"];
  const result = await orchestrate({
    plan: { mode: "parallel", providers },
    messages: message,
    enabledProviders: new Set(providers),
    call: async ({ provider }) => ({ model: "mock", message: { role: "assistant", content: provider } })
  });
  assert.equal(result.status, "completed");
  assert.equal(result.results.length, 5);
});
