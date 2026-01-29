import React, { useState, useMemo } from 'react';

import { useRateCard } from '../../hooks/useRateCard';
import { Search, Plus, Trash2, Box, Info } from 'lucide-react';
import { formatCurrency, generateUniqueId } from '../../utils/dataUtils';

const ResourceSelector = ({ selectedResources = [], onChange, label = "Recursos & Costos" }) => {

    const { data: rateCardItems = [] } = useRateCard();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!search) return [];
        return rateCardItems.filter(item => 
            item.item.toLowerCase().includes(search.toLowerCase()) || 
            item.category.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 10); // Limit results
    }, [search, rateCardItems]);

    const handleAddItem = (item) => {
        const newItem = {
            id: generateUniqueId('res'), // unique id for the line item
            itemId: item.id, // reference to rate card
            name: item.item,
            category: item.category,
            price: Number(item.price),
            quantity: 1
        };
        onChange([...selectedResources, newItem]);
        setIsMenuOpen(false);
        setSearch('');
    };

    const handleRemoveItem = (id) => {
        onChange(selectedResources.filter(r => r.id !== id));
    };

    const handleUpdateQuantity = (id, newQty) => {
        if (newQty < 1) return;
        onChange(selectedResources.map(r => r.id === id ? { ...r, quantity: newQty } : r));
    };

    const totalEstimated = selectedResources.reduce((acc, r) => acc + (r.price * r.quantity), 0);

    return (
        <div className="space-y-3">
             <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-white/50 tracking-wider flex items-center gap-2">
                    <Box size={14}/> {label}
                </label>
                {selectedResources.length > 0 && (
                     <span className="text-xs font-bold text-[#E8A631]">
                        Est: ${formatCurrency(totalEstimated)}
                     </span>
                )}
             </div>

             <div className="relative">
                 {/* Search Input */}
                 <div className="relative z-20">
                    <Search size={14} className="absolute left-3 top-3 text-white/30" />
                    <input 
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setIsMenuOpen(true); }}
                        onFocus={() => setIsMenuOpen(true)}
                        placeholder="Buscar en Tarifario (ej. Promotora, Pantalla)..."
                        className={`w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-[#E8A631] outline-none transition-colors`}
                    />
                 </div>

                 {/* Results Dropdown */}
                 {isMenuOpen && search && (
                     <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                         {filteredItems.length > 0 ? (
                             filteredItems.map(item => (
                                 <button
                                    key={item.id}
                                    onClick={() => handleAddItem(item)}
                                    className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 last:border-0 flex justify-between items-center group"
                                 >
                                     <div>
                                         <div className="font-bold text-sm text-white">{item.item}</div>
                                         <div className="text-[10px] text-white/40 uppercase">{item.category}</div>
                                     </div>
                                     <div className="text-right">
                                         <div className="text-[#E8A631] text-xs font-mono font-bold">${formatCurrency(item.price)}</div>
                                         <div className="text-[10px] text-white/30">{item.unit}</div>
                                     </div>
                                 </button>
                             ))
                         ) : (
                             <div className="p-4 text-center text-xs text-white/40 italic">
                                 No se encontraron items.
                             </div>
                         )}
                         {/* Close overlay */}
                         <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)}></div>
                     </div>
                 )}
             </div>

             {/* Selected Resources List */}
             {selectedResources.length > 0 ? (
                 <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                     {selectedResources.map((resource) => (
                         <div key={resource.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 group hover:bg-white/5 transition-colors">
                             <div className="flex-1 min-w-0 mr-4">
                                 <div className="text-sm font-bold text-white truncate">{resource.name}</div>
                                 <div className="text-[10px] text-white/40 flex items-center gap-2">
                                     <span>${formatCurrency(resource.price)} unit.</span>
                                     <span>•</span>
                                     <span className="text-[#E8A631] font-mono">Total: ${formatCurrency(resource.price * resource.quantity)}</span>
                                 </div>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                 <div className="flex items-center bg-black/30 rounded-lg border border-white/10">
                                     <button 
                                        onClick={() => handleUpdateQuantity(resource.id, resource.quantity - 1)}
                                        className="px-2 py-1 text-white/50 hover:text-white hover:bg-white/10 rounded-l-lg transition-colors"
                                        disabled={resource.quantity <= 1}
                                     >
                                         -
                                     </button>
                                     <input 
                                        type="text" 
                                        value={resource.quantity} 
                                        readOnly 
                                        className="w-8 text-center bg-transparent text-xs font-mono text-white focus:outline-none"
                                     />
                                      <button 
                                        onClick={() => handleUpdateQuantity(resource.id, resource.quantity + 1)}
                                        className="px-2 py-1 text-white/50 hover:text-white hover:bg-white/10 rounded-r-lg transition-colors"
                                     >
                                         +
                                     </button>
                                 </div>
                                 <button 
                                    onClick={() => handleRemoveItem(resource.id)}
                                    className="p-1.5 text-white/20 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                                 >
                                     <Trash2 size={14}/>
                                 </button>
                             </div>
                         </div>
                     ))}
                     
                     <div className="p-3 bg-black/20 flex justify-between items-center text-xs">
                         <span className="text-white/40">Items seleccionados: {selectedResources.length}</span>
                         {/* Optional Total Row here too */}
                     </div>
                 </div>
             ) : (
                 <div className="p-6 border-2 border-dashed border-white/5 rounded-xl text-center">
                     <p className="text-xs text-white/30">
                         No hay recursos asignados. <br/> Busca en el tarifario para estimar costos.
                     </p>
                 </div>
             )}
        </div>
    );
};

export default ResourceSelector;
