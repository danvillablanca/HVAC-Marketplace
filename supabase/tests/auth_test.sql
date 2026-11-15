-- Pruebas de cuentas (Bloque B: REQ-AUT-01, 02, 04, 06).
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Registro con metadatos manipulados: pide admin.
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-4111-8111-111111111111', 'pgtap-intruso@test.local',
        '{"role":"admin","fullName":"Intruso Pérez","acceptedTermsAt":"2026-11-02T12:00:00Z"}');
-- Registro OAuth: sin rol en los metadatos.
insert into auth.users (id, email, raw_user_meta_data)
values ('22222222-2222-4222-8222-222222222222', 'pgtap-google@test.local', '{"name":"Usuaria Google"}');

select is((select role::text from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'cliente', 'PR-001 RN-01: el registro no puede auto-asignarse admin');
select is((select full_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'Intruso Pérez', 'D-10: el nombre en camelCase se guarda en profiles');
select is((select accepted_terms_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  '2026-11-02T12:00:00Z'::timestamptz, 'PR-001: se guarda la fecha de aceptacion de terminos');
select ok((select needs_role from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  'PR-006: un usuario OAuth queda pendiente de elegir rol');

-- Actuar como el usuario intruso.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select throws_ok(
  $$ update public.profiles set role = 'admin' where id = auth.uid() $$,
  '42501', null, 'D-14: un usuario no puede cambiar su propio rol');
select lives_ok(
  $$ update public.profiles set full_name = 'Nombre Nuevo' where id = auth.uid() $$,
  'el usuario puede editar su nombre');
select throws_ok($$ select public.choose_role('proveedor') $$, 'P0001', 'El rol ya fue elegido',
  'choose_role solo sirve en el primer ingreso');
select is((select count(*)::int from public.login_attempts), 0,
  'PR-002: login_attempts no es visible para usuarios autenticados');

-- Actuar como la usuaria OAuth.
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select throws_ok($$ select public.choose_role('admin') $$, 'P0001', 'Rol no permitido',
  'PR-006 RN-01: no se puede elegir admin');
select public.choose_role('proveedor');
reset role;
select is((select role::text || '/' || needs_role::text from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  'proveedor/false', 'PR-006: choose_role asigna el rol una sola vez');

select * from finish();
rollback;
