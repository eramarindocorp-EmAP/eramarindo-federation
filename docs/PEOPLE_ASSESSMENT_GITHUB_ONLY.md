# ERAMARINDO PEOPLE ASSESSMENT — GitHub-only Development Preview

## Scope
This branch provides a static GitHub Pages preview of the centralized People Assessment experience. It demonstrates the participant, assessor, Human Capital, and Director views and the intended assessment workflow.

## Important platform boundary
GitHub Pages is static hosting. It does not provide:
- Company identity authentication or password management.
- A shared transactional database.
- Row-level access control for individual assessment records.
- Secure assessor assignment, immutable submissions, or application audit logs.

The current preview therefore uses fictional sample records and browser-local demo storage only. Do not enter real employee names, employee IDs, assessment answers, assessor notes, or other personal data. The role selector is a UI preview, not a security boundary. The demo roster and KPI figures are illustrative, not company results.

## Intended production model
A production centralized system must provide:
1. Verified user identity and role assignment.
2. Server-enforced authorization for Participant, Assessor, Human Capital, and Director.
3. Participant access limited to their own records.
4. Assessor access limited to assigned participants; self-assessment conflicts blocked.
5. Human Capital access scoped to its approved operational mandate.
6. Director dashboards using aggregated reporting, with individual access only where authorized.
7. Server-side submission locking, versioned question banks, audit trail, retention policy, and export controls.
8. Independent security review and privacy/legal approval before real employee data is processed.

## GitHub Pages deployment
The workflow `.github/workflows/people-assessment-pages.yml` publishes the contents of `public/people-assessment` when manually triggered or when that folder changes on `feat/people-assessment-centralized`.

Repository settings must allow GitHub Pages deployments using GitHub Actions. The repository is private; whether the resulting Pages site can be accessed privately depends on the GitHub plan and organization settings. Do not change repository visibility to public merely to make the preview available.

## Development safeguards
- No credentials or secrets are embedded in browser JavaScript.
- No real employee records are included.
- Do not store employee assessment records in Git commits, Issues, Pull Requests, or repository files.
- A GitHub-only static deployment is a preview, not a secure centralized employee assessment platform.
