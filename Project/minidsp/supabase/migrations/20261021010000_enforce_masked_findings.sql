revoke insert on public.scans, public.findings from authenticated;

create or replace function public.create_scan_with_findings(
  p_file_name text,
  p_file_size integer,
  p_risk text,
  p_findings jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_scan_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(p_findings) is distinct from 'array' then
    raise exception 'Findings must be an array';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_findings) as item(
      finding_type text,
      risk text,
      occurrence_count integer,
      masked_example text
    )
    where item.occurrence_count is null
       or item.occurrence_count <= 0
       or item.masked_example is null
       or (item.finding_type = 'Email' and (
         item.risk <> 'Low'
         or item.masked_example !~ '^[^@[:space:]]\*{3}@[^@[:space:]]+(\.[^@[:space:]]+)+$'
       ))
       or (item.finding_type = 'UK phone' and (
         item.risk <> 'Medium'
         or item.masked_example !~ '^\+?[0-9]{2}\*{1,10}[0-9]{3}$'
       ))
       or (item.finding_type = 'UK NINO' and (
         item.risk <> 'High'
         or item.masked_example !~ '^[A-Z]{2}\*{6}[A-D]?$'
       ))
       or (item.finding_type = 'Payment card' and (
         item.risk <> 'Critical'
         or item.masked_example !~ '^\*{9,15}[0-9]{4}$'
       ))
       or item.finding_type not in ('Email', 'UK phone', 'UK NINO', 'Payment card')
  ) then
    raise exception 'Findings must contain valid masked examples and detector risks';
  end if;

  insert into public.scans (user_id, file_name, file_size, risk)
  values (auth.uid(), p_file_name, p_file_size, p_risk)
  returning id into new_scan_id;

  insert into public.findings (
    user_id, scan_id, finding_type, risk, occurrence_count, masked_example
  )
  select
    auth.uid(),
    new_scan_id,
    item.finding_type,
    item.risk,
    item.occurrence_count,
    item.masked_example
  from jsonb_to_recordset(p_findings) as item(
    finding_type text,
    risk text,
    occurrence_count integer,
    masked_example text
  );

  return new_scan_id;
end;
$$;

revoke all on function public.create_scan_with_findings(text, integer, text, jsonb) from public, anon;
grant execute on function public.create_scan_with_findings(text, integer, text, jsonb) to authenticated;
