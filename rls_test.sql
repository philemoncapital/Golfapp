-- RLS smoke test. Run against a scratch database after the migration (see README).
-- Raises an exception on the first failure.
insert into auth.users values
 ('00000000-0000-0000-0000-00000000000a','a@x.de','{"display_name":"Anna"}'),
 ('00000000-0000-0000-0000-00000000000b','b@x.de','{"display_name":"Ben"}'),
 ('00000000-0000-0000-0000-00000000000c','c@x.de','{"display_name":"Cem"}');
update profiles set real_hcp = 18.4 where display_name = 'Anna';
insert into drills (id, source, area, category, title, duration_min, difficulty, shot_type, text, scoring)
  values ('circle-putting','booklet','putting','putting','Circle Putting',10,3,'Kurze Putts','{}','{}');

set role authenticated;
set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
insert into drill_results (id, user_id, drill_id, input) values (gen_random_uuid(), auth.uid(), 'circle-putting', '{"kind":"value","value":8}');
insert into friendships (requester, addressee) values (auth.uid(), '00000000-0000-0000-0000-00000000000b');

do $$ begin
  -- Anna cannot write a server-computed HCP herself
  begin
    insert into drill_results (id, user_id, drill_id, input, drill_hcp) values (gen_random_uuid(), auth.uid(), 'circle-putting', '{}', 1.0);
    raise exception 'FAIL: client wrote drill_hcp';
  exception when insufficient_privilege or check_violation then null; end;
  -- Anna cannot read real_hcp column directly
  begin
    perform real_hcp from profiles;
    raise exception 'FAIL: real_hcp column readable';
  exception when insufficient_privilege then null; end;
end $$;

set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  if (select count(*) from drill_results) <> 0 then raise exception 'FAIL: Ben sees results before accepting friendship'; end if;
end $$;
update friendships set status = 'accepted' where addressee = auth.uid();
do $$ begin
  if (select count(*) from drill_results) <> 1 then raise exception 'FAIL: friend cannot see results'; end if;
  if (select real_hcp from profile_public where display_name = 'Anna') is distinct from 18.4 then raise exception 'FAIL: friend cannot see real HCP'; end if;
end $$;

set request.jwt.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  if (select count(*) from drill_results) <> 0 then raise exception 'FAIL: stranger sees results'; end if;
  if (select real_hcp from profile_public where display_name = 'Anna') is not null then raise exception 'FAIL: stranger sees real HCP'; end if;
end $$;

set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
update profiles set results_visibility = 'nobody' where id = auth.uid();
set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  if (select count(*) from drill_results) <> 0 then raise exception 'FAIL: visibility "nobody" ignored'; end if;
end $$;
reset role;
select 'RLS TESTS PASSED' as result;
