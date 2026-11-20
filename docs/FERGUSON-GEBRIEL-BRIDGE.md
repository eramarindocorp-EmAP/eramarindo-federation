# Ferguson ↔ Gebriel Nathza AI-to-AI Bridge

## Scope

This feature adds a server-side, authenticated relay to the existing FM-001 Development gateway. It does not create a new OpenAI model or connect to a live ChatGPT conversation. Each identity is an application-level agent profile backed by its own OpenAI API project key and configured model.

## Routes

All routes below are behind the FM-001 bearer authentication and gateway rate limiter. On Vercel, prepend `/api` to these paths (for example, `/api/v1/agents/message`); the local Node server uses the paths exactly as listed.

- `GET /v1/agents/status` — readiness booleans only; never returns secrets.
- `GET /v1/ferguson/profile` — Ferguson profile.
- `GET /v1/gebriel/profile` — Gebriel Nathza profile.
- `POST /v1/agents/message` — authenticated one-hop message relay from either agent to the other.

### POST body

```json
{
  "from": "ferguson",
  "to": "gebriel_nathza",
  "instruction": "Review the attached implementation plan and identify risks.",
  "context": {
    "workstream": "FM-001",
    "reference": "TASK-001"
  }
}
```

The reverse direction uses `from: "gebriel_nathza"` and `to: "ferguson"`.

Headers:
- `Authorization: Bearer <FM001_API_KEY>`
- `x-agent-token: <FERGUSON_BRIDGE_TOKEN>` or `<GEBRIEL_BRIDGE_TOKEN>`, matching the declared sender.

The gateway rejects same-agent routing, malformed payloads, oversized instruction/context values, and missing/invalid sender credentials.

## Server-side environment variables

Configure only in Vercel Development/Preview or a trusted local secret manager:

- `FM001_API_KEY` — existing gateway bearer key, at least 32 characters.
- `FERGUSON_BRIDGE_TOKEN` — unique sender token, at least 32 characters.
- `GEBRIEL_BRIDGE_TOKEN` — different unique sender token, at least 32 characters.
- `OPENAI_API_KEY_FERGUSON` — Ferguson's OpenAI project API key.
- `OPENAI_MODEL_FERGUSON` — model identifier available to Ferguson's API project.
- `OPENAI_API_KEY_GEBRIEL` — Gebriel's OpenAI project API key.
- `OPENAI_MODEL_GEBRIEL` — model identifier available to Gebriel's API project.
- `SUPABASE_URL` — Supabase project URL.
- `SUPABASE_SECRET_KEY` — server-side Supabase secret/service-role key. Never expose it to browsers.

Use separate OpenAI project/service-account credentials where possible, with least privilege, budget limits, and key rotation. A ChatGPT subscription is not an OpenAI API key.

## Task persistence and audit

The route writes task status and events to `public.ai_bridge_tasks` and `public.ai_bridge_events` using the server-only Supabase secret key. The key is sent only in the `apikey` header; do not send a new `sb_secret_...` key as `Authorization: Bearer`, because Supabase documents that these opaque keys are not JWTs. The instruction/context and final result are persisted for task traceability; apply a retention policy appropriate to the sensitivity of the data. Events and application logs avoid storing raw prompt/completion content. `store: false` is sent to the OpenAI Responses API.

Task statuses: `queued` → `processing` → `completed` or `failed`.

This is a synchronous one-hop relay, not a durable background queue. A Vercel request timeout can interrupt a long-running task. A worker/queue with retry, idempotency, and callback delivery is a later production hardening step.

## Example

```bash
curl -X POST "$FM001_BASE_URL/api/v1/agents/message" \
  -H "Authorization: Bearer $FM001_API_KEY" \
  -H "x-agent-token: $FERGUSON_BRIDGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from":"ferguson",
    "to":"gebriel_nathza",
    "instruction":"Review the current deployment blockers and return an action plan.",
    "context":{"environment":"development"}
  }'
```

## Safety boundaries

- Development only; do not enable production traffic from this feature branch.
- Do not place API keys or bridge tokens in Git, client-side code, or chat messages.
- The agent-to-agent message route is not an approval to execute financial, legal, HR, deployment, or other consequential external actions.
- Agent output is untrusted input and must be reviewed before consequential execution.
