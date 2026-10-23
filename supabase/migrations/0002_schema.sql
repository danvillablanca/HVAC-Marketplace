-- Esquema base del Marketplace HVAC.
-- auth.users es gestionado por Supabase Auth; public.profiles lo espeja.

-- Perfil publico vinculado 1:1 con auth.users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'cliente',
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- Empresa proveedora de servicios HVAC.
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete set null,
  rut text unique,
  legal_name text not null,
  slug text unique,
  segment service_segment not null,
  description text,
  email text,
  phone text,
  verification_status verification_status not null default 'pendiente',
  verified_at timestamptz,
  rating_avg numeric(3, 2),
  reviews_count integer not null default 0,
  modalities text[] not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categorias de servicio (agrupan servicios por segmento).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text,
  segment service_segment
);

-- Servicios ofrecidos dentro de una categoria.
create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id),
  name text,
  unit text
);

-- Relacion N:M entre proveedores y servicios, con precio desde.
create table public.provider_services (
  provider_id uuid references public.providers (id) on delete cascade,
  service_id uuid references public.services (id),
  price_from integer,
  unit text,
  primary key (provider_id, service_id)
);

-- Ubicaciones geograficas de un proveedor.
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers (id) on delete cascade,
  label text,
  address text,
  region text,
  commune text,
  geom geography(point, 4326) not null,
  is_primary boolean not null default true,
  created_at timestamptz not null default now()
);

-- Resenas de clientes sobre proveedores.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers (id) on delete cascade,
  client_id uuid references public.profiles (id) on delete set null,
  lead_id uuid,
  rating smallint check (rating between 1 and 5),
  comment text,
  author_name text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Solicitudes de servicio (leads) de un cliente a un proveedor.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles (id) on delete set null,
  provider_id uuid references public.providers (id) on delete cascade,
  service_id uuid references public.services (id),
  description text,
  urgency text not null default 'media',
  preferred_contact text not null default 'whatsapp',
  status lead_status not null default 'nuevo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Visitas agendadas asociadas a un lead.
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  provider_id uuid references public.providers (id),
  starts_at timestamptz,
  duration_minutes integer not null default 90,
  status appointment_status not null default 'propuesta',
  created_at timestamptz not null default now()
);

-- Mensajeria dentro de un lead.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text,
  created_at timestamptz not null default now()
);

-- Checklist de verificacion de un proveedor.
create table public.verification_items (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers (id) on delete cascade,
  item text,
  status verification_status not null default 'pendiente',
  evidence_url text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Bitacora de acciones administrativas.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text,
  entity text,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Documentos de manuales tecnicos (modulo IA diferido).
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text,
  source_url text,
  doc_type text,
  checksum text,
  created_at timestamptz not null default now()
);

-- Fragmentos vectorizados de documentos (modulo IA diferido).
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents (id) on delete cascade,
  chunk_index integer,
  content text,
  embedding vector(1536),
  metadata jsonb
);

-- Indices.
create index locations_geom_idx on public.locations using gist (geom);

create index document_chunks_embedding_idx
  on public.document_chunks using hnsw (embedding vector_cosine_ops);

create index providers_rut_idx on public.providers (rut);
create index provider_services_service_id_idx on public.provider_services (service_id);
create index reviews_provider_created_idx on public.reviews (provider_id, created_at);
create index leads_provider_status_idx on public.leads (provider_id, status);
create index appointments_provider_starts_idx on public.appointments (provider_id, starts_at);
create index providers_modalities_idx on public.providers using gin (modalities);
