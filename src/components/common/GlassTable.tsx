
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
// @ts-ignore - Hook not yet migrated
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Check } from 'lucide-react';


interface Column<T = any> {
  accessor: string;
  header: string | React.ReactNode;
  width?: string;
  className?: string;
  sortable?: boolean;
  render?: (row: T, extraData?: any) => React.ReactNode;
}

interface GlassTableProps<T = any> {
  tableName?: string;
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  onRowContextMenu?: (e: React.MouseEvent, row: T) => void;
  enableSelection?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  highlightedId?: string | number | null;
}

// Custom AutoSizer to avoid CJS/ESM issues with the library
const AutoSizer = ({ children }: { children: (dims: { width: number; height: number }) => React.ReactNode }) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                 // Use contentRect for precise fractional dimensions
                 const { width, height } = entry.contentRect;
                 setDimensions({ width, height });
            }
        });
        
        resizeObserver.observe(ref.current);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div ref={ref} style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Only render children when we have dimensions to prevent 0-height glitches */}
            {dimensions.width > 0 && dimensions.height > 0 && children(dimensions)}
        </div>
    );
};

interface VirtualRowProps {
    index: number;
    style: React.CSSProperties;
    data: {
        items: any[];
        columns: Column[];
        colWidths: Record<string, string>;
        enableSelection: boolean;
        selectedIds: (string | number)[];
        onRowInteraction: (e: React.MouseEvent, row: any) => void;
        onRowContextMenu?: (e: React.MouseEvent, row: any) => void;
        handleCheckboxClick: (e: React.MouseEvent | React.KeyboardEvent, row: any) => void;
        theme: any;
        highlightedId?: string | number | null;
    };
}

// Row Component for Virtualization
const VirtualRow: React.FC<VirtualRowProps> = ({ index, style, data }) => {
    const { 
        items, 
        columns, 
        colWidths, 
        enableSelection, 
        selectedIds, 
        onRowInteraction, 
        onRowContextMenu, 
        handleCheckboxClick,
        theme,
        highlightedId
    } = data;
    
    const row = items[index];
    const isSelected = selectedIds.includes(row.id);

    return (
        <div 
            style={style} 
            className={`flex items-center border-b border-white/5 transition-colors cursor-pointer group hover:bg-white/5 ${isSelected ? 'bg-white/10' : ''}`}
            onClick={(e) => onRowInteraction(e, row)}
            onContextMenu={(e) => onRowContextMenu && onRowContextMenu(e, row)}
            role="row"
        >
            {enableSelection && (
                <div className="pl-4 py-3 w-[40px] flex-shrink-0 flex items-center" role="cell">
                    <div 
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={(e) => handleCheckboxClick(e, row)}
                        onKeyDown={(e) => {
                             if(e.key === 'Enter' || e.key === ' ') handleCheckboxClick(e, row);
                        }}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all outline-none focus:ring-2 ${theme.accentRing} ${isSelected ? `${theme.accentBg} ${theme.accentBorder} text-black opacity-100` : 'border-white/20 bg-white/5 opacity-0 group-hover:opacity-100 hover:border-white/50'}`}
                    >
                        {isSelected && <Check size={10} strokeWidth={4} />}
                    </div>
                </div>
            )}
            {columns.map((col, colIndex) => (
                <div 
                    key={colIndex}
                    style={{ width: colWidths[col.accessor] || col.width || '150px', flex: col.width ? 'none' : 1 }}
                    className={`px-4 py-3 text-sm ${theme.text} flex items-center ${col.className || ''}`}
                    role="cell"
                >
                    <div className="truncate w-full">
                        {col.render ? col.render(row, { highlightedId }) : row[col.accessor]}
                    </div>
                </div>
            ))}
        </div>
    );
};

const GlassTable = <T extends { id?: string | number } & Record<string, any>>({ 
    tableName = 'default-table', 
    columns, 
    data, 
    onRowClick, 
    onRowContextMenu,
    enableSelection = false,
    selectedIds = [],
    onSelectionChange,
    highlightedId
}: GlassTableProps<T>) => {
    const { theme } = useTheme();
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    
    // Persist Column Widths
    const [colWidths, setColWidths] = useLocalStorage(`col-widths-${tableName}`, {});

    // Selection Internal Logic
    const [lastSelectedId, setLastSelectedId] = useState<string | number | null>(null);

    // Initialize widths intelligently
    const columnsKey = JSON.stringify(columns.map(c => c.accessor));
    
    useEffect(() => {
        setColWidths((prev: Record<string, string>) => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columnsKey, setColWidths]);

    // Resize Logic
    const handleResizeMouseDown = (e: React.MouseEvent, accessor: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const headerCell = (e.target as HTMLElement).parentElement;
        if (!headerCell) return;

        const startX = e.pageX;
        const startWidth = headerCell.offsetWidth; 
        
        const textContent = headerCell.textContent || '';
        const minWidth = Math.max(80, (textContent.length * 10) + 48);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentWidth = startWidth + (moveEvent.pageX - startX);
            const newWidth = Math.max(minWidth, currentWidth);
            
            setColWidths((prev: Record<string, string>) => ({
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

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return data;
        
        return [...data].sort((a, b) => {
             // @ts-ignore
            const aValue = a[sortConfig.key];
             // @ts-ignore
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
    const handleRowInteraction = useCallback((e: React.MouseEvent, row: T) => {
        // If selection is disabled, just propagate click
        if (!enableSelection) {
            if (onRowClick) onRowClick(row);
            return;
        }

        const id = row.id;
        if (!id) {
             if (onRowClick) onRowClick(row);
             return; // Cannot select without ID
        }

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
            const rangeIds = sortedData.slice(start, end + 1).map(r => r.id!).filter(Boolean);
            
            // Add unique IDs from range to selection
            const unique = new Set([...newSelected, ...rangeIds]);
            newSelected = Array.from(unique);
        } else {
            // Normal Click
            if (onRowClick) {
                onRowClick(row);
            } else {
                 if (newSelected.includes(id)) {
                    newSelected = newSelected.filter(sid => sid !== id);
                } else {
                    newSelected.push(id);
                    setLastSelectedId(id);
                }
            }
        }
        
        if (onSelectionChange) onSelectionChange(newSelected);
    }, [enableSelection, onRowClick, selectedIds, sortedData, lastSelectedId, onSelectionChange]);

    const handleCheckboxClick = useCallback((e: React.MouseEvent | React.KeyboardEvent, row: T) => {
        e.stopPropagation(); // Standard checkbox toggle
        const id = row.id;
        if (!id) return;

        let newSelected = [...selectedIds];
        
        if (newSelected.includes(id)) {
            newSelected = newSelected.filter(sid => sid !== id);
        } else {
            newSelected.push(id);
            setLastSelectedId(id);
        }
        if (onSelectionChange) onSelectionChange(newSelected);
    }, [selectedIds, onSelectionChange]);

    const itemData = useMemo(() => ({
        items: sortedData,
        columns,
        colWidths,
        enableSelection,
        selectedIds,
        onRowInteraction: handleRowInteraction,
        onRowContextMenu,
        handleCheckboxClick,
        theme,
        highlightedId
    }), [sortedData, columns, colWidths, enableSelection, selectedIds, handleRowInteraction, onRowContextMenu, handleCheckboxClick, theme, highlightedId]);

    return (
        <div className={`w-full overflow-hidden rounded-xl border border-white/10 ${theme.cardBg} backdrop-blur-md shadow-xl flex flex-col h-full`}>
            
            {/* Desktop Table */}
            <div className="hidden md:flex flex-1 flex-col overflow-hidden relative">
                {/* Header */}
                 <div className={`flex items-center border-b border-white/10 bg-black/90 backdrop-blur-xl ${theme.textSecondary} text-xs font-bold uppercase tracking-wider sticky top-0 z-10`} role="row">
                        {enableSelection && (
                            <div className="pl-4 py-3 w-[40px] flex-shrink-0">
                                <div 
                                    role="checkbox"
                                    aria-checked={selectedIds.length === data.length && data.length > 0}
                                    tabIndex={0}
                                    className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors outline-none focus:ring-2 ${theme.accentRing} ${selectedIds.length === data.length && data.length > 0 ? `${theme.accentBg} ${theme.accentBorder} text-black` : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
                                    onClick={() => {
                                        if (selectedIds.length === data.length) onSelectionChange?.([]); 
                                        else onSelectionChange?.(data.map(d => d.id!).filter(Boolean));
                                    }}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter' || e.key === ' ') {
                                            if (selectedIds.length === data.length) onSelectionChange?.([]);
                                            else onSelectionChange?.(data.map(d => d.id!).filter(Boolean));
                                        }
                                    }}
                                >
                                    {selectedIds.length === data.length && selectedIds.length > 0 && <Check size={10} strokeWidth={4} />}
                                </div>
                            </div>
                        )}
                        {columns.map((col, index) => (
                            <div 
                                key={index}
                                style={{ width: colWidths[col.accessor] || col.width || '150px', flex: col.width ? 'none' : 1 }}
                                className={`px-4 py-3 font-bold select-none relative group hover:text-white transition-colors cursor-pointer flex items-center gap-2 ${col.className || ''}`}
                                onClick={() => col.sortable && handleSort(col.accessor)}
                                role="columnheader"
                            >
                                {col.header}
                                <div 
                                    className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:${theme.accentBg} z-20`}
                                    onMouseDown={(e) => handleResizeMouseDown(e, col.accessor)}
                                    onClick={(e) => e.stopPropagation()} 
                                ></div>
                            </div>
                        ))}
                    </div>

                    {/* Body: Standard Fallback */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                         <div className="w-full">
                            {sortedData.map((row, index) => (
                                <VirtualRow 
                                    key={row.id || index}
                                    index={index}
                                    // @ts-ignore
                                    style={{}}
                                    data={{...itemData, highlightedId}} 
                                />
                            ))}
                        </div>
                        
                        {sortedData.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm pointer-events-none">
                                No se encontraron datos
                            </div>
                        )}
                    </div>
            </div>

            {/* Mobile Card List (Accessible) */}
            <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar p-4" role="list">
                {sortedData.length === 0 ? (
                     <div className="text-center text-white/40 text-sm py-8">No se encontraron datos</div>
                ) : (
                    sortedData.map((row, rowIndex) => {
                        const isSelected = row.id ? selectedIds.includes(row.id) : false;
                        return (
                            <div 
                                key={row.id || rowIndex}
                                role="listitem"
                                onClick={(e) => handleRowInteraction(e, row)}
                                // @ts-ignore
                                onContextMenu={(e) => onRowContextMenu && onRowContextMenu(e, row)}
                                className={`${theme.cardBg} backdrop-blur-md rounded-2xl border ${isSelected ? `${theme.accentBorder} bg-white/10` : 'border-white/10'} p-4 mb-3 active:scale-[0.98] transition-all`}
                            >
                                <div className="flex items-start gap-4">
                                    {enableSelection && row.id && (
                                            <div className="pt-1">
                                                <div 
                                                role="checkbox"
                                                aria-checked={isSelected}
                                                // @ts-ignore
                                                onClick={(e) => handleCheckboxClick(e, row)}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? `${theme.accentBg} ${theme.accentBorder} text-black` : 'border-white/20 bg-white/5'}`}
                                            >
                                                {isSelected && <Check size={12} strokeWidth={4} />}
                                            </div>
                                            </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="mb-4">
                                            {/* Logic for mobile card title: prefer col 0 or 1 */}
                                            {columns[0]?.accessor !== 'id' ? (
                                                columns[0]?.render ? columns[0].render(row, { highlightedId }) : <p className="font-bold text-lg text-white">{row[columns[0]?.accessor]}</p>
                                            ) : (
                                                columns[1]?.render ? columns[1].render(row, { highlightedId }) : <p className="font-bold text-lg text-white">{row[columns[1]?.accessor]}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2 border-t border-white/5 pt-2">
                                            {columns.filter(c => c.accessor !== 'id').slice(1, columns.length - 1).map((col, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm">
                                                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">
                                                        {typeof col.header === 'string' ? col.header : ''}
                                                    </span>
                                                    <div className="text-right text-white/80 max-w-[60%] truncate">
                                                        {col.render ? col.render(row, { highlightedId }) : row[col.accessor]}
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
