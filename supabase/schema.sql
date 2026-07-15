-- ============================================================================
-- Communist Party of Ethiopia (PC-CPE) / የኢትዮጵያ ኮሚኒስት ፓርቲ (ኢኮፓ)
-- Database schema — safe to re-run: every statement is idempotent, so you can
-- paste this whole file into the Supabase SQL Editor again to apply fixes.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (admin accounts only — regular visitors never get a row)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'admin' check (role in ('super-admin', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ----------------------------------------------------------------------------
-- 1a. ROLE-CHECK HELPER FUNCTIONS (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
-- IMPORTANT: policies on `profiles` must never query `profiles` directly inside
-- their own USING clause — Postgres detects that as infinite recursion and
-- throws "infinite recursion detected in policy for relation profiles" on
-- EVERY query against the table, including your own login's role check. That
-- was the bug blocking admin access. The fix: put the lookup inside a
-- SECURITY DEFINER function. Such a function runs as its owner (the table
-- owner, which bypasses RLS by default), so its internal SELECT does not
-- re-trigger the calling policy.
create or replace function public.is_active_super_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'super-admin' and status = 'active'
  );
$$;

create or replace function public.is_active_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('admin', 'super-admin') and status = 'active'
  );
$$;

grant execute on function public.is_active_super_admin(uuid) to anon, authenticated;
grant execute on function public.is_active_admin(uuid) to anon, authenticated;

-- Drop old policies (if this is a re-run against an existing project) before
-- recreating the fixed versions.
drop policy if exists "profiles_select_self" on public.profiles;
drop policy if exists "profiles_select_all_for_superadmin" on public.profiles;
drop policy if exists "profiles_update_superadmin_only" on public.profiles;

-- A logged-in admin/super-admin can read their own row (needed to know their role client-side).
create policy "profiles_select_self"
  on public.profiles for select
  using (auth.uid() = id);

-- Super-admins can read every profile — uses the helper function, not a
-- self-referential subquery, to avoid the recursion bug above.
create policy "profiles_select_all_for_superadmin"
  on public.profiles for select
  using (public.is_active_super_admin(auth.uid()));

-- Only super-admins may update roles/status of OTHER profiles (server-side service-role
-- calls bypass RLS anyway — see /api/admin routes — this policy is defense-in-depth
-- for any direct client access attempts).
create policy "profiles_update_superadmin_only"
  on public.profiles for update
  using (public.is_active_super_admin(auth.uid()));

-- No direct client-side INSERT or DELETE. All admin creation/removal happens through
-- the /api/admin/* server routes using the Supabase service-role key, never the
-- anon/public key. This is intentional: regular admins should never be able to
-- self-provision or delete other admins directly against Postgres.
revoke insert, delete on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- 2. SUPER-ADMIN AUTO-PROVISIONING
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, status)
  values (
    new.id,
    new.email,
    case when lower(new.email) = 'billstanfordignis@gmail.com' then 'super-admin' else 'admin' end,
    'active'
  )
  on conflict (id) do update
    set role = case when lower(new.email) = 'billstanfordignis@gmail.com' then 'super-admin' else public.profiles.role end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- If you created your super-admin auth user BEFORE this trigger existed (or
-- before this fixed version of it existed), the trigger never ran for that
-- account. This backfills it — safe to run every time.
insert into public.profiles (id, email, role, status)
select id, email, 'super-admin', 'active'
from auth.users
where lower(email) = 'billstanfordignis@gmail.com'
on conflict (id) do update set role = 'super-admin', status = 'active';

-- ----------------------------------------------------------------------------
-- 3. POLLS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_am text not null,
  description_en text,
  description_am text,
  schema jsonb not null,
  is_active boolean not null default false,
  is_exempt boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.polls enable row level security;

drop policy if exists "polls_select_active_public" on public.polls;
drop policy if exists "polls_select_all_for_admins" on public.polls;
drop policy if exists "polls_write_admins_only" on public.polls;

create policy "polls_select_active_public"
  on public.polls for select
  using (is_active = true);

create policy "polls_select_all_for_admins"
  on public.polls for select
  using (public.is_active_admin(auth.uid()));

create policy "polls_write_admins_only"
  on public.polls for all
  using (public.is_active_admin(auth.uid()))
  with check (public.is_active_admin(auth.uid()));

grant select on public.polls to anon, authenticated;
grant insert, update, delete on public.polls to authenticated;

-- ----------------------------------------------------------------------------
-- 4. SUBMISSIONS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  member_id text unique not null,

  full_name text not null,
  pseudonym text not null,
  contact_method text not null,
  location text not null,
  region_city text,

  ideology text not null,
  ideology_other text,
  essay_state text not null,
  essay_national_question text not null,
  essay_abiy text not null,
  essay_class_struggle text not null,

  time_commitment text not null,
  skills text[] not null default '{}',
  skills_other text,
  translation_languages text,
  experience text not null,
  security_understanding text not null,

  accepted_democratic_centralism boolean not null default false,
  accepted_oath boolean not null default false,
  interest_statement text not null,

  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_submissions_member_id on public.submissions(member_id);
create index if not exists idx_submissions_poll_id on public.submissions(poll_id);
create index if not exists idx_submissions_created_at on public.submissions(created_at desc);

alter table public.submissions enable row level security;

drop policy if exists "submissions_insert_public" on public.submissions;
drop policy if exists "submissions_select_admins_only" on public.submissions;
drop policy if exists "submissions_delete_admins_only" on public.submissions;

create policy "submissions_insert_public"
  on public.submissions for insert
  with check (true);

create policy "submissions_select_admins_only"
  on public.submissions for select
  using (public.is_active_admin(auth.uid()));

create policy "submissions_delete_admins_only"
  on public.submissions for delete
  using (public.is_active_admin(auth.uid()));

revoke update on public.submissions from anon, authenticated;
grant insert on public.submissions to anon, authenticated;
grant select, delete on public.submissions to authenticated;

-- ----------------------------------------------------------------------------
-- 5. MEMBER ID GENERATOR
-- ----------------------------------------------------------------------------
create or replace function public.generate_member_id()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'OBS-';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. SEED: the Membership Interest Form poll (active)
-- ----------------------------------------------------------------------------
insert into public.polls (slug, title_en, title_am, is_active, is_exempt, schema)
values (
  'membership-interest-form',
  'Communist Party of Ethiopia (PC-CPE) — Membership Interest Form',
  'የኢትዮጵያ ኮሚኒስት ፓርቲ (ኢኮፓ) — የአባልነት ፍላጎት መጠይቅ',
  true,
  true,
  '{"version": 1, "sections": 4, "questions": 15}'::jsonb
)
on conflict (slug) do nothing;

-- ============================================================================
-- If you already ran an earlier version of this file: this whole script is
-- safe to paste in again — it will drop and recreate the fixed policies,
-- backfill your super-admin profile row, and leave existing data untouched.
-- ============================================================================
