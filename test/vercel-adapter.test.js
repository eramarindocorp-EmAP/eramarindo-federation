import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("Vercel catch-all function delegates to the shared FM-001 handler", async () => {
  const source = await readFile(new URL("../api/[...path].js", import.meta.url), "utf8");
  assert.match(source, /import \{ handleRequest \} from "\.\.\/src\/server\.js"/);
  assert.match(source, /return handleRequest\(request, response\)/);
  assert.doesNotThrow(() => new vm.SourceTextModule(source));
});

test("Vercel static Command Center uses the /api gateway prefix", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /location\.origin\+"\/api"/);
  assert.match(html, /\/v1\/orchestrate/);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0][1]));
});
