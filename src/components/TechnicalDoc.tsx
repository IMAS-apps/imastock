import { useState } from 'react';
import { Copy, Check, FileText, Shield, Key, Zap, Database } from 'lucide-react';

export default function TechnicalDoc() {
  const [activeTab, setActiveTab] = useState<'stack' | 'sql' | 'rls' | 'triggers'>('stack');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sqlSchemaCode = `-- =====================================================================
-- IMAStock - MODELO DE DATOS DETALLADO (SUPABASE / POSTGRESQL)
-- Sistema de gestión de almacén multi-centro para Residencias Públicas
-- =====================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES DE USUARIO (Enum)
CREATE TYPE user_role AS ENUM (
  'Administrador', 
  'Administrativo', 
  'Personal de almacén', 
  'Coordinador de planta'
);

-- ESTADOS DE PEDIDO (Enum)
CREATE TYPE pedido_estado AS ENUM (
  'Borrador', 
  'Bloqueada por exceso', 
  'Aprobada / Lista para preparar', 
  'Enviada', 
  'Recibida / Cerrada'
);

-- 1. RESIDENCIAS (TENANTS) - Multi-tenant aislado
CREATE TABLE residencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  direccion VARCHAR(300) NOT NULL,
  codigo_postal VARCHAR(10) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERFILES (VINCULADOS A auth.users DE SUPABASE)
CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  rol user_role NOT NULL DEFAULT 'Coordinador de planta',
  planta_asignada VARCHAR(100), -- Solo para coordinadores
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA INTERMEDIA N:M PARA ACCESO MULTI-CENTRO DE USUARIOS
-- Admins y administrativos pueden gestionar múltiples residencias,
-- mientras que operarios o coordinadores están fijos a una sola.
CREATE TABLE perfiles_residencias (
  perfil_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  residencia_id UUID REFERENCES residencias(id) ON DELETE CASCADE,
  PRIMARY KEY (perfil_id, residencia_id)
);

-- 3. PRODUCTOS E INVENTARIO
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  familia VARCHAR(150) NOT NULL,
  subfamilia VARCHAR(150) NOT NULL,
  ubicacion VARCHAR(200) NOT NULL,
  estoc_actual INTEGER NOT NULL DEFAULT 0 CONSTRAINT chk_estoc_actual CHECK (estoc_actual >= 0),
  estoc_minim INTEGER NOT NULL DEFAULT 0 CONSTRAINT chk_estoc_minim CHECK (estoc_minim >= 0),
  estoc_maxim INTEGER NOT NULL DEFAULT 5000 CONSTRAINT chk_estoc_maxim CHECK (estoc_maxim >= estoc_minim),
  caducidad DATE,
  consum_mensual INTEGER NOT NULL DEFAULT 0 CONSTRAINT chk_consum CHECK (consum_mensual >= 0),
  lot VARCHAR(100),
  expedient VARCHAR(100),
  data_inici_contracte DATE,
  data_final_contracte DATE,
  observacions TEXT,
  aprobado BOOLEAN NOT NULL DEFAULT FALSE, -- Flujo de aprobación para operarios
  es_uniforme BOOLEAN NOT NULL DEFAULT FALSE, -- Identificador módulo de uniformes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_expediente_fechas CHECK (data_final_contracte >= data_inici_contracte)
);

-- INDICES DE BÚSQUEDA RÁPIDA (Buscador UX)
CREATE INDEX idx_productos_busqueda ON productos (residencia_id, nom, familia, subfamilia);

-- 4. LIMITES DE PLANTA / DEPARTAMENTO (N:M INTERMEDIA EXCESOS)
-- Define el stock máximo por planta o departamento ("Unitats màximes a sol·licitar")
CREATE TABLE limites_planta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  planta_id VARCHAR(100) NOT NULL, -- "Planta 1", "Planta 2", "Comedor", "Cafetería"
  maximo_unidades INTEGER NOT NULL CHECK (maximo_unidades >= 0),
  UNIQUE (residencia_id, producto_id, planta_id)
);

-- 5. PEDIDOS (COMANDES) DE PLANTA Y FLUJO DE ESTADOS
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  planta VARCHAR(100) NOT NULL,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  unidades_maximas INTEGER NOT NULL DEFAULT 0, -- Caché del límite de planta al crearse
  unidades_solicitadas INTEGER NOT NULL CHECK (unidades_solicitadas > 0),
  unidades_entregadas INTEGER NOT NULL DEFAULT 0 CHECK (unidades_entregadas >= 0),
  estado pedido_estado NOT NULL DEFAULT 'Borrador',
  check_verificacion_recepcion BOOLEAN NOT NULL DEFAULT FALSE,
  observaciones TEXT,
  creado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ENTRADAS DE ALMACÉN Y ALBARANES
-- Registra entradas físicas de mercancía con referencia documental en PDF/Imagen
CREATE TABLE entradas_almacen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  n_albaran VARCHAR(100) NOT NULL,
  proveedor VARCHAR(200) NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url_documento VARCHAR(500), -- Almacenamiento en Supabase Storage (PDF / Imagen)
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);

-- 7. AJUSTES DE INVENTARIO MANUAL (REGISTRO AUDITORÍA)
CREATE TABLE ajustes_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  producto_nom VARCHAR(255) NOT NULL,
  estoc_anterior INTEGER NOT NULL,
  estoc_nou INTEGER NOT NULL,
  motiu TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuari VARCHAR(255) NOT NULL -- Nombre y correo del operario que realiza el ajuste
);

-- 8. UNIFORMES (REGISTRO DE ENTREGAS DIRECTAS)
CREATE TABLE entregas_uniformes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  empleat_nom VARCHAR(300) NOT NULL, -- Texto libre
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  talla VARCHAR(50) NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuari VARCHAR(255) NOT NULL -- Usuario que registró la entrega
);

-- 9. CONFIGURACIÓN DE PANTALLA EXCLUSIVA (CAMPOS VISIBLES POR ROL)
CREATE TABLE configuraciones_listados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  rol user_role NOT NULL,
  campos_visibles JSONB NOT NULL DEFAULT '{
    "id": false, "nom": true, "familia": true, "subfamilia": true, "ubicacion": true, "estocActual": true,
    "estocMinim": true, "estocMaxim": true, "caducidad": true, "consumMensual": true, "lot": true,
    "expedient": true, "dataIniciContracte": true, "dataFinalContracte": true, "observacions": true
  }'::jsonb,
  UNIQUE(residencia_id, rol)
);`;

  const rlsCode = `-- =====================================================================
-- ROW LEVEL SECURITY (RLS) & ACCESO MULTI-TENANT ISLADO
-- Cada usuario solo puede ver y editar datos de su residencia asignada.
-- =====================================================================

-- Habilitar RLS en todas las tablas clave
ALTER TABLE residencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_residencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE limites_planta ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas_almacen ENABLE ROW LEVEL SECURITY;
ALTER TABLE ajustes_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas_uniformes ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para obtener las residencias permitidas del usuario actual
CREATE OR REPLACE FUNCTION user_allowed_residences()
RETURNS TABLE (residencia_id UUID) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT pr.residencia_id 
  FROM perfiles_residencias pr
  WHERE pr.perfil_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- 1. POLÍTICAS PARA PRODUCTOS
CREATE POLICY "Permitir lectura de productos de mi residencia"
ON productos FOR SELECT
USING (residencia_id IN (SELECT residencia_id FROM user_allowed_residences()));

CREATE POLICY "Permitir inserción de productos para Administrativos o Almacén"
ON productos FOR INSERT
WITH CHECK (
  residencia_id IN (SELECT residencia_id FROM user_allowed_residences()) AND
  EXISTS (
    SELECT 1 FROM perfiles 
    WHERE id = auth.uid() AND rol IN ('Administrador', 'Administrativo', 'Personal de almacén')
  )
);

CREATE POLICY "Permitir edición a Administradores y Administrativos. Almacén si está en su centro"
ON productos FOR UPDATE
USING (
  residencia_id IN (SELECT residencia_id FROM user_allowed_residences()) AND
  EXISTS (
    SELECT 1 FROM perfiles 
    WHERE id = auth.uid() AND rol IN ('Administrador', 'Administrativo', 'Personal de almacén')
  )
);

-- 2. POLÍTICAS PARA PEDIDOS (COMANDES)
CREATE POLICY "Lectura de pedidos según centro"
ON pedidos FOR SELECT
USING (residencia_id IN (SELECT residencia_id FROM user_allowed_residences()));

CREATE POLICY "Creación de pedidos para Coordinadores, Administrativos y Admins"
ON pedidos FOR INSERT
WITH CHECK (
  residencia_id IN (SELECT residencia_id FROM user_allowed_residences()) AND
  EXISTS (
    SELECT 1 FROM perfiles 
    WHERE id = auth.uid() AND rol IN ('Administrador', 'Administrativo', 'Coordinador de planta')
  )
);

CREATE POLICY "Reglas para actualizar pedidos según el rol"
ON pedidos FOR UPDATE
USING (
  residencia_id IN (SELECT residencia_id FROM user_allowed_residences())
);
-- Nota: La lógica específica de aprobación por exceso (Bloqueada por exceso)
-- e introducción de cantidades entregadas se modela con TRIGGERS o en API.`;

  const triggersCode = `-- =====================================================================
-- TRIGGERS Y FUNCIONES AUTOMÁTICAS (LÓGICA DE NEGOCIO EN BD)
-- Automatiza descuentos de stock y control de historiales de forma íntegra.
-- =====================================================================

-- 1. TRIGGER: DESCUENTO AUTOMÁTICO AL ENVIAR UN PEDIDO DE PLANTA
CREATE OR REPLACE FUNCTION procesar_descuento_por_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado pasa a 'Enviada' / El almacenero realiza la entrega
  IF NEW.estado = 'Enviada' AND OLD.estado <> 'Enviada' THEN
    UPDATE productos
    SET estoc_actual = estoc_actual - NEW.unidades_entregadas
    WHERE id = NEW.producto_id;
    
    -- Registrar en ajustes para auditoría
    INSERT INTO ajustes_stock (residencia_id, producto_id, producto_nom, estoc_anterior, estoc_nou, motiu, usuari)
    SELECT 
      NEW.residencia_id,
      NEW.producto_id,
      p.nom,
      p.estoc_actual + NEW.unidades_entregadas, -- El stock antes del update de arriba
      p.estoc_actual,
      'Descuento automático por envío de pedido planta ' || NEW.planta || ' (ID: ' || NEW.id || ')',
      'SISTEMA / Almacén'
    FROM productos p
    WHERE p.id = NEW.producto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_descuento_pedido
AFTER UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION procesar_descuento_por_pedido();


-- 2. TRIGGER: DESCUENTO AUTOMÁTICO AL ENTREGAR UN UNIFORME
CREATE OR REPLACE FUNCTION procesar_entrega_uniforme()
RETURNS TRIGGER AS $$
DECLARE
  v_estoc_actual INTEGER;
  v_prod_nom VARCHAR(255);
BEGIN
  -- Obtener información actual del producto uniforme
  SELECT estoc_actual, nom INTO v_estoc_actual, v_prod_nom
  FROM productos
  WHERE id = NEW.producto_id;

  -- Descontar el stock en productos
  UPDATE productos
  SET estoc_actual = estoc_actual - NEW.cantidad
  WHERE id = NEW.producto_id;

  -- Insertar auditoría automática
  INSERT INTO ajustes_stock (
    residencia_id, 
    producto_id, 
    producto_nom, 
    estoc_anterior, 
    estoc_nou, 
    motiu, 
    usuari
  ) VALUES (
    NEW.residencia_id,
    NEW.producto_id,
    v_prod_nom,
    v_estoc_actual,
    v_estoc_actual - NEW.cantidad,
    'Entrega de uniforme a empleado/a: ' || NEW.empleat_nom || ' (Talla: ' || NEW.talla || ')',
    NEW.usuari
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entrega_uniforme
AFTER INSERT ON entregas_uniformes
FOR EACH ROW
EXECUTE FUNCTION procesar_entrega_uniforme();


-- 3. TRIGGER: INCREMENTAR STOCK AUTOMÁTICAMENTE AL REGISTRAR UN ALBARÁN (ENTRADAS)
CREATE OR REPLACE FUNCTION procesar_entrada_albaran()
RETURNS TRIGGER AS $$
DECLARE
  v_estoc_actual INTEGER;
  v_prod_nom VARCHAR(255);
BEGIN
  SELECT estoc_actual, nom INTO v_estoc_actual, v_prod_nom
  FROM productos
  WHERE id = NEW.producto_id;

  -- Incrementar stock del producto
  UPDATE productos
  SET estoc_actual = estoc_actual + NEW.cantidad
  WHERE id = NEW.producto_id;

  -- Registrar en histórico de ajustes de auditoría
  INSERT INTO ajustes_stock (
    residencia_id, 
    producto_id, 
    producto_nom, 
    estoc_anterior, 
    estoc_nou, 
    motiu, 
    usuari
  ) VALUES (
    NEW.residencia_id,
    NEW.producto_id,
    v_prod_nom,
    v_estoc_actual,
    v_estoc_actual + NEW.cantidad,
    'Entrada manual de stock certificada por Albarán N°: ' || NEW.n_albaran || ' (Proveedor: ' || NEW.proveedor || ')',
    'SISTEMA / Almacén'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entrada_albaran
AFTER INSERT ON entradas_almacen
FOR EACH ROW
EXECUTE FUNCTION procesar_entrada_albaran();`;

  return (
    <div id="tech-doc-container" className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans flex items-center gap-2">
            <Database className="h-5 w-5" />
            Centro de Arquitectura y Documentación Técnica
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            Plano del modelo relacional multi-centro, roles, políticas RLS y triggers de integridad empresarial para <span className="font-semibold text-white">IMAStock</span>.
          </p>
        </div>
        <button
          onClick={() => {
            const fullScript = `${sqlSchemaCode}\n\n${rlsCode}\n\n${triggersCode}`;
            handleCopy(fullScript);
          }}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all border border-white/20 self-start md:self-auto cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-300 animate-bounce" /> : <Copy className="h-4 w-4" />}
          {copied ? '¡Copiado al portapapeles!' : 'Copiar Script Completo (SQL)'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={() => setActiveTab('stack')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'stack'
              ? 'border-emerald-600 text-emerald-800 bg-white font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <FileText className="h-4 w-4" />
          Arquitectura y Solución
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'sql'
              ? 'border-emerald-600 text-emerald-800 bg-white font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <Database className="h-4 w-4" />
          Esquema de Tablas SQL
        </button>
        <button
          onClick={() => setActiveTab('rls')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'rls'
              ? 'border-emerald-600 text-emerald-800 bg-white font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <Shield className="h-4 w-4" />
          Políticas RLS (Tenancy)
        </button>
        <button
          onClick={() => setActiveTab('triggers')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'triggers'
              ? 'border-emerald-600 text-emerald-800 bg-white font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          <Zap className="h-4 w-4" />
          Automatizaciones (Triggers)
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'stack' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
                  <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md"><Database className="h-4 w-4" /></span>
                  Arquitectura Multi-Tenant Aislada
                </h3>
                <p className="text-slate-600 text-xs mt-3 leading-relaxed">
                  Para una red de residencias públicas gestionada de manera unificada pero descentralizada, la arquitectura <strong>Multi-Tenant Silo Lógico</strong> en Supabase PostgreSQL es idónea.
                </p>
                <ul className="text-slate-600 text-xs list-disc pl-5 mt-2.5 space-y-1.5 leading-relaxed">
                  <li><strong>Residencia como Clave de Partición:</strong> Todas las entidades críticas heredan la columna <code>residencia_id</code>, que actúa como el identificador único del inquilino (tenant).</li>
                  <li><strong>Aislamiento Estricto vía RLS:</strong> La base de datos deniega cualquier intento de consulta del personal de una residencia sobre productos de otra. No depende únicamente de comprobaciones a nivel de frontend, reforzando la confidencialidad sanitaria.</li>
                  <li><strong>Administración Unificada:</strong> Los inspectores o perfiles de <em>Dirección/Administración Pública</em> pueden vincularse a múltiples residencias, operando con conmutador fluido en la parte superior.</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-base">
                  <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md"><Zap className="h-4 w-4" /></span>
                  Justificación Tecnológica del Stack
                </h3>
                <p className="text-slate-600 text-xs mt-3 leading-relaxed">
                  El sistema web se proyecta en un stack moderno de alto rendimiento que unifica agilidad de desarrollo y seguridad corporativa:
                </p>
                <div className="mt-3.5 space-y-2.5">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800">Frontend: React con Vite + Tailwind CSS</span>
                    <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">Componentes de rápida carga sin sobrecarga de frameworks pesados, con diseño responsivo móvil-desktop y botones táctiles optimizados para el uso ágil de operarios de almacén.</p>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800">Backend & Auth: Supabase (PostgreSQL + Auth)</span>
                    <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">Autenticación segura JWT out-of-the-box mapeada con triggers para poblar la tabla de perfiles en base a <code>auth.users</code>. Uso intensivo de procedimientos almacenados y triggers nativos de PostgreSQL para disminuir latencias en transacciones de inventario.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-amber-100 bg-amber-50/70 p-4 rounded-lg flex gap-3 text-xs leading-relaxed text-amber-900">
              <Shield className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold">Nota del Arquitecto UX sobre simplificación del flujo:</p>
                <p className="mt-1 text-amber-800">
                  La interfaz de IMAStock está planteada de manera que un operario de almacén no necesite navegar a través de múltiples formularios abstractos para asentar existencias. La manipulación de cantidades se realiza directamente desde el listado general usando incrementadores automáticos rápidos, mientras que las alertas por colores <strong>(Rojo: Bajo Mínimo / Amarillo: Próximo al Mínimo / Verde: Óptimo)</strong> agilizan visualmente la selección de productos para pedidos.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded-t-lg -mb-4">
              <span className="text-gray-400 font-mono text-xs">schema.sql</span>
              <button
                onClick={() => handleCopy(sqlSchemaCode)}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer py-1 px-2 hover:bg-white/5 rounded"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-b-lg overflow-x-auto border border-slate-900 max-h-[450px] leading-relaxed">
              <code>{sqlSchemaCode}</code>
            </pre>
          </div>
        )}

        {activeTab === 'rls' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded-t-lg -mb-4">
              <span className="text-gray-400 font-mono text-xs">row_level_security.sql</span>
              <button
                onClick={() => handleCopy(rlsCode)}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer py-1 px-2 hover:bg-white/5 rounded"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-b-lg overflow-x-auto border border-slate-900 max-h-[450px] leading-relaxed">
              <code>{rlsCode}</code>
            </pre>
          </div>
        )}

        {activeTab === 'triggers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded-t-lg -mb-4">
              <span className="text-gray-400 font-mono text-xs">automation_triggers.sql</span>
              <button
                onClick={() => handleCopy(triggersCode)}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-xs cursor-pointer py-1 px-2 hover:bg-white/5 rounded"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-b-lg overflow-x-auto border border-slate-900 max-h-[450px] leading-relaxed">
              <code>{triggersCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
