export type Rol = 'Administrador' | 'Administrativo' | 'Personal de almacén' | 'Coordinador de planta';

export interface Residencia {
  id: string;
  nombre: string;
  direccion: string;
  codigoPostal: string;
  ciudad: string;
  secciones?: string[];
}

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  residenciaIds: string[]; // Residencias asociadas
  plantaAsignada?: string; // Solo útil para Coordinadores
}

export interface Producto {
  id: string;
  residenciaId: string;
  nom: string;
  familia: string;
  subfamilia: string;
  ubicacion: string;
  estocActual: number;
  estocMinim: number;
  estocMaxim: number;
  caducidad?: string; // ISO date or empty
  consumMensual: number;
  lot?: string;
  expedient?: string;
  dataIniciContracte?: string;
  dataFinalContracte?: string;
  observacions?: string;
  aprobado: boolean; // Pendiente de aprobación flow
  esUniforme?: boolean; // Indica si es una prenda de uniforme
}

// Relación N:M de Unidades Máximas por Producto y Planta/Departamento
export interface LimitePlanta {
  id: string;
  residenciaId: string;
  productoId: string;
  plantaId: string; // Ej: "Planta 1", "Planta 2", "Comedor", "Cafetería"
  maximoUnidades: number;
}

export type PedidoEstado = 
  | 'Borrador' 
  | 'Bloqueada por exceso' 
  | 'Aprobada / Lista para preparar' 
  | 'Enviada' // El almacenero descuenta el stock al enviar
  | 'Recibida / Cerrada';

export interface Pedido {
  id: string;
  residenciaId: string;
  planta: string; // Ej: Planta 1, Comedor, etc.
  productoId: string;
  unidadesMaximas: number; // Obtenida de LimitePlanta o por defecto
  unidadesSolicitadas: number;
  unidadesEntregadas: number; // Editable por almacenero
  estado: PedidoEstado;
  checkVerificacion: boolean; // Marcado por coordinador al recibir
  observaciones: string;
  creadoPor: string;
  creadoPorNombre: string;
  fecha: string;
}

export interface EntradaStock {
  id: string;
  residenciaId: string;
  nAlbaran: string;
  proveedor: string;
  fecha: string;
  urlDocumento: string; // URL o referencia de PDF
  productoId: string;
  cantidad: number;
}

export interface AjusteStock {
  id: string;
  residenciaId: string;
  productoId: string;
  productoNom: string;
  estocAnterior: number;
  estocNou: number;
  motiu: string;
  data: string;
  usuari: string;
}

export interface UniformeEntrega {
  id: string;
  residenciaId: string;
  empleatNom: string;
  productoId: string;
  cantidad: number;
  talla: string;
  data: string;
  usuari: string;
}

// Configuración de campos visibles en lists según rol (Configurable por Admin)
export interface CampoVisibilidadConfig {
  id: boolean;
  nom: boolean;
  familia: boolean;
  subfamilia: boolean;
  ubicacion: boolean;
  estocActual: boolean;
  estocMinim: boolean;
  estocMaxim: boolean;
  caducidad: boolean;
  consumMensual: boolean;
  lot: boolean;
  expedient: boolean;
  dataIniciContracte: boolean;
  dataFinalContracte: boolean;
  observacions: boolean;
}
