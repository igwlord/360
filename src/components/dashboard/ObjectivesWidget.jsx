import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useTransactions } from '../../hooks/useTransactions';
import { Target, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/dataUtils';

const ObjectivesWidget = () => {
    const { theme } = useTheme();
    const { data: transactions = [] } = useTransactions();

    // Configuration (Could be moved to Settings later)
    const TARGET_MONTHLY_REVENUE = 100000; // $100k Target

    const metrics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let totalIncome = 0;
        let totalExpense = 0;

        // Iterate independent transactions stream
        transactions.forEach(t => {
             const tDate = new Date(t.date);
             if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                 const amount = parseFloat(t.amount) || 0;
                 if (t.type === 'income') totalIncome += amount;
                 if (t.type === 'expense') totalExpense += amount;
             }
        });

        const netRevenue = totalIncome - totalExpense;
        const progress = Math.min((netRevenue / TARGET_MONTHLY_REVENUE) * 100, 100);
        
        return {
            netRevenue,
            progress,
            totalIncome,
            totalExpense
        };
    }, [transactions]); // Campaigns not strictly needed for revenue if derived from transactions

    return (
        <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-6 border border-white/10 relative overflow-hidden group`}>
             <div className="flex justify-between items-start mb-4">
                 <div>
                     <h3 className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider flex items-center gap-2`}>
                         <Target size={16} className={theme.accent}/> Objetivos Mensuales
                     </h3>
                     <p className="text-[10px] text-white/40">Net Revenue vs Target</p>
                 </div>
                 <div className={`p-2 rounded-full bg-white/5 border border-white/5 ${metrics.netRevenue >= TARGET_MONTHLY_REVENUE ? 'text-green-400' : 'text-white/50'}`}>
                     <TrendingUp size={18} />
                 </div>
             </div>

             <div className="flex items-end justify-between mb-2">
                 <div>
                     <p className={`text-3xl font-bold ${theme.text} tracking-tighter`}>
                         {formatCurrency(metrics.netRevenue)}
                     </p>
                     <p className="text-xs text-white/40">
                         Objetivo: {formatCurrency(TARGET_MONTHLY_REVENUE)}
                     </p>
                 </div>
                 <div className="text-right">
                     <p className={`text-xl font-bold ${metrics.progress >= 100 ? 'text-green-400' : metrics.progress >= 50 ? 'text-[#E8A631]' : 'text-red-400'}`}>
                         {metrics.progress.toFixed(0)}%
                     </p>
                 </div>
             </div>

             {/* Progress Bar */}
             <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden mb-4 border border-white/5">
                 <div 
                    className={`h-full rounded-full transition-all duration-1000 ${metrics.progress >= 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : metrics.progress >= 50 ? 'bg-[#E8A631]' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(metrics.progress, 5)}%` }} // Min width for visibility
                 ></div>
             </div>

             {/* Mini Stats */}
             <div className="grid grid-cols-2 gap-2 mt-auto">
                 <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                     <p className="text-[10px] uppercase text-white/30 font-bold mb-1 flex items-center gap-1"><DollarSign size={10}/> Ingresos</p>
                     <p className="text-sm font-mono text-green-400">{formatCurrency(metrics.totalIncome)}</p>
                 </div>
                 <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                     <p className="text-[10px] uppercase text-white/30 font-bold mb-1 flex items-center gap-1"><TrendingDown size={10}/> Egresos</p>
                     <p className="text-sm font-mono text-red-400">{formatCurrency(metrics.totalExpense)}</p>
                 </div>
             </div>
        </div>
    );
};

export default ObjectivesWidget;
