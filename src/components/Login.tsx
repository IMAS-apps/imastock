import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { KeyRound, Mail, User, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up with custom metadata (nombre)
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre: nombre || email.split('@')[0],
            },
          },
        });

        if (signUpError) throw signUpError;
        
        if (data.user && data.session === null) {
          setMessage('Registro con éxito. Por favor, comprueba tu email para confirmar la cuenta.');
        } else {
          setMessage('Usuario registrado e iniciado sesión automáticamente.');
        }
      } else {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'Ha ocurrido un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
        {/* Header decoration */}
        <div className="bg-blue-600 px-6 py-8 text-center text-white">
          <div className="mx-auto w-12 h-12 bg-white/10 flex items-center justify-center rounded-sm font-bold text-2xl mb-3">
            IS
          </div>
          <h2 className="text-2xl font-bold tracking-tight">IMA<span className="text-blue-200">Stock</span></h2>
          <p className="text-xs text-blue-100 mt-1 uppercase tracking-widest font-semibold">
            Acceso al Panel de Control
          </p>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800">
              {isSignUp ? 'Crear una Cuenta Nueva' : 'Iniciar Sesión'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isSignUp 
                ? 'Introduce tus datos para registrarte en el sistema.' 
                : 'Accede a la red de inventario de residencias.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-sm text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-sm text-xs">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nombre Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="pl-9 pr-3 py-2 text-sm w-full bg-slate-50 border border-slate-300 rounded-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/25 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Correo Electrónico</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@imastock.org"
                  className="pl-9 pr-3 py-2 text-sm w-full bg-slate-50 border border-slate-300 rounded-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/25 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-3 py-2 text-sm w-full bg-slate-50 border border-slate-300 rounded-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/25 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm text-sm transition-all focus:ring-2 focus:ring-blue-500/25 outline-none flex justify-center items-center gap-2 cursor-pointer shadow-sm disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <span>{isSignUp ? 'Registrarse' : 'Iniciar Sesión'}</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 text-center text-xs">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
