-- Funciones, triggers y RPC del Marketplace HVAC.

-- ---------------------------------------------------------------------------
-- Busqueda geoespacial de proveedores cercanos.
-- ---------------------------------------------------------------------------
create or replace function public.nearby_providers(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision,
  p_segment service_segment default null,
  p_service_id uuid default null,
  p_limit int default 20
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
  distance_meters double precision,
  services text[],
  price_from integer,
  is_demo boolean
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
    st_distance(l.geom, o.geo) as distance_meters,
    coalesce(svc.services, '{}'::text[]) as services,
    svc.price_from,
    p.is_demo
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
  where (p.verification_status = 'verificado' or p.is_demo = true)
    and st_dwithin(l.geom, o.geo, p_radius_km * 1000)
    and (p_segment is null or p.segment = p_segment)
    and (
      p_service_id is null
      or exists (
        select 1
        from public.provider_services ps2
        where ps2.provider_id = p.id and ps2.service_id = p_service_id
      )
    )
  order by distance_meters asc
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- Busqueda semantica de manuales tecnicos (modulo IA diferido).
-- ---------------------------------------------------------------------------
create or replace function public.match_documents(
  p_query_embedding vector(1536),
  p_match_count int default 5
)
returns table (
  content text,
  similarity double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    dc.content,
    1 - (dc.embedding <=> p_query_embedding) as similarity
  from public.document_chunks dc
  where dc.embedding is not null
  order by dc.embedding <=> p_query_embedding
  limit p_match_count;
$$;

-- ---------------------------------------------------------------------------
-- Perfil automatico al registrar un usuario en auth.users.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' in ('cliente', 'proveedor', 'admin')
        then (new.raw_user_meta_data ->> 'role')::user_role
      else 'cliente'
    end,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at automatico.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
  before update on public.providers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Recalculo de rating_avg / reviews_count al insertar/actualizar/borrar resenas.
-- ---------------------------------------------------------------------------
create or replace function public.increment_provider_reviews()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_id uuid;
begin
  if tg_op = 'DELETE' then
    v_provider_id := old.provider_id;
  else
    v_provider_id := new.provider_id;
  end if;

  update public.providers p
  set
    rating_avg = sub.avg_rating,
    reviews_count = sub.cnt
  from (
    select
      round(avg(r.rating)::numeric, 2) as avg_rating,
      count(*)::integer as cnt
    from public.reviews r
    where r.provider_id = v_provider_id
  ) sub
  where p.id = v_provider_id;

  return null;
end;
$$;

drop trigger if exists reviews_update_provider_stats on public.reviews;
create trigger reviews_update_provider_stats
  after insert or update or delete on public.reviews
  for each row execute function public.increment_provider_reviews();

-- Permisos de ejecucion.
grant execute on function public.nearby_providers(
  double precision, double precision, double precision,
  service_segment, uuid, int
) to anon, authenticated;

grant execute on function public.match_documents(vector, int) to anon, authenticated;
