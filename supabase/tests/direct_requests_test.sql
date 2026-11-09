-- Solicitud directa a una empresa (migracion 0012, D-34).
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

-- Desde Arica, dirigida a Hogar Fresco (La Florida): fuera de su cobertura, pero el cliente la eligio.
insert into public.service_requests (id, client_id, equipment, description, urgency, commune, target_provider_id)
values ('dddddddd-0000-4000-8000-0000000000aa', '0d000000-0000-4000-8000-000000000001', 'split',
        'Solicitud directa de prueba pgTAP para Hogar Fresco', 'media', 'Arica', 'a0000000-0000-0000-0000-000000000003');

select results_eq(
  $$ select provider_id from public.eligible_providers_for_request('dddddddd-0000-4000-8000-0000000000aa') $$,
  $$ values ('a0000000-0000-0000-0000-000000000003'::uuid) $$,
  'D-34: solo la empresa elegida es elegible para la solicitud directa');
select ok((select is_direct from public.provider_inbox('a0000000-0000-0000-0000-000000000003')
           where id = 'dddddddd-0000-4000-8000-0000000000aa'),
  'D-34: aparece en la bandeja de la empresa marcada como directa');
select ok(not exists (select 1 from public.provider_inbox('a0000000-0000-0000-0000-000000000011')
                      where id = 'dddddddd-0000-4000-8000-0000000000aa'),
  'D-34: otro proveedor no la ve');

select * from finish();
rollback;
