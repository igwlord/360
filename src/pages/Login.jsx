
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const { error } = await login(email, password);
             if (error) throw error;
        } catch (err) {
            console.error(err);
            // Translate common Supabase errors
            let msg = err.message;
            if (msg === 'Invalid login credentials') msg = 'Email o contraseña incorrectos';
            if (msg === 'Email not confirmed') msg = 'Debes confirmar tu email antes de ingresar';
            
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden font-['Inter']">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-900/20 rounded-full blur-[120px]" />
            
            <div className="w-full max-w-md relative z-10 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Retail Media 360</h1>
                    <p className="text-white/40">Command Center</p>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    {/* Glass Shine */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

                    <form onSubmit={handleLogin} className="space-y-5">
                        <h2 className="text-xl font-bold text-white text-center mb-6">Iniciar Sesión</h2>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-white/30" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                                    placeholder="usuario@ejemplo.com"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-white/30" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

                        <button type="submit" disabled={loading} className="w-full bg-[#E8A631] hover:bg-[#d49425] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 mt-2">
                            {loading ? 'Accediendo...' : 'Ingresar'} <ArrowRight size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
