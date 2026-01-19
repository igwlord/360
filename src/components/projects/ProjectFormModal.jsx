import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, Link, DollarSign, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Modal from '../common/Modal';
import GlassSelect from '../common/GlassSelect';

const ProjectFormModal = ({ isOpen, onClose, initialData = null, openTab = 'details', preselectedProviderId = null }) => {
    const { theme } = useTheme();
    const { addProject, updateProject, providerGroups, formatCurrency } = useData();
    const { addToast } = useToast();
    
    // Form State
    const [form, setForm] = useState({ 
        id: null, 
        name: '', 
        brand: '', 
        status: 'Planificación', 
        type: 'Campaña', 
        dept: '', 
        cost: '', 
        date: '', 
        notes: '',
        providers: [],
        transactions: [],
        activeTab: 'details'
    });

    const [transType, setTransType] = useState('expense');
    const [financeAmount, setFinanceAmount] = useState('');
    
    // Status Options
    const statuses = ['Planificación', 'En Curso', 'Pendiente', 'Finalizado'];

    // Initialize Form on Open
    useEffect(() => {
        if (isOpen) {
            setForm(prev => {
                if (initialData) {
                    return { ...initialData, activeTab: openTab || 'details' };
                } else {
                     return { 
                        id: null, 
                        name: '', 
                        brand: '', 
                        status: 'Planificación',
                        type: 'Campaña',
                        providers: preselectedProviderId ? [preselectedProviderId] : [],
                        transactions: [],
                        activeTab: 'details'
                     };
                }
            });
            setFinanceAmount('');
        }
    }, [isOpen, initialData, openTab, preselectedProviderId]);

    const handleSave = async () => {
        try {
            if (!form.name.trim()) {
                addToast('El nombre del proyecto es obligatorio', 'error');
                return;
            }

            if (form.id) {
                await updateProject(form);
                addToast('Proyecto actualizado correctamente', 'success');
            } else {
                const newProject = { ...form, progress: 0, statusColor: 'bg-gray-400' };
                await addProject(newProject);
                addToast('Proyecto creado exitosamente', 'success');
            }
            onClose();
        } catch (error) {
            console.error(error);
            addToast('Error al guardar el proyecto', 'error');
        }
    };

    const handleAddTransaction = () => {
        const conceptEl = document.getElementById('pfm-concept');
        if (!conceptEl) return;
        
        const amount = financeAmount ? parseFloat(financeAmount.replace(/\./g, '')) : 0;
        const note = conceptEl.value;
        
        if (!amount || amount <= 0 || !note.trim()) {
            addToast('Completa el monto y concepto', 'error');
            return;
        }

        const newTransactions = [
            ...(form.transactions || []),
            { id: `new-${Date.now()}`, date: new Date().toISOString(), type: transType, amount, note }
        ];

        setForm(prev => ({ ...prev, transactions: newTransactions }));
        setFinanceAmount('');
        conceptEl.value = '';
        conceptEl.focus();
    };

    const removeTransaction = (tId) => {
        setForm(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => t.id !== tId)
        }));
    };

    // Derived Financials
    const totalBudget = form.transactions?.reduce((acc, t) => t.type === 'initial' || t.type === 'income' ? acc + t.amount : acc, 0) || 0;
    const executed = form.transactions?.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0) || 0;
    const available = totalBudget - executed;

    const handleTabChange = (tab) => setForm(prev => ({ ...prev, activeTab: tab }));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={form.id ? "Gestión de Proyecto" : "Nuevo Proyecto"} size="xl">
            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-4">
                <button onClick={() => handleTabChange('details')} className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${form.activeTab === 'details' ? `border-[${theme.accent}] text-white` : 'border-transparent text-white/40'}`}>Detalles</button>
                {form.id && <button onClick={() => handleTabChange('financial')} className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${form.activeTab === 'financial' ? `border-[${theme.accent}] text-white` : 'border-transparent text-white/40'}`}>Finanzas</button>}
            </div>

            {/* DETAILS TAB */}
            {form.activeTab === 'details' && (
                <div className="space-y-4 animate-in fade-in">
                    <input autoFocus type="text" placeholder="Nombre del Proyecto" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none`} />
                    
                    <div className="grid grid-cols-2 gap-3">
                         <input type="text" placeholder="Marca (Brand)" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none`} />
                         <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none [&>option]:text-black`}>
                             {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                         <label className="text-xs text-white/50 block">Tipo</label>
                         <select value={form.type || 'Campaña'} onChange={e => setForm({...form, type: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none [&>option]:text-black`}>
                             <option value="Campaña">Campaña</option>
                             <option value="Ongoing">Ongoing</option>
                             <option value="Puntual">Puntual</option>
                             <option value="Interno">Interno</option>
                         </select>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                         <input type="text" placeholder="Fechas (ej. 10 Ene - 15 Feb)" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none`} />
                    </div>

                    <textarea placeholder="Notas..." value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none h-24 resize-none`} />

                    {/* Providers Link */}
                    <div className="pt-2 border-t border-white/10">
                        <label className="text-xs text-white/50 mb-2 block">Vincular Proveedores</label>
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

                    <div className="flex justify-end gap-3 mt-4 items-center">
                        <button onClick={onClose} className={`py-3 px-6 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/10 text-white transition-colors`}>
                            Cancelar
                        </button>
                        <button onClick={handleSave} className={`px-6 py-3 rounded-xl text-black font-bold text-sm ${theme.accentBg} hover:opacity-90 shadow-lg`}>
                            {form.id ? 'Guardar Cambios' : 'Crear Proyecto'}
                        </button>
                    </div>
                </div>
            )}

            {/* FINANCIAL TAB */}
            {form.activeTab === 'financial' && (
                 <div className="flex flex-col h-[500px] animate-in fade-in slide-in-from-right-4">
                     {/* Summary */}
                     <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-blue-500/20 rounded-lg text-blue-300"><DollarSign size={20} /></div>
                             <div><p className="text-[10px] text-white/50 uppercase font-bold">Total</p><p className="text-lg font-bold text-white">${formatCurrency(totalBudget)}</p></div>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-red-500/20 rounded-lg text-red-300"><TrendingDown size={20} /></div>
                             <div><p className="text-[10px] text-white/50 uppercase font-bold">Gastado</p><p className="text-lg font-bold text-white">${formatCurrency(executed)}</p></div>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="flex items-center gap-2">
                             <div className={`p-2 rounded-lg ${available >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}><Wallet size={20} /></div>
                             <div><p className="text-[10px] text-white/50 uppercase font-bold">Disponible</p><p className={`text-lg font-bold ${available >= 0 ? 'text-green-400' : 'text-red-400'}`}>${formatCurrency(available)}</p></div>
                        </div>
                     </div>

                     {/* Transaction Input */}
                     <div className="flex-1 bg-black/20 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                         <div className="p-3 bg-white/5 border-b border-white/10 flex gap-2 items-center">
                             <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 shrink-0">
                                 <button onClick={() => setTransType('expense')} className={`px-2 py-1 text-xs font-bold rounded ${transType === 'expense' ? 'bg-red-500 text-black' : 'text-white/40'}`}><ArrowDownRight size={12}/> Gasto</button>
                                 <button onClick={() => setTransType('income')} className={`px-2 py-1 text-xs font-bold rounded ${transType === 'income' ? 'bg-green-500 text-black' : 'text-white/40'}`}><ArrowUpRight size={12}/> Ingreso</button>
                             </div>
                             <input id="pfm-concept" placeholder="Concepto..." className="flex-1 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30" onKeyDown={e => e.key === 'Enter' && document.getElementById('pfm-amount').focus()} />
                             <input id="pfm-amount" placeholder="0" value={financeAmount} onChange={e => setFinanceAmount(e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."))} className="w-24 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-white/30" onKeyDown={e => e.key === 'Enter' && handleAddTransaction()} />
                             <button onClick={handleAddTransaction} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"><Plus size={16}/></button>
                         </div>

                         <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                             {form.transactions?.length > 0 ? (
                                 [...form.transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).map((t) => (
                                     <div key={t.id} className="flex justify-between items-center p-2 rounded hover:bg-white/5 group text-xs">
                                         <div className="flex items-center gap-2">
                                             <div className={`w-1.5 h-1.5 rounded-full ${t.type === 'expense' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                             <span className="text-white/80">{t.note}</span>
                                             <span className="text-white/30 text-[10px]">{new Date(t.date).toLocaleDateString()}</span>
                                         </div>
                                         <div className="flex items-center gap-3">
                                             <span className={`font-mono font-bold ${t.type === 'expense' ? 'text-red-300' : 'text-green-300'}`}>
                                                 {t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)}
                                             </span>
                                             <button onClick={() => removeTransaction(t.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"><Trash2 size={12}/></button>
                                         </div>
                                     </div>
                                 ))
                             ) : <div className="text-center text-white/20 mt-10 text-xs">Sin movimientos</div>}
                         </div>
                     </div>
                     
                     <div className="mt-4 flex justify-end">
                        <button onClick={handleSave} className={`${theme.accentBg} text-black font-bold py-2 px-6 rounded-lg text-sm hover:opacity-90 shadow-lg`}>
                            Guardar Cambios
                        </button>
                     </div>
                 </div>
            )}
        </Modal>
    );
};

export default ProjectFormModal;
