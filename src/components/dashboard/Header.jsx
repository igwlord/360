import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Activity, Briefcase, Sliders, Filter, Clock, Eye } from 'lucide-react';
import { FilterPill, VisibilityToggle } from './Widgets';

const Header = ({ 
    viewMode, 
    setViewMode, 
    isFilterMenuOpen, 
    setIsFilterMenuOpen, 
    campaignFilter, 
    setCampaignFilter, 
    dateFilter, 
    setDateFilter, 
    dashboardConfig, 
    setDashboardConfig,
    months 
}) => {
    const { theme } = useTheme();

    return (
      <>
      <header className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4 relative z-30">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme.text} drop-shadow-sm tracking-tight`}>Dashboard 2026</h1>
          <p className={`${theme.textSecondary} text-sm mt-1`}>Centro de Comando • {viewMode === 'strategic' ? 'Vista Estratégica' : 'Vista Operativa'}</p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-black/20 p-1 rounded-xl border border-white/10 flex">
                <button 
                    onClick={() => setViewMode('strategic')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'strategic' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                    <Activity size={14} /> Estrategia
                </button>
                <button 
                    onClick={() => setViewMode('operational')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'operational' ? 'bg-white text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                >
                    <Briefcase size={14} /> Operación
                </button>
            </div>

            <div className="relative">
                <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`p-3 rounded-xl transition-all flex items-center gap-2 font-medium text-sm shadow-lg ${isFilterMenuOpen ? `${theme.accentBg} text-black` : `${theme.cardBg} ${theme.text} hover:bg-white/10 border border-white/20`}`}>
                    <Sliders size={18} />
                </button>
                {isFilterMenuOpen && (
                    <div className={`absolute right-0 top-full mt-2 w-64 ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 z-50`}>
                            <div className="mb-4 text-left">
                                <h4 className={`text-[10px] uppercase tracking-wider ${theme.textSecondary} mb-2 font-bold flex items-center gap-1`}><Filter size={10}/> Estado Proyectos (KPIs)</h4>
                                <div className="space-y-1">
                                    <FilterPill label="Todas" active={campaignFilter === 'Todos'} onClick={() => setCampaignFilter('Todos')} />
                                    <FilterPill label="En Curso" active={campaignFilter === 'En Curso'} onClick={() => setCampaignFilter('En Curso')} />
                                    <FilterPill label="Planificación" active={campaignFilter === 'Planificación'} onClick={() => setCampaignFilter('Planificación')} />
                                </div>
                            </div>
                        
                        
                        {/* Date Filters */}
                        <div className="mb-4 text-left border-t border-white/10 pt-4">
                             <h4 className={`text-[10px] uppercase tracking-wider ${theme.textSecondary} mb-2 font-bold flex items-center gap-1`}><Clock size={10}/> Periodo (Año/Mes)</h4>
                             <div className="grid grid-cols-2 gap-2 mb-2">
                                <select 
                                    value={dateFilter.year}
                                    onChange={(e) => setDateFilter({...dateFilter, year: e.target.value === 'All' ? 'All' : Number(e.target.value)})}
                                    className="bg-white/5 border border-white/10 rounded-lg text-xs text-white p-1 focus:outline-none focus:border-[#E8A631]"
                                >
                                    <option value="All">Todos</option>
                                    <option value={2026}>2026</option>
                                    <option value={2025}>2025</option>
                                </select>
                                <select 
                                    value={dateFilter.month}
                                    onChange={(e) => setDateFilter({...dateFilter, month: e.target.value})}
                                    className="bg-white/5 border border-white/10 rounded-lg text-xs text-white p-1 focus:outline-none focus:border-[#E8A631] [&>option]:text-black"
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                             </div>
                        </div>
                        <div className="text-left">
                            <h4 className={`text-[10px] uppercase tracking-wider ${theme.textSecondary} mb-2 font-bold flex items-center gap-1`}><Eye size={10}/> Visualización</h4>
                            <div className="space-y-2">
                                <VisibilityToggle 
                                    label="Top Partners" 
                                    checked={dashboardConfig.showPartners} 
                                    onChange={() => setDashboardConfig({...dashboardConfig, showPartners: !dashboardConfig.showPartners})} 
                                />
                                <VisibilityToggle 
                                    label="Actividad Reciente" 
                                    checked={dashboardConfig.showRecentActivity} 
                                    onChange={() => setDashboardConfig({...dashboardConfig, showRecentActivity: !dashboardConfig.showRecentActivity})} 
                                />
                                <VisibilityToggle 
                                    label="Objetivos" 
                                    checked={dashboardConfig.showObjectives} 
                                    onChange={() => setDashboardConfig({...dashboardConfig, showObjectives: !dashboardConfig.showObjectives})} 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </header>
      
      {/* Overlay to close menu */}
      {isFilterMenuOpen && <div className="fixed inset-0 z-20" onClick={() => setIsFilterMenuOpen(false)}></div>}
      </>
    );
};

export default Header;
