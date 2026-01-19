
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { X, Plus, Clock, Tag, Trash2, Calendar as CalIcon } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useColorTheme } from '../../context/ColorThemeContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const DayDetailModal = ({ isOpen, onClose, date, events = [] }) => {
    const { theme } = useTheme();
    const { addEvent, updateEvent, deleteEvent, setCalendarEvents } = useData(); // setCalendarEvents maps to setUserEvents
    const { getCategoryClasses } = useColorTheme();
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventTime, setNewEventTime] = useState('09:00');
    const [newEventTag, setNewEventTag] = useState('meeting');

    const [isChillModalOpen, setIsChillModalOpen] = useState(false);
    const [suppressChillAlert, setSuppressChillAlert] = useLocalStorage('chill-alert-suppressed', false);
    const [dontShowChecked, setDontShowChecked] = useState(false);
    
    // Edit Mode State
    const [editingEventId, setEditingEventId] = useState(null);

    if (!isOpen || !date) return null;

    const handleAddEvent = (e) => {
        e.preventDefault();
        if (!newEventTitle.trim()) return;

        // Check for Overload (Same Hour) if creating NEW event
        if (!editingEventId) {
            const hour = newEventTime.split(':')[0]; // "09"
            const countInHour = events.filter(evt => (evt.time || '').startsWith(hour)).length;
            
            if (countInHour >= 2 && !suppressChillAlert) {
                setIsChillModalOpen(true);
            }
        }

        const dateStr = date.toISOString().split('T')[0];
        const eventPayload = {
            id: editingEventId || `evt-${Date.now()}`,
            date: dateStr,
            title: newEventTitle,
            type: newEventTag,
            time: newEventTime
        };

        if (editingEventId) {
            // UPDATE
            if (updateEvent) {
                updateEvent(eventPayload);
            } else {
                 // Fallback
                 setCalendarEvents(prev => prev.map(e => e.id === editingEventId ? eventPayload : e));
            }
            setEditingEventId(null);
        } else {
            // CREATE
            if (addEvent) {
                addEvent(eventPayload);
            } else {
                setCalendarEvents(prev => [...prev, eventPayload]);
            }
        }
        
        setNewEventTitle('');
        setNewEventTime('09:00'); // Reset time too
    };

    const handleDeleteEvent = (id) => {
        if (deleteEvent) {
            deleteEvent(id);
        } else {
             setCalendarEvents(prevUserEvents => prevUserEvents.filter(e => e.id !== id));
        }
        if (editingEventId === id) {
            cancelEdit();
        }
    };

    const startEdit = (evt) => {
        if (evt.isReadOnly) return;
        setEditingEventId(evt.id);
        setNewEventTitle(evt.title);
        setNewEventTime(evt.time || '09:00');
        setNewEventTag(evt.type || 'meeting');
    };

    const cancelEdit = () => {
        setEditingEventId(null);
        setNewEventTitle('');
        setNewEventTime('09:00');
        setNewEventTag('meeting');
    };

    const getTagColor = (type) => {
        // Use Dynamic Context if available, else fallback
        return getCategoryClasses ? getCategoryClasses(type, 'badge') : 'bg-white/20 text-white';
    };

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
                            <span className="text-xs uppercase opacity-70">{date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white capitalize">{date.toLocaleDateString('es-ES', { weekday: 'long' })}</h2>
                            <p className="text-white/40 text-sm flex items-center gap-1"><CalIcon size={12}/> {date.getFullYear()}</p>
                        </div>
                    </div>
                </div>

                {/* Event List (Timeline style) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {events.length === 0 ? (
                        <div className="text-center py-10 opacity-30">
                            <Clock size={40} className="mx-auto mb-2" />
                            <p>No hay eventos programados</p>
                        </div>
                    ) : (
                        events.map(evt => (
                            <div key={evt.id} className="flex gap-4 group">
                                <div className="text-sm font-mono text-white/40 pt-1 w-12 text-right">{evt.time || 'All Day'}</div>
                                <div 
                                    onClick={() => startEdit(evt)}
                                    className={`flex-1 p-3 rounded-xl border ${editingEventId === evt.id ? 'border-[#E8A631] bg-[#E8A631]/10' : 'border-white/5 bg-white/5 hover:bg-white/10'} transition-colors flex justify-between items-start group ${evt.isReadOnly ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                                >
                                    <div>
                                        <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${getTagColor(evt.type)}`}>
                                            {evt.type}
                                        </div>
                                        <h4 className="font-bold text-white flex items-center gap-2">
                                            {evt.title}
                                            {evt.isReadOnly && <Tag size={12} className="opacity-50" />}
                                        </h4>
                                    </div>
                                    {!evt.isReadOnly && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }} 
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
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
                            placeholder={editingEventId ? "Editar título..." : "Nuevo evento..."} 
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
                            <button type="submit" className={`px-4 py-2 rounded-xl font-bold text-black ${theme.accentBg} hover:opacity-90 flex items-center justify-center min-w-[50px]`}>
                                {editingEventId ? <Tag size={20}/> : <Plus size={20} />}
                            </button>
                            {editingEventId && (
                                <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

            </div>

            {/* CHILL MODAL */}
            {isChillModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" />
                    <div className="relative bg-[#1e1e1e] border border-white/20 p-8 rounded-3xl max-w-sm text-center shadow-2xl animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🥶</div>
                        <h3 className="text-xl font-bold text-white mb-2">Chill.</h3>
                        <p className="text-white/70 mb-6">Tienes demasiadas cosas juntas para esta hora, relajate.</p>
                        
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <input 
                                type="checkbox" 
                                id="dontShow"
                                checked={dontShowChecked}
                                onChange={(e) => setDontShowChecked(e.target.checked)}
                                className="rounded border-white/20 bg-white/5 text-[#E8A631] focus:ring-[#E8A631]"
                            />
                            <label htmlFor="dontShow" className="text-xs text-white/50 cursor-pointer select-none">No volver a mostrar</label>
                        </div>

                        <button 
                            onClick={() => {
                                if (dontShowChecked) setSuppressChillAlert(true);
                                setIsChillModalOpen(false);
                            }}
                            className={`w-full py-3 rounded-xl font-bold text-black ${theme.accentBg} hover:opacity-90 transition-opacity`}
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DayDetailModal;
