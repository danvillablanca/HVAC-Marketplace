-- Row Level Security del Marketplace HVAC.

-- Helper: true si el usuario autenticado es admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Habilitar RLS en todas las tablas public.
alter table public.profiles enable row level security;
alter table public.providers enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.provider_services enable row level security;
alter table public.locations enable row level security;
alter table public.reviews enable row level security;
alter table public.leads enable row level security;
alter table public.appointments enable row level security;
alter table public.messages enable row level security;
alter table public.verification_items enable row level security;
alter table public.audit_log enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- providers
-- ---------------------------------------------------------------------------
create policy "providers_public_read" on public.providers
  for select to anon, authenticated
  using (verification_status = 'verificado' or is_demo = true);

create policy "providers_owner_read" on public.providers
  for select to authenticated
  using (user_id = auth.uid());

create policy "providers_owner_insert" on public.providers
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "providers_owner_update" on public.providers
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "providers_owner_delete" on public.providers
  for delete to authenticated
  using (user_id = auth.uid());

create policy "providers_admin_all" on public.providers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories / services (lectura publica)
-- ---------------------------------------------------------------------------
create policy "categories_public_read" on public.categories
  for select to anon, authenticated
  using (true);

create policy "categories_admin_all" on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "services_public_read" on public.services
  for select to anon, authenticated
  using (true);

create policy "services_admin_all" on public.services
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- provider_services
-- ---------------------------------------------------------------------------
create policy "provider_services_public_read" on public.provider_services
  for select to anon, authenticated
  using (true);

create policy "provider_services_owner_all" on public.provider_services
  for all to authenticated
  using (exists (
    select 1 from public.providers p
    where p.id = provider_services.provider_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.providers p
    where p.id = provider_services.provider_id and p.user_id = auth.uid()
  ));

create policy "provider_services_admin_all" on public.provider_services
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------------
create policy "locations_public_read" on public.locations
  for select to anon, authenticated
  using (true);

create policy "locations_owner_all" on public.locations
  for all to authenticated
  using (exists (
    select 1 from public.providers p
    where p.id = locations.provider_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.providers p
    where p.id = locations.provider_id and p.user_id = auth.uid()
  ));

create policy "locations_admin_all" on public.locations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create policy "reviews_public_read" on public.reviews
  for select to anon, authenticated
  using (true);

create policy "reviews_client_insert" on public.reviews
  for insert to authenticated
  with check (client_id = auth.uid());

create policy "reviews_client_update" on public.reviews
  for update to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "reviews_client_delete" on public.reviews
  for delete to authenticated
  using (client_id = auth.uid());

create policy "reviews_admin_all" on public.reviews
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create policy "leads_client_select" on public.leads
  for select to authenticated
  using (client_id = auth.uid());

create policy "leads_client_insert" on public.leads
  for insert to authenticated
  with check (client_id = auth.uid());

create policy "leads_client_update" on public.leads
  for update to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "leads_client_delete" on public.leads
  for delete to authenticated
  using (client_id = auth.uid());

create policy "leads_provider_select" on public.leads
  for select to authenticated
  using (exists (
    select 1 from public.providers p
    where p.id = leads.provider_id and p.user_id = auth.uid()
  ));

create policy "leads_provider_update" on public.leads
  for update to authenticated
  using (exists (
    select 1 from public.providers p
    where p.id = leads.provider_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.providers p
    where p.id = leads.provider_id and p.user_id = auth.uid()
  ));

create policy "leads_admin_all" on public.leads
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create policy "appointments_client_select" on public.appointments
  for select to authenticated
  using (exists (
    select 1 from public.leads l
    where l.id = appointments.lead_id and l.client_id = auth.uid()
  ));

create policy "appointments_client_insert" on public.appointments
  for insert to authenticated
  with check (exists (
    select 1 from public.leads l
    where l.id = appointments.lead_id and l.client_id = auth.uid()
  ));

create policy "appointments_client_update" on public.appointments
  for update to authenticated
  using (exists (
    select 1 from public.leads l
    where l.id = appointments.lead_id and l.client_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.leads l
    where l.id = appointments.lead_id and l.client_id = auth.uid()
  ));

create policy "appointments_provider_select" on public.appointments
  for select to authenticated
  using (exists (
    select 1 from public.providers p
    where p.id = appointments.provider_id and p.user_id = auth.uid()
  ));

create policy "appointments_provider_update" on public.appointments
  for update to authenticated
  using (exists (
    select 1 from public.providers p
    where p.id = appointments.provider_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.providers p
    where p.id = appointments.provider_id and p.user_id = auth.uid()
  ));

create policy "appointments_admin_all" on public.appointments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- messages (participantes del lead)
-- ---------------------------------------------------------------------------
create policy "messages_participant_select" on public.messages
  for select to authenticated
  using (
    sender_id = auth.uid()
    or exists (
      select 1 from public.leads l
      where l.id = messages.lead_id and l.client_id = auth.uid()
    )
    or exists (
      select 1 from public.leads l
      join public.providers p on p.id = l.provider_id
      where l.id = messages.lead_id and p.user_id = auth.uid()
    )
  );

create policy "messages_sender_insert" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      exists (
        select 1 from public.leads l
        where l.id = messages.lead_id and l.client_id = auth.uid()
      )
      or exists (
        select 1 from public.leads l
        join public.providers p on p.id = l.provider_id
        where l.id = messages.lead_id and p.user_id = auth.uid()
      )
    )
  );

create policy "messages_admin_all" on public.messages
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- verification_items
-- ---------------------------------------------------------------------------
create policy "verification_items_owner_select" on public.verification_items
  for select to authenticated
  using (exists (
    select 1 from public.providers p
    where p.id = verification_items.provider_id and p.user_id = auth.uid()
  ));

create policy "verification_items_owner_insert" on public.verification_items
  for insert to authenticated
  with check (exists (
    select 1 from public.providers p
    where p.id = verification_items.provider_id and p.user_id = auth.uid()
  ));

create policy "verification_items_owner_update" on public.verification_items
  for update to authenticated
  using (exists (
    select 1 from public.providers p
    where p.id = verification_items.provider_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.providers p
    where p.id = verification_items.provider_id and p.user_id = auth.uid()
  ));

create policy "verification_items_admin_all" on public.verification_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_log (solo admin)
-- ---------------------------------------------------------------------------
create policy "audit_log_admin_all" on public.audit_log
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- documents (modulo IA diferido, solo admin)
-- ---------------------------------------------------------------------------
create policy "documents_admin_all" on public.documents
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- document_chunks: sin policy de lectura; acceso solo via match_documents()
-- (security definer). RLS habilitado => acceso directo denegado por defecto.

-- Permisos base.
grant usage on schema public to anon, authenticated;
grant select on public.providers, public.categories, public.services,
  public.provider_services, public.locations, public.reviews to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.providers,
  public.categories, public.services, public.provider_services, public.locations,
  public.reviews, public.leads, public.appointments, public.messages,
  public.verification_items, public.audit_log, public.documents,
  public.document_chunks to authenticated;
