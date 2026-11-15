-- =============================================================================
-- Migracion 0006: catalogo de comunas con centroide (REQ-BUS-01, REQ-PRO-03)
-- Incluye las 52 comunas de la Region Metropolitana y las capitales regionales.
-- Los centroides son aproximados (centro urbano) y se usan como origen de la
-- busqueda cuando el usuario no comparte su geolocalizacion.
-- =============================================================================

create table public.communes (
  id smallint generated always as identity primary key,
  region text not null,
  name text not null,
  centroid geography(point, 4326) not null,
  is_regional_capital boolean not null default false,
  unique (region, name)
);

create index communes_region_idx on public.communes (region, name);

alter table public.communes enable row level security;

create policy "communes_public_read" on public.communes
  for select to anon, authenticated
  using (true);

create policy "communes_admin_all" on public.communes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.communes to anon, authenticated;

insert into public.communes (region, name, centroid, is_regional_capital) values
  ('Metropolitana de Santiago', 'Santiago', st_setsrid(st_makepoint(-70.6505, -33.4378), 4326)::geography, true),
  ('Metropolitana de Santiago', 'Cerrillos', st_setsrid(st_makepoint(-70.7160, -33.4950), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Cerro Navia', st_setsrid(st_makepoint(-70.7350, -33.4250), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Conchalí', st_setsrid(st_makepoint(-70.6750, -33.3830), 4326)::geography, false),
  ('Metropolitana de Santiago', 'El Bosque', st_setsrid(st_makepoint(-70.6760, -33.5620), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Estación Central', st_setsrid(st_makepoint(-70.6980, -33.4590), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Huechuraba', st_setsrid(st_makepoint(-70.6340, -33.3670), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Independencia', st_setsrid(st_makepoint(-70.6650, -33.4160), 4326)::geography, false),
  ('Metropolitana de Santiago', 'La Cisterna', st_setsrid(st_makepoint(-70.6640, -33.5300), 4326)::geography, false),
  ('Metropolitana de Santiago', 'La Florida', st_setsrid(st_makepoint(-70.5980, -33.5220), 4326)::geography, false),
  ('Metropolitana de Santiago', 'La Granja', st_setsrid(st_makepoint(-70.6250, -33.5390), 4326)::geography, false),
  ('Metropolitana de Santiago', 'La Pintana', st_setsrid(st_makepoint(-70.6340, -33.5840), 4326)::geography, false),
  ('Metropolitana de Santiago', 'La Reina', st_setsrid(st_makepoint(-70.5350, -33.4450), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Las Condes', st_setsrid(st_makepoint(-70.5670, -33.4080), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Lo Barnechea', st_setsrid(st_makepoint(-70.5180, -33.3500), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Lo Espejo', st_setsrid(st_makepoint(-70.6880, -33.5210), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Lo Prado', st_setsrid(st_makepoint(-70.7250, -33.4440), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Macul', st_setsrid(st_makepoint(-70.5990, -33.4920), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Maipú', st_setsrid(st_makepoint(-70.7570, -33.5100), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Ñuñoa', st_setsrid(st_makepoint(-70.5980, -33.4560), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Pedro Aguirre Cerda', st_setsrid(st_makepoint(-70.6730, -33.4920), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Peñalolén', st_setsrid(st_makepoint(-70.5400, -33.4850), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Providencia', st_setsrid(st_makepoint(-70.6170, -33.4260), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Pudahuel', st_setsrid(st_makepoint(-70.7600, -33.4400), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Quilicura', st_setsrid(st_makepoint(-70.7280, -33.3600), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Quinta Normal', st_setsrid(st_makepoint(-70.6990, -33.4280), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Recoleta', st_setsrid(st_makepoint(-70.6400, -33.4070), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Renca', st_setsrid(st_makepoint(-70.7270, -33.4060), 4326)::geography, false),
  ('Metropolitana de Santiago', 'San Joaquín', st_setsrid(st_makepoint(-70.6280, -33.4960), 4326)::geography, false),
  ('Metropolitana de Santiago', 'San Miguel', st_setsrid(st_makepoint(-70.6510, -33.4970), 4326)::geography, false),
  ('Metropolitana de Santiago', 'San Ramón', st_setsrid(st_makepoint(-70.6420, -33.5360), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Vitacura', st_setsrid(st_makepoint(-70.5720, -33.3900), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Puente Alto', st_setsrid(st_makepoint(-70.5750, -33.6110), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Pirque', st_setsrid(st_makepoint(-70.5650, -33.6740), 4326)::geography, false),
  ('Metropolitana de Santiago', 'San José de Maipo', st_setsrid(st_makepoint(-70.3530, -33.6420), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Colina', st_setsrid(st_makepoint(-70.6700, -33.2010), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Lampa', st_setsrid(st_makepoint(-70.8770, -33.2860), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Tiltil', st_setsrid(st_makepoint(-70.9280, -33.0830), 4326)::geography, false),
  ('Metropolitana de Santiago', 'San Bernardo', st_setsrid(st_makepoint(-70.6990, -33.5920), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Buin', st_setsrid(st_makepoint(-70.7420, -33.7320), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Calera de Tango', st_setsrid(st_makepoint(-70.7700, -33.6300), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Paine', st_setsrid(st_makepoint(-70.7410, -33.8080), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Melipilla', st_setsrid(st_makepoint(-71.2150, -33.6890), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Alhué', st_setsrid(st_makepoint(-71.0970, -34.0370), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Curacaví', st_setsrid(st_makepoint(-71.1330, -33.4060), 4326)::geography, false),
  ('Metropolitana de Santiago', 'María Pinto', st_setsrid(st_makepoint(-71.1170, -33.5150), 4326)::geography, false),
  ('Metropolitana de Santiago', 'San Pedro', st_setsrid(st_makepoint(-71.4610, -33.8940), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Talagante', st_setsrid(st_makepoint(-70.9280, -33.6650), 4326)::geography, false),
  ('Metropolitana de Santiago', 'El Monte', st_setsrid(st_makepoint(-71.0170, -33.6800), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Isla de Maipo', st_setsrid(st_makepoint(-70.9000, -33.7500), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Padre Hurtado', st_setsrid(st_makepoint(-70.8150, -33.5720), 4326)::geography, false),
  ('Metropolitana de Santiago', 'Peñaflor', st_setsrid(st_makepoint(-70.8760, -33.6060), 4326)::geography, false),
  ('Arica y Parinacota', 'Arica', st_setsrid(st_makepoint(-70.3126, -18.4783), 4326)::geography, true),
  ('Tarapacá', 'Iquique', st_setsrid(st_makepoint(-70.1357, -20.2307), 4326)::geography, true),
  ('Antofagasta', 'Antofagasta', st_setsrid(st_makepoint(-70.3975, -23.6509), 4326)::geography, true),
  ('Atacama', 'Copiapó', st_setsrid(st_makepoint(-70.3323, -27.3668), 4326)::geography, true),
  ('Coquimbo', 'La Serena', st_setsrid(st_makepoint(-71.2519, -29.9027), 4326)::geography, true),
  ('Valparaíso', 'Valparaíso', st_setsrid(st_makepoint(-71.6127, -33.0472), 4326)::geography, true),
  ('Valparaíso', 'Viña del Mar', st_setsrid(st_makepoint(-71.5518, -33.0245), 4326)::geography, false),
  ('Libertador General Bernardo O''Higgins', 'Rancagua', st_setsrid(st_makepoint(-70.7444, -34.1708), 4326)::geography, true),
  ('Maule', 'Talca', st_setsrid(st_makepoint(-71.6554, -35.4264), 4326)::geography, true),
  ('Ñuble', 'Chillán', st_setsrid(st_makepoint(-72.1034, -36.6066), 4326)::geography, true),
  ('Biobío', 'Concepción', st_setsrid(st_makepoint(-73.0503, -36.8270), 4326)::geography, true),
  ('La Araucanía', 'Temuco', st_setsrid(st_makepoint(-72.5904, -38.7359), 4326)::geography, true),
  ('Los Ríos', 'Valdivia', st_setsrid(st_makepoint(-73.2459, -39.8142), 4326)::geography, true),
  ('Los Lagos', 'Puerto Montt', st_setsrid(st_makepoint(-72.9424, -41.4693), 4326)::geography, true),
  ('Aysén del General Carlos Ibáñez del Campo', 'Coyhaique', st_setsrid(st_makepoint(-72.0685, -45.5712), 4326)::geography, true),
  ('Magallanes y de la Antártica Chilena', 'Punta Arenas', st_setsrid(st_makepoint(-70.9171, -53.1638), 4326)::geography, true);
