-- Datos semilla: catalogo HVAC, proveedores demo, ubicaciones, resenas y
-- checklist de verificacion. Los proveedores demo usan is_demo = true y el
-- mismo slug que el frontend (frontend/src/data/providers.ts).

-- ---------------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------------
insert into public.categories (id, slug, name, segment) values
  ('c0000000-0000-0000-0000-000000000001', 'aire-acondicionado-residencial', 'Aire acondicionado residencial', 'residencial'),
  ('c0000000-0000-0000-0000-000000000002', 'instalacion-split', 'Venta e instalacion de equipos Split', 'residencial'),
  ('c0000000-0000-0000-0000-000000000003', 'calefaccion-central', 'Calefaccion central', 'residencial'),
  ('c0000000-0000-0000-0000-000000000004', 'piscinas-temperadas', 'Piscinas temperadas', 'residencial'),
  ('c0000000-0000-0000-0000-000000000005', 'energia-solar', 'Energia solar', 'residencial'),
  ('c0000000-0000-0000-0000-000000000006', 'ventilacion-industrial', 'Ventilacion industrial y comercial', 'industrial'),
  ('c0000000-0000-0000-0000-000000000007', 'aire-acondicionado-comercial', 'Aire acondicionado comercial', 'comercial'),
  ('c0000000-0000-0000-0000-000000000008', 'centrales-termicas', 'Centrales termicas', 'industrial'),
  ('c0000000-0000-0000-0000-000000000009', 'salas-limpias', 'Salas limpias y laboratorios', 'industrial'),
  ('c0000000-0000-0000-0000-000000000010', 'montaje-mantenimiento', 'Montaje y mantenimiento', 'industrial'),
  ('c0000000-0000-0000-0000-000000000011', 'inspeccion', 'Inspeccion tecnica HVAC', 'comercial'),
  ('c0000000-0000-0000-0000-000000000012', 'reparacion', 'Reparacion y carga de gas', 'residencial');

-- ---------------------------------------------------------------------------
-- Servicios
-- ---------------------------------------------------------------------------
insert into public.services (id, category_id, name, unit) values
  ('50000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Aire acondicionado residencial', 'visita'),
  ('50000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Venta e instalacion de equipos Split', 'visita'),
  ('50000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Calefaccion central', 'visita'),
  ('50000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Piscinas temperadas', 'visita'),
  ('50000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'Energia solar', 'visita'),
  ('50000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'Ventilacion industrial y comercial', 'visita'),
  ('50000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'Aire acondicionado comercial', 'visita'),
  ('50000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'Centrales termicas', 'visita'),
  ('50000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'Salas limpias y laboratorios', 'visita'),
  ('50000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', 'Montaje y mantenimiento', 'visita'),
  ('50000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'Inspeccion tecnica HVAC', 'visita'),
  ('50000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', 'Reparacion y carga de gas', 'visita');

-- ---------------------------------------------------------------------------
-- Proveedores demo
-- ---------------------------------------------------------------------------
insert into public.providers (
  id, user_id, rut, legal_name, slug, segment, description, email, phone,
  verification_status, verified_at, rating_avg, reviews_count, modalities, is_demo
) values
  ('a0000000-0000-0000-0000-000000000001', null, '765432103', 'Clima Andes SpA', 'p-clima-andes', 'industrial',
   'Ingenieria HVAC industrial: ventilacion, centrales termicas, salas limpias y montaje. Mas de 10 anos y certificacion ASHRAE.',
   'contacto@climaandes.cl', '+56973337025', 'verificado', '2026-06-01T12:00:00Z', 4.80, 132,
   array['Visita a domicilio', 'Atencion de emergencia 24/7', 'Garantia escrita'], true),
  ('a0000000-0000-0000-0000-000000000002', null, '771234569', 'Frio Sur Climatizacion Ltda.', 'p-frio-sur', 'comercial',
   'Aire acondicionado comercial y mantenimiento preventivo para oficinas y retail.',
   'ventas@friosur.cl', '+56987654321', 'verificado', '2026-05-20T12:00:00Z', 4.60, 88,
   array['Visita a domicilio', 'Presupuesto sin costo', 'Boleta electronica'], true),
  ('a0000000-0000-0000-0000-000000000003', null, '769876545', 'Hogar Fresco Instalaciones', 'p-hogar-fresco', 'residencial',
   'Especialistas en Split inverter: venta, instalacion y carga de gas R32/R410.',
   'hola@hogarfresco.cl', '+56911112222', 'verificado', '2026-04-11T12:00:00Z', 4.90, 210,
   array['Visita a domicilio', 'Garantia escrita', 'Presupuesto sin costo'], true),
  ('a0000000-0000-0000-0000-000000000004', null, '781122335', 'Solar Verde Energia', 'p-solar-verde', 'residencial',
   'Paneles solares y piscinas temperadas con enfoque de eficiencia energetica.',
   'contacto@solarverde.cl', '+56933334444', 'verificado', '2026-03-15T12:00:00Z', 4.70, 64,
   array['Visita a domicilio', 'Boleta electronica', 'Garantia escrita'], true),
  ('a0000000-0000-0000-0000-000000000005', null, '774455663', 'Termica Norte Ingenieria', 'p-termica-norte', 'industrial',
   'HVAC industrial para mineria: ventilacion forzada y refrigeracion de salas electricas.',
   'proyectos@termicanorte.cl', '+56922223333', 'en_revision', null, 4.40, 27,
   array['Visita a domicilio', 'Atencion de emergencia 24/7'], true),
  ('a0000000-0000-0000-0000-000000000006', null, '762233444', 'Aire Bio Clima', 'p-aire-bio', 'comercial',
   'Climatizacion comercial, salas limpias y laboratorios en la region del Biobio.',
   'contacto@airebio.cl', '+56944445555', 'verificado', '2026-02-08T12:00:00Z', 4.50, 51,
   array['Presupuesto sin costo', 'Garantia escrita'], true),
  ('a0000000-0000-0000-0000-000000000007', null, '768877661', 'Calor Central SpA', 'p-calor-central', 'residencial',
   'Calefaccion central y radiadores, con mantencion anual programada.',
   'info@calorcentral.cl', '+56955556666', 'pendiente', null, 4.20, 19,
   array['Visita a domicilio', 'Presupuesto sin costo'], true),
  ('a0000000-0000-0000-0000-000000000008', null, '775599111', 'Valpo Clima Servicios', 'p-valpo-clima', 'residencial',
   'Instalacion y reparacion de aire acondicionado en la region de Valparaiso.',
   'contacto@valpoclima.cl', '+56966667777', 'verificado', '2026-01-30T12:00:00Z', 4.60, 73,
   array['Visita a domicilio', 'Atencion de emergencia 24/7', 'Boleta electronica'], true),
  ('a0000000-0000-0000-0000-000000000009', null, '764422880', 'Laboratorio Limpio Chile', 'p-limpio-lab', 'industrial',
   'Salas limpias ISO, presion diferencial y validacion de laboratorios.',
   'proyectos@limpioclaboratorio.cl', '+56977778888', 'verificado', '2026-05-02T12:00:00Z', 4.80, 34,
   array['Presupuesto sin costo', 'Garantia escrita'], true),
  ('a0000000-0000-0000-0000-000000000010', null, '779988775', 'Sur Termico Mantencion', 'p-sur-termico', 'comercial',
   'Mantencion y reparacion de climatizacion comercial en el sur de Chile.',
   'contacto@surtermico.cl', '+56988889999', 'verificado', '2025-12-19T12:00:00Z', 4.30, 42,
   array['Visita a domicilio', 'Boleta electronica'], true);

-- ---------------------------------------------------------------------------
-- Servicios ofrecidos por proveedor
-- ---------------------------------------------------------------------------
insert into public.provider_services (provider_id, service_id, price_from, unit) values
  ('a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000006', 180000, 'visita'),
  ('a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000008', 450000, 'visita'),
  ('a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000010', 95000, 'visita'),
  ('a0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000007', 120000, 'visita'),
  ('a0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000011', 60000, 'visita'),
  ('a0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000010', 85000, 'visita'),
  ('a0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 89990, 'visita'),
  ('a0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000012', 45000, 'visita'),
  ('a0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 110000, 'visita'),
  ('a0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000005', 950000, 'visita'),
  ('a0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', 780000, 'visita'),
  ('a0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000006', 250000, 'visita'),
  ('a0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000008', 520000, 'visita'),
  ('a0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000009', 320000, 'visita'),
  ('a0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000007', 130000, 'visita'),
  ('a0000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000003', 145000, 'visita'),
  ('a0000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000010', 70000, 'visita'),
  ('a0000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000001', 99000, 'visita'),
  ('a0000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000012', 40000, 'visita'),
  ('a0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000009', 380000, 'visita'),
  ('a0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000011', 120000, 'visita'),
  ('a0000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000010', 90000, 'visita'),
  ('a0000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000007', 125000, 'visita');

-- ---------------------------------------------------------------------------
-- Ubicaciones (una principal por proveedor)
-- ---------------------------------------------------------------------------
insert into public.locations (id, provider_id, label, address, region, commune, geom, is_primary) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Principal', 'Lope de Ulloa 1760, Quinta Normal', 'Metropolitana de Santiago', 'Quinta Normal', st_setsrid(st_makepoint(-70.7005, -33.4325), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Principal', 'Av. Providencia 1234, Providencia', 'Metropolitana de Santiago', 'Providencia', st_setsrid(st_makepoint(-70.6140, -33.4260), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Principal', 'Av. Vicuna Mackenna 5678, La Florida', 'Metropolitana de Santiago', 'La Florida', st_setsrid(st_makepoint(-70.5983, -33.5225), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Principal', 'Av. Pajaritos 2100, Maipu', 'Metropolitana de Santiago', 'Maipu', st_setsrid(st_makepoint(-70.7575, -33.5108), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Principal', 'Av. Argentina 1500, Antofagasta', 'Antofagasta', 'Antofagasta', st_setsrid(st_makepoint(-70.3975, -23.6509), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'Principal', 'O''Higgins 940, Concepcion', 'Biobio', 'Concepcion', st_setsrid(st_makepoint(-73.0498, -36.8269), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'Principal', 'Av. Irarrazaval 3400, Nunoa', 'Metropolitana de Santiago', 'Nunoa', st_setsrid(st_makepoint(-70.5978, -33.4569), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'Principal', 'Av. Libertad 800, Vina del Mar', 'Valparaiso', 'Vina del Mar', st_setsrid(st_makepoint(-71.5518, -33.0245), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009', 'Principal', 'Av. Amunategui 178, Pudahuel', 'Metropolitana de Santiago', 'Pudahuel', st_setsrid(st_makepoint(-70.7462, -33.4405), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'Principal', 'Av. Diego Portales 600, Puerto Montt', 'Los Lagos', 'Puerto Montt', st_setsrid(st_makepoint(-72.9424, -41.4693), 4326)::geography, true);

-- ---------------------------------------------------------------------------
-- Resenas (se preservan rating_avg/reviews_count del seed demo)
-- ---------------------------------------------------------------------------
alter table public.reviews disable trigger reviews_update_provider_stats;

insert into public.reviews (id, provider_id, client_id, lead_id, rating, comment, author_name, verified, created_at) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', null, null, 5, 'Instalaron la ventilacion de nuestra bodega en tiempo record. Muy profesionales.', 'Rodrigo M.', true, '2026-08-14T15:00:00Z'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', null, null, 4, 'Buen trabajo, llegaron un poco tarde pero resolvieron todo.', 'Carolina P.', true, '2026-07-02T11:30:00Z'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', null, null, 5, 'Instalacion impecable del split, dejaron todo limpio. Recomendados.', 'Daniela S.', true, '2026-08-30T09:10:00Z'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', null, null, 5, 'Mantencion preventiva muy ordenada y puntual.', 'Felipe R.', true, '2026-06-18T14:00:00Z'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', null, null, 4, 'Buen asesoramiento para el proyecto solar del condominio.', 'Marcela T.', true, '2026-05-27T10:20:00Z'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000008', null, null, 5, 'Repararon el equipo en el mismo dia. Excelente servicio.', 'Jorge V.', true, '2026-07-21T17:45:00Z');

alter table public.reviews enable trigger reviews_update_provider_stats;

-- ---------------------------------------------------------------------------
-- Checklist de verificacion de ejemplo
-- ---------------------------------------------------------------------------
insert into public.verification_items (provider_id, item, status, evidence_url, note, reviewed_at) values
  ('a0000000-0000-0000-0000-000000000001', 'RUT y patente comercial', 'verificado', 'https://example.com/docs/clima-andes-rut.pdf', 'Documentacion conforme.', '2026-06-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000001', 'Certificacion ASHRAE vigente', 'verificado', 'https://example.com/docs/clima-andes-ashrae.pdf', 'Certificado valido.', '2026-06-01T12:05:00Z'),
  ('a0000000-0000-0000-0000-000000000002', 'RUT y patente comercial', 'verificado', 'https://example.com/docs/frio-sur-rut.pdf', null, '2026-05-20T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000003', 'RUT y patente comercial', 'verificado', 'https://example.com/docs/hogar-fresco-rut.pdf', null, '2026-04-11T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000005', 'RUT y patente comercial', 'verificado', 'https://example.com/docs/termica-norte-rut.pdf', null, '2026-03-02T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000005', 'Poliza de responsabilidad civil', 'en_revision', 'https://example.com/docs/termica-norte-poliza.pdf', 'Pendiente de validacion ASHRAE.', null),
  ('a0000000-0000-0000-0000-000000000007', 'RUT y patente comercial', 'pendiente', null, 'En espera de antecedentes.', null),
  ('a0000000-0000-0000-0000-000000000009', 'Acreditacion de sala limpia ISO', 'verificado', 'https://example.com/docs/limpio-lab-iso.pdf', 'ISO 14644 validado.', '2026-05-02T12:00:00Z');
