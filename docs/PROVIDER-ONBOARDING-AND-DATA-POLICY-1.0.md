# Provider Onboarding and Data-Sharing Policy — Draft 1.0

## 1. Purpose
Set minimum conditions before any AI provider is connected to the Eramarindo central Federation.

## 2. Onboarding record
Each provider record must contain:
- Provider name and product surface (web chat, API, enterprise tenant, coding agent).
- Technical owner and business owner.
- Connection mode: manual chat or API.
- Supported capabilities and limitations.
- Approved model identifiers and region, where applicable.
- Credential location reference (never the credential value).
- Billing owner, budget ceiling and alert threshold.
- Data classes permitted for transmission.
- Retention/training/data-processing terms reviewed.
- Test evidence, date, reviewer and approval status.

## 3. Default data policy

| Data class | Manual chat | External API | Approval |
|---|---|---|---|
| Public | Allowed after source review | Allowed if provider approved | Routine |
| Internal | Minimize and redact | Only after provider review | Data owner |
| Confidential | Do not submit by default | Deny by default | Written executive + legal/security approval |
| Restricted / secrets / personal sensitive data | Prohibited | Prohibited unless a separately approved lawful workflow exists | Special review |

Never submit passwords, access tokens, private keys, authentication codes, or production secrets to an AI provider.

## 4. Provider-specific guardrails
- OpenAI / ChatGPT: distinguish ChatGPT product access from OpenAI API access.
- Google Gemini: distinguish Gemini consumer/workspace chat from Gemini API / Vertex AI access.
- DeepSeek: distinguish web chat from API access and review data handling before use.
- Anthropic Claude: distinguish Claude chat plans from Anthropic API access.
- Microsoft Copilot: identify the exact product and tenant; integration may require Microsoft Graph, Copilot Studio or another supported enterprise surface.
- GitHub Copilot: treat as a developer productivity/coding workflow, not a generic provider API unless an explicitly supported interface is approved.
- Other: require documented technical and legal review.

## 5. Human review
Provider outputs are drafts. A human owner must verify facts, citations, calculations, assumptions and recommendations. AI output cannot authorize payments, contracts, hiring/firing, investments, legal filings, production deployment or access grants.

## 6. Connection status definitions
- `manual_only`: human-mediated copy/paste workflow.
- `pending_credentials`: provider API access not yet configured.
- `pending_policy_review`: credentials may exist but data/legal/security review is incomplete.
- `api_ready`: approved API integration passed a test call.
- `disabled`: intentionally unavailable.
- `suspended`: disabled due to incident, policy or cost concern.

## 7. Review cadence
Review provider access, model IDs, spend, terms, data classification and owners quarterly, and immediately after a material provider or policy change.
