-- Pruebas de mensajeria (Bloque F: MSG-01, NOT-01).
-- Seed: solicitud e0..02 (cliente@demo.cl 0d..01) cotizada por Hogar Fresco (a0..03,
-- proveedor@demo.cl 0d..03) y Climatiza Nunoa (a0..11, proveedor2@demo.cl 0d..04).
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select ok(exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
                  and schemaname = 'public' and tablename = 'messages'),
  'NOT-01/MSG-01: messages esta publicada en Realtime');
select ok(exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
                  and schemaname = 'public' and tablename = 'notifications'),
  'NOT-01: notifications esta publicada en Realtime');

insert into public.messages (request_id, provider_id, sender_id, body) values
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', '0d000000-0000-4000-8000-000000000001', 'pgtap: Hola Hogar Fresco'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000011', '0d000000-0000-4000-8000-000000000001', 'pgtap: Hola Climatiza');

set local role authenticated;

-- Proveedor 1: solo ve su hilo.
select set_config('request.jwt.claims', '{"sub":"0d000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*)::int from public.messages where request_id = 'e0000000-0000-0000-0000-000000000002' and body like 'pgtap:%'), 1,
  'PR-028: el proveedor solo ve los mensajes de su propio hilo');
select lives_ok($$ insert into public.messages (request_id, provider_id, sender_id, body) values
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', auth.uid(), 'pgtap: Respuesta') $$,
  'PR-028: el proveedor escribe en su hilo');
select throws_ok($$ insert into public.messages (request_id, provider_id, sender_id, body) values
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000011', auth.uid(), 'pgtap: Intromision') $$,
  '42501', null, 'PR-028: el proveedor no escribe en el hilo de otro proveedor');

-- Cliente: ve ambos hilos.
select set_config('request.jwt.claims', '{"sub":"0d000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*)::int from public.messages where request_id = 'e0000000-0000-0000-0000-000000000002' and body like 'pgtap:%'), 3,
  'PR-028: el cliente ve los hilos con todos los proveedores que cotizaron');

-- Otro cliente: no ve nada ni puede suplantar.
select set_config('request.jwt.claims', '{"sub":"0d000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*)::int from public.messages where request_id = 'e0000000-0000-0000-0000-000000000002' and body like 'pgtap:%'), 0,
  'PR-028: un tercero no ve los mensajes');
reset role;

select * from finish();
rollback;
