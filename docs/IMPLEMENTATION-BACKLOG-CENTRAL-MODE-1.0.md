# Implementation Backlog — Central Mode v1.0

**Branch:** `feat/central-federation-architecture-v1`  
**Environment:** Development only  
**Execution rule:** no main-branch merge, production deployment, paid provider traffic, or database migration without separate explicit approval.

## Workstream 0 — Repository and baseline verification
- [x] Locate the existing `eramarindo-federation` repository.
- [x] Read current README, architecture, roadmap, security baseline and agent bridge notes.
- [x] Confirm existing FM-001 gateway, basic orchestration and two-agent API relay are documented.
- [x] Create an isolated feature branch for this architecture baseline.
- [ ] Run existing CI and unit tests against the feature branch.
- [ ] Review existing bridge code for security, schema consistency and test coverage.

## Workstream 1 — Central operating model
- [x] Define central orchestration model.
- [x] Define manual chat relay as the first mode for chat-only provider access.
- [x] Define the distinction between chat subscriptions and provider API credentials.
- [x] Define provider states and onboarding matrix.
- [ ] Implement provider capability registry.
- [ ] Implement task contract validation and versioning.
- [ ] Implement policy decision record for each task.

## Workstream 2 — Manual chat relay MVP
- [ ] Add `POST /v1/tasks` to create a validated task.
- [ ] Add `GET /v1/tasks/:id` to read task status and packet.
- [ ] Add `POST /v1/tasks/:id/submissions` for human-entered provider responses.
- [ ] Add `POST /v1/tasks/:id/review` for accept/reject/needs-changes.
- [ ] Generate provider-specific prompt packets without claiming automated chat access.
- [ ] Record actor, provider label, timestamps, task version and correlation ID.
- [ ] Add UI views: task inbox, provider status, response capture, review queue.
- [ ] Add tests for malformed input, unauthorized submission, duplicate submission and state transitions.

## Workstream 3 — Provider readiness
- [ ] Register ChatGPT/OpenAI, Gemini, DeepSeek, Microsoft Copilot, GitHub Copilot, Claude and Other as capability records.
- [ ] Keep all external providers `manual_only` until separately verified.
- [ ] Add API adapters only after credential, model, billing and policy approval.
- [ ] Add cost ceilings and provider-specific request timeout controls.
- [ ] Add a safe provider readiness endpoint returning booleans and non-secret metadata only.

## Workstream 4 — Data and identity
- [ ] Obtain Founder selection of one Supabase Development project.
- [ ] Design schema and RLS policies in a reviewable migration.
- [ ] Separate user identity, agent identity and provider connection metadata.
- [ ] Add append-only audit events and retention rules.
- [ ] Add idempotency and durable queue design before long-running multi-agent workflows.
- [ ] Run Supabase security advisors and authorization tests before applying migration.

## Workstream 5 — Deployment and verification
- [ ] Identify the intended Vercel team and project.
- [ ] Verify project build settings, environment scopes and deployment protection.
- [ ] Deploy only to Development after repository tests pass and secrets are approved.
- [ ] Verify health, authenticated routes, denied unauthenticated requests and manual workflow end-to-end.
- [ ] Produce evidence-based readiness report.

## Exit criteria
Milestone 1 is complete only when a human can create a central task, export a provider-specific chat brief, paste a response, submit it to the task record, review it, and retrieve the audit trail. No direct chat-session integration is implied.
