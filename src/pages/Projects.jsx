
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, Search, Filter, Calendar, BarChart2, MoreVertical, Edit, Trash2, CheckCircle, Circle, AlertCircle, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, LayoutList, KanbanSquare, DollarSign, MapPin, Users } from 'lucide-react';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import ContextMenu from '../components/common/ContextMenu';
import GlassSelect from '../components/common/GlassSelect';
import GlassTable from '../components/common/GlassTable';
import CreateCampaignModal from '../components/projects/CreateCampaignModal';
import CreateEventModal from '../components/projects/CreateEventModal';
import CreateExhibitionModal from '../components/projects/CreateExhibitionModal';
import CreateSpecialModal from '../components/projects/CreateSpecialModal';

import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

import { useSuppliers } from '../hooks/useSuppliers';
import { useCampaigns } from '../hooks/useCampaigns';
import { useCalendarEvents } from '../hooks/useCalendarEvents'; // NEW
import { useUpdateCampaign, useDeleteCampaign } from '../hooks/useMutateCampaigns';
import { formatCurrency } from '../utils/dataUtils';
import { calculateFinancials } from '../utils/financials';

const Projects = () => {
    const { theme } = useTheme();
    // Removed campaigns, addProject, updateProject, deleteProject from useData
    
    // Query Hooks
    const { data: projects = [] } = useCampaigns();
    const { data: calendarEvents = [] } = useCalendarEvents(); // NEW
    const { data: providerGroups = [] } = useSuppliers();
    const { mutateAsync: updateProject } = useUpdateCampaign();
    const { mutateAsync: deleteProject } = useDeleteCampaign();

    const { addToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Local State for Kanban
    const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
    const [activeTab, setActiveTab] = useLocalStorage('projects_active_tab', 'Campaña'); // 'Campaña', 'Eventos', 'Exhibiciones', 'Especiales'
    const [draggedItem, setDraggedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ id: null, name: '', brand: '', status: 'Planificación', type: 'Campaña', dept: '', cost: '', date: '', notes: '' });
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
    
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

    // Merge Projects + Calendar Campaigns
    const allItems = [
        ...projects.map(p => ({ ...p, _source: 'campaign' })),
        ...calendarEvents.filter(e => e.type === 'campaign' || e.type === 'marketing').map(e => ({
            id: `evt-${e.id}`,
            name: e.title,
            brand: e.type === 'campaign' ? (e.extendedProps?.brand || 'Campaña') : 'Evento',
            status: 'Planificación', 
            type: e.type === 'campaign' ? 'Campaña' : 'Eventos', // Respect source type
            date: e.date,
            transactions: [],
            budget: 0,
            _source: 'calendar'
        }))
    ];

    // Filter Items by Active Tab
    const filteredItems = allItems.filter(item => {
        if (activeTab === 'Campaña') return item.type === 'Campaña' && item.type !== 'Especial'; // Strict Check
        if (activeTab === 'Eventos') return item.type === 'Eventos' || item.type === 'Evento'; 
        return item.type === activeTab; // Exhibiciones, Especiales
    });

    // Group Projects by Status (Normalized)
    const projectsByStatus = statuses.reduce((acc, status) => {
        acc[status] = filteredItems.filter(c => { 
             if (c.status === status) return true;
             if (status === 'Planificación' && !statuses.includes(c.status)) return true; 
             return false;
        }) || [];
        return acc;
    }, {});

    // Filter duplicates (if an event implies a campaign that already exists)
    // Simple dedupe by name for now if needed, but IDs should differ.
    // For now we just show ALL.



    const handleDragStart = (e, item) => {
        // Defer state update to allow drag to start without immediate re-render
        setTimeout(() => setDraggedItem(item), 0);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(item));
        // Optional: Custom ghost image could be set here
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggedItem(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        
        if (draggedItem && draggedItem.status !== newStatus) {
            // Optimistic update handled by context but we call the action
            const updated = { ...draggedItem, status: newStatus };
            try {
                await updateProject(updated);
                addToast(`Estado actualizado: ${newStatus}`, 'success');
            } catch (error) {
                addToast('Error al mover el proyecto', 'error');
            }
        }
        setDraggedItem(null);
    };

    const handleDelete = (project) => {
        const typeLabel = project.type === 'Campaña' ? 'la Campaña' : 
                          project.type === 'Eventos' ? 'el Evento' : 
                          project.type === 'Exhibiciones' ? 'la Exhibición' : 'el Proyecto';

        setConfirm({
            isOpen: true,
            title: `¿Eliminar ${project.name}?`,
            message: `Está a punto de eliminar ${typeLabel}. Esta acción es irreversible y podría afectar los presupuestos globales.`,
            onConfirm: async () => {
                await deleteProject(project.id);
                addToast(`${typeLabel} eliminado correctamente`, 'success'); 
            }
        });
    };

    const openEdit = (item, tab = 'details') => {
        setForm({ ...item, activeTab: tab });
        setIsModalOpen(true);
    };

    const renderKanbanCardContent = (project, financials) => {
        switch (project.type) {
            case 'Eventos':
                return (
                    <div className="pl-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <Calendar size={12} className="text-[#E8A631]"/> 
                            <span>{project.date ? new Date(project.date).toLocaleDateString() : 'Sin fecha'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <MapPin size={12} className="text-blue-400"/> 
                            <span className="truncate">{project.venue || 'Sede sin definir'}</span>
                        </div>
                         <div className="flex items-center gap-2 text-xs text-white/50">
                            <Users size={12}/> 
                            <span>Aforo: {project.capacity || '--'}</span>
                        </div>
                    </div>
                );
            case 'Exhibiciones':
                return (
                    <div className="pl-2 space-y-2">
                         <div className="flex items-center gap-2 text-xs text-white/60">
                            <MapPin size={12} className="text-purple-400"/> 
                            <span>{project.venue || 'Retailer sin definir'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                             <LayoutList size={12} />
                             <span>{project.booth_type || 'Stand Estándar'}</span>
                        </div>
                         {project.dimensions && (
                            <div className="text-[10px] text-white/40 pl-5">
                                {project.dimensions}
                            </div>
                         )}
                    </div>
                );
            case 'Especiales':
                return (
                    <div className="pl-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                            <Calendar size={12} className="text-pink-400"/> 
                            <span>{project.date || 'Sin fecha clave'}</span>
                        </div>
                    </div>
                );
            case 'Campaña':
            default:
                // Default Campaign View (Financial Focus)
                return (
                    <div className="pl-2 space-y-2">
                        {project.date && (
                             <div className="flex items-center gap-2 text-xs text-white/50">
                                <Calendar size={12} /> <span>{project.date}</span>
                            </div>
                        )}
                        {/* Provider Pills */}
                            <div className="flex flex-wrap gap-1 mt-1">
                                {project.providers?.map(pId => {
                                    const group = providerGroups.find(g => g.contacts.some(c => c.id === pId));
                                    const provider = group?.contacts.find(c => c.id === pId);
                                    
                                    return provider ? (
                                        <div 
                                            key={pId} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const category = group?.title || 'Todos';
                                                navigate(`/directory?category=${encodeURIComponent(category)}&highlight=${pId}`);
                                            }}
                                            className="text-[9px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[80px] cursor-pointer hover:bg-white/20 hover:text-white transition-colors" 
                                            title={`${provider.company} (${group?.title})`}
                                        >
                                            {provider.brand || provider.company}
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        
                        {/* Financial Summary Pill */}
                        <div onClick={(e) => { e.stopPropagation(); openEdit(project, 'financial'); }} className="flex items-center justify-between bg-black/20 rounded-lg p-2 text-xs cursor-pointer hover:bg-black/30 transition-colors border border-white/5 mt-2">
                            <div className="flex items-center gap-2 text-white/70">
                                <DollarSign size={12} className={theme.accent}/>
                                <span>Disp: <span className={`font-bold ${financials.available < 0 ? 'text-red-500' : 'text-white'}`}>{formatCurrency(financials.available)}</span></span>
                            </div>
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full ${financials.available < 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${financials.progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-full flex flex-col" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
            {/* Header */}
            {/* ... lines 182-230 unchanged ... */}
             <div className="flex flex-col gap-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                         <h1 className={`text-3xl font-bold ${theme.text}`}>Proyectos</h1>
                         <p className={`${theme.textSecondary} text-sm mt-1`}>Tablero de Gestión</p>
                    </div>
                </div>

                {/* Tabs & Actions Bar */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    {/* Category Tabs */}
                    <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
                        {['Campaña', 'Eventos', 'Exhibiciones', 'Especiales'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 items-center ml-auto">
                        {/* View Switcher */}
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

                        <button onClick={() => { setForm({ id: null, name: '', brand: '', status: 'Planificación', type: activeTab }); setIsModalOpen(true); }} className={`${theme.accentBg} text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-lg`}>
                            <Plus size={18} /> <span className="hidden md:inline">Nuevo {activeTab === 'Eventos' ? 'Evento' : activeTab === 'Exhibiciones' ? 'Exhibición' : activeTab === 'Especiales' ? 'Proyecto Especial' : 'Campaña'}</span>
                        </button>
                    </div>
                </div>
            </div>


            {viewMode === 'list' ? (
                 <GlassTable 
                    data={filteredItems}
                    onRowClick={(row) => openEdit(row)} // Enable Clickable Rows
                    columns={[
                        { 
                            header: 'Proyecto', 
                            accessor: 'name',
                            render: (row) => (
                                <div>
                                    <div className="font-bold text-white">{row.name.replace(/\s*\(.*?\)\s*/g, '')}</div>
                                </div>
                            )
                        },
                        { 
                            header: 'Marca', 
                            accessor: 'brand', 
                            render: (row) => row.brand ? (
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 ${theme.textSecondary}`}>
                                    {row.brand}
                                </span>
                            ) : <span className="text-white/20 text-[10px] italic">Sin Marca</span>
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
                            header: 'Disponible', 
                            accessor: 'budget', // virtual
                            render: (row) => {
                                const financials = calculateFinancials(row, projects);
                                return <span className={`font-mono font-bold ${financials.available < 0 ? 'text-red-400' : 'text-white/80'}`}>{formatCurrency(financials.available)}</span>;
                            }
                        },
                        { 
                            header: 'Avance', 
                            accessor: 'progress', // virtual
                            render: (row) => {
                                const { progress } = calculateFinancials(row, projects);
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
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 hover:bg-white/10 rounded text-red-400" title="Eliminar"><Trash2 size={14}/></button>
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
                                // Calculate Financials with Standardized Utility (includes Child Aggregation + ROAS)
                                const financials = calculateFinancials(project, projects);
                                
                                return (
                                <div 
                                    key={project.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, project)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => openEdit(project)}
                                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: project }); }}
                                    className={`p-4 rounded-2xl border border-white/5 ${theme.cardBg} hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing hover:translate-y-[-2px] hover:shadow-xl group relative overflow-hidden`}
                                >
                                    {/* Accent Bar */}
                                    <div className={`absolute top-0 left-0 w-1 h-full ${status === 'En Curso' ? 'bg-green-500' : 'bg-white/20'}`}></div>

                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 ${theme.textSecondary}`}>{project.brand}</span>
                                            {/* ROAS Badge (Only for Campaigns with Revenue) */}
                                            {project.type === 'Campaña' && Number(financials.roas) > 0 && (
                                                <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                                                    <TrendingDown size={10} className="rotate-180"/> ROAS {financials.roas}x
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(project); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-white/60 hover:text-white transition-opacity">
                                            <Edit size={12} />
                                        </button>
                                    </div>
                                    
                                    <h4 className="font-bold text-white text-lg pl-2 leading-tight mb-3">{project.name.replace(/\s*\(.*?\)\s*/g, '')}</h4>
                                    
                                    {/* DYNAMIC CARD CONTENT BASED ON TYPE */}
                                    {renderKanbanCardContent(project, financials)}
                                    
                                    {/* Progress (Only Show for Campaigns or if budget > 0) */}
                                    {project.type === 'Campaña' && (
                                        <div className="mt-4 pl-2">
                                            <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                                <span>Progreso Presupuesto</span>
                                                <span>{Math.round(financials.progress)}%</span>
                                            </div>
                                            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${status === 'En Curso' ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-white/30'}`} 
                                                    style={{ width: `${financials.progress}%` }}
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
            )}

            {/* Modal Router */}
            {isModalOpen && (
                <>
                    {/* Render specific modal based on Type or Active Tab */}
                    {(form.type === 'Eventos' || (activeTab === 'Eventos' && !form.id)) ? (
                        <CreateEventModal 
                            isOpen={isModalOpen} 
                            onClose={closeModal} 
                            initialData={form.id ? form : null}
                        />
                    ) : (form.type === 'Exhibiciones' || (activeTab === 'Exhibiciones' && !form.id)) ? (
                        <CreateExhibitionModal 
                            isOpen={isModalOpen} 
                            onClose={closeModal} 
                            initialData={form.id ? form : null}
                        />
                    ) : (form.type === 'Especiales' || (activeTab === 'Especiales' && !form.id)) ? (
                        <CreateSpecialModal 
                            isOpen={isModalOpen} 
                            onClose={closeModal} 
                            initialData={form.id ? form : null}
                        />
                    ) : (
                        <CreateCampaignModal 
                            isOpen={isModalOpen} 
                            onClose={closeModal} 
                            initialData={form.id ? form : null}
                        />
                    )}
                </>
            )}

            {/* Context Menu */}
            {contextMenu.visible && (
                <ContextMenu 
                    position={{ x: contextMenu.x, y: contextMenu.y }} 
                    onClose={() => setContextMenu({ ...contextMenu, visible: false })}
                    options={[
                        { label: 'Editar', icon: <Edit size={14} />, action: () => openEdit(contextMenu.item) },
                        { label: 'Eliminar', icon: <Trash2 size={14} />, action: () => handleDelete(contextMenu.item), danger: true }
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
