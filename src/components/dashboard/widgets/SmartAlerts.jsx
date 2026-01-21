import React, { useMemo } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { AlertCircle, ArrowUpRight, Clock, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SmartAlerts = ({ campaigns = [], events = [] }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    // Calculate Alerts
    const activeAlerts = useMemo(() => {
        const alerts = [];
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        // 1. Deadlines (Campaigns Ending Soon)
        campaigns.forEach(c => {
            if (c.status === 'En Curso' && c.date) {
                const endDate = new Date(c.date); // Assuming mapped to single date for MVP or endDate
                // Simple heuristic: if date is within 48h and not passed
                if (endDate >= now && endDate <= twoDaysFromNow) {
                    alerts.push({
                        id: `dead-${c.id}`,
                        type: 'deadline',
                        title: 'Entrega Inminente',
                        desc: `La campaña "${c.name}" finaliza en menos de 48h.`,
                        date: endDate.toLocaleDateString(),
                        rawDate: endDate, // For Navigation
                        link: '/proyectos',
                        priority: 'high'
                    });
                }
            }
            
            // 2. Budget Risks (Mock logic until transactions are fully linked per item)
            // Helper to safe parse
             const parseVal = (val) => {
                 if (typeof val === 'number') return val;
                 if (!val) return 0;
                 return parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;
             };

             const cost = parseVal(c.cost);
             const budgetVal = parseVal(c.budget);

             if (budgetVal > 0 && cost > budgetVal) {
                 alerts.push({
                     id: `budget-${c.id}`,
                     type: 'budget',
                     title: 'Desvío Presupuestario',
                     desc: `"${c.name}" excede el presupuesto en $${(cost - budgetVal).toFixed(0)}.`,
                     date: 'Hoy',
                     link: '/proyectos',
                     priority: 'medium'
                 });
             }
        });

        // 3. Calendar Events Soon
        events.forEach(e => {
            const evtDate = new Date(e.start || e.date);
            if (evtDate >= now && evtDate <= twoDaysFromNow) {
                alerts.push({
                     id: `evt-${e.id}`,
                     type: 'event',
                     title: 'Evento Próximo',
                     desc: e.title,
                     date: evtDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                     rawDate: evtDate, // For Navigation
                     link: '/calendar',
                     priority: 'high'
                });
            }
        });

        return alerts.sort((a,b) => (a.priority === 'high' ? -1 : 1));
    }, [campaigns, events]);

    return (
        <div className={`h-full min-h-[300px] ${theme.cardBg} backdrop-blur-md rounded-[32px] border border-white/10 p-6 flex flex-col relative overflow-hidden shadow-2xl`}>
             <div className="flex items-center gap-3 mb-6 z-10 transition-all hover:translate-x-1">
                <div className={`p-2 rounded-xl bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]`}><AlertCircle size={22}/></div>
                <div>
                    <h3 className={`text-lg font-bold ${theme.text} tracking-tight`}>Alertas Inteligentes</h3>
                    <p className={`text-xs ${theme.textSecondary} font-medium`}>Requieren Atención ({activeAlerts.length})</p>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 z-10">
                {activeAlerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 animate-pulse">
                            <span className="text-3xl">✨</span>
                        </div>
                        <p className="text-base font-bold text-white">Sistema Activo</p>
                        <p className="text-xs text-white/50 max-w-[200px] leading-relaxed">Monitoreamos el estado de tus proyectos en tiempo real. Aquí te avisaremos si hay deadlines críticos o desvíos de presupuesto.</p>
                    </div>
                ) : (
                    activeAlerts.map(alert => (
                        <div 
                            key={alert.id} 
                            onClick={() => {
                                // Enhance Navigation with Context
                                if (alert.type === 'event' || alert.type === 'deadline') {
                                    // Navigate to Calendar with specific date highlight
                                    navigate('/calendar', { 
                                        state: { 
                                            focusDate: alert.rawDate, // Pass real Date object or ISO string
                                            highlightId: alert.id
                                        } 
                                    });
                                } else {
                                    navigate(alert.link);
                                }
                            }}
                            className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 hover:scale-[1.02] transition-all group flex items-start gap-4 cursor-pointer relative overflow-hidden"
                        >
                            {/* Priority Indicator */}
                            {alert.priority === 'high' && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-bl-lg shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>}

                            <div className={`mt-1 min-w-[32px] h-8 rounded-lg flex items-center justify-center ${
                                alert.type === 'deadline' ? 'bg-red-500/20 text-red-400' : 
                                alert.type === 'budget' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                                {alert.type === 'deadline' && <Clock size={16}/>}
                                {alert.type === 'budget' && <DollarSign size={16}/>}
                                {alert.type === 'event' && <Calendar size={16}/>}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white mb-0.5 group-hover:text-[#E8A631] transition-colors truncate">{alert.title}</h4>
                                <p className="text-xs text-white/60 mb-2 leading-relaxed">{alert.desc}</p>
                                <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2">
                                    <span className="text-[10px] font-mono opacity-60 bg-black/30 px-2 py-0.5 rounded text-white">{alert.date}</span>
                                    <span className="text-[10px] uppercase font-bold text-white/30 group-hover:text-white transition-colors flex items-center gap-1">
                                        Ver <ArrowUpRight size={10}/>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
             </div>
        </div>
    );
};

export default SmartAlerts;
