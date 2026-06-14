import { Residencia, Perfil, Producto, LimitePlanta, Pedido, EntradaStock, AjusteStock, UniformeEntrega, CampoVisibilidadConfig } from './types';

export const INITIAL_RESIDENCIAS: Residencia[] = [];

export const INITIAL_PERFILES: Perfil[] = [];

export const INITIAL_PRODUCTOS: Producto[] = [];

export const INITIAL_LIMITES_PLANTA: LimitePlanta[] = [];

export const INITIAL_PEDIDOS: Pedido[] = [];

export const INITIAL_AJUSTES: AjusteStock[] = [];

export const INITIAL_UNIFORMES: UniformeEntrega[] = [];

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
