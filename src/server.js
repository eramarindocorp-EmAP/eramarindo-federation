import http from "node:http";
import { randomUUID } from "node:crypto";
import { callProvider } from "./providers.js";
import { createRateLimiter, isAuthorized, parseEnabledProviders } from "./security.js";

const env = process.env;
const enabledProviders = parseEnabledProviders(env.FM001_ENABLED_PROVIDERS);
const maxBodyBytes = Number(env.FM001_MAX_BODY_BYTES || 1_048_576);
const timeoutMs = Number(env.FM001_REQUEST_TIMEOUT_MS || 30_000);
const rateLimit = createRateLimiter(Number(env.FM001_RATE_LIMIT_PER_MINUTE || 60));

function send(response, status, payload, requestId) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-request-id": requestId,
    "x-content-type-options": "nosniff"
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      const error = new Error("Request body too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch {
    const error = new Error("Request body must be valid JSON");
    error.status = 400;
    throw error;
  }
}

function validMessages(messages) {
  return Array.isArray(messages) && messages.length > 0 && messages.length <= 100 &&
    messages.every((item) => item && ["user", "assistant"].includes(item.role) &&
      (typeof item.content === "string" || Array.isArray(item.content)));
}

export function createServer() {
  return http.createServer(async (request, response) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/health") {
      return send(response, 200, { status: "ok", service: "FM-001", environment: env.NODE_ENV || "development" }, requestId);
    }
    if (!isAuthorized(request, env.FM001_API_KEY)) {
      return send(response, 401, { error: { code: "unauthorized", message: "Valid bearer token required" } }, requestId);
    }
    const clientKey = request.socket.remoteAddress || "unknown";
    if (!rateLimit(clientKey)) {
      return send(response, 429, { error: { code: "rate_limited", message: "Request limit exceeded" } }, requestId);
    }
    if (request.method === "GET" && url.pathname === "/v1/models") {
      return send(response, 200, {
        object: "list",
        data: [...enabledProviders].map((provider) => ({ id: provider, object: "model", owned_by: provider }))
      }, requestId);
    }
    if (request.method !== "POST" || url.pathname !== "/v1/chat/completions") {
      return send(response, 404, { error: { code: "not_found", message: "Route not found" } }, requestId);
    }

    let body;
    try { body = await readBody(request); }
    catch (error) {
      return send(response, error.status || 400, { error: { code: "invalid_request", message: error.message } }, requestId);
    }

    const provider = typeof body.provider === "string" ? body.provider.toLowerCase() : "";
    if (!enabledProviders.has(provider)) {
      return send(response, 400, { error: { code: "provider_disabled", message: "Provider is not enabled in this environment" } }, requestId);
    }
    if (!validMessages(body.messages)) {
      return send(response, 400, { error: { code: "invalid_messages", message: "messages must contain 1–100 user/assistant messages" } }, requestId);
    }
    if (body.model !== undefined && (typeof body.model !== "string" || body.model.length > 160)) {
      return send(response, 400, { error: { code: "invalid_model", message: "model must be a string of at most 160 characters" } }, requestId);
    }

    try {
      const result = await callProvider({
        provider, model: body.model, messages: body.messages,
        system: typeof body.system === "string" ? body.system.slice(0, 20_000) : undefined,
        signal: AbortSignal.timeout(timeoutMs)
      });
      console.info(JSON.stringify({ event: "provider_request", requestId, provider, model: result.model, status: 200, durationMs: Date.now() - startedAt }));
      return send(response, 200, { id: requestId, object: "chat.completion", provider, model: result.model, choices: [{ index: 0, message: result.message, finish_reason: "stop" }], usage: result.usage }, requestId);
    } catch (error) {
      const status = error.name === "TimeoutError" || error.name === "AbortError" ? 504 : (error.status || 502);
      console.warn(JSON.stringify({ event: "provider_error", requestId, provider, status, durationMs: Date.now() - startedAt, error: error.message }));
      return send(response, status, { error: { code: "provider_error", message: error.message }, request_id: requestId }, requestId);
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const host = env.HOST || "127.0.0.1";
  const port = Number(env.PORT || 8787);
  createServer().listen(port, host, () => console.info(`FM-001 listening on http://${host}:${port}`));
}
