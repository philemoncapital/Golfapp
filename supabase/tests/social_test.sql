-- Friends, groups, leaderboards, titles and privacy (0002). Scratch database only; rolled back at the end.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000a1', 'anna@x.de', '{"display_name":"Anna"}'),
 ('00000000-0000-0000-0000-0000000000b1', 'ben@x.de',  '{"display_name":"Ben"}'),
 ('00000000-0000-0000-0000-0000000000c1', 'cem@x.de',  '{"display_name":"Cem"}'),
 ('00000000-0000-0000-0000-0000000000d1', 'dora@x.de', '{"display_name":"Dora"}');
create temp table ctx (k text primary key, v text);
grant all on ctx to authenticated;

-- ---------- Anna: friends + group
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', false);
set role authenticated;
do $$ begin
  if public.request_friend('00000000-0000-0000-0000-0000000000b1') <> 'outgoing' then raise exception 'FAIL: request'; end if;
  if public.request_friend('00000000-0000-0000-0000-0000000000c1') <> 'outgoing' then raise exception 'FAIL: request C'; end if;
  if public.request_friend('00000000-0000-0000-0000-0000000000b1') <> 'outgoing' then raise exception 'FAIL: duplicate request'; end if;
  -- search: name prefix and exact email only
  if not exists (select 1 from public.search_users('Be') where display_name = 'Ben') then raise exception 'FAIL: name search'; end if;
  if not exists (select 1 from public.search_users('BEN@x.de') where display_name = 'Ben') then raise exception 'FAIL: email search'; end if;
  if exists (select 1 from public.search_users('ben@x')) then raise exception 'FAIL: partial email search'; end if;
  if exists (select 1 from public.search_users('%')) then raise exception 'FAIL: wildcard search'; end if;
  if exists (select 1 from public.search_users('An')) then raise exception 'FAIL: search returns self'; end if;
end $$;

-- ---------- Ben accepts by asking back; Cem accepts normally
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', false);
do $$ begin
  if public.request_friend('00000000-0000-0000-0000-0000000000a1') <> 'friends' then raise exception 'FAIL: mutual request should accept'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', false);
update friendships set status = 'accepted' where addressee = auth.uid();

-- ---------- Dora declines nothing, but tries to sneak into groups later
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', false);
insert into ctx values ('gid', public.create_group('Sonntagsrunde')::text);
do $$ declare g uuid := (select v::uuid from ctx where k = 'gid'); begin
  perform public.invite_to_group(g, '00000000-0000-0000-0000-0000000000b1');
  perform public.invite_to_group(g, '00000000-0000-0000-0000-0000000000c1');
  begin
    perform public.invite_to_group(g, '00000000-0000-0000-0000-0000000000d1');
    raise exception 'FAIL: invited a non-friend';
  exception when insufficient_privilege then null; end;
  if (select count(*) from public.group_members_list(g)) <> 3 then raise exception 'FAIL: member list'; end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', false);
do $$ declare g uuid := (select v::uuid from ctx where k = 'gid'); begin
  if (select my_status from public.my_groups() where group_id = g) <> 'invited' then raise exception 'FAIL: invitation not visible'; end if;
  perform public.respond_group_invite(g, true);
  begin
    perform public.invite_to_group(g, '00000000-0000-0000-0000-0000000000a1');
    raise exception 'FAIL: non-admin invited';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', false);
select public.respond_group_invite((select v::uuid from ctx where k = 'gid'), true);

-- Dora: no membership, no leaderboard, no direct writes
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', false);
do $$ declare g uuid := (select v::uuid from ctx where k = 'gid'); begin
  begin
    insert into group_members (group_id, user_id, role, status) values (g, auth.uid(), 'admin', 'active');
    raise exception 'FAIL: direct group join';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.group_leaderboard(g, 'putting');
    raise exception 'FAIL: outsider sees leaderboard';
  exception when insufficient_privilege then null; end;
  if exists (select 1 from groups where id = g) then raise exception 'FAIL: outsider sees group'; end if;
end $$;

-- ---------- Results: Anna strong, Ben middle, Cem weak (putting, 3 drills each, inside one session)
do $$
declare u record; sid uuid;
begin
  for u in select * from (values
      ('00000000-0000-0000-0000-0000000000a1'::uuid, 10, 9, 3),
      ('00000000-0000-0000-0000-0000000000b1'::uuid, 8, 7, 2),
      ('00000000-0000-0000-0000-0000000000c1'::uuid, 6, 5, 1)) t(id, circle, line, five) loop
    perform set_config('request.jwt.claims', json_build_object('sub', u.id, 'role', 'authenticated')::text, false);
    sid := gen_random_uuid();
    insert into sessions (id, user_id, status, total_min, started_at, completed_at)
      values (sid, u.id, 'completed', 30, now() - interval '2 hours', now() - interval '1 hour');
    insert into drill_results (id, user_id, session_id, drill_id, input, created_at) values
      (gen_random_uuid(), u.id, sid, 'circle-putting', jsonb_build_object('kind', 'value', 'value', u.circle - 1), now() - interval '100 minutes'),
      (gen_random_uuid(), u.id, sid, 'circle-putting', jsonb_build_object('kind', 'value', 'value', u.circle), now() - interval '90 minutes'),
      (gen_random_uuid(), u.id, sid, 'control-the-line', jsonb_build_object('kind', 'value', 'value', u.line), now() - interval '80 minutes'),
      (gen_random_uuid(), u.id, sid, 'five-balls', jsonb_build_object('kind', 'value', 'value', u.five), now() - interval '70 minutes');
  end loop;
end $$;

-- Daily job (runs as the database owner)
reset role;
select public.compute_group_titles();
set role authenticated;

-- ---------- Ben looks at the putting board
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', false);
do $$
declare g uuid := (select v::uuid from ctx where k = 'gid'); r record; names text;
begin
  select string_agg(display_name || ':' || rank || ':' || coalesce(title, '-'), ' ' order by pos) into names
    from public.group_leaderboard(g, 'putting') where eligible;
  if names is distinct from 'Anna:1:leader Ben:2:- Cem:3:last' then raise exception 'FAIL: putting board %', names; end if;
  -- overall: only 1 eligible category each → nobody eligible for overall
  if exists (select 1 from public.group_leaderboard(g, 'overall') where eligible) then raise exception 'FAIL: overall eligibility'; end if;
  -- activity: 3 drills (circle twice in one session counts once) = 10 + 10 + 15 min? use drill durations
  select * into r from public.group_leaderboard(g, 'activity') where display_name = 'Ben';
  if r.value <> (select sum(duration_min) from drills where id in ('circle-putting', 'control-the-line', 'five-balls')) then
    raise exception 'FAIL: activity minutes %', r.value; end if;
  -- per-drill board
  if (select string_agg(display_name, ',' order by rank) from public.group_drill_board(g, 'circle-putting')) <> 'Anna,Ben,Cem' then
    raise exception 'FAIL: drill board'; end if;
  -- feed has sessions and personal bests (second circle-putting result beat the first)
  if (select count(*) from public.group_feed(g) where kind = 'session') <> 3 then raise exception 'FAIL: feed sessions'; end if;
  if (select count(*) from public.group_feed(g) where kind = 'personal_best') <> 3 then raise exception 'FAIL: feed PBs'; end if;
  -- latest friend session: Anna is Ben's friend
  if (select display_name from public.latest_friend_session()) <> 'Anna' then raise exception 'FAIL: latest friend session'; end if;
  if (select n_results from public.latest_friend_session()) <> 4 then raise exception 'FAIL: friend session results'; end if;
end $$;

-- ---------- Anna's home standings
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', false);
do $$ declare r record; begin
  select * into r from public.my_group_standings() where board = 'putting';
  if r.my_rank <> 1 or r.ranked_count <> 3 or r.title <> 'leader' then raise exception 'FAIL: standings %', row_to_json(r); end if;
  select * into r from public.my_group_standings() where board = 'tee';
  if r.eligible or r.my_rank is not null then raise exception 'FAIL: tee standings should be unranked'; end if;
end $$;

-- ---------- Cem hides his last-place title, then hides his results entirely
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', false);
update profiles set hide_last_place_titles = true where id = auth.uid();
do $$ begin
  if not exists (select 1 from public.visible_titles((select v::uuid from ctx where k = 'gid')) where title_type = 'last') then
    raise exception 'FAIL: Cem cannot see his own hidden title'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', false);
do $$ declare g uuid := (select v::uuid from ctx where k = 'gid'); begin
  if exists (select 1 from public.visible_titles(g) where title_type = 'last') then raise exception 'FAIL: hidden title visible'; end if;
  if exists (select 1 from group_titles where group_id = g and title_type = 'last') then raise exception 'FAIL: hidden title readable via table'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', false);
update profiles set results_visibility = 'nobody' where id = auth.uid();
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', false);
do $$ declare g uuid := (select v::uuid from ctx where k = 'gid'); begin
  if exists (select 1 from public.group_leaderboard(g, 'putting') where display_name = 'Cem') then raise exception 'FAIL: nobody-visibility on board'; end if;
  if exists (select 1 from public.group_feed(g) where display_name = 'Cem') then raise exception 'FAIL: nobody-visibility in feed'; end if;
end $$;
reset role;
select public.compute_group_titles();   -- only 2 eligible now → titles end
do $$ declare g uuid := (select v::uuid from ctx where k = 'gid'); begin
  if exists (select 1 from group_titles where group_id = g and until is null) then raise exception 'FAIL: titles with < 3 eligible'; end if;
  if (select count(*) from group_titles where group_id = g and until is not null) <> 2 then raise exception 'FAIL: title history'; end if;
end $$;
set role authenticated;

-- ---------- Admin rules: Ben cannot toggle titles or remove; Anna (owner) leaves → ownership passes on
do $$ declare g uuid := (select v::uuid from ctx where k = 'gid'); begin
  begin perform public.set_group_titles(g, false); raise exception 'FAIL: member toggled titles';
  exception when insufficient_privilege then null; end;
  begin perform public.remove_group_member(g, '00000000-0000-0000-0000-0000000000c1'); raise exception 'FAIL: member removed someone';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', false);
select public.set_group_titles((select v::uuid from ctx where k = 'gid'), false);
select public.leave_group((select v::uuid from ctx where k = 'gid'));
reset role;
do $$ declare g uuid := (select v::uuid from ctx where k = 'gid'); begin
  if (select owner from groups where id = g) not in ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1') then
    raise exception 'FAIL: ownership not passed on'; end if;
  if (select titles_enabled from groups where id = g) then raise exception 'FAIL: titles toggle'; end if;
end $$;

-- ---------- Rate limit on search
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', false);
set role authenticated;
do $$ declare i int; begin
  for i in 1..30 loop perform public.search_users('Be'); end loop;
  begin
    perform public.search_users('Be');
    raise exception 'FAIL: search not rate-limited';
  exception when raise_exception then
    if sqlerrm <> 'rate_limited' then raise; end if;
  end;
end $$;
reset role;
select 'SOCIAL TESTS PASSED' as result;
rollback;
