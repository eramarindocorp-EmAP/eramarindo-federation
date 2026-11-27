# Human Approval Policy — FM-AIF

## 1. Authority

Ferdynand Marthing is the Principal Human Authority. Ferguson Albrecht Sinclair is Chief AI Coordinator and may coordinate analysis, prepare proposals, route tasks, and report status. The coordinator cannot approve its own consequential actions.

## 2. Action classes

### Class A — Analysis
Research, summarization, drafting, calculations, code review, and recommendations. May run when requested by an authenticated operator, subject to provider data-sharing rules.

### Class B — Internal reversible preparation
Creating a draft, preparing a proposed configuration, or generating a patch on a feature branch. May proceed within the explicitly granted scope. No merge or release.

### Class C — Consequential or external action
Sending messages, publishing content, changing persistent business records, executing tools with side effects, financial transactions, legal commitments, restricted-data exports, changing credentials/access, database migrations, merging code, or production deployment.

Class C requires explicit human approval before execution.

## 3. Approval record

A valid approval must identify:
- approval ID and task ID;
- exact action and target;
- requesting identity;
- data classification and provider(s) involved;
- expected cost and external side effects;
- approver identity and timestamp;
- decision (approved/rejected);
- execution evidence and resulting status.

Approval is scoped to the exact action. A changed target, payload, amount, permission, or environment requires a new approval.

## 4. Fail-closed requirements

Missing approver, unavailable approval store, expired approval, mismatched task/action, or failed audit write means the action is blocked. No AI may infer approval from silence, prior unrelated approval, or its own recommendation.

## 5. Credential and privacy controls

Never store API keys, passwords, recovery codes, session cookies, or private email access details in source control, prompts, logs, or public documentation. Use Vercel encrypted environment variables or an approved secret manager. Use least privilege and rotate exposed credentials.

## 6. Release authority

Feature branch creation and preview testing are permitted within the approved staging mandate. Merging to main, enabling paid provider traffic, applying Supabase migrations, or production deployment require separate explicit Founder approval.
