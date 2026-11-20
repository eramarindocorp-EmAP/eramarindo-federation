import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("Vercel catch-all function delegates to the shared FM-001 handler", async () => {
  const source = await readFile(new URL("../api/[...path].js", import.meta.url), "utf8");
  assert.match(source, /import \{ handleRequest \} from "\.\.\/src\/handler\.js"/);
  assert.match(source, /return handleRequest\(request, response\)/);
  assert.match(source, /export default async function handler/);
});

test("Vercel static Command Center uses the /api gateway prefix", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /location\.origin\+"\/api"/);
  assert.match(html, /\/v1\/orchestrate/);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0][1]));
});


test("Vercel rewrites root to the function without double-prefixing API paths", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.deepEqual(config.rewrites, [{ source: "/", destination: "/api/app" }]);
});
