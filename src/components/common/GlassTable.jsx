
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ArrowUpDown } from 'lucide-react';

const GlassTable = ({ columns, data, onRowClick, onRowContextMenu }) => {
    const { theme } = useTheme();
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;
        
        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (typeof aValue === 'string') {
                 return sortConfig.direction === 'asc' 
                    ? aValue.localeCompare(bValue) 
                    : bValue.localeCompare(aValue);
            }
            if (typeof aValue === 'number') {
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            return 0;
        });
    }, [data, sortConfig]);

    return (
        <div className={`w-full overflow-hidden rounded-xl border border-white/10 ${theme.cardBg} backdrop-blur-md shadow-xl flex flex-col h-full`}>
            {/* Header */}
            <div className={`flex items-center border-b border-white/10 bg-black/20 ${theme.textSecondary} text-xs font-bold uppercase tracking-wider sticky top-0 z-10`}>
                {columns.map((col, index) => (
                    <div 
                        key={index}
                        className={`px-4 py-3 flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none ${col.className || ''}`}
                        style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
                        onClick={() => col.sortable && handleSort(col.accessor)}
                    >
                        {col.header}
                        {col.sortable && (
                            <div className="flex flex-col">
                                {sortConfig.key === col.accessor ? (
                                    sortConfig.direction === 'asc' ? <ArrowUpDown size={12} className="text-[#E8A631]" /> : <ArrowUpDown size={12} className="text-[#E8A631] rotate-180" />
                                ) : (
                                    <ArrowUpDown size={12} className="opacity-30" />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {sortedData.length === 0 ? (
                    <div className="p-8 text-center text-white/40 text-sm">No se encontraron datos</div>
                ) : (
                    sortedData.map((row, rowIndex) => (
                        <div 
                            key={row.id || rowIndex}
                            onClick={() => onRowClick && onRowClick(row)}
                            onContextMenu={(e) => onRowContextMenu && onRowContextMenu(e, row)}
                            className={`flex items-center border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group animate-in slide-in-from-bottom-1 duration-300`}
                            style={{ animationDelay: `${Math.min(rowIndex * 50, 500)}ms` }}
                        >
                             {columns.map((col, colIndex) => (
                                <div 
                                    key={colIndex}
                                    className={`px-4 py-3 text-sm ${theme.text} truncate ${col.className || ''}`}
                                    style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
                                >
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GlassTable;
