-- Pruebas del ambiente de datos base (Bloque A: 1.4.1.2.2 y 1.5.1.1).
-- Ejecutar con: pnpm db:test (requiere `pnpm db:reset` previo).
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select ok((select count(*) from public.communes where region = 'Metropolitana de Santiago') = 52,
  'communes: las 52 comunas de la Region Metropolitana');
select ok((select count(distinct region) from public.communes where is_regional_capital) = 16,
  'communes: una capital por cada una de las 16 regiones');
select ok((select count(*) from public.providers where verification_status = 'verificado') >= 30,
  'providers: al menos 30 proveedores verificados');
select ok((select count(*) from public.providers where verification_status <> 'verificado') between 3 and 4,
  'providers: 3 o 4 proveedores en la cola de verificacion');
select ok(not exists (
    select 1 from public.locations l where not exists (select 1 from public.communes c where c.name = l.commune)
  ), 'locations: toda ubicacion usa una comuna del catalogo');
select ok((select count(distinct status) from public.service_requests) = 6,
  'service_requests: hay solicitudes en los 6 estados');
select ok((select count(distinct status) from public.quotes) = 4,
  'quotes: hay cotizaciones en los 4 estados');
select set_eq(
  $$ select email::text from auth.users where email like '%@demo.cl' $$,
  $$ values ('admin@demo.cl'), ('cliente2@demo.cl'), ('cliente@demo.cl'), ('proveedor2@demo.cl'), ('proveedor@demo.cl') $$,
  'auth.users: existen los 5 usuarios demo');
select is((select p.role::text from public.profiles p join auth.users u on u.id = p.id where u.email = 'admin@demo.cl'),
  'admin', 'profiles: admin@demo.cl tiene rol admin');
select is((select count(*)::int from public.providers p join auth.users u on u.id = p.user_id
    where u.email in ('proveedor@demo.cl', 'proveedor2@demo.cl') and p.verification_status = 'verificado'),
  2, 'providers: las dos cuentas proveedor demo administran un proveedor verificado');

set local role anon;
select ok((select count(*) from public.communes) = 68, 'RLS: anon puede leer el catalogo de comunas');

select * from finish();
rollback;
