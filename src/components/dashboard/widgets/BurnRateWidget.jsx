
import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../utils/dataUtils';

const BurnRateWidget = ({ value = 0, trend = 'neutral' }) => {
    const { theme } = useTheme();

    return (
        <div className={`${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between`}>
            <div>
                 <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Burn Rate (Est.)</p>
                 <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white">{formatCurrency(value)}</span>
                    <span className="text-xs text-white/50">/día</span>
                 </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                 <TrendingUp size={18} />
            </div>
        </div>
    );
};

export default BurnRateWidget;
