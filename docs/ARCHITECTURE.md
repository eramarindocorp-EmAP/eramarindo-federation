# FM-001 Development Architecture

## Purpose
FM-001 is the provider-neutral gateway and orchestration boundary for the Eramarindo AI Federation. It provides one authenticated internal API for OpenAI, DeepSeek, and Gemini while keeping provider credentials on the server.

## Current implementation scope
- Node.js 22+ HTTP service with no third-party runtime dependencies.
- Provider adapters: OpenAI Chat Completions, DeepSeek Chat Completions, and Gemini generateContent.
- Explicit per-environment provider allowlist.
- Bearer-token authentication, bounded request bodies, request timeout, basic per-process rate limiting, and request correlation IDs.
- Health and model-discovery endpoints.
- Structured operational logs that omit prompts and completions.

## API
- `GET /health`: liveness only; no secrets or dependency checks.
- `GET /v1/models`: authenticated list of enabled provider identifiers.
- `POST /v1/chat/completions`: authenticated provider request.

Example request:
```json
{
  "provider": "openai",
  "model": "MODEL_ID_CONFIGURED_BY_OPERATOR",
  "system": "You are the Eramarindo internal assistant.",
  "messages": [{ "role": "user", "content": "Summarize the approved brief." }]
}
```

The caller must supply an enabled provider. Model identifiers are supplied through environment configuration or the request; this repository intentionally does not hard-code fast-changing model names.

## Target architecture (not yet implemented)
1. Command Center UI with identity-aware access.
2. FM-001 orchestration: policy routing, parallel/consensus modes, context controls, response evaluation, retry/fallback.
3. Provider adapters and model registry.
4. Identity and authorization integration (Supabase Auth / enterprise identity).
5. Audit and governance data plane.
6. Knowledge retrieval and controlled memory.
7. Approval workflow for sensitive tools, external actions, and environment promotion.

## Governance boundaries
- Development is the only target in this pull request.
- No production credentials, deployment, or production environment changes.
- No database migrations or Supabase writes in this implementation.
- No provider key creation or billing changes.
- Do not enable a provider until its credentials, model choice, data handling, and cost owner are approved.
- Merge and promotion require Founder approval.
