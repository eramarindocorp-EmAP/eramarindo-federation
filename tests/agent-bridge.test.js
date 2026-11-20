import test from "node:test";
import assert from "node:assert/strict";
import { handleAgentBridge } from "../src/agent-bridge.js";

function makeResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = headers;
    },
    end(body = "") {
      this.body = body;
    }
  };
}

test("agent status exposes configuration booleans but not credentials", async () => {
  const response = makeResponse();
  const env = {
    OPENAI_API_KEY_FERGUSON: "secret-ferguson",
    OPENAI_MODEL_FERGUSON: "model-a",
    FERGUSON_BRIDGE_TOKEN: "a".repeat(40),
    OPENAI_API_KEY_GEBRIEL: "secret-gebriel",
    OPENAI_MODEL_GEBRIEL: "model-b",
    GEBRIEL_BRIDGE_TOKEN: "b".repeat(40)
  };
  const handled = await handleAgentBridge({
    request: { method: "GET", headers: {} },
    response, pathname: "/v1/agents/status", requestId: "test-1", env
  });
  const payload = JSON.parse(response.body);
  assert.equal(handled, true);
  assert.equal(response.statusCode, 200);
  assert.equal(payload.agents.ferguson.configured, true);
  assert.equal(payload.agents.gebriel_nathza.configured, true);
  assert.equal(response.body.includes("secret-ferguson"), false);
  assert.equal(response.body.includes("secret-gebriel"), false);
});

test("Gebriel profile returns its configured application identity", async () => {
  const response = makeResponse();
  const handled = await handleAgentBridge({
    request: { method: "GET", headers: {} },
    response, pathname: "/v1/gebriel/profile", requestId: "test-2",
    env: {
      OPENAI_API_KEY_GEBRIEL: "key",
      OPENAI_MODEL_GEBRIEL: "model",
      GEBRIEL_BRIDGE_TOKEN: "b".repeat(40)
    }
  });
  const payload = JSON.parse(response.body);
  assert.equal(handled, true);
  assert.equal(response.statusCode, 200);
  assert.equal(payload.agent_id, "gebriel-nathza");
  assert.equal(payload.configured, true);
});

test("message relay rejects a missing sender token", async () => {
  const response = makeResponse();
  const handled = await handleAgentBridge({
    request: {
      method: "POST",
      headers: {},
      body: { from: "ferguson", to: "gebriel_nathza", instruction: "Review this plan." }
    },
    response, pathname: "/v1/agents/message", requestId: "test-3",
    env: { FERGUSON_BRIDGE_TOKEN: "a".repeat(40) }
  });
  const payload = JSON.parse(response.body);
  assert.equal(handled, true);
  assert.equal(response.statusCode, 401);
  assert.equal(payload.error.code, "agent_unauthorized");
});

test("message relay rejects same-agent and invalid routes", async () => {
  const response = makeResponse();
  const handled = await handleAgentBridge({
    request: {
      method: "POST",
      headers: { "x-agent-token": "a".repeat(40) },
      body: { from: "ferguson", to: "ferguson", instruction: "Call yourself." }
    },
    response, pathname: "/v1/agents/message", requestId: "test-4",
    env: { FERGUSON_BRIDGE_TOKEN: "a".repeat(40) }
  });
  const payload = JSON.parse(response.body);
  assert.equal(handled, true);
  assert.equal(response.statusCode, 400);
  assert.equal(payload.error.code, "invalid_payload");
});
