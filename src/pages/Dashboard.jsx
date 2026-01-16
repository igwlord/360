
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { DollarSign, TrendingUp, Users, Settings, Star, Plus, Sliders, Filter, Eye, Briefcase, Activity, ArrowDownRight, Mail, Phone, Trash2 } from 'lucide-react';
import { DonutChart, FilterPill, VisibilityToggle } from '../components/dashboard/Widgets';
import Modal from '../components/common/Modal';
import Tooltip from '../components/common/Tooltip';
import { useNavigate } from 'react-router-dom';

import { CheckCircle } from 'lucide-react';

const TaskItem = ({ task, theme }) => {
    const [completed, setCompleted] = React.useState(task.done);
    return (
        <div 
            onClick={() => setCompleted(!completed)}
            className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer ${completed ? 'bg-white/5 opacity-50' : 'bg-white/10 hover:bg-white/15'}`}
        >
            <div className={`w-5 h-5 rounded-full border border-white/30 flex items-center justify-center transition-colors ${completed ? theme.accentBg + ' border-transparent' : ''}`}>
                {completed && <CheckCircle size={12} className="text-black"/>}
            </div>
            <span className={`text-xs font-bold ${completed ? 'line-through text-white/50' : 'text-white'}`}>{task.text}</span>
        </div>
    );
};

const Dashboard = () => {
    // ... rest of the component

  const { theme } = useTheme();
  const { campaigns, budget, providerGroups, tasks, actions } = useData();
  const navigate = useNavigate();

  // Local State for Dashboard UI
  const [viewMode, setViewMode] = useState('strategic'); // 'strategic' | 'operational'
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('Todos'); 
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [taskView, setTaskView] = useState('pending'); // 'pending' | 'history'
  const [isRoiModalOpen, setIsRoiModalOpen] = useState(false);

  // Computed Data
  const filteredCampaigns = campaignFilter === 'Todos' ? campaigns : campaigns.filter(c => c.status === campaignFilter);
  
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
          <h1 className={`text-3xl font-bold ${theme.text} drop-shadow-sm tracking-tight`}>Dashboard 2026</h1>
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
                        {viewMode === 'strategic' && (
                            <div className="mb-4 text-left">
                                <h4 className={`text-[10px] uppercase tracking-wider ${theme.textSecondary} mb-2 font-bold flex items-center gap-1`}><Filter size={10}/> Estado Campañas (KPIs)</h4>
                                <div className="space-y-1">
                                    <FilterPill label="Todas" active={campaignFilter === 'Todos'} onClick={() => setCampaignFilter('Todos')} />
                                    <FilterPill label="En Curso" active={campaignFilter === 'En Curso'} onClick={() => setCampaignFilter('En Curso')} />
                                    <FilterPill label="Planificación" active={campaignFilter === 'Planificación'} onClick={() => setCampaignFilter('Planificación')} />
                                </div>
                            </div>
                        )}
                        <div className="text-left">
                            <h4 className={`text-[10px] uppercase tracking-wider ${theme.textSecondary} mb-2 font-bold flex items-center gap-1`}><Eye size={10}/> Visualización</h4>
                            <div className="space-y-2">
                                <VisibilityToggle label="Top Partners" checked={true} onChange={() => {}} disabled={true} />
                                <VisibilityToggle label="Actividad Reciente" checked={true} onChange={() => {}} disabled={true} />
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
            {/* Main KPI Card */}
            <div 
                onClick={() => setIsRoiModalOpen(true)}
                className={`md:col-span-2 ${theme.cardBg} backdrop-blur-md rounded-[24px] shadow-lg border border-white/10 p-8 flex flex-col justify-between relative overflow-hidden group min-h-[300px] cursor-pointer transition-all hover:scale-[1.01] hover:border-white/20`}
            >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:bg-white/10"></div>
                 <div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className={`text-2xl font-bold ${theme.text}`}>ROI & Presupuesto</h2>
                            <p className={`text-sm ${theme.textSecondary} mt-1`}>Análisis de rentabilidad anual ({campaignFilter})</p>
                        </div>
                        <div className={`p-3 rounded-2xl bg-white/10 ${theme.accent}`}><DollarSign size={24}/></div>
                    </div>
                    
                    <div className="flex items-center gap-12">
                        <DonutChart percentage={budget.percentage} size={120} />
                        <div className="space-y-6">
                            <div>
                                <p className={`text-sm ${theme.textSecondary} uppercase tracking-wider font-bold`}>Ejecutado</p>
                                <p className={`text-5xl font-bold ${theme.text} tracking-tighter`}>${budget.executed}M</p>
                            </div>
                            <div className="flex gap-8">
                                <div>
                                    <Tooltip text="Presupuesto total anual asignado">
                                        <p className={`text-[10px] ${theme.textSecondary} uppercase font-bold cursor-help`}>Total</p>
                                    </Tooltip>
                                    <p className={`text-xl font-medium ${theme.text} opacity-80`}>${budget.total}M</p>
                                </div>
                                <div>
                                    <Tooltip text="Monto restante para ejecutar (Total - Ejecutado)">
                                        <p className={`text-[10px] ${theme.textSecondary} uppercase font-bold cursor-help`}>Disponible</p>
                                    </Tooltip>
                                    <p className={`text-xl font-medium ${theme.accent}`}>${(budget.total - budget.executed).toFixed(1)}M</p>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
                    <TrendingUp className="text-green-500" size={20} />
                    <p className="text-white/80 text-sm">
                        {campaignFilter === 'Todos' 
                            ? <span>El rendimiento del Q1 está un <span className="text-green-400 font-bold">12%</span> por encima del objetivo.</span>
                            : <span>Mostrando métricas filtradas para campañas en estado: <span className="text-[#E8A631] font-bold">{campaignFilter}</span></span>
                        }
                    </p>
                 </div>
            </div>

            {/* Quick Stats Column */}
            <div className="space-y-6">
                <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-6 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer`} onClick={() => navigate('/campaigns')}>
                     <Tooltip text="Campañas actualmente en ejecución vs planificadas">
                        <h3 className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider mb-2 cursor-help text-left`}>Campañas {campaignFilter === 'Todos' ? 'Activas' : campaignFilter}</h3>
                     </Tooltip>
                    <div className="flex items-end justify-between">
                        <span className={`text-4xl font-bold ${theme.text}`}>{filteredCampaigns.length}</span>
                        <div className="text-right">
                            <span className="text-xs text-green-400 font-bold">{filteredCampaigns.filter(c => c.status === 'En Curso').length} En Curso</span>
                            <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                                <div 
                                    className="h-full bg-green-500 rounded-full transition-all duration-500" 
                                    style={{ width: `${(filteredCampaigns.filter(c => c.status === 'En Curso').length / (filteredCampaigns.length || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-6 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer`} onClick={() => navigate('/directory')}>
                   <Tooltip text="Total de proveedores con contratos activos">
                       <h3 className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider mb-2 cursor-help text-left`}>Partners Activos</h3>
                   </Tooltip>
                   <span className={`text-4xl font-bold ${theme.text}`}>{dashboardPartners.length}</span>
                </div>
                
                 <div className={`${theme.accentBg} rounded-[24px] p-6 text-black flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity`} onClick={() => navigate('/reports')}>
                   <div>
                       <h3 className="font-bold text-lg">Reporte Q1</h3>
                       <p className="text-sm opacity-70">Generar PDF</p>
                   </div>
                   <Briefcase size={24} />
                </div>
            </div>
          </div>
      )}

      {/* ROI Modal */}
      <Modal isOpen={isRoiModalOpen} onClose={() => setIsRoiModalOpen(false)} title="Detalle Financiero Global" size="lg">
            <div className="space-y-6">
                {/* 1. Global Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                        <p className="text-xs text-white/50 uppercase font-bold mb-1">Presupuesto Total</p>
                        <p className="text-2xl font-bold text-white">${budget.total.toFixed(1)}M</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                        <p className="text-xs text-white/50 uppercase font-bold mb-1">Ejecutado</p>
                        <p className="text-2xl font-bold text-white">${budget.executed.toFixed(1)}M</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                        <p className="text-xs text-white/50 uppercase font-bold mb-1">Disponible</p>
                        <p className={`text-2xl font-bold ${budget.total - budget.executed >= 0 ? 'text-green-400' : 'text-red-400'}`}>${(budget.total - budget.executed).toFixed(1)}M</p>
                    </div>
                </div>

                {/* 2. Brand Share (Who spends the most?) */}
                <div>
                     <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Briefcase size={16} className={theme.accent}/> Inversión por Marca</h4>
                     <div className="space-y-3">
                        {Object.entries(campaigns.reduce((acc, c) => {
                            const cost = c.transactions?.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0) || 0;
                            if (cost > 0) acc[c.brand || 'Otros'] = (acc[c.brand || 'Otros'] || 0) + cost;
                            return acc;
                        }, {})).sort(([,a], [,b]) => b - a).map(([brand, amount], i, arr) => {
                            const total = arr.reduce((sum, [,v]) => sum + v, 0);
                            const percent = (amount / total) * 100;
                            return (
                                <div key={brand} className="bg-white/5 p-3 rounded-lg flex items-center justify-between group hover:bg-white/10 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-white text-sm">{brand}</span>
                                            <span className="text-xs text-white/50">${(amount / 1000000).toFixed(2)}M ({percent.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {campaigns.every(c => !c.transactions?.some(t => t.type === 'expense')) && (
                            <p className="text-white/30 text-xs italic">Aún no hay gastos registrados para calcular el share.</p>
                        )}
                     </div>
                </div>

                {/* 3. Top Expensive Campaigns */}
                <div>
                     <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><TrendingUp size={16} className={theme.accent}/> Top Campañas (Mayor Gasto)</h4>
                     <div className="space-y-2">
                        {campaigns
                            .map(c => ({ ...c, executed: c.transactions?.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0) || 0 }))
                            .sort((a, b) => b.executed - a.executed)
                            .slice(0, 5)
                            .filter(c => c.executed > 0)
                            .map((c, i) => (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full ${c.statusColor} flex items-center justify-center text-[10px] font-bold text-white/80`}>{i + 1}</div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{c.name}</p>
                                            <p className="text-[10px] text-white/40">{c.brand}</p>
                                        </div>
                                    </div>
                                    <p className="font-mono font-bold text-white">${(c.executed / 1000000).toFixed(2)}M</p>
                                </div>
                            ))
                        }
                     </div>
                </div>
            </div>
      </Modal>

      {/* OPERATIONAL VIEW - OPTIMIZED */}
      {viewMode === 'operational' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-right-4 duration-500 h-full">
            
            {/* Timeline Column - Uses more space */}
            <div className={`md:col-span-2 ${theme.cardBg} backdrop-blur-md rounded-[24px] shadow-lg border border-white/10 p-6 flex flex-col h-[calc(100vh-200px)]`}>
                <h2 className={`text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}><Activity size={18} className={theme.accent}/> Actividad Reciente</h2>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {filteredCampaigns.map((camp) => (
                      <div key={camp.id} className="group cursor-pointer bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all border border-transparent hover:border-white/10" onClick={() => setSelectedCampaign(camp)}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textSecondary}`}>{camp.brand}</span>
                                <h4 className={`text-base font-bold ${theme.text} group-hover:${theme.accent} transition-colors`}>{camp.name}</h4>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-lg bg-black/20 ${camp.statusColor} text-white/90 font-bold`}>{camp.status}</span>
                        </div>
                        <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-3">
                            <div className={`h-full ${camp.statusColor} opacity-80 transition-all duration-1000`} style={{ width: `${camp.progress}%` }}></div>
                        </div>
                      </div>
                    ))}
                </div>
            </div>

            {/* Partners & Tasks & New Campaign - Compacted */}
            <div className="md:col-span-2 flex flex-col gap-6 h-[calc(100vh-200px)]">
                
                {/* Row 1: Top Partners */}
                 <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-5 flex-[2] flex flex-col overflow-hidden`}>
                    <h2 className={`text-sm font-bold ${theme.text} mb-3 flex items-center gap-2 uppercase tracking-wider`}><Users size={16} className={theme.accent}/> Top Partners</h2>
                    <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar">
                        {dashboardPartners.map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10" onClick={() => setSelectedPartner(p)}>
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-xs font-bold ${theme.accent}`}>{p.company.charAt(0)}</div>
                                <div className="overflow-hidden min-w-0">
                                     <p className={`text-xs font-bold truncate ${theme.text}`}>{p.company}</p>
                                     <p className="text-[10px] text-white/40 truncate">Proveedor Clave</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Row 2: Tasks & Action */}
                <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                     {/* Tasks List - Compact & Dynamic */}
                     <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-5 flex flex-col overflow-hidden`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-white/50">
                                <Briefcase size={16}/>
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {taskView === 'pending' ? 'Pendientes' : 'Historial'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setTaskView(taskView === 'pending' ? 'history' : 'pending')}
                                    className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white transition-colors"
                                >
                                    {taskView === 'pending' ? 'Ver Historial' : 'Ver Pendientes'}
                                </button>
                                {taskView === 'pending' && <span className="text-[10px] bg-[#E8A631] text-black font-bold px-1.5 py-0.5 rounded">{tasks.filter(t => !t.done).length}</span>}
                            </div>
                        </div>
                        
                        <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
                             {/* Input for New Task */}
                             {taskView === 'pending' && (
                                <div className="mb-2 px-1">
                                    <input 
                                        type="text" 
                                        placeholder="+ Nueva Tarea..." 
                                        className="w-full bg-transparent border-b border-white/10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E8A631] pb-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                actions.addTask(e.target.value.trim());
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                             )}

                             {/* Task List */}
                             {tasks
                                .filter(t => taskView === 'pending' ? !t.done : t.done)
                                .sort((a,b) => new Date(b.date) - new Date(a.date))
                                .map(task => (
                                    <div 
                                        key={task.id}
                                        className={`flex items-center gap-3 p-2 rounded-xl transition-all group ${task.done ? 'bg-white/5 opacity-50' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        <div 
                                            onClick={() => actions.toggleTask(task.id)}
                                            className={`w-4 h-4 rounded-full border border-white/30 flex items-center justify-center cursor-pointer transition-colors ${task.done ? theme.accentBg + ' border-transparent' : 'hover:border-white'}`}
                                        >
                                            {task.done && <CheckCircle size={10} className="text-black"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold truncate ${task.done ? 'line-through text-white/50' : 'text-white'}`}>{task.text}</p>
                                            {taskView === 'history' && <p className="text-[10px] text-white/30">{new Date(task.date).toLocaleDateString()}</p>}
                                        </div>
                                        {taskView === 'history' && (
                                            <button onClick={() => actions.removeTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400">
                                                <Trash2 size={12}/>
                                            </button>
                                        )}
                                    </div>
                                ))
                             }
                             
                             {tasks.filter(t => taskView === 'pending' ? !t.done : t.done).length === 0 && (
                                 <div className="text-center py-4 text-white/20 text-xs italic">
                                     {taskView === 'pending' ? 'Todo al día' : 'Sin historial'}
                                 </div>
                             )}
                        </div>
                     </div>

                     {/* New Campaign Button - Compact */}
                     <div onClick={() => navigate('/campaigns', { state: { openModal: true } })} className={`group relative overflow-hidden ${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-all`}>
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${theme.accentBg} transition-opacity duration-500`}></div>
                        <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center text-black mb-2 shadow-lg group-hover:scale-110 transition-transform`}><Plus size={20} strokeWidth={3}/></div>
                        <span className="font-bold text-white text-sm">Nueva Campaña</span>
                        <span className="text-[10px] text-white/40 mt-1">Crear desde cero</span>
                     </div>
                </div>
            </div>
          </div>
      )}

      {/* Campaign Details Modal (Shared) */}
      <Modal isOpen={!!selectedCampaign} onClose={() => setSelectedCampaign(null)} title="Detalle de Campaña" size="lg">
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
                      
                      {/* Strategic KPI */}
                      <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Performance Score</p>
                          <div className="flex items-end justify-end gap-2">
                              <span className="text-4xl font-bold text-white tracking-tighter">98<span className="text-lg text-white/40">%</span></span>
                              <div className="flex mb-1.5 gap-0.5">
                                  <div className="w-1.5 h-4 bg-green-500 rounded-sm"></div>
                                  <div className="w-1.5 h-3 bg-green-500/50 rounded-sm"></div>
                                  <div className="w-1.5 h-2 bg-green-500/20 rounded-sm"></div>
                              </div>
                          </div>
                          <p className="text-xs text-green-400 font-bold mt-1">Excelencia Operativa</p>
                      </div>
                  </div>

                  <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 2. Strategic Column */}
                      <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase text-white/40 flex items-center gap-2"><Activity size={14} className={theme.accent}/> Métricas Estratégicas</h4>
                          
                          {/* Share of Wallet */}
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                              <div className="flex justify-between mb-2">
                                  <span className="text-sm font-bold text-white">Share of Wallet</span>
                                  <span className="text-sm font-bold text-white">24%</span>
                              </div>
                              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mb-2">
                                  <div className="bg-blue-500 h-full w-[24%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                              </div>
                              <p className="text-xs text-white/50">Representa el 24% de tu inversión anual total.</p>
                          </div>

                          {/* YTD Investment */}
                          <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex justify-between items-center">
                              <div>
                                  <p className="text-xs text-white/50 uppercase font-bold">Inversión YTD</p>
                                  <p className="text-xl font-bold text-white tracking-tight">$1.2M</p>
                              </div>
                              <div className="p-2 bg-white/5 rounded-lg text-green-400">
                                  <TrendingUp size={20} />
                              </div>
                          </div>
                      </div>

                      {/* 3. Operational Column */}
                      <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase text-white/40 flex items-center gap-2"><Briefcase size={14} className={theme.accent}/> Operatividad Actual</h4>
                          
                          {/* Simulated Active Campaigns */}
                          <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                              <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] font-bold text-white/50 uppercase">Campañas Activas (2)</div>
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
