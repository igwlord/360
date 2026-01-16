
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserMenu = () => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-white/10 transition-colors border border-transparent hover:border-white/5 active:scale-95 duration-200"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-white leading-none mb-0.5">Hola, {user.username}</p>
                    <p className="text-[10px] text-white/50 leading-none">Admin</p>
                </div>
                <ChevronDown size={14} className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`absolute right-0 top-full mt-2 w-56 ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[60] animate-in slide-in-from-top-2 fade-in duration-200`}>
                    
                    <div className="px-3 py-2 border-b border-white/5 mb-2">
                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Cuenta</p>
                        <div className="flex items-center gap-2 text-white">
                             <User size={14} /> <span>{user.username}</span>
                        </div>
                    </div>

                    <button onClick={() => { navigate('/settings'); setIsOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-sm text-left text-white/80 hover:text-white transition-colors">
                        <Settings size={16} /> Configuración & Datos
                    </button>

                    <div className="my-2 border-t border-white/5"></div>

                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/20 text-sm text-left text-red-200 hover:text-red-100 transition-colors">
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
