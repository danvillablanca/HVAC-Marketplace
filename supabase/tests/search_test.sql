-- Pruebas de busqueda (Bloque C: VER-03 / D-12, BUS-02 y D-18).
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- Origen: centro de Santiago, radio amplio.
create temp table r as
  select * from public.nearby_providers(-33.4378, -70.6505, 100, null, null, null, 200, 0);

select ok(not exists (select 1 from r where verification_status <> 'verificado'),
  'PR-015 VER-03: la busqueda solo devuelve proveedores verificados');
select ok(not exists (select 1 from r where distance_meters > coverage_radius_km * 1000),
  'PR-017 BUS-02: el cliente queda dentro del radio de cobertura de cada proveedor');
select ok((select bool_and(lat is not null and lng is not null and array_length(services, 1) > 0) from r),
  'D-18: cada resultado trae coordenadas y servicios');
select is((select count(*)::int from public.nearby_providers(-33.4378, -70.6505, 100, null, null, null, 5, 0)),
  5, 'PR-018: limit pagina los resultados');
select is((select max(total_count)::int from public.nearby_providers(-33.4378, -70.6505, 100, null, null, null, 5, 0)),
  (select count(*)::int from r), 'PR-018: total_count informa el total sin paginar');
select ok(exists (select 1 from public.nearby_providers(-33.4378, -70.6505, 100, null, null, 'clima', 50, 0))
  and not exists (
    select 1 from public.nearby_providers(-33.4378, -70.6505, 100, null, null, 'clima', 50, 0) n
    join public.providers p on p.id = n.id
    where not (p.legal_name ilike '%clima%' or p.description ilike '%clima%'
               or exists (select 1 from unnest(n.services) s where s ilike '%clima%'))),
  'PR-018: el filtro de texto solo devuelve coincidencias');

select ok(not exists (
    select 1 from public.nearby_providers(-33.4378, -70.6505, 100, null, null, null, 200, 0, 4.5, false, 'distance')
    where coalesce(rating_avg, 0) < 4.5),
  'PR-018 BUS-03: calificacion minima');
select ok(not exists (
    select 1 from public.nearby_providers(-33.4378, -70.6505, 100, null, null, null, 200, 0, null, true, 'distance')
    where not is_available)
  and exists (select 1 from r where not is_available),
  'PR-012/PR-018: solo disponibles excluye a los no disponibles');
select ok((
    select bool_and(prev >= cur) from (
      select coalesce(rating_avg, 0) as cur,
             lag(coalesce(rating_avg, 0)) over (order by ord) as prev
      from (select rating_avg, row_number() over () as ord
            from public.nearby_providers(-33.4378, -70.6505, 100, null, null, null, 200, 0, null, false, 'rating')) x
    ) y where prev is not null),
  'PR-018 BUS-03: orden por calificacion descendente');

select * from finish();
rollback;
