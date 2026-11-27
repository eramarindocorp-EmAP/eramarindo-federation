# Federation Full Staging Implementation

**Project:** FERDYNAND MARTHING AI FEDERATION COMMAND CENTER v1.0  
**Repository:** eramarindo-federation  
**Branch:** feat/federation-full-staging-v1  
**Environment:** staging only  
**Human authority:** Ferdynand Marthing  
**Chief AI Coordinator:** Ferguson Albrecht Sinclair  
**Approval model:** Human approval for consequential actions

## Existing foundation

FM-001 already provides a Node.js gateway, provider adapters for OpenAI/DeepSeek/Gemini, an orchestration engine, a lightweight browser Command Center, an authenticated Ferguson–Gebriel bridge, and GitHub Actions checks.

## Scope of this change

1. Extend the provider gateway to Anthropic Claude and Perplexity.
2. Expand the provider allowlist and orchestration limit to five providers.
3. Register nine user-designated AI working identities across five providers.
4. Preserve opt-in provider activation: no provider is enabled by default.
5. Establish human approval as a hard requirement for consequential external actions.
6. Keep all changes on a feature branch and request review through a draft pull request.
7. Do not merge, enable paid provider traffic, apply database migrations, or promote production.

## Identity semantics

The nine identities are governance/persona profiles. Four ChatGPT identities share the OpenAI provider integration; two Gemini identities share the Gemini provider integration. They are not nine independent API accounts. Provider API access and ChatGPT/Gemini consumer subscriptions are distinct products and credentials.

## Provider configuration

| Provider ID | API adapter | Required environment variables |
|---|---|---|
| openai | OpenAI Chat Completions | OPENAI_API_KEY, OPENAI_MODEL |
| deepseek | DeepSeek Chat Completions | DEEPSEEK_API_KEY, DEEPSEEK_MODEL |
| gemini | Gemini generateContent | GEMINI_API_KEY, GEMINI_MODEL |
| perplexity | Perplexity Chat Completions | PERPLEXITY_API_KEY, PERPLEXITY_MODEL |
| anthropic | Anthropic Messages API | ANTHROPIC_API_KEY, ANTHROPIC_MODEL |

Provider allowlist remains empty until credentials, model IDs, billing owner, retention, and data-transfer approvals are confirmed.

## Human approval boundary

Analysis and drafting can be requested by the authenticated operator. Any action with external side effects—including sending communications, changing data, executing tools, financial/legal actions, exporting restricted data, modifying credentials, merging code, database migrations, or production deployment—must be represented as a pending approval and must not execute until an authorized human explicitly approves it.

This repository change does not claim a durable approval database is active. The existing Supabase project was identified, but database connectivity could not be verified in this run. Durable approvals must remain fail-closed until Supabase access, schema, RLS, and end-to-end tests are complete.

## Staging and release gates

- GitHub Actions syntax checks and unit tests pass.
- Provider adapters are tested with mocked HTTP responses; no paid API call is required for CI.
- No real credentials are committed.
- Supabase schema and RLS reviewed before any migration.
- Vercel staging project and environment variables configured by an authorized operator.
- Staging smoke test verifies health, authentication, disabled-provider behavior, and approval blocking.
- Founder approval required before merge, provider activation, database migration, or production release.

## Known integration blockers at implementation start

- Supabase project reference is known, but database tooling returned an authentication failure. No database mutation was attempted.
- No Vercel project was returned by the connected Vercel account search. No deployment was attempted.
- Provider API credentials and model IDs have not been provisioned or approved.
