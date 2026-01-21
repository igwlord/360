import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectTimeline = ({ campaigns, title = "Proyectos Activos", showRecentActivity }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    // Logic for "Active" vs "Planning"
    const activeProjects = campaigns.filter(c => c.status === 'En Curso' && c.type !== 'Especial');
    
    // Only show if configured
    if (!showRecentActivity) return null;

    return (
        <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-6 border border-white/10 flex flex-col h-full shadow-lg relative overflow-hidden`}>
             <div className="flex justify-between items-center mb-4 z-10">
                 <h3 className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider`}>{title}</h3>
                 <button onClick={() => navigate('/projects')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <Briefcase size={16} className="text-white"/>
                 </button>
             </div>
            
             <div className="flex-1 overflow-y-auto space-y-3 z-10 custom-scrollbar pr-1">
                {activeProjects.length > 0 ? (
                    activeProjects.slice(0, 5).map(project => (
                        <div 
                            key={project.id} 
                            onClick={() => navigate('/projects', { state: { openId: project.id } })}
                            className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-white text-sm group-hover:text-[#E8A631] transition-colors">{project.name}</h4>
                                    <p className="text-[10px] text-white/50">{project.brand}</p>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] uppercase font-bold border border-green-500/20">
                                    En Curso
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-white/30 text-xs text-center border-2 border-dashed border-white/5 rounded-xl">
                        <Briefcase size={24} className="mb-2 opacity-50"/>
                        <p>No hay proyectos activos</p>
                    </div>
                )}
             </div>
             
             {activeProjects.length > 5 && (
                <div onClick={() => navigate('/projects')} className="mt-4 text-center text-[10px] text-white/40 uppercase font-bold cursor-pointer hover:text-white transition-colors">
                    Ver {activeProjects.length - 5} más...
                </div>
             )}
        </div>
    );
};

export default ProjectTimeline;
