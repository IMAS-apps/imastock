import { Residencia, Perfil, Producto, LimitePlanta, Pedido, EntradaStock, AjusteStock, UniformeEntrega, CampoVisibilidadConfig } from './types';

export const INITIAL_RESIDENCIAS: Residencia[] = [
  { id: 'res-1', nombre: 'Residència Pública El Pino (Barcelona)', direccion: 'Carrer Gran de Gràcia, 120', codigoPostal: '08012', ciudad: 'Barcelona' },
  { id: 'res-2', nombre: 'Centre Geriàtric Santa Maria (Girona)', direccion: 'Avinguda de Jaume I, 45', codigoPostal: '17001', ciudad: 'Girona' },
  { id: 'res-3', nombre: 'Llar d\'Avis Nou Llar (Tarragona)', direccion: 'Rambla Nova, 78', codigoPostal: '43003', ciudad: 'Tarragona' }
];

export const INITIAL_PERFILES: Perfil[] = [
  { id: 'perf-1', email: 'admin@imastock.org', nombre: 'Tomàs Català (Admin)', rol: 'Administrador', residenciaIds: ['res-1', 'res-2', 'res-3'] },
  { id: 'perf-2', email: 'adminis@imastock.org', nombre: 'Marta Soler (Administrativa)', rol: 'Administrativo', residenciaIds: ['res-1', 'res-2'] },
  { id: 'perf-3', email: 'almacen@imastock.org', nombre: 'Joan Pujol (Almacenero)', rol: 'Personal de almacén', residenciaIds: ['res-1'] },
  { id: 'perf-4', email: 'planta1@imastock.org', nombre: 'Clara Sànchez (Coord. Planta 1)', rol: 'Coordinador de planta', residenciaIds: ['res-1'], plantaAsignada: 'Planta 1' },
  { id: 'perf-5', email: 'comedor@imastock.org', nombre: 'Ferran Ruiz (Coord. Menjador)', rol: 'Coordinador de planta', residenciaIds: ['res-1'], plantaAsignada: 'Comedor Central' }
];

export const INITIAL_PRODUCTOS: Producto[] = [
  // Residencia 1
  {
    id: 'prod-r1-1',
    residenciaId: 'res-1',
    nom: 'Bolquer anatòmic Nit Talla G',
    familia: 'Higiene i Sanitari',
    subfamilia: 'Incontinència',
    ubicacion: 'Passadís A - Estanteria 2',
    estocActual: 120,
    estocMinim: 150, // ROJO < 150
    estocMaxim: 500,
    caducidad: '2028-12-31',
    consumMensual: 450,
    lot: 'L-ABS9982',
    expedient: 'EXP-2025-SAN01',
    dataIniciContracte: '2025-01-01',
    dataFinalContracte: '2027-12-31',
    observacions: 'Enviament prioritari. Subministrat per ABS S.A.',
    aprobado: true
  },
  {
    id: 'prod-r1-2',
    residenciaId: 'res-1',
    nom: 'Suplement Nutricional Vainilla 200ml',
    familia: 'Dietètica i Nutrició',
    subfamilia: 'Suplements',
    ubicacion: 'Nevera Almacén B',
    estocActual: 180,
    estocMinim: 160, // AMARILLO (actual <= 160 * 1.15 = 184)
    estocMaxim: 400,
    caducidad: '2026-10-15',
    consumMensual: 300,
    lot: 'L-NEST-231',
    expedient: 'EXP-2025-NUT04',
    dataIniciContracte: '2025-03-15',
    dataFinalContracte: '2026-03-15',
    observacions: 'Conservar entre 2 y 8 grados Celsius.',
    aprobado: true
  },
  {
    id: 'prod-r1-3',
    residenciaId: 'res-1',
    nom: 'Esponja sabonosa d\'un sol ús (Pack 24)',
    familia: 'Higiene i Sanitari',
    subfamilia: 'Banys',
    ubicacion: 'Passadís B - Estanteria 1',
    estocActual: 340,
    estocMinim: 100, // GREEN (> 115)
    estocMaxim: 800,
    caducidad: '',
    consumMensual: 600,
    lot: 'L-ESP8763',
    expedient: 'EXP-2025-SAN01',
    dataIniciContracte: '2025-01-01',
    dataFinalContracte: '2027-12-31',
    observacions: 'Ús diari per a llit i dutxa.',
    aprobado: true
  },
  {
    id: 'prod-r1-4',
    residenciaId: 'res-1',
    nom: 'Mascareta Quirúrgica Alta Protecció',
    familia: 'Higiene i Sanitari',
    subfamilia: 'Protecció',
    ubicacion: 'Armari Entrada Almacén',
    estocActual: 1050,
    estocMinim: 1000, // AMARILLO (< 1150)
    estocMaxim: 5000,
    caducidad: '2027-05-20',
    consumMensual: 2000,
    lot: 'L-MQ-009',
    expedient: 'EXP-19-MED-03',
    dataIniciContracte: '2024-06-01',
    dataFinalContracte: '2026-06-01',
    observacions: 'Obligatoria en episodis respiratoris aguts.',
    aprobado: true
  },
  {
    id: 'prod-r1-5',
    residenciaId: 'res-1',
    nom: 'Casaca Sanitària Gris IMA',
    familia: 'Lenceria i Uniformitat',
    subfamilia: 'Uniformitat',
    ubicacion: 'Zona Textil - Prestatge 4',
    estocActual: 45,
    estocMinim: 20,
    estocMaxim: 100,
    caducidad: '',
    consumMensual: 10,
    lot: '',
    expedient: 'EXP-UNI-2025',
    dataIniciContracte: '2025-01-01',
    dataFinalContracte: '2028-01-01',
    observacions: 'Teixit resistent a clor i autolavats.',
    aprobado: true,
    esUniforme: true
  },
  {
    id: 'prod-r1-6',
    residenciaId: 'res-1',
    nom: 'Pantaló Sanitari Blanc Unisex',
    familia: 'Lenceria i Uniformitat',
    subfamilia: 'Uniformitat',
    ubicacion: 'Zona Textil - Prestatge 5',
    estocActual: 62,
    estocMinim: 30,
    estocMaxim: 120,
    caducidad: '',
    consumMensual: 12,
    lot: '',
    expedient: 'EXP-UNI-2025',
    dataIniciContracte: '2025-01-01',
    dataFinalContracte: '2028-01-01',
    observacions: 'Cintura elàstica de fàcil ajust.',
    aprobado: true,
    esUniforme: true
  },
  {
    id: 'prod-r1-7',
    residenciaId: 'res-1',
    nom: 'Crema Hidratant Urea 10% 500ml',
    familia: 'Higiene i Sanitari',
    subfamilia: 'Cures',
    ubicacion: 'Passadís A - Estanteria 5',
    estocActual: 15,
    estocMinim: 50, // ROJO
    estocMaxim: 200,
    caducidad: '2026-11-30',
    consumMensual: 100,
    lot: 'L-CH110',
    expedient: 'EXP-2025-SAN01',
    dataIniciContracte: '2025-01-01',
    dataFinalContracte: '2027-12-31',
    observacions: 'Especial per a pells seques i senils.',
    aprobado: false // Pendiente de aprobación
  },

  // Residencia 2
  {
    id: 'prod-r2-1',
    residenciaId: 'res-2',
    nom: 'Espessidor de líquids Sabor Neutre 250g',
    familia: 'Dietètica i Nutrició',
    subfamilia: 'Disfàgia',
    ubicacion: 'Prestatgeria Dieta 1',
    estocActual: 90,
    estocMinim: 30,
    estocMaxim: 200,
    caducidad: '2027-02-18',
    consumMensual: 60,
    lot: 'L-ESP-998',
    expedient: 'EXP-EXP-GE-25-03',
    dataIniciContracte: '2025-04-01',
    dataFinalContracte: '2027-04-01',
    observacions: 'Vital per a pacients amb disfàgia.',
    aprobado: true
  },
  {
    id: 'prod-r2-2',
    residenciaId: 'res-2',
    nom: 'Bata d\'Aïllament d\'un sol ús',
    familia: 'Higiene i Sanitari',
    subfamilia: 'Protecció',
    ubicacion: 'Dipòsit de Seguretat',
    estocActual: 400,
    estocMinim: 500, // ROJO
    estocMaxim: 1500,
    caducidad: '',
    consumMensual: 1200,
    lot: 'L-BAT-3323',
    expedient: 'EXP-COVID-24',
    dataIniciContracte: '2024-01-01',
    dataFinalContracte: '2026-06-30',
    observacions: 'Impermeables i transpirables.',
    aprobado: true
  }
];

export const INITIAL_LIMITES_PLANTA: LimitePlanta[] = [
  // Planta 1 limits
  { id: 'lim-1', residenciaId: 'res-1', productoId: 'prod-r1-1', plantaId: 'Planta 1', maximoUnidades: 30 }, // Bolquer Noche
  { id: 'lim-2', residenciaId: 'res-1', productoId: 'prod-r1-2', plantaId: 'Planta 1', maximoUnidades: 20 }, // Suplemento vainilla
  { id: 'lim-3', residenciaId: 'res-1', productoId: 'prod-r1-3', plantaId: 'Planta 1', maximoUnidades: 50 }, // Esponjas sabonosas
  
  // Comedor limits
  { id: 'lim-4', residenciaId: 'res-1', productoId: 'prod-r1-2', plantaId: 'Comedor Central', maximoUnidades: 15 }, // Suplemento vainilla
  { id: 'lim-5', residenciaId: 'res-1', productoId: 'prod-r1-3', plantaId: 'Comedor Central', maximoUnidades: 5 } // Esponjas sabonosas
];

export const INITIAL_PEDIDOS: Pedido[] = [
  {
    id: 'ped-1',
    residenciaId: 'res-1',
    planta: 'Planta 1',
    productoId: 'prod-r1-1',
    unidadesMaximas: 30,
    unidadesSolicitadas: 24,
    unidadesEntregadas: 0,
    estado: 'Borrador',
    checkVerificacion: false,
    observaciones: 'Consum habitual per a canvis de nit.',
    creadoPor: 'planta1@imastock.org',
    creadoPorNombre: 'Clara Sànchez',
    fecha: '2026-06-13T18:30:00Z'
  },
  {
    id: 'ped-2',
    residenciaId: 'res-1',
    planta: 'Planta 1',
    productoId: 'prod-r1-2',
    unidadesMaximas: 20,
    unidadesSolicitadas: 40, // EXCESO! > 20
    unidadesEntregadas: 0,
    estado: 'Bloqueada por exceso',
    checkVerificacion: false,
    observaciones: 'Campanya especial reforç d\'estiu.',
    creadoPor: 'planta1@imastock.org',
    creadoPorNombre: 'Clara Sànchez',
    fecha: '2026-06-14T08:00:00Z'
  },
  {
    id: 'ped-3',
    residenciaId: 'res-1',
    planta: 'Comedor Central',
    productoId: 'prod-r1-3',
    unidadesMaximas: 5,
    unidadesSolicitadas: 5,
    unidadesEntregadas: 5,
    estado: 'Enviada',
    checkVerificacion: false,
    observaciones: 'Neteja ràpida post-servei.',
    creadoPor: 'comedor@imastock.org',
    creadoPorNombre: 'Ferran Ruiz',
    fecha: '2026-06-13T10:00:00Z'
  },
  {
    id: 'ped-4',
    residenciaId: 'res-1',
    planta: 'Planta 1',
    productoId: 'prod-r1-3',
    unidadesMaximas: 50,
    unidadesSolicitadas: 45,
    unidadesEntregadas: 40, // Enviado parcialmente
    estado: 'Recibida / Cerrada',
    checkVerificacion: true,
    observaciones: 'Ens feien falta ràpidament.',
    creadoPor: 'planta1@imastock.org',
    creadoPorNombre: 'Clara Sànchez',
    fecha: '2026-06-12T14:20:00Z'
  }
];

export const INITIAL_AJUSTES: AjusteStock[] = [
  {
    id: 'aj-1',
    residenciaId: 'res-1',
    productoId: 'prod-r1-1',
    productoNom: 'Bolquer anatòmic Nit Talla G',
    estocAnterior: 154,
    estocNou: 120,
    motiu: 'Desquadre oposat durant el recompte físic semestral. S\'han fet malbé 34 unitats per humitat.',
    data: '2026-06-10T11:00:00Z',
    usuari: 'Joan Pujol (Almacen)'
  }
];

export const INITIAL_UNIFORMES: UniformeEntrega[] = [
  {
    id: 'u-1',
    residenciaId: 'res-1',
    empleatNom: 'Serrat Garcia, Montserrat',
    productoId: 'prod-r1-5', // Casaca Gris
    cantidad: 2,
    talla: 'M',
    data: '2026-06-12T09:45:00Z',
    usuari: 'Joan Pujol (Almacen)'
  },
  {
    id: 'u-2',
    residenciaId: 'res-1',
    empleatNom: 'Fontanals Solé, Albert',
    productoId: 'prod-r1-6', // Pantalon Blanco
    cantidad: 1,
    talla: 'XL',
    data: '2026-06-13T16:15:00Z',
    usuari: 'Joan Pujol (Almacen)'
  }
];

export const INITIAL_VISIBILIDAD_ROLE: Record<string, CampoVisibilidadConfig> = {
  'Administrador': {
    id: true, nom: true, familia: true, subfamilia: true, ubicacion: true, estocActual: true,
    estocMinim: true, estocMaxim: true, caducidad: true, consumMensual: true, lot: true,
    expedient: true, dataIniciContracte: true, dataFinalContracte: true, observacions: true
  },
  'Administrativo': {
    id: false, nom: true, familia: true, subfamilia: true, ubicacion: true, estocActual: true,
    estocMinim: true, estocMaxim: true, caducidad: true, consumMensual: true, lot: true,
    expedient: true, dataIniciContracte: true, dataFinalContracte: true, observacions: true
  },
  'Personal de almacén': {
    id: false, nom: true, familia: true, subfamilia: true, ubicacion: true, estocActual: true,
    estocMinim: true, estocMaxim: true, caducidad: true, consumMensual: false, lot: true,
    expedient: false, dataIniciContracte: false, dataFinalContracte: false, observacions: true
  },
  'Coordinador de planta': {
    id: false, nom: true, familia: true, subfamilia: true, ubicacion: false, estocActual: false,
    estocMinim: false, estocMaxim: false, caducidad: false, consumMensual: false, lot: false,
    expedient: false, dataIniciContracte: false, dataFinalContracte: false, observacions: true
  }
};

// LocalStorage Helper to maintain state during interactions
export function getLocalState<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(`imastock_${key}`);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('Error reading localStorage for', key, error);
    return defaultValue;
  }
}

export function saveLocalState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`imastock_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing localStorage for', key, error);
  }
}
