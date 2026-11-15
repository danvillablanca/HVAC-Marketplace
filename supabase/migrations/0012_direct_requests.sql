-- =============================================================================
-- Migracion 0012: solicitudes directas a una empresa (REQ-SOL-01/02)
-- El cliente puede pedir cotizacion a un proveedor especifico desde su perfil.
-- Es una service_request con target_provider_id: reutiliza bandeja, cotizacion,
-- chat y notificaciones. Solo ese proveedor (verificado) es elegible.
-- =============================================================================

alter table public.service_requests
  add column if not exists target_provider_id uuid references public.providers (id) on delete set null;

create index if not exists service_requests_target_idx on public.service_requests (target_provider_id);

-- RN-03 con solicitud directa: si hay destinatario, solo el (verificado). El
-- cliente ya eligio a la empresa, por eso no se exige cobertura ni el servicio.
create or replace function public.eligible_providers_for_request(p_request_id uuid)
returns table (provider_id uuid, user_id uuid, distance_meters double precision)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.id, p.user_id, st_distance(l.geom, sr.geom)
  from public.service_requests sr
  join public.providers p on p.verification_status = 'verificado'
  join public.locations l on l.provider_id = p.id and l.is_primary = true
  where sr.id = p_request_id
    and sr.geom is not null
    and (
      (sr.target_provider_id is not null and p.id = sr.target_provider_id)
      or (
        sr.target_provider_id is null
        and p.is_available = true
        and st_dwithin(l.geom, sr.geom, p.coverage_radius_km * 1000)
        and (
          sr.service_id is null
          or exists (
            select 1 from public.provider_services ps
            where ps.provider_id = p.id and ps.service_id = sr.service_id
          )
        )
      )
    );
$$;

-- La bandeja informa si la solicitud fue dirigida a este proveedor.
drop function if exists public.provider_inbox(uuid);

create or replace function public.provider_inbox(p_provider_id uuid)
returns table (
  id uuid,
  service_id uuid,
  service_name text,
  equipment equipment_type,
  description text,
  urgency urgency_level,
  status request_status,
  commune text,
  region text,
  distance_km numeric,
  quotes_count bigint,
  my_quote_status quote_status,
  eligible boolean,
  is_direct boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    sr.id,
    sr.service_id,
    s.name,
    sr.equipment,
    sr.description,
    sr.urgency,
    sr.status,
    sr.commune,
    sr.region,
    round((d.meters / 1000)::numeric, 1),
    (select count(*) from public.quotes q
      where q.request_id = sr.id and q.status in ('enviada', 'aceptada')),
    mq.status,
    el.ok,
    coalesce(sr.target_provider_id = p_provider_id, false),
    sr.created_at,
    sr.updated_at
  from public.service_requests sr
  left join public.services s on s.id = sr.service_id
  left join lateral (
    select st_distance(l.geom, sr.geom) as meters
    from public.locations l
    where l.provider_id = p_provider_id and l.is_primary = true
  ) d on true
  left join lateral (
    select q.status from public.quotes q
    where q.request_id = sr.id and q.provider_id = p_provider_id
    order by q.created_at desc
    limit 1
  ) mq on true
  cross join lateral (
    select exists (
      select 1 from public.eligible_providers_for_request(sr.id) e
      where e.provider_id = p_provider_id
    ) as ok
  ) el
  where sr.status <> 'cancelada'
    and (
      (sr.status in ('abierta', 'con_cotizaciones') and (el.ok or mq.status = 'enviada'))
      or mq.status = 'aceptada'
    )
  order by sr.created_at desc;
$$;

revoke execute on function public.provider_inbox(uuid) from public, anon, authenticated;
grant execute on function public.provider_inbox(uuid) to service_role;
