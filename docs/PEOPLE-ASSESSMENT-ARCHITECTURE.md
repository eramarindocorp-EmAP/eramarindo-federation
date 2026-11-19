# ERAMARINDO PEOPLE ASSESSMENT — Centralized Architecture

**Status:** Development proposal / Draft PR  
**Target:** Supabase Development project `rlpkhatlemuhmmzeuzqf`  
**Production:** untouched  
**Migration execution:** blocked pending Founder approval and database connection recovery

## 1. Objective

One company-wide assessment service with a central record for every employee, assessment campaign, response, assessor observation, HR verification, and development action. Department dashboards are filtered views over the same central data, not separate databases.

## 2. User roles and access

| Role | Permitted access |
|---|---|
| Participant | Own profile (read), own assigned assessment, own responses while open, own verified result |
| Assessor | Assigned participants only; submitted responses; assigned observation forms and evidence |
| HR | Employee roster, campaign/question administration, assessor assignment, all assessment records, verification and follow-up |
| Director | Read-only company-wide and department-level dashboards, verified results, risk and progress summaries |

Role grants must be administered by HR through an audited workflow. Do not authorize users from editable user metadata. A department scope is required for future least-privilege delegation; director access is read-only.

## 3. Central data model

- `emap_employee_profiles`: canonical employee identity linked to Supabase Auth UUID.
- `emap_user_roles`: participant / assessor / HR / director role assignments.
- `emap_assessment_campaigns`: assessment period, version, publication and closing windows.
- `emap_assessment_questions`: versioned question bank and response schema.
- `emap_assessment_assignments`: one participant, one campaign, one designated assessor, status and due dates.
- `emap_assessment_responses`: one response per question per assignment, with evidence and timestamps.
- `emap_observation_dimensions`: controlled observation rubric (eight dimensions).
- `emap_assessor_observations`: score 1–5 and mandatory evidence per dimension.
- `emap_assessment_reviews`: HR verification, notes, recommendation and release status.
- `emap_assessment_audit_events`: append-only event history for traceability.

A campaign-question join table is required to bind each campaign to the exact versioned question set. Question bank import must be validated against the 5,500-item approved source before publication; generated prompts must not be treated as a validated answer key.

## 4. Assessment lifecycle

`not_started → in_progress → submitted → under_review → evaluated`

Alternative terminal/exception states: `follow_up_required`, `cancelled`.

- Participant can edit responses only while `in_progress`.
- Submission locks participant responses.
- Assessor can review only assigned participants.
- Assessor records eight observation dimensions, each with score and evidence.
- HR verifies completeness, consistency, assignment integrity and recommendation.
- Participant can see the released/verified result and raise a clarification request.
- Director sees aggregated monitoring and verified individual results according to policy.
- Any reopening or correction creates an audit event and requires authorized approval.

## 5. Scoring policy

Observation average is the arithmetic mean of eight dimensions (1–5), unless HR formally approves weighted scoring. Display knowledge assessment separately from behavioral observation. The current HTML form's self-rating is not a validated knowledge test score. Objective question scoring requires an approved answer key/rubric and subject-matter review.

Suggested observation bands:
- 4.50–5.00: very strong
- 3.75–4.49: meets expectations
- 3.00–3.74: targeted strengthening
- 1.00–2.99: intensive development plan

These bands are proposed and require HR policy approval before use in employment decisions.

## 6. Security and privacy

- Enable RLS on every exposed table.
- No anonymous access.
- Use authenticated access with least-privilege grants and row-level policies.
- Participant sees only their own record; assessor sees assigned records only; HR administers; director is read-only.
- Authorization derives from server-controlled role records / trusted app metadata, never editable user metadata.
- No service-role key in browser code.
- Private evidence storage; signed, short-lived URLs; file type/size limits; malware scanning before broad use.
- Audit changes to assignments, responses, observations, reviews, status transitions and role grants.
- Use security-invoker views for dashboard aggregates where applicable.
- Apply retention, access review, correction, appeal, and incident-response policy before launch.

## 7. Dashboard surfaces

1. Participant: assignment, progress, draft/resume, submit, result and development actions.
2. Assessor: assigned queue, due dates, response review, rubric, evidence and submission.
3. HR Control Center: roster, campaign management, completion matrix, assessor workload, validation, exception queue and follow-up.
4. Director Executive Dashboard: enterprise/department completion, status distribution, verified score bands, high-level competency gaps and action closure. Sensitive narrative notes are not exposed by default.

## 8. Implementation sequence

1. Inspect existing Development schema and resolve Supabase database connector authentication failure.
2. Founder approves the exact migration and RLS policy set.
3. Apply migration to Development only; run schema and RLS tests with four test identities.
4. Import approved 5,500 question bank and validate count, uniqueness, topic distribution and version.
5. Build Auth onboarding and employee-to-Auth identity mapping.
6. Build participant, assessor, HR and director views over the same database.
7. Test access isolation, submission lock, assessor assignment boundaries, HR verification and audit trace.
8. Run UAT with a small approved pilot; only then prepare a separate release decision.

## 9. Release gates

No Production deployment, database migration execution, broad employee import, or access to live personnel records is included in this Draft PR. These require explicit Founder approval and a separate security/privacy review.
