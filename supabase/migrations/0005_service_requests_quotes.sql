-- =============================================================================
-- Migración 0005: Solicitudes de servicio y cotizaciones
-- Flujo core del marketplace HVAC Connect
-- =============================================================================

-- Nuevos enums
create type request_status as enum (
  'abierta', 'con_cotizaciones', 'aceptada', 'en_ejecucion', 'completada', 'cancelada'
);

create type quote_status as enum (
  'enviada', 'aceptada', 'rechazada', 'vencida'
);

create type equipment_type as enum (
  'split', 'ducto', 'chiller', 'vrf', 'camara_frio', 'otro'
);

create type urgency_level as enum (
  'baja', 'media', 'alta', 'urgente'
);

-- ---------------------------------------------------------------------------
-- Campos adicionales en providers para disponibilidad y cobertura
-- ---------------------------------------------------------------------------
alter table public.providers
  add column if not exists is_available boolean not null default true,
  add column if not exists coverage_radius_km integer not null default 25,
  add column if not exists weekly_hours jsonb,
  add column if not exists years_experience integer,
  add column if not exists website text;

-- ---------------------------------------------------------------------------
-- Solicitudes de servicio
-- ---------------------------------------------------------------------------
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid references public.services (id),
  equipment equipment_type not null default 'otro',
  description text not null check (char_length(description) between 20 and 1000),
  urgency urgency_level not null default 'media',
  status request_status not null default 'abierta',
  -- Ubicación del servicio
  commune text,
  region text,
  address text,
  geom geography(point, 4326),
  -- Fotos opcionales (URLs de Storage)
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_requests_client_idx on public.service_requests (client_id);
create index service_requests_status_idx on public.service_requests (status);
create index service_requests_created_idx on public.service_requests (created_at desc);

-- Trigger updated_at
create trigger service_requests_set_updated_at
  before update on public.service_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Historial de eventos de solicitudes
-- ---------------------------------------------------------------------------
create table public.service_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  from_status request_status,
  to_status request_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index request_events_request_idx on public.service_request_events (request_id, created_at);

-- ---------------------------------------------------------------------------
-- Cotizaciones
-- ---------------------------------------------------------------------------
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  amount integer not null check (amount > 0),
  includes_iva boolean not null default true,
  scope text not null check (char_length(scope) >= 20),
  deadline_days integer not null check (deadline_days > 0),
  valid_days integer not null default 15 check (valid_days between 1 and 30),
  status quote_status not null default 'enviada',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- RN-04: una sola cotización activa por proveedor y solicitud
  unique (request_id, provider_id)
);

create index quotes_request_idx on public.quotes (request_id);
create index quotes_provider_idx on public.quotes (provider_id);

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Notificaciones (para Fase 2, pero creamos la tabla ahora)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  ref_type text,
  ref_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, read, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS para nuevas tablas
-- ---------------------------------------------------------------------------
alter table public.service_requests enable row level security;
alter table public.service_request_events enable row level security;
alter table public.quotes enable row level security;
alter table public.notifications enable row level security;

-- service_requests: cliente ve las suyas, proveedor ve las abiertas
create policy "requests_client_all" on public.service_requests
  for all to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "requests_provider_select" on public.service_requests
  for select to authenticated
  using (
    status != 'cancelada'
    and exists (
      select 1 from public.providers p
      where p.user_id = auth.uid()
        and p.verification_status = 'verificado'
        and p.is_available = true
    )
  );

create policy "requests_admin_all" on public.service_requests
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- service_request_events: participantes pueden ver
create policy "request_events_select" on public.service_request_events
  for select to authenticated
  using (
    exists (
      select 1 from public.service_requests sr
      where sr.id = service_request_events.request_id
        and (sr.client_id = auth.uid()
          or exists (
            select 1 from public.quotes q
            join public.providers p on p.id = q.provider_id
            where q.request_id = sr.id and p.user_id = auth.uid()
          ))
    )
  );

create policy "request_events_admin_all" on public.service_request_events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- quotes: proveedor ve/crea las suyas, cliente ve las de sus solicitudes
create policy "quotes_provider_all" on public.quotes
  for all to authenticated
  using (exists (
    select 1 from public.providers p
    where p.id = quotes.provider_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.providers p
    where p.id = quotes.provider_id and p.user_id = auth.uid()
  ));

create policy "quotes_client_select" on public.quotes
  for select to authenticated
  using (exists (
    select 1 from public.service_requests sr
    where sr.id = quotes.request_id and sr.client_id = auth.uid()
  ));

create policy "quotes_admin_all" on public.quotes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- notifications: solo las propias
create policy "notifications_own" on public.notifications
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_admin_all" on public.notifications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Grants
grant select, insert, update, delete on public.service_requests,
  public.service_request_events, public.quotes, public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: Aceptar cotización (acepta una, rechaza el resto)
-- ---------------------------------------------------------------------------
create or replace function public.accept_quote(p_quote_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id uuid;
  v_client_id uuid;
begin
  -- Obtener la solicitud de la cotización
  select q.request_id, sr.client_id
  into v_request_id, v_client_id
  from public.quotes q
  join public.service_requests sr on sr.id = q.request_id
  where q.id = p_quote_id and q.status = 'enviada';

  if v_request_id is null then
    raise exception 'Cotización no encontrada o ya procesada';
  end if;

  -- Verificar que el usuario es el cliente de la solicitud
  if v_client_id != auth.uid() then
    raise exception 'Solo el cliente puede aceptar cotizaciones';
  end if;

  -- Aceptar la cotización seleccionada
  update public.quotes set status = 'aceptada', updated_at = now()
  where id = p_quote_id;

  -- Rechazar todas las demás cotizaciones de la misma solicitud
  update public.quotes set status = 'rechazada', updated_at = now()
  where request_id = v_request_id and id != p_quote_id and status = 'enviada';

  -- Actualizar el estado de la solicitud
  update public.service_requests set status = 'aceptada', updated_at = now()
  where id = v_request_id;

  -- Registrar evento
  insert into public.service_request_events (request_id, actor_id, from_status, to_status, note)
  values (v_request_id, auth.uid(), 'con_cotizaciones', 'aceptada', 'Cotización aceptada');
end;
$$;

grant execute on function public.accept_quote(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: Transicionar estado de solicitud
-- ---------------------------------------------------------------------------
create or replace function public.transition_request(
  p_request_id uuid,
  p_new_status request_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status request_status;
  v_client_id uuid;
begin
  select status, client_id into v_current_status, v_client_id
  from public.service_requests
  where id = p_request_id;

  if v_current_status is null then
    raise exception 'Solicitud no encontrada';
  end if;

  -- Validar transiciones permitidas
  if not (
    (v_current_status = 'abierta' and p_new_status in ('con_cotizaciones', 'cancelada'))
    or (v_current_status = 'con_cotizaciones' and p_new_status in ('aceptada', 'cancelada'))
    or (v_current_status = 'aceptada' and p_new_status = 'en_ejecucion')
    or (v_current_status = 'en_ejecucion' and p_new_status = 'completada')
  ) then
    raise exception 'Transición no permitida: % -> %', v_current_status, p_new_status;
  end if;

  update public.service_requests set status = p_new_status, updated_at = now()
  where id = p_request_id;

  insert into public.service_request_events (request_id, actor_id, from_status, to_status, note)
  values (p_request_id, auth.uid(), v_current_status, p_new_status, p_note);
end;
$$;

grant execute on function public.transition_request(uuid, request_status, text) to authenticated;
