
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Search, Plus, Trash2, Edit, Copy, MoreVertical, Layout, Mic, MapPin, ShoppingBag, Smartphone } from 'lucide-react';
import Modal from '../components/common/Modal';
import GlassTable from '../components/common/GlassTable';
import ContextMenu from '../components/common/ContextMenu';

const RateCard = () => {
    const { theme } = useTheme();
    const { rateCardItems, actions } = useData();
    const [rateCardCategory, setRateCardCategory] = useState('Todos');
    const [rateCardSearch, setRateCardSearch] = useState('');
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [rateForm, setRateForm] = useState({ id: null, category: 'Espacios Preferenciales', item: '', specs: '', price: '', unit: '', notes: '' });
    
    // Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });

    const categories = ['Todos', ...new Set(rateCardItems.map(i => i.category))];
    
    // Filter Items
    const filteredItems = rateCardItems.filter(item => {
      const matchesCategory = rateCardCategory === 'Todos' || item.category === rateCardCategory;
      const matchesSearch = item.item.toLowerCase().includes(rateCardSearch.toLowerCase()) || 
                            item.specs.toLowerCase().includes(rateCardSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });

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
        // Format price for display in input (from raw number to "1.000")
        const formattedPrice = item.price ? new Intl.NumberFormat('es-AR').format(item.price) : '';
        setRateForm({ ...item, price: formattedPrice });
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
        setRateForm({ id: null, category: 'Espacios Preferenciales', item: '', specs: '', price: '', unit: '', notes: '' });
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
        { header: 'Especificaciones', accessor: 'specs', width: '25%', className: 'text-white/60 text-xs', sortable: true },
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
                columns={columns} 
                data={filteredItems} 
                onRowClick={(item) => handleEdit(item)} 
                onRowContextMenu={handleContextMenu}
            />
        </div>

        {/* Create/Edit Modal */}
        <Modal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} title={rateForm.id ? "Editar Activación" : "Nueva Activación"}>
             <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                     <div className="col-span-2">
                        <label className={`text-xs ${theme.textSecondary} ml-1`}>Nombre del Activo</label>
                        <input type="text" value={rateForm.item} onChange={e => setRateForm({...rateForm, item: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text}`} autoFocus />
                     </div>
                     <div>
                        <label className={`text-xs ${theme.textSecondary} ml-1`}>Categoría</label>
                        <select value={rateForm.category} onChange={e => setRateForm({...rateForm, category: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text} [&>option]:text-black`}>
                            {['Espacios Preferenciales', 'Línea de Caja', 'Señalética', 'Digital', 'Activaciones'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className={`text-xs ${theme.textSecondary} ml-1`}>Unidad</label>
                        <input type="text" value={rateForm.unit} onChange={e => setRateForm({...rateForm, unit: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text}`} />
                     </div>
                 </div>
                 
                 <div>
                    <label className={`text-xs ${theme.textSecondary} ml-1`}>Especificaciones</label>
                    <input type="text" value={rateForm.specs} onChange={e => setRateForm({...rateForm, specs: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text}`} />
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
                                const rawValue = e.target.value.replace(/\D/g, '');
                                if (!rawValue) {
                                    setRateForm({...rateForm, price: ''});
                                    return;
                                }
                                const formatted = new Intl.NumberFormat('es-AR').format(rawValue);
                                setRateForm({...rateForm, price: formatted});
                            }} 
                            className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text}`} 
                        />
                     </div>
                     <div>
                        <label className={`text-xs ${theme.textSecondary} ml-1`}>Notas</label>
                        <input type="text" value={rateForm.notes} onChange={e => setRateForm({...rateForm, notes: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 mt-1 text-sm ${theme.text}`} />
                     </div>
                 </div>

                 <button onClick={handleSave} className={`w-full ${theme.accentBg} text-black font-bold py-3 height-12 rounded-xl hover:opacity-90 mt-2 shadow-lg shadow-orange-900/10`}>
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

      </div>
    );
};

export default RateCard;
