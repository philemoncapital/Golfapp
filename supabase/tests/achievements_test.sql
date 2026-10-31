-- Medals, achievements and title badges (0003). Scratch database only; rolled back at the end.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000e1', 'eva@x.de', '{"display_name":"Eva"}'),
 ('00000000-0000-0000-0000-0000000000f1', 'finn@x.de', '{"display_name":"Finn"}');
update profiles set real_hcp = 18, weekly_goal_min = 10, timezone = 'Europe/Berlin' where id = '00000000-0000-0000-0000-0000000000e1';

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', false);
set role authenticated;
do $$ begin
  -- every definition gets a row (locked items carry progress)
  if (select count(*) from user_achievements where user_id = auth.uid()) <> 29 then raise exception 'FAIL: rows for all 29 definitions'; end if;
  if exists (select 1 from user_achievements where user_id = auth.uid() and earned_at is not null) then raise exception 'FAIL: unlocked without data'; end if;
  begin
    insert into user_achievements (user_id, key, earned_at) values (auth.uid(), 'dynasty', now());
    raise exception 'FAIL: client wrote an achievement';
  exception when insufficient_privilege then null; end;
  begin
    update user_achievements set earned_at = now() where user_id = auth.uid();
    raise exception 'FAIL: client updated an achievement';
  exception when insufficient_privilege then null; end;
end $$;

-- Session at 06:30 Berlin time, two weeks ago, with a perfect Draw Back (9 putts) and circle putting 8 / 10
insert into sessions (id, user_id, status, total_min, started_at, completed_at) values
  ('20000000-0000-0000-0000-000000000001', auth.uid(), 'completed', 20,
   ((current_date - 14)::timestamp + time '06:30') at time zone 'Europe/Berlin',
   ((current_date - 14)::timestamp + time '07:30') at time zone 'Europe/Berlin');
insert into drill_results (id, user_id, session_id, drill_id, input, created_at) values
  (gen_random_uuid(), auth.uid(), '20000000-0000-0000-0000-000000000001', 'draw-back', '{"kind":"value","value":9}', now() - interval '14 days'),
  (gen_random_uuid(), auth.uid(), '20000000-0000-0000-0000-000000000001', 'circle-putting', '{"kind":"value","value":8}', now() - interval '14 days' + interval '5 minutes');
-- one week later another result (goal 10 min/week → 2 weeks in a row)
insert into drill_results (id, user_id, drill_id, input, created_at) values
  (gen_random_uuid(), auth.uid(), 'circle-putting', '{"kind":"value","value":10}', now() - interval '7 days');

do $$
declare r record;
begin
  for r in select key, tier, earned_at, progress from user_achievements where user_id = auth.uid() loop
    if r.key in ('first_tee', 'early_bird', 'flawless', 'on_target', 'next_level') and r.earned_at is null then
      raise exception 'FAIL: % not unlocked (%)', r.key, r.progress; end if;
    if r.key in ('review_ready', 'team_player', 'captain', 'dynasty', 'complete_set', 'all_rounder', 'breakthrough') and r.earned_at is not null then
      raise exception 'FAIL: % unlocked too early', r.key; end if;
  end loop;
  select * into r from user_achievements where user_id = auth.uid() and key = 'flawless';
  if r.progress->'drills' <> '["draw-back"]'::jsonb then raise exception 'FAIL: flawless drills %', r.progress; end if;
  select * into r from user_achievements where user_id = auth.uid() and key = 'range_rat';
  if r.tier is not null or (r.progress->>'value')::int <> 1 or (r.progress->>'next')::int <> 10 then raise exception 'FAIL: range_rat progress %', r.progress; end if;
  select * into r from user_achievements where user_id = auth.uid() and key = 'goal_getter';
  if r.tier <> 'bronze' or (r.progress->>'value')::int <> 2 then raise exception 'FAIL: goal_getter %', row_to_json(r); end if;
  select * into r from user_achievements where user_id = auth.uid() and key = 'pb_machine';
  if (r.progress->>'value')::int <> 1 then raise exception 'FAIL: pb count %', r.progress; end if;
  select * into r from user_achievements where user_id = auth.uid() and key = 'complete_set';
  if (r.progress->>'value')::int <> 2 or (r.progress->>'target')::int <> 25 then raise exception 'FAIL: complete_set progress %', r.progress; end if;
  if (select count(*) from public.my_recent_achievements()) < 5 then raise exception 'FAIL: recent achievements'; end if;
end $$;

-- 9 more completed sessions → Range Rat bronze; earned_at moves
insert into sessions (id, user_id, status, total_min, started_at, completed_at)
  select gen_random_uuid(), auth.uid(), 'completed', 10, now() - interval '1 day', now() - interval '1 day' from generate_series(1, 9);
do $$ begin
  if (select tier from user_achievements where user_id = auth.uid() and key = 'range_rat') <> 'bronze' then raise exception 'FAIL: range_rat bronze'; end if;
  if (select earned_at from user_achievements where user_id = auth.uid() and key = 'review_ready') is null then raise exception 'FAIL: review_ready'; end if;
end $$;

-- Friendship → Team Player for both
select public.request_friend('00000000-0000-0000-0000-0000000000f1');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1","role":"authenticated"}', false);
update friendships set status = 'accepted' where addressee = auth.uid();
do $$ begin
  if (select earned_at from user_achievements where user_id = auth.uid() and key = 'team_player') is null then raise exception 'FAIL: team_player addressee'; end if;
  if (select earned_at from user_achievements where user_id = '00000000-0000-0000-0000-0000000000e1' and key = 'team_player') is null then raise exception 'FAIL: team_player requester'; end if;
  -- Finn (friend) may see Eva's badges (visibility friends)
  if (select count(*) from user_achievements where user_id = '00000000-0000-0000-0000-0000000000e1' and earned_at is not null) < 5 then raise exception 'FAIL: friend cannot see badges'; end if;
end $$;

-- Title badge with weeks held, and Dynasty after 4 weeks as leader
reset role;
insert into groups (id, name, owner) values ('30000000-0000-0000-0000-000000000001', 'Test', '00000000-0000-0000-0000-0000000000e1');
insert into group_titles (group_id, board, title_type, user_id, since) values
  ('30000000-0000-0000-0000-000000000001', 'putting', 'leader', '00000000-0000-0000-0000-0000000000e1', current_date - 30);
do $$ declare r record; begin
  select * into r from user_achievements where user_id = '00000000-0000-0000-0000-0000000000e1' and key = 'title_putting_leader';
  if r.earned_at is null or (r.progress->>'weeks')::int <> 4 or not (r.progress->>'holding')::boolean then raise exception 'FAIL: title badge %', r.progress; end if;
  if (select earned_at from user_achievements where user_id = '00000000-0000-0000-0000-0000000000e1' and key = 'dynasty') is null then raise exception 'FAIL: dynasty'; end if;
end $$;
select public.daily_social_job();
select 'ACHIEVEMENT TESTS PASSED' as result;
rollback;
