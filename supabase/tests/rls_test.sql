-- RLS smoke test for 0001 + 0002. Run on a SCRATCH database after all migrations and supabase/seed.sql
-- (locally: npm run test:db). Everything runs in one transaction and is rolled back.
-- Raises an exception on the first failure.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a', 'a@x.de', '{"display_name":"Anna"}'),
 ('00000000-0000-0000-0000-00000000000b', 'b@x.de', '{"display_name":"Ben"}'),
 ('00000000-0000-0000-0000-00000000000c', 'c@x.de', '{"display_name":"Cem"}');
update profiles set real_hcp = 18.4 where id = '00000000-0000-0000-0000-00000000000a';

-- ---- Anna
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', false);
set role authenticated;
-- Client sends a fake drill_hcp: the server overwrites it (circle-putting: streak 8 = target of 26-12 → midpoint 19).
insert into drill_results (id, user_id, drill_id, input, drill_hcp, score)
  values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'circle-putting', '{"kind":"value","value":8}', 1.0, 99);
do $$ begin
  if (select drill_hcp from drill_results where id = '10000000-0000-0000-0000-000000000001') <> 19.0 then
    raise exception 'FAIL: drill_hcp not recomputed on the server'; end if;
  if (select score from drill_results where id = '10000000-0000-0000-0000-000000000001') <> 8 then
    raise exception 'FAIL: score not recomputed on the server'; end if;
  -- results cannot be changed afterwards
  begin
    update drill_results set drill_hcp = 0 where id = '10000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: result updatable';
  exception when insufficient_privilege then null; end;
  -- invalid input is rejected
  begin
    insert into drill_results (id, user_id, drill_id, input) values (gen_random_uuid(), auth.uid(), 'circle-putting', '{"kind":"radius","balls":[]}');
    raise exception 'FAIL: invalid input accepted';
  exception when invalid_parameter_value then null; end;
  -- results for another user are rejected
  begin
    insert into drill_results (id, user_id, drill_id, input) values (gen_random_uuid(), '00000000-0000-0000-0000-00000000000b', 'circle-putting', '{"kind":"value","value":3}');
    raise exception 'FAIL: result for someone else accepted';
  exception when insufficient_privilege then null; end;
  -- real_hcp column is not readable directly
  begin
    perform real_hcp from profiles;
    raise exception 'FAIL: real_hcp column readable';
  exception when insufficient_privilege then null; end;
  -- direct friendship inserts are blocked (rate-limited RPC only)
  begin
    insert into friendships (requester, addressee) values (auth.uid(), '00000000-0000-0000-0000-00000000000c');
    raise exception 'FAIL: direct friendship insert allowed';
  exception when insufficient_privilege then null; end;
  -- clients cannot write titles or achievements
  begin
    insert into group_titles (group_id, board, title_type, user_id, since) values (gen_random_uuid(), 'tee', 'leader', auth.uid(), current_date);
    raise exception 'FAIL: client wrote a title';
  exception when insufficient_privilege then null; end;
end $$;
select public.request_friend('00000000-0000-0000-0000-00000000000b');

-- ---- Ben
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', false);
do $$ begin
  if (select count(*) from drill_results) <> 0 then raise exception 'FAIL: Ben sees results before accepting friendship'; end if;
  -- the addressee may not rewrite who asked (0001 hole)
  begin
    update friendships set requester = '00000000-0000-0000-0000-00000000000c' where addressee = auth.uid();
    raise exception 'FAIL: requester column writable';
  exception when insufficient_privilege then null; end;
end $$;
update friendships set status = 'accepted' where addressee = auth.uid();
do $$ begin
  if (select count(*) from drill_results) <> 1 then raise exception 'FAIL: friend cannot see results'; end if;
  if (select real_hcp from profile_public where display_name = 'Anna') is distinct from 18.4 then raise exception 'FAIL: friend cannot see real HCP'; end if;
end $$;

-- ---- Cem (stranger)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', false);
do $$ begin
  if (select count(*) from drill_results) <> 0 then raise exception 'FAIL: stranger sees results'; end if;
  if (select real_hcp from profile_public where display_name = 'Anna') is not null then raise exception 'FAIL: stranger sees real HCP'; end if;
  if (select count(*) from friendships) <> 0 then raise exception 'FAIL: stranger sees friendships'; end if;
end $$;

-- ---- Anna hides her results and her handicap
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', false);
update profiles set results_visibility = 'nobody', show_real_hcp = false where id = auth.uid();
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', false);
do $$ begin
  if (select count(*) from drill_results) <> 0 then raise exception 'FAIL: visibility "nobody" ignored'; end if;
  if (select real_hcp from profile_public where display_name = 'Anna') is not null then raise exception 'FAIL: show_real_hcp=false ignored'; end if;
end $$;

-- ---- anon can do nothing
reset role;
select set_config('request.jwt.claims', '', false);
set role anon;
do $$ begin
  if (select count(*) from drill_results) <> 0 then raise exception 'FAIL: anon reads results'; end if;
  begin perform public.search_users('An'); raise exception 'FAIL: anon can search';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'RLS TESTS PASSED' as result;
rollback;
