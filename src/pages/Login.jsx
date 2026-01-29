import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';


const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { error: authError } = await login(email, password);
        
        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            // Success handled by AuthContext listener usually, but we can navigate
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
             <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px]"></div>

             <div className="relative z-10 w-full max-w-md p-8">
                 <div className="mb-8 text-center">
                     <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl backdrop-blur-md">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E8A631] to-yellow-500 shadow-[0_0_20px_rgba(232,166,49,0.5)]"></div>
                     </div>
                     <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Bienvenido</h1>
                     <p className="text-white/40">360 Retail Media Command Center</p>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
                     {error && (
                         <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm text-center">
                             {error}
                         </div>
                     )}

                     <div className="space-y-4">
                         <div className="relative group">
                             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#E8A631] transition-colors" size={20} />
                             <input 
                                 type="email" 
                                 placeholder="Email Corporativo" 
                                 value={email}
                                 onChange={e => setEmail(e.target.value)}
                                 className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8A631]/50 focus:bg-black/60 transition-all"
                                 required
                             />
                         </div>
                         <div className="relative group">
                             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#E8A631] transition-colors" size={20} />
                             <input 
                                 type="password" 
                                 placeholder="Contraseña" 
                                 value={password}
                                 onChange={e => setPassword(e.target.value)}
                                 className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8A631]/50 focus:bg-black/60 transition-all"
                                 required
                             />
                         </div>
                     </div>

                     <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-[#E8A631] hover:bg-[#d69628] text-black font-bold rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                     >
                         {loading ? <Loader2 className="animate-spin" /> : <>Ingresar <ArrowRight size={18}/></>}
                     </button>
                 </form>

                 <p className="text-center text-white/20 text-xs mt-8">
                     © 2026 Retail Media Inc. Access Restricted.
                 </p>
             </div>
        </div>
    );
};

export default Login;
