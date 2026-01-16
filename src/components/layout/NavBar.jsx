
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Layout, Calendar, Users, ShoppingBag, Megaphone, Settings, Bell, Menu, FileText } from 'lucide-react';
import UserMenu from '../user/UserMenu';
import { useData } from '../../context/DataContext';

const NavBar = () => {
    const { theme } = useTheme();
    const { notifications } = useData(); // Destructure setNotifications
    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const navItems = [
        { path: '/', label: 'Home', icon: Layout },
        { path: '/calendar', label: 'Calendario', icon: Calendar },
        { path: '/directory', label: 'Directorio', icon: Users },
        { path: '/rate-card', label: 'Tarifario', icon: ShoppingBag },
        { path: '/campaigns', label: 'Campañas', icon: Megaphone },
        { path: '/reports', label: 'Reportes', icon: FileText },
        { path: '/settings', label: 'Configuración', icon: Settings },
    ];

    return (
        <div className={`w-full h-16 ${theme.sidebarBg} backdrop-blur-xl border-b border-white/10 flex items-center px-6 justify-between z-50 fixed top-0 left-0`}>
            
            {/* Left: Logo & Time */}
            <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-[#E8A631] to-orange-600 rounded-lg flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-orange-500/20">
                        Euge
                    </div>
                </div>
                <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                <div className="text-xs font-medium text-white/50 hidden md:block font-mono">
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
                     item.label === 'Campañas' ? 'C' :
                     item.label === 'Reportes' ? 'R' :
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
                
                <div className="h-6 w-px bg-white/10"></div>
                
                <UserMenu />
            </div>
        </div>
    );
};

export default NavBar;
