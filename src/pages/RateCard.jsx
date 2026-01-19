
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Search, Plus, Trash2, Edit, Copy, MoreVertical, Layout, Mic, MapPin, ShoppingBag, Smartphone, ArrowRight, X } from 'lucide-react';
import Modal from '../components/common/Modal';

import GlassTable from '../components/common/GlassTable';
import ContextMenu from '../components/common/ContextMenu';
import QuoteWizard from '../components/rate-card/QuoteWizard'; // New Import

const RateCard = () => {
    const { theme } = useTheme();
    const { rateCardItems, actions } = useData();
    const [rateCardCategory, setRateCardCategory] = useState('Todos');
    const [rateCardSearch, setRateCardSearch] = useState('');
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [isQuoteWizardOpen, setIsQuoteWizardOpen] = useState(false); // New State
    const [rateForm, setRateForm] = useState({ 
        id: null, 
        category: 'Espacios Preferenciales', 
        subcategory: '', // New
        item: '', 
        specs: '', 
        price: '', 
        unit: '', 
        notes: '',
        format_size: '' // New (medida_formato)
    });
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });

    const categories = ['Todos', ...new Set((rateCardItems || []).map(i => i.category))];
    
    // Filter Items
    const filteredItems = (rateCardItems || []).filter(item => {
      const matchesCategory = rateCardCategory === 'Todos' || item.category === rateCardCategory;
      const matchesSearch = item.item.toLowerCase().includes(rateCardSearch.toLowerCase()) || 
                            item.specs.toLowerCase().includes(rateCardSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    const [initialWizardConfig, setInitialWizardConfig] = useState(null);

    // Handle URL Params for connectivity (Directory -> Rate Card)
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('openWizard') === 'true') {
            const clientName = params.get('clientName');
            const clientId = params.get('clientId');
            
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            
            setIsQuoteWizardOpen(true);
            setInitialWizardConfig({
                clientName: clientName || '',
                clientId: clientId || null
            });
        }
    }, [setIsQuoteWizardOpen]);

    const getIconForCategory = (cat) => {
      if (cat.includes('Digital')) return <Smartphone size={16} />;
      if (cat.includes('Activaciones')) return <Mic size={16} />;
      if (cat.includes('Espacios')) return <Layout size={16} />;
      if (cat.includes('Señalética')) return <MapPin size={16} />;
      return <ShoppingBag size={16} />;
    };

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            item: item
        });
    };

    const handleEdit = (item) => {
        // Format price for display in input
        const formattedPrice = item.price ? new Intl.NumberFormat('es-AR').format(item.price) : '';
        setRateForm({ 
            ...item, 
            price: formattedPrice,
            // Ensure new fields exist if editing old items
            subcategory: item.subcategory || '',
            format_size: item.format_size || '' // Map legacy if needed, or default empty
        });
        setIsRateModalOpen(true);
    };

    const handleDelete = (id) => {
        if(window.confirm('¿Eliminar este item del tarifario?')) {
            actions.deleteRateItem(id);
        }
    };

    const handleDuplicate = (item) => {
         const newItem = { ...item, id: null, item: `${item.item} (Copia)` };
         actions.saveRateItem(newItem);
    };

    const handleSave = () => {
        if (!rateForm.item || !rateForm.price) return;
        // Clean price for storage (remove dots to save as raw number/string)
        const cleanPrice = rateForm.price.replace(/\./g, ''); 
        actions.saveRateItem({ ...rateForm, price: cleanPrice });
        setIsRateModalOpen(false);
    };
    
    const openCreateModal = () => {
        setRateForm({ 
            id: null, 
            category: 'Punto de Venta/Off Line', // Default first option
            subcategory: '',
            item: '', 
            specs: '', 
            price: '', 
            unit: '', 
            notes: '',
            format_size: ''
        });
        setIsRateModalOpen(true);
    };

    // Table Columns Config
    const columns = [
        { 
            header: 'Item / Activo', 
            accessor: 'item', 
            width: '30%',
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${theme.accentSecondary}`}>
                        {getIconForCategory(row.category)}
                    </div>
                    <div>
                        <div className="font-bold">{row.item}</div>
                        <div className="text-xs text-white/40 md:hidden">{row.category}</div>
                    </div>
                </div>
            )
        },
        { header: 'Categoría', accessor: 'category', width: '20%', className: 'hidden md:block text-white/60', sortable: true },
        { header: 'Categoría', accessor: 'category', width: '20%', className: 'hidden md:block text-white/60', sortable: true },
        { 
            header: 'Inversión', 
            accessor: 'price', 
            width: '15%', 
            sortable: true,
            render: (row) => <span className={`font-bold ${theme.accent}`}>$ {Number(row.price).toLocaleString()}</span> 
        },
        { header: 'Unidad', accessor: 'unit', width: '10%', className: 'text-white/40 text-xs', sortable: true },
    ];

    return (
      <div className="h-full flex flex-col relative" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${theme.text}`}>Tarifario 2026</h1>
            <p className={`${theme.textSecondary} text-sm mt-1`}>Gestión de activos comerciales</p>
          </div>
          
          <div className="flex gap-3 items-center w-full md:w-auto">
             <div className="relative flex-1 md:flex-none">
                <input 
                    type="text" 
                    placeholder="Buscar activo..." 
                    value={rateCardSearch}
                    onChange={(e) => setRateCardSearch(e.target.value)}
                    className={`${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm ${theme.text} focus:outline-none focus:border-[#E8A631] w-full md:w-64 pl-10 transition-colors`} 
                />
                <Search className={`absolute left-3 top-2.5 ${theme.textSecondary}`} size={16} />
             </div>
             <button onClick={openCreateModal} className={`${theme.accentBg} text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-orange-900/10`}>
                <Plus size={18} /> <span className="hidden md:inline">Nuevo Item</span>
             </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setRateCardCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all border ${rateCardCategory === cat ? `${theme.accentBg} text-black border-transparent shadow-lg` : `bg-white/5 border-white/5 ${theme.textSecondary} hover:bg-white/10`}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Table View */}
        <div className="flex-1 overflow-hidden pb-6">
            <GlassTable 
                tableName="ratecard-table"
                enableSelection={true}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                columns={columns} 
                data={filteredItems} 
                onRowClick={(item) => handleEdit(item)} 
                onRowContextMenu={handleContextMenu}
            />
        </div>

        {/* Create/Edit Modal */}
        <Modal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} title={rateForm.id ? "Editar Formato" : "Nuevo Formato"}>
             <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                     <div className="col-span-2">
                        <label className={`text-xs ${theme.textSecondary} ml-1`}>Nombre del Activo</label>
                        <input type="text" value={rateForm.item} onChange={e => setRateForm({...rateForm, item: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text}`} autoFocus placeholder="Ej. Cabecera de Góndola"/>
                     </div>
                     
                     {/* Category & Dependent Subcategory */}
                     <div className={rateForm.category === 'Digital' ? '' : 'col-span-2'}>
                        <label className={`text-xs ${theme.textSecondary} ml-1`}>Categoría</label>
                        <select 
                            value={rateForm.category} 
                            onChange={e => setRateForm({...rateForm, category: e.target.value, subcategory: ''})} // Reset sub on change
                            className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text} [&>option]:text-black`}
                        >
                            {['Punto de Venta/Off Line', 'Digital', 'Medios', 'Producción', 'Activaciones'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>

                     {rateForm.category === 'Digital' && (
                         <div>
                            <label className={`text-xs ${theme.textSecondary} ml-1`}>Subcategoría</label>
                            <select 
                                value={rateForm.subcategory} 
                                onChange={e => setRateForm({...rateForm, subcategory: e.target.value})} 
                                className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text} [&>option]:text-black`}
                            >
                                <option value="" disabled>Seleccionar</option>
                                {['Web site', 'Social media', 'Email', 'E-commerce', 'Reporting'].map(sc => <option key={sc} value={sc}>{sc}</option>)}
                            </select>
                         </div>
                     )}

                     <div className="col-span-2 grid grid-cols-2 gap-3">
                        <div>
                            <label className={`text-xs ${theme.textSecondary} ml-1`}>Medida / Formato</label>
                            <input type="text" value={rateForm.format_size} onChange={e => setRateForm({...rateForm, format_size: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text}`} placeholder="Ej. 1080x1080px" />
                        </div>
                        <div>
                            <label className={`text-xs ${theme.textSecondary} ml-1`}>Unidad</label>
                            <input type="text" value={rateForm.unit} onChange={e => setRateForm({...rateForm, unit: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text}`} placeholder="Ej. Por día / Por post" />
                        </div>
                     </div>
                 </div>
                 
                  <div>
                    <label className={`text-xs ${theme.textSecondary} ml-1`}>Especificaciones Técnicas</label>
                    <textarea 
                        rows={3}
                        value={rateForm.specs} 
                        onChange={e => setRateForm({...rateForm, specs: e.target.value})} 
                        className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text} resize-none`} 
                        placeholder="Materialidad, medidas, terminación..." 
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className={`text-xs ${theme.textSecondary} ml-1`}>Inversión ($)</label>
                        <input 
                            type="text" 
                            name="price"
                            value={rateForm.price} 
                            placeholder="0"
                            onChange={e => {
                                // Live Formatting: "1.000.000" as you type
                                // Fix: Handle "05" -> "5" and allow empty
                                const rawValue = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                if (!rawValue) {
                                    setRateForm({...rateForm, price: ''});
                                    return;
                                }
                                const numberValue = parseInt(rawValue, 10);
                                const formatted = new Intl.NumberFormat('es-AR').format(numberValue);
                                setRateForm({...rateForm, price: formatted});
                            }} 
                            className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text}`} 
                        />
                     </div>
                     <div>
                         {/* Spacer or Total Calculation in future */}
                     </div>
                 </div>
                 
                 <div>
                    <label className={`text-xs ${theme.textSecondary} ml-1`}>Detalle / Notas Internas</label>
                    <textarea 
                        rows={3}
                        value={rateForm.notes} 
                        onChange={e => setRateForm({...rateForm, notes: e.target.value})} 
                        className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text} resize-none`}
                        placeholder="Información adicional para el equipo..."
                    />
                 </div>

                 <button onClick={handleSave} className={`w-full ${theme.accentBg} text-black font-bold py-3 h-12 rounded-xl hover:opacity-90 mt-2 shadow-lg shadow-orange-900/10`}>
                    {rateForm.id ? "Guardar Cambios" : "Crear Activo"}
                 </button>
             </div>
        </Modal>

        {/* Context Menu */}
        {contextMenu.visible && (
            <ContextMenu 
                position={{ x: contextMenu.x, y: contextMenu.y }} 
                onClose={() => setContextMenu({ ...contextMenu, visible: false })}
                options={[
                    { label: 'Editar', icon: <Edit size={14} />, action: () => handleEdit(contextMenu.item) },
                    { label: 'Duplicar', icon: <Copy size={14} />, action: () => handleDuplicate(contextMenu.item) },
                    { label: 'Eliminar', icon: <Trash2 size={14} />, action: () => handleDelete(contextMenu.item.id), danger: true }
                ]}
            />
        )}

        {/* Floating Footer for Selection */}
        {selectedIds.length > 0 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0a1f16] border border-[#4ade80]/30 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 z-40 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2">
                    <div className="bg-[#4ade80] text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                        {selectedIds.length}
                    </div>
                    <span className="text-white text-sm font-medium">Items seleccionados</span>
                </div>
                
                <div className="h-4 w-[1px] bg-white/20"></div>

                <div className="text-white text-sm">
                    <span className="text-white/50 mr-2">Est. Total:</span>
                    <span className="font-bold text-[#4ade80]">
                         $ {Number(selectedIds.reduce((acc, id) => {
                             const item = rateCardItems.find(i => i.id === id);
                             // Clean price just in case
                             const price = item ? (typeof item.price === 'string' ? parseFloat(item.price.replace(/\./g, '')) : item.price) : 0;
                             return acc + (price || 0);
                         }, 0)).toLocaleString('es-AR')}
                    </span>
                </div>

                <button 
                    onClick={() => setIsQuoteWizardOpen(true)}
                    className="bg-[#4ade80] hover:bg-[#4ade80]/90 text-black px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2"
                >
                    Crear Cotización <ArrowRight size={14} />
                </button>

                <button onClick={() => setSelectedIds([])} className="text-white/40 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>
        )}

        {/* Quote Wizard Modal */}
        <QuoteWizard
            isOpen={isQuoteWizardOpen}
            onClose={() => { setIsQuoteWizardOpen(false); setInitialWizardConfig(null); }}
            selectedItems={rateCardItems.filter(i => selectedIds.includes(i.id))}
            initialConfig={initialWizardConfig}
        />

      </div>
    );
};

export default RateCard;
