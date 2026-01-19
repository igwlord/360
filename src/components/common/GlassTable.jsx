
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Check } from 'lucide-react';

const GlassTable = ({ 
    tableName = 'default-table', 
    columns, 
    data, 
    onRowClick, 
    onRowContextMenu,
    enableSelection = false,
    selectedIds = [],
    onSelectionChange
}) => {
    const { theme } = useTheme();
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    
    // Persist Column Widths
    const [colWidths, setColWidths] = useLocalStorage(`col-widths-${tableName}`, {});

    // Selection Internal Logic
    const [lastSelectedId, setLastSelectedId] = useState(null);

    // Initialize widths intelligently
    React.useEffect(() => {
        setColWidths(prev => {
            const newWidths = { ...prev };
            let hasChange = false;
            columns.forEach(col => {
                if (!newWidths[col.accessor] && col.width) {
                    newWidths[col.accessor] = col.width;
                    hasChange = true;
                }
            });
            return hasChange ? newWidths : prev;
        });
    }, [columns, setColWidths]);

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

    // --- Advanced Selection Logic ---
    const handleRowInteraction = (e, row) => {
        // If selection is disabled, just propagate click
        if (!enableSelection) {
            if (onRowClick) onRowClick(row);
            return;
        }

        // Logic assumes row has an 'id' field
        const id = row.id;
        let newSelected = [...selectedIds];

        if (e.ctrlKey || e.metaKey) {
            // CTRL/CMD + Click: Toggle
            if (newSelected.includes(id)) {
                newSelected = newSelected.filter(sid => sid !== id);
            } else {
                newSelected.push(id);
                setLastSelectedId(id);
            }
        } else if (e.shiftKey && lastSelectedId) {
            // SHIFT + Click: Range Select
            // Find index of current and last selected
            const currentIndex = sortedData.findIndex(r => r.id === id);
            const lastIndex = sortedData.findIndex(r => r.id === lastSelectedId);
            
            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);
            
            // Get range
            const rangeIds = sortedData.slice(start, end + 1).map(r => r.id);
            
            // Add unique IDs from range to selection
            const unique = new Set([...newSelected, ...rangeIds]);
            newSelected = Array.from(unique);
        } else {
            // Normal Click
            // Fix: Do NOT clear selection on normal click if we have an action (onRowClick).
            // This prevents "miss click" from wiping out a carefully made selection.
            if (onRowClick) {
                onRowClick(row);
                // Do NOT modify selection
            } else {
                // Use standard toggle if no action
                 if (newSelected.includes(id)) {
                    newSelected = newSelected.filter(sid => sid !== id);
                } else {
                    newSelected.push(id);
                    setLastSelectedId(id);
                }
            }
        }
        
        if (onSelectionChange) onSelectionChange(newSelected);
    };

    const handleCheckboxClick = (e, row) => {
        e.stopPropagation(); // Standard checkbox toggle
        const id = row.id;
        let newSelected = [...selectedIds];
        
        if (newSelected.includes(id)) {
            newSelected = newSelected.filter(sid => sid !== id);
        } else {
            newSelected.push(id);
            setLastSelectedId(id);
        }
        if (onSelectionChange) onSelectionChange(newSelected);
    }
    // ----------------------------

    return (
        <div className={`w-full overflow-hidden rounded-xl border border-white/10 ${theme.cardBg} backdrop-blur-md shadow-xl flex flex-col h-full`}>
            
            {/* Desktop Semantic Table */}
            <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar relative">
                 <table className="w-full text-left border-collapse">
                    <thead className={`sticky top-0 z-10 border-b border-white/10 bg-black/90 backdrop-blur-xl ${theme.textSecondary} text-xs font-bold uppercase tracking-wider`}>
                        <tr>
                            {enableSelection && (
                                <th className="pl-4 py-3 w-[40px]">
                                    <div 
                                        role="checkbox"
                                        aria-checked={selectedIds.length === data.length && data.length > 0}
                                        tabIndex={0}
                                        className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors outline-none focus:ring-2 focus:ring-[#E8A631] ${selectedIds.length === data.length && data.length > 0 ? 'bg-[#E8A631] border-[#E8A631] text-black' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
                                        onClick={() => {
                                            if (selectedIds.length === data.length) onSelectionChange([]); 
                                            else onSelectionChange(data.map(d => d.id));
                                        }}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter' || e.key === ' ') {
                                                if (selectedIds.length === data.length) onSelectionChange([]);
                                                else onSelectionChange(data.map(d => d.id));
                                            }
                                        }}
                                    >
                                        {selectedIds.length === data.length && selectedIds.length > 0 && <Check size={10} strokeWidth={4} />}
                                    </div>
                                </th>
                            )}
                            {columns.map((col, index) => (
                                <th 
                                    key={index}
                                    style={{ width: colWidths[col.accessor] || col.width || 'auto' }}
                                    className={`px-4 py-3 font-bold select-none relative group hover:text-white transition-colors cursor-pointer ${col.className || ''}`}
                                    onClick={() => col.sortable && handleSort(col.accessor)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.header}
                                    </div>
                                    <div 
                                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#E8A631] z-20"
                                        onMouseDown={(e) => handleResizeMouseDown(e, col.accessor)}
                                        onClick={(e) => e.stopPropagation()} 
                                    ></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="p-8 text-center text-white/40 text-sm">
                                    No se encontraron datos
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((row, rowIndex) => {
                                const isSelected = selectedIds.includes(row.id);
                                return (
                                    <tr 
                                        key={row.id || rowIndex}
                                        onClick={(e) => handleRowInteraction(e, row)}
                                        onContextMenu={(e) => onRowContextMenu && onRowContextMenu(e, row)}
                                        className={`transition-colors cursor-pointer group hover:bg-white/5 ${isSelected ? 'bg-white/10' : ''}`}
                                    >
                                        {enableSelection && (
                                            <td className="pl-4 py-3 w-[40px]">
                                                <div 
                                                    role="checkbox"
                                                    aria-checked={isSelected}
                                                    tabIndex={0}
                                                    onClick={(e) => handleCheckboxClick(e, row)}
                                                    onKeyDown={(e) => {
                                                        if(e.key === 'Enter' || e.key === ' ') handleCheckboxClick(e, row);
                                                    }}
                                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all outline-none focus:ring-2 focus:ring-[#E8A631] ${isSelected ? 'bg-[#E8A631] border-[#E8A631] text-black opacity-100' : 'border-white/20 bg-white/5 opacity-0 group-hover:opacity-100 hover:border-white/50'}`}
                                                >
                                                    {isSelected && <Check size={10} strokeWidth={4} />}
                                                </div>
                                            </td>
                                        )}
                                        {columns.map((col, colIndex) => (
                                            <td 
                                                key={colIndex}
                                                className={`px-4 py-3 text-sm ${theme.text} align-middle ${col.className || ''}`}
                                            >
                                                {col.render ? col.render(row) : row[col.accessor]}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                 </table>
            </div>

            {/* Mobile Card List (Accessible) */}
            <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar p-4" role="list">
                {sortedData.length === 0 ? (
                     <div className="text-center text-white/40 text-sm py-8">No se encontraron datos</div>
                ) : (
                    sortedData.map((row, rowIndex) => {
                        const isSelected = selectedIds.includes(row.id);
                        return (
                            <div 
                                key={row.id || rowIndex}
                                role="listitem"
                                onClick={(e) => handleRowInteraction(e, row)}
                                onContextMenu={(e) => onRowContextMenu && onRowContextMenu(e, row)}
                                className={`${theme.cardBg} backdrop-blur-md rounded-2xl border ${isSelected ? 'border-[#E8A631] bg-white/10' : 'border-white/10'} p-4 mb-3 active:scale-[0.98] transition-all`}
                            >
                                <div className="flex items-start gap-4">
                                    {enableSelection && (
                                            <div className="pt-1">
                                                <div 
                                                role="checkbox"
                                                aria-checked={isSelected}
                                                onClick={(e) => handleCheckboxClick(e, row)}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-[#E8A631] border-[#E8A631] text-black' : 'border-white/20 bg-white/5'}`}
                                            >
                                                {isSelected && <Check size={12} strokeWidth={4} />}
                                            </div>
                                            </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="mb-4">
                                            {columns[0]?.accessor !== 'id' ? (
                                                columns[0]?.render ? columns[0].render(row) : <p className="font-bold text-lg text-white">{row[columns[0]?.accessor]}</p>
                                            ) : (
                                                columns[1]?.render ? columns[1].render(row) : <p className="font-bold text-lg text-white">{row[columns[1]?.accessor]}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2 border-t border-white/5 pt-2">
                                            {columns.filter(c => c.accessor !== 'id').slice(1, columns.length - 1).map((col, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm">
                                                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">
                                                        {typeof col.header === 'string' ? col.header : ''}
                                                    </span>
                                                    <div className="text-right text-white/80 max-w-[60%] truncate">
                                                        {col.render ? col.render(row) : row[col.accessor]}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default GlassTable;
