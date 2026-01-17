
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const GlassTable = ({ columns, data, onRowClick, onRowContextMenu }) => {
    const { theme } = useTheme();
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [colWidths, setColWidths] = useState({});

    // Initialize widths
    React.useEffect(() => {
        const initialWidths = {};
        columns.forEach(col => {
            if (col.width) initialWidths[col.accessor] = col.width;
        });
        setColWidths(initialWidths);
    }, []);

    // Resize Logic
    const handleResizeMouseDown = (e, accessor) => {
        e.preventDefault();
        e.stopPropagation();
        
        const headerCell = e.target.parentElement;
        const startX = e.pageX;
        const startWidth = headerCell.offsetWidth; // Always use current computed pixel width
        
        // Dynamic Min Width: Approx 10px per char + 48px fixed buffer (padding/icon)
        const textContent = headerCell.textContent || '';
        const minWidth = Math.max(80, (textContent.length * 10) + 48);

        const handleMouseMove = (moveEvent) => {
            const currentWidth = startWidth + (moveEvent.pageX - startX);
            const newWidth = Math.max(minWidth, currentWidth);
            
            setColWidths(prev => ({
                ...prev,
                [accessor]: `${newWidth}px`
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

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
                        className={`px-4 py-3 flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none relative group ${col.className || ''}`}
                        style={{ width: colWidths[col.accessor] || col.width || 'auto', flex: (colWidths[col.accessor] || col.width) ? 'none' : 1 }}
                        onClick={() => col.sortable && handleSort(col.accessor)}
                    >
                        {col.header}
                        
                        {/* Resize Handle */}
                        <div 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#E8A631] z-20"
                            onMouseDown={(e) => handleResizeMouseDown(e, col.accessor)}
                            onClick={(e) => e.stopPropagation()} // Prevent sort trigger
                        ></div>
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
                                    style={{ width: colWidths[col.accessor] || col.width || 'auto', flex: (colWidths[col.accessor] || col.width) ? 'none' : 1 }}
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
