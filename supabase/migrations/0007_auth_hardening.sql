-- =============================================================================
-- Migracion 0007: endurecimiento de cuentas (REQ-AUT-01, 02, 06)
-- - Consentimiento de terminos y privacidad (accepted_terms_at).
-- - RN-01: el rol admin no puede obtenerse al registrarse ni editando el perfil.
-- - Bloqueo temporal por intentos fallidos de login (login_attempts).
-- - Eleccion de rol en el primer ingreso con OAuth (needs_role + choose_role).
-- =============================================================================

alter table public.profiles
  add column if not exists accepted_terms_at timestamptz,
  add column if not exists needs_role boolean not null default false;

-- ---------------------------------------------------------------------------
-- Perfil al registrarse. Solo acepta cliente o proveedor desde los metadatos
-- (D-05) y lee el nombre en camelCase o snake_case (D-10). Un usuario OAuth
-- llega sin rol en los metadatos: queda como cliente con needs_role = true.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role text := v_meta ->> 'role';
begin
  insert into public.profiles (id, role, full_name, phone, email, accepted_terms_at, needs_role)
  values (
    new.id,
    case when v_role in ('cliente', 'proveedor') then v_role::user_role else 'cliente' end,
    coalesce(v_meta ->> 'fullName', v_meta ->> 'full_name', v_meta ->> 'name'),
    v_meta ->> 'phone',
    new.email,
    case when v_meta ? 'acceptedTermsAt' then (v_meta ->> 'acceptedTermsAt')::timestamptz end,
    v_role is null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- D-14: un usuario solo puede editar su nombre y telefono, nunca su rol.
-- Los cambios de rol los hace el backend con service role o la RPC choose_role.
-- ---------------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Eleccion de rol en el primer ingreso (OAuth). Solo una vez, solo cliente o
-- proveedor (RN-01).
-- ---------------------------------------------------------------------------
create or replace function public.choose_role(p_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('cliente', 'proveedor') then
    raise exception 'Rol no permitido';
  end if;

  update public.profiles
  set role = p_role, needs_role = false
  where id = auth.uid() and needs_role = true;

  if not found then
    raise exception 'El rol ya fue elegido';
  end if;
end;
$$;

revoke execute on function public.choose_role(user_role) from public, anon;
grant execute on function public.choose_role(user_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Intentos de login (REQ-AUT-02). Solo el backend (service role) lee y escribe:
-- RLS activo sin politicas para anon/authenticated.
-- ---------------------------------------------------------------------------
create table public.login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  success boolean not null,
  created_at timestamptz not null default now()
);

create index login_attempts_email_created_idx on public.login_attempts (email, created_at desc);

alter table public.login_attempts enable row level security;
