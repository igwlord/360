
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Plus, Calendar, DollarSign, Clock, MoreHorizontal, Edit, Trash2, Link, CheckCircle, Circle, AlertCircle, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Modal from '../components/common/Modal';
import ContextMenu from '../components/common/ContextMenu';
import GlassSelect from '../components/common/GlassSelect';

import { useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Campaigns = () => {
    const { theme } = useTheme();
    const { campaigns, providerGroups, setCampaigns, formatCurrency } = useData(); 
    const { addToast } = useToast();
    const location = useLocation();
    
    // Local State for Kanban
    const [draggedItem, setDraggedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ id: null, name: '', brand: '', status: 'Planificación', dept: '', cost: '', date: '', notes: '' });
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
    const [transType, setTransType] = useState('expense'); // 'expense' | 'income'

    // Auto-open modal if navigated from Dashboard
    React.useEffect(() => {
        if (location.state?.openModal) {
            setForm({ id: null, name: '', brand: '', status: 'Planificación' });
            setIsModalOpen(true);
            // Clear state to prevent reopening on refresh (optional, but good practice)
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const statuses = ['Planificación', 'En Curso', 'Pendiente', 'Finalizado'];

    // Group Campaigns by Status
    const campaignsByStatus = statuses.reduce((acc, status) => {
        acc[status] = campaigns.filter(c => c.status === status) || [];
        return acc;
    }, {});

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        if (draggedItem && draggedItem.status !== newStatus) {
            const updated = campaigns.map(c => c.id === draggedItem.id ? { ...c, status: newStatus } : c);
            setCampaigns(updated);
        }
        setDraggedItem(null);
    };

    const handleSave = () => {
        if (form.id) {
            setCampaigns(prev => prev.map(c => c.id === form.id ? form : c));
            addToast('Campaña actualizada correctamente', 'success');
        } else {
            setCampaigns(prev => [...prev, { ...form, id: Date.now(), progress: 0, statusColor: 'bg-gray-400' }]);
            addToast('Campaña creada exitosamente', 'success');
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Borrar campaña?')) {
            setCampaigns(prev => prev.filter(c => c.id !== id));
            addToast('Campaña eliminada', 'error');
        }
    };

    const openEdit = (item, tab = 'details') => {
        setForm({ ...item, activeTab: tab });
        setIsModalOpen(true);
    };

    const handleAddTransaction = () => {
        const amountEl = document.getElementById('quickAmount');
        const conceptEl = document.getElementById('quickConcept');
        if (!amountEl || !conceptEl) return;
        
        const amount = parseFloat(amountEl.value);
        const note = conceptEl.value;
        
        if (!amount || isNaN(amount) || !note.trim()) {
            addToast('Completa los campos', 'error');
            return;
        }

        setForm(prev => ({
            ...prev,
            transactions: [
                ...(prev.transactions || []),
                { id: Date.now(), date: new Date().toISOString(), type: transType, amount, note }
            ]
        }));

        amountEl.value = '';
        conceptEl.value = '';
        conceptEl.focus();
        addToast('Movimiento Agregado', 'success');
    };

    return (
        <div className="h-full flex flex-col" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                     <h1 className={`text-3xl font-bold ${theme.text}`}>Campañas</h1>
                     <p className={`${theme.textSecondary} text-sm mt-1`}>Tablero de Gestión de Proyectos</p>
                </div>
                <button onClick={() => { setForm({ id: null, name: '', brand: '', status: 'Planificación' }); setIsModalOpen(true); }} className={`${theme.accentBg} text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-lg`}>
                    <Plus size={18} /> Nueva Campaña
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {statuses.map(status => (
                    <div 
                        key={status}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status)}
                        className={`flex-1 min-w-[300px] flex flex-col rounded-3xl border border-white/5 bg-black/10 backdrop-blur-sm transition-colors ${draggedItem && draggedItem.status !== status ? 'bg-white/5 border-white/10 border-dashed' : ''}`}
                    >
                        {/* Column Header */}
                        <div className={`p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-black/20 backdrop-blur-md rounded-t-3xl z-10`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                    status === 'En Curso' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 
                                    status === 'Planificación' ? 'bg-blue-500' : 
                                    status === 'Pendiente' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}></div>
                                <h3 className="font-bold text-white text-sm uppercase tracking-wide">{status}</h3>
                            </div>
                            <span className="text-xs font-bold text-white/30 bg-white/10 px-2 py-0.5 rounded-full">{campaignsByStatus[status].length}</span>
                        </div>

                        {/* Cards */}
                        <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                            {campaignsByStatus[status].map(campaign => {
                                // Calculate Financials on the fly for card view
                                const totalBudget = campaign.transactions?.reduce((acc, t) => t.type === 'initial' || t.type === 'adjustment' ? acc + t.amount : acc, 0) || 0;
                                const executed = campaign.transactions?.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0) || 0;
                                const available = totalBudget - executed;

                                return (
                                <div 
                                    key={campaign.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, campaign)}
                                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: campaign }); }}
                                    className={`p-4 rounded-2xl border border-white/5 ${theme.cardBg} hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing hover:translate-y-[-2px] hover:shadow-xl group relative overflow-hidden`}
                                >
                                    {/* Accent Bar */}
                                    <div className={`absolute top-0 left-0 w-1 h-full ${status === 'En Curso' ? 'bg-green-500' : 'bg-white/20'}`}></div>

                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 ${theme.textSecondary}`}>{campaign.brand}</span>
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(campaign); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-white/60 hover:text-white transition-opacity">
                                            <Edit size={12} />
                                        </button>
                                    </div>
                                    
                                    <h4 className="font-bold text-white text-lg pl-2 leading-tight mb-3">{campaign.name}</h4>
                                    
                                    <div className="pl-2 space-y-2">
                                        {campaign.date && (
                                            <div className="flex items-center gap-2 text-xs text-white/50">
                                                <Calendar size={12} /> <span>{campaign.date}</span>
                                            </div>
                                        )}
                                        
                                        {/* Financial Summary Pill */}
                                        <div onClick={(e) => { e.stopPropagation(); openEdit(campaign, 'financial'); }} className="flex items-center justify-between bg-black/20 rounded-lg p-2 text-xs cursor-pointer hover:bg-black/30 transition-colors border border-white/5 mt-2">
                                            <div className="flex items-center gap-2 text-white/70">
                                                <DollarSign size={12} className={theme.accent}/>
                                                <span>Disp: <span className="text-white font-bold">${formatCurrency(available)}</span></span>
                                            </div>
                                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div className={`h-full ${available < 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${totalBudget > 0 ? (executed / totalBudget) * 100 : 0}%` }}></div>
                                            </div>
                                        </div>

                                        {campaign.notes && (
                                            <div className="mt-2 text-xs text-white/40 italic line-clamp-2 border-t border-white/5 pt-2">
                                                "{campaign.notes}"
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Progress */}
                                    {campaign.progress !== undefined && (
                                        <div className="mt-4 pl-2">
                                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                                <span>Progreso</span>
                                                <span>{campaign.progress}%</span>
                                            </div>
                                            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${status === 'En Curso' ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-white/30'}`} 
                                                    style={{ width: `${campaign.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit / Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Gestión de Campaña" : "Nueva Campaña"} size="xl">
                <div className="flex border-b border-white/10 mb-4">
                    <button onClick={() => setForm({...form, activeTab: 'details'})} className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${!form.activeTab || form.activeTab === 'details' ? `border-[${theme.accent}] text-white` : 'border-transparent text-white/40'}`}>Detalles</button>
                    {form.id && <button onClick={() => setForm({...form, activeTab: 'financial'})} className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${form.activeTab === 'financial' ? `border-[${theme.accent}] text-white` : 'border-transparent text-white/40'}`}>Finanzas</button>}
                </div>

                {(!form.activeTab || form.activeTab === 'details') && (
                    <div className="space-y-4">
                        <input type="text" placeholder="Nombre de Campaña" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none`} />
                        <div className="grid grid-cols-2 gap-3">
                             <input type="text" placeholder="Marca (Brand)" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none`} />
                             <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none [&>option]:text-black`}>
                                 {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                             <input type="text" placeholder="Fechas (ej. 10 Ene - 15 Feb)" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none`} />
                        </div>
    
                        <textarea placeholder="Notas, objetivos, detalles..." value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none h-24 resize-none`} />
    
                        {/* Multi-Provider Selection */}
                        <div className="pt-2 border-t border-white/10">
                            <label className="text-xs text-white/50 mb-2 block">Vincular Proveedores</label>
                            
                            {/* Selected Providers Chips */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {form.providers && form.providers.map(pId => {
                                    const provider = providerGroups.flatMap(g => g.contacts).find(c => c.id === pId);
                                    return provider ? (
                                        <div key={pId} className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-xs text-white">
                                            <span>{provider.company}</span>
                                            <button onClick={() => setForm(prev => ({...prev, providers: prev.providers.filter(pid => pid !== pId)}))} className="hover:text-red-400"><Trash2 size={12}/></button>
                                        </div>
                                    ) : null;
                                })}
                            </div>

                            <GlassSelect 
                                options={providerGroups.flatMap(g => g.contacts).filter(c => !form.providers?.includes(c.id)).map(c => ({ value: c.id, label: `${c.company} (${c.brand})` }))}
                                value="" 
                                onChange={(val) => setForm(prev => ({...prev, providers: [...(prev.providers || []), val] }))}
                                placeholder="Buscar proveedor..."
                                icon={<Link size={14}/>}
                            />
                        </div>
    
                        <button onClick={handleSave} className={`w-full ${theme.accentBg} text-black font-bold py-3 rounded-xl hover:opacity-90 mt-2`}>
                            {form.id ? "Guardar Cambios" : "Crear Campaña"}
                        </button>
                    </div>
                )}

                {/* Ledger / Finance Tab - Simplified & Practical */}
                {form.activeTab === 'financial' && (
                    <div className="flex flex-col h-[500px] animate-in fade-in slide-in-from-right-4">
                         
                         {/* 1. Compact Summary Bar */}
                         {(() => {
                            const totalBudget = form.transactions?.reduce((acc, t) => t.type === 'initial' || t.type === 'income' ? acc + t.amount : acc, 0) || 0;
                            const executed = form.transactions?.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0) || 0;
                            const available = totalBudget - executed;
                            const percent = totalBudget > 0 ? (executed / totalBudget) * 100 : 0;

                            return (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300"><DollarSign size={20} /></div>
                                        <div>
                                            <p className="text-[10px] text-white/50 uppercase font-bold">Presupuesto</p>
                                            <p className="text-xl font-bold text-white tracking-tight">${formatCurrency(totalBudget)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="h-8 w-[1px] bg-white/10"></div>

                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-red-500/20 rounded-lg text-red-300"><TrendingDown size={20} /></div>
                                        <div>
                                            <p className="text-[10px] text-white/50 uppercase font-bold">Gastado</p>
                                            <p className="text-xl font-bold text-white tracking-tight">${formatCurrency(executed)}</p>
                                        </div>
                                    </div>

                                    <div className="h-8 w-[1px] bg-white/10"></div>

                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${available >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}><Wallet size={20} /></div>
                                        <div>
                                            <p className="text-[10px] text-white/50 uppercase font-bold">Disponible</p>
                                            <p className={`text-xl font-bold tracking-tight ${available >= 0 ? 'text-green-400' : 'text-red-400'}`}>${formatCurrency(available)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                         })()}

                         {/* 2. Unified Ledger Area */}
                         <div className="flex-1 bg-black/20 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                             
                             {/* Input Bar (Highlight) */}
                             <div className="p-3 bg-white/5 border-b border-white/10">
                                 <div className="flex gap-2 items-center">
                                      {/* Type Toggle */}
                                      <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 shrink-0">
                                         <button 
                                             onClick={() => setTransType('expense')}
                                             className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${transType === 'expense' ? 'bg-red-500 text-black shadow-lg shadow-red-500/20' : 'text-white/40 hover:text-white'}`}
                                             title="Registrar Gasto"
                                         ><ArrowDownRight size={12}/> Gasto</button>
                                         <button 
                                             onClick={() => setTransType('income')}
                                             className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${transType === 'income' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-white/40 hover:text-white'}`}
                                             title="Registrar Ingreso"
                                         ><ArrowUpRight size={12}/> Ingreso</button>
                                      </div>

                                      {/* Concept Input */}
                                      <input 
                                         id="quickConcept"
                                         placeholder="Concepto (ej. Producción)" 
                                         className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/20 transition-colors"
                                         autoComplete="off"
                                         onKeyDown={(e) => {
                                             if(e.key === 'Enter') document.getElementById('quickAmount').focus();
                                         }}
                                      />

                                      {/* Amount Input */}
                                      <div className="relative w-32 shrink-0">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">$</span>
                                          <input 
                                             id="quickAmount"
                                             type="number"
                                             placeholder="0.00" 
                                             className="w-full bg-black/20 border border-white/10 rounded-lg pl-6 pr-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/20 transition-colors text-right [&::-webkit-inner-spin-button]:appearance-none"
                                             onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddTransaction();
                                             }}
                                          />
                                      </div>
                                      
                                      {/* Add Button */}
                                      <button 
                                        onClick={handleAddTransaction}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                      >
                                         <Plus size={18} />
                                      </button>
                                 </div>
                             </div>

                             {/* Headers */}
                             <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] uppercase font-bold text-white/40 tracking-wider">
                                 <div className="col-span-2">Fecha</div>
                                 <div className="col-span-6">Detalle</div>
                                 <div className="col-span-3 text-right">Monto</div>
                                 <div className="col-span-1"></div>
                             </div>

                             {/* List */}
                             <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                 {form.transactions?.length > 0 ? (
                                     [...form.transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).map((t) => (
                                         <div key={t.id} className="grid grid-cols-12 gap-4 px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors items-center group border border-transparent hover:border-white/5">
                                             <div className="col-span-2 text-xs text-white/50">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                             
                                             <div className="col-span-6 flex items-center gap-2">
                                                  <div className={`w-1.5 h-1.5 rounded-full ${t.type === 'expense' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                  <span className="text-sm text-white font-medium truncate">{t.note}</span>
                                             </div>
                                             
                                             <div className="col-span-3 text-right">
                                                  <span className={`text-sm font-mono font-bold ${t.type === 'expense' ? 'text-red-300' : 'text-green-300'}`}>
                                                     {t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)}
                                                 </span>
                                             </div>

                                             <div className="col-span-1 flex justify-end">
                                                 <button 
                                                    onClick={() => setForm(prev => ({...prev, transactions: prev.transactions.filter(tr => tr.id !== t.id)}))} 
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                 >
                                                     <Trash2 size={14} />
                                                 </button>
                                             </div>
                                         </div>
                                     ))
                                 ) : (
                                     <div className="h-full flex flex-col items-center justify-center text-white/20">
                                         <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                             <Wallet size={20} className="opacity-50"/>
                                         </div>
                                         <p className="text-xs">Sin movimientos</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                         
                         <div className="flex justify-between items-center mt-4">
                            <p className="text-xs text-white/30">💡 Tip: Usa <kbd className="font-mono bg-white/10 px-1 rounded text-white/50">Enter</kbd> para saltar entre campos y guardar.</p>
                            <button onClick={handleSave} className={`${theme.accentBg} text-black font-bold py-2 px-6 rounded-lg text-sm hover:opacity-90 shadow-lg`}>
                                Guardar
                            </button>
                         </div>
                    </div>
                )}
                
                {/* Spacer to prevent dropdown clipping */}
                <div className="h-32"></div>
            </Modal>

            {/* Context Menu */}
            {contextMenu.visible && (
                <ContextMenu 
                    position={{ x: contextMenu.x, y: contextMenu.y }} 
                    onClose={() => setContextMenu({ ...contextMenu, visible: false })}
                    options={[
                        { label: 'Editar', icon: <Edit size={14} />, action: () => openEdit(contextMenu.item) },
                        { label: 'Eliminar', icon: <Trash2 size={14} />, action: () => handleDelete(contextMenu.item.id), danger: true }
                    ]}
                />
            )}
        </div>
    );
};

export default Campaigns;
