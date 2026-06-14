import { useState, useEffect } from 'react';
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
import {
  Residencia,
  Producto,
  LimitePlanta,
  Pedido,
  EntradaStock,
  AjusteStock,
  UniformeEntrega,
  Rol,
  CampoVisibilidadConfig,
  Perfil
} from './types';
import StockGeneral from './components/StockGeneral';
import PedidosPlanta from './components/PedidosPlanta';
import ModuloUniformes from './components/ModuloUniformes';
import EntradasAlmacen from './components/EntradasAlmacen';
import AjustesInventario from './components/AjustesInventario';
import Login from './components/Login';
import GestionUsuarios from './components/GestionUsuarios';

import { supabase, isConfigured } from './supabaseClient';
import {
  getResidencias,
  getProductos,
  getLimitesPlanta,
  getPedidos,
  getEntradas,
  getAjustes,
  getEntregaUniformes,
  getVisibilidadConfig,
  getPerfilById,
  upsertProducto,
  upsertProductos,
  upsertPedido,
  upsertPedidos,
  insertEntrada,
  insertAjuste,
  insertEntregaUniforme,
  upsertVisibilidadConfig
} from './dataService';

import {
  Building2,
  Users,
  Package,
  ClipboardCheck,
  Shirt,
  FileText,
  History,
  Grid,
  Settings,
  Bell,
  Check,
  User,
  Info,
  Layers,
  Sparkles,
  ToggleLeft,
  LogOut
} from 'lucide-react';

export default function App() {
  // --- STATE CORE LOADED FROM LOCAL STORAGE OR SUPABASE ---
  const [residencias, setResidencias] = useState<Residencia[]>(INITIAL_RESIDENCIAS);
  const [productos, setProductos] = useState<Producto[]>(INITIAL_PRODUCTOS);
  const [limitesPlanta, setLimitesPlanta] = useState<LimitePlanta[]>(INITIAL_LIMITES_PLANTA);
  const [pedidos, setPedidos] = useState<Pedido[]>(INITIAL_PEDIDOS);
  const [entradas, setEntradas] = useState<EntradaStock[]>([]);
  const [ajustes, setAjustes] = useState<AjusteStock[]>(INITIAL_AJUSTES);
  const [entregaUniformes, setEntregaUniformes] = useState<UniformeEntrega[]>(INITIAL_UNIFORMES);
  const [visibilidadConfig, setVisibilidadConfig] = useState<Record<string, CampoVisibilidadConfig>>(INITIAL_VISIBILIDAD_ROLE);
  const [loading, setLoading] = useState(true);

  // --- SUPABASE AUTH STATE ---
  const [session, setSession] = useState<any>(null);
  const [perfilUsuario, setPerfilUsuario] = useState<Perfil | null>(null);

  // --- INTERACTIVE SIMULATION SELECTIONS ---
  const [residenciaSeleccionadaId, setResidenciaSeleccionadaId] = useState<string>('res-1');
  const [vistaActiva, setVistaActiva] = useState<'stock' | 'pedidos' | 'entradas' | 'uniformes' | 'ajustes' | 'admin-setup' | 'usuarios'>('stock');

  // --- ASYNC DATA LOADING & AUTH LISTENERS ---
  useEffect(() => {
    if (!isConfigured) {
      // Auto-assign mock profile for demo when Supabase is not configured
      setPerfilUsuario({
        id: 'mock-user-id',
        email: 'admin@imastock.org',
        nombre: 'Tomàs Català (Demo)',
        rol: 'Administrador',
        residenciaIds: ['res-1', 'res-2', 'res-3'],
        plantaAsignada: ''
      });
      setSession({ user: { id: 'mock-user-id' } });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      if (activeSession?.user) {
        loadUserProfile(activeSession.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadUserProfile(newSession.user.id);
      } else {
        setPerfilUsuario(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    setLoading(true);
    const profile = await getPerfilById(userId);
    setPerfilUsuario(profile);
    setLoading(false);
  }

  // Load other tables data when user profile is loaded
  useEffect(() => {
    if (!perfilUsuario) return;
    async function loadData() {
      try {
        const [res, prod, lim, ped, ent, aj, uni, vis] = await Promise.all([
          getResidencias(),
          getProductos(),
          getLimitesPlanta(),
          getPedidos(),
          getEntradas(),
          getAjustes(),
          getEntregaUniformes(),
          getVisibilidadConfig()
        ]);
        setResidencias(res);
        setProductos(prod);
        setLimitesPlanta(lim);
        setPedidos(ped);
        setEntradas(ent);
        setAjustes(aj);
        setEntregaUniformes(uni);
        setVisibilidadConfig(vis);
      } catch (error) {
        console.error('Failed to load data from database:', error);
      }
    }
    loadData();
  }, [perfilUsuario]);

  // --- SAVE STATES ON UPDATES (FALLBACK SYNC) ---
  useEffect(() => { saveLocalState('residencias', residencias); }, [residencias]);
  useEffect(() => { saveLocalState('productos', productos); }, [productos]);
  useEffect(() => { saveLocalState('limites_planta', limitesPlanta); }, [limitesPlanta]);
  useEffect(() => { saveLocalState('pedidos', pedidos); }, [pedidos]);
  useEffect(() => { saveLocalState('entradas', entradas); }, [entradas]);
  useEffect(() => { saveLocalState('ajustes', ajustes); }, [ajustes]);
  useEffect(() => { saveLocalState('entrega_uniformes', entregaUniformes); }, [entregaUniformes]);
  useEffect(() => { saveLocalState('visibilidad_config', visibilidadConfig); }, [visibilidadConfig]);

  // Current user role and profile properties
  const rolActual: Rol = perfilUsuario?.rol || 'Coordinador de planta';
  const usuarioActual = perfilUsuario || { email: '', nombre: '', plantaAsignada: '' };

  // Filter residencias permitted for this user
  const residenciasPermitidas = perfilUsuario && perfilUsuario.rol !== 'Administrador'
    ? residencias.filter(r => perfilUsuario.residenciaIds.includes(r.id))
    : residencias;

  const residenciaSeleccionada = residenciasPermitidas.find(r => r.id === residenciaSeleccionadaId) || residenciasPermitidas[0] || residencias[0];

  // Auto-switch selected residence if not allowed
  useEffect(() => {
    if (residenciasPermitidas.length > 0 && !residenciasPermitidas.some(r => r.id === residenciaSeleccionadaId)) {
      setResidenciaSeleccionadaId(residenciasPermitidas[0].id);
    }
  }, [residenciasPermitidas, residenciaSeleccionadaId]);

  // Role info details to guide the reviewer
  const getRoleBadgeColor = (rol: Rol) => {
    switch (rol) {
      case 'Administrador': return 'bg-purple-600 text-white';
      case 'Administrativo': return 'bg-blue-600 text-white';
      case 'Personal de almacén': return 'bg-amber-600 text-white';
      case 'Coordinador de planta': return 'bg-indigo-600 text-white';
    }
  };

  const getRoleDescription = (rol: Rol) => {
    switch (rol) {
      case 'Administrador':
        return 'Control total dels centres. Pot autoritzar excesos de pedidos, aprovar productes fets per almaceneros i canviar la visibilitat de camps per rol.';
      case 'Administrativo':
        return 'Té capacitat d\'introduir stock (albarans), fer comandes, veure estadístiques i demanar licitacions.';
      case 'Personal de almacén':
        return 'Registra entrades i sortides ràpides inline. Quan crea un producte, queda "Pendent d\'aprovació" (ocult per a les plantes).';
      case 'Coordinador de planta':
        return 'Només veu les seves comandes i el stock simplificat de la seva planta. Fa comandes de planta i confirma recepció.';
    }
  };

  // State Handler modifiers with database sync
  const handleAddAjuste = async (nuevoAjuste: AjusteStock) => {
    setAjustes([nuevoAjuste, ...ajustes]);
    if (isConfigured) {
      await insertAjuste(nuevoAjuste);
    }
  };

  const handleAddEntregaUniforme = async (nuevaEntrega: UniformeEntrega) => {
    setEntregaUniformes([nuevaEntrega, ...entregaUniformes]);
    if (isConfigured) {
      await insertEntregaUniforme(nuevaEntrega);
    }
  };

  const handleAddEntrada = async (nuevaEntrada: EntradaStock) => {
    setEntradas([nuevaEntrada, ...entradas]);
    if (isConfigured) {
      await insertEntrada(nuevaEntrada);
    }
  };

  const handleUpdateProductos = async (newProductos: Producto[]) => {
    setProductos(newProductos);
    if (isConfigured) {
      const changed = newProductos.filter(newP => {
        const oldP = productos.find(p => p.id === newP.id);
        if (!oldP) return true;
        return JSON.stringify(oldP) !== JSON.stringify(newP);
      });
      if (changed.length > 0) {
        await upsertProductos(changed);
      }
    }
  };

  const handleUpdatePedidos = async (newPedidos: Pedido[]) => {
    setPedidos(newPedidos);
    if (isConfigured) {
      const changed = newPedidos.filter(newP => {
        const oldP = pedidos.find(p => p.id === newP.id);
        if (!oldP) return true;
        return JSON.stringify(oldP) !== JSON.stringify(newP);
      });
      if (changed.length > 0) {
        await upsertPedidos(changed);
      }
    }
  };

  const handleUpdateVisibilidadConfig = async (newConfig: Record<string, CampoVisibilidadConfig>) => {
    setVisibilidadConfig(newConfig);
    if (isConfigured) {
      for (const role of Object.keys(newConfig)) {
        if (JSON.stringify(newConfig[role]) !== JSON.stringify(visibilidadConfig[role])) {
          await upsertVisibilidadConfig(role, newConfig[role]);
        }
      }
    }
  };

  // Metrics calculators
  const itemsInResidencia = productos.filter(p => p.residenciaId === residenciaSeleccionadaId);
  const totalBajosMinimo = itemsInResidencia.filter(p => p.estocActual < p.estocMinim).length;
  const totalProximosMinimo = itemsInResidencia.filter(p => p.estocActual >= p.estocMinim && p.estocActual <= p.estocMinim * 1.15).length;
  const totalAprobacionesPendientes = itemsInResidencia.filter(p => !p.aprobado).length;
  const totalPedidosAbiertos = pedidos.filter(p => p.residenciaId === residenciaSeleccionadaId && p.estado !== 'Recibida / Cerrada').length;

  const handleLogout = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    } else {
      setSession(null);
      setPerfilUsuario(null);
    }
  };

  // --- RENDER LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 mt-4">Carregant aplicació...</p>
      </div>
    );
  }

  // --- RENDER LOGIN IF NOT AUTHENTICATED ---
  if (!session || !perfilUsuario) {
    return <Login />;
  }


  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans selection:bg-blue-100 antialiased flex flex-col">
      {/* Top Bar Logo and Residence Conmutator */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-xs">
        <div className="flex items-center gap-8 w-full justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div id="header-logo-badge" className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded-sm font-bold text-white shrink-0">IS</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              IMA<span className="text-blue-600">Stock</span>
            </span>
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ml-1">v1.2</span>
          </div>

          <div className="hidden md:flex items-center text-xs font-semibold text-slate-400 italic max-w-md line-clamp-1 uppercase tracking-wider">
            Gestor de magatzem d'Atenció Sociosanitària
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* User Profile Info & Logout */}
          <div className="text-right hidden md:flex items-center gap-3 border-r border-slate-200 pr-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Usuari</div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-end">
                <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} title={isConfigured ? 'Supabase Activa' : 'LocalStorage'}></span>
                {usuarioActual.nombre}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-sm cursor-pointer transition-all border border-slate-200"
              title="Tancar sessió"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Residència Actual</div>
            <div className="text-xs font-bold text-slate-800">{residenciaSeleccionada.nombre}</div>
          </div>

          <div className="relative w-44 sm:w-64">
            <select
              value={residenciaSeleccionadaId}
              onChange={(e) => {
                setResidenciaSeleccionadaId(e.target.value);
                setVistaActiva('stock');
              }}
              className="pl-3 pr-8 py-1.5 w-full text-xs bg-white border border-slate-300 rounded-sm text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500/25 cursor-pointer transition-all appearance-none"
            >
              {residenciasPermitidas.map((res) => (
                <option key={res.id} value={res.id} className="text-slate-900 font-medium">
                  🏢 {res.nombre}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </header>

      <section className="bg-slate-900 text-slate-100 px-6 py-3 border-b border-slate-950 shadow-inner flex items-center justify-between">
        <div className="w-full flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-blue-600 text-white uppercase">
              {rolActual}
            </span>
            <span className="text-slate-300">
              Sessió activa com a <strong>{usuarioActual.nombre}</strong> ({usuarioActual.email}).
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sortir
          </button>
        </div>
      </section>

      <section className="bg-white border-b border-slate-200 px-6 py-4 hidden sm:block">
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 border border-slate-200 border-l-4 border-l-red-500 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Mínims Crítics (Vermell)</div>
              <div className="text-2xl font-mono font-bold text-red-600">{totalBajosMinimo}</div>
            </div>
            <Bell className="h-5 w-5 text-red-400 animate-pulse" />
          </div>

          <div className="bg-white p-4 border border-slate-200 border-l-4 border-l-amber-500 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">Alerta Mínims (Groc)</div>
              <div className="text-2xl font-mono font-bold text-amber-600">{totalProximosMinimo}</div>
            </div>
            <Info className="h-5 w-5 text-amber-400" />
          </div>

          <div className="bg-white p-4 border border-slate-200 border-l-4 border-l-blue-500 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">Comandes Planta Obertes</div>
              <div className="text-2xl font-mono font-bold text-blue-600">{totalPedidosAbiertos}</div>
            </div>
            <ClipboardCheck className="h-5 w-5 text-blue-400" />
          </div>

          <div className="bg-white p-4 border border-slate-200 border-l-4 border-l-purple-500 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-0.5">Pendents de Validar</div>
              <div className="text-2xl font-mono font-bold text-purple-600">{totalAprobacionesPendientes}</div>
            </div>
            <Layers className="h-5 w-5 text-purple-400" />
          </div>
        </div>
      </section>

      {/* Main Interactive body area */}
      <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-6 flex flex-col md:flex-row gap-6">
        {/* Left Side Sidebar Navigation */}
        <nav className="w-full md:w-64 shrink-0 space-y-3">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Mòduls Operatius</span>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
            <button
              onClick={() => setVistaActiva('stock')}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-sm text-left transition-all cursor-pointer border ${vistaActiva === 'stock'
                  ? 'bg-blue-50 text-blue-700 font-bold border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`}
            >
              <Package className="h-4 w-4" />
              <span>Inventari i Alerta Colors</span>
            </button>

            <button
              onClick={() => setVistaActiva('pedidos')}
              className={`flex items-center justify-between px-4 py-2.5 text-xs md:text-sm font-semibold rounded-sm text-left transition-all cursor-pointer border ${vistaActiva === 'pedidos'
                  ? 'bg-blue-50 text-blue-700 font-bold border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`}
            >
              <span className="flex items-center gap-3">
                <ClipboardCheck className="h-4 w-4" />
                <span>Comandes de Planta</span>
              </span>
              {totalPedidosAbiertos > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold h-5 min-w-5 shrink-0 px-1.5 rounded-sm flex items-center justify-center">
                  {totalPedidosAbiertos}
                </span>
              )}
            </button>

            <button
              onClick={() => setVistaActiva('entradas')}
              disabled={rolActual === 'Coordinador de planta'}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-sm text-left transition-all cursor-pointer border ${rolActual === 'Coordinador de planta' ? 'opacity-40 cursor-not-allowed' : ''
                } ${vistaActiva === 'entradas'
                  ? 'bg-blue-50 text-blue-700 font-bold border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`}
            >
              <FileText className="h-4 w-4" />
              <span>Entrades i Albarans</span>
            </button>

            <button
              onClick={() => setVistaActiva('uniformes')}
              disabled={rolActual === 'Coordinador de planta'}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-sm text-left transition-all cursor-pointer border ${rolActual === 'Coordinador de planta' ? 'opacity-40 cursor-not-allowed' : ''
                } ${vistaActiva === 'uniformes'
                  ? 'bg-blue-50 text-blue-700 font-bold border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`}
            >
              <Shirt className="h-4 w-4" />
              <span>Lliurament d'Uniformes</span>
            </button>

            <button
              onClick={() => setVistaActiva('ajustes')}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-sm text-left transition-all cursor-pointer border ${vistaActiva === 'ajustes'
                  ? 'bg-blue-50 text-blue-700 font-bold border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`}
            >
              <History className="h-4 w-4" />
              <span>Logs / Auditories Internes</span>
            </button>
            {rolActual === 'Administrador' && (
              <div className="pt-4 border-t border-slate-200 space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Configuració</span>

                <button
                  onClick={() => setVistaActiva('admin-setup')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-xs md:text-sm font-semibold rounded-sm text-left transition-all cursor-pointer border ${vistaActiva === 'admin-setup'
                      ? 'bg-purple-50 text-purple-700 font-bold border-purple-200'
                      : 'text-purple-600 hover:text-purple-900 hover:bg-purple-50 border-transparent'
                    }`}
                >
                  <Settings className="h-4 w-4 text-purple-600" />
                  <span>Configurar Rol Camps</span>
                </button>

                <button
                  onClick={() => setVistaActiva('usuarios')}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-xs md:text-sm font-semibold rounded-sm text-left transition-all cursor-pointer border ${vistaActiva === 'usuarios'
                      ? 'bg-blue-50 text-blue-750 font-bold border-blue-200'
                      : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50 border-transparent'
                    }`}
                >
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Gestió d'Usuaris</span>
                </button>
              </div>
            )}
          </div>

          {/* Current selected residence data summary visual card */}
          <div className="bg-white p-4 rounded-sm border border-slate-200 text-slate-800 space-y-2.5 shadow-xs hidden md:block">
            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Inquilí Actiu</div>
            <div className="font-bold text-xs text-slate-900">{residenciaSeleccionada.nombre}</div>
            <div className="text-[11px] text-slate-500 leading-tight">
              📍 {residenciaSeleccionada.direccion}, {residenciaSeleccionada.codigoPostal} - {residenciaSeleccionada.ciudad}
            </div>
            <div className="pt-2.5 border-t border-slate-100 mt-1 flex justify-between text-[11px] font-mono text-slate-400">
              <span>Articles: {itemsInResidencia.length}</span>
              <span>Pendent apro: {totalAprobacionesPendientes}</span>
            </div>
          </div>
        </nav>

        {/* Right Side Rendering Pane */}
        <div className="flex-1 min-w-0">
          {vistaActiva === 'stock' && (
            <StockGeneral
              productos={productos}
              onUpdateProductos={handleUpdateProductos}
              onAddAjuste={handleAddAjuste}
              rolActual={rolActual}
              visibilidadConfig={visibilidadConfig}
              residenciaSeleccionadaId={residenciaSeleccionadaId}
              nombreUsuarioActual={usuarioActual.nombre}
            />
          )}

          {vistaActiva === 'pedidos' && (
            <PedidosPlanta
              pedidos={pedidos}
              productos={productos}
              limitesPlanta={limitesPlanta}
              rolActual={rolActual}
              plantaAsignadaUsuario={usuarioActual.plantaAsignada}
              residenciaSeleccionadaId={residenciaSeleccionadaId}
              onUpdatePedidos={handleUpdatePedidos}
              onUpdateProductos={handleUpdateProductos}
              nombreUsuarioActual={usuarioActual.nombre}
            />
          )}

          {vistaActiva === 'entradas' && (
            <EntradasAlmacen
              entradas={entradas}
              productos={productos}
              rolActual={rolActual}
              residenciaSeleccionadaId={residenciaSeleccionadaId}
              onAddEntrada={handleAddEntrada}
              onUpdateProductos={handleUpdateProductos}
              onAddAjuste={handleAddAjuste}
              nombreUsuarioActual={usuarioActual.nombre}
            />
          )}

          {vistaActiva === 'uniformes' && (
            <ModuloUniformes
              entregaUniformes={entregaUniformes}
              productos={productos}
              rolActual={rolActual}
              residenciaSeleccionadaId={residenciaSeleccionadaId}
              onAddEntregaUniforme={handleAddEntregaUniforme}
              onUpdateProductos={handleUpdateProductos}
              onAddAjuste={handleAddAjuste}
              nombreUsuarioActual={usuarioActual.nombre}
            />
          )}

          {vistaActiva === 'ajustes' && (
            <AjustesInventario
              ajustes={ajustes}
              residenciaSeleccionadaId={residenciaSeleccionadaId}
            />
          )}



          {vistaActiva === 'usuarios' && rolActual === 'Administrador' && (
            <GestionUsuarios residencias={residencias} />
          )}

          {vistaActiva === 'admin-setup' && rolActual === 'Administrador' && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Personalització de Llistats per Rol d'Usuari
                </h3>
                <p className="text-gray-500 text-xs mt-1">
                  Com a doc militar de direcció, pots decidir quins d'un total de 15 cambres del cens veu cada dret o rol en les seves respectives pantalles.
                </p>
              </div>

              {/* Roles columns editor checkboxes matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['Personal de almacén', 'Coordinador de planta'].map((roleToEdit) => {
                  const roleConfig = visibilidadConfig[roleToEdit];
                  if (!roleConfig) return null;

                  return (
                    <div key={roleToEdit} className="p-4 border border-gray-100 bg-slate-50 rounded-lg space-y-3">
                      <h4 className="font-bold text-slate-900 border-b border-gray-200 pb-2 flex justify-between items-center text-sm">
                        <span>Camps visibles per a: <strong className="text-purple-700">{roleToEdit}</strong></span>
                        <span className="text-[10px] bg-white border border-gray-200 px-2.5 py-0.5 rounded text-gray-500">
                          Catàleg Simplificat
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                        {Object.keys(roleConfig).map((fieldName) => {
                          const key = fieldName as keyof CampoVisibilidadConfig;
                          return (
                            <label key={key} className="flex items-center gap-2.5 text-xs text-gray-700 bg-white p-2 border border-gray-100 rounded hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={roleConfig[key]}
                                onChange={(e) => {
                                  // Update state directly inside dict
                                  const updatedRoleConfig = {
                                    ...roleConfig,
                                    [key]: e.target.checked
                                  };
                                  handleUpdateVisibilidadConfig({
                                    ...visibilidadConfig,
                                    [roleToEdit]: updatedRoleConfig
                                  });
                                }}
                                className="rounded text-purple-600 focus:ring-purple-500"
                              />
                              <span className="capitalize font-medium">{key === 'nom' ? 'Nom del Producte' : key === 'estocActual' ? 'Estoc Actual' : key === 'estocMinim' ? 'Estoc Mínim' : key === 'estocMaxim' ? 'Estoc Màxim' : key === 'dataIniciContracte' ? 'Inici Contracte' : key === 'dataFinalContracte' ? 'Fi Contracte' : key}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg text-xs text-purple-900 flex gap-2.5 leading-relaxed">
                <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h5 className="font-bold">Efecte instantani garantit:</h5>
                  <p className="mt-0.5 text-purple-800">
                    Proveu a desmarcar, per exemple, "Caducitat" o "Ubicació" del rol <strong>Coordinador de planta</strong> i després activeu aquest rol al tauler superior. Comprovareu que aquestes columnes desapareixen completament de les llistes per reforçar la claredat visual requerida per planta.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 px-6 text-center border-t border-slate-950 text-xs shrink-0">
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 IMAStock - Creat per a la xarxa de residències públiques de Gent Gran.</p>
          <div className="flex gap-4 text-[11px]">
            <span className={isConfigured ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              ● Base de dades: {isConfigured ? 'Supabase PG (Activa)' : 'LocalStorage (Simulado)'}
            </span>
            <span>Aïllat Multi-Tenant</span>
            <span>Estocs Automatitzats</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
