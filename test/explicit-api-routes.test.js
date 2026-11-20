import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const routes = [
  ["../api/health.js", "/api/health", "../src/handler.js"],
  ["../api/v1/providers/status.js", "/api/v1/providers/status", "../../../src/handler.js"],
  ["../api/v1/orchestrate.js", "/api/v1/orchestrate", "../../src/handler.js"]
];

for (const [file, route, handlerImport] of routes) {
  test(`explicit Vercel route ${route} delegates to the shared FM-001 handler`, async () => {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.ok(source.includes(`from "${handlerImport}"`));
    assert.match(source, /export default async function handler/);
    assert.ok(source.includes(`request.url = "${route}" + url.search;`));
    assert.match(source, /return handleRequest\(request, response\)/);
  });
}
