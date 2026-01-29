import React, { useState } from 'react';
import Modal from '../../common/Modal';
import GlassInput from '../../common/GlassInput';
import { useTasks } from '../../../hooks/useTasks';
import { useTheme } from '../../../context/ThemeContext';
import { Star, Clock, Plus, CheckCircle2, Trash2, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

const SortButton = ({ label, sortKey, activeSort, onSort }) => (
    <button 
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            activeSort.key === sortKey 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
        }`}
    >
        {label}
        {activeSort.key === sortKey && (
            activeSort.direction === 'desc' ? <ArrowDown size={12}/> : <ArrowUp size={12}/>
        )}
    </button>
);

const CreateTaskModal = ({ isOpen, onClose }) => {
    const { theme } = useTheme();
    const { tasks, addTask, toggleTask, removeTask, updateTask } = useTasks();
    const [activeTab, setActiveTab] = useState('list'); // 'new' | 'list'
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' }); // key: 'date' | 'priority' | 'rating'
    
    // Form State
    const [newTaskText, setNewTaskText] = useState('');
    const [priority, setPriority] = useState('medium');

    const handleCreate = () => {
        if (!newTaskText.trim()) return;
        addTask({ text: newTaskText, priority });
        setNewTaskText('');
        setPriority('medium');
        setActiveTab('list');
    };

    const handleRating = (id, rating) => {
        updateTask(id, { rating });
    };

    const toggleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const priorityValue = { high: 3, medium: 2, low: 1 };

    // Sort tasks
    const sortedTasks = [...tasks].sort((a, b) => {
        // First always sort by done status (pending first)
        if (a.done !== b.done) return a.done ? 1 : -1;

        // Then custom sort
        const multiplier = sortConfig.direction === 'desc' ? -1 : 1;
        
        switch(sortConfig.key) {
            case 'priority':
                return (priorityValue[a.priority] - priorityValue[b.priority]) * multiplier;
            case 'rating':
                return ((a.rating || 0) - (b.rating || 0)) * multiplier;
            case 'date':
            default:
                return (new Date(a.date) - new Date(b.date)) * multiplier;
        }
    });

    const getPriorityColor = (p) => {
        switch(p) {
            case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-gray-400';
        }
    };



    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Tareas" size="lg">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4">
                {/* Tabs */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        <Clock size={16} />
                        Mis Tareas
                    </button>
                    <button 
                        onClick={() => setActiveTab('new')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        <Plus size={16} />
                        Nueva Tarea
                    </button>
                </div>

                {/* Sort Controls (only in list) */}
                {activeTab === 'list' && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-white/30 mr-1">Ordenar por:</span>
                        <SortButton label="Fecha" sortKey="date" activeSort={sortConfig} onSort={toggleSort} />
                        <SortButton label="Prio" sortKey="priority" activeSort={sortConfig} onSort={toggleSort} />
                        <SortButton label="Stars" sortKey="rating" activeSort={sortConfig} onSort={toggleSort} />
                    </div>
                )}
            </div>

            {/* Content */}
            {activeTab === 'new' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-2">
                        <label className={`text-xs font-bold ${theme.textSecondary} uppercase tracking-wider`}>Descripción de la Tarea</label>
                        <GlassInput 
                            placeholder="Ej: Revisar presupuesto de Coca-Cola..." 
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className={`text-xs font-bold ${theme.textSecondary} uppercase tracking-wider`}>Prioridad</label>
                        <div className="flex gap-3">
                            {['low', 'medium', 'high'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 py-2 rounded-xl border transition-all font-bold text-sm capitalize ${
                                        priority === p 
                                        ? getPriorityColor(p) + ' ring-2 ring-offset-2 ring-offset-black/50 ring-white/20' 
                                        : 'border-white/10 text-white/40 hover:border-white/20'
                                    }`}
                                >
                                    {p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={handleCreate}
                            disabled={!newTaskText.trim()}
                            className={`px-6 py-2 rounded-xl font-bold text-black shadow-lg shadow-white/5 transition-all ${
                                !newTaskText.trim() ? 'bg-white/20 cursor-not-allowed opacity-50' : 'bg-white hover:scale-105 active:scale-95'
                            }`}
                        >
                            Crear Tarea
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {sortedTasks.length === 0 ? (
                        <div className="text-center py-10 text-white/20 italic">
                            No hay tareas pendientes. ¡Buen trabajo!
                        </div>
                    ) : (
                        sortedTasks.map(task => (
                            <div 
                                key={task.id} 
                                className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${
                                    task.done 
                                    ? 'bg-black/20 border-white/5 opacity-60' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                {/* Checkbox */}
                                <button 
                                    onClick={() => toggleTask(task.id)}
                                    className={`mt-1 flex-none w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                        task.done 
                                        ? 'bg-emerald-500 border-emerald-500 text-black' 
                                        : 'border-white/30 hover:border-white text-transparent'
                                    }`}
                                >
                                    <CheckCircle2 size={12} strokeWidth={4} />
                                </button>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`text-sm font-medium transition-all ${task.done ? 'line-through text-white/30' : 'text-white'}`}>
                                            {task.text}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {/* Priority Badge */}
                                            {!task.done && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${getPriorityColor(task.priority)}`}>
                                                    {task.priority === 'low' ? 'Low' : task.priority === 'medium' ? 'Med' : 'High'}
                                                </span>
                                            )}
                                            {/* Date */}
                                            <span className="text-[10px] text-white/20 flex items-center gap-1">
                                                <Calendar size={10} />
                                                {new Date(task.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Bar (Always Visible) */}
                                    <div className="mt-3 flex items-center justify-between">
                                        {/* Rating System */}
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    onClick={() => handleRating(task.id, star)}
                                                    className={`transition-all hover:scale-110 ${task.rating >= star ? 'text-yellow-400' : 'text-white/10 hover:text-yellow-400/50'}`}
                                                >
                                                    <Star size={14} fill={task.rating >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={() => removeTask(task.id)}
                                            className="text-white/20 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </Modal>
    );
};

export default CreateTaskModal;
