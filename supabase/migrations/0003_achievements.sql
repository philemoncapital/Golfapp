-- Golf Pulse – 0003: medals, achievements and title badges (section 8.3–8.5), checked server-side.
-- Run once in the Supabase SQL editor AFTER 0002_social.sql.
--
-- user_achievements holds one row per user and definition, also for locked items (progress for "34 / 50").
--   earned_at  = when it was (last) unlocked: first unlock, a higher medal tier, or another Flawless drill
--   tier       = bronze | silver | gold for medals, null otherwise
--   progress   = jsonb with the counters shown on the Achievements screen
-- Checks run in triggers after inserts/updates on results, sessions, friendships, group members, titles
-- and round stats, plus daily together with the title job. Clients never write these rows.

-- =====================================================================================
-- 1. Definitions
-- =====================================================================================
insert into public.achievement_defs (key, kind, tiers, name_en, name_de, pictogram) values
  ('range_rat',    'medal', '{"bronze":10,"silver":50,"gold":150}',   'Range Rat',     'Rangeratte',       'range_rat'),
  ('grinder',      'medal', '{"bronze":500,"silver":2000,"gold":5000}', 'Grinder',     'Dauerbrenner',     'grinder'),
  ('regular',      'medal', '{"bronze":10,"silver":30,"gold":100}',   'Regular',       'Stammgast',        'regular'),
  ('goal_getter',  'medal', '{"bronze":2,"silver":4,"gold":8}',       'Goal Getter',   'Zielstrebig',      'goal_getter'),
  ('pb_machine',   'medal', '{"bronze":5,"silver":20,"gold":50}',     'PB Machine',    'Rekordjäger',      'pb_machine'),
  ('round_logger', 'medal', '{"bronze":5,"silver":15,"gold":40}',     'Round Logger',  'Rundenbuchhalter', 'round_logger'),
  ('first_tee',    'achievement', null, 'First Tee',    'Erster Abschlag', 'first_tee'),
  ('flawless',     'achievement', null, 'Flawless',     'Makellos',        'flawless'),
  ('complete_set', 'achievement', null, 'Complete Set', 'Komplettes Set',  'complete_set'),
  ('collector',    'achievement', null, 'Collector',    'Sammler',         'collector'),
  ('all_rounder',  'achievement', null, 'All-Rounder',  'Allrounder',      'all_rounder'),
  ('on_target',    'achievement', null, 'On Target',    'Im Soll',         'on_target'),
  ('next_level',   'achievement', null, 'Next Level',   'Nächste Stufe',   'next_level'),
  ('breakthrough', 'achievement', null, 'Breakthrough', 'Durchbruch',      'breakthrough'),
  ('review_ready', 'achievement', null, 'Review Ready', 'Bilanzreif',      'review_ready'),
  ('early_bird',   'achievement', null, 'Early Bird',   'Frühaufsteher',   'early_bird'),
  ('team_player',  'achievement', null, 'Team Player',  'Teamplayer',      'team_player'),
  ('captain',      'achievement', null, 'Captain',      'Kapitän',         'captain'),
  ('dynasty',      'achievement', null, 'Dynasty',      'Dynastie',        'dynasty'),
  ('title_tee_leader',      'title_badge', null, 'Big Stick',      'Der Hammer',       'tee_leader'),
  ('title_tee_last',        'title_badge', null, 'Tree Hugger',    'Baumflüsterer',    'tee_last'),
  ('title_approach_leader', 'title_badge', null, 'Pin Seeker',     'Fahnenjäger',      'approach_leader'),
  ('title_approach_last',   'title_badge', null, 'Air Mail',       'Luftpost',         'approach_last'),
  ('title_short_leader',    'title_badge', null, 'Wedge Wizard',   'Wedge-Zauberer',   'short_leader'),
  ('title_short_last',      'title_badge', null, 'Chili Dipper',   'Erdarbeiter',      'short_last'),
  ('title_putting_leader',  'title_badge', null, 'Ice Veins',      'Eiskalt',          'putting_leader'),
  ('title_putting_last',    'title_badge', null, 'Lip-Out Legend', 'Lochrand-Legende', 'putting_last'),
  ('title_overall_leader',  'title_badge', null, 'Club Champion',  'Clubmeister',      'overall_leader'),
  ('title_overall_last',    'title_badge', null, 'Ball Donor',     'Ballspender',      'overall_last')
on conflict (key) do update set kind = excluded.kind, tiers = excluded.tiers, name_en = excluded.name_en,
  name_de = excluded.name_de, pictogram = excluded.pictogram;

revoke insert, update, delete on public.user_achievements from anon, authenticated;
revoke insert, update, delete on public.achievement_defs from anon, authenticated;
create index if not exists user_achievements_recent on public.user_achievements (user_id, earned_at desc);

-- =====================================================================================
-- 2. Helpers
-- =====================================================================================

-- The booklet band for a real HCP: the band containing it, else the nearest one (targetForHcp in handicap.ts).
create or replace function public.hcp_own_band_index(bands jsonb, hcp float8) returns int
language sql immutable as $$
  select i from (
    select row_number() over (order by (b->>'hcp_hi')::float8 desc) as i,
           case when least(54, greatest(0, hcp)) > (b->>'hcp_hi')::float8 then least(54, greatest(0, hcp)) - (b->>'hcp_hi')::float8
                when least(54, greatest(0, hcp)) < (b->>'hcp_lo')::float8 then (b->>'hcp_lo')::float8 - least(54, greatest(0, hcp))
                else 0 end as dist
    from jsonb_array_elements(bands) b
  ) t order by dist, i limit 1
$$;

-- Did this result reach the drill's theoretical maximum (scoring.perfect)?
create or replace function public.result_is_perfect(scoring jsonb, input jsonb) returns boolean
language plpgsql immutable as $$
declare p float8 := (scoring->>'perfect')::float8; best jsonb; hits int;
begin
  if p is null then return false; end if;
  if input->>'kind' = 'value' then
    return case when coalesce((scoring->>'lower_is_better')::boolean, false)
                then (input->>'value')::float8 <= p else (input->>'value')::float8 >= p end;
  elsif input->>'kind' = 'radius' then
    -- all balls inside the tightest radius (best band)
    best := (public.hcp_ordered_bands(scoring->'bands'))[jsonb_array_length(scoring->'bands')]->'target';
    if jsonb_typeof(best) <> 'object' then return false; end if;
    select count(*) into hits from jsonb_array_elements(input->'balls') x
      where x->>'dist_m' is not null and (x->>'dist_m')::float8 < (best->>'radius_m')::float8;
    return hits >= p;
  end if;
  return false;
end $$;

-- Medal: upgrade tier when the value reaches the next threshold. Never downgrades.
create or replace function public.award_medal(p_user uuid, p_key text, p_value numeric) returns void
language plpgsql security definer set search_path = public as $$
declare
  tiers jsonb := (select tiers from achievement_defs where key = p_key);
  new_tier text := case when p_value >= (tiers->>'gold')::numeric then 'gold'
                        when p_value >= (tiers->>'silver')::numeric then 'silver'
                        when p_value >= (tiers->>'bronze')::numeric then 'bronze' end;
  next_at numeric := case when new_tier is null then (tiers->>'bronze')::numeric
                          when new_tier = 'bronze' then (tiers->>'silver')::numeric
                          when new_tier = 'silver' then (tiers->>'gold')::numeric end;
  cur user_achievements;
  rank_of constant jsonb := '{"bronze":1,"silver":2,"gold":3}';
  upgraded boolean;
  tier_dates jsonb;
begin
  select * into cur from user_achievements where user_id = p_user and key = p_key;
  upgraded := new_tier is not null and coalesce((rank_of->>new_tier)::int, 0) > coalesce((rank_of->>cur.tier)::int, 0);
  tier_dates := coalesce(cur.progress->'tier_dates', '{}'::jsonb);
  if upgraded then tier_dates := tier_dates || jsonb_build_object(new_tier, now()); end if;
  insert into user_achievements (user_id, key, tier, progress, earned_at)
  values (p_user, p_key, new_tier, jsonb_build_object('value', p_value, 'next', next_at, 'tier_dates', tier_dates),
          case when upgraded then now() end)
  on conflict (user_id, key) do update set
    tier = case when upgraded then new_tier else user_achievements.tier end,
    progress = jsonb_build_object('value', p_value,
                 'next', case when upgraded then next_at else coalesce((user_achievements.progress->>'next')::numeric, next_at) end,
                 'tier_dates', tier_dates),
    earned_at = case when upgraded then now() else user_achievements.earned_at end;
end $$;

-- One-time achievement: unlock once; progress is always refreshed. `p_again` re-stamps earned_at
-- (used by Flawless when another drill is completed perfectly).
create or replace function public.award_once(p_user uuid, p_key text, p_earned boolean, p_progress jsonb, p_again boolean default false) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into user_achievements (user_id, key, progress, earned_at)
  values (p_user, p_key, coalesce(p_progress, '{}'), case when p_earned then now() end)
  on conflict (user_id, key) do update set
    progress = coalesce(p_progress, '{}'),
    earned_at = case when user_achievements.earned_at is null and p_earned then now()
                     when p_again and p_earned then now()
                     else user_achievements.earned_at end;
end $$;

-- =====================================================================================
-- 3. The check
-- =====================================================================================
create or replace function public.refresh_achievements(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  tz text; goal int; real_hcp float8;
  n_sessions int; minutes int; days int; streak int; pbs int; rounds int;
  perfect_drills text[]; old_perfect int;
  booklet_total int; booklet_done int; lib_total int; lib_done int;
  ok boolean; v_progress jsonb; best_gap float8; b text; tt text; weeks int; ever boolean; holding boolean;
begin
  if p_user is null or not exists (select 1 from profiles where id = p_user) then return; end if;
  select coalesce(p.timezone, 'Europe/Berlin'), p.weekly_goal_min, p.real_hcp into tz, goal, real_hcp from profiles p where p.id = p_user;

  -- ---- Medals
  select count(*) into n_sessions from sessions where user_id = p_user and status = 'completed';
  perform award_medal(p_user, 'range_rat', n_sessions);

  minutes := practice_minutes(p_user, '-infinity', 'infinity');
  perform award_medal(p_user, 'grinder', minutes);

  select count(distinct d) into days from (
    select (created_at at time zone tz)::date as d from drill_results where user_id = p_user
    union select (coalesce(completed_at, started_at) at time zone tz)::date from sessions
      where user_id = p_user and status in ('started', 'completed') and coalesce(completed_at, started_at) is not null
  ) x;
  perform award_medal(p_user, 'regular', days);

  -- Longest run of consecutive weeks (Mon–Sun, local time) with practice minutes ≥ weekly goal.
  with played as (
    select distinct on (coalesce(x.session_id::text, x.id::text), x.drill_id)
           date_trunc('week', x.created_at at time zone tz)::date as wk, x.drill_id
    from drill_results x where x.user_id = p_user
    order by coalesce(x.session_id::text, x.id::text), x.drill_id, x.created_at
  ), weekly as (
    select wk, sum(d.duration_min) as mins from played join drills d on d.id = played.drill_id group by wk
  ), met as (
    select wk, wk - (row_number() over (order by wk) * 7)::int as grp from weekly where goal > 0 and mins >= goal
  )
  select coalesce(max(c), 0) into streak from (select count(*) as c from met group by grp) t;
  perform award_medal(p_user, 'goal_getter', streak);

  select count(*) into pbs from (
    select x.drill_hcp, min(x.drill_hcp) over (partition by x.drill_id order by x.created_at, x.id
                                               rows between unbounded preceding and 1 preceding) as prev
    from drill_results x where x.user_id = p_user and x.drill_hcp is not null
  ) t where prev is not null and drill_hcp < prev;
  perform award_medal(p_user, 'pb_machine', pbs);

  select count(*) into rounds from round_stats where user_id = p_user;
  perform award_medal(p_user, 'round_logger', rounds);

  -- ---- Achievements
  perform award_once(p_user, 'first_tee', n_sessions >= 1, jsonb_build_object('value', least(n_sessions, 1), 'target', 1));
  perform award_once(p_user, 'review_ready', n_sessions >= 5, jsonb_build_object('value', least(n_sessions, 5), 'target', 5));

  select coalesce(array_agg(distinct x.drill_id order by x.drill_id), '{}') into perfect_drills
    from drill_results x join drills d on d.id = x.drill_id
    where x.user_id = p_user and result_is_perfect(d.scoring, x.input);
  select coalesce(jsonb_array_length(progress->'drills'), 0) into old_perfect from user_achievements where user_id = p_user and key = 'flawless';
  perform award_once(p_user, 'flawless', cardinality(perfect_drills) > 0,
    jsonb_build_object('drills', to_jsonb(perfect_drills), 'value', cardinality(perfect_drills)),
    cardinality(perfect_drills) > coalesce(old_perfect, 0));

  select count(*), count(*) filter (where exists (select 1 from drill_results x where x.user_id = p_user and x.drill_id = d.id))
    into booklet_total, booklet_done from drills d where d.source = 'booklet' and d.owner_id is null;
  perform award_once(p_user, 'complete_set', booklet_total > 0 and booklet_done = booklet_total,
    jsonb_build_object('value', booklet_done, 'target', booklet_total));
  select count(*), count(*) filter (where exists (select 1 from drill_results x where x.user_id = p_user and x.drill_id = d.id))
    into lib_total, lib_done from drills d where d.owner_id is null;
  perform award_once(p_user, 'collector', lib_total > 0 and lib_done = lib_total,
    jsonb_build_object('value', lib_done, 'target', lib_total));

  -- All 4 categories within any 7 days (rolling window ending at a result).
  select coalesce(max(n), 0) into weeks from (
    select (select count(distinct d2.category) from drill_results y join drills d2 on d2.id = y.drill_id
            where y.user_id = p_user and y.created_at > x.created_at - interval '7 days' and y.created_at <= x.created_at) as n
    from drill_results x where x.user_id = p_user
  ) t;
  perform award_once(p_user, 'all_rounder', weeks >= 4, jsonb_build_object('value', weeks, 'target', 4));

  -- On Target / Next Level: a result at or better than the target of my own band / the next better band
  -- (result HCP ≤ that band's midpoint, which is exactly where the band target maps to).
  if real_hcp is not null then
    select exists (
      select 1 from drill_results x join drills d on d.id = x.drill_id
      where x.user_id = p_user and x.drill_hcp is not null
        and x.drill_hcp <= hcp_mid((hcp_ordered_bands(d.scoring->'bands'))[hcp_own_band_index(d.scoring->'bands', real_hcp)])
    ) into ok;
    perform award_once(p_user, 'on_target', ok, jsonb_build_object('real_hcp', real_hcp));
    select exists (
      select 1 from drill_results x join drills d on d.id = x.drill_id
      where x.user_id = p_user and x.drill_hcp is not null
        and hcp_own_band_index(d.scoring->'bands', real_hcp) < jsonb_array_length(d.scoring->'bands')
        and x.drill_hcp <= hcp_mid((hcp_ordered_bands(d.scoring->'bands'))[hcp_own_band_index(d.scoring->'bands', real_hcp) + 1])
    ) into ok;
    perform award_once(p_user, 'next_level', ok, jsonb_build_object('real_hcp', real_hcp));
  else
    perform award_once(p_user, 'on_target', false, jsonb_build_object('needs_hcp', true));
    perform award_once(p_user, 'next_level', false, jsonb_build_object('needs_hcp', true));
  end if;

  -- Breakthrough: a category HCP (≥ 2 drills) now at least 2.0 better than 30 days ago.
  select max(o.hcp - n.hcp) into best_gap
    from member_category_stats(p_user, '-infinity', now()) n
    join member_category_stats(p_user, '-infinity', now() - interval '30 days') o using (category)
    where n.n_drills >= 2 and o.n_drills >= 2;
  perform award_once(p_user, 'breakthrough', coalesce(best_gap, 0) >= 2.0,
    jsonb_build_object('value', greatest(coalesce(hcp_round1(best_gap), 0), 0), 'target', 2.0));

  select exists (select 1 from sessions where user_id = p_user and started_at is not null
                 and extract(hour from started_at at time zone tz) < 8) into ok;
  perform award_once(p_user, 'early_bird', ok, null);

  select exists (select 1 from friendships where status = 'accepted' and p_user in (requester, addressee)) into ok;
  perform award_once(p_user, 'team_player', ok, null);

  select coalesce(max(c), 0) into weeks from (
    select (select count(*) from group_members m where m.group_id = g.id and m.status = 'active') as c
    from groups g where g.owner = p_user) t;
  perform award_once(p_user, 'captain', weeks >= 3, jsonb_build_object('value', least(weeks, 3), 'target', 3));

  select coalesce(max(coalesce(until, current_date) - since), 0) into weeks
    from group_titles where user_id = p_user and title_type = 'leader';
  perform award_once(p_user, 'dynasty', weeks >= 28, jsonb_build_object('value', least(weeks / 7, 4), 'target', 4));

  -- ---- Title badges with weeks held
  foreach b in array array['tee', 'approach', 'short', 'putting', 'overall'] loop
    foreach tt in array array['leader', 'last'] loop
      select count(*) > 0, coalesce(sum(coalesce(until, current_date) - since), 0) / 7, bool_or(until is null)
        into ever, weeks, holding
        from group_titles where user_id = p_user and board = b and title_type = tt;
      perform award_once(p_user, 'title_' || b || '_' || tt, ever, jsonb_build_object('weeks', weeks, 'holding', coalesce(holding, false)));
    end loop;
  end loop;
end $$;

-- =====================================================================================
-- 4. Triggers (never block the original write: failures only raise a warning)
-- =====================================================================================
create or replace function public.refresh_achievements_safe(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform refresh_achievements(p_user);
exception when others then
  raise warning 'achievement check failed for %: %', p_user, sqlerrm;
end $$;

create or replace function public.ach_after_results() returns trigger
language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  for u in select distinct user_id from new_rows loop perform refresh_achievements_safe(u); end loop;
  return null;
end $$;
drop trigger if exists ach_results on public.drill_results;
create trigger ach_results after insert on public.drill_results
  referencing new table as new_rows for each statement execute function public.ach_after_results();

create or replace function public.ach_after_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  case tg_table_name
    when 'sessions' then perform refresh_achievements_safe(new.user_id);
    when 'round_stats' then perform refresh_achievements_safe(new.user_id);
    when 'group_titles' then perform refresh_achievements_safe(new.user_id);
    when 'friendships' then
      perform refresh_achievements_safe(new.requester); perform refresh_achievements_safe(new.addressee);
    when 'group_members' then
      perform refresh_achievements_safe(new.user_id);
      perform refresh_achievements_safe((select owner from groups where id = new.group_id));
  end case;
  return null;
end $$;
drop trigger if exists ach_sessions on public.sessions;
create trigger ach_sessions after insert or update of status, started_at on public.sessions
  for each row execute function public.ach_after_row();
drop trigger if exists ach_rounds on public.round_stats;
create trigger ach_rounds after insert on public.round_stats for each row execute function public.ach_after_row();
drop trigger if exists ach_titles on public.group_titles;
create trigger ach_titles after insert or update on public.group_titles for each row execute function public.ach_after_row();
drop trigger if exists ach_friends on public.friendships;
create trigger ach_friends after insert or update of status on public.friendships for each row execute function public.ach_after_row();
drop trigger if exists ach_members on public.group_members;
create trigger ach_members after insert or update of status on public.group_members for each row execute function public.ach_after_row();

-- Real handicap or weekly goal changed → On Target / Goal Getter may change.
create or replace function public.ach_after_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform refresh_achievements_safe(new.id);
  return null;
end $$;
drop trigger if exists ach_profile on public.profiles;
create trigger ach_profile after update of real_hcp, weekly_goal_min on public.profiles
  for each row execute function public.ach_after_profile();

-- =====================================================================================
-- 5. Daily job: titles, then weeks-held counters / Dynasty for everyone holding a title.
-- =====================================================================================
create or replace function public.daily_social_job() returns void
language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  perform compute_group_titles();
  for u in select distinct user_id from group_titles where until is null loop perform refresh_achievements_safe(u); end loop;
end $$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'pulse-group-titles';
    perform cron.schedule('pulse-group-titles', '15 3 * * *', 'select public.daily_social_job()');
  else
    raise notice 'pg_cron not enabled: after enabling it run select cron.schedule(''pulse-group-titles'', ''15 3 * * *'', ''select public.daily_social_job()'');';
  end if;
end $$;

-- =====================================================================================
-- 6. Group feed now also shows unlocked achievements (replaces the 0002 version).
-- =====================================================================================
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
      union all
      select a.earned_at, a.user_id, 'achievement', jsonb_build_object('key', a.key, 'tier', a.tier)
      from user_achievements a join profiles p on p.id = a.user_id
      where a.user_id in (select user_id from m) and a.earned_at >= now() - interval '30 days'
        and not (a.key like 'title\_%\_last' and p.hide_last_place_titles and a.user_id <> auth.uid())
    )
    select ev.at, ev.user_id, m.display_name, ev.kind, ev.payload from ev join m using (user_id)
    order by ev.at desc limit least(greatest(p_limit, 1), 100);
end $$;

-- Recent unlocks for the home screen (own).
create or replace function public.my_recent_achievements(p_limit int default 6)
returns table (key text, kind text, tier text, earned_at timestamptz, progress jsonb)
language sql stable security invoker set search_path = public as $$
  select a.key, d.kind, a.tier, a.earned_at, a.progress
  from user_achievements a join achievement_defs d on d.key = a.key
  where a.user_id = auth.uid() and a.earned_at is not null
  order by a.earned_at desc limit least(greatest(p_limit, 1), 30)
$$;

-- =====================================================================================
-- Privileges + backfill
-- =====================================================================================
do $$
declare f text;
begin
  foreach f in array array[
    'public.award_medal(uuid, text, numeric)', 'public.award_once(uuid, text, boolean, jsonb, boolean)',
    'public.refresh_achievements(uuid)', 'public.refresh_achievements_safe(uuid)', 'public.ach_after_results()',
    'public.ach_after_row()', 'public.ach_after_profile()', 'public.daily_social_job()'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
  revoke execute on function public.my_recent_achievements(integer), public.hcp_own_band_index(jsonb, float8),
    public.result_is_perfect(jsonb, jsonb) from public, anon;
  grant execute on function public.my_recent_achievements(integer), public.hcp_own_band_index(jsonb, float8),
    public.result_is_perfect(jsonb, jsonb) to authenticated;
end $$;

-- Existing users get their achievements computed once now.
do $$ declare u uuid; begin
  for u in select id from public.profiles loop perform public.refresh_achievements_safe(u); end loop;
end $$;
