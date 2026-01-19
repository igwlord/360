
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Plus, Calendar, DollarSign, Clock, MoreHorizontal, Edit, Trash2, Link, CheckCircle, Circle, AlertCircle, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, LayoutList, KanbanSquare } from 'lucide-react';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import ContextMenu from '../components/common/ContextMenu';
import GlassSelect from '../components/common/GlassSelect';
import GlassTable from '../components/common/GlassTable';
import ProjectFormModal from '../components/projects/ProjectFormModal';

import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Projects = () => {
    const { theme } = useTheme();
    const { campaigns: projects, providerGroups, addProject, updateProject, deleteProject, formatCurrency } = useData(); 
    const { addToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Local State for Kanban
    const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
    const [draggedItem, setDraggedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ id: null, name: '', brand: '', status: 'Planificación', type: 'Campaña', dept: '', cost: '', date: '', notes: '' });
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
    const [transType, setTransType] = useState('expense'); // 'expense' | 'income'
    const [financeAmount, setFinanceAmount] = useState('');
    
    // Confirm Modal State
    const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const closeModal = () => {
        setIsModalOpen(false);
        // Clear navigation state to prevent reopen
        navigate(location.pathname, { replace: true, state: {} });
    };

    // Note: Removed continuous auto-save to avoid Supabase spam. Updates are committed on Save.

    // Auto-open modal if navigated from Dashboard or Directory via URL Params
    React.useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const paramNew = queryParams.get('new');
        const paramOpenId = queryParams.get('openId');
        
        // Priority: URL Params > Location State
        const shouldOpenNew = paramNew === 'true' || location.state?.openModal;
        const targetId = paramOpenId || location.state?.openId;

        if (shouldOpenNew || targetId) {
            if (shouldOpenNew) {
                // Case A: Create New
                // Pre-fill from query params if available (e.g. providerId)
                const providerId = queryParams.get('providerId');
                setForm({ 
                    id: null, 
                    name: '', 
                    brand: '', 
                    status: 'Planificación',
                    type: 'Campaña',
                    providers: providerId ? [providerId] : []
                });
                setIsModalOpen(true);
            } else if (targetId) {
                // Case B: Edit Existing
                const target = projects.find(c => String(c.id) === String(targetId));
                if (target) {
                    setForm({ ...target, activeTab: location.state?.activeTab || 'details' });
                    setIsModalOpen(true);
                }
            }

            // Clean URL and State
            // Use replaceState to clear params without refreshing
            window.history.replaceState({}, '', location.pathname);
        }
    }, [location.search, location.state, projects, location.pathname]);

    const statuses = ['Planificación', 'En Curso', 'Pendiente', 'Finalizado'];

    // Group Projects by Status (Normalized)
    const projectsByStatus = statuses.reduce((acc, status) => {
        acc[status] = projects.filter(c => {
             // Exact match
             if (c.status === status) return true;
             // If status is empty/unknown and we are in Planificación, include it?
             if (status === 'Planificación' && !statuses.includes(c.status)) return true; // Catch-all for unknown statuses
             return false;
        }) || [];
        return acc;
    }, {});

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        if (draggedItem && draggedItem.status !== newStatus) {
            // Optimistic update handled by context but we call the action
            const updated = { ...draggedItem, status: newStatus };
            await updateProject(updated);
        }
        setDraggedItem(null);
    };

    const handleDelete = (id) => {
        setConfirm({
            isOpen: true,
            title: '¿Eliminar Proyecto?',
            message: 'Esta acción no se puede deshacer. Se perderán todos los datos vinculados.',
            onConfirm: async () => {
                await deleteProject(id);
                addToast('Proyecto eliminado', 'error');
            }
        });
    };

    const openEdit = (item, tab = 'details') => {
        setForm({ ...item, activeTab: tab });
        setIsModalOpen(true);
        addToast('Movimiento Agregado', 'success');
    };

    return (
        <div className="h-full flex flex-col" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                     <h1 className={`text-3xl font-bold ${theme.text}`}>Proyectos</h1>
                     <p className={`${theme.textSecondary} text-sm mt-1`}>Tablero de Gestión de Proyectos</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-black/20 p-1 rounded-xl flex border border-white/5">
                        <button 
                            onClick={() => setViewMode('board')} 
                            className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white'}`}
                            title="Vista Tablero"
                        >
                            <KanbanSquare size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white'}`}
                            title="Vista Lista"
                        >
                            <LayoutList size={18} />
                        </button>
                    </div>

                    <button onClick={() => { setForm({ id: null, name: '', brand: '', status: 'Planificación' }); setIsModalOpen(true); }} className={`${theme.accentBg} text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-lg`}>
                        <Plus size={18} /> <span className="hidden md:inline">Nuevo Proyecto</span>
                    </button>
                </div>
            </div>

            {/* Content Switcher */}
            {viewMode === 'list' ? (
                 <GlassTable 
                    data={projects}
                    columns={[
                        { 
                            header: 'Proyecto', 
                            accessor: 'name',
                            render: (row) => (
                                <div>
                                    <div className="font-bold text-white">{row.name}</div>
                                    <div className="text-xs text-white/40">{row.type}</div>
                                </div>
                            )
                        },
                        { 
                            header: 'Marca', 
                            accessor: 'brand', 
                            render: (row) => (
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 ${theme.textSecondary}`}>
                                    {row.brand}
                                </span>
                            )
                        },
                        { 
                            header: 'Estado', 
                            accessor: 'status',
                            render: (row) => (
                                <span className={`text-xs px-2 py-1 rounded-full text-black font-bold ${
                                    row.status === 'En Curso' ? 'bg-green-400' :
                                    row.status === 'Pendiente' ? 'bg-yellow-400' :
                                    row.status === 'Finalizado' ? 'bg-gray-400' : 'bg-blue-400'
                                }`}>
                                    {row.status}
                                </span>
                            )
                        },
                        { header: 'Fechas', accessor: 'date', className: 'text-white/60' },
                        { 
                            header: 'Presupuesto', 
                            accessor: 'budget', // virtual
                            render: (row) => {
                                const totalBudget = row.transactions?.reduce((acc, t) => t.type === 'initial' || t.type === 'income' ? acc + t.amount : acc, 0) || 0;
                                return <span className="font-mono text-white/80">${formatCurrency(totalBudget)}</span>;
                            }
                        },
                        { 
                            header: 'Avance', 
                            accessor: 'progress', // virtual
                            render: (row) => {
                                const totalBudget = row.transactions?.reduce((acc, t) => t.type === 'initial' || t.type === 'income' ? acc + t.amount : acc, 0) || 0;
                                const executed = row.transactions?.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0) || 0;
                                const progress = totalBudget > 0 ? Math.min((executed / totalBudget) * 100, 100) : 0;
                                return (
                                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                );
                            }
                        },
                        { 
                            header: 'Acciones', 
                            accessor: 'actions', 
                            render: (row) => (
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); openEdit(row, 'details'); }} className="p-1.5 hover:bg-white/10 rounded text-blue-300" title="Editar"><Edit size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); openEdit(row, 'financial'); }} className="p-1.5 hover:bg-white/10 rounded text-green-300" title="Finanzas"><DollarSign size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 hover:bg-white/10 rounded text-red-400" title="Eliminar"><Trash2 size={14}/></button>
                                </div>
                            )
                        }
                    ]}
                 />
            ) : (
                /* Kanban Board */
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
                            <span className="text-xs font-bold text-white/30 bg-white/10 px-2 py-0.5 rounded-full">{projectsByStatus[status].length}</span>
                        </div>

                        {/* Cards */}
                        <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                            {projectsByStatus[status].map(project => {
                                // Calculate Financials on the fly for card view
                                const totalBudget = project.transactions?.reduce((acc, t) => t.type === 'initial' || t.type === 'adjustment' ? acc + t.amount : acc, 0) || 0;
                                const executed = project.transactions?.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0) || 0;
                                const available = totalBudget - executed;

                                return (
                                <div 
                                    key={project.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, project)}
                                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: project }); }}
                                    className={`p-4 rounded-2xl border border-white/5 ${theme.cardBg} hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing hover:translate-y-[-2px] hover:shadow-xl group relative overflow-hidden`}
                                >
                                    {/* Accent Bar */}
                                    <div className={`absolute top-0 left-0 w-1 h-full ${status === 'En Curso' ? 'bg-green-500' : 'bg-white/20'}`}></div>

                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 ${theme.textSecondary}`}>{project.brand}</span>
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(project); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-white/60 hover:text-white transition-opacity">
                                            <Edit size={12} />
                                        </button>
                                    </div>
                                    
                                    <h4 className="font-bold text-white text-lg pl-2 leading-tight mb-3">{project.name}</h4>
                                    
                                    <div className="pl-2 space-y-2">
                                        {project.date && (
                                            <div className="flex items-center gap-2 text-xs text-white/50">
                                                <Calendar size={12} /> <span>{project.date}</span>
                                            </div>
                                        )}
                                        
                                        {/* Financial Summary Pill */}
                                        <div onClick={(e) => { e.stopPropagation(); openEdit(project, 'financial'); }} className="flex items-center justify-between bg-black/20 rounded-lg p-2 text-xs cursor-pointer hover:bg-black/30 transition-colors border border-white/5 mt-2">
                                            <div className="flex items-center gap-2 text-white/70">
                                                <DollarSign size={12} className={theme.accent}/>
                                                <span>Disp: <span className="text-white font-bold">${formatCurrency(available)}</span></span>
                                            </div>
                                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div className={`h-full ${available < 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${totalBudget > 0 ? (executed / totalBudget) * 100 : 0}%` }}></div>
                                            </div>
                                        </div>

                                        {project.notes && (
                                            <div className="mt-2 text-xs text-white/40 italic line-clamp-2 border-t border-white/5 pt-2">
                                                "{project.notes}"
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Progress - Now based on Budget Execution */}
                                    {(() => {
                                        const progress = totalBudget > 0 ? Math.min(Math.round((executed / totalBudget) * 100), 100) : 0;
                                        return (
                                            <div className="mt-4 pl-2">
                                                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                                    <span>Progreso (Presupuesto)</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${status === 'En Curso' ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-white/30'}`} 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>
            )}

            {/* Edit / Create Modal */}
            <ProjectFormModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                initialData={form.id ? form : null}
                openTab={form.activeTab || 'details'}
            />

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

            <ConfirmModal 
                isOpen={confirm.isOpen}
                onClose={() => setConfirm({ ...confirm, isOpen: false })}
                onConfirm={confirm.onConfirm}
                title={confirm.title}
                message={confirm.message}
            />
        </div>
    );
};

export default Projects;
