
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
// import { useData } from '../context/DataContext'; // REMOVED
import { useCampaigns } from '../hooks/useCampaigns';
import { useSuppliers } from '../hooks/useSuppliers';
import { useTasks } from '../hooks/useTasks';
import { useRoiCalculator } from '../hooks/useRoiCalculator';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DollarSign, TrendingUp, Users, Settings, Star, Plus, Sliders, Filter, Eye, Briefcase, Activity, ArrowDownRight, ArrowUpRight, Mail, Phone, Trash2, Printer, X, ChevronDown, ChevronUp, PieChart, FileText, Circle, Clock } from 'lucide-react';
import { DonutChart, FilterPill, VisibilityToggle } from '../components/dashboard/Widgets';
import ObjectivesWidget from '../components/dashboard/ObjectivesWidget';
import RetailerShareWidget from '../components/dashboard/RetailerShareWidget';
import UpcomingDeadlinesWidget from '../components/dashboard/UpcomingDeadlinesWidget';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import Modal from '../components/common/Modal';
import Tooltip from '../components/common/Tooltip';
import { useNavigate } from 'react-router-dom';
import { generateAndPrintReport } from '../utils/reportGenerator'; 
import { isCampaignInPeriod, formatCurrency } from '../utils/dataUtils';

import { CheckCircle } from 'lucide-react';

const TaskItem = ({ task, theme, onToggle }) => { // Added onToggle prop
    return (
        <div 
            onClick={() => onToggle(task.id)}
            className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer ${task.done ? 'bg-white/5 opacity-50' : 'bg-white/10 hover:bg-white/15'}`}
        >
            <div className={`w-5 h-5 rounded-full border border-white/30 flex items-center justify-center transition-colors ${task.done ? theme.accentBg + ' border-transparent' : ''}`}>
                {task.done && <CheckCircle size={12} className="text-black"/>}
            </div>
            <span className={`text-xs font-bold ${task.done ? 'line-through text-white/50' : 'text-white'}`}>{task.text}</span>
        </div>
    );
};

const Dashboard = () => {
  // ... rest of the component

  const { theme } = useTheme();
  
  // New Hooks
  const { data: campaigns = [] } = useCampaigns();
  const { providerGroups = [] } = useSuppliers();
  const { data: calendarEvents = [] } = useCalendarEvents();
  const { tasks, addTask, updateTask, removeTask, toggleTask } = useTasks();
  
  const navigate = useNavigate();

  // Local State for Dashboard UI
  // Local State
  // Dashboard Local State
  const [viewMode, setViewMode] = useState('strategic');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('Todos'); 
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  
  // Adaptive Panel State
  const [detailTab, setDetailTab] = useState('suppliers'); // 'suppliers' | 'tasks' | 'alerts'

  // NEW: Date Filter State
  const [dateFilter, setDateFilter] = useState({ year: 'All', month: 'All' });
  const months = ['All', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // NEW: Persistent Dashboard Config (Phase 2)
  const [dashboardConfig, setDashboardConfig] = useLocalStorage('dashboard-config-v1', {
      showPartners: true,
      showRecentActivity: true, 
      showObjectives: true
  });

  // Strategy & Reports Logic
  const [isRoiExpanded, setIsRoiExpanded] = useState(false);
  const metrics = useRoiCalculator(); // NOW USES REAL DATA from DataContext
  const [favoriteReportIds, setFavoriteReportIds] = useLocalStorage('fav-reports', ['exec']);
  const [isFavReportsModalOpen, setIsFavReportsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const reportTypes = [
     { id: 'exec', title: 'Reporte Ejecutivo', icon: TrendingUp, color: 'bg-blue-500' },
     { id: 'mkt', title: 'Marketing & Retail', icon: PieChart, color: 'bg-purple-500' },
     { id: 'finance', title: 'Finanzas', icon: DollarSign, color: 'bg-green-500' },
     { id: 'onepager', title: 'Fichas (One-Pager)', icon: FileText, color: 'bg-orange-500' }
  ];

  // Computed Data
  // Computed Data
  const filteredCampaigns = campaigns.filter(c => {
      // 1. Status Filter
      if (campaignFilter !== 'Todos' && c.status !== campaignFilter) return false;
      
      // 2. Date Filter (Using robust Utils)
      return isCampaignInPeriod(c.date, dateFilter.year, dateFilter.month);
  });
  
  // Dashboard Partners (Top 5 Favorites)
  const dashboardPartners = providerGroups
    .flatMap(g => g.contacts)
    .sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1))
    .slice(0, 5);

  return (
    <>
      {/* Header */}
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
                        
                        
                        {/* NEW: Date Filters */}
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

      {/* STRATEGIC VIEW */}
      {viewMode === 'strategic' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main KPI Card - The Accordion */}
            <div 
                className={`md:col-span-2 ${theme.cardBg} backdrop-blur-md rounded-[32px] shadow-2xl border border-white/10 p-8 flex flex-col relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isRoiExpanded ? 'row-span-2' : ''}`}
                style={{ height: isRoiExpanded ? 'auto' : '340px' }}
            >
                 <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                 
                 {/* Header & Toggle */}
                 <div className="flex justify-between items-start mb-6 z-10">
                    <div onClick={() => setIsRoiExpanded(!isRoiExpanded)} className="cursor-pointer group">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className={`text-2xl font-bold ${theme.text} group-hover:text-[#E8A631] transition-colors`}>Estrategia de Inversión</h2>
                            {isRoiExpanded ? <ChevronUp size={20} className="text-white/50" /> : <ChevronDown size={20} className="text-white/50" />}
                        </div>
                        <p className={`text-sm ${theme.textSecondary}`}>
                            {isRoiExpanded ? 'Análisis detallado de rentabilidad por proyecto' : 'Vista general de ejecución y presupuesto'}
                        </p>
                    </div>
                    <div className={`p-3 rounded-2xl bg-white/10 ${theme.accent}`}><DollarSign size={24}/></div>
                 </div>
                 
                 {/* Top KPIs (Always Consistent) */}
                 <div className="flex items-center gap-10 mb-8 z-10">
                    <div className="scale-100 transition-transform duration-500">
                        <DonutChart percentage={metrics.global.budgetExecuted / metrics.global.budgetTotal * 100 || 0} size={100} />
                    </div>
                    <div className="space-y-4 flex-1">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <div>
                                <p className={`text-xs ${theme.textSecondary} uppercase tracking-wider font-bold mb-1`}>Ejecutado Global</p>
                                <p className={`text-2xl md:text-4xl font-bold ${theme.text} tracking-tighter`}>
                                    ${(metrics.global.budgetExecuted / 1000000).toFixed(2)}M
                                </p>
                            </div>
                            <div className="text-right">
                                <p className={`text-xs ${theme.textSecondary} uppercase tracking-wider font-bold mb-1`}>ROAS Global</p>
                                <p className={`text-3xl font-bold ${metrics.global.roas >= 1 ? 'text-green-400' : 'text-yellow-400'} tracking-tighter flex items-center justify-end gap-1`}>
                                    {metrics.global.roas.toFixed(2)}x <Activity size={18}/>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-8 pt-1">
                             <div>
                                <p className="text-[10px] text-white/40 uppercase">Presupuesto Total</p>
                                <p className="text-lg font-bold text-white opacity-80">${(metrics.global.budgetTotal / 1000000).toFixed(2)}M</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-white/40 uppercase">Disponible</p>
                                <p className={`text-lg font-bold ${theme.accent}`}>${(metrics.global.budgetAvailable / 1000000).toFixed(2)}M</p>
                             </div>
                        </div>
                    </div>
                 </div>

                 {/* EXPANDED CONTENT: Deep Dive */}
                 {isRoiExpanded && (
                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4 border-t border-white/10 z-10">
                        
                        {/* Efficiency Bar */}
                        <div className="mb-8">
                            <h4 className="text-xs font-bold uppercase text-white/40 mb-3 flex items-center gap-2"><Settings size={12}/> Eficiencia de Gasto</h4>
                            <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-white/5">
                                {metrics.campaigns.map(c => (
                                    <Tooltip key={c.id} text={`${c.name}: $${(c.actualCost/1000).toFixed(1)}k (${((c.actualCost/metrics.global.totalInvested)*100).toFixed(0)}%)`}>
                                        <div 
                                            className={`${c.statusColor} hover:opacity-80 transition-opacity cursor-help`} 
                                            style={{ width: `${(c.actualCost / metrics.global.totalInvested) * 100}%` }}
                                        ></div>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>

                        {/* Profitability Table */}
                        <h4 className="text-xs font-bold uppercase text-white/40 mb-3 flex items-center gap-2"><TrendingUp size={12}/> Rentabilidad por Proyecto</h4>
                        <div className="overflow-hidden rounded-xl border border-white/10">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-white/40 uppercase text-[10px]">
                                    <tr>
                                        <th className="p-3">Proyecto</th>
                                        <th className="p-3 text-right">Inversión</th>
                                        <th className="p-3 text-right">Retorno (Est.)</th>
                                        <th className="p-3 text-right">ROAS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {metrics.campaigns.sort((a,b)=>b.actualCost-a.actualCost).slice(0,5).map(c => (
                                        <tr 
                                            key={c.id} 
                                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                                            onClick={() => navigate('/campaigns', { state: { openId: c.id, activeTab: 'financial' } })}
                                        >
                                            <td className="p-3 font-medium text-white group-hover:text-[#E8A631] transition-colors flex items-center gap-2">
                                                {c.name} <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100"/>
                                            </td>
                                            <td className="p-3 text-right font-mono text-white/70">{formatCurrency(c.actualCost)}</td>
                                            <td className="p-3 text-right font-mono text-white/70">{formatCurrency(c.estimatedValue)}</td>
                                            <td className={`p-3 text-right font-bold ${c.roas >= 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {c.roas ? c.roas.toFixed(2) : '0.00'}x
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                 )}
                 
                 {/* Footer Helper */}
                 {!isRoiExpanded && (
                     <div 
                         onClick={() => setIsRoiExpanded(true)}
                         className="mt-auto pt-4 flex justify-center items-center text-xs text-white/30 uppercase tracking-widest gap-2 cursor-pointer hover:text-white transition-colors"
                     >
                         <ChevronDown size={14} className="animate-bounce"/> Ver Análisis Completo
                     </div>
                 )}
            </div>

            {/* NEW: Financial Projection Widget (Billing Integration) */}
            <div className={`md:col-span-2 ${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-6 flex flex-col md:flex-row gap-6 items-center shadow-xl`}>
                 <div className="flex-1 space-y-4 w-full">
                    <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                        <FileText size={16} className="text-purple-400"/>
                        Proyección vs Ejecución (Global)
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60">Costo Proyectado (Tarifario)</span>
                            <span className="text-white font-mono">{formatCurrency(metrics.global.totalPlanned)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60">Gasto Real (Facturado)</span>
                            <span className={`font-mono font-bold ${metrics.global.budgetExecuted > metrics.global.totalPlanned ? 'text-red-400' : 'text-green-400'}`}>
                                {formatCurrency(metrics.global.budgetExecuted)}
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden relative">
                             {/* Projection Marker (Target) */}
                             <div className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10" style={{ left: `${Math.min((metrics.global.totalPlanned / (Math.max(metrics.global.totalPlanned, metrics.global.budgetExecuted) || 1)) * 100, 100)}%` }}></div>
                             
                             <div 
                                className={`h-full transition-all duration-1000 ${metrics.global.budgetExecuted > metrics.global.totalPlanned ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-400'}`} 
                                style={{ width: `${Math.min((metrics.global.budgetExecuted / (metrics.global.totalPlanned || 1)) * 100, 100)}%` }}
                             ></div>
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed">
                            {metrics.global.budgetExecuted > metrics.global.totalPlanned 
                                ? `⚠️ Has excedido la proyección inicial en ${formatCurrency(metrics.global.budgetExecuted - metrics.global.totalPlanned)}.`
                                : `✅ Estás ${formatCurrency(metrics.global.totalPlanned - metrics.global.budgetExecuted)} por debajo de lo proyectado según tarifario.`
                            }
                        </p>
                    </div>
                 </div>

                 {/* Mini Insight */}
                 <div className="w-full md:w-1/3 bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col justify-center gap-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg w-fit text-blue-400 mx-auto md:mx-0"><TrendingUp size={20}/></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-white/50">Precisión Financiera</p>
                        <p className="text-2xl font-bold text-white">
                            {metrics.global.totalPlanned > 0 ? (100 - (Math.abs(metrics.global.budgetExecuted - metrics.global.totalPlanned) / metrics.global.totalPlanned * 100)).toFixed(1) : '100'}%
                        </p>
                        <p className="text-xs text-white/40 mt-1">Calidad de estimación</p>
                    </div>
                 </div>
            </div>
            <div className="space-y-6 flex flex-col h-full">

                {/* UPCOMING DEADLINES WIDGET - PHASE 5 */}
                <div className="h-[300px]">
                    <UpcomingDeadlinesWidget campaigns={campaigns} events={calendarEvents} />
                </div>

                {/* Campaigns Quick Stat */}
                {dashboardConfig.showRecentActivity && (
                <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-6 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer group`} onClick={() => navigate('/campaigns')}>
                     <div className="flex justify-between items-start mb-2">
                         <h3 className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider cursor-help`}>Proyectos Activos</h3>
                         <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors"><Briefcase size={16} className="text-white"/></div>
                     </div>
                    <div className="flex items-end justify-between">
                        <span className={`text-3xl md:text-4xl font-bold ${theme.text}`}>{filteredCampaigns.filter(c => c.status === 'En Curso' && c.type !== 'Especial').length}</span>
                        <div className="text-right">
                           <span className="text-xs text-green-400 font-bold block mb-1">En curso</span>
                           <div className="flex gap-1">
                                {[1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= filteredCampaigns.filter(c => c.status === 'En Curso').length ? 'bg-green-500' : 'bg-white/10'}`}></div>)}
                           </div>
                        </div>
                    </div>
                </div>
                )}

                {/* RETAILER SHARE WIDGET - PHASE 3 (Replaces Objectives in Strategic View for better relevance) */}
                <div className="h-[250px]">
                    <RetailerShareWidget data={metrics.retailerShare} />
                </div>

                {/* Objectives Widget - NEW */}
                {dashboardConfig.showObjectives && <ObjectivesWidget />}

                {/* Proveedores Quick Stat */}
                {dashboardConfig.showPartners && (
                <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-6 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer group`} onClick={() => navigate('/directory')}>
                   <div className="flex justify-between items-start mb-2">
                       <h3 className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider`}>Proveedores</h3>
                       <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors"><Users size={16} className="text-white"/></div>
                   </div>
                   <span className={`text-3xl md:text-4xl font-bold ${theme.text}`}>{dashboardPartners.length}</span>
                </div>
                )}
                
                 {/* DYNAMIC REPORTS WIDGET - NEW */}
                 <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-5 border border-white/10 flex flex-col gap-3 flex-1 min-h-[160px]`}>
                   <div className="flex items-center justify-between mb-2">
                       <h3 className="font-bold text-sm text-white flex items-center gap-2"><Printer size={16} className={theme.accent}/> Reportes Rápidos</h3>
                       <button onClick={() => setIsFavReportsModalOpen(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"><Settings size={14}/></button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2 flex-1 content-start">
                       {favoriteReportIds.map(id => {
                           const type = reportTypes.find(t => t.id === id);
                           if (!type) return null;
                           return (
                               <div 
                                    key={id}
                                    onClick={() => generateAndPrintReport(type, { dateRange: 'FY 2026' }, campaigns)}
                                    className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 p-3 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 group"
                               >
                                    <div className={`p-2 rounded-full ${type.color} bg-opacity-20 group-hover:bg-opacity-30 transition-all text-white`}>
                                        <type.icon size={16} />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/80 leading-tight">{type.title}</span>
                               </div>
                           );
                       })}
                       {favoriteReportIds.length === 0 && (
                           <div className="col-span-2 text-center text-white/20 text-xs py-4 italic border border-dashed border-white/10 rounded-xl">
                               Selecciona tus reportes favoritos
                           </div>
                       )}
                   </div>
                </div>
            </div>
          </div>
      )}

      {/* Dynamic Favorite Reports Config Modal */}
      <Modal isOpen={isFavReportsModalOpen} onClose={() => setIsFavReportsModalOpen(false)} title="Personalizar Accesos Rapidos" size="md">
          <div className="space-y-4">
              <p className={`text-sm ${theme.textSecondary} mb-4`}>Selecciona los reportes que deseas tener a mano en tu Dashboard.</p>
              <div className="grid grid-cols-1 gap-3">
                  {reportTypes.map(type => {
                      const isSelected = favoriteReportIds.includes(type.id);
                      return (
                          <div 
                            key={type.id} 
                            onClick={() => {
                                setFavoriteReportIds(prev => 
                                    isSelected ? prev.filter(id => id !== type.id) : [...prev, type.id]
                                );
                            }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSelected ? theme.accentBg + ' text-black border-transparent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                          >
                              <div className="flex items-center gap-3">
                                  <type.icon size={20} />
                                  <span className="font-bold text-sm">{type.title}</span>
                              </div>
                              {isSelected && <CheckCircle size={16} />}
                          </div>
                      );
                  })}
              </div>
          </div>
      </Modal>

      {/* OPERATIONAL VIEW - OPTIMIZED */}
      {viewMode === 'operational' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-right-4 duration-500 h-full">
            


            {/* Partners & Tasks & New Campaign - Compacted */}
            <div className="md:col-span-2 flex flex-col gap-6 h-[calc(100vh-200px)]">
                
                {/* ADAPTIVE DETAIL PANEL */}
                 <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-5 flex-[2] flex flex-col overflow-hidden relative`}>
                    
                    {/* Tabs Header */}
                    <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-2">
                        <button 
                            onClick={() => setDetailTab('suppliers')}
                            className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${detailTab === 'suppliers' ? `text-white border-b-2 border-[${theme.accent}]` : 'text-white/40 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><Users size={14}/> Proveedores</span>
                        </button>
                        <button 
                            onClick={() => setDetailTab('tasks')}
                            className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${detailTab === 'tasks' ? `text-white border-b-2 border-[${theme.accent}]` : 'text-white/40 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><Briefcase size={14}/> Mis Tareas</span>
                        </button>
                         {/* Future tabs can go here */}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                        
                        {/* 1. Suppliers Tab */}
                        {detailTab === 'suppliers' && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-300">
                                {dashboardPartners.length > 0 ? dashboardPartners.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10 group" onClick={() => setSelectedPartner(p)}>
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-xs font-bold ${theme.accent} group-hover:scale-110 transition-transform`}>{p.company.charAt(0)}</div>
                                        <div className="overflow-hidden min-w-0">
                                             <p className={`text-xs font-bold truncate ${theme.text}`}>{p.company}</p>
                                             {/* Dynamic Pill based on status/favorite */}
                                             <p className="text-[10px] text-white/40 truncate flex items-center gap-1">
                                                 {p.isFavorite && <Star size={8} className="text-yellow-400 fill-yellow-400"/>} Socio Clave
                                             </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 text-center text-white/30 text-xs py-10">No hay proveedores marcados como favoritos.</div>
                                )}
                            </div>
                        )}

                        {/* 2. Tasks Tab */}
                        {detailTab === 'tasks' && (
                            <div className="space-y-2 animate-in fade-in duration-300">
                                {tasks.filter(t => !t.done).length > 0 ? tasks.filter(t => !t.done).slice(0, 8).map(t => (
                                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                         <div 
                                            onClick={() => toggleTask(t.id)}
                                            className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center cursor-pointer hover:border-green-400 transition-colors group-hover:bg-green-500/10"
                                         >
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                         </div>
                                         <div className="flex-1">
                                             <p className="text-sm font-medium text-white">{t.text}</p>
                                             {t.status === 'in_progress' && <span className="text-[10px] bg-[#E8A631]/10 text-[#E8A631] px-1.5 rounded uppercase font-bold">En Curso</span>}
                                         </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-white/30 text-xs py-10">¡Todo al día! No tienes tareas pendientes.</div>
                                )}
                                <button onClick={() => setIsTaskModalOpen(true)} className="w-full py-2 text-xs font-bold text-white/40 hover:text-white border border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-colors mt-2">
                                    + Ver Todas / Agregar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2: Action Buttons */}
                <div className="flex-none grid grid-cols-2 gap-4 h-32">
                     {/* Quick Task Add */}
                     <div 
                        onClick={() => {
                            const text = prompt("Nueva Tarea Rápida:"); // Keeping prompt for quick input or replace with modal logic
                            if(text) addTask(text);
                        }}
                        className={`${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-5 flex flex-col justify-center items-center cursor-pointer hover:bg-white/5 group transition-all`}
                     >
                        <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 mb-2 transition-colors">
                            <Plus size={20} className="text-white"/>
                        </div>
                        <span className="font-bold text-white text-xs uppercase tracking-wider">Tarea Rápida</span>
                     </div>

                     {/* New Project */}
                     <div onClick={() => navigate('/campaigns', { state: { openModal: true } })} className={`group relative overflow-hidden ${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-all`}>
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${theme.accentBg} transition-opacity duration-500`}></div>
                        <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center text-black mb-2 shadow-lg group-hover:scale-110 transition-transform`}><Briefcase size={20} strokeWidth={3}/></div>
                        <span className="font-bold text-white text-sm">Nuevo Proyecto</span>
                     </div>
                </div>
            </div>
          </div>
      )}

      {/* Campaign Details Modal (Shared) */}
      <Modal isOpen={!!selectedCampaign} onClose={() => setSelectedCampaign(null)} title="Detalle de Proyecto" size="lg">
        {selectedCampaign && (
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full ${selectedCampaign.statusColor || 'bg-gray-500'} flex items-center justify-center font-bold text-white text-xl`}>
                        {selectedCampaign.brand ? selectedCampaign.brand.charAt(0) : '?'}
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">{selectedCampaign.name}</h4>
                        <p className={`text-sm ${theme.textSecondary}`}>{selectedCampaign.brand}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase opacity-50 font-bold">Inversión</p>
                        <p className="font-mono font-bold text-lg">{selectedCampaign.cost}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase opacity-50 font-bold">Fechas</p>
                        <p className="font-medium">{selectedCampaign.date}</p>
                    </div>
                </div>
                <div>
                     <p className="text-[10px] uppercase opacity-50 font-bold mb-1">Progreso</p>
                     <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${selectedCampaign.statusColor || 'bg-gray-500'}`} style={{ width: `${selectedCampaign.progress || 0}%` }}></div>
                     </div>
                     <p className="text-right text-xs mt-1">{selectedCampaign.progress || 0}% Completado</p>
                </div>
            </div>
        )}
      </Modal>

      {/* Task Command Center Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Command Center: Gestión de Tareas" size="xl">
          <div className="h-[600px] flex flex-col">
              {/* Header Controls */}
              <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                       <button className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white border border-white/10">Todos</button>
                       <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/40 hover:text-white transition-colors">Solo Míos</button>
                  </div>
                  <button 
                    onClick={() => {
                        const text = prompt("Nueva Tarea:");
                        if(text) addTask(text);
                    }}
                    className={`${theme.accentBg} text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90`}
                  >
                      <Plus size={16}/> Nueva Tarea
                  </button>
              </div>

              {/* Kanban Columns */}
              <div className="flex-1 grid grid-cols-3 gap-4 min-h-0 bg-black/20 p-4 rounded-2xl border border-white/5 overflow-x-auto">
                  
                  {/* To Do (Pendiente) */}
                  <div className="flex flex-col min-w-[200px]">
                      <div className="flex items-center justify-between mb-3 px-1">
                          <h4 className="text-xs font-bold uppercase text-white/50 flex items-center gap-2"><Circle size={10}/> Por Hacer</h4>
                          <span className="bg-white/10 text-[10px] px-1.5 rounded text-white/50">{tasks.filter(t => !t.done && (!t.status || t.status === 'todo')).length}</span>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                          {tasks.filter(t => !t.done && (!t.status || t.status === 'todo')).map(t => (
                              <div key={t.id} className="bg-[#1a1a1a] p-3 rounded-xl border border-white/5 hover:border-white/20 group relative">
                                  <p className="text-sm font-medium text-white mb-2">{t.text}</p>
                                  <div className="flex justify-between items-center">
                                      <span className="text-[10px] text-white/30">{new Date(t.date).toLocaleDateString()}</span>
                                      <button onClick={() => updateTask(t.id, { status: 'in_progress' })} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-all" title="Mover a En Curso">
                                          <ArrowUpRight size={14}/>
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* In Progress */}
                  <div className="flex flex-col min-w-[200px]">
                      <div className="flex items-center justify-between mb-3 px-1">
                          <h4 className="text-xs font-bold uppercase text-[#E8A631] flex items-center gap-2"><Clock size={10}/> En Curso</h4>
                          <span className="bg-[#E8A631]/10 text-[10px] px-1.5 rounded text-[#E8A631]">{tasks.filter(t => !t.done && t.status === 'in_progress').length}</span>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 bg-white/5 rounded-xl p-2 border border-white/5 border-dashed">
                          {tasks.filter(t => !t.done && t.status === 'in_progress').map(t => (
                              <div key={t.id} className="bg-[#252525] p-3 rounded-xl border border-l-4 border-l-[#E8A631] border-white/5 group shadow-lg">
                                  <p className="text-sm font-bold text-white mb-2">{t.text}</p>
                                  <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                                      <button onClick={() => updateTask(t.id, { status: 'todo' })} className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white"><ArrowDownRight size={14} className="rotate-90"/></button>
                                      <button onClick={() => toggleTask(t.id)} className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-[10px] font-bold rounded transition-colors">Finalizar</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Done */}
                  <div className="flex flex-col min-w-[200px]">
                      <div className="flex items-center justify-between mb-3 px-1">
                          <h4 className="text-xs font-bold uppercase text-green-500 flex items-center gap-2"><CheckCircle size={10}/> Completado</h4>
                          <span className="bg-green-500/10 text-[10px] px-1.5 rounded text-green-500">{tasks.filter(t => t.done).length}</span>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                           {tasks.filter(t => t.done).slice(0, 10).map(t => (
                              <div key={t.id} className="bg-white/5 p-3 rounded-xl border border-transparent opacity-50 hover:opacity-100 transition-opacity">
                                  <p className="text-sm text-white/50 line-through mb-1">{t.text}</p>
                                  <div className="flex justify-between">
                                      <span className="text-[10px] text-white/20">Finalizado</span>
                                      <button onClick={() => removeTask(t.id)} className="text-white/20 hover:text-red-400"><Trash2 size={12}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

              </div>
          </div>
      </Modal>

      {/* Partner Quick View Modal (New) */}
      <Modal isOpen={!!selectedPartner} onClose={() => setSelectedPartner(null)} title="Quick View: Partner" size="xl">
          {selectedPartner && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  {/* 1. Header & KPI */}
                  <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-black shadow-lg ${theme.accentBg}`}>
                              {selectedPartner.company.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold text-white">{selectedPartner.company}</h2>
                              <p className="text-white/50">{selectedPartner.role} • {selectedPartner.name}</p>
                              <div className="flex gap-2 mt-2">
                                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-white/70 border border-white/5">Proveedor Clave</span>
                                  <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-xs border border-green-500/20 flex items-center gap-1"><Star size={10} fill="currentColor"/> Top Tier</span>
                              </div>
                          </div>
                      </div>
                      
                      {/* Strategic KPI - PHASE 1: Hidden fake score */}
                      <div className="text-right opacity-50">
                          <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Performance Score</p>
                          <div className="flex items-end justify-end gap-2">
                              <span className="text-4xl font-bold text-white tracking-tighter">--<span className="text-lg text-white/40">%</span></span>
                              <div className="flex mb-1.5 gap-0.5">
                                  <div className="w-1.5 h-4 bg-green-500 rounded-sm"></div>
                                  <div className="w-1.5 h-3 bg-green-500/50 rounded-sm"></div>
                                  <div className="w-1.5 h-2 bg-green-500/20 rounded-sm"></div>
                              </div>
                          </div>
                          <p className="text-xs text-white/30 font-bold mt-1">Data Pendiente</p>
                      </div>
                  </div>

                  <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 2. Strategic Column */}
                      <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase text-white/40 flex items-center gap-2"><Activity size={14} className={theme.accent}/> Métricas Estratégicas</h4>
                          
                          {/* Share of Wallet - PHASE 1: Data Truth (Hidden if no real data) */}
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5 relative overflow-hidden">
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                                   <div className="bg-black/80 px-3 py-1 rounded-full border border-white/10 text-[10px] text-white/50 uppercase font-bold tracking-wider">
                                       Próximamente: Datos Reales
                                   </div>
                              </div>
                              <div className="flex justify-between mb-2 opacity-30">
                                  <span className="text-sm font-bold text-white">Share of Wallet</span>
                                  <span className="text-sm font-bold text-white">--%</span>
                              </div>
                              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mb-2 opacity-30">
                                  <div className="bg-blue-500 h-full w-[0%] rounded-full"></div>
                              </div>
                              <p className="text-xs text-white/50 opacity-30">Cálculo basado en facturación real.</p>
                          </div>

                          {/* YTD Investment - PHASE 1: Data Truth (Hidden if no real data) */}
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex justify-between items-center opacity-50 grayscale">
                              <div>
                                  <p className="text-xs text-white/50 uppercase font-bold">Inversión YTD</p>
                                  <p className="text-xl font-bold text-white tracking-tight">--</p>
                              </div>
                              <div className="p-2 bg-white/5 rounded-lg text-white/20">
                                  <TrendingUp size={20} />
                              </div>
                          </div>
                      </div>

                      {/* 3. Operational Column */}
                      <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase text-white/40 flex items-center gap-2"><Briefcase size={14} className={theme.accent}/> Operatividad Actual</h4>
                          
                          {/* Simulated Active Campaigns */}
                          <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                              <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] font-bold text-white/50 uppercase">Proyectos Activos (2)</div>
                              <div className="p-2 space-y-1">
                                  {[1,2].map(i => (
                                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                                          <div className="flex-1">
                                              <p className="text-xs font-bold text-white">Lanzamiento Q{i}</p>
                                              <p className="text-[10px] text-white/40">En curso • Finaliza en 12 días</p>
                                          </div>
                                          <button className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white"><Eye size={12}/></button>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                             <a 
                                href={`mailto:${selectedPartner.email}?subject=Consulta 360 - ${selectedPartner.company}&body=Hola ${selectedPartner.name},\n\n`}
                                className="py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all hover:scale-[1.02]"
                                title="Enviar Correo"
                             >
                                 <Mail size={14}/> Email
                             </a>
                             <a 
                                href={`https://teams.microsoft.com/l/call/0/0?users=${selectedPartner.email}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2.5 rounded-lg bg-[#5059C9]/20 hover:bg-[#5059C9]/30 border border-[#5059C9]/30 flex items-center justify-center gap-2 text-xs font-bold text-[#bbc0ff] transition-all hover:scale-[1.02]"
                                title="Llamar por Teams"
                             >
                                 <Phone size={14} className="rotate-45"/> Teams
                             </a>
                             <a 
                                href={`https://wa.me/${selectedPartner.phone?.replace(/[^0-9]/g, '') || ''}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="py-2.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 flex items-center justify-center gap-2 text-xs font-bold text-green-400 transition-all hover:scale-[1.02]"
                                title="WhatsApp"
                             >
                                 <Phone size={14}/> WhatsApp
                             </a>
                             <button onClick={() => { setSelectedPartner(null); navigate('/directory', { state: { targetId: selectedPartner.id } }); }} className="py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all hover:text-[#E8A631] flex items-center justify-center gap-2 text-xs font-bold" title="Ver Ficha Completa">
                                 <ArrowDownRight size={14}/> Ficha
                             </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

    </>
  );
};

export default Dashboard;
