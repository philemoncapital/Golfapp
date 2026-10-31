-- Golf Pulse – initial schema with Row Level Security.
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists pgcrypto;

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  language text not null default 'de' check (language in ('de','en')),
  real_hcp numeric(4,1) check (real_hcp between -10 and 54),
  weekly_goal_min int not null default 180 check (weekly_goal_min between 0 and 3000),
  results_visibility text not null default 'friends' check (results_visibility in ('nobody','friends','groups')),
  show_real_hcp boolean not null default true,
  hide_last_place_titles boolean not null default false,
  accent text not null default '#3DFFA2' check (accent in ('#3DFFA2','#FF6B4A','#FFD23F','#2FD6F5')),
  created_at timestamptz not null default now()
);

create table public.hcp_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  real_hcp numeric(4,1) not null check (real_hcp between -10 and 54),
  recorded_at timestamptz not null default now()
);

-- Create a profile automatically on sign-up (display name from sign-up metadata).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, language)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)),
          coalesce(new.raw_user_meta_data->>'language','de'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Social ----------
create table public.friendships (
  id bigint generated always as identity primary key,
  requester uuid not null references public.profiles(id) on delete cascade,
  addressee uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (requester, addressee),
  check (requester <> addressee)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  owner uuid not null references public.profiles(id) on delete cascade,
  titles_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member')),
  status text not null default 'invited' check (status in ('invited','active')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from friendships f where f.status = 'accepted'
    and ((f.requester = a and f.addressee = b) or (f.requester = b and f.addressee = a)));
$$;

create function public.share_group(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members m1 join group_members m2 using (group_id)
    where m1.user_id = a and m2.user_id = b and m1.status = 'active' and m2.status = 'active');
$$;

create function public.is_group_member(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = g and user_id = u and status = 'active');
$$;

-- Can `viewer` see the training results of `owner`?
create function public.can_view_results(viewer uuid, owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select viewer = owner or exists (
    select 1 from profiles p where p.id = owner and (
      (p.results_visibility = 'friends' and (are_friends(viewer, owner) or share_group(viewer, owner))) or
      (p.results_visibility = 'groups' and share_group(viewer, owner))));
$$;

-- ---------- Drills ----------
create table public.drills (
  id text primary key,
  owner_id uuid references public.profiles(id) on delete cascade, -- null = seed drill
  source text not null check (source in ('booklet','approach_research','custom')),
  area text not null check (area in ('range','pitching','bunker','chipping','putting')),
  category text not null check (category in ('tee','approach','short','putting')),
  title text not null,
  seen_with text,
  duration_min int not null check (duration_min between 1 and 120),
  difficulty int not null check (difficulty between 1 and 6),
  shot_type text not null,
  equipment jsonb not null default '{}'::jsonb,
  text jsonb not null,           -- { de: {...}, en: {...} }
  scoring jsonb not null,        -- see src/engine/types.ts
  pictogram jsonb,
  sources jsonb not null default '[]'::jsonb,
  shared boolean not null default false,
  needs_verification text,
  created_at timestamptz not null default now()
);

-- ---------- Training ----------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'planned' check (status in ('planned','started','completed')),
  total_min int not null default 0 check (total_min between 0 and 600),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.session_drills (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  drill_id text not null references public.drills(id),
  position int not null,
  planned_min int not null check (planned_min between 1 and 120),
  actual_min int check (actual_min between 0 and 240),
  notes text check (char_length(notes) <= 2000)
);

create table public.drill_results (
  id uuid primary key,  -- generated on the client so offline results sync idempotently
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_drill_id uuid references public.session_drills(id) on delete set null,
  drill_id text not null references public.drills(id),
  input jsonb not null,            -- raw ResultInput
  score numeric,                   -- server-computed (Phase 4 edge function)
  drill_hcp numeric(4,1),          -- server-computed (Phase 4 edge function)
  created_at timestamptz not null default now()
);
create index on public.drill_results (user_id, drill_id, created_at desc);

create table public.round_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  played_on date not null,
  score int check (score between 50 and 200),
  fairways_hit int, fairways_possible int,
  gir int, putts int, up_downs_made int, up_downs_attempted int, penalties int,
  created_at timestamptz not null default now()
);

-- ---------- Recommendations, titles, achievements ----------
create table public.sources (
  id bigint generated always as identity primary key,
  title text not null, author text, url text not null, accessed_at date not null, note text
);
create table public.recommendations (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('initial','review')),
  split jsonb not null, rationale jsonb not null, source_ids bigint[] not null default '{}',
  created_at timestamptz not null default now()
);
create table public.group_titles (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups(id) on delete cascade,
  board text not null check (board in ('tee','approach','short','putting','overall')),
  title_type text not null check (title_type in ('leader','last')),
  user_id uuid not null references public.profiles(id) on delete cascade,
  since date not null, until date
);
create table public.achievement_defs (
  key text primary key,
  kind text not null check (kind in ('medal','achievement','title_badge')),
  tiers jsonb, name_en text not null, name_de text not null, pictogram text not null
);
create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null references public.achievement_defs(key),
  tier text, progress jsonb, earned_at timestamptz,
  primary key (user_id, key)
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.hcp_history enable row level security;
alter table public.friendships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.drills enable row level security;
alter table public.sessions enable row level security;
alter table public.session_drills enable row level security;
alter table public.drill_results enable row level security;
alter table public.round_stats enable row level security;
alter table public.sources enable row level security;
alter table public.recommendations enable row level security;
alter table public.group_titles enable row level security;
alter table public.achievement_defs enable row level security;
alter table public.user_achievements enable row level security;

-- Profiles: every signed-in user may read non-sensitive columns (needed for friend search);
-- real_hcp is only exposed through profile_public (respecting show_real_hcp) or my_profile().
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke all on public.profiles from anon, authenticated;
grant select (id, display_name, language, weekly_goal_min, results_visibility, show_real_hcp, hide_last_place_titles, accent, created_at)
  on public.profiles to authenticated;
grant update (display_name, language, real_hcp, weekly_goal_min, results_visibility, show_real_hcp, hide_last_place_titles, accent)
  on public.profiles to authenticated;

-- Owner-privileged view (intentionally not security_invoker): exposes real_hcp only to self, or to
-- friends / group mates when the owner allows it.
create view public.profile_public as
  select id, display_name,
         case when id = auth.uid() or (show_real_hcp and (are_friends(auth.uid(), id) or share_group(auth.uid(), id)))
              then real_hcp end as real_hcp
  from public.profiles;
revoke all on public.profile_public from anon;
grant select on public.profile_public to authenticated;

create function public.my_profile() returns public.profiles
language sql stable security definer set search_path = public as $$ select * from profiles where id = auth.uid() $$;

create policy hcp_history_own on public.hcp_history for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy friendships_read on public.friendships for select to authenticated using (auth.uid() in (requester, addressee));
create policy friendships_request on public.friendships for insert to authenticated with check (requester = auth.uid() and status = 'pending');
create policy friendships_answer on public.friendships for update to authenticated using (addressee = auth.uid()) with check (addressee = auth.uid());
create policy friendships_delete on public.friendships for delete to authenticated using (auth.uid() in (requester, addressee));

create policy groups_read on public.groups for select to authenticated using (owner = auth.uid() or exists (select 1 from group_members m where m.group_id = groups.id and m.user_id = auth.uid()));
create policy groups_create on public.groups for insert to authenticated with check (owner = auth.uid());
create policy groups_update on public.groups for update to authenticated using (owner = auth.uid());
create policy groups_delete on public.groups for delete to authenticated using (owner = auth.uid());

create policy gm_read on public.group_members for select to authenticated using (user_id = auth.uid() or is_group_member(group_id, auth.uid()));
create policy gm_invite on public.group_members for insert to authenticated with check (
  exists (select 1 from groups g where g.id = group_id and g.owner = auth.uid()) and (user_id = auth.uid() or are_friends(auth.uid(), user_id)));
create policy gm_accept on public.group_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and role = 'member');
create policy gm_leave on public.group_members for delete to authenticated using (user_id = auth.uid() or exists (select 1 from groups g where g.id = group_id and g.owner = auth.uid()));

create policy drills_read on public.drills for select to authenticated using (
  owner_id is null or owner_id = auth.uid() or (shared and (are_friends(auth.uid(), owner_id) or share_group(auth.uid(), owner_id))));
create policy drills_write on public.drills for insert to authenticated with check (owner_id = auth.uid() and source = 'custom');
create policy drills_update on public.drills for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and source = 'custom');
create policy drills_delete on public.drills for delete to authenticated using (owner_id = auth.uid());

create policy sessions_own on public.sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sessions_view on public.sessions for select to authenticated using (can_view_results(auth.uid(), user_id));
create policy sd_own on public.session_drills for all to authenticated
  using (exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy results_insert on public.drill_results for insert to authenticated with check (user_id = auth.uid() and score is null and drill_hcp is null);
create policy results_read on public.drill_results for select to authenticated using (can_view_results(auth.uid(), user_id));
create policy results_delete on public.drill_results for delete to authenticated using (user_id = auth.uid());

create policy rounds_own on public.round_stats for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sources_read on public.sources for select to authenticated using (true);
create policy recs_own on public.recommendations for select to authenticated using (user_id = auth.uid());
create policy titles_read on public.group_titles for select to authenticated using (is_group_member(group_id, auth.uid()));
create policy adefs_read on public.achievement_defs for select to authenticated using (true);
create policy ua_read on public.user_achievements for select to authenticated using (can_view_results(auth.uid(), user_id));
-- recommendations, group_titles, user_achievements, drill_results.score/drill_hcp are written only by
-- server-side functions (service role / security definer), never by clients.
