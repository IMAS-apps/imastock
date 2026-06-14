-- Schema for IMAStock Application

-- Enable uuid-ossp extension
create extension if not exists "uuid-ossp";

-- 1. Residencias
create table if not exists residencias (
  id text primary key,
  nombre text not null,
  direccion text,
  codigo_postal text,
  ciudad text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Perfiles (Usuarios)
create table if not exists perfiles (
  id text primary key,
  email text unique not null,
  nombre text not null,
  rol text not null check (rol in ('Administrador', 'Administrativo', 'Personal de almacén', 'Coordinador de planta')),
  residencia_ids text[] default '{}'::text[],
  planta_asignada text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Productos
create table if not exists productos (
  id text primary key,
  residencia_id text references residencias(id) on delete cascade,
  nom text not null,
  familia text not null,
  subfamilia text not null,
  ubicacion text,
  estoc_actual integer not null default 0,
  estoc_minim integer not null default 0,
  estoc_maxim integer not null default 0,
  caducidad date,
  consum_mensual integer not null default 0,
  lot text,
  expedient text,
  data_inici_contracte date,
  data_final_contracte date,
  observacions text,
  aprobado boolean not null default false,
  es_uniforme boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Límites de Planta
create table if not exists limites_planta (
  id text primary key,
  residencia_id text references residencias(id) on delete cascade,
  producto_id text references productos(id) on delete cascade,
  planta_id text not null,
  maximo_unidades integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Pedidos
create table if not exists pedidos (
  id text primary key,
  residencia_id text references residencias(id) on delete cascade,
  planta text not null,
  producto_id text references productos(id) on delete cascade,
  unidades_maximas integer not null default 0,
  unidades_solicitadas integer not null default 0,
  unidades_entregadas integer not null default 0,
  estado text not null check (estado in ('Borrador', 'Bloqueada por exceso', 'Aprobada / Lista para preparar', 'Enviada', 'Recibida / Cerrada')),
  check_verificacion boolean not null default false,
  observaciones text,
  creado_por text not null,
  creado_por_nombre text not null,
  fecha timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Entradas de Stock (Albaranes)
create table if not exists entradas_stock (
  id text primary key default 'ent-' || substring(uuid_generate_v4()::text from 1 for 8),
  residencia_id text references residencias(id) on delete cascade,
  n_albaran text not null,
  proveedor text not null,
  fecha timestamp with time zone default timezone('utc'::text, now()) not null,
  url_documento text,
  producto_id text references productos(id) on delete cascade,
  cantidad integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Ajustes de Stock
create table if not exists ajustes_stock (
  id text primary key,
  residencia_id text references residencias(id) on delete cascade,
  producto_id text references productos(id) on delete cascade,
  producto_nom text not null,
  estoc_anterior integer not null,
  estoc_nou integer not null,
  motiu text not null,
  data timestamp with time zone default timezone('utc'::text, now()) not null,
  usuari text not null
);

-- 8. Entregas de Uniformes
create table if not exists uniforme_entregas (
  id text primary key,
  residencia_id text references residencias(id) on delete cascade,
  empleat_nom text not null,
  producto_id text references productos(id) on delete cascade,
  cantidad integer not null,
  talla text not null,
  data timestamp with time zone default timezone('utc'::text, now()) not null,
  usuari text not null
);

-- 9. Configuración de Visibilidad de Campos
create table if not exists visibilidad_config (
  rol text primary key,
  id_visible boolean not null default true,
  nom_visible boolean not null default true,
  familia_visible boolean not null default true,
  subfamilia_visible boolean not null default true,
  ubicacion_visible boolean not null default true,
  estoc_actual_visible boolean not null default true,
  estoc_minim_visible boolean not null default true,
  estoc_maxim_visible boolean not null default true,
  caducidad_visible boolean not null default true,
  consum_mensual_visible boolean not null default true,
  lot_visible boolean not null default true,
  expedient_visible boolean not null default true,
  data_inici_contracte_visible boolean not null default true,
  data_final_contracte_visible boolean not null default true,
  observacions_visible boolean not null default true
);

-- Seed Data (Initial Mock Data)
insert into residencias (id, nombre, direccion, codigo_postal, ciudad) values
('res-1', 'Residència Bonanova', 'C/ de Francesc Vidal i Sureda, 72', '07015', 'Palma'),
('res-2', 'Llar dels Ancians', 'C/ General Riera, 115', '07010', 'Palma'),
('res-3', 'Huialfàs', 'C/ Isaac Peral, 19', '07420', 'Sa Pobla')
on conflict (id) do nothing;

insert into perfiles (id, email, nombre, rol, residencia_ids, planta_asignada) values
('perf-1', 'admin@imastock.org', 'Tomàs Català (Admin)', 'Administrador', array['res-1', 'res-2', 'res-3'], null),
('perf-2', 'adminis@imastock.org', 'Marta Soler (Administrativa)', 'Administrativo', array['res-1', 'res-2'], null),
('perf-3', 'almacen@imastock.org', 'Joan Pujol (Almacenero)', 'Personal de almacén', array['res-1'], null),
('perf-4', 'planta1@imastock.org', 'Clara Sànchez (Coord. Planta 1)', 'Coordinador de planta', array['res-1'], 'Planta 1'),
('perf-5', 'comedor@imastock.org', 'Ferran Ruiz (Coord. Menjador)', 'Coordinador de planta', array['res-1'], 'Comedor Central')
on conflict (id) do nothing;

insert into productos (id, residencia_id, nom, familia, subfamilia, ubicacion, estoc_actual, estoc_minim, estoc_maxim, caducidad, consum_mensual, lot, expedient, data_inici_contracte, data_final_contracte, observacions, aprobado, es_uniforme) values
('prod-r1-1', 'res-1', 'Bolquer anatòmic Nit Talla G', 'Higiene i Sanitari', 'Incontinència', 'Passadís A - Estanteria 2', 120, 150, 500, '2028-12-31', 450, 'L-ABS9982', 'EXP-2025-SAN01', '2025-01-01', '2027-12-31', 'Enviament prioritari. Subministrat per ABS S.A.', true, false),
('prod-r1-2', 'res-1', 'Suplement Nutricional Vainilla 200ml', 'Dietètica i Nutrició', 'Suplements', 'Nevera Almacén B', 180, 160, 400, '2026-10-15', 300, 'L-NEST-231', 'EXP-2025-NUT04', '2025-03-15', '2026-03-15', 'Conservar entre 2 y 8 grados Celsius.', true, false),
('prod-r1-3', 'res-1', 'Esponja sabonosa d''un sol ús (Pack 24)', 'Higiene i Sanitari', 'Banys', 'Passadís B - Estanteria 1', 340, 100, 800, null, 600, 'L-ESP8763', 'EXP-2025-SAN01', '2025-01-01', '2027-12-31', 'Ús diari per a llit i dutxa.', true, false),
('prod-r1-4', 'res-1', 'Mascareta Quirúrgica Alta Protecció', 'Higiene i Sanitari', 'Protecció', 'Armari Entrada Almacén', 1050, 1000, 5000, '2027-05-20', 2000, 'L-MQ-009', 'EXP-19-MED-03', '2024-06-01', '2026-06-01', 'Obligatoria en episodis respiratoris aguts.', true, false),
('prod-r1-5', 'res-1', 'Casaca Sanitària Gris IMA', 'Lenceria i Uniformitat', 'Uniformitat', 'Zona Textil - Prestatge 4', 45, 20, 100, null, 10, '', 'EXP-UNI-2025', '2025-01-01', '2028-01-01', 'Teixit resistent a clor i autolavats.', true, true),
('prod-r1-6', 'res-1', 'Pantaló Sanitari Blanc Unisex', 'Lenceria i Uniformitat', 'Uniformitat', 'Zona Textil - Prestatge 5', 62, 30, 120, null, 12, '', 'EXP-UNI-2025', '2025-01-01', '2028-01-01', 'Cintura elàstica de fàcil ajust.', true, true),
('prod-r1-7', 'res-1', 'Crema Hidratant Urea 10% 500ml', 'Higiene i Sanitari', 'Cures', 'Passadís A - Estanteria 5', 15, 50, 200, '2026-11-30', 100, 'L-CH110', 'EXP-2025-SAN01', '2025-01-01', '2027-12-31', 'Especial per a pells seques i senils.', false, false),
('prod-r2-1', 'res-2', 'Espessidor de líquids Sabor Neutre 250g', 'Dietètica i Nutrició', 'Disfàgia', 'Prestatgeria Dieta 1', 90, 30, 200, '2027-02-18', 60, 'L-ESP-998', 'EXP-EXP-GE-25-03', '2025-04-01', '2027-04-01', 'Vital per a pacients amb disfàgia.', true, false),
('prod-r2-2', 'res-2', 'Bata d''Aïllament d''un sol ús', 'Higiene i Sanitari', 'Protecció', 'Dipòsit de Seguretat', 400, 500, 1500, null, 1200, 'L-BAT-3323', 'EXP-COVID-24', '2024-01-01', '2026-06-30', 'Impermeables i transpirables.', true, false)
on conflict (id) do nothing;

insert into limites_planta (id, residencia_id, producto_id, planta_id, maximo_unidades) values
('lim-1', 'res-1', 'prod-r1-1', 'Planta 1', 30),
('lim-2', 'res-1', 'prod-r1-2', 'Planta 1', 20),
('lim-3', 'res-1', 'prod-r1-3', 'Planta 1', 50),
('lim-4', 'res-1', 'prod-r1-2', 'Comedor Central', 15),
('lim-5', 'res-1', 'prod-r1-3', 'Comedor Central', 5)
on conflict (id) do nothing;

insert into pedidos (id, residencia_id, planta, producto_id, unidades_maximas, unidades_solicitadas, unidades_entregadas, estado, check_verificacion, observaciones, creado_por, creado_por_nombre, fecha) values
('ped-1', 'res-1', 'Planta 1', 'prod-r1-1', 30, 24, 0, 'Borrador', false, 'Consum habitual per a canvis de nit.', 'planta1@imastock.org', 'Clara Sànchez', '2026-06-13T18:30:00Z'),
('ped-2', 'res-1', 'Planta 1', 'prod-r1-2', 20, 40, 0, 'Bloqueada por exceso', false, 'Campanya especial reforç d''estiu.', 'planta1@imastock.org', 'Clara Sànchez', '2026-06-14T08:00:00Z'),
('ped-3', 'res-1', 'Comedor Central', 'prod-r1-3', 5, 5, 5, 'Enviada', false, 'Neteja ràpida post-servei.', 'comedor@imastock.org', 'Ferran Ruiz', '2026-06-13T10:00:00Z'),
('ped-4', 'res-1', 'Planta 1', 'prod-r1-3', 50, 45, 40, 'Recibida / Cerrada', true, 'Ens feien falta ràpidament.', 'planta1@imastock.org', 'Clara Sànchez', '2026-06-12T14:20:00Z')
on conflict (id) do nothing;

insert into ajustes_stock (id, residencia_id, producto_id, producto_nom, estoc_anterior, estoc_nou, motiu, data, usuari) values
('aj-1', 'res-1', 'prod-r1-1', 'Bolquer anatòmic Nit Talla G', 154, 120, 'Desquadre oposat durant el recompte físic semestral. S''han fet malbé 34 unitats per humitat.', '2026-06-10T11:00:00Z', 'Joan Pujol (Almacen)')
on conflict (id) do nothing;

insert into uniforme_entregas (id, residencia_id, empleat_nom, producto_id, cantidad, talla, data, usuari) values
('u-1', 'res-1', 'Serrat Garcia, Montserrat', 'prod-r1-5', 2, 'M', '2026-06-12T09:45:00Z', 'Joan Pujol (Almacen)'),
('u-2', 'res-1', 'Fontanals Solé, Albert', 'prod-r1-6', 1, 'XL', '2026-06-13T16:15:00Z', 'Joan Pujol (Almacen)')
on conflict (id) do nothing;

insert into visibilidad_config (rol, id_visible, nom_visible, familia_visible, subfamilia_visible, ubicacion_visible, estoc_actual_visible, estoc_minim_visible, estoc_maxim_visible, caducidad_visible, consum_mensual_visible, lot_visible, expedient_visible, data_inici_contracte_visible, data_final_contracte_visible, observacions_visible) values
('Administrador', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true),
('Administrativo', false, true, true, true, true, true, true, true, true, true, true, true, true, true, true),
('Personal de almacén', false, true, true, true, true, true, true, true, true, false, true, false, false, false, true),
('Coordinador de planta', false, true, true, true, false, false, false, false, false, false, false, false, false, false, true)
on conflict (rol) do nothing;
