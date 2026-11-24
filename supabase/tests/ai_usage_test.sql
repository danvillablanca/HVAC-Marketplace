-- Límite de uso del asistente IA (migración 0015, REQ-IA-04). Usa cliente@demo.cl del seed.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select is(public.consume_ai_quota('0d000000-0000-4000-8000-000000000001', 2), 1,
  'IA-04: la primera consulta del día cuenta 1');
select is(public.consume_ai_quota('0d000000-0000-4000-8000-000000000001', 2), 2,
  'IA-04: la segunda consulta cuenta 2');
select is(public.consume_ai_quota('0d000000-0000-4000-8000-000000000001', 2), null,
  'IA-04: al alcanzar el límite devuelve null');
select is((select count from public.ai_usage where user_id = '0d000000-0000-4000-8000-000000000001'), 2,
  'IA-04: el contador no supera el límite');

set local role authenticated;
select throws_ok($$ select public.consume_ai_quota('0d000000-0000-4000-8000-000000000001', 100) $$,
  '42501', null, 'IA-04: un usuario no puede llamar la función directamente');

select * from finish();
rollback;
