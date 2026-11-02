-- Datos semilla: usuarios demo, catalogo HVAC, proveedores demo, ubicaciones,
-- resenas, checklist de verificacion y solicitudes en todos los estados.
-- Credenciales demo: docs/guias/demo.md. Solo para entornos locales y de prueba.
-- Los proveedores demo usan is_demo = true y el
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
-- Usuarios demo en auth.users (contrasena: demo1234)
-- El trigger handle_new_user crea el perfil; el rol admin se asigna aparte
-- porque no puede auto-asignarse desde los metadatos del registro (RN-01).
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) values
  ('00000000-0000-0000-0000-000000000000', '0d000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'cliente@demo.cl', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Camila Rojas", "role": "cliente", "phone": "+56911110001"}'::jsonb, now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '0d000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'cliente2@demo.cl', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Matías Fuentes", "role": "cliente", "phone": "+56911110002"}'::jsonb, now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '0d000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'proveedor@demo.cl', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Hogar Fresco Instalaciones", "role": "proveedor", "phone": "+56911112222"}'::jsonb, now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '0d000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'proveedor2@demo.cl', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Climatiza Ñuñoa SpA", "role": "proveedor", "phone": "+56911110004"}'::jsonb, now(), now(), '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '0d000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'admin@demo.cl', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name": "Admin ASHRAE", "role": "cliente"}'::jsonb, now(), now(), '', '', '', '', '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values
  ('0d000000-0000-4000-8000-000000000001', '0d000000-0000-4000-8000-000000000001', '0d000000-0000-4000-8000-000000000001', '{"sub": "0d000000-0000-4000-8000-000000000001", "email": "cliente@demo.cl", "email_verified": true}'::jsonb, 'email', now(), now(), now()),
  ('0d000000-0000-4000-8000-000000000002', '0d000000-0000-4000-8000-000000000002', '0d000000-0000-4000-8000-000000000002', '{"sub": "0d000000-0000-4000-8000-000000000002", "email": "cliente2@demo.cl", "email_verified": true}'::jsonb, 'email', now(), now(), now()),
  ('0d000000-0000-4000-8000-000000000003', '0d000000-0000-4000-8000-000000000003', '0d000000-0000-4000-8000-000000000003', '{"sub": "0d000000-0000-4000-8000-000000000003", "email": "proveedor@demo.cl", "email_verified": true}'::jsonb, 'email', now(), now(), now()),
  ('0d000000-0000-4000-8000-000000000004', '0d000000-0000-4000-8000-000000000004', '0d000000-0000-4000-8000-000000000004', '{"sub": "0d000000-0000-4000-8000-000000000004", "email": "proveedor2@demo.cl", "email_verified": true}'::jsonb, 'email', now(), now(), now()),
  ('0d000000-0000-4000-8000-000000000005', '0d000000-0000-4000-8000-000000000005', '0d000000-0000-4000-8000-000000000005', '{"sub": "0d000000-0000-4000-8000-000000000005", "email": "admin@demo.cl", "email_verified": true}'::jsonb, 'email', now(), now(), now());

update public.profiles set role = 'admin' where id = '0d000000-0000-4000-8000-000000000005';

-- ---------------------------------------------------------------------------
-- Proveedores adicionales (Bloque A: >= 30 verificados + cola de verificacion)
-- ---------------------------------------------------------------------------
insert into public.providers (
  id, user_id, rut, legal_name, slug, segment, description, email, phone,
  verification_status, verified_at, rating_avg, reviews_count, modalities, is_demo,
  is_available, coverage_radius_km, weekly_hours, years_experience, website
) values
  ('a0000000-0000-0000-0000-000000000011', '0d000000-0000-4000-8000-000000000004', '761000004', 'Climatiza Ñuñoa SpA', 'p-climatiza-nunoa-spa', 'residencial', 'Instalacion y mantencion de equipos Split y multisplit en departamentos y casas.', 'contacto@climatizanunoaspa.cl', '+56981000000', 'verificado', '2026-09-01T12:00:00Z', 4.6, 11, array['Presupuesto sin costo', 'Boleta electronica', 'Garantia escrita'], true, true, 10, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 5, 'https://climatiza-nunoa-spa.cl'),
  ('a0000000-0000-0000-0000-000000000012', null, '761135791', 'Aire Puro Las Condes', 'p-aire-puro-las-condes', 'comercial', 'Climatizacion de oficinas y locales comerciales, contratos de mantencion mensual.', 'contacto@airepurolascondes.cl', '+56981007919', 'verificado', '2026-09-02T12:00:00Z', 4.55, 6, array['Atencion de emergencia 24/7', 'Garantia escrita', 'Presupuesto sin costo'], true, true, 10, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 6, 'https://aire-puro-las-condes.cl'),
  ('a0000000-0000-0000-0000-000000000013', null, '76127158K', 'Refrigeracion Maipú Ltda.', 'p-refrigeracion-maipu-ltda', 'residencial', 'Carga de gas, reparacion de compresores y limpieza profunda de equipos.', 'contacto@refrigeracionmaipultda.cl', '+56981015838', 'verificado', '2026-09-03T12:00:00Z', 4.59, 97, array['Visita a domicilio', 'Boleta electronica', 'Garantia escrita'], true, true, 50, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 9, 'https://refrigeracion-maipu-ltda.cl'),
  ('a0000000-0000-0000-0000-000000000014', null, '761407376', 'Termo Andino Calefaccion', 'p-termo-andino-calefaccion', 'residencial', 'Calefaccion central, calderas a gas y losa radiante.', 'contacto@termoandinocalefaccion.cl', '+56981023757', 'verificado', '2026-09-04T12:00:00Z', 4.7, 46, array['Boleta electronica', 'Presupuesto sin costo', 'Garantia escrita'], true, true, 15, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}, "sab": {"open": "10:00", "close": "14:00"}}'::jsonb, 12, 'https://termo-andino-calefaccion.cl'),
  ('a0000000-0000-0000-0000-000000000015', null, '761543164', 'Frio Industrial Quilicura', 'p-frio-industrial-quilicura', 'industrial', 'Camaras de frio, tuneles de congelado y refrigeracion para bodegas.', 'contacto@frioindustrialquilicura.cl', '+56981031676', 'verificado', '2026-09-05T12:00:00Z', 4.17, 72, array['Boleta electronica', 'Atencion de emergencia 24/7', 'Presupuesto sin costo'], true, true, 20, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 9, 'https://frio-industrial-quilicura.cl'),
  ('a0000000-0000-0000-0000-000000000016', null, '761678957', 'Ventilacion Renca SpA', 'p-ventilacion-renca-spa', 'industrial', 'Extraccion industrial, ductos y ventilacion forzada para plantas productivas.', 'contacto@ventilacionrencaspa.cl', '+56981039595', 'verificado', '2026-09-06T12:00:00Z', 4.85, 7, array['Boleta electronica', 'Garantia escrita', 'Atencion de emergencia 24/7'], true, true, 5, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 12, 'https://ventilacion-renca-spa.cl'),
  ('a0000000-0000-0000-0000-000000000017', null, '761814745', 'Clima Vitacura Premium', 'p-clima-vitacura-premium', 'residencial', 'Equipos inverter de alta eficiencia y control domotico de climatizacion.', 'contacto@climavitacurapremium.cl', '+56981047514', 'verificado', '2026-09-07T12:00:00Z', 4.07, 46, array['Visita a domicilio', 'Garantia escrita', 'Presupuesto sin costo'], true, false, 30, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 2, 'https://clima-vitacura-premium.cl'),
  ('a0000000-0000-0000-0000-000000000018', null, '761950533', 'Puente Alto Clima', 'p-puente-alto-clima', 'residencial', 'Instalacion de Split, mantencion preventiva y emergencias en el sector sur.', 'contacto@puentealtoclima.cl', '+56981055433', 'verificado', '2026-09-08T12:00:00Z', 4.19, 113, array['Presupuesto sin costo', 'Garantia escrita', 'Boleta electronica'], true, true, 30, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 23, 'https://puente-alto-clima.cl'),
  ('a0000000-0000-0000-0000-000000000019', null, '762086328', 'San Bernardo Refrigeracion', 'p-san-bernardo-refrigeracion', 'comercial', 'Refrigeracion comercial para minimarkets, restoranes y carnicerias.', 'contacto@sanbernardorefrigeracion.cl', '+56981063352', 'verificado', '2026-09-09T12:00:00Z', 3.97, 13, array['Boleta electronica', 'Presupuesto sin costo', 'Atencion de emergencia 24/7'], true, true, 5, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 23, 'https://san-bernardo-refrigeracion.cl'),
  ('a0000000-0000-0000-0000-000000000020', null, '762222116', 'HVAC Providencia Ingenieria', 'p-hvac-providencia-ingenieria', 'comercial', 'Proyectos HVAC para edificios: VRF, ductos y balanceo de aire.', 'contacto@hvacprovidenciaingenieria.cl', '+56981071271', 'verificado', '2026-09-10T12:00:00Z', 4.85, 18, array['Visita a domicilio', 'Boleta electronica', 'Presupuesto sin costo'], true, true, 50, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 25, 'https://hvac-providencia-ingenieria.cl'),
  ('a0000000-0000-0000-0000-000000000021', null, '762357909', 'Ecoclima Peñalolén', 'p-ecoclima-penalol-n', 'residencial', 'Bombas de calor, energia solar termica y climatizacion eficiente.', 'contacto@ecoclimapenaloln.cl', '+56981079190', 'verificado', '2026-09-11T12:00:00Z', 3.92, 28, array['Presupuesto sin costo', 'Atencion de emergencia 24/7', 'Boleta electronica'], true, true, 10, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 17, 'https://ecoclima-penalol-n.cl'),
  ('a0000000-0000-0000-0000-000000000022', null, '762493691', 'Santiago Centro Clima', 'p-santiago-centro-clima', 'comercial', 'Mantencion de climatizacion en oficinas del centro y edificios publicos.', 'contacto@santiagocentroclima.cl', '+56981087109', 'verificado', '2026-09-12T12:00:00Z', 4.14, 19, array['Visita a domicilio', 'Garantia escrita', 'Boleta electronica'], true, true, 30, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 3, 'https://santiago-centro-clima.cl'),
  ('a0000000-0000-0000-0000-000000000023', null, '762629488', 'Colina Termica Servicios', 'p-colina-termica-servicios', 'residencial', 'Calefaccion y aire acondicionado para condominios de Chicureo y Colina.', 'contacto@colinatermicaservicios.cl', '+56981095028', 'verificado', '2026-09-13T12:00:00Z', 4.54, 15, array['Boleta electronica', 'Garantia escrita', 'Presupuesto sin costo'], true, true, 20, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 8, 'https://colina-termica-servicios.cl'),
  ('a0000000-0000-0000-0000-000000000024', null, '762765276', 'Laboratorio Aire Huechuraba', 'p-laboratorio-aire-huechuraba', 'industrial', 'Salas limpias, presion diferencial y certificacion de laboratorios.', 'contacto@laboratorioairehuechuraba.cl', '+56981102947', 'verificado', '2026-09-14T12:00:00Z', 4.46, 38, array['Presupuesto sin costo', 'Garantia escrita', 'Boleta electronica'], true, true, 5, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 7, 'https://laboratorio-aire-huechuraba.cl'),
  ('a0000000-0000-0000-0000-000000000025', null, '762901064', 'Macul Mantenciones HVAC', 'p-macul-mantenciones-hvac', 'comercial', 'Inspeccion tecnica y mantencion de equipos de climatizacion comercial.', 'contacto@maculmantencioneshvac.cl', '+56981110866', 'verificado', '2026-09-15T12:00:00Z', 4.13, 92, array['Garantia escrita', 'Atencion de emergencia 24/7', 'Presupuesto sin costo'], true, true, 50, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}, "sab": {"open": "10:00", "close": "14:00"}}'::jsonb, 3, 'https://macul-mantenciones-hvac.cl'),
  ('a0000000-0000-0000-0000-000000000026', null, '763036855', 'Pudahuel Logistica Fria', 'p-pudahuel-logistica-fria', 'industrial', 'Refrigeracion de centros de distribucion y camaras de frio cerca del aeropuerto.', 'contacto@pudahuellogisticafria.cl', '+56981118785', 'verificado', '2026-09-16T12:00:00Z', 4.94, 43, array['Boleta electronica', 'Presupuesto sin costo', 'Atencion de emergencia 24/7'], true, false, 15, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 6, 'https://pudahuel-logistica-fria.cl'),
  ('a0000000-0000-0000-0000-000000000027', null, '763172643', 'La Cisterna Clima Hogar', 'p-la-cisterna-clima-hogar', 'residencial', 'Reparacion y carga de gas R32/R410A con garantia escrita.', 'contacto@lacisternaclimahogar.cl', '+56981126704', 'verificado', '2026-09-17T12:00:00Z', 3.93, 90, array['Presupuesto sin costo', 'Garantia escrita', 'Visita a domicilio'], true, true, 20, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 24, 'https://la-cisterna-clima-hogar.cl'),
  ('a0000000-0000-0000-0000-000000000028', null, '76330843K', 'Rancagua Climatizacion', 'p-rancagua-climatizacion', 'comercial', 'Climatizacion comercial y agroindustrial en la region de O''Higgins.', 'contacto@rancaguaclimatizacion.cl', '+56981134623', 'verificado', '2026-09-18T12:00:00Z', 3.98, 76, array['Atencion de emergencia 24/7', 'Garantia escrita', 'Visita a domicilio'], true, true, 30, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}, "sab": {"open": "10:00", "close": "14:00"}}'::jsonb, 5, 'https://rancagua-climatizacion.cl'),
  ('a0000000-0000-0000-0000-000000000029', null, '763444228', 'Serena Frio Servicios', 'p-serena-frio-servicios', 'residencial', 'Instalacion de Split y mantencion en La Serena y Coquimbo.', 'contacto@serenafrioservicios.cl', '+56981142542', 'verificado', '2026-09-19T12:00:00Z', 4.68, 5, array['Presupuesto sin costo', 'Garantia escrita', 'Boleta electronica'], true, true, 30, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 4, 'https://serena-frio-servicios.cl'),
  ('a0000000-0000-0000-0000-000000000030', null, '763580016', 'Temuco Calor Sur', 'p-temuco-calor-sur', 'residencial', 'Calefaccion central, calderas a pellet y aislacion termica.', 'contacto@temucocalorsur.cl', '+56981150461', 'verificado', '2026-09-20T12:00:00Z', 4.23, 5, array['Atencion de emergencia 24/7', 'Garantia escrita', 'Presupuesto sin costo'], true, true, 10, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}, "sab": {"open": "10:00", "close": "14:00"}}'::jsonb, 16, 'https://temuco-calor-sur.cl'),
  ('a0000000-0000-0000-0000-000000000031', null, '763715809', 'Talca Aire Maule', 'p-talca-aire-maule', 'comercial', 'Aire acondicionado comercial y ventilacion para el Maule.', 'contacto@talcaairemaule.cl', '+56981158380', 'verificado', '2026-09-21T12:00:00Z', 4.98, 23, array['Boleta electronica', 'Presupuesto sin costo', 'Garantia escrita'], true, true, 50, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}, "sab": {"open": "10:00", "close": "14:00"}}'::jsonb, 24, 'https://talca-aire-maule.cl'),
  ('a0000000-0000-0000-0000-000000000032', null, '763851591', 'Iquique Clima Norte', 'p-iquique-clima-norte', 'comercial', 'Climatizacion para oficinas y hoteles en clima costero.', 'contacto@iquiqueclimanorte.cl', '+56981166299', 'verificado', '2026-09-22T12:00:00Z', 4.17, 36, array['Boleta electronica', 'Garantia escrita', 'Presupuesto sin costo'], true, true, 20, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}, "sab": {"open": "10:00", "close": "14:00"}}'::jsonb, 21, 'https://iquique-clima-norte.cl'),
  ('a0000000-0000-0000-0000-000000000033', null, '763987388', 'Valdivia Termica', 'p-valdivia-termica', 'residencial', 'Calefaccion eficiente y bombas de calor para el sur.', 'contacto@valdiviatermica.cl', '+56981174218', 'verificado', '2026-09-23T12:00:00Z', 4.21, 74, array['Visita a domicilio', 'Presupuesto sin costo', 'Boleta electronica'], true, true, 30, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}, "sab": {"open": "10:00", "close": "14:00"}}'::jsonb, 9, 'https://valdivia-termica.cl'),
  ('a0000000-0000-0000-0000-000000000034', null, '764123174', 'Chillan Refrigeracion', 'p-chillan-refrigeracion', 'industrial', 'Refrigeracion agroindustrial y camaras de atmosfera controlada.', 'contacto@chillanrefrigeracion.cl', '+56981182137', 'verificado', '2026-09-24T12:00:00Z', 3.91, 95, array['Atencion de emergencia 24/7', 'Presupuesto sin costo', 'Boleta electronica'], true, true, 20, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}, "sab": {"open": "10:00", "close": "14:00"}}'::jsonb, 9, 'https://chillan-refrigeracion.cl'),
  ('a0000000-0000-0000-0000-000000000035', null, '764258967', 'Recoleta Clima Express', 'p-recoleta-clima-express', 'residencial', 'Instalacion express de Split. Antecedentes en revision.', 'contacto@recoletaclimaexpress.cl', '+56981190056', 'pendiente', null, null, 0, array['Atencion de emergencia 24/7', 'Presupuesto sin costo', 'Boleta electronica'], true, true, 5, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}}'::jsonb, 7, 'https://recoleta-clima-express.cl'),
  ('a0000000-0000-0000-0000-000000000036', null, '764394755', 'Frio Rapido Estacion', 'p-frio-rapido-estacion', 'comercial', 'Mantencion comercial. Verificacion rechazada por documentos vencidos.', 'contacto@friorapidoestacion.cl', '+56981197975', 'rechazado', null, null, 0, array['Garantia escrita', 'Visita a domicilio', 'Presupuesto sin costo'], true, true, 20, '{"lun": {"open": "09:00", "close": "18:00"}, "mar": {"open": "09:00", "close": "18:00"}, "mie": {"open": "09:00", "close": "18:00"}, "jue": {"open": "09:00", "close": "18:00"}, "vie": {"open": "09:00", "close": "18:00"}, "sab": {"open": "10:00", "close": "14:00"}}'::jsonb, 2, 'https://frio-rapido-estacion.cl');

-- proveedor@demo.cl administra Hogar Fresco Instalaciones.
update public.providers set user_id = '0d000000-0000-4000-8000-000000000003' where id = 'a0000000-0000-0000-0000-000000000003';

update public.providers set coverage_radius_km = 30 where id = 'a0000000-0000-0000-0000-000000000003';

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

insert into public.provider_services (provider_id, service_id, price_from, unit) values
  ('a0000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000005', 155000, 'visita'),
  ('a0000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000004', 30000, 'visita'),
  ('a0000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000001', 25000, 'visita'),
  ('a0000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000010', 45000, 'visita'),
  ('a0000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000011', 140000, 'visita'),
  ('a0000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000007', 50000, 'visita'),
  ('a0000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000003', 50000, 'visita'),
  ('a0000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000001', 140000, 'visita'),
  ('a0000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000002', 105000, 'visita'),
  ('a0000000-0000-0000-0000-000000000014', '50000000-0000-0000-0000-000000000001', 120000, 'visita'),
  ('a0000000-0000-0000-0000-000000000014', '50000000-0000-0000-0000-000000000002', 145000, 'visita'),
  ('a0000000-0000-0000-0000-000000000014', '50000000-0000-0000-0000-000000000005', 105000, 'visita'),
  ('a0000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000008', 35000, 'visita'),
  ('a0000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000010', 55000, 'visita'),
  ('a0000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000006', 65000, 'visita'),
  ('a0000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000006', 70000, 'visita'),
  ('a0000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000009', 165000, 'visita'),
  ('a0000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000008', 20000, 'visita'),
  ('a0000000-0000-0000-0000-000000000017', '50000000-0000-0000-0000-000000000001', 95000, 'visita'),
  ('a0000000-0000-0000-0000-000000000017', '50000000-0000-0000-0000-000000000003', 35000, 'visita'),
  ('a0000000-0000-0000-0000-000000000017', '50000000-0000-0000-0000-000000000004', 95000, 'visita'),
  ('a0000000-0000-0000-0000-000000000018', '50000000-0000-0000-0000-000000000005', 185000, 'visita'),
  ('a0000000-0000-0000-0000-000000000018', '50000000-0000-0000-0000-000000000003', 160000, 'visita'),
  ('a0000000-0000-0000-0000-000000000018', '50000000-0000-0000-0000-000000000012', 55000, 'visita'),
  ('a0000000-0000-0000-0000-000000000019', '50000000-0000-0000-0000-000000000012', 60000, 'visita'),
  ('a0000000-0000-0000-0000-000000000019', '50000000-0000-0000-0000-000000000010', 200000, 'visita'),
  ('a0000000-0000-0000-0000-000000000019', '50000000-0000-0000-0000-000000000011', 200000, 'visita'),
  ('a0000000-0000-0000-0000-000000000020', '50000000-0000-0000-0000-000000000011', 80000, 'visita'),
  ('a0000000-0000-0000-0000-000000000020', '50000000-0000-0000-0000-000000000007', 80000, 'visita'),
  ('a0000000-0000-0000-0000-000000000020', '50000000-0000-0000-0000-000000000012', 190000, 'visita'),
  ('a0000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000002', 70000, 'visita'),
  ('a0000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000012', 140000, 'visita'),
  ('a0000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000001', 20000, 'visita'),
  ('a0000000-0000-0000-0000-000000000022', '50000000-0000-0000-0000-000000000006', 185000, 'visita'),
  ('a0000000-0000-0000-0000-000000000022', '50000000-0000-0000-0000-000000000012', 70000, 'visita'),
  ('a0000000-0000-0000-0000-000000000022', '50000000-0000-0000-0000-000000000011', 35000, 'visita'),
  ('a0000000-0000-0000-0000-000000000023', '50000000-0000-0000-0000-000000000005', 100000, 'visita'),
  ('a0000000-0000-0000-0000-000000000023', '50000000-0000-0000-0000-000000000003', 145000, 'visita'),
  ('a0000000-0000-0000-0000-000000000023', '50000000-0000-0000-0000-000000000002', 60000, 'visita'),
  ('a0000000-0000-0000-0000-000000000024', '50000000-0000-0000-0000-000000000010', 185000, 'visita'),
  ('a0000000-0000-0000-0000-000000000024', '50000000-0000-0000-0000-000000000009', 20000, 'visita'),
  ('a0000000-0000-0000-0000-000000000024', '50000000-0000-0000-0000-000000000011', 195000, 'visita'),
  ('a0000000-0000-0000-0000-000000000025', '50000000-0000-0000-0000-000000000007', 30000, 'visita'),
  ('a0000000-0000-0000-0000-000000000025', '50000000-0000-0000-0000-000000000012', 20000, 'visita'),
  ('a0000000-0000-0000-0000-000000000025', '50000000-0000-0000-0000-000000000010', 125000, 'visita'),
  ('a0000000-0000-0000-0000-000000000026', '50000000-0000-0000-0000-000000000006', 30000, 'visita'),
  ('a0000000-0000-0000-0000-000000000026', '50000000-0000-0000-0000-000000000009', 130000, 'visita'),
  ('a0000000-0000-0000-0000-000000000026', '50000000-0000-0000-0000-000000000008', 85000, 'visita'),
  ('a0000000-0000-0000-0000-000000000027', '50000000-0000-0000-0000-000000000001', 170000, 'visita'),
  ('a0000000-0000-0000-0000-000000000027', '50000000-0000-0000-0000-000000000012', 90000, 'visita'),
  ('a0000000-0000-0000-0000-000000000027', '50000000-0000-0000-0000-000000000005', 80000, 'visita'),
  ('a0000000-0000-0000-0000-000000000028', '50000000-0000-0000-0000-000000000011', 100000, 'visita'),
  ('a0000000-0000-0000-0000-000000000028', '50000000-0000-0000-0000-000000000010', 30000, 'visita'),
  ('a0000000-0000-0000-0000-000000000028', '50000000-0000-0000-0000-000000000006', 50000, 'visita'),
  ('a0000000-0000-0000-0000-000000000029', '50000000-0000-0000-0000-000000000005', 55000, 'visita'),
  ('a0000000-0000-0000-0000-000000000029', '50000000-0000-0000-0000-000000000003', 115000, 'visita'),
  ('a0000000-0000-0000-0000-000000000029', '50000000-0000-0000-0000-000000000004', 180000, 'visita'),
  ('a0000000-0000-0000-0000-000000000030', '50000000-0000-0000-0000-000000000012', 70000, 'visita'),
  ('a0000000-0000-0000-0000-000000000030', '50000000-0000-0000-0000-000000000002', 45000, 'visita'),
  ('a0000000-0000-0000-0000-000000000030', '50000000-0000-0000-0000-000000000005', 110000, 'visita'),
  ('a0000000-0000-0000-0000-000000000031', '50000000-0000-0000-0000-000000000012', 95000, 'visita'),
  ('a0000000-0000-0000-0000-000000000031', '50000000-0000-0000-0000-000000000006', 65000, 'visita'),
  ('a0000000-0000-0000-0000-000000000031', '50000000-0000-0000-0000-000000000010', 20000, 'visita'),
  ('a0000000-0000-0000-0000-000000000032', '50000000-0000-0000-0000-000000000006', 160000, 'visita'),
  ('a0000000-0000-0000-0000-000000000032', '50000000-0000-0000-0000-000000000012', 70000, 'visita'),
  ('a0000000-0000-0000-0000-000000000032', '50000000-0000-0000-0000-000000000011', 170000, 'visita'),
  ('a0000000-0000-0000-0000-000000000033', '50000000-0000-0000-0000-000000000012', 40000, 'visita'),
  ('a0000000-0000-0000-0000-000000000033', '50000000-0000-0000-0000-000000000002', 150000, 'visita'),
  ('a0000000-0000-0000-0000-000000000033', '50000000-0000-0000-0000-000000000004', 150000, 'visita'),
  ('a0000000-0000-0000-0000-000000000034', '50000000-0000-0000-0000-000000000009', 25000, 'visita'),
  ('a0000000-0000-0000-0000-000000000034', '50000000-0000-0000-0000-000000000010', 140000, 'visita'),
  ('a0000000-0000-0000-0000-000000000034', '50000000-0000-0000-0000-000000000008', 125000, 'visita'),
  ('a0000000-0000-0000-0000-000000000035', '50000000-0000-0000-0000-000000000001', 120000, 'visita'),
  ('a0000000-0000-0000-0000-000000000035', '50000000-0000-0000-0000-000000000003', 85000, 'visita'),
  ('a0000000-0000-0000-0000-000000000035', '50000000-0000-0000-0000-000000000012', 165000, 'visita'),
  ('a0000000-0000-0000-0000-000000000036', '50000000-0000-0000-0000-000000000006', 90000, 'visita'),
  ('a0000000-0000-0000-0000-000000000036', '50000000-0000-0000-0000-000000000007', 40000, 'visita'),
  ('a0000000-0000-0000-0000-000000000036', '50000000-0000-0000-0000-000000000010', 30000, 'visita');

-- ---------------------------------------------------------------------------
-- Ubicaciones (una principal por proveedor)
-- ---------------------------------------------------------------------------
insert into public.locations (id, provider_id, label, address, region, commune, geom, is_primary) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Principal', 'Lope de Ulloa 1760, Quinta Normal', 'Metropolitana de Santiago', 'Quinta Normal', st_setsrid(st_makepoint(-70.7005, -33.4325), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Principal', 'Av. Providencia 1234, Providencia', 'Metropolitana de Santiago', 'Providencia', st_setsrid(st_makepoint(-70.6140, -33.4260), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Principal', 'Av. Vicuna Mackenna 5678, La Florida', 'Metropolitana de Santiago', 'La Florida', st_setsrid(st_makepoint(-70.5983, -33.5225), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Principal', 'Av. Pajaritos 2100, Maipu', 'Metropolitana de Santiago', 'Maipú', st_setsrid(st_makepoint(-70.7575, -33.5108), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Principal', 'Av. Argentina 1500, Antofagasta', 'Antofagasta', 'Antofagasta', st_setsrid(st_makepoint(-70.3975, -23.6509), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'Principal', 'O''Higgins 940, Concepcion', 'Biobío', 'Concepción', st_setsrid(st_makepoint(-73.0498, -36.8269), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'Principal', 'Av. Irarrazaval 3400, Nunoa', 'Metropolitana de Santiago', 'Ñuñoa', st_setsrid(st_makepoint(-70.5978, -33.4569), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'Principal', 'Av. Libertad 800, Vina del Mar', 'Valparaíso', 'Viña del Mar', st_setsrid(st_makepoint(-71.5518, -33.0245), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009', 'Principal', 'Av. Amunategui 178, Pudahuel', 'Metropolitana de Santiago', 'Pudahuel', st_setsrid(st_makepoint(-70.7462, -33.4405), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'Principal', 'Av. Diego Portales 600, Puerto Montt', 'Los Lagos', 'Puerto Montt', st_setsrid(st_makepoint(-72.9424, -41.4693), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'Principal', 'Direccion comercial, Ñuñoa', 'Metropolitana de Santiago', 'Ñuñoa', st_setsrid(st_makepoint(-70.6033, -33.4641), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000012', 'Principal', 'Direccion comercial, Las Condes', 'Metropolitana de Santiago', 'Las Condes', st_setsrid(st_makepoint(-70.5701, -33.4108), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000013', 'Principal', 'Direccion comercial, Maipú', 'Metropolitana de Santiago', 'Maipú', st_setsrid(st_makepoint(-70.7503, -33.5109), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000014', 'Principal', 'Direccion comercial, La Reina', 'Metropolitana de Santiago', 'La Reina', st_setsrid(st_makepoint(-70.5267, -33.4537), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000015', 'Principal', 'Direccion comercial, Quilicura', 'Metropolitana de Santiago', 'Quilicura', st_setsrid(st_makepoint(-70.7222, -33.3575), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000016', 'Principal', 'Direccion comercial, Renca', 'Metropolitana de Santiago', 'Renca', st_setsrid(st_makepoint(-70.7195, -33.3969), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000017', 'Principal', 'Direccion comercial, Vitacura', 'Metropolitana de Santiago', 'Vitacura', st_setsrid(st_makepoint(-70.5631, -33.3824), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000018', 'Principal', 'Direccion comercial, Puente Alto', 'Metropolitana de Santiago', 'Puente Alto', st_setsrid(st_makepoint(-70.5837, -33.6160), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000019', 'Principal', 'Direccion comercial, San Bernardo', 'Metropolitana de Santiago', 'San Bernardo', st_setsrid(st_makepoint(-70.6933, -33.5925), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000020', 'Principal', 'Direccion comercial, Providencia', 'Metropolitana de Santiago', 'Providencia', st_setsrid(st_makepoint(-70.6186, -33.4270), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000021', 'Principal', 'Direccion comercial, Peñalolén', 'Metropolitana de Santiago', 'Peñalolén', st_setsrid(st_makepoint(-70.5447, -33.4753), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000022', 'Principal', 'Direccion comercial, Santiago', 'Metropolitana de Santiago', 'Santiago', st_setsrid(st_makepoint(-70.6589, -33.4286), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000023', 'Principal', 'Direccion comercial, Colina', 'Metropolitana de Santiago', 'Colina', st_setsrid(st_makepoint(-70.6740, -33.1976), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000024', 'Principal', 'Direccion comercial, Huechuraba', 'Metropolitana de Santiago', 'Huechuraba', st_setsrid(st_makepoint(-70.6307, -33.3710), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000025', 'Principal', 'Direccion comercial, Macul', 'Metropolitana de Santiago', 'Macul', st_setsrid(st_makepoint(-70.5963, -33.4866), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000026', 'Principal', 'Direccion comercial, Pudahuel', 'Metropolitana de Santiago', 'Pudahuel', st_setsrid(st_makepoint(-70.7567, -33.4364), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000027', 'Principal', 'Direccion comercial, La Cisterna', 'Metropolitana de Santiago', 'La Cisterna', st_setsrid(st_makepoint(-70.6648, -33.5237), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000028', 'Principal', 'Direccion comercial, Rancagua', 'Libertador General Bernardo O''Higgins', 'Rancagua', st_setsrid(st_makepoint(-70.7475, -34.1689), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000029', 'Principal', 'Direccion comercial, La Serena', 'Coquimbo', 'La Serena', st_setsrid(st_makepoint(-71.2537, -29.9065), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000030', 'Principal', 'Direccion comercial, Temuco', 'La Araucanía', 'Temuco', st_setsrid(st_makepoint(-72.5877, -38.7356), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000031', 'Principal', 'Direccion comercial, Talca', 'Maule', 'Talca', st_setsrid(st_makepoint(-71.6482, -35.4185), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000032', 'Principal', 'Direccion comercial, Iquique', 'Tarapacá', 'Iquique', st_setsrid(st_makepoint(-70.1307, -20.2317), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000033', 'Principal', 'Direccion comercial, Valdivia', 'Los Ríos', 'Valdivia', st_setsrid(st_makepoint(-73.2466, -39.8176), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000034', 'Principal', 'Direccion comercial, Chillán', 'Ñuble', 'Chillán', st_setsrid(st_makepoint(-72.0974, -36.6032), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000035', 'Principal', 'Direccion comercial, Recoleta', 'Metropolitana de Santiago', 'Recoleta', st_setsrid(st_makepoint(-70.6348, -33.4105), 4326)::geography, true),
  ('10000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000036', 'Principal', 'Direccion comercial, Estación Central', 'Metropolitana de Santiago', 'Estación Central', st_setsrid(st_makepoint(-70.6890, -33.4539), 4326)::geography, true);

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

insert into public.reviews (provider_id, client_id, rating, comment, author_name, verified, created_at) values
  ('a0000000-0000-0000-0000-000000000011', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Cristóbal V.', true, '2026-07-23T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000011', null, 5, 'Excelente asesoria para elegir el equipo adecuado.', 'Benjamín R.', true, '2026-07-15T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000012', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Antonia S.', true, '2026-10-04T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000012', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Cristóbal V.', true, '2026-08-27T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000013', null, 4, 'Resolvieron la falla en una sola visita. Recomendados.', 'Josefa C.', true, '2026-07-22T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000013', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Martina H.', true, '2026-07-18T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000014', null, 5, 'Resolvieron la falla en una sola visita. Recomendados.', 'Francisca M.', true, '2026-09-13T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000014', null, 5, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Sebastián L.', true, '2026-08-05T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000015', null, 5, 'Excelente asesoria para elegir el equipo adecuado.', 'Valentina G.', true, '2026-09-13T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000015', null, 5, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Cristóbal V.', true, '2026-08-18T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000016', null, 5, 'Excelente asesoria para elegir el equipo adecuado.', 'Sebastián L.', true, '2026-10-04T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000016', null, 5, 'Resolvieron la falla en una sola visita. Recomendados.', 'Cristóbal V.', true, '2026-10-07T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000017', null, 4, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Valentina G.', true, '2026-10-25T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000017', null, 4, 'Buena atencion, el presupuesto fue claro y sin sorpresas.', 'Antonia S.', true, '2026-10-06T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000018', null, 4, 'Excelente asesoria para elegir el equipo adecuado.', 'Cristóbal V.', true, '2026-07-19T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000018', null, 4, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Valentina G.', true, '2026-06-08T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000019', null, 5, 'Buena atencion, el presupuesto fue claro y sin sorpresas.', 'Valentina G.', true, '2026-06-22T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000019', null, 5, 'Resolvieron la falla en una sola visita. Recomendados.', 'Benjamín R.', true, '2026-09-15T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000020', null, 5, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Francisca M.', true, '2026-06-15T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000020', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Ignacio P.', true, '2026-10-27T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000021', null, 5, 'Resolvieron la falla en una sola visita. Recomendados.', 'Benjamín R.', true, '2026-10-22T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000021', null, 5, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Sebastián L.', true, '2026-07-10T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000022', null, 4, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Martina H.', true, '2026-06-22T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000022', null, 4, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Valentina G.', true, '2026-10-08T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000023', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Ignacio P.', true, '2026-09-20T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000023', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Valentina G.', true, '2026-10-07T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000024', null, 4, 'Resolvieron la falla en una sola visita. Recomendados.', 'Valentina G.', true, '2026-06-24T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000024', null, 5, 'Buena atencion, el presupuesto fue claro y sin sorpresas.', 'Tomás A.', true, '2026-08-20T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000025', null, 5, 'Buena atencion, el presupuesto fue claro y sin sorpresas.', 'Antonia S.', true, '2026-10-23T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000025', null, 5, 'Excelente asesoria para elegir el equipo adecuado.', 'Ignacio P.', true, '2026-06-03T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000026', null, 5, 'Excelente asesoria para elegir el equipo adecuado.', 'Benjamín R.', true, '2026-10-24T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000026', null, 4, 'Buena atencion, el presupuesto fue claro y sin sorpresas.', 'Sebastián L.', true, '2026-07-14T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000027', null, 5, 'Buena atencion, el presupuesto fue claro y sin sorpresas.', 'Francisca M.', true, '2026-06-22T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000027', null, 4, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Josefa C.', true, '2026-08-28T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000028', null, 5, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Martina H.', true, '2026-10-04T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000028', null, 5, 'Excelente asesoria para elegir el equipo adecuado.', 'Francisca M.', true, '2026-08-02T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000029', null, 5, 'Resolvieron la falla en una sola visita. Recomendados.', 'Cristóbal V.', true, '2026-07-07T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000029', null, 5, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Sebastián L.', true, '2026-10-19T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000030', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Francisca M.', true, '2026-08-08T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000030', null, 4, 'Buena atencion, el presupuesto fue claro y sin sorpresas.', 'Ignacio P.', true, '2026-06-08T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000031', null, 4, 'Trabajo prolijo, aunque tardaron un poco en agendar.', 'Francisca M.', true, '2026-07-26T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000031', null, 5, 'Excelente asesoria para elegir el equipo adecuado.', 'Antonia S.', true, '2026-06-18T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000032', null, 5, 'Resolvieron la falla en una sola visita. Recomendados.', 'Cristóbal V.', true, '2026-09-21T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000032', null, 4, 'Resolvieron la falla en una sola visita. Recomendados.', 'Antonia S.', true, '2026-06-23T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000033', null, 4, 'Buena atencion, el presupuesto fue claro y sin sorpresas.', 'Benjamín R.', true, '2026-09-25T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000033', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Martina H.', true, '2026-09-16T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000034', null, 5, 'Buena atencion, el presupuesto fue claro y sin sorpresas.', 'Antonia S.', true, '2026-07-20T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000034', null, 5, 'Muy puntuales y ordenados, el equipo quedo funcionando perfecto.', 'Benjamín R.', true, '2026-10-19T12:00:00Z');

-- Resena del cliente sobre la solicitud completada (e0..05).
insert into public.reviews (provider_id, client_id, rating, comment, author_name, verified, created_at) values
  ('a0000000-0000-0000-0000-000000000003', '0d000000-0000-4000-8000-000000000002', 5, 'Cambiaron el rodamiento el mismo dia y el equipo quedo silencioso.', 'Matías F.', true, now() - interval '20 days');

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
  ('a0000000-0000-0000-0000-000000000009', 'Acreditacion de sala limpia ISO', 'verificado', 'https://example.com/docs/limpio-lab-iso.pdf', 'ISO 14644 validado.', '2026-05-02T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000011', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000012', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000013', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000014', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000015', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000016', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000017', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000018', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000019', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000020', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000021', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000022', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000023', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000024', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000025', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000026', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000027', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000028', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000029', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000030', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000031', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000032', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000033', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000034', 'RUT y patente comercial', 'verificado', null, 'Documentacion conforme.', '2026-09-01T12:00:00Z'),
  ('a0000000-0000-0000-0000-000000000035', 'RUT y patente comercial', 'pendiente', null, 'En espera de revision ASHRAE.', null),
  ('a0000000-0000-0000-0000-000000000035', 'Certificacion ASHRAE vigente', 'pendiente', null, null, null),
  ('a0000000-0000-0000-0000-000000000036', 'RUT y patente comercial', 'rechazado', null, 'Patente municipal vencida.', '2026-10-20T12:00:00Z');

-- ---------------------------------------------------------------------------
-- Solicitudes de servicio en todos los estados, con historial y cotizaciones
-- ---------------------------------------------------------------------------
insert into public.service_requests (id, client_id, service_id, equipment, description, urgency, status, commune, region, geom, created_at) values
  ('e0000000-0000-0000-0000-000000000001', '0d000000-0000-4000-8000-000000000001', '50000000-0000-0000-0000-000000000002', 'split', 'Necesito instalar un split de 12.000 BTU en el dormitorio principal de un departamento.', 'media', 'abierta', 'Ñuñoa', 'Metropolitana de Santiago', st_setsrid(st_makepoint(-70.5980, -33.4560), 4326)::geography, now() - interval '1 days'),
  ('e0000000-0000-0000-0000-000000000002', '0d000000-0000-4000-8000-000000000001', '50000000-0000-0000-0000-000000000012', 'split', 'El aire del living no enfria y bota agua por el frente desde hace dos dias.', 'alta', 'con_cotizaciones', 'La Florida', 'Metropolitana de Santiago', st_setsrid(st_makepoint(-70.5980, -33.5220), 4326)::geography, now() - interval '3 days'),
  ('e0000000-0000-0000-0000-000000000003', '0d000000-0000-4000-8000-000000000002', '50000000-0000-0000-0000-000000000007', 'ducto', 'Mantencion del sistema de ductos de una oficina de 120 m2 con dos unidades.', 'media', 'aceptada', 'Providencia', 'Metropolitana de Santiago', st_setsrid(st_makepoint(-70.6170, -33.4260), 4326)::geography, now() - interval '8 days'),
  ('e0000000-0000-0000-0000-000000000004', '0d000000-0000-4000-8000-000000000001', '50000000-0000-0000-0000-000000000001', 'split', 'Mantencion preventiva de tres equipos split antes del verano.', 'baja', 'en_ejecucion', 'Macul', 'Metropolitana de Santiago', st_setsrid(st_makepoint(-70.5990, -33.4920), 4326)::geography, now() - interval '12 days'),
  ('e0000000-0000-0000-0000-000000000005', '0d000000-0000-4000-8000-000000000002', '50000000-0000-0000-0000-000000000012', 'split', 'Equipo split con ruido fuerte en la unidad exterior, se apaga solo.', 'urgente', 'completada', 'Peñalolén', 'Metropolitana de Santiago', st_setsrid(st_makepoint(-70.5400, -33.4850), 4326)::geography, now() - interval '25 days'),
  ('e0000000-0000-0000-0000-000000000006', '0d000000-0000-4000-8000-000000000001', '50000000-0000-0000-0000-000000000008', 'chiller', 'Revision de un chiller pequeno en un local comercial del centro.', 'media', 'cancelada', 'Santiago', 'Metropolitana de Santiago', st_setsrid(st_makepoint(-70.6505, -33.4378), 4326)::geography, now() - interval '15 days'),
  ('e0000000-0000-0000-0000-000000000007', '0d000000-0000-4000-8000-000000000002', '50000000-0000-0000-0000-000000000007', 'vrf', 'Sistema VRF de oficina con una unidad interior que no responde al control.', 'alta', 'con_cotizaciones', 'Las Condes', 'Metropolitana de Santiago', st_setsrid(st_makepoint(-70.5670, -33.4080), 4326)::geography, now() - interval '40 days');

insert into public.service_request_events (request_id, actor_id, from_status, to_status, note, created_at) values
  ('e0000000-0000-0000-0000-000000000001', '0d000000-0000-4000-8000-000000000001', null, 'abierta', 'Solicitud creada', now() - interval '1 days' + interval '0 hours'),
  ('e0000000-0000-0000-0000-000000000002', '0d000000-0000-4000-8000-000000000001', null, 'abierta', 'Solicitud creada', now() - interval '3 days' + interval '0 hours'),
  ('e0000000-0000-0000-0000-000000000002', null, 'abierta', 'con_cotizaciones', 'Primera cotizacion recibida', now() - interval '3 days' + interval '6 hours'),
  ('e0000000-0000-0000-0000-000000000003', '0d000000-0000-4000-8000-000000000002', null, 'abierta', 'Solicitud creada', now() - interval '8 days' + interval '0 hours'),
  ('e0000000-0000-0000-0000-000000000003', null, 'abierta', 'con_cotizaciones', 'Primera cotizacion recibida', now() - interval '8 days' + interval '6 hours'),
  ('e0000000-0000-0000-0000-000000000003', '0d000000-0000-4000-8000-000000000002', 'con_cotizaciones', 'aceptada', 'Cotizacion aceptada', now() - interval '8 days' + interval '12 hours'),
  ('e0000000-0000-0000-0000-000000000004', '0d000000-0000-4000-8000-000000000001', null, 'abierta', 'Solicitud creada', now() - interval '12 days' + interval '0 hours'),
  ('e0000000-0000-0000-0000-000000000004', null, 'abierta', 'con_cotizaciones', 'Primera cotizacion recibida', now() - interval '12 days' + interval '6 hours'),
  ('e0000000-0000-0000-0000-000000000004', '0d000000-0000-4000-8000-000000000001', 'con_cotizaciones', 'aceptada', 'Cotizacion aceptada', now() - interval '12 days' + interval '12 hours'),
  ('e0000000-0000-0000-0000-000000000004', '0d000000-0000-4000-8000-000000000004', 'aceptada', 'en_ejecucion', 'Trabajo iniciado', now() - interval '12 days' + interval '18 hours'),
  ('e0000000-0000-0000-0000-000000000005', '0d000000-0000-4000-8000-000000000002', null, 'abierta', 'Solicitud creada', now() - interval '25 days' + interval '0 hours'),
  ('e0000000-0000-0000-0000-000000000005', null, 'abierta', 'con_cotizaciones', 'Primera cotizacion recibida', now() - interval '25 days' + interval '6 hours'),
  ('e0000000-0000-0000-0000-000000000005', '0d000000-0000-4000-8000-000000000002', 'con_cotizaciones', 'aceptada', 'Cotizacion aceptada', now() - interval '25 days' + interval '12 hours'),
  ('e0000000-0000-0000-0000-000000000005', '0d000000-0000-4000-8000-000000000003', 'aceptada', 'en_ejecucion', 'Trabajo iniciado', now() - interval '25 days' + interval '18 hours'),
  ('e0000000-0000-0000-0000-000000000005', '0d000000-0000-4000-8000-000000000003', 'en_ejecucion', 'completada', 'Trabajo completado', now() - interval '25 days' + interval '24 hours'),
  ('e0000000-0000-0000-0000-000000000006', '0d000000-0000-4000-8000-000000000001', null, 'abierta', 'Solicitud creada', now() - interval '15 days' + interval '0 hours'),
  ('e0000000-0000-0000-0000-000000000006', '0d000000-0000-4000-8000-000000000001', 'abierta', 'cancelada', 'El cliente cancelo la solicitud', now() - interval '15 days' + interval '6 hours'),
  ('e0000000-0000-0000-0000-000000000007', '0d000000-0000-4000-8000-000000000002', null, 'abierta', 'Solicitud creada', now() - interval '40 days' + interval '0 hours'),
  ('e0000000-0000-0000-0000-000000000007', null, 'abierta', 'con_cotizaciones', 'Primera cotizacion recibida', now() - interval '40 days' + interval '6 hours');

insert into public.quotes (request_id, provider_id, amount, includes_iva, scope, deadline_days, valid_days, status, created_at) values
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 65000, true, 'Diagnostico, limpieza de bandeja y desagüe, y revision de carga de gas.', 2, 15, 'enviada', now() - interval '2 days'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000011', 58000, true, 'Visita tecnica, destape de desagüe y limpieza completa del equipo.', 3, 10, 'enviada', now() - interval '1 days'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 240000, true, 'Mantencion completa de ductos, cambio de filtros y balanceo de aire.', 5, 15, 'aceptada', now() - interval '6 days'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000011', 260000, true, 'Limpieza de ductos con equipo rotativo y mantencion de unidades.', 4, 15, 'rechazada', now() - interval '6 days'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000011', 120000, true, 'Mantencion preventiva de tres equipos split: filtros, serpentines y gas.', 2, 15, 'aceptada', now() - interval '10 days'),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 95000, true, 'Cambio de rodamiento del ventilador exterior y prueba de funcionamiento.', 1, 7, 'aceptada', now() - interval '24 days'),
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 410000, true, 'Diagnostico del sistema VRF, revision de comunicacion y tarjeta electronica.', 7, 15, 'vencida', now() - interval '38 days'),
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000011', 380000, true, 'Revision de unidad interior VRF y reprogramacion del control central.', 5, 20, 'enviada', now() - interval '4 days');

-- ---------------------------------------------------------------------------
-- Notificaciones de ejemplo
-- ---------------------------------------------------------------------------
insert into public.notifications (user_id, type, title, body, ref_type, ref_id, read, created_at) values
  ('0d000000-0000-4000-8000-000000000001', 'nueva_cotizacion', 'Nueva cotización recibida', 'Hogar Fresco Instalaciones te envió una cotización por $65.000.', 'request', 'e0000000-0000-0000-0000-000000000002', false, now() - interval '2 days'),
  ('0d000000-0000-4000-8000-000000000001', 'nueva_cotizacion', 'Nueva cotización recibida', 'Climatiza Ñuñoa SpA te envió una cotización por $58.000.', 'request', 'e0000000-0000-0000-0000-000000000002', false, now() - interval '1 day'),
  ('0d000000-0000-4000-8000-000000000003', 'cotizacion_aceptada', 'Tu cotización fue aceptada', 'El cliente aceptó tu cotización por $240.000.', 'request', 'e0000000-0000-0000-0000-000000000003', false, now() - interval '5 days'),
  ('0d000000-0000-4000-8000-000000000004', 'cotizacion_rechazada', 'Tu cotización no fue seleccionada', 'El cliente eligió otra cotización.', 'request', 'e0000000-0000-0000-0000-000000000003', true, now() - interval '5 days');
