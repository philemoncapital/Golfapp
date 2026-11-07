-- Saved sessions and accent constraint (0004). Scratch database only; rolled back.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000a7', 'tina@x.de', '{"display_name":"Tina"}'),
 ('00000000-0000-0000-0000-0000000000b7', 'udo@x.de', '{"display_name":"Udo"}');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a7","role":"authenticated"}', false);
set role authenticated;
insert into session_templates (id, user_id, name, drill_ids) values
  ('40000000-0000-0000-0000-000000000001', auth.uid(), 'Putten kompakt', array['circle-putting', 'draw-back']);
do $$ begin
  begin
    insert into session_templates (id, user_id, name, drill_ids) values (gen_random_uuid(), auth.uid(), 'x', array['no-such-drill']);
    raise exception 'FAIL: unknown drill accepted';
  exception when invalid_parameter_value then null; end;
  begin
    insert into session_templates (id, user_id, name, drill_ids) values (gen_random_uuid(), auth.uid(), '  ', array['draw-back']);
    raise exception 'FAIL: empty name accepted';
  exception when check_violation then null; end;
  begin
    insert into session_templates (id, user_id, name, drill_ids) values (gen_random_uuid(), '00000000-0000-0000-0000-0000000000b7', 'x', array['draw-back']);
    raise exception 'FAIL: template for someone else';
  exception when insufficient_privilege then null; end;
  begin
    update profiles set accent = '#3DFFA2' where id = auth.uid();
    raise exception 'FAIL: old accent accepted';
  exception when check_violation then null; end;
  update profiles set accent = '#D9C5FF' where id = auth.uid();
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b7","role":"authenticated"}', false);
do $$ begin
  if exists (select 1 from session_templates) then raise exception 'FAIL: other user sees templates'; end if;
end $$;
reset role;
select 'TEMPLATE TESTS PASSED' as result;
rollback;
