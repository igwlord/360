
import React, { useMemo, memo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/dataUtils';

// CustomTooltip moved outside component to avoid recreation on each render
const CustomTooltip = ({ active, payload, theme, total }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        return (
            <div className={`${theme.tooltipBg} border border-white/10 p-2 rounded-lg shadow-xl backdrop-blur-xl`}>
                <p className="text-xs font-bold text-white mb-1">{item.name}</p>
                <p className="text-xs text-white/70">
                    {formatCurrency(item.value)} 
                    <span className="text-white/40 ml-1">({((item.value / total) * 100).toFixed(0)}%)</span>
                </p>
            </div>
        );
    }
    return null;
};

const RetailerShareWidget = memo(({ data = [] }) => {
    const { theme } = useTheme();

    // Sort by value desc
    const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value).slice(0, 5), [data]);
    const total = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

    // Memoize tooltip content to avoid recreation
    const tooltipContent = useMemo(() => 
        (props) => <CustomTooltip {...props} theme={theme} total={total} />,
        [theme, total]
    );

    return (
        <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-6 border border-white/10 flex flex-col h-full relative overflow-hidden group hover:bg-white/5 transition-colors`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                     <h3 className={`text-sm font-bold ${theme.textSecondary} uppercase tracking-wider flex items-center gap-2`}>
                        <ShoppingBag size={14} className={theme.accent} /> Retailer Share
                     </h3>
                     <p className="text-[10px] text-white/40 mt-1">Inversión por Cadena</p>
                </div>
                {/* Micro KPI */}
                <div className="text-right">
                    <span className={`text-xl font-bold ${theme.text}`}>{data.length}</span>
                    <span className="text-[10px] text-white/30 block">Activos</span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-[140px] relative z-10">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={70} 
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600 }} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <RechartsTooltip content={tooltipContent} cursor={{ fill: 'white', opacity: 0.05 }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                                {sortedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4ade80' : 'rgba(255,255,255,0.2)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-white/20">
                        <ShoppingBag size={24} className="mb-2 opacity-20" />
                        <span className="text-xs">Sin datos de inversión</span>
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className={`mt-2 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-bold ${theme.textSecondary} opacity-0 group-hover:opacity-100 transition-opacity`}>
                <span>Ver Reporte Detallado</span>
                <ArrowRight size={12} />
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tl from-white/5 to-transparent rounded-full blur-2xl pointer-events-none"></div>
        </div>
    );
});

RetailerShareWidget.displayName = 'RetailerShareWidget';

export default RetailerShareWidget;
