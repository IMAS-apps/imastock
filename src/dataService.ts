import { supabase, isConfigured } from './supabaseClient';
import { 
  Residencia, 
  Producto, 
  LimitePlanta, 
  Pedido, 
  EntradaStock, 
  AjusteStock, 
  UniformeEntrega, 
  CampoVisibilidadConfig 
} from './types';
import { 
  INITIAL_RESIDENCIAS, 
  INITIAL_PRODUCTOS, 
  INITIAL_LIMITES_PLANTA, 
  INITIAL_PEDIDOS, 
  INITIAL_AJUSTES, 
  INITIAL_UNIFORMES, 
  INITIAL_VISIBILIDAD_ROLE,
  getLocalState,
  saveLocalState
} from './mockData';

// --- Helper: Mappers between DB (snake_case) and App (camelCase) ---

function mapProductoFromDB(p: any): Producto {
  return {
    id: p.id,
    residenciaId: p.residencia_id,
    nom: p.nom,
    familia: p.familia,
    subfamilia: p.subfamilia,
    ubicacion: p.ubicacion || '',
    estocActual: p.estoc_actual,
    estocMinim: p.estoc_minim,
    estocMaxim: p.estoc_maxim,
    caducidad: p.caducidad || '',
    consumMensual: p.consum_mensual,
    lot: p.lot || '',
    expedient: p.expedient || '',
    dataIniciContracte: p.data_inici_contracte || '',
    dataFinalContracte: p.data_final_contracte || '',
    observacions: p.observacions || '',
    aprobado: p.aprobado,
    esUniforme: p.es_uniforme
  };
}

function mapProductoToDB(p: Producto) {
  return {
    id: p.id,
    residencia_id: p.residenciaId,
    nom: p.nom,
    familia: p.familia,
    subfamilia: p.subfamilia,
    ubicacion: p.ubicacion || null,
    estoc_actual: p.estocActual,
    estoc_minim: p.estocMinim,
    estoc_maxim: p.estocMaxim,
    caducidad: p.caducidad || null,
    consum_mensual: p.consumMensual,
    lot: p.lot || null,
    expedient: p.expedient || null,
    data_inici_contracte: p.dataIniciContracte || null,
    data_final_contracte: p.dataFinalContracte || null,
    observacions: p.observacions || null,
    aprobado: p.aprobado,
    es_uniforme: !!p.esUniforme
  };
}

function mapPedidoFromDB(p: any): Pedido {
  return {
    id: p.id,
    residenciaId: p.residencia_id,
    planta: p.planta,
    productoId: p.producto_id,
    unidadesMaximas: p.unidades_maximas,
    unidadesSolicitadas: p.unidades_solicitadas,
    unidadesEntregadas: p.unidades_entregadas,
    estado: p.estado,
    checkVerificacion: p.check_verificacion,
    observaciones: p.observaciones || '',
    creadoPor: p.creado_por,
    creadoPorNombre: p.creado_por_nombre,
    fecha: p.fecha
  };
}

function mapPedidoToDB(p: Pedido) {
  return {
    id: p.id,
    residencia_id: p.residenciaId,
    planta: p.planta,
    producto_id: p.productoId,
    unidades_maximas: p.unidadesMaximas,
    unidades_solicitadas: p.unidadesSolicitadas,
    unidades_entregadas: p.unidadesEntregadas,
    estado: p.estado,
    check_verificacion: p.checkVerificacion,
    observaciones: p.observaciones || null,
    creado_por: p.creadoPor,
    creado_por_nombre: p.creadoPorNombre,
    fecha: p.fecha
  };
}

function mapLimitePlantaFromDB(l: any): LimitePlanta {
  return {
    id: l.id,
    residenciaId: l.residencia_id,
    productoId: l.producto_id,
    plantaId: l.planta_id,
    maximoUnidades: l.maximo_unidades
  };
}

function mapLimitePlantaToDB(l: LimitePlanta) {
  return {
    id: l.id,
    residencia_id: l.residenciaId,
    producto_id: l.productoId,
    planta_id: l.plantaId,
    maximo_unidades: l.maximoUnidades
  };
}

function mapEntradaFromDB(e: any): EntradaStock {
  return {
    id: e.id,
    residenciaId: e.residencia_id,
    nAlbaran: e.n_albaran,
    proveedor: e.proveedor,
    fecha: e.fecha,
    urlDocumento: e.url_documento || '',
    productoId: e.producto_id,
    cantidad: e.cantidad
  };
}

function mapEntradaToDB(e: EntradaStock) {
  return {
    id: e.id,
    residencia_id: e.residenciaId,
    n_albaran: e.nAlbaran,
    proveedor: e.proveedor,
    fecha: e.fecha,
    url_documento: e.urlDocumento || null,
    producto_id: e.productoId,
    cantidad: e.cantidad
  };
}

function mapAjusteFromDB(a: any): AjusteStock {
  return {
    id: a.id,
    residenciaId: a.residencia_id,
    productoId: a.producto_id,
    productoNom: a.producto_nom,
    estocAnterior: a.estoc_anterior,
    estocNou: a.estoc_nou,
    motiu: a.motiu,
    data: a.data,
    usuari: a.usuari
  };
}

function mapAjusteToDB(a: AjusteStock) {
  return {
    id: a.id,
    residencia_id: a.residenciaId,
    producto_id: a.productoId,
    producto_nom: a.productoNom,
    estoc_anterior: a.estocAnterior,
    estoc_nou: a.estocNou,
    motiu: a.motiu,
    data: a.data,
    usuari: a.usuari
  };
}

function mapUniformeFromDB(u: any): UniformeEntrega {
  return {
    id: u.id,
    residenciaId: u.residencia_id,
    empleatNom: u.empleat_nom,
    productoId: u.producto_id,
    cantidad: u.cantidad,
    talla: u.talla,
    data: u.data,
    usuari: u.usuari
  };
}

function mapUniformeToDB(u: UniformeEntrega) {
  return {
    id: u.id,
    residencia_id: u.residenciaId,
    empleat_nom: u.empleatNom,
    producto_id: u.productoId,
    cantidad: u.cantidad,
    talla: u.talla,
    data: u.data,
    usuari: u.usuari
  };
}

function mapVisibilidadFromDB(vc: any): CampoVisibilidadConfig {
  return {
    id: vc.id_visible,
    nom: vc.nom_visible,
    familia: vc.familia_visible,
    subfamilia: vc.subfamilia_visible,
    ubicacion: vc.ubicacion_visible,
    estocActual: vc.estoc_actual_visible,
    estocMinim: vc.estoc_minim_visible,
    estocMaxim: vc.estoc_maxim_visible,
    caducidad: vc.caducidad_visible,
    consumMensual: vc.consum_mensual_visible,
    lot: vc.lot_visible,
    expedient: vc.expedient_visible,
    dataIniciContracte: vc.data_inici_contracte_visible,
    dataFinalContracte: vc.data_final_contracte_visible,
    observacions: vc.observacions_visible
  };
}

function mapVisibilidadToDB(rol: string, vc: CampoVisibilidadConfig) {
  return {
    rol,
    id_visible: vc.id,
    nom_visible: vc.nom,
    familia_visible: vc.familia,
    subfamilia_visible: vc.subfamilia,
    ubicacion_visible: vc.ubicacion,
    estoc_actual_visible: vc.estocActual,
    estoc_minim_visible: vc.estocMinim,
    estoc_maxim_visible: vc.estocMaxim,
    caducidad_visible: vc.caducidad,
    consum_mensual_visible: vc.consumMensual,
    lot_visible: vc.lot,
    expedient_visible: vc.expedient,
    data_inici_contracte_visible: vc.dataIniciContracte,
    data_final_contracte_visible: vc.dataFinalContracte,
    observacions_visible: vc.observacions
  };
}

// --- Data Fetching Operations ---

export async function getResidencias(): Promise<Residencia[]> {
  if (!isConfigured) return getLocalState('residencias', INITIAL_RESIDENCIAS);
  const { data, error } = await supabase.from('residencias').select('*');
  if (error) {
    console.error('Error fetching residencias:', error);
    return getLocalState('residencias', INITIAL_RESIDENCIAS);
  }
  return data.map((r: any) => ({
    id: r.id,
    nombre: r.nombre,
    direccion: r.direccion,
    codigoPostal: r.codigo_postal,
    ciudad: r.ciudad
  }));
}

export async function getProductos(): Promise<Producto[]> {
  if (!isConfigured) return getLocalState('productos', INITIAL_PRODUCTOS);
  const { data, error } = await supabase.from('productos').select('*');
  if (error) {
    console.error('Error fetching productos:', error);
    return getLocalState('productos', INITIAL_PRODUCTOS);
  }
  return data.map(mapProductoFromDB);
}

export async function getLimitesPlanta(): Promise<LimitePlanta[]> {
  if (!isConfigured) return getLocalState('limites_planta', INITIAL_LIMITES_PLANTA);
  const { data, error } = await supabase.from('limites_planta').select('*');
  if (error) {
    console.error('Error fetching limites_planta:', error);
    return getLocalState('limites_planta', INITIAL_LIMITES_PLANTA);
  }
  return data.map(mapLimitePlantaFromDB);
}

export async function getPedidos(): Promise<Pedido[]> {
  if (!isConfigured) return getLocalState('pedidos', INITIAL_PEDIDOS);
  const { data, error } = await supabase.from('pedidos').select('*');
  if (error) {
    console.error('Error fetching pedidos:', error);
    return getLocalState('pedidos', INITIAL_PEDIDOS);
  }
  return data.map(mapPedidoFromDB);
}

export async function getEntradas(): Promise<EntradaStock[]> {
  if (!isConfigured) return getLocalState('entradas', []);
  const { data, error } = await supabase.from('entradas_stock').select('*');
  if (error) {
    console.error('Error fetching entradas_stock:', error);
    return getLocalState('entradas', []);
  }
  return data.map(mapEntradaFromDB);
}

export async function getAjustes(): Promise<AjusteStock[]> {
  if (!isConfigured) return getLocalState('ajustes', INITIAL_AJUSTES);
  const { data, error } = await supabase.from('ajustes_stock').select('*');
  if (error) {
    console.error('Error fetching ajustes_stock:', error);
    return getLocalState('ajustes', INITIAL_AJUSTES);
  }
  return data.map(mapAjusteFromDB);
}

export async function getEntregaUniformes(): Promise<UniformeEntrega[]> {
  if (!isConfigured) return getLocalState('entrega_uniformes', INITIAL_UNIFORMES);
  const { data, error } = await supabase.from('uniforme_entregas').select('*');
  if (error) {
    console.error('Error fetching uniforme_entregas:', error);
    return getLocalState('entrega_uniformes', INITIAL_UNIFORMES);
  }
  return data.map(mapUniformeFromDB);
}

export async function getVisibilidadConfig(): Promise<Record<string, CampoVisibilidadConfig>> {
  if (!isConfigured) return getLocalState('visibilidad_config', INITIAL_VISIBILIDAD_ROLE);
  const { data, error } = await supabase.from('visibilidad_config').select('*');
  if (error) {
    console.error('Error fetching visibilidad_config:', error);
    return getLocalState('visibilidad_config', INITIAL_VISIBILIDAD_ROLE);
  }
  const configMap: Record<string, CampoVisibilidadConfig> = {};
  data.forEach((row: any) => {
    configMap[row.rol] = mapVisibilidadFromDB(row);
  });
  return configMap;
}

// --- Data Mutation Operations ---

export async function upsertProducto(p: Producto): Promise<void> {
  if (!isConfigured) return;
  const dbData = mapProductoToDB(p);
  const { error } = await supabase.from('productos').upsert(dbData);
  if (error) console.error('Error upserting producto:', error);
}

export async function upsertProductos(pList: Producto[]): Promise<void> {
  if (!isConfigured) return;
  const dbDataList = pList.map(mapProductoToDB);
  const { error } = await supabase.from('productos').upsert(dbDataList);
  if (error) console.error('Error bulk upserting productos:', error);
}

export async function upsertPedido(p: Pedido): Promise<void> {
  if (!isConfigured) return;
  const dbData = mapPedidoToDB(p);
  const { error } = await supabase.from('pedidos').upsert(dbData);
  if (error) console.error('Error upserting pedido:', error);
}

export async function upsertPedidos(pList: Pedido[]): Promise<void> {
  if (!isConfigured) return;
  const dbDataList = pList.map(mapPedidoToDB);
  const { error } = await supabase.from('pedidos').upsert(dbDataList);
  if (error) console.error('Error bulk upserting pedidos:', error);
}

export async function insertEntrada(e: EntradaStock): Promise<void> {
  if (!isConfigured) return;
  const dbData = mapEntradaToDB(e);
  const { error } = await supabase.from('entradas_stock').insert(dbData);
  if (error) console.error('Error inserting entrada:', error);
}

export async function insertAjuste(a: AjusteStock): Promise<void> {
  if (!isConfigured) return;
  const dbData = mapAjusteToDB(a);
  const { error } = await supabase.from('ajustes_stock').insert(dbData);
  if (error) console.error('Error inserting ajuste:', error);
}

export async function insertEntregaUniforme(u: UniformeEntrega): Promise<void> {
  if (!isConfigured) return;
  const dbData = mapUniformeToDB(u);
  const { error } = await supabase.from('uniforme_entregas').insert(dbData);
  if (error) console.error('Error inserting uniforme_entrega:', error);
}

export async function upsertVisibilidadConfig(role: string, config: CampoVisibilidadConfig): Promise<void> {
  if (!isConfigured) return;
  const dbData = mapVisibilidadToDB(role, config);
  const { error } = await supabase.from('visibilidad_config').upsert(dbData);
  if (error) console.error('Error upserting visibilidad_config:', error);
}
