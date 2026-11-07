-- Golf Pulse – 0006: radius drills scored as "1 point per ball inside my circle" (circle from the real HCP).
-- Run once in the Supabase SQL editor AFTER 0005. Older results with per-ball distances keep working.
-- Mirrors circleHcp() in src/engine/handicap.ts (parity-tested).

-- Band met (hits ≥ pass): from the band midpoint towards the next better band by the share above the pass mark
-- (best band: towards its lower bound). Not met: towards the next worse band (worst band: 54) by the missing share.
create or replace function public.hcp_circle(bands jsonb, band_hi float8, hits int, balls int, pass_hits int) returns float8
language plpgsql immutable as $$
declare
  ord jsonb[] := public.hcp_ordered_bands(bands);
  n int := coalesce(array_length(ord, 1), 0);
  i int := 0; j int; pass int; m float8; s float8; target float8; worse float8;
begin
  for j in 1..n loop if (ord[j]->>'hcp_hi')::float8 = band_hi then i := j; end if; end loop;
  if i = 0 or balls < 1 then return null; end if;
  pass := least(greatest(pass_hits, 1), balls);
  m := public.hcp_mid(ord[i]);
  if hits >= pass then
    s := case when balls > pass then least((hits - pass)::float8 / (balls - pass), 1) else 1 end;
    target := case when i = n then (ord[i]->>'hcp_lo')::float8 else public.hcp_mid(ord[i + 1]) end;
    return public.hcp_round1(public.hcp_clamp(m - least(s, 0.999) * (m - target)));
  end if;
  worse := case when i = 1 then 54 else public.hcp_mid(ord[i - 1]) end;
  return public.hcp_round1(public.hcp_clamp(m + (1 - hits::float8 / pass) * (worse - m)));
end $$;

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
  elsif k = 'circle' then
    return public.hcp_circle(bands, (input->>'band_hi')::float8, (input->>'hits')::int, (input->>'balls')::int,
      coalesce((scoring->>'pass_hits')::int, ceil((input->>'balls')::int / 2.0)::int));
  end if;
  return null;
end $$;

create or replace function public.result_score(input jsonb, duration_min int) returns float8
language sql immutable as $$
  select case input->>'kind'
    when 'value' then (input->>'value')::float8
    when 'circle' then (input->>'hits')::float8
    when 'time_fallback' then duration_min * (input->>'required_hits')::float8 / greatest((input->>'hits')::float8, 0.5)
    else null end
$$;

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
  elsif k = 'circle' then
    if t <> 'radius_by_band' then raise exception 'circle input only for radius drills' using errcode = '22023'; end if;
    if jsonb_typeof(input->'hits') <> 'number' or jsonb_typeof(input->'balls') <> 'number' or jsonb_typeof(input->'band_hi') <> 'number'
       or (input->>'balls')::float8 not between 1 and maxballs or (input->>'balls')::float8 <> floor((input->>'balls')::float8)
       or (input->>'hits')::float8 not between 0 and (input->>'balls')::float8 or (input->>'hits')::float8 <> floor((input->>'hits')::float8)
       or not exists (select 1 from jsonb_array_elements(scoring->'bands') x where (x->>'hcp_hi')::float8 = (input->>'band_hi')::float8) then
      raise exception 'invalid circle input' using errcode = '22023'; end if;
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

create or replace function public.result_is_perfect(scoring jsonb, input jsonb) returns boolean
language plpgsql immutable as $$
declare p float8 := (scoring->>'perfect')::float8; best jsonb; hits int;
begin
  if p is null then return false; end if;
  if input->>'kind' = 'value' then
    return case when coalesce((scoring->>'lower_is_better')::boolean, false)
                then (input->>'value')::float8 <= p else (input->>'value')::float8 >= p end;
  elsif input->>'kind' = 'circle' then
    return (input->>'hits')::float8 >= p;
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

revoke execute on function public.hcp_circle(jsonb, float8, integer, integer, integer) from public, anon;
grant execute on function public.hcp_circle(jsonb, float8, integer, integer, integer) to authenticated;
