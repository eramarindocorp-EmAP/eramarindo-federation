import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("federation registry contains nine identities across five providers", async () => {
  const registry = JSON.parse(await readFile(new URL("../config/ai-identities.json", import.meta.url), "utf8"));
  const identities = registry.providers.flatMap((provider) => provider.identities);
  assert.equal(registry.providers.length, 5);
  assert.equal(identities.length, 9);
  assert.equal(new Set(identities.map((identity) => identity.id)).size, 9);
  assert.equal(registry.authority.coordinator, "Ferguson Albrecht Sinclair");
  assert.equal(registry.policy.provider_calls_enabled_by_default, false);
  assert.ok(registry.policy.human_approval_required_for.includes("financial_actions"));
});
