import React, { memo, useMemo, useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useTasks } from '../../../hooks/useTasks';
import { Star, CheckCircle2, Plus, Calendar, ListTodo } from 'lucide-react';

const TasksWidget = memo(({ onOpenModal }) => {
    const { theme } = useTheme();
    const { tasks, toggleTask } = useTasks();

    // Filter pending tasks and sort by priority - memoized
    const pendingTasks = useMemo(() => 
        tasks.filter(t => !t.done).slice(0, 5),
        [tasks]
    );
    const completedCount = useMemo(() => 
        tasks.filter(t => t.done).length,
        [tasks]
    );

    const getPriorityColor = (p) => {
        switch(p) {
            case 'high': return 'text-red-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-6 shadow-lg h-full flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 ${theme.accentBg} rounded-xl`}>
                        <ListTodo size={20} className="text-black" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${theme.text}`}>Mis Tareas</h3>
                        <p className={`text-xs ${theme.textSecondary}`}>
                            {pendingTasks.length} pendientes • {completedCount} completadas
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onOpenModal}
                    className={`p-2 rounded-xl ${theme.accentBg} text-black hover:scale-105 transition-transform shadow-lg`}
                    title="Nueva Tarea"
                >
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>

            {/* Tasks List */}
            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                {pendingTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle2 size={32} className="text-white/10 mb-2" />
                        <p className="text-white/30 text-sm italic">No hay tareas pendientes</p>
                        <button 
                            onClick={onOpenModal}
                            className="mt-3 text-xs text-white/50 hover:text-white transition-colors"
                        >
                            + Crear primera tarea
                        </button>
                    </div>
                ) : (
                    pendingTasks.map(task => (
                        <div 
                            key={task.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                        >
                            {/* Checkbox */}
                            <button 
                                onClick={() => toggleTask(task.id)}
                                className="mt-0.5 flex-none w-4 h-4 rounded-full border border-white/30 hover:border-white flex items-center justify-center transition-all"
                            >
                                <CheckCircle2 size={10} className="text-transparent" strokeWidth={4} />
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white line-clamp-2">
                                    {task.text}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {/* Priority Indicator */}
                                    <span className={`text-[9px] uppercase font-bold ${getPriorityColor(task.priority)}`}>
                                        {task.priority === 'low' ? '●' : task.priority === 'medium' ? '●●' : '●●●'}
                                    </span>
                                    
                                    {/* Rating */}
                                    {task.rating > 0 && (
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(task.rating)].map((_, i) => (
                                                <Star key={i} size={8} fill="currentColor" className="text-yellow-400" />
                                            ))}
                                        </div>
                                    )}

                                    {/* Date */}
                                    <span className="text-[9px] text-white/20 flex items-center gap-1 ml-auto">
                                        <Calendar size={8} />
                                        {new Date(task.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer - View All Link */}
            {pendingTasks.length > 0 && (
                <button 
                    onClick={onOpenModal}
                    className="mt-4 pt-4 border-t border-white/10 text-xs font-bold text-white/40 hover:text-white transition-colors text-center"
                >
                    Ver todas las tareas →
                </button>
            )}
        </div>
    );
});

TasksWidget.displayName = 'TasksWidget';

export default TasksWidget;
