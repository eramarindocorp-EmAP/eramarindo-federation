# Eramarindo AI Federation — Delivery Roadmap

| Stage | Scope | Exit criteria |
|---|---|---|
| 0 — Foundation | FM-001 service, provider adapters, auth baseline, CI | CI passes; security review complete |
| 1 — Orchestration MVP | Single, parallel, exact-text consensus, ordered fallback | Deterministic tests; cost/data policy approved |
| 2 — Identity | Supabase Auth integration, roles, organization membership | Threat model and RLS reviewed; migration separately approved |
| 3 — Command Center | Team workspace, conversations, provider/model selection | Role-based UI and accessibility review |
| 4 — Governance | Durable audit ledger, approval workflow, spend controls | Founder approval gates tested end-to-end |
| 5 — Knowledge | Retrieval, approved documents, provenance and retention | Access filtering and citation tests |
| 6 — Advanced federation | Semantic evaluation, context isolation, policy routing, safe tool adapters | Evaluation benchmark, red-team review, explicit approvals |
| 7 — Release readiness | Load, security, resilience, backup and recovery tests | Formal release review and Founder approval |

## Immediate next actions
1. Review the Orchestration MVP Draft PR and its security assumptions.
2. Run GitHub Actions CI and remediate findings.
3. Select provider model IDs and confirm API account/billing ownership before enabling any provider.
4. Define data classification and provider-sharing rules before sending corporate content to external model APIs.
5. Design identity and audit schema separately; do not apply migrations as part of this implementation.
6. Only after acceptance, create a separately approved release plan.
