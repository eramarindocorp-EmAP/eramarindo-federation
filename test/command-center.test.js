import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("Command Center page includes the expected federation controls", async () => {
  const html = await readFile(new URL("../web/index.html", import.meta.url), "utf8");
  assert.match(html, /Eramarindo AI Command Center/);
  assert.match(html, /\/v1\/providers\/status/);
  assert.match(html, /\/v1\/orchestrate/);
  assert.match(html, /OpenAI/);
  assert.match(html, /DeepSeek/);
  assert.match(html, /Gemini/);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 2, "expected the dashboard and recovery scripts");
  for (const [, source] of scripts) {
    assert.doesNotThrow(() => new vm.Script(source), "dashboard and recovery JavaScript must parse");
  }
});
