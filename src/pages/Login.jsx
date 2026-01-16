
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
    const { login, setSecurityPin } = useAuth();
    // Local state for the login flow
    // 0: Login Form, 1: Pin Setup (if needed)
    const [step, setStep] = useState(0); 
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    
    // Custom internal login wrapper to avoid triggering global auth switch until ready
    const validateCreds = (e) => {
        e.preventDefault();
        setError('');
        if (username === 'Euge' && password === '2222') {
             const hasPinStored = localStorage.getItem('security_pin');
             if (!hasPinStored) {
                 setStep(1);
             } else {
                 login(username, password);
             }
        } else {
             setError('Credenciales incorrectas');
        }
    };

    const handlePinSave = (e) => {
        e.preventDefault();
        setError('');
        if (newPin.length !== 4) {
            setError('El PIN debe tener 4 dígitos');
            return;
        }
        if (newPin !== confirmPin) {
            setError('Los PINs no coinciden');
            return;
        }
        
        setSecurityPin(newPin);
        // Now trigger the actual login to enter app
        // We know creds were valid from step 0.
        // We call the context login to set isAuthenticated=true
        // But wait, context.login checks creds again. So we just pass them.
        login(username, password);
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

                    {step === 0 ? (
                        <form onSubmit={validateCreds} className="space-y-5">
                            <h2 className="text-xl font-bold text-white text-center mb-6">Iniciar Sesión</h2>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Usuario</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 text-white/30" size={18} />
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                                        placeholder="Euge"
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
                                        placeholder="••••"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

                            <button type="submit" className="w-full bg-[#E8A631] hover:bg-[#d49425] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 mt-2">
                                Acceder <ArrowRight size={18} />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePinSave} className="space-y-5 animate-in slide-in-from-right duration-300">
                             <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 text-[#E8A631]">
                                    <ShieldCheck size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Configurar PIN</h2>
                                <p className="text-white/50 text-sm mt-2 leading-relaxed">
                                    Define un código de seguridad de 4 dígitos.<br/>
                                    Lo necesitarás para gestionar <b>Copias de Seguridad</b>.
                                </p>
                             </div>

                             <div className="space-y-4">
                                <input 
                                    type="password" 
                                    maxLength={4}
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-[#E8A631] transition-all placeholder:text-white/10 placeholder:text-sm placeholder:tracking-normal font-mono"
                                    placeholder="PIN"
                                />
                                <input 
                                    type="password" 
                                    maxLength={4}
                                    value={confirmPin}
                                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-4 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-[#E8A631] transition-all placeholder:text-white/10 placeholder:text-sm placeholder:tracking-normal font-mono"
                                    placeholder="Confirmar"
                                />
                             </div>

                             {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

                             <button type="submit" className="w-full bg-[#E8A631] hover:bg-[#d49425] text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2">
                                Guardar y Entrar <ArrowRight size={18} />
                             </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
