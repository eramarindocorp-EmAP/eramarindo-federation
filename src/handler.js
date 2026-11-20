import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { callProvider } from "./providers.js";
import { orchestrate } from "./orchestrator.js";
import { createRateLimiter, isAuthorized, parseEnabledProviders } from "./security.js";
import { handleAgentBridge } from "./agent-bridge.js";

const env = process.env;
const enabledProviders = parseEnabledProviders(env.FM001_ENABLED_PROVIDERS);
const maxBodyBytes = Number(env.FM001_MAX_BODY_BYTES || 1_048_576);
const timeoutMs = Number(env.FM001_REQUEST_TIMEOUT_MS || 30_000);
const rateLimit = createRateLimiter(Number(env.FM001_RATE_LIMIT_PER_MINUTE || 60));
const dashboardPath = fileURLToPath(new URL("../web/index.html", import.meta.url));

function send(response, status, payload, requestId) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-request-id": requestId,
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer"
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  if (request.body !== undefined && request.body !== null) {
    if (typeof request.body === "string" || Buffer.isBuffer(request.body)) {
      const raw = Buffer.isBuffer(request.body) ? request.body : Buffer.from(request.body);
      if (raw.length > maxBodyBytes) throw Object.assign(new Error("Request body too large"), { status: 413 });
      try { return JSON.parse(raw.toString("utf8")); }
      catch { throw Object.assign(new Error("Request body must be valid JSON"), { status: 400 }); }
    }
    if (typeof request.body === "object") {
      if (Buffer.byteLength(JSON.stringify(request.body)) > maxBodyBytes) throw Object.assign(new Error("Request body too large"), { status: 413 });
      return request.body;
    }
  }
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

function validModels(models) {
  return models === undefined || (models && typeof models === "object" && !Array.isArray(models) &&
    Object.entries(models).every(([provider, model]) =>
      ["openai", "deepseek", "gemini"].includes(provider) && typeof model === "string" && model.length <= 160));
}


async function federationRequest(path, options = {}) {
  const base = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (!base || !key) {
    throw Object.assign(new Error("Federation database is not configured on this deployment"), { status: 503 });
  }
  const response = await fetch(`${base.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "accept-profile": "federation",
      "content-profile": "federation",
      ...(options.headers || {})
    }
  });
  const raw = await response.text();
  if (!response.ok) {
    const error = new Error(`Federation database request failed (HTTP ${response.status})`);
    error.status = 502;
    throw error;
  }
  return raw ? JSON.parse(raw) : null;
}

function requestMessages(body) {
  if (validMessages(body.messages)) return body.messages;
  const prompt = typeof body.prompt === "string" ? body.prompt : typeof body.input === "string" ? body.input : body.input?.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw Object.assign(new Error("Provide messages[] or a non-empty prompt"), { status: 400 });
  }
  return [{ role: "user", content: prompt.slice(0, 50_000) }];
}

export async function handleRequest(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const url = new URL(request.url, "http://localhost");
  // Vercel may expose the function route with one or more /api prefixes,
  // depending on whether the request arrived through a rewrite or direct URL.
  // Normalize all leading /api segments so dashboard and direct API calls resolve identically.
  let pathname = url.pathname.replace(/\/+$/, "") || "/";
  while (pathname === "/api" || pathname.startsWith("/api/")) {
    pathname = pathname === "/api" ? "/" : pathname.slice(4);
  }

  if (request.method === "GET" && (pathname === "/" || pathname === "/app")) {
    try {
      const html = await readFile(dashboardPath);
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "no-referrer",
        "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
      });
      return response.end(html);
    } catch {
      return send(response, 503, { error: { code: "dashboard_unavailable", message: "Command Center UI is unavailable" } }, requestId);
    }
  }

  if (request.method === "GET" && pathname === "/health") {
    return send(response, 200, { status: "ok", service: "FM-001", environment: env.NODE_ENV || "development" }, requestId);
  }

  if (!isAuthorized(request, env.FM001_API_KEY)) {
    return send(response, 401, { error: { code: "unauthorized", message: "Valid bearer token required" } }, requestId);
  }

  const clientKey = request.socket?.remoteAddress || request.headers?.["x-forwarded-for"] || "unknown";
  if (!rateLimit(String(clientKey))) {
    return send(response, 429, { error: { code: "rate_limited", message: "Request limit exceeded" } }, requestId);
  }

  if (await handleAgentBridge({ request, response, pathname, requestId, env })) return;

  if (request.method === "GET" && pathname === "/v1/providers/status") {
    return send(response, 200, {
      environment: env.NODE_ENV || "development",
      providers: {
        openai: { enabled: enabledProviders.has("openai"), configured: Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL) },
        deepseek: { enabled: enabledProviders.has("deepseek"), configured: Boolean(env.DEEPSEEK_API_KEY && env.DEEPSEEK_MODEL) },
        gemini: { enabled: enabledProviders.has("gemini"), configured: Boolean(env.GEMINI_API_KEY && env.GEMINI_MODEL) }
      }
    }, requestId);
  }


  if (pathname.startsWith("/v1/ferguson/")) {
    const action = pathname.slice("/v1/ferguson/".length);
    if (request.method === "GET" && action === "profile") {
      return send(response, 200, {
        agent_id: "ferguson-a-sinclair",
        display_name: "Ferguson A. Sinclair",
        role: "Strategic Intelligence & AI Orchestration",
        status: "available",
        capabilities: ["reasoning", "analysis", "research_assistance", "strategy", "task_intake"],
        limitations: ["External web research requires a separately configured search adapter", "Material execution requires human approval"],
        providers: [...enabledProviders]
      }, requestId);
    }

    if (request.method === "GET" && action === "tasks") {
      try {
        const data = await federationRequest("tasks?select=task_id,correlation_id,title,description,task_type,priority,status,assigned_agent_id,environment,requires_approval,created_at,updated_at&order=created_at.desc&limit=50");
        return send(response, 200, { data }, requestId);
      } catch (error) {
        return send(response, error.status || 502, { error: { code: "task_store_unavailable", message: error.message } }, requestId);
      }
    }

    if (request.method === "GET" && action === "audit") {
      try {
        const [runs, approvals, integrations] = await Promise.all([
          federationRequest("task_runs?select=run_id,task_id,agent_id,environment,status,input_digest,output_digest,started_at,completed_at,error_code,evidence&order=started_at.desc&limit=50"),
          federationRequest("approval_events?select=event_id,approval_id,event_type,actor_principal_id,event_detail,occurred_at&order=occurred_at.desc&limit=50"),
          federationRequest("integration_events?select=event_id,correlation_id,source_platform,event_type,environment,outcome,payload_digest,occurred_at,metadata&order=occurred_at.desc&limit=50")
        ]);
        return send(response, 200, { task_runs: runs, approval_events: approvals, integration_events: integrations }, requestId);
      } catch (error) {
        return send(response, error.status || 502, { error: { code: "audit_store_unavailable", message: error.message } }, requestId);
      }
    }

    if (request.method === "POST" && action === "execute") {
      let body;
      try { body = await readBody(request); }
      catch (error) { return send(response, error.status || 400, { error: { code: "invalid_request", message: error.message } }, requestId); }
      if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.title !== "string" || !body.title.trim()) {
        return send(response, 400, { error: { code: "invalid_request", message: "A non-empty title is required" } }, requestId);
      }
      try {
        const priority = ["low", "normal", "high", "critical"].includes(body.priority) ? body.priority : "normal";
        const task = await federationRequest("tasks?select=task_id,correlation_id,title,task_type,priority,status,requires_approval,environment,created_at", {
          method: "POST",
          headers: { prefer: "return=representation" },
          body: JSON.stringify({
            title: body.title.trim().slice(0, 240),
            description: typeof body.description === "string" ? body.description.slice(0, 8000) : null,
            task_type: typeof body.task_type === "string" ? body.task_type.slice(0, 100) : "ferguson_execution_request",
            priority,
            status: "pending_approval",
            requires_approval: true,
            environment: env.NODE_ENV === "production" ? "production" : "development"
          })
        });
        return send(response, 202, { status: "pending_approval", message: "Task registered. No external action has been executed; human approval is required.", task: Array.isArray(task) ? task[0] : task }, requestId);
      } catch (error) {
        return send(response, error.status || 502, { error: { code: "task_registration_failed", message: error.message } }, requestId);
      }
    }

    const operation = { think: "Strategic reasoning", analyze: "Structured analysis", research: "Research assistance", strategy: "Strategic planning" }[action];
    if (request.method === "POST" && operation) {
      let body;
      try { body = await readBody(request); }
      catch (error) { return send(response, error.status || 400, { error: { code: "invalid_request", message: error.message } }, requestId); }
      let messages;
      try { messages = requestMessages(body || {}); }
      catch (error) { return send(response, error.status || 400, { error: { code: "invalid_request", message: error.message } }, requestId); }
      if (!enabledProviders.size) {
        return send(response, 503, { error: { code: "no_provider_enabled", message: "No AI provider is enabled in this environment" } }, requestId);
      }
      const system = `You are Ferguson A. Sinclair, Eramarindo Corporation's Strategic Intelligence and AI Orchestration assistant. Task: ${operation}. Be precise, distinguish verified facts from assumptions, identify risks, and never claim an external action was completed unless a tool confirms it.${action === "research" ? " Do not claim live web verification; analyze supplied sources and clearly state when external source retrieval is unavailable." : ""}`;
      const requestedPlan = body.plan && typeof body.plan === "object" ? body.plan : enabledProviders.size === 1
        ? { mode: "single", provider: [...enabledProviders][0] }
        : { mode: "fallback", providers: [...enabledProviders] };
      try {
        const result = await orchestrate({
          plan: { ...requestedPlan, models: { ...(body.models || {}) } },
          messages, system, enabledProviders, call: callProvider,
          signal: AbortSignal.timeout(timeoutMs)
        });
        return send(response, 200, { id: requestId, object: `ferguson.${action}`, status: result.status, operation, result }, requestId);
      } catch (error) {
        return send(response, error.status || 502, { error: { code: "ferguson_operation_failed", message: error.message }, request_id: requestId }, requestId);
      }
    }
    return send(response, 405, { error: { code: "method_or_route_not_supported", message: "Unsupported Ferguson route or HTTP method" } }, requestId);
  }

  if (request.method === "GET" && pathname === "/v1/models") {
    return send(response, 200, {
      object: "list",
      data: [...enabledProviders].map((provider) => ({ id: provider, object: "model", owned_by: provider }))
    }, requestId);
  }

  if (request.method !== "POST" || !["/v1/chat/completions", "/v1/orchestrate"].includes(pathname)) {
    return send(response, 404, { error: { code: "not_found", message: "Route not found" } }, requestId);
  }

  let body;
  try { body = await readBody(request); }
  catch (error) {
    return send(response, error.status || 400, { error: { code: "invalid_request", message: error.message } }, requestId);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return send(response, 400, { error: { code: "invalid_request", message: "Request body must be a JSON object" } }, requestId);
  }
  if (!validMessages(body.messages)) {
    return send(response, 400, { error: { code: "invalid_messages", message: "messages must contain 1–100 user/assistant messages" } }, requestId);
  }
  if (!validModels(body.models) || (body.model !== undefined && (typeof body.model !== "string" || body.model.length > 160))) {
    return send(response, 400, { error: { code: "invalid_model", message: "model identifiers must be strings of at most 160 characters" } }, requestId);
  }

  if (pathname === "/v1/orchestrate") {
    try {
      const result = await orchestrate({
        plan: { ...body.plan, models: body.models },
        messages: body.messages,
        system: typeof body.system === "string" ? body.system.slice(0, 20_000) : undefined,
        enabledProviders,
        call: callProvider,
        signal: AbortSignal.timeout(timeoutMs)
      });
      console.info(JSON.stringify({ event: "orchestration_request", requestId, mode: result.mode, status: result.status, providers: result.results.map((item) => item.provider), durationMs: Date.now() - startedAt }));
      return send(response, 200, { id: requestId, object: "fm001.orchestration", ...result }, requestId);
    } catch (error) {
      const status = error.status || (error.name === "TimeoutError" || error.name === "AbortError" ? 504 : 502);
      return send(response, status, { error: { code: "orchestration_error", message: error.message }, request_id: requestId }, requestId);
    }
  }

  const provider = typeof body.provider === "string" ? body.provider.toLowerCase() : "";
  if (!enabledProviders.has(provider)) {
    return send(response, 400, { error: { code: "provider_disabled", message: "Provider is not enabled in this environment" } }, requestId);
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
}
