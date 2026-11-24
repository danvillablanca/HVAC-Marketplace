-- 0015: límite de uso del asistente IA (REQ-IA-04).
-- Cuenta consultas por usuario y día (hora de Chile). Solo el backend (service role) la usa.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Suma una consulta si no se superó el límite. Devuelve el total del día o null si ya se alcanzó.
create or replace function public.consume_ai_quota(p_user_id uuid, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_day date := (now() at time zone 'America/Santiago')::date;
begin
  insert into public.ai_usage as u (user_id, day, count)
  values (p_user_id, v_day, 1)
  on conflict (user_id, day) do update
    set count = u.count + 1
    where u.count < p_limit
  returning u.count into v_count;
  return v_count;
end;
$$;

revoke execute on function public.consume_ai_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, integer) to service_role;
