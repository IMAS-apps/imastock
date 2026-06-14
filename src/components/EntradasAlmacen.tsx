import React, { useState } from 'react';
import { Producto, EntradaStock, Rol, AjusteStock } from '../types';
import { PackageOpen, Receipt, FileText, User, PlusCircle, Calendar, Link, Check, CheckCircle, Trash } from 'lucide-react';

interface EntradasAlmacenProps {
  entradas: EntradaStock[];
  productos: Producto[];
  rolActual: Rol;
  residenciaSeleccionadaId: string;
  onAddEntrada: (entrada: EntradaStock) => void;
  onUpdateProductos: (newProductos: Producto[]) => void;
  onAddAjuste: (ajuste: AjusteStock) => void;
  nombreUsuarioActual: string;
}

export default function EntradasAlmacen({
  entradas,
  productos,
  rolActual,
  residenciaSeleccionadaId,
  onAddEntrada,
  onUpdateProductos,
  onAddAjuste,
  nombreUsuarioActual,
}: EntradasAlmacenProps) {
  const [nAlbaran, setNAlbaran] = useState('');
  const [proveedor, setProveedor] = useState('ABS S.A.');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidad, setCantidad] = useState(25);
  const [urlDocumento, setUrlDocumento] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Active products in selected Residencia
  const activeProducts = productos.filter((p) => p.residenciaId === residenciaSeleccionadaId && p.aprobado);

  // Filter dockets by selected Residencia
  const filteredEntradas = entradas.filter((e) => e.residenciaId === residenciaSeleccionadaId);

  // Helper simulated scan action
  const simulateScanAlbaran = () => {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    setUrlDocumento(`https://imastock.org/documents/albaran_${randomId}.pdf`);
  };

  const handleRegisterAlbaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nAlbaran.trim() || !selectedProductId) return;

    const targetProduct = productos.find((p) => p.id === selectedProductId);
    if (!targetProduct) return;

    // Build entry
    const entryRecord: EntradaStock = {
      id: `ent-gen-${Date.now()}`,
      residenciaId: residenciaSeleccionadaId,
      nAlbaran: nAlbaran.trim(),
      proveedor: proveedor,
      fecha: new Date().toISOString(),
      urlDocumento: urlDocumento || 'Simulado digitalizado sense PDF',
      productoId: selectedProductId,
      cantidad: Number(cantidad),
    };

    // 1. Save entry
    onAddEntrada(entryRecord);

    // 2. Add stock to product
    const updatedProducts = productos.map((p) => {
      if (p.id === selectedProductId) {
        return { ...p, estocActual: p.estocActual + Number(cantidad) };
      }
      return p;
    });
    onUpdateProductos(updatedProducts);

    // 3. Register manual adjustment log for audit
    const auditRecord: AjusteStock = {
      id: `aj-${Date.now()}`,
      residenciaId: residenciaSeleccionadaId,
      productoId: selectedProductId,
      productoNom: targetProduct.nom,
      estocAnterior: targetProduct.estocActual,
      estocNou: targetProduct.estocActual + Number(cantidad),
      motiu: `Entrada física de stock amb Albarà N°: ${nAlbaran.trim()} | Proveïdor: ${proveedor}`,
      data: new Date().toISOString(),
      usuari: `${nombreUsuarioActual} (${rolActual})`,
    };
    onAddAjuste(auditRecord);

    // Reset forms
    setNAlbaran('');
    setSelectedProductId('');
    setCantidad(25);
    setUrlDocumento('');
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  return (
    <div id="entries-albaranes-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Albaran Scan Inputs Form */}
      <div className="lg:col-span-1 bg-white p-6 rounded-sm border border-slate-200 shadow-sm space-y-4 h-fit">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-105">
          <Receipt className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">Registre d'Albarà i Recepció</h3>
            <p className="text-slate-400 text-[11px] mt-0.5">Increment d'existències certificades per albarà adjunt.</p>
          </div>
        </div>

        {successToast && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-sm text-xs font-semibold flex items-center gap-2 animate-bounce">
            <Check className="h-4 w-4 text-blue-600 bg-white shadow-2xs rounded-sm p-0.5" />
            <div>¡Albarà registrat completament! S'ha incrementat el stock computat correctament.</div>
          </div>
        )}

        <form onSubmit={handleRegisterAlbaran} className="space-y-4">
          {/* Supplier Name select */}
          <div>
            <label className="block text-xs font-semibold text-gray-650 mb-1">Empresa Proveïdora Licitada *</label>
            <select
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none bg-white font-medium"
            >
              <option value="ABS S.A.">ABS S.A. (Distribuidor Sanitarios)</option>
              <option value="Nestlé Healthcare">Nestlé Healthcare (Dietas & Nutrición)</option>
              <option value="Textiles Catalana SL">Textiles Catalana SL (Sábanas & Uniformes)</option>
              <option value="FarmaServicios S.A.">FarmaServicios S.A.</option>
              <option value="Paper & Ofix SL">Paper & Ofix SL</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Albaran Reference */}
            <div>
              <label className="block text-xs font-semibold text-gray-655 mb-1">Codi Albarà *</label>
              <input
                type="text"
                required
                value={nAlbaran}
                onChange={(e) => setNAlbaran(e.target.value)}
                placeholder="Ex: AL-7729"
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none font-mono"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-gray-655 mb-1">Unitats Reincorporades *</label>
              <input
                type="number"
                min={1}
                required
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none font-bold text-center"
              />
            </div>
          </div>

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-650 mb-1">Artícul / Producte catalogat *</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none bg-white font-medium"
            >
              <option value="">-- Tria de l'Inventari --</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} (Estoc general actual: {p.estocActual})
                </option>
              ))}
            </select>
          </div>

          {/* Digitized PDF Link Scanner */}
          <div className="bg-slate-55 border border-slate-100 p-3.5 rounded-lg space-y-2">
            <span className="block text-xs font-semibold text-gray-655 uppercase">Digitalització de Doc (PDF / Imatge)</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: https://imastock.org/doc.pdf"
                value={urlDocumento}
                onChange={(e) => setUrlDocumento(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-1.5 text-xs outline-none"
              />
              <button
                type="button"
                onClick={simulateScanAlbaran}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 border text-[11px] px-2.5 rounded-sm font-bold cursor-pointer transition-colors whitespace-nowrap"
              >
                Escanejar Doc
              </button>
            </div>
            {urlDocumento && (
              <span className="text-[10px] text-blue-600 block leading-tight font-mono flex items-center gap-1">
                <Check className="h-3 w-3 inline" /> Escanejat complet: albaran_{urlDocumento.substring(urlDocumento.lastIndexOf('_') + 1)}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={rolActual === 'Coordinador de planta' || !nAlbaran.trim() || !selectedProductId}
            className={`w-full py-2.5 px-4 font-bold text-xs uppercase tracking-wider rounded-sm text-white flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors ${
              (rolActual !== 'Coordinador de planta' && nAlbaran.trim() && selectedProductId)
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Signar Entrada i Sumar al Stock
          </button>
        </form>
      </div>

      {/* Dockets Table details */}
      <div className="lg:col-span-2 bg-white p-6 rounded-sm border border-slate-200 shadow-sm flex flex-col h-[520px]">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">Històric d'Albarans Entrants i Entregues</h3>
          </div>
          <span className="text-[10px] text-gray-405 bg-slate-50 border border-slate-200 rounded-sm px-2 py-0.5 font-mono">
            {filteredEntradas.length} registres
          </span>
        </div>

        <div className="overflow-y-auto mt-4 pr-1 flex-1">
          {filteredEntradas.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center text-gray-400 italic text-sm">
              <PackageOpen className="h-10 w-10 text-gray-250 mb-2" />
              No s'han incorporat entrades d'albarans computats en aquesta residència pròpia encara.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntradas.map((item) => {
                const targetProd = productos.find((p) => p.id === item.productoId);
                return (
                  <div
                    key={item.id}
                    className="p-4 border border-slate-100 hover:border-blue-200 rounded-sm bg-slate-50/50 hover:bg-blue-50/5 transition-all flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Receipt className="h-4 w-4 text-blue-600" /> Albarà N°: <span className="font-mono text-blue-700">{item.nAlbaran}</span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        S'han sumat: <strong className="text-slate-950">+{item.cantidad} unitats</strong> de{' '}
                        <strong className="text-slate-800">
                          {targetProd ? targetProd.nom : 'Artícul desconegut'}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2.5 mt-2.5 text-[10px] text-gray-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.fecha).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span>| Proveïdor: {item.proveedor}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 text-right">
                      <span className="text-xs bg-blue-50 text-blue-800 font-bold px-2 py-1 rounded-sm border border-blue-200 shadow-3xs whitespace-nowrap">
                        Reforçat +{item.cantidad}
                      </span>
                      {item.urlDocumento && item.urlDocumento.startsWith('http') ? (
                        <a
                          href={item.urlDocumento}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-0.5"
                        >
                          <Link className="h-2.5 w-2.5" /> Veure PDF Albarà
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">No digitalitzat</span>
                      )}
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
