-- 0014: métricas comerciales del proveedor (solicitud de cambio, 13/11/2026).
-- - request_deliveries: historial de qué solicitudes llegaron a cada proveedor
--   (la bandeja se calcula en vivo y olvida las canceladas o adjudicadas a otro).
-- - quotes.accepted_at: momento en que se aceptó la cotización.
-- - provider_metrics / admin_cancellation_metrics: agregados por rango [from, to).

create table if not exists public.request_deliveries (
  request_id uuid not null references public.service_requests(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  delivered_at timestamptz not null default now(),
  primary key (request_id, provider_id)
);
create index if not exists request_deliveries_provider_idx
  on public.request_deliveries (provider_id, delivered_at);

alter table public.request_deliveries enable row level security;

-- Helper security definer para no consultar providers desde la política (D-24).
create or replace function public.is_provider_owner(p_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.providers where id = p_provider_id and user_id = auth.uid());
$$;

drop policy if exists deliveries_select on public.request_deliveries;
create policy deliveries_select on public.request_deliveries
  for select to authenticated
  using (public.is_admin() or public.is_provider_owner(provider_id));
revoke insert, update, delete on public.request_deliveries from authenticated, anon;

-- Entrega al crear la solicitud: los elegibles en ese momento (RN-03).
create or replace function public.service_requests_record_deliveries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.request_deliveries (request_id, provider_id, delivered_at)
  select new.id, e.provider_id, new.created_at
  from public.eligible_providers_for_request(new.id) e
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists service_requests_record_deliveries on public.service_requests;
create trigger service_requests_record_deliveries
  after insert on public.service_requests
  for each row execute function public.service_requests_record_deliveries();

-- Quien cotiza siempre tiene su entrega (p. ej. pasó a ser elegible después).
create or replace function public.quotes_record_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.request_deliveries (request_id, provider_id, delivered_at)
  values (new.request_id, new.provider_id, new.created_at)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists quotes_record_delivery on public.quotes;
create trigger quotes_record_delivery
  after insert on public.quotes
  for each row execute function public.quotes_record_delivery();

-- accepted_at se fija al pasar a 'aceptada' (accept_quote no cambia).
alter table public.quotes add column if not exists accepted_at timestamptz;

create or replace function public.quotes_set_accepted_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'aceptada' and old.status is distinct from 'aceptada' then
    new.accepted_at := coalesce(new.accepted_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists quotes_set_accepted_at on public.quotes;
create trigger quotes_set_accepted_at
  before update on public.quotes
  for each row execute function public.quotes_set_accepted_at();

-- Backfill: cotizaciones existentes y elegibles actuales de solicitudes abiertas.
insert into public.request_deliveries (request_id, provider_id, delivered_at)
select distinct on (q.request_id, q.provider_id) q.request_id, q.provider_id, sr.created_at
from public.quotes q
join public.service_requests sr on sr.id = q.request_id
on conflict do nothing;

insert into public.request_deliveries (request_id, provider_id, delivered_at)
select sr.id, e.provider_id, sr.created_at
from public.service_requests sr
cross join lateral public.eligible_providers_for_request(sr.id) e
where sr.status in ('abierta', 'con_cotizaciones')
on conflict do nothing;

update public.quotes q
set accepted_at = ev.created_at
from (
  select request_id, max(created_at) as created_at
  from public.service_request_events
  where to_status = 'aceptada'
  group by request_id
) ev
where q.request_id = ev.request_id and q.status = 'aceptada' and q.accepted_at is null;

update public.quotes set accepted_at = updated_at
where status = 'aceptada' and accepted_at is null;

-- ---------------------------------------------------------------------------
-- Métricas del proveedor en [p_from, p_to). Solo service_role (D-22).
-- ---------------------------------------------------------------------------
create or replace function public.provider_metrics(p_provider_id uuid, p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with received as (
    select d.request_id, d.delivered_at
    from public.request_deliveries d
    where d.provider_id = p_provider_id and d.delivered_at >= p_from and d.delivered_at < p_to
  ),
  first_quote as (
    select q.request_id, min(q.created_at) as first_at
    from public.quotes q
    where q.provider_id = p_provider_id
    group by q.request_id
  ),
  quoted as (
    select fq.request_id, fq.first_at
    from first_quote fq
    where fq.first_at >= p_from and fq.first_at < p_to
  ),
  accepted as (
    select q.request_id, q.amount
    from public.quotes q
    where q.provider_id = p_provider_id and q.accepted_at >= p_from and q.accepted_at < p_to
  ),
  responses as (
    select extract(epoch from (fq.first_at - d.delivered_at)) as seconds
    from quoted fq
    join public.request_deliveries d
      on d.request_id = fq.request_id and d.provider_id = p_provider_id
    where fq.first_at >= d.delivered_at
  ),
  reasons as (
    select sr.cancel_reason::text as reason, count(*) as total
    from public.request_deliveries d
    join public.service_requests sr on sr.id = d.request_id
    where d.provider_id = p_provider_id
      and sr.status = 'cancelada'
      and sr.cancelled_at >= p_from and sr.cancelled_at < p_to
    group by sr.cancel_reason
  )
  select jsonb_build_object(
    'received', (select count(*) from received),
    'quoted', (select count(*) from quoted),
    'accepted', (select count(*) from accepted),
    'receivedQuoted', (select count(*) from received r join first_quote fq on fq.request_id = r.request_id),
    'quotedAccepted', (
      select count(*) from quoted fq
      join public.quotes q on q.request_id = fq.request_id
        and q.provider_id = p_provider_id and q.status = 'aceptada'
    ),
    'avgFirstResponseSeconds', (select round(avg(seconds))::bigint from responses),
    'acceptedAmount', (select coalesce(sum(amount), 0) from accepted),
    'cancelReasons', coalesce((select jsonb_object_agg(reason, total) from reasons), '{}'::jsonb)
  );
$$;

create or replace function public.admin_cancellation_metrics(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(reason, total), '{}'::jsonb)
  from (
    select cancel_reason::text as reason, count(*) as total
    from public.service_requests
    where status = 'cancelada' and cancelled_at >= p_from and cancelled_at < p_to
    group by cancel_reason
  ) t;
$$;

revoke execute on function public.provider_metrics(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.admin_cancellation_metrics(timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.service_requests_record_deliveries() from public, anon, authenticated;
revoke execute on function public.quotes_record_delivery() from public, anon, authenticated;
grant execute on function public.provider_metrics(uuid, timestamptz, timestamptz),
  public.admin_cancellation_metrics(timestamptz, timestamptz) to service_role;
