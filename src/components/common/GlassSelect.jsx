import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const GlassSelect = ({ options, value, onChange, placeholder = "Seleccionar...", icon, searchPlaceholder = "Buscar...", className = "" }) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef(null);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    // Calculate position when opening (Synchronous update before paint)
    React.useLayoutEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 8, // 8px gap
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Handle Closing
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // Check if clicking inside the portal dropdown (which is outside this ref)
                // We'll trust the backdrop or specific dropdown ref if we added one, 
                // but simpler: check if target is inside a specific class we add to portal
                if (!event.target.closest('.glass-select-dropdown')) {
                    setIsOpen(false);
                }
            }
        };

        const handleScroll = (e) => {
            // Close on scroll to prevent detached UI, BUT ignore scrolls inside the dropdown itself
            if (isOpen && !e.target.closest('.glass-select-dropdown')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // Capture phase for all scrollable parents
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${theme.inputBg} ${isOpen ? `border-[#E8A631] shadow-lg shadow-orange-900/10` : 'border-white/10 hover:border-white/30'} text-left group`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {icon && <span className="opacity-50">{icon}</span>}
                    <span className={`truncate text-sm ${selectedOption ? 'text-white' : 'text-white/40'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Portal Dropdown */}
            {isOpen && createPortal(
                <div 
                    className={`glass-select-dropdown fixed flex flex-col ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
                    style={{ 
                        top: position.top, 
                        left: position.left, 
                        width: position.width,
                        maxHeight: '300px'
                    }}
                >
                    {/* Search Bar */}
                    <div className="p-2 border-b border-white/5 bg-black/10">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-2.5 text-white/30" />
                            <input 
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full bg-black/20 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:bg-black/30 placeholder:text-white/20"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${value === opt.value ? 'bg-[#E8A631] text-black font-bold' : 'text-white/80 hover:bg-white/10'}`}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {value === opt.value && <Check size={14} />}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-white/30 italic">No se encontraron resultados</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default GlassSelect;
