import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, AlertCircle, Clock, Flag, Gift, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpcomingDeadlinesWidget = ({ campaigns = [], events = [] }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const deadlines = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const next30Days = new Date(today);
        next30Days.setDate(today.getDate() + 30);

        // 1. Process Campaigns (End Dates)
        const campaignDeadlines = campaigns
            .filter(c => c.status === 'En Curso' || c.status === 'Planificación')
            .map(c => {
                // Try to parse end date from range string "DD MMM - DD MMM" if typical, or use raw date if single
                // Assuming c.date format for now or explicit endDate if available
                // Simplification for MVP: Use c.date as start, and assume a deadline logic or use 'deadline' field if exists.
                // If c.endDate is missing, use c.date
                const dateStr = c.endDate || c.date; 
                // Parsing depends on format. Assuming standard ISO or JS Date parsable for now to be safe, 
                // or trusting the "Year" filter logic from utils. 
                // For this widget, let's look for explicit ISO strings or standard formats.
                const date = new Date(dateStr);
                return {
                    id: c.id,
                    title: c.name,
                    type: 'campaign', // 'Exhibiciones' | 'Eventos' -> treat as project
                    subtype: c.type,
                    date: date,
                    originalDate: dateStr
                };
            })
            .filter(item => !isNaN(item.date.getTime()));

        // 2. Process Calendar Events
        const calendarDeadlines = events.map(e => ({
            id: e.id,
            title: e.title,
            type: 'event',
            subtype: e.type,
            date: new Date(e.date),
            originalDate: e.date
        })).filter(item => !isNaN(item.date.getTime()));

        // 3. Merge & Filter
        const all = [...campaignDeadlines, ...calendarDeadlines];
        
        return all.filter(item => {
            return item.date >= today && item.date <= next30Days;
        }).sort((a, b) => a.date - b.date);

    }, [campaigns, events]);

    const getDaysRemaining = (targetDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    const getUrgencyStyles = (days) => {
        if (days <= 3) return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: AlertCircle };
        if (days <= 7) return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: Clock };
        return { bg: 'bg-white/5', text: 'text-white/60', border: 'border-white/5', icon: Flag };
    };

    return (
        <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] border border-white/10 p-5 flex flex-col h-full min-h-[300px]`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Calendar size={16} className={theme.accent}/> Próximos Vencimientos
                </h3>
                <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-white/50">{deadlines.length} prox.</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {deadlines.length > 0 ? deadlines.map(item => {
                    const days = getDaysRemaining(item.date);
                    const style = getUrgencyStyles(days);
                    const Icon = style.icon;

                    return (
                        <div 
                            key={`${item.type}-${item.id}`}
                            onClick={() => {
                                if (item.type === 'campaign') navigate('/campaigns', { state: { openId: item.id } });
                                else navigate('/calendar');
                            }}
                            className={`p-3 rounded-xl border ${style.border} ${style.bg} hover:bg-white/10 transition-colors cursor-pointer group flex items-start gap-3`}
                        >
                            <div className={`mt-1 ${style.text}`}>
                                <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-white group-hover:text-[#E8A631] truncate transition-colors">{item.title}</h4>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1">
                                        {item.subtype === 'Eventos' || item.type === 'event' ? <Gift size={8}/> : <Megaphone size={8}/>}
                                        {item.subtype || item.type}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold ${style.text}`}>
                                        {days === 0 ? 'Hoy' : `${days}d`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-white/20 p-4">
                        <Flag size={32} className="mb-2 opacity-50"/>
                        <p className="text-xs">Sin vencimientos críticos<br/>en los próximos 30 días.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingDeadlinesWidget;
