-- =============================================================================
-- Migracion 0010: filtros y orden de la busqueda (REQ-BUS-03)
-- Agrega calificacion minima, solo disponibles y orden por distancia o
-- calificacion. El orden va en el servidor para que la paginacion sea estable.
-- =============================================================================

drop function if exists public.nearby_providers(
  double precision, double precision, double precision, service_segment, uuid, text, int, int
);

create or replace function public.nearby_providers(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision,
  p_segment service_segment default null,
  p_service_id uuid default null,
  p_query text default null,
  p_limit int default 10,
  p_offset int default 0,
  p_min_rating numeric default null,
  p_only_available boolean default false,
  p_sort text default 'distance'
)
returns table (
  id uuid,
  legal_name text,
  slug text,
  segment service_segment,
  verification_status verification_status,
  rating_avg numeric(3, 2),
  reviews_count integer,
  commune text,
  lat double precision,
  lng double precision,
  distance_meters double precision,
  services text[],
  price_from integer,
  is_available boolean,
  coverage_radius_km integer,
  is_demo boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with origin as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as geo
  )
  select
    p.id,
    p.legal_name,
    p.slug,
    p.segment,
    p.verification_status,
    p.rating_avg,
    p.reviews_count,
    l.commune,
    l.lat,
    l.lng,
    st_distance(l.geom, o.geo) as distance_meters,
    coalesce(svc.services, '{}'::text[]) as services,
    svc.price_from,
    p.is_available,
    p.coverage_radius_km,
    p.is_demo,
    count(*) over () as total_count
  from public.providers p
  join public.locations l on l.provider_id = p.id and l.is_primary = true
  cross join origin o
  left join lateral (
    select
      array_remove(array_agg(distinct s.name), null) as services,
      min(ps.price_from) as price_from
    from public.provider_services ps
    join public.services s on s.id = ps.service_id
    where ps.provider_id = p.id
  ) svc on true
  -- VER-03: solo verificados. BUS-02: dentro del radio y de la cobertura del proveedor.
  where p.verification_status = 'verificado'
    and st_dwithin(l.geom, o.geo, least(p_radius_km, p.coverage_radius_km) * 1000)
    and (p_segment is null or p.segment = p_segment)
    and (
      p_service_id is null
      or exists (
        select 1 from public.provider_services ps2
        where ps2.provider_id = p.id and ps2.service_id = p_service_id
      )
    )
    and (
      p_query is null
      or p.legal_name ilike '%' || p_query || '%'
      or p.description ilike '%' || p_query || '%'
      or exists (select 1 from unnest(svc.services) sn where sn ilike '%' || p_query || '%')
    )
    and (p_min_rating is null or coalesce(p.rating_avg, 0) >= p_min_rating)
    and (not p_only_available or p.is_available)
  order by
    case when p_sort = 'rating' then coalesce(p.rating_avg, 0) end desc nulls last,
    case when p_sort = 'rating' then p.reviews_count end desc,
    distance_meters asc
  limit p_limit
  offset p_offset;
$$;

grant execute on function public.nearby_providers(
  double precision, double precision, double precision, service_segment, uuid, text, int, int,
  numeric, boolean, text
) to anon, authenticated;
