
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
// import { useData } from '../context/DataContext'; REMOVED
import { useNotifications } from '../hooks/useNotifications';
import { Bell, Filter, CheckCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react';

const NotificationsPage = () => {
    const { theme } = useTheme();
    const { notifications, markAsRead, clearAllNotifications } = useNotifications();
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'history'

    // Derived state
    const displayNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'history') return n.read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto pb-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className={`text-3xl font-bold ${theme.text} flex items-center gap-3`}>
                        <Bell className={theme.accent} /> Centro de Notificaciones
                    </h1>
                    <p className={`${theme.textSecondary} text-sm mt-2 max-w-xl`}>
                        Gestión centralizada de alertas, vencimientos y avisos del sistema.
                    </p>
                </div>
                <div className={`${theme.cardBg} px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2`}>
                    <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Pendientes:</span>
                    <span className={`text-lg font-bold ${unreadCount > 0 ? 'text-red-400' : 'text-green-400'}`}>{unreadCount}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
                {/* Sidebar Filter */}
                <div className={`col-span-1 ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-fit`}>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Vistas</h3>
                    <div className="space-y-2">
                        <button 
                            onClick={() => setFilter('all')}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filter === 'all' ? `${theme.accentBg} text-black font-bold border-transparent` : 'bg-transparent border-white/5 text-white/60 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span>Todos</span>
                            <span className="text-xs opacity-60 bg-black/10 px-2 py-0.5 rounded">{notifications.length}</span>
                        </button>
                        <button 
                            onClick={() => setFilter('unread')}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filter === 'unread' ? 'bg-white text-black font-bold border-transparent' : 'bg-transparent border-white/5 text-white/60 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span>No Leídos</span>
                            <span className="text-xs opacity-60 bg-black/10 px-2 py-0.5 rounded">{unreadCount}</span>
                        </button>
                        <button 
                            onClick={() => setFilter('history')}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filter === 'history' ? 'bg-white/10 text-white font-bold border-white/20' : 'bg-transparent border-white/5 text-white/60 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span>Historial</span>
                            <span className="text-xs opacity-60 bg-black/10 px-2 py-0.5 rounded">{notifications.filter(n => n.read).length}</span>
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Acciones</h3>
                        <button 
                            onClick={clearAllNotifications}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#E8A631]/30 text-[#E8A631] hover:bg-[#E8A631]/10 transition-colors text-sm font-bold"
                        >
                            <CheckCircle size={16} /> Marcar Todo Leído
                        </button>
                    </div>
                </div>

                {/* Main List */}
                <div className={`col-span-1 lg:col-span-3 ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl p-0 overflow-hidden flex flex-col`}>
                    {displayNotifications.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/30 gap-4 p-12">
                            <Bell size={48} className="opacity-20" />
                            <p className="text-sm font-medium">No hay notificaciones en esta vista.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {displayNotifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={`p-6 border-b border-white/5 transition-all hover:bg-white/5 flex gap-4 ${n.read ? 'opacity-50 grayscale-[0.5]' : 'bg-white/5'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'alert' ? 'bg-red-500/20 text-red-400' : n.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {n.type === 'alert' ? <AlertTriangle size={20} /> : n.type === 'warning' ? <Clock size={20} /> : <Bell size={20} />}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold text-lg ${n.read ? 'text-white/60' : 'text-white'}`}>{n.title}</h3>
                                            {!n.read && (
                                                <button 
                                                    onClick={() => markAsRead(n.id)} 
                                                    className="text-xs text-[#E8A631] hover:text-white transition-colors font-bold uppercase tracking-wider"
                                                >
                                                    Marcar Leído
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-white/60 text-sm leading-relaxed">{n.msg}</p>
                                        <p className="text-white/30 text-xs mt-3 flex items-center gap-2">
                                            {n.date ? new Date(n.date).toLocaleDateString() : 'Hoy'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
