# Eramarindo AI Federation — Central Architecture v1.0

**Status:** Development design baseline  
**Operating model:** Central orchestration with human approval  
**Doctrine:** ONE GATE — ONE STANDARD — ONE COMMAND  
**Culture:** 4T1B — Tetapkan, Teguhkan, Tanamkan, Terapkan, Berkelanjutan

## 1. Executive decision

The Federation will use a central orchestration model. FM-001 is the internal gateway and policy enforcement point. A central orchestrator receives an approved task, classifies it, selects only eligible provider adapters, dispatches bounded requests, normalizes results, records provenance, and returns a consolidated result for human review.

The words “Ferguson” and “Gabriel Nathza” identify user-defined working roles/personas. They are not independent live ChatGPT sessions or provider endpoints by themselves. An API-backed runtime identity must be separately provisioned and tested before it can receive automated tasks.

## 2. Important channel limitation

The currently selected provider access mode is **chat-only**. A web/chat subscription does not automatically grant API access or permit an external system to read, send messages to, or control that chat session.

Therefore delivery is deliberately split:

- **Phase A — Chat-assisted/manual relay:** the Command Center creates a standardized task brief, context packet, response template, and review record. An authorized human transfers the packet into a provider's chat UI and pastes the response back. This gives a central workflow without pretending the chat UIs are connected.
- **Phase B — API-connected providers:** after an API account, credentials, model identifier, billing owner, data-sharing approval, and endpoint test are completed, the provider can be enabled as a server-side adapter.
- **Phase C — approved agent-to-agent relay:** only API-backed agent identities can exchange messages through FM-001. This does not attach to a user's private ChatGPT/Gemini/Claude/Copilot browser conversation.

A ChatGPT, Gemini, Claude, Microsoft Copilot, or GitHub Copilot subscription must not be treated as an API credential. Provider-specific terms and access mechanisms must be checked before integration.

## 3. Target logical architecture

```text
Founder / Authorized Human
        |
        v
Trinity AI Command Center (UI)
        |
        v
FM-001 API Gateway
  |-- Authentication / authorization
  |-- Request validation / rate limits
  |-- Policy & data classification
  |-- Cost / provider allowlist
  |-- Correlation ID
        |
        v
Central Orchestrator
  |-- Task classifier and planner
  |-- Provider capability registry
  |-- Dispatch / timeout / retry policy
  |-- Result normalization
  |-- Evaluation / discrepancy detection
  |-- Human approval gate
        |
        +--> OpenAI API adapter (future opt-in)
        +--> Gemini API adapter (future opt-in)
        +--> DeepSeek API adapter (future opt-in)
        +--> Anthropic API adapter (future opt-in)
        +--> Microsoft 365 / Copilot integration (separate approved connector)
        +--> GitHub Copilot workflow (repository/IDE workflow; not assumed to be a general chat API)
        +--> Manual chat relay adapter (initial mode)
        |
        v
Supabase Federation Data Layer (after project selection)
  |-- agent_registry
  |-- provider_connections (metadata only; no plaintext secrets)
  |-- task_runs
  |-- task_messages
  |-- task_results
  |-- approvals
  |-- audit_events
  |-- evaluation_runs
        |
        v
Founder / Authorized Human Review
```

## 4. System boundaries and components

| Component | Responsibility | Initial status |
|---|---|---|
| FM-001 Gateway | Single authenticated API boundary | Existing development foundation |
| Central Orchestrator | Plan, route, collect and normalize work | Existing basic modes; expand after tests |
| Provider Registry | Capabilities, connection state, policy and model metadata | Design required |
| Manual Chat Relay | Copy-ready briefs and human-submitted results | First implementation target |
| API Adapters | Server-side provider calls | Existing OpenAI, DeepSeek and Gemini adapters; disabled by default |
| Agent Bridge | Authenticated relay between provisioned API identities | Existing Ferguson/Gebriel proof of concept; not live chat bridging |
| Shared Knowledge | Approved documents with provenance and access rules | Later stage |
| Audit & Evaluation | Immutable event history, quality tests and review | Design / implementation required |
| Command Center | Human control and visibility | Existing development UI; enhancement required |

## 5. Provider onboarding matrix

| Assistant | Chat-only pathway | API / integration pathway | Rule |
|---|---|---|---|
| ChatGPT | Manual relay | OpenAI API adapter | ChatGPT subscription is not API access |
| Gemini | Manual relay | Gemini API adapter | Separate API project/key required |
| DeepSeek | Manual relay | DeepSeek API adapter | Separate API credential required |
| Microsoft Copilot | Manual relay | Approved Microsoft 365 / Copilot Studio / Graph integration where supported | Do not assume a universal Copilot chat endpoint |
| GitHub Copilot | Human-led coding workflow | GitHub APIs / approved coding-agent workflow | Do not treat Copilot seat as a generic model API |
| Claude | Manual relay | Anthropic API adapter | Claude chat plan is not API access |
| Other assistants | Manual relay | Provider-specific adapter after review | No unverified connector |

Provider connection states: `manual_only`, `pending_credentials`, `pending_policy_review`, `api_ready`, `disabled`, `suspended`.

## 6. Standard task contract

Every task must carry:

- `task_id`: unique UUID.
- `workstream`: project or department.
- `objective`: one measurable task objective.
- `requested_by`: authenticated human or system identity.
- `classification`: public, internal, confidential, restricted.
- `allowed_providers`: explicit allowlist for this task.
- `context_refs`: approved document references, not arbitrary broad data access.
- `deliverable_schema`: expected sections or JSON schema.
- `deadline` and `budget_limit`: optional but explicit when relevant.
- `approval_required`: true by default for consequential work.
- `correlation_id`: end-to-end trace identifier.

Every result must include provider/agent identity, model identifier where applicable, timestamp, task ID, source references, assumptions, limitations, outcome status, and review state.

## 7. Central workflow

1. Human creates task in Command Center.
2. Gateway authenticates the caller and validates payload size/schema.
3. Policy engine classifies the data and determines allowed providers.
4. Orchestrator selects only eligible providers and produces a task packet.
5. In manual mode, the UI displays a copy-ready prompt and records the returned answer after human submission.
6. In API mode, the server sends the request using server-side secrets only.
7. Results are normalized and checked for completeness, provenance, contradictions and policy violations.
8. The system labels the result as draft, needs-review, approved, rejected or failed.
9. Human owner accepts or rejects the deliverable.
10. Only approved, non-sensitive knowledge is promoted into the shared repository under retention and access policy.

## 8. Security and governance baseline

- No provider secret or gateway token in browser code, Git, logs, prompts, or shared documents.
- Secrets stored only in approved server-side secret storage; use least privilege and rotation.
- No provider enabled by default.
- No external provider receives confidential/restricted corporate content until a documented data-processing, retention, residency, and contractual review is approved.
- Treat all provider output and retrieved documents as untrusted input.
- No AI-only approval for payments, investments, legal commitments, hiring decisions, production deployments, access changes, or other consequential actions.
- Use per-task provider allowlists, quotas, timeout budgets, request IDs and cost attribution.
- Keep audit events append-only; do not log raw prompts or completions by default.
- Supabase exposed tables require RLS and least-privilege policies. Server-only secret keys must never be exposed to the browser.
- Separate Development, Preview and Production. No production changes in this delivery stage.

## 9. Non-functional requirements

- Availability: fail closed when identity, policy, or provider configuration is missing.
- Reliability: bounded retries, idempotency keys, explicit failure states; no silent provider switching.
- Observability: correlation IDs, structured metadata, latency, status and cost counters.
- Data minimization: only task-specific context is shared.
- Portability: provider adapters implement a common internal interface.
- Testability: deterministic unit tests and mocked provider contract tests.
- Accessibility: keyboard-usable Command Center and readable status indicators.

## 10. Acceptance criteria for the first milestone

- Manual chat relay can create a task packet, record an assistant response and retain task history.
- All seven provider categories can be registered without claiming a live connection.
- UI clearly distinguishes manual-only, pending and API-ready states.
- API provider allowlist remains empty until approved configuration exists.
- Every task/result has a correlation ID and review status.
- No secrets are returned by status endpoints or sent to the browser.
- Unit tests cover validation, authorization, policy denial, provider failure and result capture.
- Founder approval is required before schema migration, paid API traffic, merge to main or production promotion.

## 11. Decisions still required

1. Select exactly one Supabase Development project for Federation data; do not write schema changes until selected.
2. Confirm the Vercel project/team and Development environment; current connected Vercel project lookup did not identify a matching project.
3. Name the data owner and cost owner for each provider.
4. Approve the corporate data classification and provider-sharing matrix.
5. Confirm whether the first manual-relay milestone should cover all six named products or start with ChatGPT, Gemini and DeepSeek.

## 12. Status language

Use only these evidence-based states: `DESIGNED`, `IMPLEMENTED`, `TESTED`, `CONNECTED`, `APPROVED`, `DEPLOYED`. A design document is not evidence of a working integration. Never label a provider connected until a successful authenticated test is recorded.
