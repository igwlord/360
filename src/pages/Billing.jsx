import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { 
    DollarSign, TrendingUp, TrendingDown, Plus, Filter, 
    Search, Calendar, FileText, ArrowUpRight, ArrowDownRight, 
    MoreVertical, Trash2, Edit2, X, Users, Share2
} from 'lucide-react';
import GlassTable from '../components/common/GlassTable.tsx'; // Explicit .tsx for cache busting
import ContextMenu from '../components/common/ContextMenu';
import Modal from '../components/common/Modal.tsx';

import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions';
import { useCampaigns } from '../hooks/useCampaigns';
import { useSuppliers } from '../hooks/useSuppliers';
import { formatCurrency } from '../utils/dataUtils';

const Billing = () => {
    const { theme } = useTheme();
    // Removed useData destructuring
    // const { formatCurrency } = useData(); // Keeping formatCurrency for now (or move to utils later)
    const { addToast } = useToast();

    // Hooks
    const { data: transactions = [] } = useTransactions();
    const { data: projects = [] } = useCampaigns();
    const { data: providerGroups = [] } = useSuppliers();
    
    // Mutations
    const { mutateAsync: addTransaction } = useCreateTransaction();
    const { mutateAsync: updateTransaction } = useUpdateTransaction();
    const { mutateAsync: deleteTransaction } = useDeleteTransaction();

    // Local State
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [filterType, setFilterType] = useState('all'); // all, income, expense
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState({
        id: null,
        type: 'expense', // income, expense
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        // category: '', // Removed
        project_id: '',
        provider_id: '',
        status: 'pending' // pending, paid
    });

    // Helper: Reset Form
    const resetForm = () => {
        setForm({
            id: null,
            type: 'expense',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            // category: '',
            project_id: '',
            provider_id: '',
            status: 'pending'
        });
    };

    // Format helper
    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        setForm({ ...form, amount: formatted });
    };

    // Helper: Handle Save
    const handleSave = async () => {
        // Validation 1: Required Fields
        if (!form.amount || !form.description) {
            addToast('Monto y Descripción son obligatorios', 'error');
            return;
        }

        // Sanitize Payload
        const rawAmount = String(form.amount).replace(/\./g, '').replace(/,/g, '.'); 
        const numericAmount = parseFloat(rawAmount);

        // Validation 3: Numeric Check
        if (isNaN(numericAmount) || numericAmount <= 0) {
            addToast('El monto debe ser un número válido mayor a 0', 'error');
            return;
        }
        
        const payload = {
            id: form.id,
            type: form.type,
            amount: numericAmount,
            date: form.date,
            note: form.description, // Mapped to DB column 'note'
            project_id: form.project_id && form.project_id !== "" ? form.project_id : null,
            provider_id: form.provider_id && form.provider_id !== "" ? form.provider_id : null,
            status: form.status
        };

        if (form.id) {
            await updateTransaction(payload);
            addToast('Transacción actualizada', 'success');
        } else {
            await addTransaction(payload);
            addToast('Transacción creada', 'success');
        }
        setIsAppModalOpen(false);
        resetForm();
    };

    // Helper: Handle Delete
    const handleDelete = async (id) => {
        if(window.confirm('¿Eliminar transacción?')) {
            await deleteTransaction(id);
            addToast('Transacción eliminada', 'success');
        }
    };

    // Computed: Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesType = filterType === 'all' || t.type === filterType;
            const desc = t.note || t.description || '';
            const matchesSearch = desc.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesType && matchesSearch;
        }).sort((a,b) => new Date(b.date) - new Date(a.date));
    }, [transactions, filterType, searchTerm]);

    // Computed: KPIs
    const kpis = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + (curr.amount || 0), 0);
        return {
            income,
            expense,
            balance: income - expense
        };
    }, [transactions]);

    // F3: Resumen del mes actual (Total Facturado vs Costo de Producción + Objetivo mensual)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthlySummary = useMemo(() => {
        const inMonth = (t) => {
            if (!t?.date) return false;
            const d = new Date(t.date);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        };
        const incomeMonth = transactions.filter(t => t.type === 'income' && inMonth(t)).reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const expenseMonth = transactions.filter(t => t.type === 'expense' && inMonth(t)).reduce((acc, curr) => acc + (curr.amount || 0), 0);
        return {
            totalFacturado: incomeMonth,
            costoProduccion: expenseMonth,
            balanceMes: incomeMonth - expenseMonth
        };
    }, [transactions, currentYear, currentMonth]);

    // Objetivo mensual (guardado en localStorage; opcional)
    const [monthlyGoal, setMonthlyGoal] = useState(() => {
        try {
            const v = localStorage.getItem('billing_monthly_goal');
            return v ? Number(v) : null;
        } catch { return null; }
    });
    const handleMonthlyGoalChange = (e) => {
        const val = e.target.value === '' ? null : Number(e.target.value);
        setMonthlyGoal(val);
        try {
            if (val != null) localStorage.setItem('billing_monthly_goal', String(val));
            else localStorage.removeItem('billing_monthly_goal');
        } catch (_) {}
    };

    // Computed: Projected Costs (From Rate Cards/Projects)
    const projectedCosts = useMemo(() => {
        return projects.reduce((acc, p) => acc + (p.cost || 0), 0);
    }, [projects]);
    
    // Gap Analysis - (Inline usage below)

    return (
        <div className="p-6 md:p-10 space-y-8 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className={`text-3xl md:text-4xl font-bold ${theme.text}`}>Facturación</h1>
                    <p className={`${theme.textSecondary} mt-2`}>Gestión de Flujo de Caja • Ingresos y Egresos</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsAppModalOpen(true); }}
                    className={`${theme.accentBg} text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 shadow-lg`}
                >
                    <Plus size={20} /> Nueva Transacción
                </button>
            </div>

            {/* F3: Resumen del mes actual — Total Facturado vs Costo vs Objetivo */}
            <div className={`${theme.cardBg} backdrop-blur-md rounded-2xl p-6 border border-white/10`}>
                <h3 className="text-sm font-bold text-white/60 uppercase mb-4 flex items-center gap-2">
                    <Calendar size={16} /> Este mes ({now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs uppercase font-bold text-white/40 mb-1">Total Facturado</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(monthlySummary.totalFacturado)}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold text-white/40 mb-1">Costo de Producción</p>
                        <p className="text-2xl font-bold text-red-400">{formatCurrency(monthlySummary.costoProduccion)}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold text-white/40 mb-1">Objetivo mensual</p>
                        <input
                            type="number"
                            placeholder="Ej. 500000"
                            value={monthlyGoal ?? ''}
                            onChange={handleMonthlyGoalChange}
                            className={`w-full max-w-[180px] ${theme.inputBg} border border-white/10 rounded-lg px-3 py-2 text-lg font-bold text-white focus:outline-none focus:border-[#E8A631]`}
                        />
                        {monthlyGoal != null && (
                            <p className={`text-xs mt-1 ${monthlySummary.totalFacturado >= monthlyGoal ? 'text-green-400' : 'text-amber-400'}`}>
                                {monthlySummary.totalFacturado >= monthlyGoal ? 'Objetivo cumplido' : `Faltan ${formatCurrency(monthlyGoal - monthlySummary.totalFacturado)}`}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${theme.cardBg} backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between`}>
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-400"><TrendingUp size={24}/></div>
                        <span className="text-xs uppercase font-bold text-white/40">Total Ingresos</span>
                     </div>
                     <p className={`text-3xl font-bold ${theme.text} tracking-tight`}>{formatCurrency(kpis.income)}</p>
                </div>
                <div className={`${theme.cardBg} backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between`}>
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-400"><TrendingDown size={24}/></div>
                        <span className="text-xs uppercase font-bold text-white/40">Total Egresos</span>
                     </div>
                     <p className={`text-3xl font-bold ${theme.text} tracking-tight`}>{formatCurrency(kpis.expense)}</p>
                </div>
                <div className={`${theme.cardBg} backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between relative overflow-hidden`}>
                     <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${kpis.balance >= 0 ? 'from-green-500/20' : 'from-red-500/20'} to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none`}></div>
                     <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`p-3 rounded-xl ${kpis.balance >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}><DollarSign size={24}/></div>
                        <span className="text-xs uppercase font-bold text-white/40">Balance General</span>
                     </div>
                     <p className={`text-4xl font-bold ${kpis.balance >= 0 ? 'text-green-400' : 'text-red-400'} tracking-tighter relative z-10`}>
                        {formatCurrency(kpis.balance)}
                     </p>
                </div>
            </div>

            {/* NEW: Projection Analysis Bar */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-white/5 bg-white/5`}>
                 <div>
                    <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-purple-400"/>
                        Proyección vs Ejecución
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60">Costo Proyectado (Tarifario)</span>
                            <span className="text-white font-mono">{formatCurrency(projectedCosts)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60">Gasto Real (Facturado)</span>
                            <span className={`font-mono font-bold ${kpis.expense > projectedCosts ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(kpis.expense)}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                             <div 
                                className={`h-full transition-all ${kpis.expense > projectedCosts ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${Math.min((kpis.expense / (projectedCosts || 1)) * 100, 100)}%` }}
                             ></div>
                        </div>
                    </div>
                 </div>
                 
                 <div className="border-l border-white/10 pl-6 flex flex-col justify-center">
                    <p className="text-xs text-white/50 mb-2">Estado Financiero Global</p>
                    <p className="text-lg text-white font-light">
                        El flujo de caja actual es <span className="font-bold">{kpis.balance >= 0 ? 'Positivo' : 'Negativo'}</span>. 
                        {kpis.expense > projectedCosts 
                            ? " Alerta: Los gastos reales han superado las estimaciones iniciales."
                            : " Gestión Eficiente: Los gastos se mantienen bajo control."
                        }
                    </p>
                 </div>
            </div>

            {/* Filters & Table */}
            <div className={`${theme.cardBg} backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden min-h-[500px] flex flex-col`}>
                
                {/* Toolbar */}
                <div className="p-6 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:text-white'}`}>Todos</button>
                        <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filterType === 'income' ? 'bg-green-500 text-black' : 'bg-white/5 text-white/60 hover:text-white'}`}><ArrowUpRight size={14}/> Ingresos</button>
                        <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filterType === 'expense' ? 'bg-red-500 text-white' : 'bg-white/5 text-white/60 hover:text-white'}`}><ArrowDownRight size={14}/> Egresos</button>
                    </div>
                    
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
                        <input 
                            type="text" 
                            placeholder="Buscar transacción..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-all`}
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-xs uppercase text-white/40 font-bold sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Descripción</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Proyecto / Proveedor</th>
                                <th className="p-4 text-right">Monto</th>
                                <th className="p-4 text-center">Estado</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 text-white/60 font-mono text-xs">{t.date}</td>
                                    <td className="p-4 text-white font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${t.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {t.type === 'income' ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                                            </div>
                                            {t.note || t.description}
                                        </div>
                                    </td>
                                    <td className="p-4 text-white/60">
                                        <span className="px-2 py-1 rounded bg-white/5 text-xs">{t.category || '-'}</span>
                                    </td>
                                    <td className="p-4 text-white/60 text-xs">
                                        {t.project_id && (
                                            <div className="flex items-center gap-1 mb-1">
                                                <FileText size={10} className="text-[#E8A631]"/>
                                                {projects.find(p => String(p.id) === String(t.project_id))?.name || 'Proyecto Desconocido'}
                                            </div>
                                        )}
                                        {t.provider_id && (
                                            <div className="flex items-center gap-1">
                                                <Users size={10} className="text-blue-400"/>
                                                {providerGroups.flatMap(g => g.contacts).find(c => String(c.id) === String(t.provider_id))?.company || 'Proveedor Desconocido'}
                                            </div>
                                        )}
                                        {!t.project_id && !t.provider_id && '-'}
                                    </td>
                                    <td className={`p-4 text-right font-mono font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                        {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${t.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                            {t.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setForm(t); setIsAppModalOpen(true); }} className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"><Edit2 size={14}/></button>
                                        <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-white/10 rounded text-white/60 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-white/30 italic">No hay transacciones registradas</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} title={form.id ? 'Editar Transacción' : 'Nueva Transacción'} size="md">
                <div className="flex flex-col gap-4">
                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-xl">
                        <button 
                            onClick={() => setForm({ ...form, type: 'income' })}
                            className={`py-2 rounded-lg text-sm font-bold transition-all ${form.type === 'income' ? 'bg-green-500 text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            Ingreso
                        </button>
                        <button 
                            onClick={() => setForm({ ...form, type: 'expense' })}
                            className={`py-2 rounded-lg text-sm font-bold transition-all ${form.type === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            Egreso
                        </button>
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-white/40 uppercase">Monto ($)</label>
                             <input type="text" value={form.amount} onChange={handleAmountChange} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none font-mono`} placeholder="0.00" autoFocus />
                        </div>
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-white/40 uppercase">Fecha</label>
                             <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none`} />
                        </div>
                    </div>

                    {/* Description & Category */}
                    <div className="space-y-1">
                         <label className="text-xs font-bold text-white/40 uppercase">Descripción</label>
                         <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none`} placeholder="Ej. Pago de Campaña X..." />
                    </div>
                    
                    {/* Simplified form: categoría y estado se eliminan del modal */}

                    {/* Associations (Project / Provider) */}
                    {form.type === 'income' ? (
                       <div className="space-y-1">
                            <label className="text-xs font-bold text-white/40 uppercase">Vincular a Proyecto</label>
                            <select value={form.project_id || ''} onChange={e => setForm({...form, project_id: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none [&>option]:text-black`}>
                                <option value="">-- Sin Proyecto --</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>)}
                            </select>
                       </div>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1">
                                <label className="text-xs font-bold text-white/40 uppercase">Vincular a Proyecto</label>
                                <select value={form.project_id || ''} onChange={e => setForm({...form, project_id: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none [&>option]:text-black`}>
                                    <option value="">-- General --</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                           </div>
                           <div className="space-y-1">
                                <label className="text-xs font-bold text-white/40 uppercase">Proveedor</label>
                                <select value={form.provider_id || ''} onChange={e => setForm({...form, provider_id: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none [&>option]:text-black`}>
                                    <option value="">-- Seleccionar --</option>
                                    {providerGroups.flatMap(g => g.contacts).map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                                </select>
                           </div>
                       </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                        <button onClick={() => setIsAppModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className={`flex-1 py-3 rounded-xl font-bold text-black ${theme.accentBg} hover:opacity-90 shadow-lg`}>
                            {form.id ? 'Guardar Cambios' : 'Crear Transacción'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Billing;
