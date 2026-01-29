import React, { memo, useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { DollarSign, ChevronUp, ChevronDown, Activity, Settings, TrendingUp, ArrowUpRight } from 'lucide-react';
import { DonutChart } from '../Widgets';
import { formatCurrency } from '../../../utils/dataUtils';
import Tooltip from '../../common/Tooltip';
import { useNavigate } from 'react-router-dom';

const FinancialPulse = memo(({ metrics, isExpanded, setIsExpanded }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    return (
        <div 
            className={`md:col-span-2 ${theme.cardBg} backdrop-blur-md rounded-[32px] shadow-2xl border border-white/10 p-8 flex flex-col relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'row-span-2' : ''}`}
            style={{ height: isExpanded ? 'auto' : '340px' }}
        >
             <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
             
             {/* Header & Toggle */}
             <div className="flex justify-between items-start mb-6 z-10">
                <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer group">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className={`text-2xl font-bold ${theme.text} group-hover:text-[#E8A631] transition-colors`}>Estrategia de Inversión</h2>
                        {isExpanded ? <ChevronUp size={20} className="text-white/50" /> : <ChevronDown size={20} className="text-white/50" />}
                    </div>
                    <p className={`text-sm ${theme.textSecondary}`}>
                        {isExpanded ? 'Análisis detallado de rentabilidad por proyecto' : 'Vista general de ejecución y presupuesto'}
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
             {isExpanded && (
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
                                {useMemo(() => 
                                    metrics.campaigns.sort((a,b)=>b.actualCost-a.actualCost).slice(0,5),
                                    [metrics.campaigns]
                                ).map(c => (
                                    <tr 
                                        key={c.id} 
                                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                                        onClick={() => navigate('/projects', { state: { openId: c.id, activeTab: 'financial' } })}
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
             {!isExpanded && (
                 <div 
                     onClick={() => setIsExpanded(true)}
                     className="mt-auto pt-4 flex justify-center items-center text-xs text-white/30 uppercase tracking-widest gap-2 cursor-pointer hover:text-white transition-colors"
                 >
                     <ChevronDown size={14} className="animate-bounce"/> Ver Análisis Completo
                 </div>
             )}
        </div>
    );
});

FinancialPulse.displayName = 'FinancialPulse';

export default FinancialPulse;
