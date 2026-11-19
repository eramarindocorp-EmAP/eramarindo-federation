-- ERAMARINDO PEOPLE ASSESSMENT — Development proposal
-- IMPORTANT: This migration is NOT approved for execution yet.
-- Apply only after Founder approval, schema inspection, and security review.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists public.emap_employee_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  employee_no text not null unique,
  full_name text not null,
  department text not null,
  division text,
  job_title text not null,
  location text,
  employment_status text not null default 'active'
    check (employment_status in ('active','inactive','on_leave','contract_ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emap_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('participant','assessor','hr','director')),
  department_scope text,
  is_active boolean not null default true,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (user_id, role, department_scope)
);

create table if not exists public.emap_assessment_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_code text not null unique,
  title text not null,
  description text,
  bank_version text not null default 'EMAP-FLASHCARD-2026.1',
  status text not null default 'draft'
    check (status in ('draft','published','closed','archived')),
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at > opens_at)
);

create table if not exists public.emap_assessment_questions (
  id bigint generated always as identity primary key,
  question_code text not null unique,
  bank_version text not null,
  topic_code text not null,
  topic_name text not null,
  department_domain text,
  objective text,
  prompt text not null,
  response_type text not null
    check (response_type in ('scale_1_5','single_choice','multiple_choice','text')),
  options jsonb not null default '[]'::jsonb,
  scoring_guide jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.emap_assessment_assignments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.emap_assessment_campaigns(id) on delete restrict,
  participant_id uuid not null references public.emap_employee_profiles(user_id) on delete restrict,
  assessor_id uuid references public.emap_employee_profiles(user_id) on delete restrict,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','submitted','under_review','evaluated','follow_up_required','cancelled')),
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  evaluated_at timestamptz,
  due_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, participant_id),
  check (assessor_id is null or assessor_id <> participant_id)
);

create table if not exists public.emap_assessment_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.emap_assessment_assignments(id) on delete cascade,
  question_id bigint not null references public.emap_assessment_questions(id) on delete restrict,
  answer jsonb not null,
  evidence text,
  answered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, question_id)
);

create table if not exists public.emap_observation_dimensions (
  id smallint generated always as identity primary key,
  dimension_code text not null unique,
  label text not null,
  description text not null,
  weight numeric(5,2) not null default 1.00 check (weight > 0),
  is_active boolean not null default true
);

create table if not exists public.emap_assessor_observations (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.emap_assessment_assignments(id) on delete cascade,
  dimension_id smallint not null references public.emap_observation_dimensions(id) on delete restrict,
  assessor_id uuid not null references public.emap_employee_profiles(user_id) on delete restrict,
  score smallint not null check (score between 1 and 5),
  evidence text not null,
  observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, dimension_id)
);

create table if not exists public.emap_assessment_reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.emap_assessment_assignments(id) on delete cascade,
  reviewer_id uuid not null references public.emap_employee_profiles(user_id) on delete restrict,
  review_status text not null default 'pending'
    check (review_status in ('pending','verified','returned_for_revision')),
  overall_notes text not null,
  recommendation text not null
    check (recommendation in ('maintain_and_develop','coaching_required','retraining_required','clarification_required')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emap_assessment_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  assignment_id uuid references public.emap_assessment_assignments(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists emap_roles_user_role_idx on public.emap_user_roles(user_id, role) where is_active;
create index if not exists emap_assignments_participant_idx on public.emap_assessment_assignments(participant_id, status);
create index if not exists emap_assignments_assessor_idx on public.emap_assessment_assignments(assessor_id, status);
create index if not exists emap_assignments_campaign_idx on public.emap_assessment_assignments(campaign_id, status);
create index if not exists emap_responses_assignment_idx on public.emap_assessment_responses(assignment_id);
create index if not exists emap_observations_assignment_idx on public.emap_assessor_observations(assignment_id);
create index if not exists emap_audit_assignment_idx on public.emap_assessment_audit_events(assignment_id, created_at desc);

create or replace function private.emap_has_role(_role text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.emap_user_roles r
    where r.user_id = (select auth.uid())
      and r.role = _role
      and r.is_active
  );
$$;

create or replace function private.emap_is_assessor_for(_participant_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.emap_assessment_assignments a
    where a.assessor_id = (select auth.uid())
      and a.participant_id = _participant_id
  );
$$;

create or replace function private.emap_can_access_assignment(_assignment_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.emap_assessment_assignments a
    where a.id = _assignment_id
      and (
        a.participant_id = (select auth.uid())
        or a.assessor_id = (select auth.uid())
        or private.emap_has_role('hr')
        or private.emap_has_role('director')
      )
  );
$$;

create or replace function private.emap_is_assigned_assessor(_assignment_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.emap_assessment_assignments a
    where a.id = _assignment_id
      and a.assessor_id = (select auth.uid())
  );
$$;

revoke all on all functions in schema private from public, anon;
grant execute on function private.emap_has_role(text) to authenticated;
grant execute on function private.emap_is_assessor_for(uuid) to authenticated;
grant execute on function private.emap_can_access_assignment(uuid) to authenticated;
grant execute on function private.emap_is_assigned_assessor(uuid) to authenticated;

alter table public.emap_employee_profiles enable row level security;
alter table public.emap_user_roles enable row level security;
alter table public.emap_assessment_campaigns enable row level security;
alter table public.emap_assessment_questions enable row level security;
alter table public.emap_assessment_assignments enable row level security;
alter table public.emap_assessment_responses enable row level security;
alter table public.emap_observation_dimensions enable row level security;
alter table public.emap_assessor_observations enable row level security;
alter table public.emap_assessment_reviews enable row level security;
alter table public.emap_assessment_audit_events enable row level security;

create policy "employee profile visible to owner and authorized roles"
on public.emap_employee_profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or private.emap_has_role('hr')
  or private.emap_has_role('director')
  or private.emap_is_assessor_for(user_id)
);
create policy "hr manages employee profiles"
on public.emap_employee_profiles for all to authenticated
using (private.emap_has_role('hr'))
with check (private.emap_has_role('hr'));

create policy "users see own roles; HR and directors see role assignments"
on public.emap_user_roles for select to authenticated
using (user_id = (select auth.uid()) or private.emap_has_role('hr') or private.emap_has_role('director'));
create policy "HR manages role assignments"
on public.emap_user_roles for all to authenticated
using (private.emap_has_role('hr'))
with check (private.emap_has_role('hr'));

create policy "published campaigns visible to signed-in employees"
on public.emap_assessment_campaigns for select to authenticated
using (status = 'published' or private.emap_has_role('hr') or private.emap_has_role('director'));
create policy "HR manages campaigns"
on public.emap_assessment_campaigns for all to authenticated
using (private.emap_has_role('hr'))
with check (private.emap_has_role('hr'));

create policy "active questions visible to authenticated employees"
on public.emap_assessment_questions for select to authenticated
using (is_active or private.emap_has_role('hr'));
create policy "HR manages question bank"
on public.emap_assessment_questions for all to authenticated
using (private.emap_has_role('hr'))
with check (private.emap_has_role('hr'));

create policy "assignment visible to participant assessor HR and directors"
on public.emap_assessment_assignments for select to authenticated
using (
  participant_id = (select auth.uid())
  or assessor_id = (select auth.uid())
  or private.emap_has_role('hr')
  or private.emap_has_role('director')
);
create policy "HR creates and manages assignments"
on public.emap_assessment_assignments for all to authenticated
using (private.emap_has_role('hr'))
with check (private.emap_has_role('hr'));
create policy "participant updates own active assignment"
on public.emap_assessment_assignments for update to authenticated
using (participant_id = (select auth.uid()) and status in ('not_started','in_progress'))
with check (participant_id = (select auth.uid()) and status in ('in_progress','submitted'));

create policy "responses visible to authorized assignment members"
on public.emap_assessment_responses for select to authenticated
using (private.emap_can_access_assignment(assignment_id));
create policy "participant inserts own responses while in progress"
on public.emap_assessment_responses for insert to authenticated
with check (
  exists (
    select 1 from public.emap_assessment_assignments a
    where a.id = assignment_id
      and a.participant_id = (select auth.uid())
      and a.status = 'in_progress'
  )
);
create policy "participant updates own responses while in progress"
on public.emap_assessment_responses for update to authenticated
using (
  exists (
    select 1 from public.emap_assessment_assignments a
    where a.id = assignment_id
      and a.participant_id = (select auth.uid())
      and a.status = 'in_progress'
  )
)
with check (
  exists (
    select 1 from public.emap_assessment_assignments a
    where a.id = assignment_id
      and a.participant_id = (select auth.uid())
      and a.status = 'in_progress'
  )
);

create policy "observation dimensions readable by authenticated"
on public.emap_observation_dimensions for select to authenticated using (is_active or private.emap_has_role('hr'));
create policy "HR manages observation dimensions"
on public.emap_observation_dimensions for all to authenticated
using (private.emap_has_role('hr'))
with check (private.emap_has_role('hr'));

create policy "observations visible to participant assessor HR and directors"
on public.emap_assessor_observations for select to authenticated
using (private.emap_can_access_assignment(assignment_id));
create policy "assigned assessor writes observations"
on public.emap_assessor_observations for insert to authenticated
with check (
  assessor_id = (select auth.uid())
  and private.emap_is_assigned_assessor(assignment_id)
);
create policy "assigned assessor updates observations"
on public.emap_assessor_observations for update to authenticated
using (assessor_id = (select auth.uid()) and private.emap_is_assigned_assessor(assignment_id))
with check (assessor_id = (select auth.uid()) and private.emap_is_assigned_assessor(assignment_id));

create policy "review visible to participant after verification and HR directors"
on public.emap_assessment_reviews for select to authenticated
using (
  private.emap_has_role('hr')
  or private.emap_has_role('director')
  or (
    review_status = 'verified'
    and exists (
      select 1 from public.emap_assessment_assignments a
      where a.id = assignment_id and a.participant_id = (select auth.uid())
    )
  )
);
create policy "HR verifies and manages assessment reviews"
on public.emap_assessment_reviews for all to authenticated
using (private.emap_has_role('hr'))
with check (private.emap_has_role('hr'));

create policy "audit events visible to HR and directors"
on public.emap_assessment_audit_events for select to authenticated
using (private.emap_has_role('hr') or private.emap_has_role('director'));

grant select on public.emap_employee_profiles, public.emap_user_roles,
  public.emap_assessment_campaigns, public.emap_assessment_questions,
  public.emap_assessment_assignments, public.emap_assessment_responses,
  public.emap_observation_dimensions, public.emap_assessor_observations,
  public.emap_assessment_reviews, public.emap_assessment_audit_events
to authenticated;
grant insert, update on public.emap_assessment_assignments to authenticated;
grant insert, update on public.emap_assessment_responses to authenticated;
grant insert, update on public.emap_assessor_observations to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into public.emap_observation_dimensions (dimension_code,label,description,weight)
values
 ('INTEGRITY','Integritas & etika','Kejujuran, konsistensi, kepatuhan, dan pengelolaan konflik kepentingan.',1),
 ('ROLE_CLARITY','Pemahaman peran','Kejelasan tugas, tanggung jawab, kewenangan, dan batas eskalasi.',1),
 ('JOB_COMPETENCE','Kompetensi pekerjaan','Ketepatan proses, mutu hasil, dan penerapan pengetahuan.',1),
 ('SOP_DISCIPLINE','Disiplin SOP & dokumentasi','Kepatuhan prosedur, ketertelusuran, dan kelengkapan bukti.',1),
 ('COLLABORATION','Kolaborasi lintas departemen','Koordinasi, komunikasi, handover, dan penyelesaian masalah.',1),
 ('RISK_SAFETY','Kesadaran risiko & keselamatan','Identifikasi bahaya/risiko, mitigasi, dan pelaporan.',1),
 ('ACCOUNTABILITY','Akuntabilitas & inisiatif','Kepemilikan hasil, ketepatan tindak lanjut, dan usulan perbaikan.',1),
 ('CULTURE','Budaya & profesionalisme','Sikap hormat, kedisiplinan, layanan, dan perilaku kerja konstruktif.',1)
on conflict (dimension_code) do update
set label = excluded.label, description = excluded.description, weight = excluded.weight;

commit;
