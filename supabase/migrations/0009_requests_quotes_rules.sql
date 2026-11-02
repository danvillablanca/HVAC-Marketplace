-- =============================================================================
-- Migracion 0009: reglas de solicitudes y cotizaciones (REQ-SOL, REQ-COT)
-- - RN-03: eligible_providers_for_request (verificado, disponible, ofrece el
--   servicio y la solicitud cae dentro de su radio de cobertura).
-- - SOL-02/03: provider_inbox expone solo comuna y distancia aproximada.
-- - SOL-04 / D-11 / D-22: transiciones validadas por actor y rol dentro de RPC
--   transaccionales, invocables solo por el backend (service_role).
-- - RN-04: una cotizacion activa por proveedor y solicitud (indice parcial).
-- - COT-01: vencimiento de cotizaciones; COT-03: confirmacion del cliente.
-- - D-23: los usuarios ya no pueden cambiar estados directo por REST.
-- =============================================================================

alter table public.service_requests
  add column if not exists completed_at timestamptz,
  add column if not exists client_confirmed_at timestamptz;

-- RN-04: la unicidad aplica solo a cotizaciones activas.
alter table public.quotes drop constraint if exists quotes_request_id_provider_id_key;
create unique index if not exists quotes_one_active_per_provider
  on public.quotes (request_id, provider_id)
  where status in ('enviada', 'aceptada');

-- ---------------------------------------------------------------------------
-- Ubicacion de la solicitud: si no viene geolocalizacion, centroide de la comuna.
-- ---------------------------------------------------------------------------
create or replace function public.service_requests_fill_geom()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if new.geom is null and new.commune is not null then
    select c.centroid into new.geom from public.communes c where c.name = new.commune limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists service_requests_fill_geom on public.service_requests;
create trigger service_requests_fill_geom
  before insert or update of commune, geom on public.service_requests
  for each row execute function public.service_requests_fill_geom();

update public.service_requests sr
set geom = c.centroid
from public.communes c
where sr.geom is null and c.name = sr.commune;

-- ---------------------------------------------------------------------------
-- RN-03: proveedores elegibles para una solicitud.
-- ---------------------------------------------------------------------------
create or replace function public.eligible_providers_for_request(p_request_id uuid)
returns table (provider_id uuid, user_id uuid, distance_meters double precision)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.id, p.user_id, st_distance(l.geom, sr.geom)
  from public.service_requests sr
  join public.providers p
    on p.verification_status = 'verificado' and p.is_available = true
  join public.locations l on l.provider_id = p.id and l.is_primary = true
  where sr.id = p_request_id
    and sr.geom is not null
    and st_dwithin(l.geom, sr.geom, p.coverage_radius_km * 1000)
    and (
      sr.service_id is null
      or exists (
        select 1 from public.provider_services ps
        where ps.provider_id = p.id and ps.service_id = sr.service_id
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- COT-01: vencimiento perezoso (se invoca antes de leer o aceptar).
-- ---------------------------------------------------------------------------
create or replace function public.expire_quotes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.quotes
  set status = 'vencida', updated_at = now()
  where status = 'enviada'
    and created_at + make_interval(days => valid_days) < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- SOL-02/03: bandeja del proveedor. Antes de adjudicarse, el proveedor solo ve
-- comuna, region y distancia aproximada (sin direccion, coordenadas ni cliente).
-- ---------------------------------------------------------------------------
create or replace function public.provider_inbox(p_provider_id uuid)
returns table (
  id uuid,
  service_id uuid,
  service_name text,
  equipment equipment_type,
  description text,
  urgency urgency_level,
  status request_status,
  commune text,
  region text,
  distance_km numeric,
  quotes_count bigint,
  my_quote_status quote_status,
  eligible boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    sr.id,
    sr.service_id,
    s.name,
    sr.equipment,
    sr.description,
    sr.urgency,
    sr.status,
    sr.commune,
    sr.region,
    round((d.meters / 1000)::numeric, 1),
    (select count(*) from public.quotes q
      where q.request_id = sr.id and q.status in ('enviada', 'aceptada')),
    mq.status,
    el.ok,
    sr.created_at,
    sr.updated_at
  from public.service_requests sr
  left join public.services s on s.id = sr.service_id
  left join lateral (
    select st_distance(l.geom, sr.geom) as meters
    from public.locations l
    where l.provider_id = p_provider_id and l.is_primary = true
  ) d on true
  left join lateral (
    select q.status from public.quotes q
    where q.request_id = sr.id and q.provider_id = p_provider_id
    order by q.created_at desc
    limit 1
  ) mq on true
  cross join lateral (
    select exists (
      select 1 from public.eligible_providers_for_request(sr.id) e
      where e.provider_id = p_provider_id
    ) as ok
  ) el
  where sr.status <> 'cancelada'
    and (
      (sr.status in ('abierta', 'con_cotizaciones') and (el.ok or mq.status = 'enviada'))
      -- SOL-03: las aceptadas solo las ve el proveedor adjudicado.
      or mq.status = 'aceptada'
    )
  order by sr.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Transiciones (SOL-04). Todas reciben el actor: el backend las llama con
-- service_role, donde auth.uid() es nulo (D-22).
-- ---------------------------------------------------------------------------
drop function if exists public.accept_quote(uuid);
drop function if exists public.transition_request(uuid, request_status, text);

create or replace function public.accept_quote(p_quote_id uuid, p_actor uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests%rowtype;
  v_quote public.quotes%rowtype;
begin
  perform public.expire_quotes();

  select * into v_quote from public.quotes where id = p_quote_id for update;
  if not found then
    raise exception 'Cotización no encontrada' using errcode = 'P0002';
  end if;
  select * into v_request from public.service_requests where id = v_quote.request_id for update;

  if v_request.client_id is distinct from p_actor then
    raise exception 'Solo el cliente de la solicitud puede aceptar cotizaciones' using errcode = '42501';
  end if;
  if v_quote.status <> 'enviada' then
    raise exception 'La cotización ya no está vigente (%)', v_quote.status using errcode = 'P0001';
  end if;
  if v_request.status <> 'con_cotizaciones' then
    raise exception 'La solicitud no admite aceptar cotizaciones (%)', v_request.status using errcode = 'P0001';
  end if;

  update public.quotes set status = 'aceptada', updated_at = now() where id = p_quote_id;
  -- RN-05: se rechazan las demas cotizaciones vigentes.
  update public.quotes set status = 'rechazada', updated_at = now()
  where request_id = v_request.id and id <> p_quote_id and status = 'enviada';
  update public.service_requests set status = 'aceptada', updated_at = now() where id = v_request.id;

  insert into public.service_request_events (request_id, actor_id, from_status, to_status, note)
  values (v_request.id, p_actor, v_request.status, 'aceptada', 'Cotización aceptada');
  return v_request.id;
end;
$$;

create or replace function public.reject_quote(p_quote_id uuid, p_actor uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote public.quotes%rowtype;
  v_client uuid;
begin
  select * into v_quote from public.quotes where id = p_quote_id for update;
  if not found then
    raise exception 'Cotización no encontrada' using errcode = 'P0002';
  end if;
  select client_id into v_client from public.service_requests where id = v_quote.request_id;
  if v_client is distinct from p_actor then
    raise exception 'Solo el cliente de la solicitud puede rechazar cotizaciones' using errcode = '42501';
  end if;
  if v_quote.status <> 'enviada' then
    raise exception 'La cotización ya no está vigente (%)', v_quote.status using errcode = 'P0001';
  end if;
  update public.quotes set status = 'rechazada', updated_at = now() where id = p_quote_id;
  return v_quote.request_id;
end;
$$;

create or replace function public.transition_request(
  p_request_id uuid,
  p_new_status request_status,
  p_actor uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests%rowtype;
  v_is_awarded boolean;
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
    -- SOL-05: solo el cliente, y solo antes de adjudicar.
    if v_request.client_id is distinct from p_actor then
      raise exception 'Solo el cliente puede cancelar su solicitud' using errcode = '42501';
    end if;
    if v_request.status not in ('abierta', 'con_cotizaciones') then
      raise exception 'Solo se puede cancelar una solicitud abierta o con cotizaciones' using errcode = 'P0001';
    end if;
    update public.quotes set status = 'rechazada', updated_at = now()
    where request_id = p_request_id and status = 'enviada';
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
      updated_at = now()
  where id = p_request_id;

  insert into public.service_request_events (request_id, actor_id, from_status, to_status, note)
  values (p_request_id, p_actor, v_request.status, p_new_status, p_note);
end;
$$;

-- COT-03: el cliente confirma el trabajo completado.
create or replace function public.confirm_completion(p_request_id uuid, p_actor uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests%rowtype;
begin
  select * into v_request from public.service_requests where id = p_request_id for update;
  if not found then
    raise exception 'Solicitud no encontrada' using errcode = 'P0002';
  end if;
  if v_request.client_id is distinct from p_actor then
    raise exception 'Solo el cliente puede confirmar el trabajo' using errcode = '42501';
  end if;
  if v_request.status <> 'completada' or v_request.client_confirmed_at is not null then
    raise exception 'La solicitud no está pendiente de confirmación' using errcode = 'P0001';
  end if;
  update public.service_requests set client_confirmed_at = now(), updated_at = now()
  where id = p_request_id;
  insert into public.service_request_events (request_id, actor_id, from_status, to_status, note)
  values (p_request_id, p_actor, 'completada', 'completada', 'El cliente confirmó el trabajo');
end;
$$;

-- Crear cotizacion (COT-01) con las reglas en un solo lugar.
create or replace function public.create_quote(
  p_request_id uuid,
  p_provider_id uuid,
  p_amount integer,
  p_includes_iva boolean,
  p_scope text,
  p_deadline_days integer,
  p_valid_days integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests%rowtype;
  v_quote_id uuid;
begin
  perform public.expire_quotes();
  select * into v_request from public.service_requests where id = p_request_id for update;
  if not found then
    raise exception 'Solicitud no encontrada' using errcode = 'P0002';
  end if;
  if v_request.status not in ('abierta', 'con_cotizaciones') then
    raise exception 'La solicitud ya no recibe cotizaciones' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.eligible_providers_for_request(p_request_id) e where e.provider_id = p_provider_id
  ) then
    raise exception 'Tu empresa no es elegible para esta solicitud' using errcode = '42501';
  end if;

  insert into public.quotes (request_id, provider_id, amount, includes_iva, scope, deadline_days, valid_days)
  values (p_request_id, p_provider_id, p_amount, p_includes_iva, p_scope, p_deadline_days, p_valid_days)
  returning id into v_quote_id;

  if v_request.status = 'abierta' then
    update public.service_requests set status = 'con_cotizaciones', updated_at = now()
    where id = p_request_id;
    insert into public.service_request_events (request_id, actor_id, from_status, to_status, note)
    values (p_request_id, null, 'abierta', 'con_cotizaciones', 'Primera cotización recibida');
  end if;
  return v_quote_id;
end;
$$;

-- Solo el backend (service_role) invoca estas funciones.
revoke execute on function public.accept_quote(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.reject_quote(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.transition_request(uuid, request_status, uuid, text) from public, anon, authenticated;
revoke execute on function public.confirm_completion(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.create_quote(uuid, uuid, integer, boolean, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.provider_inbox(uuid) from public, anon, authenticated;
revoke execute on function public.eligible_providers_for_request(uuid) from public, anon, authenticated;
revoke execute on function public.expire_quotes() from public, anon, authenticated;
grant execute on function public.accept_quote(uuid, uuid), public.reject_quote(uuid, uuid),
  public.transition_request(uuid, request_status, uuid, text), public.confirm_completion(uuid, uuid),
  public.create_quote(uuid, uuid, integer, boolean, text, integer, integer),
  public.provider_inbox(uuid), public.eligible_providers_for_request(uuid), public.expire_quotes()
  to service_role;

-- ---------------------------------------------------------------------------
-- RLS (D-23): lectura acotada; los cambios pasan por las RPC del backend.
-- ---------------------------------------------------------------------------
drop policy if exists "requests_client_all" on public.service_requests;
drop policy if exists "requests_provider_select" on public.service_requests;

create policy "requests_client_select" on public.service_requests
  for select to authenticated using (client_id = auth.uid());

create policy "requests_client_insert" on public.service_requests
  for insert to authenticated with check (client_id = auth.uid() and status = 'abierta');

-- El proveedor lee la fila completa (con direccion) solo si fue adjudicado;
-- antes de eso usa provider_inbox, que no expone direccion ni coordenadas.
-- La comprobacion va en una funcion security definer para no recursar con la
-- politica de quotes (que a su vez consulta service_requests).
create or replace function public.is_awarded_provider(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quotes q
    join public.providers p on p.id = q.provider_id
    where q.request_id = p_request_id and q.status = 'aceptada' and p.user_id = auth.uid()
  );
$$;

create policy "requests_awarded_provider_select" on public.service_requests
  for select to authenticated using (public.is_awarded_provider(id));

drop policy if exists "quotes_provider_all" on public.quotes;
create policy "quotes_provider_select" on public.quotes
  for select to authenticated using (
    exists (select 1 from public.providers p where p.id = quotes.provider_id and p.user_id = auth.uid())
  );

revoke update, delete on public.service_requests, public.quotes, public.service_request_events from authenticated;
revoke insert on public.quotes, public.service_request_events from authenticated;
