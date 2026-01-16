
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { X, Plus, Clock, Tag, Trash2, Calendar as CalIcon } from 'lucide-react';
import { useData } from '../../context/DataContext';

const DayDetailModal = ({ isOpen, onClose, date, events }) => {
    const { theme } = useTheme();
    const { setCalendarEvents, calendarEvents } = useData();
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('09:00');
    const [newEventTag, setNewEventTag] = useState('meeting');

    if (!isOpen) return null;

    const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    const handleAddEvent = (e) => {
        e.preventDefault();
        if (!newEventTitle.trim()) return;

        const dateStr = date.toISOString().split('T')[0];
        const newEvent = {
            id: `evt-${Date.now()}`,
            date: dateStr,
            title: newEventTitle,
            type: newEventTag,
            time: newEventTime
        };

        const updatedEvents = [...calendarEvents, newEvent];
        setCalendarEvents(updatedEvents);
        
        setNewEventTitle('');
    };

    const handleDeleteEvent = (id) => {
        const updatedEvents = calendarEvents.filter(e => e.id !== id);
        setCalendarEvents(updatedEvents);
    };

    const getTagColor = (type) => {
        if (type === 'campaign') return 'bg-purple-500 text-white';
        if (type === 'meeting') return 'bg-blue-500 text-white';
        if (type === 'deadline') return 'bg-red-500 text-white';
        if (type === 'reminder') return 'bg-yellow-500 text-black';
        return 'bg-white/20 text-white';
    };

    // Filter events locally just to be sure we show current state if props lag (though context should drive it)
    const dateStr = date.toISOString().split('T')[0];
    const currentDayEvents = calendarEvents.filter(e => e.date === dateStr);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className={`relative w-full max-w-lg ${theme.cardBg} backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]`}>
                
                {/* Header with Visual Date */}
                <div className="relative p-6 pb-2 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} className="text-white/60" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-white/10 flex flex-col items-center justify-center font-bold border border-white/10 shadow-inner ${theme.accent}`}>
                            <span className="text-3xl leading-none">{date.getDate()}</span>
                            <span className="text-[10px] uppercase opacity-70">{date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white capitalize">{date.toLocaleDateString('es-ES', { weekday: 'long' })}</h2>
                            <p className="text-white/40 text-sm flex items-center gap-1"><CalIcon size={12}/> {date.getFullYear()}</p>
                        </div>
                    </div>
                </div>

                {/* Event List (Timeline style) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {currentDayEvents.length === 0 ? (
                        <div className="text-center py-10 opacity-30">
                            <Clock size={40} className="mx-auto mb-2" />
                            <p>No hay eventos programados</p>
                        </div>
                    ) : (
                        currentDayEvents.map(evt => (
                            <div key={evt.id} className="flex gap-4 group">
                                <div className="text-sm font-mono text-white/40 pt-1 w-12 text-right">{evt.time || 'All Day'}</div>
                                <div className={`flex-1 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-start group`}>
                                    <div>
                                        <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${getTagColor(evt.type)}`}>
                                            {evt.type}
                                        </div>
                                        <h4 className="font-bold text-white">{evt.title}</h4>
                                    </div>
                                    <button onClick={() => handleDeleteEvent(evt.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer: Add Event */}
                <div className="p-4 bg-black/20 border-t border-white/10">
                    <form onSubmit={handleAddEvent} className="flex flex-col gap-3">
                        <input 
                            type="text" 
                            placeholder="Nuevo evento..." 
                            value={newEventTitle}
                            onChange={e => setNewEventTitle(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E8A631]"
                        />
                        <div className="flex gap-2">
                             <input 
                                type="time" 
                                value={newEventTime}
                                onChange={e => setNewEventTime(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E8A631]"
                            />
                            <select 
                                value={newEventTag} 
                                onChange={e => setNewEventTag(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E8A631] [&>option]:text-black"
                            >
                                <option value="meeting">Reunión</option>
                                <option value="campaign">Campaña</option>
                                <option value="deadline">Deadline</option>
                                <option value="reminder">Recordatorio</option>
                            </select>
                            <button type="submit" className={`px-4 py-2 rounded-xl font-bold text-black ${theme.accentBg} hover:opacity-90`}>
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default DayDetailModal;
