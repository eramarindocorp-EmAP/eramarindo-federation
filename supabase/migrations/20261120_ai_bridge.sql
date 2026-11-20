create extension if not exists pgcrypto;

create table if not exists public.ai_bridge_tasks (
  task_id text primary key,
  sender_agent text not null,
  recipient_agent text not null,
  status text not null check (status in ('queued','processing','completed','failed')),
  message text not null,
  context jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.ai_bridge_nonces (
  agent_id text not null,
  nonce text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (agent_id, nonce)
);

create table if not exists public.ai_bridge_events (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references public.ai_bridge_tasks(task_id) on delete cascade,
  event_type text not null,
  actor_agent text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_bridge_tasks_status_created_idx
  on public.ai_bridge_tasks(status, created_at desc);
create index if not exists ai_bridge_events_task_created_idx
  on public.ai_bridge_events(task_id, created_at asc);
create index if not exists ai_bridge_nonces_expiry_idx
  on public.ai_bridge_nonces(expires_at);

alter table public.ai_bridge_tasks enable row level security;
alter table public.ai_bridge_nonces enable row level security;
alter table public.ai_bridge_events enable row level security;

revoke all on public.ai_bridge_tasks from anon, authenticated;
revoke all on public.ai_bridge_nonces from anon, authenticated;
revoke all on public.ai_bridge_events from anon, authenticated;
grant all on public.ai_bridge_tasks to service_role;
grant all on public.ai_bridge_nonces to service_role;
grant all on public.ai_bridge_events to service_role;
