-- Pruebas de solicitudes y cotizaciones (Bloque E: SOL, COT, D-11, D-22, D-23).
-- Usa el seed: cliente@demo.cl (0d..01), proveedor@demo.cl (0d..03, Hogar Fresco a0..03),
-- proveedor2@demo.cl (0d..04, Climatiza Ñuñoa a0..11).
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

-- Solicitud nueva de cliente@demo.cl en Ñuñoa (geom desde la comuna por trigger).
insert into public.service_requests (id, client_id, service_id, equipment, description, urgency, commune)
values ('ffffffff-0000-4000-8000-000000000001', '0d000000-0000-4000-8000-000000000001',
        '50000000-0000-0000-0000-000000000002', 'split',
        'Instalar split en dormitorio, prueba pgTAP del bloque E', 'media', 'Ñuñoa');

select ok((select geom is not null from public.service_requests where id = 'ffffffff-0000-4000-8000-000000000001'),
  'PR-020: sin geolocalizacion se usa el centroide de la comuna');
select ok(exists (select 1 from public.eligible_providers_for_request('ffffffff-0000-4000-8000-000000000001')
                  where provider_id = 'a0000000-0000-0000-0000-000000000011'),
  'PR-021 RN-03: un proveedor verificado, cercano y con el servicio es elegible');
select ok(not exists (
    select 1 from public.eligible_providers_for_request('ffffffff-0000-4000-8000-000000000001') e
    join public.providers p on p.id = e.provider_id
    where p.verification_status <> 'verificado' or not p.is_available
       or not exists (select 1 from public.provider_services ps where ps.provider_id = p.id
                      and ps.service_id = '50000000-0000-0000-0000-000000000002')),
  'PR-021 RN-03: no son elegibles no verificados, no disponibles ni sin el servicio');

-- Cotizacion de un proveedor no elegible (Antofagasta) es rechazada.
select throws_ok($$ select public.create_quote('ffffffff-0000-4000-8000-000000000001',
  'a0000000-0000-0000-0000-000000000005', 50000, true, 'Alcance de prueba suficientemente largo', 2, 10) $$,
  '42501', null, 'PR-025: un proveedor no elegible no puede cotizar');

select lives_ok($$ select public.create_quote('ffffffff-0000-4000-8000-000000000001',
  'a0000000-0000-0000-0000-000000000011', 60000, true, 'Instalación completa con materiales y garantía', 2, 10) $$,
  'PR-025: el proveedor elegible cotiza');
select is((select status::text from public.service_requests where id = 'ffffffff-0000-4000-8000-000000000001'),
  'con_cotizaciones', 'PR-023: la primera cotizacion pasa la solicitud a con_cotizaciones');
select throws_ok($$ select public.create_quote('ffffffff-0000-4000-8000-000000000001',
  'a0000000-0000-0000-0000-000000000011', 61000, true, 'Segunda cotización del mismo proveedor', 2, 10) $$,
  '23505', null, 'PR-025 RN-04: una sola cotizacion activa por proveedor');

-- La bandeja no expone la direccion: la funcion no tiene esa columna.
select ok(not (select proargnames && array['address', 'client_id', 'geom']
                from pg_proc where proname = 'provider_inbox'),
  'PR-022 SOL-02: provider_inbox no expone direccion ni cliente');

-- D-11 / D-22: el actor se valida aunque la RPC corra con service_role.
select throws_ok($$ select public.accept_quote(
  (select id from public.quotes where request_id = 'ffffffff-0000-4000-8000-000000000001'),
  '0d000000-0000-4000-8000-000000000002') $$, '42501', null,
  'PR-026 D-22: otro cliente no puede aceptar la cotizacion');
select throws_ok($$ select public.transition_request('ffffffff-0000-4000-8000-000000000001',
  'cancelada', '0d000000-0000-4000-8000-000000000003', null) $$, '42501', null,
  'PR-024 D-11: un proveedor no puede cancelar la solicitud del cliente');
select lives_ok($$ select public.accept_quote(
  (select id from public.quotes where request_id = 'ffffffff-0000-4000-8000-000000000001'),
  '0d000000-0000-4000-8000-000000000001') $$, 'PR-026: el cliente acepta');
select throws_ok($$ select public.transition_request('ffffffff-0000-4000-8000-000000000001',
  'en_ejecucion', '0d000000-0000-4000-8000-000000000003', null) $$, '42501', null,
  'PR-027 D-11: un proveedor no adjudicado no inicia el trabajo');
select lives_ok($$ select public.transition_request('ffffffff-0000-4000-8000-000000000001',
  'en_ejecucion', '0d000000-0000-4000-8000-000000000004', null) $$, 'PR-027: el adjudicado inicia');
select lives_ok($$ select public.transition_request('ffffffff-0000-4000-8000-000000000001',
  'completada', '0d000000-0000-4000-8000-000000000004', null) $$, 'PR-027: el adjudicado completa');
select lives_ok($$ select public.confirm_completion('ffffffff-0000-4000-8000-000000000001',
  '0d000000-0000-4000-8000-000000000001') $$, 'PR-027 COT-03: el cliente confirma');

-- SOL-05 (cambio de alcance, migracion 0013): motivo obligatorio al cancelar.
insert into public.service_requests (id, client_id, service_id, equipment, description, urgency, commune)
values ('ffffffff-0000-4000-8000-000000000002', '0d000000-0000-4000-8000-000000000001',
        '50000000-0000-0000-0000-000000000002', 'split',
        'Solicitud para probar el motivo obligatorio de cancelacion', 'media', 'Ñuñoa');
select throws_ok($$ select public.transition_request('ffffffff-0000-4000-8000-000000000002',
  'cancelada', '0d000000-0000-4000-8000-000000000001') $$, 'P0001', null,
  'PR-024 SOL-05: no se cancela sin motivo');
select throws_ok($$ select public.transition_request('ffffffff-0000-4000-8000-000000000002',
  'cancelada', '0d000000-0000-4000-8000-000000000001', null, 'otro', '  ') $$, 'P0001', null,
  'PR-024 SOL-05: el motivo "otro" exige detalle');
select lives_ok($$ select public.transition_request('ffffffff-0000-4000-8000-000000000002',
  'cancelada', '0d000000-0000-4000-8000-000000000001', null, 'presupuesto_alto', null) $$,
  'PR-024 SOL-05: el cliente cancela con un motivo de la lista');
select results_eq($$ select cancel_reason::text, cancel_reason_detail, cancelled_at is not null
  from public.service_requests where id = 'ffffffff-0000-4000-8000-000000000002' $$,
  $$ values ('presupuesto_alto'::text, null::text, true) $$,
  'PR-024 SOL-05: la solicitud guarda motivo y fecha de cancelacion');
select is((select note from public.service_request_events
  where request_id = 'ffffffff-0000-4000-8000-000000000002' and to_status = 'cancelada'),
  'Presupuesto alto', 'PR-024 SOL-05: el historial registra la etiqueta del motivo');
select throws_ok($$ update public.service_requests set status = 'cancelada', cancel_reason = null
  where id = 'e0000000-0000-0000-0000-000000000001' $$, '23514', null,
  'SOL-05: la base no admite una solicitud cancelada sin motivo');
select ok((select cancel_reason is not null from public.service_requests
  where id = 'e0000000-0000-0000-0000-000000000006'),
  'SOL-05: la solicitud cancelada del seed tiene motivo');

-- COT-01: vencimiento.
update public.quotes set created_at = now() - interval '20 days', status = 'enviada'
where request_id = 'e0000000-0000-0000-0000-000000000002';
select ok(public.expire_quotes() >= 2, 'COT-01: expire_quotes marca vencidas las cotizaciones fuera de vigencia');

-- D-23: un cliente autenticado no puede cambiar estados directo por REST.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"0d000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$ update public.service_requests set status = 'completada'
  where id = 'e0000000-0000-0000-0000-000000000001' $$, '42501', null,
  'D-23: el cliente no puede cambiar el estado sin pasar por la RPC');
select throws_ok($$ select public.accept_quote(gen_random_uuid(), auth.uid()) $$, '42501', null,
  'D-23: las RPC de transicion no se pueden invocar desde el cliente');
reset role;

select * from finish();
rollback;
