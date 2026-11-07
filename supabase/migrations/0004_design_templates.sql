-- Golf Pulse – 0004: pastel accent colours and saved, named sessions ("session templates").
-- Run once in the Supabase SQL editor AFTER 0003_achievements.sql.

-- 1. Accent colours: the four pastel accents replace the saturated ones (old values are mapped).
alter table public.profiles drop constraint if exists profiles_accent_check;
update public.profiles set accent = case upper(accent)
  when '#3DFFA2' then '#9BE3C3' when '#2FD6F5' then '#A2D8FF' when '#FF6B4A' then '#FFC0A3' when '#FFD23F' then '#FFC0A3'
  else accent end;
update public.profiles set accent = '#9BE3C3' where upper(accent) not in ('#9BE3C3', '#A2D8FF', '#FFC0A3', '#D9C5FF');
alter table public.profiles alter column accent set default '#9BE3C3';
alter table public.profiles add constraint profiles_accent_check check (upper(accent) in ('#9BE3C3', '#A2D8FF', '#FFC0A3', '#D9C5FF'));

-- 2. Saved sessions: a named list of drills built in the session builder, started from the home screen.
create table if not exists public.session_templates (
  id uuid primary key,                       -- generated on the client (offline-first, idempotent sync)
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  drill_ids text[] not null check (cardinality(drill_ids) between 1 and 20),
  deleted boolean not null default false,    -- soft delete so other devices learn about it
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists session_templates_user on public.session_templates (user_id, updated_at desc);
alter table public.session_templates enable row level security;
create policy templates_own on public.session_templates for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.session_templates from anon;

-- Every drill id must exist and be visible to the owner (seed drills or own / shared custom drills).
create or replace function public.validate_session_template() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from unnest(new.drill_ids) d(id) where not exists (
      select 1 from drills x where x.id = d.id and (x.owner_id is null or x.owner_id = new.user_id or x.shared))) then
    raise exception 'unknown drill in template' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists session_templates_validate on public.session_templates;
create trigger session_templates_validate before insert or update on public.session_templates
  for each row execute function public.validate_session_template();
revoke execute on function public.validate_session_template() from public, anon, authenticated;
