-- Métricas comerciales del proveedor (migración 0014, solicitud de cambio 13/11/2026).
-- Usa el seed: cliente@demo.cl (0d..01), proveedor2@demo.cl (0d..04, Climatiza Ñuñoa a0..11),
-- proveedor@demo.cl (0d..03, Hogar Fresco a0..03).
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Dos solicitudes nuevas en Ñuñoa: llegan a Climatiza Ñuñoa por trigger.
insert into public.service_requests (id, client_id, service_id, equipment, description, urgency, commune)
values
  ('ffffffff-0000-4000-8000-0000000000a1', '0d000000-0000-4000-8000-000000000001',
   '50000000-0000-0000-0000-000000000002', 'split', 'Metricas: solicitud que se cotiza y acepta', 'media', 'Ñuñoa'),
  ('ffffffff-0000-4000-8000-0000000000a2', '0d000000-0000-4000-8000-000000000001',
   '50000000-0000-0000-0000-000000000002', 'split', 'Metricas: solicitud que se cancela sin cotizar', 'media', 'Ñuñoa');

select is((select count(*)::int from public.request_deliveries
  where provider_id = 'a0000000-0000-0000-0000-000000000011'
    and request_id in ('ffffffff-0000-4000-8000-0000000000a1', 'ffffffff-0000-4000-8000-0000000000a2')),
  2, 'Métricas: la solicitud nueva queda registrada como recibida por cada elegible');

select public.create_quote('ffffffff-0000-4000-8000-0000000000a1', 'a0000000-0000-0000-0000-000000000011',
  150000, true, 'Instalación completa con materiales y garantía', 2, 10);
select public.accept_quote((select id from public.quotes
  where request_id = 'ffffffff-0000-4000-8000-0000000000a1' and provider_id = 'a0000000-0000-0000-0000-000000000011'),
  '0d000000-0000-4000-8000-000000000001');
select ok((select accepted_at is not null from public.quotes
  where request_id = 'ffffffff-0000-4000-8000-0000000000a1' and status = 'aceptada'),
  'Métricas: aceptar fija quotes.accepted_at');

select public.transition_request('ffffffff-0000-4000-8000-0000000000a2', 'cancelada',
  '0d000000-0000-4000-8000-000000000001', null, 'resuelto_solo', null);

-- Rango de hoy (now() es fijo dentro de la transacción).
create temp table m as
select public.provider_metrics('a0000000-0000-0000-0000-000000000011',
  date_trunc('day', now()), date_trunc('day', now()) + interval '1 day') as j;

select cmp_ok((select (j->>'received')::int from m), '>=', 2, 'Métricas: cuenta las recibidas del rango');
select cmp_ok((select (j->>'quoted')::int from m), '>=', 1, 'Métricas: cuenta las cotizadas del rango');
select cmp_ok((select (j->>'accepted')::int from m), '>=', 1, 'Métricas: cuenta las aceptadas del rango');
select cmp_ok((select (j->>'acceptedAmount')::bigint from m), '>=', 150000::bigint,
  'Métricas: suma el monto aceptado');
select ok((select (j->>'receivedQuoted')::int <= (j->>'received')::int from m),
  'Métricas: la tasa de cotización no supera el 100 %');
select ok((select (j->>'avgFirstResponseSeconds') is not null from m),
  'Métricas: calcula el tiempo de primera respuesta');
select cmp_ok((select (j->'cancelReasons'->>'resuelto_solo')::int from m), '>=', 1,
  'Métricas: desglosa las cancelaciones por motivo');

select is((select (public.provider_metrics('a0000000-0000-0000-0000-000000000011',
  '2000-01-01', '2000-02-01')->>'received')::int), 0, 'Métricas: un rango sin actividad da cero');

select cmp_ok((select (public.admin_cancellation_metrics(date_trunc('day', now()),
  date_trunc('day', now()) + interval '1 day')->>'resuelto_solo')::int), '>=', 1,
  'Métricas admin: conteo de motivos de la plataforma');

-- Permisos: solo service_role ejecuta las RPC; RLS en request_deliveries.
select ok(not has_function_privilege('authenticated',
  'public.provider_metrics(uuid, timestamptz, timestamptz)', 'execute'),
  'Métricas: authenticated no ejecuta provider_metrics');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"0d000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*)::int from public.request_deliveries
  where provider_id = 'a0000000-0000-0000-0000-000000000011'), 0,
  'Métricas RLS: un proveedor no ve las entregas de otro');
select set_config('request.jwt.claims', '{"sub":"0d000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select cmp_ok((select count(*)::int from public.request_deliveries
  where provider_id = 'a0000000-0000-0000-0000-000000000011'), '>=', 2,
  'Métricas RLS: el proveedor ve sus propias entregas');

select * from finish();
rollback;
