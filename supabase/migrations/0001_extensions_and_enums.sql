-- Extensiones requeridas.
-- postgis: busqueda geoespacial (locations.geom).
-- vector: embeddings para RAG de manuales tecnicos (modulo IA diferido).
create extension if not exists postgis;
create extension if not exists vector;

-- Roles de usuario de la plataforma.
create type user_role as enum ('cliente', 'proveedor', 'admin');

-- Estado de verificacion de un proveedor (validado por ASHRAE/admin).
create type verification_status as enum ('pendiente', 'en_revision', 'verificado', 'rechazado');

-- Sector objetivo de un proveedor o servicio.
create type service_segment as enum ('residencial', 'comercial', 'industrial');

-- Estado de una solicitud de servicio (lead).
create type lead_status as enum ('nuevo', 'contactado', 'cotizado', 'cerrado', 'perdido');

-- Estado de una visita agendada.
create type appointment_status as enum ('propuesta', 'confirmada', 'realizada', 'cancelada');
