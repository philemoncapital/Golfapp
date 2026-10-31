-- Parity: the SQL engine (0002) must return exactly what the TypeScript engine returns.
-- Needs pulse_test.hcp_vectors (supabase/tests/local/hcp_vectors.sql); skipped if it is missing.
do $$
declare bad int; total int; ex record;
begin
  if to_regclass('pulse_test.hcp_vectors') is null then raise notice 'hcp vectors not loaded – skipped'; return; end if;
  select count(*) into total from pulse_test.hcp_vectors;
  select count(*) into bad from pulse_test.hcp_vectors v join drills d on d.id = v.drill_id
    where public.result_hcp(d.scoring, v.input, d.duration_min) is distinct from v.expected;
  if bad > 0 then
    select v.drill_id, v.input, v.expected, public.result_hcp(d.scoring, v.input, d.duration_min) as got into ex
      from pulse_test.hcp_vectors v join drills d on d.id = v.drill_id
      where public.result_hcp(d.scoring, v.input, d.duration_min) is distinct from v.expected limit 1;
    raise exception 'FAIL: % of % HCP vectors differ, e.g. % % expected % got %', bad, total, ex.drill_id, ex.input, ex.expected, ex.got;
  end if;
  raise notice 'HCP PARITY PASSED (% vectors)', total;
end $$;
select 'HCP PARITY PASSED' as result;
