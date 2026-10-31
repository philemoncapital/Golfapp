-- Golf Pulse – 0002: server-side training-handicap engine, friends, groups, leaderboards, titles, feed.
-- Run once in the Supabase SQL editor AFTER 0001_init.sql. Safe to read top to bottom; no data is deleted.
--
-- Contents
--   1. Hardening of 0001 (column-level grants on friendships / group_members, helper EXECUTE rights)
--   2. Profile additions (timezone)
--   3. Server-side HCP engine (port of src/engine/handicap.ts) + trigger on drill_results
--   4. drill_results.session_id
--   5. Rate limits, user search, friend requests
--   6. Group RPCs (create / invite / respond / leave / remove / roles / titles toggle)
--   7. Leaderboards (category, overall, activity, per drill) and "my standings"
--   8. Fun titles (daily via pg_cron) and the group activity feed

-- =====================================================================================
-- 1. Hardening
-- =====================================================================================

-- friendships: the addressee may only change the status (0001 allowed rewriting `requester`,
-- which would have let anyone force a friendship). New requests go through request_friend().
revoke insert, update on public.friendships from anon, authenticated;
grant update (status) on public.friendships to authenticated;
drop policy if exists friendships_answer on public.friendships;
create policy friendships_answer on public.friendships for update to authenticated
  using (addressee = auth.uid()) with check (addressee = auth.uid() and status in ('accepted', 'declined'));

-- groups / group_members: all writes through the security-definer RPCs below (0001 let an invited
-- member change group_id on their own row and thereby join any group).
revoke insert, update, delete on public.groups from anon, authenticated;
revoke insert, update, delete on public.group_members from anon, authenticated;

-- Helper functions used by RLS policies: signed-in users only.
revoke execute on function public.are_friends(uuid, uuid) from public, anon;
revoke execute on function public.share_group(uuid, uuid) from public, anon;
revoke execute on function public.is_group_member(uuid, uuid) from public, anon;
revoke execute on function public.can_view_results(uuid, uuid) from public, anon;
revoke execute on function public.my_profile() from public, anon;
grant execute on function public.are_friends(uuid, uuid), public.share_group(uuid, uuid),
  public.is_group_member(uuid, uuid), public.can_view_results(uuid, uuid), public.my_profile() to authenticated;

-- =====================================================================================
-- 2. Profiles: timezone (needed server-side for "this week", "before 08:00", day counts)
-- =====================================================================================
alter table public.profiles add column if not exists timezone text not null default 'Europe/Berlin'
  check (char_length(timezone) between 1 and 64);
grant select (timezone) on public.profiles to authenticated;
grant update (timezone) on public.profiles to authenticated;

create or replace function public.validate_profile_timezone() returns trigger
language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'invalid timezone %', new.timezone using errcode = '22023';
  end if;
  return new;
end $$;
drop trigger if exists profiles_timezone_check on public.profiles;
create trigger profiles_timezone_check before insert or update of timezone on public.profiles
  for each row execute function public.validate_profile_timezone();

-- =====================================================================================
-- 3. Server-side training-handicap engine (mirrors src/engine/handicap.ts exactly; parity is
--    checked by supabase/tests/hcp_parity_test.sql with vectors generated from the TS engine)
-- =====================================================================================

-- Math.round(x * 10) / 10 as in JavaScript.
create or replace function public.hcp_round1(x float8) returns float8
language sql immutable as $$ select floor(x * 10 + 0.5) / 10 $$;

create or replace function public.hcp_clamp(x float8) returns float8
language sql immutable as $$ select least(54::float8, greatest(-5::float8, x)) $$;

create or replace function public.hcp_mid(b jsonb) returns float8
language sql immutable as $$ select ((b->>'hcp_hi')::float8 + (b->>'hcp_lo')::float8) / 2 $$;

-- Bands ordered worst (highest HCP) → best.
create or replace function public.hcp_ordered_bands(bands jsonb) returns jsonb[]
language sql immutable as $$
  select coalesce(array_agg(b order by (b->>'hcp_hi')::float8 desc), '{}')
  from jsonb_array_elements(bands) b
$$;

create or replace function public.hcp_interpolate(val float8, bands jsonb, lower_is_better boolean) returns float8
language plpgsql immutable as $$
declare
  ord jsonb[] := public.hcp_ordered_bands(bands);
  n int := coalesce(array_length(ord, 1), 0);
  xs float8[] := '{}'; ys float8[] := '{}';
  v float8 := case when lower_is_better then -val else val end;
  i int; t float8; y float8;
begin
  if n < 2 then return null; end if;
  for i in 1..n loop
    if jsonb_typeof(ord[i]->'target') <> 'number' then raise exception 'hcp_interpolate needs numeric targets'; end if;
    t := (ord[i]->>'target')::float8;
    xs := xs || (case when lower_is_better then -t else t end);
    ys := ys || public.hcp_mid(ord[i]);
  end loop;
  for i in 2..n loop
    if not (xs[i] > xs[i - 1]) then raise exception 'Band targets must strictly improve from worst to best band'; end if;
  end loop;
  -- JS uses 0-based i starting at 1 → here segment index i (2..n) means points i-1 and i.
  if v <= xs[1] then i := 2;
  elsif v >= xs[n] then i := n;
  else
    i := 2;
    while i < n and v > xs[i] loop i := i + 1; end loop;
  end if;
  y := ys[i - 1] + ((v - xs[i - 1]) / (xs[i] - xs[i - 1])) * (ys[i] - ys[i - 1]);
  return public.hcp_round1(public.hcp_clamp(y));
end $$;

-- Share for radius bands: < pass → hits/pass; ≥ pass → 1 + extra share (all balls = 2).
create or replace function public.hcp_radius_share(balls jsonb, target jsonb, pass_hits int, total int) returns float8
language plpgsql immutable as $$
declare hits int;
begin
  if jsonb_typeof(target) = 'string' and target #>> '{}' = 'green' then
    select count(*) into hits from jsonb_array_elements(balls) x
      where coalesce((x->>'on_green')::boolean, false) or (x->>'dist_m')::float8 = 0;
  elsif jsonb_typeof(target) = 'object' then
    select count(*) into hits from jsonb_array_elements(balls) x
      where x->>'dist_m' is not null and (x->>'dist_m')::float8 < (target->>'radius_m')::float8;
  else
    raise exception 'radius band needs "green" or {radius_m}';
  end if;
  if hits < pass_hits then return hits::float8 / pass_hits; end if;
  return 1 + case when total > pass_hits then (hits - pass_hits)::float8 / (total - pass_hits) else 0 end;
end $$;

create or replace function public.hcp_triplet_share(achieved jsonb, target jsonb) returns float8
language plpgsql immutable as $$
declare s float8; tot float8 := 0; all_met boolean := true; i int;
begin
  for i in 0..2 loop
    s := least((achieved->>i)::float8 / (target->>i)::float8, 1);
    if s < 1 then all_met := false; end if;
    tot := tot + s;
  end loop;
  return case when all_met then 1 else tot / 3 end;
end $$;

create or replace function public.hcp_triplet_toward(achieved jsonb, cur jsonb, nxt jsonb) returns float8
language plpgsql immutable as $$
declare c float8; n float8; a float8; tot float8 := 0; i int;
begin
  for i in 0..2 loop
    c := (cur->>i)::float8; n := (nxt->>i)::float8; a := (achieved->>i)::float8;
    tot := tot + case when n = c then 1 else least(greatest((a - c) / (n - c), 0), 1) end;
  end loop;
  return tot / 3;
end $$;

-- Generic band ladder for radius_by_band and series_triplet (bandLadder in handicap.ts).
create or replace function public.hcp_ladder(kind text, bands jsonb, payload jsonb, pass_hits int, total int) returns float8
language plpgsql immutable as $$
declare
  ord jsonb[] := public.hcp_ordered_bands(bands);
  n int := coalesce(array_length(ord, 1), 0);
  shares float8[] := '{}';
  best int := 0; i int; s float8; m float8; extra float8;
begin
  if n < 1 then return null; end if;
  for i in 1..n loop
    shares := shares || case when kind = 'radius'
      then public.hcp_radius_share(payload, ord[i]->'target', pass_hits, total)
      else public.hcp_triplet_share(payload, ord[i]->'target') end;
    if shares[i] >= 1 then best := i; end if;
  end loop;
  if best = 0 then
    s := least(shares[1], 1);
    return public.hcp_round1(public.hcp_clamp(54 - s * (54 - public.hcp_mid(ord[1]))));
  end if;
  m := public.hcp_mid(ord[best]);
  if best = n then
    extra := least(greatest(shares[best] - 1, 0), 1);
    return public.hcp_round1(public.hcp_clamp(m - extra * (m - (ord[best]->>'hcp_lo')::float8)));
  end if;
  s := case when kind = 'radius' then shares[best + 1]
            else public.hcp_triplet_toward(payload, ord[best]->'target', ord[best + 1]->'target') end;
  s := least(s, 0.999);
  return public.hcp_round1(public.hcp_clamp(m - s * (m - public.hcp_mid(ord[best + 1]))));
end $$;

-- Result → HCP for one drill. `limit_min` is taken from the drill, never from the client.
create or replace function public.result_hcp(scoring jsonb, input jsonb, duration_min int) returns float8
language plpgsql immutable as $$
declare
  bands jsonb := scoring->'bands';
  k text := input->>'kind';
  total int; pass int; req float8; hits float8;
begin
  if bands is null or jsonb_array_length(bands) < 2 then return null; end if; -- incomplete HCP table (4.3)
  if k = 'value' then
    return public.hcp_interpolate((input->>'value')::float8, bands, coalesce((scoring->>'lower_is_better')::boolean, false));
  elsif k = 'time_fallback' then
    hits := (input->>'hits')::float8; req := (input->>'required_hits')::float8;
    return public.hcp_interpolate(duration_min * req / greatest(hits, 0.5), bands, true);
  elsif k = 'radius' then
    total := coalesce((scoring->>'balls')::int, jsonb_array_length(input->'balls'));
    pass := coalesce((scoring->>'pass_hits')::int, ceil(total / 2.0)::int);
    return public.hcp_ladder('radius', bands, input->'balls', pass, total);
  elsif k = 'triplet' then
    return public.hcp_ladder('triplet', bands, input->'achieved', 0, 0);
  end if;
  return null;
end $$;

-- Display score (null where the result is not a single number, e.g. radius or triplet).
create or replace function public.result_score(input jsonb, duration_min int) returns float8
language sql immutable as $$
  select case input->>'kind'
    when 'value' then (input->>'value')::float8
    when 'time_fallback' then duration_min * (input->>'required_hits')::float8 / greatest((input->>'hits')::float8, 0.5)
    else null end
$$;

-- Validate raw input shape and ranges; the drill's scoring type decides which kinds are allowed.
create or replace function public.validate_result_input(scoring jsonb, input jsonb) returns void
language plpgsql immutable as $$
declare
  t text := scoring->>'type';
  k text := input->>'kind';
  maxballs int := coalesce((scoring->>'balls')::int, 50);
  b jsonb; i int;
begin
  if jsonb_typeof(input) <> 'object' or k is null then raise exception 'invalid result input' using errcode = '22023'; end if;
  if k = 'value' then
    if t in ('radius_by_band', 'series_triplet') then raise exception 'drill needs % input', t using errcode = '22023'; end if;
    if jsonb_typeof(input->'value') <> 'number' or (input->>'value')::float8 not between -100 and 1000 then
      raise exception 'value out of range' using errcode = '22023'; end if;
  elsif k = 'time_fallback' then
    if t <> 'time_lower_better' then raise exception 'time_fallback only for timed drills' using errcode = '22023'; end if;
    if jsonb_typeof(input->'hits') <> 'number' or jsonb_typeof(input->'required_hits') <> 'number'
       or (input->>'required_hits')::float8 not between 1 and 100
       or (input->>'hits')::float8 < 0 or (input->>'hits')::float8 >= (input->>'required_hits')::float8 then
      raise exception 'invalid time_fallback' using errcode = '22023'; end if;
  elsif k = 'radius' then
    if t <> 'radius_by_band' then raise exception 'radius input only for radius drills' using errcode = '22023'; end if;
    if jsonb_typeof(input->'balls') <> 'array' or jsonb_array_length(input->'balls') not between 1 and maxballs then
      raise exception 'invalid balls' using errcode = '22023'; end if;
    for b in select * from jsonb_array_elements(input->'balls') loop
      if jsonb_typeof(b) <> 'object' or jsonb_typeof(b->'on_green') <> 'boolean'
         or not (jsonb_typeof(b->'dist_m') = 'null' or (jsonb_typeof(b->'dist_m') = 'number' and (b->>'dist_m')::float8 between 0 and 100)) then
        raise exception 'invalid ball' using errcode = '22023'; end if;
    end loop;
  elsif k = 'triplet' then
    if t <> 'series_triplet' then raise exception 'triplet input only for series drills' using errcode = '22023'; end if;
    if jsonb_typeof(input->'achieved') <> 'array' or jsonb_array_length(input->'achieved') <> 3 then
      raise exception 'invalid triplet' using errcode = '22023'; end if;
    for i in 0..2 loop
      if jsonb_typeof(input->'achieved'->i) <> 'number' or (input->'achieved'->>i)::float8 not between 0 and 100 then
        raise exception 'invalid triplet' using errcode = '22023'; end if;
    end loop;
  else
    raise exception 'unknown input kind %', k using errcode = '22023';
  end if;
end $$;

-- Recompute score and drill_hcp on every insert; client-sent values are always overwritten.
create or replace function public.drill_results_compute() returns trigger
language plpgsql security definer set search_path = public as $$
declare d record;
begin
  select scoring, duration_min into d from drills where id = new.drill_id;
  if not found then raise exception 'unknown drill %', new.drill_id using errcode = '23503'; end if;
  perform validate_result_input(d.scoring, new.input);
  new.drill_hcp := result_hcp(d.scoring, new.input, d.duration_min);
  new.score := result_score(new.input, d.duration_min);
  -- Offline results keep their client timestamp, but never in the future.
  if new.created_at is null or new.created_at > now() + interval '5 minutes' then new.created_at := now(); end if;
  return new;
end $$;
drop trigger if exists drill_results_compute on public.drill_results;
create trigger drill_results_compute before insert on public.drill_results
  for each row execute function public.drill_results_compute();
-- Results are append-only for clients (no update policy); also block updates of the raw input.
revoke update on public.drill_results from anon, authenticated;

-- RLS WITH CHECK runs after BEFORE triggers, so the 0001 "score is null" check would now reject every
-- row. The trigger guarantees server values instead.
drop policy if exists results_insert on public.drill_results;

-- =====================================================================================
-- 4. drill_results.session_id (links results to a session for history and the friends feed)
-- =====================================================================================
alter table public.drill_results add column if not exists session_id uuid references public.sessions(id) on delete set null;
create index if not exists drill_results_session_idx on public.drill_results (session_id);
create policy results_insert on public.drill_results for insert to authenticated with check (
  user_id = auth.uid()
  and (session_id is null or exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())));

-- Sessions: a completed session cannot be re-opened or moved to another user (append-friendly).
create index if not exists sessions_user_completed_idx on public.sessions (user_id, completed_at desc);

-- =====================================================================================
-- 5. Rate limits, search, friend requests
-- =====================================================================================
create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  at timestamptz not null default now()
);
create index if not exists rate_limits_lookup on public.rate_limits (user_id, action, at desc);
alter table public.rate_limits enable row level security;   -- no policies: only definer functions touch it
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.check_rate_limit(p_action text, p_max int, p_window interval) returns void
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  delete from rate_limits where user_id = auth.uid() and action = p_action and at < now() - p_window;
  select count(*) into n from rate_limits where user_id = auth.uid() and action = p_action;
  if n >= p_max then raise exception 'rate_limited' using errcode = 'P0001', hint = p_action; end if;
  insert into rate_limits (user_id, action) values (auth.uid(), p_action);
end $$;

-- Relationship of the caller to another user: none / friends / outgoing / incoming.
-- A declined request looks "outgoing" to the requester (they are not told about the decline).
create or replace function public.friend_relation(other uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      when f.status = 'accepted' then 'friends'
      when f.requester = auth.uid() then 'outgoing'
      when f.status = 'pending' then 'incoming'
      else 'none' end
    from friendships f
    where (f.requester = auth.uid() and f.addressee = other) or (f.requester = other and f.addressee = auth.uid())
    order by (f.status = 'accepted') desc limit 1), 'none')
$$;

-- Search by display name prefix (≥ 2 characters) or by exact email. Returns display names only.
create or replace function public.search_users(q text)
returns table (id uuid, display_name text, relation text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare term text := btrim(coalesce(q, ''));
begin
  perform check_rate_limit('search', 30, interval '5 minutes');
  if position('@' in term) > 0 then
    return query select p.id, p.display_name, friend_relation(p.id)
      from auth.users u join profiles p on p.id = u.id
      where lower(u.email) = lower(term) and p.id <> auth.uid();
  elsif char_length(term) >= 2 then
    return query select p.id, p.display_name, friend_relation(p.id)
      from profiles p
      where p.display_name ilike replace(replace(replace(term, '\', '\\'), '%', '\%'), '_', '\_') || '%'
        and p.id <> auth.uid()
      order by p.display_name limit 20;
  end if;
end $$;

-- Send (or accept, if the other side already asked) a friend request. 20 per day.
create or replace function public.request_friend(target uuid) returns text
language plpgsql security definer set search_path = public as $$
declare f friendships;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if target is null or target = auth.uid() or not exists (select 1 from profiles where id = target) then
    raise exception 'invalid user' using errcode = '22023'; end if;
  select * into f from friendships where requester = target and addressee = auth.uid();
  if found then
    update friendships set status = 'accepted' where id = f.id;  -- they asked first: accept
    return 'friends';
  end if;
  select * into f from friendships where requester = auth.uid() and addressee = target;
  if found then return case when f.status = 'accepted' then 'friends' else 'outgoing' end; end if;
  perform check_rate_limit('friend_request', 20, interval '1 day');
  insert into friendships (requester, addressee) values (auth.uid(), target);
  return 'outgoing';
end $$;

-- Friends with names (for the friends screen); pending requests both ways.
create or replace function public.my_friends()
returns table (friendship_id bigint, user_id uuid, display_name text, status text, direction text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select f.id, p.id, p.display_name,
         case when f.status = 'declined' and f.requester = auth.uid() then 'pending' else f.status end,
         case when f.requester = auth.uid() then 'outgoing' else 'incoming' end, f.created_at
  from friendships f
  join profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() in (f.requester, f.addressee)
    and not (f.status = 'declined' and f.addressee = auth.uid())
  order by f.status = 'pending' desc, p.display_name
$$;

-- =====================================================================================
-- 6. Groups
-- =====================================================================================
create or replace function public.is_group_admin(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = g and user_id = u and status = 'active' and role = 'admin')
$$;

create or replace function public.create_group(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  perform check_rate_limit('create_group', 10, interval '1 day');
  insert into groups (name, owner) values (btrim(p_name), auth.uid()) returning id into gid;
  insert into group_members (group_id, user_id, role, status) values (gid, auth.uid(), 'admin', 'active');
  return gid;
end $$;

-- Admins invite friends of theirs. The invitee has to accept.
create or replace function public.invite_to_group(p_group uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_group_admin(p_group, auth.uid()) then raise exception 'only group admins can invite' using errcode = '42501'; end if;
  if not are_friends(auth.uid(), p_user) then raise exception 'you can only invite friends' using errcode = '42501'; end if;
  perform check_rate_limit('group_invite', 50, interval '1 day');
  insert into group_members (group_id, user_id, role, status) values (p_group, p_user, 'member', 'invited')
    on conflict (group_id, user_id) do nothing;
end $$;

create or replace function public.respond_group_invite(p_group uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_accept then
    update group_members set status = 'active', joined_at = now()
      where group_id = p_group and user_id = auth.uid() and status = 'invited';
  else
    delete from group_members where group_id = p_group and user_id = auth.uid() and status = 'invited';
  end if;
end $$;

-- Leaving: if the owner leaves, ownership passes to another admin, else to the longest-standing member.
create or replace function public.leave_group(p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
declare heir uuid;
begin
  delete from group_members where group_id = p_group and user_id = auth.uid();
  if exists (select 1 from groups where id = p_group and owner = auth.uid()) then
    select user_id into heir from group_members where group_id = p_group and status = 'active'
      order by (role = 'admin') desc, joined_at limit 1;
    if heir is null then
      delete from groups where id = p_group;
    else
      update groups set owner = heir where id = p_group;
      update group_members set role = 'admin' where group_id = p_group and user_id = heir;
    end if;
  end if;
end $$;

create or replace function public.remove_group_member(p_group uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_group_admin(p_group, auth.uid()) then raise exception 'only group admins can remove members' using errcode = '42501'; end if;
  if exists (select 1 from groups where id = p_group and owner = p_user) then raise exception 'the owner cannot be removed' using errcode = '42501'; end if;
  delete from group_members where group_id = p_group and user_id = p_user;
end $$;

create or replace function public.set_group_role(p_group uuid, p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from groups where id = p_group and owner = auth.uid()) then
    raise exception 'only the owner can change roles' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'the owner stays admin' using errcode = '22023'; end if;
  update group_members set role = p_role where group_id = p_group and user_id = p_user and status = 'active';
end $$;

create or replace function public.rename_group(p_group uuid, p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_group_admin(p_group, auth.uid()) then raise exception 'only group admins can rename' using errcode = '42501'; end if;
  update groups set name = btrim(p_name) where id = p_group;
end $$;

-- Members + invitations of a group (names only; results go through the leaderboard functions).
create or replace function public.group_members_list(p_group uuid)
returns table (user_id uuid, display_name text, role text, status text, is_owner boolean, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, p.display_name, m.role, m.status, g.owner = m.user_id, m.joined_at
  from group_members m join profiles p on p.id = m.user_id join groups g on g.id = m.group_id
  where m.group_id = p_group and is_group_member(p_group, auth.uid())
  order by m.status, (m.role = 'admin') desc, p.display_name
$$;

-- Groups I belong to or am invited to.
create or replace function public.my_groups()
returns table (group_id uuid, name text, my_role text, my_status text, titles_enabled boolean, member_count int, is_owner boolean)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, m.role, m.status, g.titles_enabled,
         (select count(*)::int from group_members x where x.group_id = g.id and x.status = 'active'), g.owner = auth.uid()
  from group_members m join groups g on g.id = m.group_id
  where m.user_id = auth.uid()
  order by m.status = 'invited' desc, g.name
$$;

-- =====================================================================================
-- 7. Leaderboards
-- =====================================================================================

-- Category weights for the overall training HCP. Equal until Phase 5 sources are approved.
create table if not exists public.category_weights (
  category text primary key check (category in ('tee', 'approach', 'short', 'putting')),
  weight numeric not null check (weight > 0),
  source_ids bigint[] not null default '{}',
  note text
);
insert into public.category_weights (category, weight, note) values
  ('tee', 1, 'equal weights until Phase 5 approval'), ('approach', 1, 'equal weights until Phase 5 approval'),
  ('short', 1, 'equal weights until Phase 5 approval'), ('putting', 1, 'equal weights until Phase 5 approval')
on conflict (category) do nothing;
alter table public.category_weights enable row level security;
create policy category_weights_read on public.category_weights for select to authenticated using (true);
revoke insert, update, delete on public.category_weights from anon, authenticated;

-- Category training HCP of one user from results in [p_since, p_until] (same rules as handicap.ts:
-- drill HCP = last 3 results weighted 1/0.7/0.49; category = mean weighted by result count, cap 5).
create or replace function public.member_category_stats(p_user uuid, p_since timestamptz, p_until timestamptz default now())
returns table (category text, hcp float8, n_results int, n_drills int, reached_at timestamptz)
language sql stable security definer set search_path = public as $$
  with r as (
    select d.category, x.drill_id, x.drill_hcp::float8 as h, x.created_at,
           row_number() over (partition by x.drill_id order by x.created_at desc, x.id) as rn,
           count(*) over (partition by x.drill_id) as cnt
    from drill_results x join drills d on d.id = x.drill_id
    where x.user_id = p_user and x.drill_hcp is not null and x.created_at >= p_since and x.created_at <= p_until
  ), per_drill as (
    select category, drill_id, max(cnt) as cnt, max(created_at) as last_at,
           hcp_round1(sum(h * (array[1, 0.7, 0.49]::float8[])[rn]) / sum((array[1, 0.7, 0.49]::float8[])[rn])) as dh
    from r where rn <= 3 group by category, drill_id
  )
  select category, hcp_round1(sum(dh * least(cnt, 5)) / sum(least(cnt, 5))), sum(cnt)::int, count(*)::int, max(last_at)
  from per_drill group by category
$$;

-- Practice minutes: every drill played counts with its duration once per session
-- (results without a session count once each). Server-known durations, not client totals.
create or replace function public.practice_minutes(p_user uuid, p_since timestamptz, p_until timestamptz default now())
returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(d.duration_min), 0)::int from (
    select distinct on (coalesce(x.session_id::text, x.id::text), x.drill_id) x.drill_id
    from drill_results x
    where x.user_id = p_user and x.created_at >= p_since and x.created_at <= p_until
  ) t join drills d on d.id = t.drill_id
$$;

-- Raw board rows for a group. Members with results_visibility = 'nobody' are left out, except p_viewer.
-- board: tee | approach | short | putting | overall | activity
create or replace function public.board_rows(p_group uuid, p_board text, p_viewer uuid default null, p_now timestamptz default now())
returns table (user_id uuid, value float8, eligible boolean, n_results int, n_drills int, reached_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare since timestamptz := p_now - interval '30 days';
begin
  if p_board in ('tee', 'approach', 'short', 'putting') then
    return query
      select m.user_id, s.hcp, coalesce(s.n_results >= 3 and s.n_drills >= 2, false), coalesce(s.n_results, 0), coalesce(s.n_drills, 0), s.reached_at
      from group_members m join profiles p on p.id = m.user_id
      left join lateral (select * from member_category_stats(m.user_id, since, p_now) c where c.category = p_board) s on true
      where m.group_id = p_group and m.status = 'active' and (p.results_visibility <> 'nobody' or m.user_id = p_viewer);
  elsif p_board = 'overall' then
    return query
      select m.user_id,
             case when count(s.category) >= 2 then hcp_round1(sum(s.hcp * w.weight::float8) / sum(w.weight::float8)) end,
             count(s.category) >= 2,
             coalesce(sum(s.n_results), 0)::int, coalesce(sum(s.n_drills), 0)::int, max(s.reached_at)
      from group_members m join profiles p on p.id = m.user_id
      left join lateral (select * from member_category_stats(m.user_id, since, p_now) c where c.n_results >= 3 and c.n_drills >= 2) s on true
      left join category_weights w on w.category = s.category
      where m.group_id = p_group and m.status = 'active' and (p.results_visibility <> 'nobody' or m.user_id = p_viewer)
      group by m.user_id;
  elsif p_board = 'activity' then
    return query
      select m.user_id, practice_minutes(m.user_id, since, p_now)::float8, practice_minutes(m.user_id, since, p_now) > 0, 0, 0,
             (select max(x.created_at) from drill_results x where x.user_id = m.user_id and x.created_at >= since)
      from group_members m join profiles p on p.id = m.user_id
      where m.group_id = p_group and m.status = 'active' and (p.results_visibility <> 'nobody' or m.user_id = p_viewer);
  else
    raise exception 'unknown board %', p_board using errcode = '22023';
  end if;
end $$;

-- Ranked board. Ties share a rank; among tied members the earlier achievement (reached_at) leads.
create or replace function public.ranked_board(p_group uuid, p_board text, p_viewer uuid default null, p_now timestamptz default now())
returns table (user_id uuid, value float8, eligible boolean, rank int, pos int, n_results int, n_drills int, reached_at timestamptz)
language sql stable security definer set search_path = public as $$
  with b as (select * from board_rows(p_group, p_board, p_viewer, p_now)),
  e as (
    select b.*, case when p_board = 'activity' then -b.value else b.value end as sortv from b where b.eligible
  )
  select e.user_id, e.value, true,
         (rank() over (order by e.sortv))::int,
         (row_number() over (order by e.sortv, e.reached_at, e.user_id))::int,
         e.n_results, e.n_drills, e.reached_at
  from e
  union all
  select b.user_id, b.value, false, null, null, b.n_results, b.n_drills, b.reached_at from b where not b.eligible
$$;

-- Current titles visible to the caller (last-place titles of members who hide them are not shown to others).
create or replace function public.visible_titles(p_group uuid)
returns table (board text, title_type text, user_id uuid, since date)
language sql stable security definer set search_path = public as $$
  select t.board, t.title_type, t.user_id, t.since
  from group_titles t join groups g on g.id = t.group_id join profiles p on p.id = t.user_id
  where t.group_id = p_group and t.until is null and g.titles_enabled
    and (t.title_type = 'leader' or t.user_id = auth.uid() or not p.hide_last_place_titles)
$$;

-- Leaderboard for the group page. Only active members may call it.
create or replace function public.group_leaderboard(p_group uuid, p_board text)
returns table (user_id uuid, display_name text, value float8, eligible boolean, rank int, pos int,
               n_results int, n_drills int, is_me boolean, title text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not is_group_member(p_group, auth.uid()) then raise exception 'not a member of this group' using errcode = '42501'; end if;
  return query
    select r.user_id, p.display_name, r.value, r.eligible, r.rank, r.pos, r.n_results, r.n_drills, r.user_id = auth.uid(),
           (select t.title_type from visible_titles(p_group) t where t.board = p_board and t.user_id = r.user_id limit 1)
    from ranked_board(p_group, p_board, auth.uid()) r join profiles p on p.id = r.user_id
    order by r.eligible desc, r.pos nulls last, p.display_name;
end $$;

-- Per-drill board: best result in the last 30 days and all-time best (by result HCP; score shown where numeric).
create or replace function public.group_drill_board(p_group uuid, p_drill text)
returns table (user_id uuid, display_name text, best30_hcp numeric, best30_score numeric, best_hcp numeric, best_score numeric,
               rank int, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not is_group_member(p_group, auth.uid()) then raise exception 'not a member of this group' using errcode = '42501'; end if;
  return query
    with m as (
      select gm.user_id from group_members gm join profiles p on p.id = gm.user_id
      where gm.group_id = p_group and gm.status = 'active' and (p.results_visibility <> 'nobody' or gm.user_id = auth.uid())
    ), best_all as (
      select distinct on (x.user_id) x.user_id, x.drill_hcp, x.score from drill_results x
      where x.drill_id = p_drill and x.user_id in (select user_id from m) and x.drill_hcp is not null
      order by x.user_id, x.drill_hcp, x.created_at
    ), best30 as (
      select distinct on (x.user_id) x.user_id, x.drill_hcp, x.score, x.created_at from drill_results x
      where x.drill_id = p_drill and x.user_id in (select user_id from m) and x.drill_hcp is not null
        and x.created_at >= now() - interval '30 days'
      order by x.user_id, x.drill_hcp, x.created_at
    )
    select a.user_id, p.display_name, b.drill_hcp, b.score, a.drill_hcp, a.score,
           case when b.drill_hcp is not null then (rank() over (order by b.drill_hcp nulls last))::int end,
           a.user_id = auth.uid()
    from best_all a join profiles p on p.id = a.user_id left join best30 b on b.user_id = a.user_id
    order by b.drill_hcp nulls last, b.created_at, a.drill_hcp;
end $$;

-- For the home screen: my rank on each board of each group, plus titles I currently hold there.
create or replace function public.my_group_standings()
returns table (group_id uuid, group_name text, board text, my_rank int, ranked_count int, eligible boolean,
               value float8, n_results int, n_drills int, title text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare g record; b text;
begin
  if auth.uid() is null then return; end if;
  for g in select gr.id, gr.name from group_members m join groups gr on gr.id = m.group_id
           where m.user_id = auth.uid() and m.status = 'active' order by gr.name loop
    foreach b in array array['overall', 'tee', 'approach', 'short', 'putting'] loop
      return query
        select g.id, g.name, b, r.rank,
               (select count(*)::int from ranked_board(g.id, b, auth.uid()) z where z.eligible),
               coalesce(r.eligible, false), r.value, coalesce(r.n_results, 0), coalesce(r.n_drills, 0),
               (select t.title_type from visible_titles(g.id) t where t.board = b and t.user_id = auth.uid() limit 1)
        from (select 1) one
        left join ranked_board(g.id, b, auth.uid()) r on r.user_id = auth.uid();
    end loop;
  end loop;
end $$;

-- =====================================================================================
-- 8. Fun titles and activity feed
-- =====================================================================================
create unique index if not exists group_titles_open_unique on public.group_titles (group_id, board, title_type) where until is null;

-- Recompute titles for one group or all groups. Leader = first, last place = last in board order.
-- Needs ≥ 3 eligible members (members with visibility "nobody" never take part).
create or replace function public.compute_group_titles(p_group uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare g record; b text; tt text; holder uuid; n int; cur group_titles;
begin
  for g in select id, titles_enabled from groups where p_group is null or id = p_group loop
    foreach b in array array['tee', 'approach', 'short', 'putting', 'overall'] loop
      select count(*) into n from ranked_board(g.id, b) where eligible;
      foreach tt in array array['leader', 'last'] loop
        holder := null;
        if g.titles_enabled and n >= 3 then
          select r.user_id into holder from ranked_board(g.id, b) r where r.eligible
            order by case when tt = 'leader' then r.pos else -r.pos end limit 1;
        end if;
        select * into cur from group_titles where group_id = g.id and board = b and title_type = tt and until is null;
        if found and cur.user_id is not distinct from holder then continue; end if;
        if found then update group_titles set until = current_date where id = cur.id; end if;
        if holder is not null then
          insert into group_titles (group_id, board, title_type, user_id, since) values (g.id, b, tt, holder, current_date);
        end if;
      end loop;
    end loop;
  end loop;
end $$;

create or replace function public.set_group_titles(p_group uuid, p_enabled boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_group_admin(p_group, auth.uid()) then raise exception 'only group admins can change titles' using errcode = '42501'; end if;
  update groups set titles_enabled = p_enabled where id = p_group;
  perform compute_group_titles(p_group);
end $$;

-- Hidden last-place titles: not shown to other members.
drop policy if exists titles_read on public.group_titles;
create policy titles_read on public.group_titles for select to authenticated using (
  is_group_member(group_id, auth.uid())
  and (title_type = 'leader' or user_id = auth.uid()
       or not coalesce((select p.hide_last_place_titles from public.profiles p where p.id = group_titles.user_id), false)));

-- Activity feed of a group (last 30 days): sessions completed, personal bests, titles won.
-- (0003 extends it with achievements.)
create or replace function public.group_feed(p_group uuid, p_limit int default 30)
returns table (at timestamptz, user_id uuid, display_name text, kind text, payload jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not is_group_member(p_group, auth.uid()) then raise exception 'not a member of this group' using errcode = '42501'; end if;
  return query
    with m as (
      select gm.user_id, p.display_name from group_members gm join profiles p on p.id = gm.user_id
      where gm.group_id = p_group and gm.status = 'active' and (p.results_visibility <> 'nobody' or gm.user_id = auth.uid())
    ), ev as (
      select s.completed_at as at, s.user_id, 'session'::text as kind,
             jsonb_build_object('minutes',
               coalesce((select sum(d.duration_min) from (select distinct x.drill_id from drill_results x where x.session_id = s.id) q
                         join drills d on d.id = q.drill_id), 0),
               'drills', (select count(distinct x.drill_id) from drill_results x where x.session_id = s.id)) as payload
      from sessions s where s.user_id in (select user_id from m) and s.status = 'completed'
        and s.completed_at >= now() - interval '30 days'
      union all
      select pb.created_at, pb.user_id, 'personal_best',
             jsonb_build_object('drill_id', pb.drill_id, 'drill_hcp', pb.drill_hcp, 'score', pb.score)
      from (
        select x.*, min(x.drill_hcp) over (partition by x.user_id, x.drill_id order by x.created_at
                                            rows between unbounded preceding and 1 preceding) as prev_best
        from drill_results x where x.user_id in (select user_id from m) and x.drill_hcp is not null
      ) pb where pb.prev_best is not null and pb.drill_hcp < pb.prev_best and pb.created_at >= now() - interval '30 days'
      union all
      select t.since::timestamptz, t.user_id, 'title', jsonb_build_object('board', t.board, 'title_type', t.title_type)
      from group_titles t join profiles p on p.id = t.user_id
      where t.group_id = p_group and t.since >= current_date - 30
        and (t.title_type = 'leader' or t.user_id = auth.uid() or not p.hide_last_place_titles)
    )
    select ev.at, ev.user_id, m.display_name, ev.kind, ev.payload from ev join m using (user_id)
    order by ev.at desc limit least(greatest(p_limit, 1), 100);
end $$;

-- Newest completed session of any friend whose privacy settings let me see it (home screen).
-- SECURITY INVOKER on purpose: RLS on sessions / drill_results decides what is visible.
create or replace function public.latest_friend_session()
returns table (user_id uuid, display_name text, session_id uuid, completed_at timestamptz, minutes int,
               drill_ids text[], n_results int, mean_hcp float8)
language sql stable security invoker set search_path = public as $$
  select s.user_id, p.display_name, s.id, s.completed_at,
         coalesce((select sum(d.duration_min)::int from (select distinct x.drill_id from drill_results x where x.session_id = s.id) q
                   join drills d on d.id = q.drill_id), 0),
         coalesce((select array_agg(distinct x.drill_id) from drill_results x where x.session_id = s.id), '{}'),
         (select count(*)::int from drill_results x where x.session_id = s.id),
         (select hcp_round1(avg(x.drill_hcp)::float8) from drill_results x where x.session_id = s.id)
  from sessions s join profile_public p on p.id = s.user_id
  where s.status = 'completed' and s.user_id <> auth.uid() and are_friends(auth.uid(), s.user_id)
  order by s.completed_at desc nulls last limit 1
$$;

-- =====================================================================================
-- Privileges: RPCs for signed-in users only; internal helpers not callable from the API at all.
-- =====================================================================================
do $$
declare f text;
begin
  foreach f in array array[
    'public.check_rate_limit(text, integer, interval)',
    'public.member_category_stats(uuid, timestamptz, timestamptz)',
    'public.practice_minutes(uuid, timestamptz, timestamptz)',
    'public.board_rows(uuid, text, uuid, timestamptz)',
    'public.ranked_board(uuid, text, uuid, timestamptz)',
    'public.compute_group_titles(uuid)',
    'public.drill_results_compute()',
    'public.validate_profile_timezone()'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
  foreach f in array array[
    'public.friend_relation(uuid)', 'public.search_users(text)', 'public.request_friend(uuid)', 'public.my_friends()',
    'public.is_group_admin(uuid, uuid)', 'public.create_group(text)', 'public.invite_to_group(uuid, uuid)',
    'public.respond_group_invite(uuid, boolean)', 'public.leave_group(uuid)', 'public.remove_group_member(uuid, uuid)',
    'public.set_group_role(uuid, uuid, text)', 'public.rename_group(uuid, text)', 'public.group_members_list(uuid)',
    'public.my_groups()', 'public.visible_titles(uuid)', 'public.group_leaderboard(uuid, text)',
    'public.group_drill_board(uuid, text)', 'public.my_group_standings()', 'public.set_group_titles(uuid, boolean)',
    'public.group_feed(uuid, integer)', 'public.latest_friend_session()'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- Pure math helpers are harmless but have no use for anon either.
revoke execute on function public.hcp_round1(float8), public.hcp_clamp(float8), public.hcp_mid(jsonb),
  public.hcp_ordered_bands(jsonb), public.hcp_interpolate(float8, jsonb, boolean),
  public.hcp_radius_share(jsonb, jsonb, integer, integer), public.hcp_triplet_share(jsonb, jsonb),
  public.hcp_triplet_toward(jsonb, jsonb, jsonb), public.hcp_ladder(text, jsonb, jsonb, integer, integer),
  public.result_hcp(jsonb, jsonb, integer), public.result_score(jsonb, integer), public.validate_result_input(jsonb, jsonb)
  from public, anon;
grant execute on function public.hcp_round1(float8), public.hcp_clamp(float8), public.hcp_mid(jsonb),
  public.hcp_ordered_bands(jsonb), public.hcp_interpolate(float8, jsonb, boolean),
  public.hcp_radius_share(jsonb, jsonb, integer, integer), public.hcp_triplet_share(jsonb, jsonb),
  public.hcp_triplet_toward(jsonb, jsonb, jsonb), public.hcp_ladder(text, jsonb, jsonb, integer, integer),
  public.result_hcp(jsonb, jsonb, integer), public.result_score(jsonb, integer), public.validate_result_input(jsonb, jsonb)
  to authenticated;

-- Recompute server values for results that were synced before this migration.
alter table public.drill_results disable trigger drill_results_compute;
update public.drill_results x set drill_hcp = public.result_hcp(d.scoring, x.input, d.duration_min),
                                  score = public.result_score(x.input, d.duration_min)
  from public.drills d where d.id = x.drill_id;
alter table public.drill_results enable trigger drill_results_compute;

-- Daily title computation at 03:15 UTC via pg_cron (Supabase: Database → Extensions → pg_cron).
do $$
begin
  begin
    create extension if not exists pg_cron with schema pg_catalog;
  exception when others then
    raise notice 'pg_cron could not be enabled here (%). Enable it under Database → Extensions, then run: select cron.schedule(''pulse-group-titles'', ''15 3 * * *'', ''select public.compute_group_titles()'');', sqlerrm;
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'pulse-group-titles';
    perform cron.schedule('pulse-group-titles', '15 3 * * *', 'select public.compute_group_titles()');
  end if;
end $$;
