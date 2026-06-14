import React, { useState } from 'react';
import { Residencia } from '../types';
import { upsertResidencia, deleteResidencia } from '../dataService';
import { isConfigured } from '../supabaseClient';
import { Building2, Plus, Trash2, Tag, Save, X, PlusCircle, Layers, Edit2 } from 'lucide-react';

interface Props {
  residencias: Residencia[];
  onUpdateResidencias: (residencias: Residencia[]) => void;
}

export default function GestionCentros({ residencias, onUpdateResidencias }: Props) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [secciones, setSecciones] = useState<string[]>(['Planta 1', 'Planta 2', 'Menjador']);
  const [nuevaSeccion, setNuevaSeccion] = useState('');

  // Editing state for sections
  const [editingResId, setEditingResId] = useState<string | null>(null);
  const [editingSecciones, setEditingSecciones] = useState<string[]>([]);
  const [editingNuevaSeccion, setEditingNuevaSeccion] = useState('');

  const handleAddSeccion = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaSeccion.trim() && !secciones.includes(nuevaSeccion.trim())) {
      setSecciones([...secciones, nuevaSeccion.trim()]);
      setNuevaSeccion('');
    }
  };

  const handleRemoveSeccion = (sec: string) => {
    setSecciones(secciones.filter(s => s !== sec));
  };

  const handleCreateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !direccion.trim() || !codigoPostal.trim() || !ciudad.trim()) return;

    // Generate a unique ID
    const newId = 'res-' + Math.random().toString(36).substring(2, 9);
    const newRes: Residencia = {
      id: newId,
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      codigoPostal: codigoPostal.trim(),
      ciudad: ciudad.trim(),
      secciones: secciones
    };

    const updatedResidencias = [...residencias, newRes];
    onUpdateResidencias(updatedResidencias);

    if (isConfigured) {
      await upsertResidencia(newRes);
    }

    // Reset Form
    setNombre('');
    setDireccion('');
    setCodigoPostal('');
    setCiudad('');
    setSecciones(['Planta 1', 'Planta 2', 'Menjador']);
  };

  const handleDeleteCenter = async (id: string) => {
    if (!window.confirm('Estàs segur que vols eliminar aquest centre? Aquesta acció esborrarà en cascada tots els productes i comandes de la base de dades.')) return;

    const updatedResidencias = residencias.filter(r => r.id !== id);
    onUpdateResidencias(updatedResidencias);

    if (isConfigured) {
      await deleteResidencia(id);
    }
  };

  // Sections Editor for existing centers
  const handleStartEditSecciones = (res: Residencia) => {
    setEditingResId(res.id);
    setEditingSecciones(res.secciones || []);
    setEditingNuevaSeccion('');
  };

  const handleAddEditSeccion = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNuevaSeccion.trim() && !editingSecciones.includes(editingNuevaSeccion.trim())) {
      setEditingSecciones([...editingSecciones, editingNuevaSeccion.trim()]);
      setEditingNuevaSeccion('');
    }
  };

  const handleRemoveEditSeccion = (sec: string) => {
    setEditingSecciones(editingSecciones.filter(s => s !== sec));
  };

  const handleSaveEditSecciones = async (res: Residencia) => {
    const updatedRes = { ...res, secciones: editingSecciones };
    const updatedList = residencias.map(r => r.id === res.id ? updatedRes : r);
    onUpdateResidencias(updatedList);

    if (isConfigured) {
      await upsertResidencia(updatedRes);
    }
    setEditingResId(null);
  };

  const handleCancelEdit = () => {
    setEditingResId(null);
    setEditingSecciones([]);
    setEditingNuevaSeccion('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Configuració de Centres (Residències)
        </h3>
        <p className="text-gray-500 text-xs mt-1">
          Afegeix, edita o elimina residències de la xarxa pública i configura les seves respectives seccions o plantes de destinació.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Create Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit space-y-4">
          <h4 className="font-bold text-slate-900 border-b border-gray-150 pb-2 text-sm">
            Registrar Nou Centre
          </h4>

          <form onSubmit={handleCreateCenter} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Nom del Centre *</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ex. Residència Pública El Pino"
                className="px-3 py-2 w-full bg-slate-50 border border-slate-300 rounded-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Adreça *</label>
              <input
                type="text"
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Carrer de la Pau, 14"
                className="px-3 py-2 w-full bg-slate-50 border border-slate-300 rounded-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Codi Postal *</label>
                <input
                  type="text"
                  required
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  placeholder="07001"
                  className="px-3 py-2 w-full bg-slate-50 border border-slate-300 rounded-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Ciutat *</label>
                <input
                  type="text"
                  required
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Palma"
                  className="px-3 py-2 w-full bg-slate-50 border border-slate-300 rounded-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sections / Floors editor inside creation form */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="font-bold text-slate-600 block">Seccions / Plantes del Centre</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaSeccion}
                  onChange={(e) => setNuevaSeccion(e.target.value)}
                  placeholder="Ex. Planta 3"
                  className="px-3 py-1.5 flex-1 bg-slate-50 border border-slate-300 rounded-sm outline-none focus:bg-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSeccion}
                  className="px-3 py-1.5 bg-slate-800 text-white font-bold rounded-sm hover:bg-slate-750 cursor-pointer flex items-center gap-1"
                >
                  Afegir
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2 max-h-[100px] overflow-y-auto border border-slate-100 p-2 bg-slate-50 rounded-sm">
                {secciones.map((sec) => (
                  <span key={sec} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-sm text-[10px] font-medium flex items-center gap-1">
                    {sec}
                    <button type="button" onClick={() => handleRemoveSeccion(sec)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-sm text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Registrar Centre
            </button>
          </form>
        </div>

        {/* Right Side: Grid of Centers */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">
            Centres Actius a la Xarxa ({residencias.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {residencias.map((res) => {
              const isEditingSec = editingResId === res.id;

              return (
                <div key={res.id} className="bg-white p-5 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        🏢 {res.nombre}
                      </h5>
                      <button
                        onClick={() => handleDeleteCenter(res.id)}
                        className="text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                        title="Eliminar centre"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">
                      📍 {res.direccion}, {res.codigoPostal} - {res.ciudad}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600 flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-blue-500" />
                        Seccions / Plantes
                      </span>
                      {!isEditingSec && (
                        <button
                          onClick={() => handleStartEditSecciones(res)}
                          className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Edit2 className="h-2.5 w-2.5" /> Editar
                        </button>
                      )}
                    </div>

                    {isEditingSec ? (
                      <div className="space-y-2 bg-slate-50 p-2.5 border border-slate-200 rounded-sm">
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={editingNuevaSeccion}
                            onChange={(e) => setEditingNuevaSeccion(e.target.value)}
                            placeholder="Ex. Cuina"
                            className="px-2 py-1 flex-1 bg-white border border-slate-300 rounded-sm text-[11px] outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddEditSeccion}
                            className="bg-slate-800 text-white px-2 py-1 rounded-sm text-[10px] hover:bg-slate-750 font-bold"
                          >
                            Afegir
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                          {editingSecciones.map((sec) => (
                            <span key={sec} className="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center">
                              {sec}
                              <button type="button" onClick={() => handleRemoveEditSeccion(sec)} className="text-red-500 font-bold ml-1">×</button>
                            </span>
                          ))}
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-200">
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-[10px] bg-slate-250 text-slate-600 hover:bg-slate-300 font-bold rounded-sm"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEditSecciones(res)}
                            className="px-2 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm flex items-center gap-1"
                          >
                            <Save className="h-3 w-3" /> Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(res.secciones || []).length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">Cap configurada</span>
                        ) : (
                          (res.secciones || []).map((sec) => (
                            <span key={sec} className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm text-[10px] font-medium">
                              {sec}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
