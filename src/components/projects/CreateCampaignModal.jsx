import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { DollarSign, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Trash2, Calendar, FileText, Users, Activity } from 'lucide-react';
import Modal from '../common/Modal.tsx';
import GlassSelect from '../common/GlassSelect.tsx';
import GlassInput from '../common/GlassInput'; // Standardized Input
import { useCreateCampaign, useUpdateCampaign } from '../../hooks/useMutateCampaigns';
import { useSuppliers } from '../../hooks/useSuppliers';
import { formatCurrency } from '../../utils/dataUtils';
import { calculateBudget, calculateExecuted, calculateAvailable } from '../../utils/financialUtils';

const CreateCampaignModal = ({ isOpen, onClose, initialData = null }) => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    
    // Mutations
    const { mutateAsync: createProject } = useCreateCampaign();
    const { mutateAsync: updateProject } = useUpdateCampaign();
    const { data: providerGroups = [] } = useSuppliers();

    // Local State
    const [form, setForm] = useState({
        id: null,
        name: '',
        client: '',
        status: 'Planificación',
        type: 'Campaña',
        date: '',
        notes: '',
        transactions: [],
        providers: [] // Keeping for future extensibility if needed
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [financeAmount, setFinanceAmount] = useState('');
    const [transType, setTransType] = useState('expense');
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'financial'

    // Initialize
    useEffect(() => {
        if (isOpen) {
             const baseState = {
                id: null,
                name: '',
                client: '',
                status: 'Planificación',
                type: 'Campaña',
                date: '',
                notes: '',
                transactions: [],
                providers: []
            };

            if (initialData) {
                // Determine if we actually need to update checking against current form state
                setForm(prev => {
                   if (prev.id === initialData.id && prev.name === initialData.name) return prev;
                   return {
                        ...baseState,
                        ...initialData,
                        transactions: initialData.transactions || [],
                        name: initialData.name || '',
                        client: initialData.client || initialData.brand || '',
                        date: initialData.date || '',
                        notes: initialData.notes || ''
                    };
                });
            } else {
                setForm(baseState);
            }
            
            setActiveTab('details');
            setFinanceAmount('');
        }
    }, [isOpen, initialData]);

    // Format helper for "1.000" style
    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        setFinanceAmount(formatted);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            addToast('El nombre de la campaña es obligatorio', 'error');
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            if (form.id) {
                await updateProject(form);
                addToast('Campaña actualizada', 'success');
            } else {
                await createProject({ ...form, progress: 0 });
                addToast('Campaña creada', 'success');
            }
            onClose();
        } catch (error) {
            console.error(error);
            addToast('Error al guardar', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Financial Logic (Shared can be extracted to hook later) ---
    const handleAddTransaction = () => {
        if (!financeAmount || parseFloat(financeAmount) <= 0) return;
        const amount = parseFloat(financeAmount.replace(/\./g, ''));
        const newTrans = {
            id: `new-${Date.now()}`,
            date: new Date().toISOString(),
            type: transType,
            amount: amount,
            note: document.getElementById('ccm-concept')?.value || 'Movimiento'
        };
        setForm(prev => ({ ...prev, transactions: [...prev.transactions, newTrans] }));
        setFinanceAmount('');
        if(document.getElementById('ccm-concept')) document.getElementById('ccm-concept').value = '';
    };

    const removeTransaction = (id) => {
        setForm(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    };

    const totalBudget = calculateBudget(form.transactions);
    const executed = calculateExecuted(form.transactions);
    const available = calculateAvailable(form.transactions);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={form.id ? "Editar Campaña" : "Nueva Campaña"} size="lg">
            
            {/* Tabs Header */}
            <div className="flex gap-6 border-b border-white/10 mb-6">
                <button onClick={() => setActiveTab('details')} className={`pb-2 text-sm font-bold ${activeTab === 'details' ? 'text-[#E8A631] border-b-2 border-[#E8A631]' : 'text-white/40'}`}>Estrategia</button>
                <button onClick={() => setActiveTab('financial')} className={`pb-2 text-sm font-bold ${activeTab === 'financial' ? 'text-[#E8A631] border-b-2 border-[#E8A631]' : 'text-white/40'}`}>Presupuesto</button>
            </div>

            {/* DETAILS TAB */}
            {activeTab === 'details' && (
                <div className="space-y-4 animate-in fade-in">
                    <div>
                        <GlassInput 
                            label="Nombre de la Campaña"
                            autoFocus 
                            value={form.name || ''} 
                            onChange={e => setForm({...form, name: e.target.value})} 
                            placeholder="Ej. Verano 2026" 
                            icon={<FileText size={16}/>}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <GlassInput 
                                label="Cliente / Marca"
                                value={form.client || ''} 
                                onChange={e => setForm({...form, client: e.target.value})} 
                                placeholder="Ej. Coca-Cola"
                                icon={<Users size={16}/>}
                            />
                        </div>
                        <div>
                             <label className="text-xs text-white/50 mb-1 block uppercase tracking-wider font-medium">Estado</label>
                             <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                                    <Activity size={16} />
                                </div>
                                <select 
                                    value={form.status} 
                                    onChange={e => setForm({...form, status: e.target.value})} 
                                    className={`w-full ${theme.inputBg} border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#E8A631] outline-none appearance-none cursor-pointer`}
                                >
                                    <option>Planificación</option>
                                    <option>En Curso</option>
                                    <option>Pendiente</option>
                                    <option>Finalizado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                        <div>
                           <GlassInput 
                                label="Fechas / Periodo"
                                value={form.date || ''} 
                                onChange={e => setForm({...form, date: e.target.value})} 
                                placeholder="Ej. 01 Ene - 31 Mar"
                                icon={<Calendar size={16}/>}
                            />
                        </div>


                    {/* Providers Selection */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                         <label className="text-xs text-white/50 block font-bold uppercase tracking-wider">Equipo & Proveedores</label>
                         
                         <GlassSelect 
                            options={providerGroups.flatMap(g => g.contacts).map(p => ({ value: p.id, label: p.company }))}
                            value=""
                            onChange={(val) => {
                                if (!form.providers?.includes(val)) {
                                    setForm(prev => ({ ...prev, providers: [...(prev.providers || []), val] }));
                                }
                            }}
                            placeholder="Agregar Agencia / Proveedor..."
                            icon={<Users size={16}/>}
                            className="mb-2"
                        />

                        {/* Selected Providers Chips */}
                        <div className="flex flex-wrap gap-2">
                            {form.providers?.map(pId => {
                                const provider = providerGroups.flatMap(g => g.contacts).find(c => c.id === pId);
                                return provider ? (
                                    <div key={pId} className="flex items-center gap-2 bg-black/20 text-white/80 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                                        <span className="font-bold">{provider.company}</span>
                                        <span className="text-white/30 text-[10px] uppercase">
                                            {providerGroups.find(g => g.contacts.some(c => c.id === pId))?.title}
                                        </span>
                                        <button onClick={() => setForm(prev => ({ ...prev, providers: prev.providers.filter(id => id !== pId) }))} className="ml-1 hover:text-red-400">
                                            <Trash2 size={12}/>
                                        </button>
                                    </div>
                                ) : null;
                            })}
                            {(!form.providers || form.providers.length === 0) && (
                                <span className="text-[10px] text-white/30 italic">Sin proveedores asignados</span>
                            )}
                        </div>
                    </div>

                    <div>
                         <GlassInput 
                            label="Notas Estratégicas"
                            multiline
                            rows={4}
                            value={form.notes || ''} 
                            onChange={e => setForm({...form, notes: e.target.value})} 
                            placeholder="Objetivos, KPIs esperados..."
                            icon={<FileText size={16}/>}
                        />
                    </div>
                </div>
            )}

            {/* FINANCIAL TAB */}
            {activeTab === 'financial' && (
                <div className="space-y-4 animate-in fade-in h-[400px] flex flex-col">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-white/40 uppercase">Presupuesto</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(totalBudget)}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-white/40 uppercase">Ejecutado</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(executed)}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-white/40 uppercase">Disponible</p>
                            <p className={`text-lg font-bold ${available >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(available)}</p>
                        </div>
                    </div>

                    {/* Add Transaction */}
                    <div className="bg-black/20 p-2 rounded-xl flex gap-2 items-center border border-white/5">
                         <input id="ccm-concept" placeholder="Descripción del Movimiento" className="flex-1 bg-transparent text-sm text-white px-2 focus:outline-none" />
                         <div className="relative">
                             <DollarSign size={12} className="absolute left-2 top-2 text-white/40"/>
                             <input placeholder="0.00" value={financeAmount} onChange={handleAmountChange} className="w-28 bg-white/5 rounded-lg pl-6 pr-2 py-1 text-right text-white text-sm focus:outline-none" />
                         </div>
                         <button onClick={() => { setTransType('income'); handleAddTransaction(); }} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30" title="Ingreso / Presupuesto Inicial"><ArrowUpRight size={16}/></button>
                         <button onClick={() => { setTransType('expense'); handleAddTransaction(); }} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30" title="Gasto / Egreso"><ArrowDownRight size={16}/></button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                        {form.transactions?.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg group text-xs">
                                <span className="text-white/70">{t.note}</span>
                                <div className="flex items-center gap-2">
                                    <span className={t.type === 'expense' ? 'text-red-400' : 'text-green-400'}>{formatCurrency(t.amount)}</span>
                                    <button onClick={() => removeTransaction(t.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400"><Trash2 size={12}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
                <button onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white text-sm font-bold">Cancelar</button>
                <button data-testid="save-campaign-btn" onClick={handleSave} disabled={isSubmitting} className="bg-[#E8A631] text-black px-6 py-2 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Guardando...' : 'Guardar Campaña'}
                </button>
            </div>
        </Modal>
    );
};

export default CreateCampaignModal;
