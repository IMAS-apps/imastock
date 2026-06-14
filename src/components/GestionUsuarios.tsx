import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Perfil, Residencia, Rol } from '../types';
import { Users, Shield, Save, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  residencias: Residencia[];
}

export default function GestionUsuarios({ residencias }: Props) {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editRol, setEditRol] = useState<Rol>('Coordinador de planta');
  const [editResidenciaIds, setEditResidenciaIds] = useState<string[]>([]);
  const [editPlantaAsignada, setEditPlantaAsignada] = useState('');

  async function loadPerfiles() {
    setLoading(true);
    setError('');
    try {
      const { data, error: dbError } = await supabase
        .from('perfiles')
        .select('*')
        .order('nombre');

      if (dbError) throw dbError;

      // Map snake_case to camelCase
      const mapped: Perfil[] = (data || []).map((row: any) => ({
        id: row.id,
        email: row.email,
        nombre: row.nombre,
        rol: row.rol as Rol,
        residenciaIds: row.residencia_ids || [],
        plantaAsignada: row.planta_asignada || ''
      }));

      setPerfiles(mapped);
    } catch (err: any) {
      setError('Error al cargar perfiles: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPerfiles();
  }, []);

  const handleStartEdit = (profile: Perfil) => {
    setEditingProfileId(profile.id);
    setEditRol(profile.rol);
    setEditResidenciaIds(profile.residenciaIds);
    setEditPlantaAsignada(profile.plantaAsignada || '');
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
  };

  const handleToggleResidencia = (resId: string) => {
    if (editResidenciaIds.includes(resId)) {
      setEditResidenciaIds(editResidenciaIds.filter(id => id !== resId));
    } else {
      setEditResidenciaIds([...editResidenciaIds, resId]);
    }
  };

  const handleSaveProfile = async (profileId: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({
          rol: editRol,
          residencia_ids: editResidenciaIds,
          planta_asignada: editRol === 'Coordinador de planta' ? editPlantaAsignada : null
        })
        .eq('id', profileId);

      if (updateError) throw updateError;

      setSuccessMsg('Perfil actualizado con éxito.');
      setEditingProfileId(null);
      await loadPerfiles();
    } catch (err: any) {
      setError('Error al guardar: ' + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
      <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Gestión de Usuarios y Roles
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            Administra los roles, residencias permitidas y departamentos asignados a cada usuario del sistema.
          </p>
        </div>
        <button
          onClick={loadPerfiles}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 rounded-sm cursor-pointer transition-all"
        >
          <RefreshCw className="h-3 w-3" />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-sm text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-sm text-xs flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Cargando perfiles de usuarios...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Residencias Permitidas</th>
                <th className="p-3">Planta/Dpto.</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perfiles.map((profile) => {
                const isEditing = editingProfileId === profile.id;

                return (
                  <tr key={profile.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-900">{profile.nombre}</td>
                    <td className="p-3 font-mono text-slate-500">{profile.email}</td>
                    <td className="p-3">
                      {isEditing ? (
                        <select
                          value={editRol}
                          onChange={(e) => setEditRol(e.target.value as Rol)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded-sm text-slate-800 font-medium outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Administrador">Administrador</option>
                          <option value="Administrativo">Administrativo</option>
                          <option value="Personal de almacén">Personal de almacén</option>
                          <option value="Coordinador de planta">Coordinador de planta</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-700">{profile.rol}</span>
                      )}
                    </td>
                    <td className="p-3 max-w-[280px]">
                      {isEditing ? (
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto border border-slate-200 p-2 bg-white rounded-sm">
                          {residencias.map((res) => (
                            <label key={res.id} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                              <input
                                type="checkbox"
                                checked={editResidenciaIds.includes(res.id)}
                                onChange={() => handleToggleResidencia(res.id)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="truncate">{res.nombre}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {profile.residenciaIds.length === 0 ? (
                            <span className="text-slate-400 italic">Ninguna asignada</span>
                          ) : (
                            profile.residenciaIds.map((resId) => {
                              const resName = residencias.find(r => r.id === resId)?.nombre || resId;
                              return (
                                <span key={resId} className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[150px]">
                                  🏢 {resName}
                                </span>
                              );
                            })
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        editRol === 'Coordinador de planta' ? (
                          <input
                            type="text"
                            value={editPlantaAsignada}
                            onChange={(e) => setEditPlantaAsignada(e.target.value)}
                            placeholder="Ej. Planta 1"
                            className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-sm text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 w-28"
                          />
                        ) : (
                          <span className="text-slate-400 italic">No aplica</span>
                        )
                      ) : (
                        <span className="text-slate-600 font-semibold">
                          {profile.rol === 'Coordinador de planta' 
                            ? profile.plantaAsignada || 'No asignada' 
                            : '-'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveProfile(profile.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-sm cursor-pointer shadow-sm transition-all"
                            title="Guardar cambios"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-1 rounded-sm cursor-pointer transition-all"
                            title="Cancelar"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(profile)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 rounded-sm cursor-pointer transition-all ml-auto"
                        >
                          <Shield className="h-3 w-3" />
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
