
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Layout, Calendar, Users, ShoppingBag, Megaphone, Settings, Bell, Menu, X, FileText, HelpCircle, DollarSign } from 'lucide-react';
import UserMenu from '../user/UserMenu';



import { useNotifications } from '../../hooks/useNotifications';
import InstallPrompt from '../common/InstallPrompt';

const NavBar = () => {
    const { theme } = useTheme();
    const { notifications } = useNotifications(); // Use Hook
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const navItems = [
        { path: '/', label: 'Home', icon: Layout },
        { path: '/calendar', label: 'Calendario', icon: Calendar },
        { path: '/directory', label: 'Directorio', icon: Users },
        { path: '/rate-card', label: 'Tarifario', icon: ShoppingBag },
        { path: '/projects', label: 'Proyectos', icon: Megaphone },
        { path: '/billing', label: 'Facturación', icon: DollarSign },
        { path: '/reports', label: 'Reportes', icon: FileText },
        { path: '/settings', label: 'Configuración', icon: Settings },
        { path: '/help', label: 'Ayuda', icon: HelpCircle },
    ];

    return (
        <div className={`w-full h-16 ${theme.sidebarBg} backdrop-blur-xl border-b border-white/10 flex items-center px-6 justify-between z-50 fixed top-0 left-0`}>
            
            {/* Left: Logo & Time */}
            <div className="flex items-center gap-6">
                <div className="text-xs font-medium text-white/50 hidden md:block font-mono pl-4">
                    {currentTime.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} • <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            {/* Center: Navigation Pills */}
            <nav className="hidden md:flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/5">
                {navItems.map((item) => {
                   const shortcut = 
                     item.label === 'Home' ? 'H' : 
                     item.label === 'Calendario' ? 'A' :
                     item.label === 'Directorio' ? 'D' :
                     item.label === 'Tarifario' ? 'T' :
                     item.label === 'Proyectos' ? 'C' :
                     item.label === 'Reportes' ? 'R' :
                     item.label === 'Facturación' ? 'F' :
                     item.label === 'Configuración' ? 'S' : '';

                   return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={`${item.label} (${shortcut})`}
                        className={({ isActive }) => `
                            flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 group relative
                            ${isActive 
                                ? 'bg-white text-black shadow-lg shadow-white/10 scale-105' 
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        <item.icon size={14} />
                        <span>{item.label}</span>
                    </NavLink>
                   );
                })}
            </nav>

            {/* Right: Actions & User */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <NavLink
                        to="/notifications" 
                        className={({ isActive }) => `relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${isActive ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    >
                        <Bell size={20} />
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="absolute top-2 right-2.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-black/50"></span>
                            </span>
                        )}
                    </NavLink>
                </div>
                
                <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                
                <InstallPrompt />

                <div className="hidden md:block">
                    <UserMenu />
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-16 bg-black/95 backdrop-blur-xl z-40 md:hidden flex flex-col p-6 animate-in slide-in-from-right-10 duration-200">
                    <div className="flex flex-col gap-2">
                         {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-bold transition-all duration-300
                                    ${isActive 
                                        ? `bg-gradient-to-r from-[${theme.accent}]/20 to-transparent text-[${theme.accent}] border border-[${theme.accent}]/20` 
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                <item.icon size={24} />
                                <span>{item.label}</span>
                            </NavLink>
                         ))}
                    </div>
                    
                    <div className="mt-auto border-t border-white/10 pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                <span className="font-bold text-xl">U</span>
                            </div>
                            <div>
                                <p className="font-bold text-white">Usuario Demo</p>
                                <p className="text-sm text-white/50">CTO</p>
                            </div>
                        </div>
                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-red-400 flex items-center justify-center gap-2">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavBar;
