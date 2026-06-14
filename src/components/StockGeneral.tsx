import React, { useState } from 'react';
import { Producto, Rol, CampoVisibilidadConfig, AjusteStock } from '../types';
import { Search, Plus, Filter, AlertTriangle, Check, ShieldAlert, BadgeAlert, Layers, Sliders, CheckCircle, HelpCircle } from 'lucide-react';

interface StockGeneralProps {
  productos: Producto[];
  onUpdateProductos: (newProductos: Producto[]) => void;
  onAddAjuste: (ajuste: AjusteStock) => void;
  rolActual: Rol;
  visibilidadConfig: Record<string, CampoVisibilidadConfig>;
  residenciaSeleccionadaId: string;
  nombreUsuarioActual: string;
}

export default function StockGeneral({
  productos,
  onUpdateProductos,
  onAddAjuste,
  rolActual,
  visibilidadConfig,
  residenciaSeleccionadaId,
  nombreUsuarioActual,
}: StockGeneralProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamilia, setSelectedFamilia] = useState('Todas');
  const [selectedSubfamilia, setSelectedSubfamilia] = useState('Todas');
  const [alertFilter, setAlertFilter] = useState<'All' | 'Red' | 'Yellow' | 'Green'>('All');

  // New product form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState<Partial<Producto>>({
    nom: '',
    familia: 'Higiene i Sanitari',
    subfamilia: '',
    ubicacion: '',
    estocActual: 0,
    estocMinim: 10,
    estocMaxim: 100,
    caducidad: '',
    consumMensual: 0,
    lot: '',
    expedient: '',
    dataIniciContracte: '',
    dataFinalContracte: '',
    observacions: '',
  });

  // Manual stock adjustment state (triggers audit logs)
  const [adjustingProduct, setAdjustingProduct] = useState<Producto | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Get active columns for this specific role
  const activeConfig = visibilidadConfig[rolActual] || visibilidadConfig['Coordinador de planta'];

  // Filter products by tenure and query params
  const filteredProducts = productos.filter((prod) => {
    if (prod.residenciaId !== residenciaSeleccionadaId) return false;
    
    // Hidden to coordinators if pending approval
    if (!prod.aprobado && rolActual === 'Coordinador de planta') return false;

    // Search query
    const matchesSearch =
      prod.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.familia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.subfamilia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.ubicacion && prod.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prod.expedient && prod.expedient.toLowerCase().includes(searchTerm.toLowerCase()));

    // Family filter
    const matchesFamilia = selectedFamilia === 'Todas' || prod.familia === selectedFamilia;

    // Subfamily filter
    const matchesSubfamilia = selectedSubfamilia === 'Todas' || prod.subfamilia === selectedSubfamilia;

    // Alert filter
    let matchesAlert = true;
    const isRed = prod.estocActual < prod.estocMinim;
    const isYellow = !isRed && prod.estocActual <= prod.estocMinim * 1.15;
    const isGreen = !isRed && !isYellow;

    if (alertFilter === 'Red') matchesAlert = isRed;
    else if (alertFilter === 'Yellow') matchesAlert = isYellow;
    else if (alertFilter === 'Green') matchesAlert = isGreen;

    return matchesSearch && matchesFamilia && matchesSubfamilia && matchesAlert;
  });

  // Unique lists for dropdown filters based on selected tenant's products
  const familias = ['Todas', ...Array.from(new Set(productos
    .filter(p => p.residenciaId === residenciaSeleccionadaId)
    .map(p => p.familia)))];
    
  const subfamilias = ['Todas', ...Array.from(new Set(productos
    .filter(p => p.residenciaId === residenciaSeleccionadaId && (selectedFamilia === 'Todas' || p.familia === selectedFamilia))
    .map(p => p.subfamilia)))];

  // Colors alert calculator
  const getAlertColors = (actual: number, minimo: number) => {
    if (actual < minimo) {
      return {
        bg: 'bg-red-50 text-red-700 border-red-200',
        badge: 'bg-red-600 text-white',
        text: 'text-red-600 font-bold',
        label: 'Estoc crític (Sota Mínim)',
        dot: 'bg-red-500 animate-pulse'
      };
    }
    if (actual <= minimo * 1.15) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        badge: 'bg-amber-500 text-white',
        text: 'text-amber-700 font-semibold',
        label: 'Pròxim al Mínim (< 15%)',
        dot: 'bg-amber-500'
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-100',
      badge: 'bg-emerald-600 text-white',
      text: 'text-emerald-700',
      label: 'Suficient (Óptim)',
      dot: 'bg-emerald-500'
    };
  };

  // Inline +/- Quick Stocks adjustments (Personal de almacen only, with logs)
  const quickStockChange = (prod: Producto, amount: number) => {
    const newStock = Math.max(0, prod.estocActual + amount);
    if (newStock === prod.estocActual) return;

    // Log automatic audit adjust
    const updated = productos.map((p) => {
      if (p.id === prod.id) {
        return { ...p, estocActual: newStock };
      }
      return p;
    });
    onUpdateProductos(updated);

    const log: AjusteStock = {
      id: `aj-${Date.now()}`,
      residenciaId: residenciaSeleccionadaId,
      productoId: prod.id,
      productoNom: prod.nom,
      estocAnterior: prod.estocActual,
      estocNou: newStock,
      motiu: `Ajuste rápido inline de stock (${amount > 0 ? '+' : ''}${amount} unidades)`,
      data: new Date().toISOString(),
      usuari: `${nombreUsuarioActual} (${rolActual})`
    };
    onAddAjuste(log);
  };

  // Trigger manual adjustment with detailed modal
  const handleOpenAdjustModal = (prod: Producto) => {
    setAdjustingProduct(prod);
    setAdjustmentValue(prod.estocActual);
    setAdjustmentReason('');
  };

  const handleSaveManualAdjustment = () => {
    if (!adjustingProduct) return;
    const cleanValue = Math.max(0, adjustmentValue);
    
    // Save state
    const updated = productos.map((p) => {
      if (p.id === adjustingProduct.id) {
        return { ...p, estocActual: cleanValue };
      }
      return p;
    });
    onUpdateProductos(updated);

    // Register log
    const log: AjusteStock = {
      id: `aj-${Date.now()}`,
      residenciaId: residenciaSeleccionadaId,
      productoId: adjustingProduct.id,
      productoNom: adjustingProduct.nom,
      estocAnterior: adjustingProduct.estocActual,
      estocNou: cleanValue,
      motiu: adjustmentReason.trim() || 'Ajuste anual de auditoría física de almacén.',
      data: new Date().toISOString(),
      usuari: `${nombreUsuarioActual} (${rolActual})`
    };
    onAddAjuste(log);
    setAdjustingProduct(null);
  };

  // Add Product Submit
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.nom) return;

    // Rule: if almacenero creates, it's not approved. If Admin or adminis creates, it is instantly approved!
    const isApprovedByRole = rolActual === 'Administrador' || rolActual === 'Administrativo';

    const cleanNewProduct: Producto = {
      id: `prod-gen-${Date.now()}`,
      residenciaId: residenciaSeleccionadaId,
      nom: newProd.nom,
      familia: newProd.familia || 'Otros',
      subfamilia: newProd.subfamilia || 'General',
      ubicacion: newProd.ubicacion || 'Zona General Almacén',
      estocActual: Number(newProd.estocActual) || 0,
      estocMinim: Number(newProd.estocMinim) || 0,
      estocMaxim: Number(newProd.estocMaxim) || 100,
      caducidad: newProd.caducidad || undefined,
      consumMensual: Number(newProd.consumMensual) || 0,
      lot: newProd.lot || undefined,
      expedient: newProd.expedient || undefined,
      dataIniciContracte: newProd.dataIniciContracte || undefined,
      dataFinalContracte: newProd.dataFinalContracte || undefined,
      observacions: newProd.observacions || '',
      aprobado: isApprovedByRole, // "Pendiente de aprobación" workflow
    };

    onUpdateProductos([cleanNewProduct, ...productos]);
    setShowAddModal(false);
    
    // Reset form
    setNewProd({
      nom: '',
      familia: 'Higiene i Sanitari',
      subfamilia: '',
      ubicacion: '',
      estocActual: 0,
      estocMinim: 10,
      estocMaxim: 100,
      caducidad: '',
      consumMensual: 0,
      lot: '',
      expedient: '',
      dataIniciContracte: '',
      dataFinalContracte: '',
      observacions: '',
    });
  };

  // Admin approves product
  const approveProduct = (prodId: string) => {
    const updated = productos.map((p) => {
      if (p.id === prodId) {
        return { ...p, aprobado: true };
      }
      return p;
    });
    onUpdateProductos(updated);
  };

  return (
    <div id="stock-general-container" className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cercar per nom, expedient, ubicació..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 font-medium"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedFamilia}
              onChange={(e) => {
                setSelectedFamilia(e.target.value);
                setSelectedSubfamilia('Todas');
              }}
              className="py-2 px-3 text-xs border border-slate-300 rounded-sm bg-white text-slate-700 font-bold outline-none cursor-pointer"
            >
              <option value="Todas">Família: Totes</option>
              {familias.filter(f => f !== 'Todas').map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <select
              value={selectedSubfamilia}
              onChange={(e) => setSelectedSubfamilia(e.target.value)}
              className="py-2 px-3 text-xs border border-slate-300 rounded-sm bg-white text-slate-700 font-bold outline-none cursor-pointer"
              disabled={selectedFamilia === 'Todas'}
            >
              <option value="Todas">Subfamília: Totes</option>
              {subfamilias.filter(s => s !== 'Todas').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* State Alerts filter & Register triggers */}
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto shrink-0 justify-end">
          <div className="border border-slate-200 rounded-sm p-1 bg-slate-50 flex flex-wrap gap-1">
            <button
              onClick={() => setAlertFilter('All')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer border ${
                alertFilter === 'All' ? 'bg-white text-slate-800 shadow-2xs border-slate-300' : 'text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              Tots
            </button>
            <button
              onClick={() => setAlertFilter('Red')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                alertFilter === 'Red' ? 'bg-red-600 text-white border-red-700 shadow-2xs' : 'text-red-600 border-transparent hover:bg-red-50'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
              Crítics
            </button>
            <button
              onClick={() => setAlertFilter('Yellow')}
              className={`flex-1 sm:flex-none px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                alertFilter === 'Yellow' ? 'bg-amber-500 text-white border-amber-600 shadow-2xs' : 'text-amber-600 border-transparent hover:bg-amber-50'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
              Alerta Mínims
            </button>
          </div>

          {rolActual !== 'Coordinador de planta' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest py-2.5 px-4 rounded-sm flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>+ Nou Producte</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                {/* Dynamically checking visible columns configured for currently selected role */}
                {activeConfig.nom && <th className="px-6 py-4">Nom del Producte</th>}
                {activeConfig.familia && <th className="px-6 py-4">Família / Subfamília</th>}
                {activeConfig.ubicacion && <th className="px-6 py-4 font-mono">Ubicació</th>}
                {activeConfig.estocActual && (
                  <th className="px-6 py-4 text-center">
                    <span className="block text-[10px] text-gray-400 font-normal">Estoc Actual / Mín / Màx</span>
                    Existències
                  </th>
                )}
                {activeConfig.caducidad && <th className="px-6 py-4">Caducitat</th>}
                {activeConfig.lot && <th className="px-6 py-4 font-mono">Lot</th>}
                {activeConfig.expedient && <th className="px-6 py-4 font-mono">Expedient Contracte</th>}
                {activeConfig.dataIniciContracte && (
                  <th className="px-6 py-4 text-xs font-normal">
                    Durada Contracte
                  </th>
                )}
                {activeConfig.observacions && <th className="px-6 py-4">Observacions</th>}
                <th className="px-6 py-4 text-right">Accions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No s'han trobat productes que coincideixin amb els filtres actius en aquesta residència.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const alertInfo = getAlertColors(prod.estocActual, prod.estocMinim);
                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-slate-50/50 transition-colors ${!prod.aprobado ? 'bg-amber-50/25 border-l-4 border-l-amber-500' : ''}`}
                    >
                      {/* Name Column */}
                      {activeConfig.nom && (
                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-semibold text-gray-950 flex flex-col">
                            <span className="line-clamp-2">{prod.nom}</span>
                            {!prod.aprobado && (
                              <span className="text-[10px] bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 mt-1 rounded-sm w-fit font-medium flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3 inline" /> Pendents d'Aprovació pel Director
                              </span>
                            )}
                            {prod.esUniforme && (
                              <span className="text-[10px] bg-purple-100 border border-purple-200 text-purple-800 px-2 py-0.5 mt-1 rounded-sm w-fit font-medium flex items-center gap-1">
                                <Layers className="h-3 w-3" /> Peça d'Uniforme
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Family Column */}
                      {activeConfig.familia && (
                        <td className="px-6 py-4 text-xs text-gray-600">
                          <span className="font-medium text-gray-800 block">{prod.familia}</span>
                          <span className="text-gray-400 text-[11px]">{prod.subfamilia}</span>
                        </td>
                      )}

                      {/* Location Column */}
                      {activeConfig.ubicacion && (
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {prod.ubicacion || 'Sense especificar'}
                        </td>
                      )}

                      {/* Stocks Column (Interactive quick-change layout with color codes) */}
                      {activeConfig.estocActual && (
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {/* Alert Badge */}
                          <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border mb-2 font-medium ${alertInfo.bg}`}>
                            <span className={`h-2 w-2 rounded-full ${alertInfo.dot}`}></span>
                            <span>{alertInfo.label}</span>
                          </div>

                          <div className="flex items-center justify-center gap-1">
                            {/* Fast subtract (only for warehouses & administration) */}
                            {rolActual !== 'Coordinador de planta' && (
                              <button
                                onClick={() => quickStockChange(prod, -10)}
                                className="h-7 w-7 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                                title="Restar 10 unitats"
                              >
                                -10
                              </button>
                            )}
                            {rolActual !== 'Coordinador de planta' && (
                              <button
                                onClick={() => quickStockChange(prod, -1)}
                                className="h-7 w-7 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                                title="Restar 1 unitat"
                              >
                                -1
                              </button>
                            )}

                            {/* Stock Display */}
                            <div className="px-3 min-w-[70px]">
                              <span className={`text-base font-bold text-center block ${alertInfo.text}`}>
                                {prod.estocActual}
                              </span>
                              <span className="text-[10px] text-gray-400 font-normal">
                                Mín: {prod.estocMinim} | Max: {prod.estocMaxim}
                              </span>
                            </div>

                            {/* Fast add (only for warehouses & administration) */}
                            {rolActual !== 'Coordinador de planta' && (
                              <button
                                onClick={() => quickStockChange(prod, 1)}
                                className="h-7 w-7 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                                title="Sumar 1 unitat"
                              >
                                +1
                              </button>
                            )}
                            {rolActual !== 'Coordinador de planta' && (
                              <button
                                onClick={() => quickStockChange(prod, 10)}
                                className="h-7 w-7 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                                title="Sumar 10 unitats"
                              >
                                +10
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Expiration date */}
                      {activeConfig.caducidad && (
                        <td className="px-6 py-4 text-xs whitespace-nowrap">
                          {prod.caducidad ? (
                            <span className={`py-1 px-2 rounded-md font-mono ${
                              new Date(prod.caducidad) < new Date() 
                                ? 'bg-red-100 text-red-800 border border-red-200' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {prod.caducidad}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No caduca</span>
                          )}
                        </td>
                      )}

                      {/* Lot field */}
                      {activeConfig.lot && (
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {prod.lot || '-'}
                        </td>
                      )}

                      {/* File Number */}
                      {activeConfig.expedient && (
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {prod.expedient || '-'}
                        </td>
                      )}

                      {/* Contract Dates */}
                      {activeConfig.dataIniciContracte && (
                        <td className="px-6 py-4 text-xs text-slate-600 whitespace-nowrap">
                          {prod.dataIniciContracte ? (
                            <div>
                              <div className="font-medium text-slate-800">Inici: <span className="font-mono text-[11px]">{prod.dataIniciContracte}</span></div>
                              <div className="text-slate-400">Fi: <span className="font-mono text-[11px]">{prod.dataFinalContracte || '-'}</span></div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Sense contracte d'expedient</span>
                          )}
                        </td>
                      )}

                      {/* Observations */}
                      {activeConfig.observacions && (
                        <td className="px-6 py-4 max-w-xs text-xs text-gray-500 italic">
                          <p className="line-clamp-2">{prod.observacions || 'N/A'}</p>
                        </td>
                      )}

                      {/* Actions Column */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          {/* Approve option for Admin */}
                          {!prod.aprobado && (rolActual === 'Administrador' || rolActual === 'Administrativo') && (
                            <button
                              onClick={() => approveProduct(prod.id)}
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold py-1.5 px-3 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                              title="Aprovar de forma inmediata"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Aprovar</span>
                            </button>
                          )}

                          {/* Detail Manual stock adjustments logs trigger */}
                          {rolActual !== 'Coordinador de planta' && (
                            <button
                              onClick={() => handleOpenAdjustModal(prod)}
                              className="text-xs border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black py-1.5 px-3 rounded-md transition-colors cursor-pointer"
                              title="Ajuste fino de almacén"
                            >
                              Intervenció Física
                            </button>
                          )}

                          {rolActual === 'Coordinador de planta' && (
                            <span className="text-xs text-gray-400 italic">Sense acció</span>
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

      {/* Manual Stock Adjustment Dialog Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 px-6 py-4 text-white">
              <h3 className="text-base font-bold uppercase tracking-wider">Intervenció Física d'Inventari (Auditoria)</h3>
              <p className="text-slate-400 text-xs mt-1">
                Registra un desquadre físic o correcció manual en IMAStock.
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase">Producte</label>
                <div className="mt-1 font-bold text-sm text-gray-900">{adjustingProduct.nom}</div>
                <div className="text-xs text-gray-400">Estoc actual computat: <strong className="text-gray-700">{adjustingProduct.estocActual}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Nou Estoc Físic Detectat</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    onClick={() => setAdjustmentValue(prev => Math.max(0, prev - 5))}
                    className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 font-bold text-sm cursor-pointer"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(Math.max(0, Number(e.target.value)))}
                    className="w-full text-center py-2 border border-gray-300 rounded-lg text-lg font-bold"
                  />
                  <button
                    onClick={() => setAdjustmentValue(prev => prev + 5)}
                    className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 font-bold text-sm cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Motiu del desquadre (Obligatori)</label>
                <textarea
                  rows={3}
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Ex: Trobades 3 caixes més darrere del prestatge B. O: Productes caducats descartats..."
                  className="w-full text-xs mt-1 border border-slate-300 rounded-sm p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-4 py-2 border border-slate-300 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-slate-100 cursor-pointer"
              >
                Cancel·lar
              </button>
              <button
                type="button"
                onClick={handleSaveManualAdjustment}
                disabled={!adjustmentReason.trim()}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm text-white shadow-2xs cursor-pointer ${
                  adjustmentReason.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Registrar Ajust i Signar Històric
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Product Creation Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="bg-blue-600 px-6 py-4 text-white">
              <h3 className="text-base font-bold uppercase tracking-wider">Introducció de Nou Producte a l'Inventari</h3>
              <p className="text-blue-105 text-xs mt-0.5">
                {rolActual === 'Personal de almacén' 
                  ? 'Com a Personal de magatzem, el producte es registrarà com "Pendent d\'aprovació" pel director.' 
                  : 'Registrar un nou producte directament aprovat i actiu pel catàleg.'}
              </p>
            </div>
            
            <form onSubmit={handleAddProduct}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700">Nom de l'artícul / Producte *</label>
                  <input
                    type="text"
                    required
                    value={newProd.nom}
                    onChange={(e) => setNewProd({ ...newProd, nom: e.target.value })}
                    placeholder="Ex: Suplement espessidor sabor taronja 500g"
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Family */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Família *</label>
                  <select
                    value={newProd.familia}
                    onChange={(e) => setNewProd({ ...newProd, familia: e.target.value })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none bg-white font-medium"
                  >
                    <option value="Higiene i Sanitari">Higiene i Sanitari</option>
                    <option value="Dietètica i Nutrició">Dietètica i Nutrició</option>
                    <option value="Lenceria i Uniformitat">Lenceria i Uniformitat</option>
                    <option value="Material d'Oficina">Material d'Oficina</option>
                    <option value="Altres">Altres</option>
                  </select>
                </div>

                {/* Subfamily */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Subfamília *</label>
                  <input
                    type="text"
                    required
                    value={newProd.subfamilia}
                    onChange={(e) => setNewProd({ ...newProd, subfamilia: e.target.value })}
                    placeholder="Ex: Incontinència, Banys, Suplements, Disfàgia"
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Physical Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Ubicació Física Almacén *</label>
                  <input
                    type="text"
                    required
                    value={newProd.ubicacion}
                    onChange={(e) => setNewProd({ ...newProd, ubicacion: e.target.value })}
                    placeholder="Ex: Pasadís C - Estanteria 4 - Calaix 2"
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Initial Stock */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Estoc Actual Inicial *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProd.estocActual}
                    onChange={(e) => setNewProd({ ...newProd, estocActual: Number(e.target.value) })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Min stock */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Estoc Mínim Crític *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProd.estocMinim}
                    onChange={(e) => setNewProd({ ...newProd, estocMinim: Number(e.target.value) })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Max Stock */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Estoc Màxim Permès *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProd.estocMaxim}
                    onChange={(e) => setNewProd({ ...newProd, estocMaxim: Number(e.target.value) })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Monthly consumption */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Consum Mensual Estimat *</label>
                  <input
                    type="number"
                    min={0}
                    value={newProd.consumMensual}
                    onChange={(e) => setNewProd({ ...newProd, consumMensual: Number(e.target.value) })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Data de Caducitat (Si té)</label>
                  <input
                    type="date"
                    value={newProd.caducidad}
                    onChange={(e) => setNewProd({ ...newProd, caducidad: e.target.value })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Lot ID */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Número de Lot / Fabricació</label>
                  <input
                    type="text"
                    value={newProd.lot}
                    onChange={(e) => setNewProd({ ...newProd, lot: e.target.value })}
                    placeholder="Ex: LOT-E3200"
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Expedient contract code */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 font-mono">Codi de l'Expedient de Contracte (Licitació)</label>
                  <input
                    type="text"
                    value={newProd.expedient}
                    onChange={(e) => setNewProd({ ...newProd, expedient: e.target.value })}
                    placeholder="Ex: EXP-CONTRAT-2025-HOSPITAL"
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Contract Start date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Inici de Contracte Expedient</label>
                  <input
                    type="date"
                    value={newProd.dataIniciContracte}
                    onChange={(e) => setNewProd({ ...newProd, dataIniciContracte: e.target.value })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Contract End date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Finalització de Contracte Expedient</label>
                  <input
                    type="date"
                    value={newProd.dataFinalContracte}
                    onChange={(e) => setNewProd({ ...newProd, dataFinalContracte: e.target.value })}
                    className="w-full text-xs mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Observe */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700">Observacions de Subministrament / Recomanacions</label>
                  <textarea
                    rows={2}
                    value={newProd.observacions}
                    onChange={(e) => setNewProd({ ...newProd, observacions: e.target.value })}
                    placeholder="Detalls addicionals rellevants sobre licitadors, contactes, preus de licitació o cura física de manipulació..."
                    className="w-full text-xs mt-1 border border-slate-300 rounded-sm p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-slate-100 cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm text-white bg-blue-600 hover:bg-blue-700 shadow-2xs cursor-pointer"
                >
                  Confirmar Introducció
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
