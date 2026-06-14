import React, { useState } from 'react';
import { Pedido, Producto, LimitePlanta, Rol, PedidoEstado } from '../types';
import { ClipboardList, PlusCircle, AlertOctagon, CheckSquare, Truck, Archive, Play, AlertCircle, Sparkles, Check, UserCheck, Edit2 } from 'lucide-react';

interface PedidosPlantaProps {
  pedidos: Pedido[];
  productos: Producto[];
  limitesPlanta: LimitePlanta[];
  rolActual: Rol;
  plantaAsignadaUsuario?: string;
  residenciaSeleccionadaId: string;
  onUpdatePedidos: (newPedidos: Pedido[]) => void;
  onUpdateProductos: (newProductos: Producto[]) => void;
  nombreUsuarioActual: string;
}

export default function PedidosPlanta({
  pedidos,
  productos,
  limitesPlanta,
  rolActual,
  plantaAsignadaUsuario,
  residenciaSeleccionadaId,
  onUpdatePedidos,
  onUpdateProductos,
  nombreUsuarioActual,
}: PedidosPlantaProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    planta: plantaAsignadaUsuario || 'Planta 1',
    productoId: '',
    unidadesSolicitadas: 5,
    observaciones: '',
  });

  // Filter orders by selected residencia
  const filteredPedidos = pedidos.filter((p) => p.residenciaId === residenciaSeleccionadaId);

  // Active products in selected Residencia (approved only)
  const activeProducts = productos.filter((p) => p.residenciaId === residenciaSeleccionadaId && p.aprobado);

  // Determine floor limit for a product
  const getProductFloorLimit = (prodId: string, floorName: string): number => {
    const limitObj = limitesPlanta.find(
      (l) => l.residenciaId === residenciaSeleccionadaId && l.productoId === prodId && l.plantaId === floorName
    );
    return limitObj ? limitObj.maximoUnidades : 25; // Default safe limit is 25 if not configured
  };

  // Submit Order Creation
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.productoId) return;

    const limit = getProductFloorLimit(newOrder.productoId, newOrder.planta);
    
    const orderObj: Pedido = {
      id: `ped-gen-${Date.now()}`,
      residenciaId: residenciaSeleccionadaId,
      planta: newOrder.planta,
      productoId: newOrder.productoId,
      unidadesMaximas: limit,
      unidadesSolicitadas: Number(newOrder.unidadesSolicitadas),
      unidadesEntregadas: 0,
      estado: 'Borrador', // Created as Draft first
      checkVerificacion: false,
      observaciones: newOrder.observaciones,
      creadoPor: nombreUsuarioActual,
      creadoPorNombre: nombreUsuarioActual,
      fecha: new Date().toISOString(),
    };

    onUpdatePedidos([orderObj, ...pedidos]);
    setShowCreateModal(false);
    
    setNewOrder({
      planta: plantaAsignadaUsuario || 'Planta 1',
      productoId: '',
      unidadesSolicitadas: 5,
      observaciones: '',
    });
  };

  // State Transition Actions

  // 1. Submit Draft to Evaluation
  const submitOrderToProcess = (orderId: string) => {
    const updated = pedidos.map((p) => {
      if (p.id === orderId) {
        // Evaluate limit rule
        const isExcess = p.unidadesSolicitadas > p.unidadesMaximas;
        const targetEstado: PedidoEstado = isExcess ? 'Bloqueada por exceso' : 'Aprobada / Lista para preparar';
        return { ...p, estado: targetEstado };
      }
      return p;
    });
    onUpdatePedidos(updated);
  };

  // 2. Admin Authorizes Excess
  const authorizeExcess = (orderId: string) => {
    const updated = pedidos.map((p) => {
      if (p.id === orderId) {
        return { ...p, estado: 'Aprobada / Lista para preparar' as PedidoEstado };
      }
      return p;
    });
    onUpdatePedidos(updated);
  };

  // 3. Almacenero updates delivered count and submits dispatch (Enviada)
  const [preparingOrderId, setPreparingOrderId] = useState<string | null>(null);
  const [deliveredCount, setDeliveredCount] = useState<number>(0);

  const startDispatchPreparation = (order: Pedido) => {
    setPreparingOrderId(order.id);
    setDeliveredCount(order.unidadesSolicitadas);
  };

  const dispatchOrder = () => {
    if (!preparingOrderId) return;
    
    // Find matching order
    const orderToShip = pedidos.find(p => p.id === preparingOrderId);
    if (!orderToShip) return;

    // Transition state
    const updatedOrders = pedidos.map((o) => {
      if (o.id === preparingOrderId) {
        return {
          ...o,
          unidadesEntregadas: deliveredCount,
          estado: 'Enviada' as PedidoEstado,
        };
      }
      return o;
    });

    // Automatically deduct product stock
    const updatedProducts = productos.map((p) => {
      if (p.id === orderToShip.productoId) {
        return {
          ...p,
          estocActual: Math.max(0, p.estocActual - deliveredCount),
        };
      }
      return p;
    });

    onUpdatePedidos(updatedOrders);
    onUpdateProductos(updatedProducts);
    setPreparingOrderId(null);
  };

  // 4. Coordinator confirms receipt (check)
  const confirmReceipt = (orderId: string) => {
    const updated = pedidos.map((p) => {
      if (p.id === orderId) {
        return {
          ...p,
          estado: 'Recibida / Cerrada' as PedidoEstado,
          checkVerificacion: true,
        };
      }
      return p;
    });
    onUpdatePedidos(updated);
  };

  // Return badge styling for States
  const getStatusBadge = (estado: PedidoEstado) => {
    switch (estado) {
      case 'Borrador':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Bloqueada por exceso':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-semibold animate-pulse';
      case 'Aprobada / Lista para preparar':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Enviada':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Recibida / Cerrada':
        return 'bg-blue-100 text-blue-800 border-blue-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div id="pedidos-planta-container" className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Comandes Internes de Planta / Menjador
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Gestió interna de comandes per a repartiment des del magatzem general segons els cupos de planta.
          </p>
        </div>

        {/* Create Order Button */}
        {(rolActual === 'Coordinador de planta' || rolActual === 'Administrador' || rolActual === 'Administrativo') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-sm flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Generar Sol·licitud de Comanda
          </button>
        )}
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID / Data</th>
                <th className="px-6 py-4">Planta Sol·licitant</th>
                <th className="px-6 py-4">Producte demanat</th>
                <th className="px-6 py-4 text-center">Límit Cupo</th>
                <th className="px-6 py-4 text-center">Unitats Demanades</th>
                <th className="px-6 py-4 text-center">Unitats Lliurades</th>
                <th className="px-6 py-4">Estat Comanda</th>
                <th className="px-6 py-4">Verificació</th>
                <th className="px-6 py-4 text-right">Lògica de Progrés / Acció</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-medium font-sans">
                    No s'ha registrat cap comanda en aquesta residència comercial.
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((ped) => {
                  const targetProduct = productos.find((p) => p.id === ped.productoId);
                  return (
                    <tr key={ped.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID / Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-gray-800 font-semibold">{ped.id.substring(0, 10)}...</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {new Date(ped.fecha).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>

                      {/* Requester floor */}
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                        {ped.planta}
                      </td>

                      {/* Product details */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-semibold text-gray-950">{targetProduct?.nom || 'Producte no reconegut'}</div>
                        <div className="text-[11px] text-gray-400 italic">Sol·licitat per: {ped.creadoPorNombre}</div>
                        {ped.observaciones && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-md mt-1 italic border border-slate-100">
                            "{ped.observaciones}"
                          </div>
                        )}
                      </td>

                      {/* Limit Units */}
                      <td className="px-6 py-4 text-center font-bold text-gray-500">
                        {ped.unidadesMaximas} <span className="text-[10px] block font-normal">unitats màx</span>
                      </td>

                      {/* Solicited Units */}
                      <td className="px-6 py-4 text-center">
                        <span className={`text-base font-bold ${ped.unidadesSolicitadas > ped.unidadesMaximas ? 'text-rose-600 font-black' : 'text-slate-900'}`}>
                          {ped.unidadesSolicitadas}
                        </span>
                        {ped.unidadesSolicitadas > ped.unidadesMaximas && (
                          <span className="text-[9px] text-rose-500 block font-semibold uppercase flex items-center justify-center gap-0.5">
                            <AlertCircle className="h-2 w-2" /> supera cupó
                          </span>
                        )}
                      </td>

                      {/* Delivered Units */}
                      <td className="px-6 py-4 text-center text-sm font-mono font-bold text-blue-700">
                        {ped.estado === 'Enviada' || ped.estado === 'Recibida / Cerrada' ? (
                          <span>{ped.unidadesEntregadas} <span className="text-[9px] block text-blue-600 font-normal">reals</span></span>
                        ) : (
                          <span className="text-gray-300 italic text-xs">Pendent...</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex py-1 px-2.5 rounded-sm text-xs font-semibold border ${getStatusBadge(ped.estado)}`}>
                          {ped.estado}
                        </span>
                      </td>

                      {/* Check verification */}
                      <td className="px-6 py-4 text-center">
                        {ped.checkVerificacion ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-sm px-2 py-0.5 text-xs font-medium">
                            <Check className="h-3 w-3" /> Rebentat
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Pendent ràpida</span>
                        )}
                      </td>

                      {/* Progress / Transition Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex gap-2 justify-end">
                          
                          {/* 1. Submitted Draft Order */}
                          {ped.estado === 'Borrador' && (rolActual === 'Coordinador de planta' || rolActual === 'Administrador' || rolActual === 'Administrativo') && (
                            <button
                              onClick={() => submitOrderToProcess(ped.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-sm flex items-center gap-1 cursor-pointer animate-none"
                            >
                              <Play className="h-3 w-3" />
                              <span>Processar Comanda</span>
                            </button>
                          )}

                          {/* 2. Admin Clear Excess Block */}
                          {ped.estado === 'Bloqueada por exceso' && (rolActual === 'Administrador' || rolActual === 'Administrativo') && (
                            <button
                              onClick={() => authorizeExcess(ped.id)}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Permetre sol·licitud saltant límit d'unitats"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                              <span>Autoritzar Excés</span>
                            </button>
                          )}

                          {/* Excess instructions alert (Helper visible to user on what is blocked) */}
                          {ped.estado === 'Bloqueada por exceso' && rolActual === 'Coordinador de planta' && (
                            <span className="text-xs text-rose-500 italic flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 inline" /> Bloquejat: Esperant Director
                            </span>
                          )}

                          {/* 3. Almacenero updates and dispatches */}
                          {ped.estado === 'Aprobada / Lista para preparar' && rolActual === 'Personal de almacén' && (
                            <button
                              onClick={() => startDispatchPreparation(ped)}
                              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Truck className="h-3 w-3" />
                              <span>Preparar i Lliurar</span>
                            </button>
                          )}

                          {ped.estado === 'Aprobada / Lista para preparar' && rolActual !== 'Personal de almacén' && (
                            <span className="text-xs text-sky-600 font-medium italic">
                              Aprovat: Esperant preparador d'almacén
                            </span>
                          )}

                          {/* 4. Coordinator acknowledges delivery receipt */}
                          {ped.estado === 'Enviada' && (rolActual === 'Coordinador de planta' || rolActual === 'Administrador') && (
                            <button
                              onClick={() => confirmReceipt(ped.id)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 text-xs font-bold py-1.5 px-3 rounded-sm flex items-center gap-1.5 cursor-pointer font-sans"
                            >
                              <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                              <span>Confirmar Recepció</span>
                            </button>
                          )}

                          {ped.estado === 'Enviada' && rolActual === 'Personal de almacén' && (
                            <span className="text-xs text-amber-600 font-medium italic">
                              En camí: El de planta ha d'acceptar
                            </span>
                          )}

                          {/* 5. Closed */}
                          {ped.estado === 'Recibida / Cerrada' && (
                            <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 bg-blue-105 rounded-sm p-0.5" /> Comanda tancada
                            </span>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Fine preparation Dialog Modal (Modified units delivery physically) */}
      {preparingOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-600 px-6 py-4 text-white">
              <h3 className="text-base font-bold uppercase tracking-wider">Preparació del Lliurament Físic (Joan)</h3>
              <p className="text-blue-105 text-xs mt-0.5">
                Com a personal de magatzem, pots corregir la quantitat lliurada real si hi ha trencament d'estoc o sota estoc de seguretat.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const trg = pedidos.find(p => p.id === preparingOrderId);
                const trgProd = productos.find(p => p.id === trg?.productoId);
                return (
                  <>
                    <div>
                      <span className="text-xs block text-gray-400 font-semibold uppercase">Producte demanat</span>
                      <div className="font-bold text-slate-900">{trgProd?.nom}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Estoc actual disponible a prestatges: <strong className="text-gray-900">{trgProd?.estocActual} unitats</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between text-xs">
                      <div>
                        <span className="text-gray-500 block">Unitats Sol·licitades:</span>
                        <strong className="text-slate-950 text-base">{trg?.unidadesSolicitadas}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Límit cupo Planta:</span>
                        <strong className="text-slate-950 text-base">{trg?.unidadesMaximas}</strong>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase">Unitats reals que lliures (Sortides):</label>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setDeliveredCount(prev => Math.max(0, prev - 1))}
                          className="h-10 w-10 bg-gray-100 text-gray-800 hover:bg-gray-200 font-black rounded text-lg cursor-pointer"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          value={deliveredCount}
                          onChange={(e) => setDeliveredCount(Math.min(trgProd?.estocActual || 0, Math.max(0, Number(e.target.value))))}
                          className="w-full text-center py-2 border border-blue-200 rounded-lg text-lg font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setDeliveredCount(prev => Math.min(trgProd?.estocActual || 0, prev + 1))}
                          className="h-10 w-10 bg-gray-100 text-gray-800 hover:bg-gray-200 font-black rounded text-lg cursor-pointer"
                        >
                          +1
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 italic mt-1.5">
                        * No es pot lliurar més quantitat de l'estoc real disponible.
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2.5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPreparingOrderId(null)}
                className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Tancar d'urgència
              </button>
              <button
                type="button"
                onClick={dispatchOrder}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-sky-600 hover:bg-sky-700 cursor-pointer"
              >
                Completar Encofrat i Confirmar descompte d'estoc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOLICITUDE CREATION MULTI-CENTER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-600 px-6 py-4 text-white">
              <h3 className="text-base font-bold">Nova Sol·licitud per Planta / Comedor</h3>
              <p className="text-emerald-100 text-xs mt-0.5">
                Genera un nou pedido al magatzem de residències.
              </p>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div className="p-6 space-y-4">
                {/* Floor select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Secció / Planta destinació *</label>
                  {plantaAsignadaUsuario ? (
                    <input
                      type="text"
                      disabled
                      value={newOrder.planta}
                      className="w-full text-xs mt-1 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg p-2.5 font-semibold"
                    />
                  ) : (
                    <select
                      value={newOrder.planta}
                      onChange={(e) => setNewOrder({ ...newOrder, planta: e.target.value })}
                      className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none bg-white font-medium"
                    >
                      <option value="Planta 1">Planta 1 (Infermeria)</option>
                      <option value="Planta 2">Planta 2 (Crònics)</option>
                      <option value="Comedor Central">Menjador Residencia</option>
                      <option value="Cafetería d'Avis">Cafeteria</option>
                    </select>
                  )}
                </div>

                {/* Product Select */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Selecciona el producte *</label>
                  <select
                    required
                    value={newOrder.productoId}
                    onChange={(e) => setNewOrder({ ...newOrder, productoId: e.target.value })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none bg-white font-medium"
                  >
                    <option value="">-- Tria del llistat aprobant --</option>
                    {activeProducts.map((p) => {
                      const limit = getProductFloorLimit(p.id, newOrder.planta);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.nom} (Disponible: {p.estocActual}) - Lím: {limit}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Requested Units */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Quantitat demanada *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newOrder.unidadesSolicitadas}
                    onChange={(e) => setNewOrder({ ...newOrder, unidadesSolicitadas: Number(e.target.value) })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none"
                  />
                  {newOrder.productoId && (() => {
                    const lim = getProductFloorLimit(newOrder.productoId, newOrder.planta);
                    return Number(newOrder.unidadesSolicitadas) > lim ? (
                      <div className="mt-1 bg-rose-50 border border-rose-100 text-rose-700 p-2 rounded-md text-[11px] flex items-center gap-1.5 font-medium leading-normal animate-pulse">
                        <AlertOctagon className="h-4 w-4 shrink-0 text-rose-600" />
                        <div>Atenció: Excés del límit de planta de {lim} unitats. S'activarà bloqueig per a autorització directorial!</div>
                      </div>
                    ) : (
                      <div className="mt-1 text-emerald-600 text-[10px] font-medium">
                        Dins del límit cupó setmanal de planta ({lim} unitats). Es processarà automàticament.
                      </div>
                    );
                  })()}
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 font-sans">Motius o observacions urgents</label>
                  <textarea
                    rows={2}
                    value={newOrder.observaciones}
                    onChange={(e) => setNewOrder({ ...newOrder, observaciones: e.target.value })}
                    placeholder="Detalla si hi ha alguna necessitat prioritària o descripció d'ús..."
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  Tancar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Salvar Sol·licitud (Crea Esborrany)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
