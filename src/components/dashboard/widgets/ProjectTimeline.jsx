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
        <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-6 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer group h-full flex flex-col justify-between shadow-lg`} onClick={() => navigate('/campaigns')}>
             <div className="flex justify-between items-start mb-2">
                 <h3 className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider cursor-help`}>{title}</h3>
                 <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors"><Briefcase size={16} className="text-white"/></div>
             </div>
            
            <div className="flex items-end justify-between mt-auto">
                <span className={`text-4xl md:text-5xl font-bold ${theme.text} tracking-tighter`}>{activeProjects.length}</span>
                <div className="text-right">
                   <span className="text-xs text-green-400 font-bold block mb-1">En Curso</span>
                   <div className="flex gap-1 justify-end">
                        {[1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= Math.min(activeProjects.length, 3) ? 'bg-green-500' : 'bg-white/10'}`}></div>)}
                   </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectTimeline;
