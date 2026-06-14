import React, { useState } from 'react';
import { AjusteStock } from '../types';
import { History, Search, ArrowRight, TrendingUp, TrendingDown, ClipboardList, Calendar, ShieldCheck } from 'lucide-react';

interface AjustesInventarioProps {
  ajustes: AjusteStock[];
  residenciaSeleccionadaId: string;
}

export default function AjustesInventario({ ajustes, residenciaSeleccionadaId }: AjustesInventarioProps) {
  const [search, setSearch] = useState('');

  // Filter adjustments by selected tenure and search keywords
  const filteredAjustes = ajustes
    .filter((aj) => aj.residenciaId === residenciaSeleccionadaId)
    .filter((aj) => {
      const query = search.toLowerCase();
      return (
        aj.productoNom.toLowerCase().includes(query) ||
        aj.motiu.toLowerCase().includes(query) ||
        aj.usuari.toLowerCase().includes(query)
      );
    });

  return (
    <div id="ajustes-inventario-container" className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-950 flex items-center gap-2 uppercase tracking-wide">
            <History className="h-5 w-5 text-indigo-600 animate-spin-slow" />
            Auditoria i Històric de Modificacions Manuals (Ajustes de Stock)
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            Traçabilitat estricta requerida per inspecció sanitària. Cada modificació de stock manual queda signada i gravada inalterable.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-405" />
          <input
            type="text"
            placeholder="Cercar per producte, motiu o signatari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-xs border border-slate-200 rounded-sm outline-none focus:ring-1 focus:ring-indigo-505"
          />
        </div>
      </div>

      {/* Timeline Layout */}
      <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
        {filteredAjustes.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-medium italic flex flex-col justify-center items-center gap-2">
            <ShieldCheck className="h-10 w-10 text-gray-250" />
            No hi ha cap correcció manual registrada amb aquests criteris per aquesta residència.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAjustes.map((aj) => {
              const diff = aj.estocNou - aj.estocAnterior;
              const isGain = diff >= 0;

              return (
                <div key={aj.id} className="p-5 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Left Column: Product & Reason */}
                  <div className="space-y-1">
                    <span className="text-[10px] bg-indigo-50 text-indigo-805 border border-indigo-150 px-2 py-0.5 rounded-sm font-bold uppercase font-mono">
                      AUDIT_LOG_SIG
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{aj.productoNom}</h4>
                    <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-150 p-2.5 rounded-sm max-w-xl">
                      "{aj.motiu}"
                    </p>
                    
                    <div className="flex items-center gap-3.5 text-[10.5px] text-gray-400 mt-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(aj.data).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <span>| Realitzat per: <strong className="text-slate-700">{aj.usuari}</strong></span>
                    </div>
                  </div>

                  {/* Right Column: Comparative Counts Difference */}
                  <div className="flex items-center gap-4 whitespace-nowrap md:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Existències</div>
                      <div className="font-mono text-xs flex items-center gap-1 font-semibold text-slate-500 mt-0.5">
                        <span>{aj.estocAnterior}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                        <span>{aj.estocNou}</span>
                      </div>
                    </div>

                    <div className={`py-2 px-3.5 rounded-sm border font-bold flex items-center gap-1.5 shadow-2xs ${
                      isGain 
                        ? 'bg-blue-50 text-blue-800 border-blue-200' 
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      {isGain ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-blue-700" />
                          <span>+{diff} unitats</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-700" />
                          <span>{diff} unitats</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
