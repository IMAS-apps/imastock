# IMAStock — Gestor de magatzem d'Atenció Sociosanitària

IMAStock es un sistema avanzado de gestión de inventarios y almacenes diseñado específicamente para la red de residencias públicas de personas mayores. La aplicación permite un control centralizado e independiente para cada centro (aislamiento Multi-Tenant) y un sistema robusto de permisos y visibilidad de datos basado en los roles de los usuarios.

---

## 🚀 Arquitectura y Tecnologías

El proyecto está construido utilizando tecnologías modernas de desarrollo web:

1. **Frontend**: React 19, TypeScript, y Vite para la compilación rápida y HMR.
2. **Estilos**: Tailwind CSS 4 para una interfaz de usuario limpia, reactiva y pulida.
3. **Iconografía**: Lucide React.
4. **Base de Datos y Autenticación**: Supabase (PostgreSQL en la nube).
5. **Persistencia Híbrida**: Lógica adaptativa que utiliza Supabase Cloud Database si está configurado, o almacenamiento local (`localStorage`) como respaldo (fallback) inmediato.

---

## 📦 Modelado de Datos y Base de Datos

El diseño relacional consta de las siguientes tablas principales:

* **`residencias`**: Entidad multi-tenant que representa a cada centro público (ej. *Bonanova*, *Llar dels Ancians*).
* **`perfiles`**: Información del usuario conectado (Nombre, Email, Rol) vinculado directamente a la tabla nativa de autenticación de Supabase (`auth.users`).
* **`productos`**: Catálogo general de inventario de cada residencia (nombre, familia, subfamilia, ubicación, existencias, stock mínimo/máximo, fechas de contrato de licitación, lote y expediente).
* **`limites_planta`**: Define la cuota de stock máximo mensual que cada planta/departamento puede solicitar por producto.
* **`pedidos`**: Registro de comandas de planta, su estado (Borrador, Bloqueada por exceso, Aprobada, Enviada, Cerrada) y cantidades de entrega.
* **`entradas_almacen`**: Historial de entradas de mercancía asociadas a números de albarán y enlaces a documentos de entrega (PDF/imágenes).
* **`entregas_uniformes`**: Módulo de asignación y entrega de ropa laboral a empleados con tallaje.
* **`ajustes_stock`**: Historial de auditoría interna que registra cada movimiento físico o ajuste manual que afecte al stock.
* **`configuraciones_listados`**: Tabla de control dinámico que permite configurar qué columnas de campos ve cada rol de usuario en sus respectivos listados.

---

## 🔒 Control de Roles y Flujo de Trabajo

La visibilidad y las acciones operativas cambian según el rol asignado al perfil del usuario:

1. **Administrador**: 
   * Acceso ilimitado a todas las residencias y funciones del sistema.
   * Capacidad de autorizar pedidos bloqueados por exceso de cupo.
   * Acceso exclusivo a la pestaña de **Gestión de Usuarios** para editar roles y permisos.
   * Capacidad de ocultar o mostrar columnas de datos para los demás roles en la pestaña de configuración.
2. **Administrativo**:
   * Puede ingresar mercancía (albaranes) y gestionar stock general de los centros autorizados.
   * Puede ver logs de auditoría y realizar pedidos.
3. **Personal de Almacén**:
   * Controla el inventario físico diario.
   * Puede registrar entradas rápidas e ingresos de uniformes.
   * Al registrar un nuevo producto, este queda en estado *Pendiente de aprobación* (invisible para las plantas) hasta que un directivo lo valide.
4. **Coordinador de Planta**:
   * Vista limitada al stock simplificado de su departamento.
   * Realiza comisiones y pedidos de planta (con validación automática contra los límites de unidades establecidos).
   * Confirma la recepción física y cierra los pedidos de su planta.

---

## 🛠️ Configuración y Puesta en Marcha Local

### Prerrequisitos
* Node.js (v18 o superior)
* Una cuenta en Supabase

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Configurar las variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example`:
```env
# URL de tu proyecto de Supabase
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"

# Anon key (clave pública) de tu proyecto de Supabase
VITE_SUPABASE_ANON_KEY="tu-anon-key"
```

### Paso 3: Inicializar la Base de Datos
1. Ve al panel de **Supabase** -> **SQL Editor** -> **New Query**.
2. Copia y ejecuta las sentencias de inicialización de tablas y datos semilla ubicadas en:
   👉 **`supabase_schema.sql`**
3. Crea y ejecuta las modificaciones de autenticación y triggers nativos de usuarios ubicados en:
   👉 **`supabase_auth_migration.sql`**

### Paso 4: Levantar el servidor de desarrollo
```bash
npm run dev
```
La aplicación se iniciará localmente (habitualmente en `http://localhost:3000` o `http://localhost:3002` si el puerto está ocupado).

---

## 💡 Flujo de Autenticación de Producción
Al iniciar la aplicación por primera vez:
1. Registra tu cuenta en la pantalla de registro (`Sign Up`).
2. El sistema utiliza un trigger PostgreSQL automatizado para dar de alta tu perfil. **El primer usuario registrado adquiere automáticamente el rol de `Administrador`**.
3. Las siguientes cuentas se registran con el rol básico de `Coordinador de planta` y su acceso debe ser configurado y autorizado por el Administrador inicial desde la pestaña **"Gestió d'Usuaris"**.
