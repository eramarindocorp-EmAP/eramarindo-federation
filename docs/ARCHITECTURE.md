# FM-001 Development Architecture

## Purpose
FM-001 is the provider-neutral gateway and orchestration boundary for the Eramarindo AI Federation. It provides one authenticated internal API for OpenAI, DeepSeek, and Gemini while keeping provider credentials on the server.

## Implemented development scope
- Node.js 22+ HTTP service with no third-party runtime dependencies.
- Provider adapters: OpenAI Chat Completions, DeepSeek Chat Completions, and Gemini generateContent.
- Explicit per-environment provider allowlist.
- Bearer-token authentication, bounded request bodies, request timeout, basic per-process rate limiting, and request correlation IDs.
- Health and model-discovery endpoints.
- Structured operational logs that omit prompts and completions.
- Orchestration endpoint supporting single, parallel, strict-majority consensus, and ordered fallback modes.
- Provider-specific model overrides through the server-side request's `models` map.

## API

### Liveness
- `GET /health`: liveness only; no secrets or dependency checks.

### Provider discovery
- `GET /v1/models`: authenticated list of enabled provider identifiers.

### Single-provider completion
- `POST /v1/chat/completions`: authenticated provider request.

### Multi-provider orchestration
- `POST /v1/orchestrate`: authenticated orchestration request.

Example — parallel comparison:
```json
{
  "plan": { "mode": "parallel", "providers": ["openai", "deepseek", "gemini"] },
  "models": {
    "openai": "OPERATOR_CONFIGURED_MODEL",
    "deepseek": "OPERATOR_CONFIGURED_MODEL",
    "gemini": "OPERATOR_CONFIGURED_MODEL"
  },
  "system": "Answer the approved internal question using only the supplied context.",
  "messages": [{ "role": "user", "content": "Compare the options in the approved brief." }]
}
```

Supported modes:
- `single`: call exactly one provider.
- `parallel`: call 2–3 selected providers concurrently and return each outcome.
- `consensus`: compare normalized response text and declare consensus only when a strict majority of selected providers return matching non-empty text. This is exact-text agreement, not semantic verification.
- `fallback`: call providers in the supplied order and stop at the first successful non-empty response.

The caller must select providers that are enabled in `FM001_ENABLED_PROVIDERS`. The provider allowlist is empty by default. Provider model identifiers and API credentials are operator-supplied; model names are not hard-coded.

## Governance and safety boundaries
- Development is the only target in this pull request.
- No production credentials, deployment, or production environment changes.
- No database migrations or Supabase writes in this implementation.
- No provider key creation or billing changes.
- Do not enable a provider until its credentials, model choice, data handling, and cost owner are approved.
- Parallel and consensus modes can trigger multiple paid provider requests; use only after explicit cost and data-handling approval.
- Fallback order is explicit; no silent provider switching.
- Merge and promotion require Founder approval.

## Known limitations
- The current bearer token is a Development bootstrap mechanism, not enterprise identity or per-user authorization.
- Rate limiting is in-memory and per-process.
- No durable audit ledger, distributed quotas, streaming, tool execution, semantic judge, retrieval, or Command Center UI.
- Consensus uses exact normalized text equality and must not be represented as a factual correctness guarantee.
- Provider errors are returned as per-provider outcomes for multi-provider modes; operational telemetry excludes prompts and completions.
