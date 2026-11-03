-- =============================================================================
-- Migracion 0011: mensajeria y notificaciones en vivo (REQ-MSG-01, REQ-NOT-01)
-- - Un hilo por solicitud y por proveedor que cotizo (request_id + provider_id).
-- - RLS: solo el cliente de la solicitud y el proveedor del hilo leen y escriben.
-- - Realtime (postgres_changes) para messages y notifications.
-- =============================================================================

alter table public.messages
  add column if not exists request_id uuid references public.service_requests (id) on delete cascade,
  add column if not exists provider_id uuid references public.providers (id) on delete cascade,
  add column if not exists read_at timestamptz;

alter table public.messages
  add constraint messages_body_length check (char_length(body) between 1 and 2000);

create index if not exists messages_thread_idx
  on public.messages (request_id, provider_id, created_at);

-- El hilo existe desde que el proveedor cotizo la solicitud (cualquier estado de la cotizacion).
create or replace function public.is_thread_participant(p_request_id uuid, p_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quotes q
    where q.request_id = p_request_id and q.provider_id = p_provider_id
  )
  and (
    exists (select 1 from public.service_requests sr where sr.id = p_request_id and sr.client_id = auth.uid())
    or exists (select 1 from public.providers p where p.id = p_provider_id and p.user_id = auth.uid())
  );
$$;

create policy "messages_thread_select" on public.messages
  for select to authenticated
  using (request_id is not null and public.is_thread_participant(request_id, provider_id));

create policy "messages_thread_insert" on public.messages
  for insert to authenticated
  with check (
    request_id is not null
    and sender_id = auth.uid()
    and public.is_thread_participant(request_id, provider_id)
  );

-- Realtime: los clientes con sesion reciben inserciones filtradas por RLS.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.messages;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object then null;
    end;
  end if;
end;
$$;
