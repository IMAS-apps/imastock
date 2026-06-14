import React, { useState } from 'react';
import { Producto, UniformeEntrega, Rol, AjusteStock } from '../types';
import { Shirt, User, PlusCircle, Calendar, Hash, ClipboardList, Scissors, Check, Sparkles, Layers } from 'lucide-react';

interface ModuloUniformesProps {
  entregaUniformes: UniformeEntrega[];
  productos: Producto[];
  rolActual: Rol;
  residenciaSeleccionadaId: string;
  onAddEntregaUniforme: (entrega: UniformeEntrega) => void;
  onUpdateProductos: (newProductos: Producto[]) => void;
  onAddAjuste: (ajuste: AjusteStock) => void;
  nombreUsuarioActual: string;
}

export default function ModuloUniformes({
  entregaUniformes,
  productos,
  rolActual,
  residenciaSeleccionadaId,
  onAddEntregaUniforme,
  onUpdateProductos,
  onAddAjuste,
  nombreUsuarioActual,
}: ModuloUniformesProps) {
  const [empleatNom, setEmpleatNom] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState('M');
  const [successToast, setSuccessToast] = useState(false);

  // Uniform products only in the current active residence
  const uniformProducts = productos.filter(
    (p) => p.residenciaId === residenciaSeleccionadaId && p.esUniforme && p.aprobado
  );

  // Render recent handovers for the current active residence
  const filteredEntregas = entregaUniformes.filter((e) => e.residenciaId === residenciaSeleccionadaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empleatNom.trim() || !selectedProductId) return;

    // Retrieve product to handle stock deduction
    const targetProduct = productos.find((p) => p.id === selectedProductId);
    if (!targetProduct) return;

    if (targetProduct.estocActual < cantidad) {
      alert(`Error: No hi ha prou estoc disponible. Estoc actual de "${targetProduct.nom}": ${targetProduct.estocActual} unitats.`);
      return;
    }

    // Deliveries count
    const deliveryRecord: UniformeEntrega = {
      id: `u-gen-${Date.now()}`,
      residenciaId: residenciaSeleccionadaId,
      empleatNom: empleatNom.trim(),
      productoId: selectedProductId,
      cantidad: Number(cantidad),
      talla: talla,
      data: new Date().toISOString(),
      usuari: `${nombreUsuarioActual} (${rolActual})`,
    };

    // 1. Save handover record
    onAddEntregaUniforme(deliveryRecord);

    // 2. Automatically deduct inventory count
    const updatedProducts = productos.map((p) => {
      if (p.id === selectedProductId) {
        return { ...p, estocActual: p.estocActual - Number(cantidad) };
      }
      return p;
    });
    onUpdateProductos(updatedProducts);

    // 3. Automatically generate historical manual audit log record
    const auditRecord: AjusteStock = {
      id: `aj-${Date.now()}`,
      residenciaId: residenciaSeleccionadaId,
      productoId: selectedProductId,
      productoNom: targetProduct.nom,
      estocAnterior: targetProduct.estocActual,
      estocNou: targetProduct.estocActual - Number(cantidad),
      motiu: `Lliurament de l'uniforme. Mida: ${talla} | Empleat/da: ${empleatNom.trim()}`,
      data: new Date().toISOString(),
      usuari: `${nombreUsuarioActual} (${rolActual})`,
    };
    onAddAjuste(auditRecord);

    // Reset forms and trigger visuals
    setEmpleatNom('');
    setSelectedProductId('');
    setCantidad(1);
    setTalla('M');
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  return (
    <div id="uniforms-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Handover Form */}
      <div className="lg:col-span-1 bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-4 h-fit">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-105">
          <Shirt className="h-5 w-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">Lliurament de Peça d'Uniforme</h3>
            <p className="text-slate-400 text-[11px] mt-0.5">Operació simplificada de registre diari.</p>
          </div>
        </div>

        {successToast && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-sm text-xs font-semibold flex items-center gap-2 animate-bounce">
            <Check className="h-4 w-4 text-blue-600 bg-white shadow-2xs rounded-sm p-0.5" />
            <div>¡Lliurament registrat! S'ha descomptat el stock automàticament.</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Name (Free Text Selection) */}
          <div>
            <label className="block text-xs font-semibold text-gray-650 mb-1">Nom Complet de l'Empleat/da (Text Lliure) *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={empleatNom}
                onChange={(e) => setEmpleatNom(e.target.value)}
                placeholder="Ex: Garcia Martí, Sofia (Auxiliar)"
                className="pl-9 pr-4 py-2.5 w-full text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Escriu cognoms i nom del gerocultor o personal.</p>
          </div>

          {/* Select Uniform Product */}
          <div>
            <label className="block text-xs font-semibold text-gray-650 mb-1">Peça d'Uniforme Sol·licitada *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none bg-white font-medium"
            >
              <option value="">-- Selecciona Peça d'Uniforme --</option>
              {uniformProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} (Estoc: {p.estocActual} unitats)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Uniform Size */}
            <div>
              <label className="block text-xs font-semibold text-gray-655 mb-1">Mida / Talla *</label>
              <select
                value={talla}
                onChange={(e) => setTalla(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none bg-white font-medium"
              >
                <option value="XS">XS (Més petita)</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL (Més gran)</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-gray-655 mb-1">Quantitat lliurada *</label>
              <input
                type="number"
                min={1}
                required
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none font-bold text-center"
              />
            </div>
          </div>

          {selectedProductId && (() => {
            const trg = uniformProducts.find(p => p.id === selectedProductId);
            if (trg && trg.estocActual < cantidad) {
              return (
                <div className="text-red-600 bg-red-50 p-2.5 border border-red-100 rounded-lg text-[10px] font-semibold text-center">
                  ⚠️ No hi ha existències suficients (Disponibles: {trg.estocActual}).
                </div>
              );
            }
          })()}

          <button
            type="submit"
            disabled={rolActual === 'Coordinador de planta' || !empleatNom.trim() || !selectedProductId}
            className={`w-full py-2.5 px-4 font-bold text-xs md:text-sm rounded-lg text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors ${
              (rolActual !== 'Coordinador de planta' && empleatNom.trim() && selectedProductId)
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Signar i Registrar Lliurament Automàtic
          </button>
        </form>
      </div>

      {/* Handover Table logs */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col h-[520px]">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-gray-950">Històric de Signatures i Lliuraments d'Uniformitat</h3>
          </div>
          <span className="text-[10px] text-gray-450 bg-slate-50 border border-slate-100 rounded px-2 py-0.5 font-mono">
            {filteredEntregas.length} registres
          </span>
        </div>

        <div className="overflow-y-auto mt-4 pr-1 flex-1">
          {filteredEntregas.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-gray-400 italic text-sm">
              <Scissors className="h-10 w-10 text-gray-250 mb-2" />
              No s'ha registrat cap lliurament d'uniformitat en aquesta residència pública encara.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntregas.map((item) => {
                const targetProd = productos.find((p) => p.id === item.productoId);
                return (
                  <div
                    key={item.id}
                    className="p-4 border border-slate-100 hover:border-purple-200 rounded-lg bg-slate-50/50 hover:bg-purple-50/10 transition-all flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-purple-600" /> {item.empleatNom}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Lliurat:{' '}
                        <strong className="text-purple-950">
                          {targetProd ? targetProd.nom : 'Peça desconeguda'}
                        </strong>{' '}
                        (Quantitat: <strong>x{item.cantidad}</strong> / Talla:{' '}
                        <span className="font-bold text-purple-700">{item.talla}</span>)
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.data).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span>| Registrat per: {item.usuari}</span>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 text-purple-800 text-xs font-bold py-1 px-2.5 rounded flex items-center gap-1.5 shadow-2xs shrink-0 select-none">
                      <Sparkles className="h-3 w-3 animate-pulse" /> Descomptat -{item.cantidad} d'Estoc
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
