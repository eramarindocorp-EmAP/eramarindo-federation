# ERAMARINDO PEOPLE ASSESSMENT — Centralized Development

## Approved implementation baseline
- Scope: all Eramarindo departments.
- Initial pilot: 10 participants.
- Source control and static delivery: GitHub repository `eramarindo-federation`.
- Identity and database: Supabase project `rlpkhatlemuhmmzeuzqf` (Eramarindo Project & Ecosystem).
- Supabase region: `ap-southeast-2`; PostgreSQL 17.
- Portal path: `/people-assessment/` when published from the `public/people-assessment` folder.

## Deployed database objects
The following tables were created in the selected Supabase project:
- `pa_departments`, `pa_positions`, `pa_profiles`
- `pa_programs`, `pa_questions`, `pa_question_keys`
- `pa_assignments`, `pa_attempts`, `pa_answers`
- `pa_reviews`, `pa_development_actions`, `pa_audit_events`

All listed `pa_*` tables have Row Level Security enabled. User creation triggers a participant profile with the least-privilege default role. HR role assignment and employee profile administration must be performed by an authorized administrator. Never trust user-editable metadata as an authorization claim.

### Role boundaries
- Participant: own profile, own assigned program, own attempt and answers while draft.
- Assessor: assigned participants and reviews only for their assignments.
- Human Capital: administration of People Assessment records and assignments.
- Director: assignment metadata visibility; executive reporting should use aggregate views and should not expose raw answers by default.

Question scoring keys are stored separately in `pa_question_keys`, with HR-only RLS. They are not returned with participant question records.

Audit events are generated for assignment, attempt, review, and development-action mutations. Audit records are read-only to normal authenticated clients and visible to Human Capital.

## Portal authentication
The portal uses Supabase Auth email/password sign-in and a publishable API key. The publishable key is intended for browser use; it is not a service-role credential. No service-role key or database password is stored in this repository.

Create/invite accounts through the Supabase Auth administrator workflow. The profile trigger creates new accounts as `participant`. An administrator must verify employee identity and assign department, position, employee number, and elevated role before access is granted. Do not allow self-registration or role self-escalation.

## Deployment
GitHub Actions publishes `public/people-assessment` via GitHub Pages. Enable Pages with GitHub Actions in repository settings. The site is not confirmed live until the Pages workflow succeeds and the resulting URL is tested.

## Current limitations / required next controls
1. Confirm Supabase Auth email/password and invite-only settings in the project dashboard.
2. Configure authorized redirect URLs for the final GitHub Pages URL.
3. Create and verify the first Human Capital administrator securely; no privileged user was seeded by this change.
4. Review Supabase Security Advisor warnings, especially anonymous-sign-in configuration and permissive policy overlap. Do not enable anonymous sign-ins.
5. Add a restricted aggregate reporting view for Director dashboards.
6. Implement the full assessment-taking and assessor-review forms against the database; current portal is authenticated and reads assignment data, not yet the complete workflow.
7. Run two-account RLS tests (participant A cannot read participant B; assessor A cannot read unassigned participants; HR administration works; Director sees approved aggregates only).
8. Load only the approved, verified question bank after ownership, copyright, scoring key and version control are confirmed.
9. Complete privacy, retention, consent, and security review before processing real employee assessment data.

## Operational note
The Supabase schema was applied to the selected development project through the managed Supabase migration action. Keep future schema changes in reviewed SQL migration files and apply them through the approved migration workflow. Do not store real employee answers, reports, or personal data in GitHub.
