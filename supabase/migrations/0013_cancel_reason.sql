-- 0013: motivo obligatorio de cancelación (cambio de alcance sobre REQ-SOL-05).
-- El cliente que cancela una solicitud abierta o con cotizaciones elige un motivo
-- de una lista fija; "otro" exige un detalle. El motivo queda estructurado en la
-- solicitud para alimentar las métricas del proveedor y del administrador.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'cancel_reason') then
    create type public.cancel_reason as enum (
      'presupuesto_alto',
      'proveedor_otra_via',
      'resuelto_solo',
      'otro'
    );
  end if;
end;
$$;

alter table public.service_requests
  add column if not exists cancel_reason public.cancel_reason,
  add column if not exists cancel_reason_detail text,
  add column if not exists cancelled_at timestamptz;

-- Solicitudes canceladas antes del cambio: se registran como "otro" con la nota
-- que hubiera en el historial.
update public.service_requests r
set cancel_reason = 'otro',
    cancel_reason_detail = coalesce(
      nullif(trim((
        select e.note from public.service_request_events e
        where e.request_id = r.id and e.to_status = 'cancelada'
        order by e.created_at desc limit 1
      )), ''),
      'Sin motivo registrado'
    ),
    cancelled_at = coalesce((
      select max(e.created_at) from public.service_request_events e
      where e.request_id = r.id and e.to_status = 'cancelada'
    ), r.updated_at)
where r.status = 'cancelada' and r.cancel_reason is null;

alter table public.service_requests
  drop constraint if exists service_requests_cancel_reason_required,
  add constraint service_requests_cancel_reason_required
    check (status <> 'cancelada' or cancel_reason is not null),
  drop constraint if exists service_requests_cancel_reason_detail_required,
  add constraint service_requests_cancel_reason_detail_required
    check (cancel_reason is distinct from 'otro'
           or length(trim(coalesce(cancel_reason_detail, ''))) >= 3),
  drop constraint if exists service_requests_cancel_reason_detail_len,
  add constraint service_requests_cancel_reason_detail_len
    check (cancel_reason_detail is null or length(cancel_reason_detail) <= 500);

create index if not exists service_requests_cancel_reason_idx
  on public.service_requests (cancel_reason) where status = 'cancelada';

-- Nueva firma de transition_request con el motivo estructurado.
drop function if exists public.transition_request(uuid, request_status, uuid, text);

create or replace function public.transition_request(
  p_request_id uuid,
  p_new_status request_status,
  p_actor uuid,
  p_note text default null,
  p_reason public.cancel_reason default null,
  p_reason_detail text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests%rowtype;
  v_is_awarded boolean;
  v_detail text := nullif(trim(coalesce(p_reason_detail, '')), '');
  v_note text := p_note;
begin
  select * into v_request from public.service_requests where id = p_request_id for update;
  if not found then
    raise exception 'Solicitud no encontrada' using errcode = 'P0002';
  end if;

  select exists (
    select 1 from public.quotes q
    join public.providers p on p.id = q.provider_id
    where q.request_id = p_request_id and q.status = 'aceptada' and p.user_id = p_actor
  ) into v_is_awarded;

  if p_new_status = 'cancelada' then
    -- SOL-05: solo el cliente, solo antes de adjudicar y con motivo obligatorio.
    if v_request.client_id is distinct from p_actor then
      raise exception 'Solo el cliente puede cancelar su solicitud' using errcode = '42501';
    end if;
    if v_request.status not in ('abierta', 'con_cotizaciones') then
      raise exception 'Solo se puede cancelar una solicitud abierta o con cotizaciones' using errcode = 'P0001';
    end if;
    if p_reason is null then
      raise exception 'Debes indicar el motivo de la cancelación' using errcode = 'P0001';
    end if;
    if p_reason = 'otro' and (v_detail is null or length(v_detail) < 3) then
      raise exception 'Describe el motivo de la cancelación' using errcode = 'P0001';
    end if;
    if v_detail is not null and length(v_detail) > 500 then
      raise exception 'El detalle del motivo no puede superar 500 caracteres' using errcode = 'P0001';
    end if;
    update public.quotes set status = 'rechazada', updated_at = now()
    where request_id = p_request_id and status = 'enviada';
    v_note := case p_reason
      when 'presupuesto_alto' then 'Presupuesto alto'
      when 'proveedor_otra_via' then 'Proveedor encontrado por otra vía'
      when 'resuelto_solo' then 'Se resolvió el problema solo'
      else 'Otro'
    end || coalesce(': ' || v_detail, '');
  elsif p_new_status = 'en_ejecucion' then
    if not v_is_awarded then
      raise exception 'Solo el proveedor adjudicado puede iniciar el trabajo' using errcode = '42501';
    end if;
    if v_request.status <> 'aceptada' then
      raise exception 'Transición no permitida: % -> %', v_request.status, p_new_status using errcode = 'P0001';
    end if;
  elsif p_new_status = 'completada' then
    if not v_is_awarded then
      raise exception 'Solo el proveedor adjudicado puede completar el trabajo' using errcode = '42501';
    end if;
    if v_request.status <> 'en_ejecucion' then
      raise exception 'Transición no permitida: % -> %', v_request.status, p_new_status using errcode = 'P0001';
    end if;
  else
    -- con_cotizaciones y aceptada las fijan create_quote y accept_quote.
    raise exception 'Transición no permitida: % -> %', v_request.status, p_new_status using errcode = 'P0001';
  end if;

  update public.service_requests
  set status = p_new_status,
      completed_at = case when p_new_status = 'completada' then now() else completed_at end,
      cancel_reason = case when p_new_status = 'cancelada' then p_reason else cancel_reason end,
      cancel_reason_detail = case when p_new_status = 'cancelada' then v_detail else cancel_reason_detail end,
      cancelled_at = case when p_new_status = 'cancelada' then now() else cancelled_at end,
      updated_at = now()
  where id = p_request_id;

  insert into public.service_request_events (request_id, actor_id, from_status, to_status, note)
  values (p_request_id, p_actor, v_request.status, p_new_status, v_note);
end;
$$;

revoke execute on function public.transition_request(uuid, request_status, uuid, text, public.cancel_reason, text)
  from public, anon, authenticated;
grant execute on function public.transition_request(uuid, request_status, uuid, text, public.cancel_reason, text)
  to service_role;
