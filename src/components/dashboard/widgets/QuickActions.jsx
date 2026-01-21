import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Plus, Briefcase, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    return (
        <div className="flex-none grid grid-cols-2 gap-4 h-32">
             {/* Quick Task Add (Direct to Task Manager) */}
             <div 
                onClick={() => navigate('/projects?openTaskModal=true')} 
                className={`${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-5 flex flex-col justify-center items-center cursor-pointer hover:bg-white/5 group transition-all shadow-lg`}
             >
                <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 mb-2 transition-colors">
                    <CheckCircle size={20} className="text-white"/>
                </div>
                <span className="font-bold text-white text-xs uppercase tracking-wider text-center">Nueva Tarea</span>
             </div>

             {/* New Project */}
             <div onClick={() => navigate('/campaigns', { state: { openModal: true } })} className={`group relative overflow-hidden ${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-all shadow-lg`}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${theme.accentBg} transition-opacity duration-500`}></div>
                <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center text-black mb-2 shadow-lg group-hover:scale-110 transition-transform`}><Briefcase size={20} strokeWidth={3}/></div>
                <span className="font-bold text-white text-sm">Nuevo Proyecto</span>
             </div>
        </div>
    );
};

export default QuickActions;
