# FM-001 Security Baseline

## Implemented in this foundation
- Server-side provider credentials only; no browser-facing provider keys.
- Bearer-token authentication using constant-time comparison.
- Startup refuses authorization if the shared gateway token is absent or shorter than 32 characters.
- Provider allowlist is opt-in and defaults to empty.
- Request size cap, message count cap, model identifier length cap, timeout, and basic rate limiting.
- No prompt or completion content in application logs.
- No CORS policy is enabled; keep the service behind a trusted reverse proxy or private network.

## Required before any shared or production use
- Replace the shared development bearer token with identity-based authentication and role-based authorization.
- Store secrets in an approved secret manager; rotate credentials and document ownership.
- Add distributed rate limiting, abuse controls, per-user quotas, and spend budgets.
- Add durable append-only audit events with retention and access controls.
- Add provider data-processing review, residency/retention decisions, and user disclosure.
- Add network egress restrictions, TLS termination, security headers, and deployment hardening.
- Add dependency and container scanning, SBOM, secret scanning, and signed release artifacts.
- Add prompt-injection controls and tool permission boundaries before enabling tools or agents.

## Known limitations
- In-memory rate limiting is per process and resets on restart; it is not suitable for multi-instance production.
- The health endpoint is a liveness check, not a readiness check.
- This first version is non-streaming and does not implement tool calls, file uploads, image inputs, or provider consensus.
- Provider-specific errors are normalized to safe HTTP responses, but upstream error payload details are deliberately not returned.
- The API key is a bootstrap Development control only, not an enterprise identity solution.

## Incident rule
Never log authorization headers, provider keys, raw request bodies, prompts, or completions. Treat provider responses and retrieved content as untrusted input.
