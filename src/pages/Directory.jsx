
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Search, Plus, Star, Phone, Mail, Globe, Share2, Edit, Trash2, ArrowLeft, ArrowRight, User, UserPlus, Layers, Briefcase, Activity, X, MessageSquare, Calendar, CheckSquare, AlertTriangle, Megaphone, FileText, MoreVertical } from 'lucide-react';
import Modal from '../components/common/Modal.tsx';
import GlassTable from '../components/common/GlassTable'; // GlassTable handles its own heavy imports
import GlassSelect from '../components/common/GlassSelect.tsx';
import ContextMenu from '../components/common/ContextMenu';
import CreateCampaignModal from '../components/projects/CreateCampaignModal';
import ConfirmModal from '../components/common/ConfirmModal';

import { useCampaigns } from '../hooks/useCampaigns';

import { useSuppliers, useCreateContact, useUpdateContact, useDeleteContact } from '../hooks/useSuppliers';

const Directory = () => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const navigate = useNavigate(); 
    const location = useLocation();
    
    // Query Hooks
    const { data: providerGroups = [] } = useSuppliers();
    const { mutateAsync: createContact } = useCreateContact();
    const { mutateAsync: updateContact } = useUpdateContact();
    const { mutateAsync: deleteContact } = useDeleteContact();

    const { data: campaigns = [] } = useCampaigns();
    
    const [selectedContact, setSelectedContact] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeGroup, setActiveGroup] = useState('Todos');
    const [activeDetailTab, setActiveDetailTab] = useState('profile'); // 'profile' | 'history' | 'activity'
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    
    
    // UI States
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [newGroupTitle, setNewGroupTitle] = useState('');
    
    // Inline Create State
    const [isInlineCreatingGroup, setIsInlineCreatingGroup] = useState(false);
    const [inlineGroupTitle, setInlineGroupTitle] = useState('');
    
    // Project Modal State
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);


    // Navigation State Handling - OPTIMIZED to prevent Loops
    React.useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const categoryParam = queryParams.get('category');
        const highlightParam = queryParams.get('highlight');
        const stateTargetId = location.state?.targetId;
        const targetId = highlightParam || stateTargetId;

        // Only run if we actually have params to process
        if (!categoryParam && !targetId) return;

        // 1. Set Active Group from Category Param
        if (categoryParam && activeGroup !== categoryParam) { // Check inequality to avoid loop
            const group = providerGroups.find(g => g.title === categoryParam);
            if (group) {
                 // Only update if different to prevent re-render
                 if(activeGroup !== group.id) setActiveGroup(group.id);
            }
        }

        // 2. Highlight Contact
        if (targetId && (!selectedContact || selectedContact.id !== targetId)) {
            const contact = providerGroups.flatMap(g => g.contacts).find(c => c.id === targetId);
            
            if (contact) {
                 // Select contact WITHOUT forcing activeGroup update if already visible
                 // Logic to switch group only if strictly needed
                const contactGroup = providerGroups.find(g => g.contacts.some(c => c.id === contact.id));
                
                // Batch updates if possible, or sequence carefully
                if (contactGroup && activeGroup !== contactGroup.id && !categoryParam) {
                    setActiveGroup(contactGroup.id);
                }

                setSelectedContact(contact);
                
                // Scroll (Debounced)
                setTimeout(() => {
                    const el = document.getElementById(`contact-${targetId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-[#E8A631]', 'bg-white/20');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-[#E8A631]', 'bg-white/20'), 2000);
                    }
                }, 500);
            }
        }
        // Removing location.search/state from dep array if they cause loops, 
        // but they are needed for reaction. We assume providerGroups is stable from React Query.
        // Removing location.search/state from dep array if they cause loops, 
        // but they are needed for reaction. We assume providerGroups is stable from React Query.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, location.state, providerGroups]);

    // Schema Update: Strict fields
    const [contactForm, setContactForm] = useState({ 
        id: null, 
        groupId: '', 
        proveedor: '', // Ex Company
        marca: '', 
        // Commercial
        contacto_comercial_nombre: '', 
        contacto_comercial_email: '', 
        contacto_comercial_cel: '',
        // Marketing
        contacto_mkt_nombre: '', 
        contacto_mkt_email: '', 
        contacto_mkt_cel: '',
        // Extras
        website: '', 
        isFavorite: false,
        company: '', // Add legacy fields initialized provided empty to prevent uncontrolled
        brand: '',
        name: '',
        email: '',
        phone: '',
        category: ''
    });
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: null, item: null });

    const [moveModal, setMoveModal] = useState({ isOpen: false, contact: null, bulk: false });
    // Replaced custom deleteModal with generic confirm state for ConfirmModal
    const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [selectedIds, setSelectedIds] = useState([]);
    const [interactionForm, setInteractionForm] = useState({ type: 'call', note: '', date: new Date().toISOString().split('T')[0] });

    // Paginación (cliente)
    const [page, setPage] = useState(1);
    const pageSize = 50;

    // Debounced Search State to prevent Lag
    const [debouncedQuery, setDebouncedQuery] = useState('');
    
    // Effect to debounce input (Optimized)
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]); // Safe dependency

    // Flatten contacts for "All" view or filter by group
    const getAllContacts = useCallback(() => {
         return providerGroups.flatMap(g => g.contacts.map(c => ({...c, groupTitle: g.title, groupId: g.id})));
    }, [providerGroups]);



    // Reset a la primera página cuando cambian filtros o búsqueda
    React.useEffect(() => {
        setPage(1);
    }, [activeGroup, debouncedQuery, showFavoritesOnly]);

    const contactsState = useMemo(() => {
        // Optimizado: solo recalcular cuando cambian filtros / grupos
        let result = [];

        if (activeGroup === 'Todos') {
            result = getAllContacts();
        } else {
            const group = providerGroups.find(g => g.id === activeGroup);
            if (group) {
                const { title } = group;
                result = group.contacts.map(c => ({ ...c, groupTitle: title, groupId: activeGroup }));
            }
        }
        
        // Search
        if (debouncedQuery) {
            const q = debouncedQuery.toLowerCase();
            result = result.filter(c => 
                (c.proveedor || c.company || '').toLowerCase().includes(q) || 
                (c.contacto_comercial_nombre || c.name || '').toLowerCase().includes(q) ||
                (c.marca || c.brand || '').toLowerCase().includes(q)
            );
        }

        // Favorites: solo filtrar cuando el usuario activa el botón "Favoritos".
        // "Todos" debe mostrar TODOS los contactos; no ocultar al marcar favorito.
        if (showFavoritesOnly) {
            result = result.filter(c => Boolean(c.isFavorite));
        }

        const total = result.length;

        // Paginación en cliente
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paged = result.slice(start, end);

        return { contacts: paged, totalContacts: total };
    }, [activeGroup, providerGroups, debouncedQuery, showFavoritesOnly, getAllContacts, page, pageSize]);

    const contacts = contactsState.contacts;
    const totalContacts = contactsState.totalContacts;

    // Active Contact Campaigns (Memoized for Detail View)
    const contactCampaigns = useMemo(() => {
        if (!selectedContact) return [];
        return campaigns.filter(c => 
            c.providers?.includes(selectedContact.id) || 
            c.providerId === selectedContact.id
        );
    }, [campaigns, selectedContact]);

    // KPIs reales para History tab
    const totalInvestmentAll = useMemo(
        () => campaigns.reduce((acc, c) => acc + (c.cost || 0), 0),
        [campaigns]
    );

    const totalInvestmentContact = useMemo(
        () => contactCampaigns.reduce((acc, c) => acc + (c.cost || 0), 0),
        [contactCampaigns]
    );

    const performanceScore = useMemo(() => {
        if (!contactCampaigns.length) return 0;
        const completed = contactCampaigns.filter(c => c.status === 'Finalizado').length;
        return Math.round((completed / contactCampaigns.length) * 100);
    }, [contactCampaigns]);

    const shareOfSpend = useMemo(() => {
        if (!totalInvestmentAll || !totalInvestmentContact) return 0;
        return Math.round((totalInvestmentContact / totalInvestmentAll) * 100);
    }, [totalInvestmentAll, totalInvestmentContact]);

    // Move Logic
    const handleMoveClick = (contact) => {
        setMoveModal({ isOpen: true, contact });
        setContextMenu({ ...contextMenu, visible: false });
    };

    const confirmMove = async (targetGroupId) => {
        const targetGroup = providerGroups.find(g => g.id === targetGroupId);
        const targetCategory = targetGroup ? targetGroup.title : "General";

        if (moveModal.bulk) {
            // Bulk Move
            const promises = selectedIds.map(id => {
                 // Find contact in current data
                 const contact = providerGroups.flatMap(g => g.contacts).find(c => c.id === id);
                 if (contact) return updateContact({ ...contact, category: targetCategory });
                 return Promise.resolve();
            });
            await Promise.all(promises);
            setSelectedIds([]);
        } else {
            // Single Move
            if (moveModal.contact) {
                await updateContact({ ...moveModal.contact, category: targetCategory });
                
                // Optional: Update selected contact to reflect new group if needed
                if (selectedContact?.id === moveModal.contact.id) {
                    setSelectedContact({ ...selectedContact, groupId: targetGroupId, groupTitle: targetCategory });
                }
            }
        }
        setMoveModal({ isOpen: false, contact: null, bulk: false });
    };
    
    // Delete Logic
    const handleDeleteClick = (contact) => {
        setConfirm({
            isOpen: true,
            title: '¿Eliminar Contacto?',
            message: `Vas a eliminar a ${contact.company}. Esta acción es irreversible.`,
            onConfirm: async () => {
                await deleteContact(contact.id);
                if (selectedContact?.id === contact.id) setSelectedContact(null);
                setConfirm({ isOpen: false, title: '', message: '', onConfirm: null });
            }
        });
        setContextMenu({ ...contextMenu, visible: false });
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setConfirm({
            isOpen: true,
            title: '¿Eliminar contactos seleccionados?',
            message: `Vas a eliminar ${selectedIds.length} contactos del directorio. Esta acción es irreversible.`,
            onConfirm: async () => {
                // Borrado en paralelo para reducir tiempo de espera
                await Promise.all(selectedIds.map(id => deleteContact(id)));
                setSelectedIds([]);
                if (selectedContact && selectedIds.includes(selectedContact.id)) {
                    setSelectedContact(null);
                }
                setConfirm({ isOpen: false, title: '', message: '', onConfirm: null });
            }
        });
    };
    // confirmDelete removed, logic moved to onConfirm above

    const handleAddInteraction = async () => {
        if (!interactionForm.note) return;
        
        const newInteraction = {
            id: `int-${Date.now()}`,
            type: interactionForm.type,
            note: interactionForm.note,
            date: interactionForm.date || new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };
        
        const updatedHistory = [...(selectedContact.history || []), newInteraction];
        const updatedContact = { ...selectedContact, history: updatedHistory };
        
        await updateContact(updatedContact);
        
        setInteractionForm({ type: 'call', note: '', date: new Date().toISOString().split('T')[0] });
        setSelectedContact(updatedContact);
    };

    // Handlers
    const handleContextMenu = (e, type, item) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            type, // 'group' or 'contact'
            item
        });
    };

    const handleEditContact = (contact) => {
        setContactForm({ ...contact });
        setIsContactModalOpen(true);
    };

    const openCreateModal = () => {
        setContactForm({ 
            id: null, 
            groupId: providerGroups[0]?.id || '', 
            proveedor: '', 
            marca: '', 
            contacto_comercial_nombre: '', 
            contacto_comercial_email: '', 
            contacto_comercial_cel: '',
            contacto_mkt_nombre: '', 
            contacto_mkt_email: '', 
            contacto_mkt_cel: '',
            website: '', 
            isFavorite: false 
        });
        setIsContactModalOpen(true);
    };




    const handleSaveContact = async () => {
        try {
            // Validation: Company name is required
            if (!contactForm.proveedor && !contactForm.company) return; 
            
            // Map legacy state to new if needed
            const payload = {
                ...contactForm,
                proveedor: contactForm.proveedor || contactForm.company,
                marca: contactForm.marca || contactForm.brand
            };

            if (contactForm.id) {
                 // Update
                 // Check if group changed (category)
                 // If groupId is passed, we might need to find the title. 
                 // But typically form binds to category name or ID? 
                 // Form seems to bind 'groupId'. 
                 const group = providerGroups.find(g => g.id === contactForm.groupId);
                 const category = group ? group.title : (contactForm.category || "General");
                 
                 await updateContact({ ...payload, category });
                 addToast("Contacto actualizado", 'success');
                 
                 // Update selected logic
                 if (selectedContact && selectedContact.id === contactForm.id) {
                     setSelectedContact({ ...payload, category, groupTitle: category });
                 }
            } else {
                 // Create
                 const group = providerGroups.find(g => g.id === contactForm.groupId);
                 const category = group ? group.title : "General";
                 
                 await createContact({ ...payload, category });
                 addToast("Contacto creado", 'success');
            }
            setIsContactModalOpen(false);
        } catch {
            addToast("Error al guardar contacto.", 'error');
        }
    };

    const handleAddGroup = () => {
        if (!newGroupTitle.trim()) return;
        // Group creation is implicit by category.
        // We just switch view to it, assuming the user will add a contact there.
        // Or we could trigger a "New Contact" modal with this group pre-filled.
        setActiveGroup(newGroupTitle); // Logic might need adjustment if activeGroup expects ID
        // Actually activeGroup expects ID (g-Category). 
        // But if it doesn't exist, we can't select it.
        // BetterUX: Open Create Contact Modal with this category pre-filled.
        
        setContactForm(prev => ({ ...prev, groupId: 'new', category: newGroupTitle }));
        setIsGroupModalOpen(false);
        setNewGroupTitle('');
        // setIsContactModalOpen(true); REMOVED: User requested not to force this flow.
        addToast(`Categoría "${newGroupTitle}" activa`, 'success');
    };

    const handleInlineCreateGroup = () => {
        if (!inlineGroupTitle.trim()) return;
        // Just set the category on the form
        setContactForm(prev => ({ ...prev, groupId: 'new', category: inlineGroupTitle }));
        setIsInlineCreatingGroup(false);
        setInlineGroupTitle('');
    };

    const handleExport = () => {
        // Headers matching spec
        const headers = ['Grupo','Proveedor','Marca','Contacto Comercial Info','Contacto MKT Info','Email Comercial','Email MKT','Cel Comercial','Cel MKT','Website'];
        
        const rows = providerGroups.flatMap(g => g.contacts.map(c => [
            g.title,
            c.proveedor || c.company || '',
            c.marca || c.brand || '',
            c.contacto_comercial_nombre || c.name || '',
            c.contacto_mkt_nombre || '',
            c.contacto_comercial_email || c.email || '',
            c.contacto_mkt_email || '',
            c.contacto_comercial_cel || c.phone || '',
            c.contacto_mkt_cel || '',
            c.website || ''
        ]));

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "directorio_proveedores_360.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const text = evt.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            // Skip header row 0
            
            // Allow basic CSV parsing (NOTE: Does not handle commas inside quotes properly without library, but sufficient for simple lists)
            for(let i=1; i<lines.length; i++) {
                const cols = lines[i].split(',');
                if (cols.length < 2) continue;
                
                // Schema: Group, Company, Brand, Comm Name, Mkt Name, Comm Email, Mkt Email, Comm Cel, Mkt Cel, Website
                const [group, proveedor, marca, commName, mktName, commEmail, mktEmail, commCel, mktCel, web] = cols;
                
                // Find or Create Group
                const targetGroup = providerGroups.find(g => g.title === group) || providerGroups[0];

                const validContact = {
                    id: null,
                    groupId: targetGroup.id,
                    proveedor: proveedor?.trim(),
                    marca: marca?.trim(),
                    contacto_comercial_nombre: commName?.trim(),
                    contacto_comercial_email: commEmail?.trim(),
                    contacto_comercial_cel: commCel?.trim(),
                    contacto_mkt_nombre: mktName?.trim(),
                    contacto_mkt_email: mktEmail?.trim(),
                    contacto_mkt_cel: mktCel?.trim(),
                    website: web?.trim(),
                    isFavorite: false
                };
                
                if(validContact.proveedor) {
                    // Create sequentially or parallel? Parallel is faster but risky for race conditions. Sequentially for safety here.
                    await createContact(validContact);
                }
            }
            addToast('Importación completada', 'success');
        };
        reader.readAsText(file);
    };

    const toggleFavorite = React.useCallback(async (contact, e) => {
        if(e) e.stopPropagation();
        await updateContact({ ...contact, isFavorite: !contact.isFavorite });
        
        // If viewed interactively, update local state immediately for responsiveness
        if (selectedContact && selectedContact.id === contact.id) {
            setSelectedContact({ ...selectedContact, isFavorite: !selectedContact.isFavorite });
        }
    }, [updateContact, selectedContact, setSelectedContact]);

    const columns = React.useMemo(() => [
        { 
            header: 'Empresa / Categoría', 
            accessor: 'company', 
            width: '240px',
            sortable: true,
            render: (row, options = {}) => {
                const { highlightedId } = options;
                return (
                <div className="flex items-center gap-4 py-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-transform group-hover:scale-105 border border-white/10 ${highlightedId === row.id ? 'bg-[#E8A631] text-black' : 'bg-white/5 text-white/50'}`}>
                        {row.company?.substring(0,1).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${highlightedId === row.id ? 'text-white' : 'text-white/90'}`}>{row.company}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] uppercase font-bold text-white/40 tracking-wider truncate max-w-[120px]">
                                {row.groupTitle}
                            </span>
                            {row.isFavorite && <Star size={10} className="fill-[#E8A631] text-[#E8A631]"/>}
                        </div>
                    </div>
                </div>
            )},
        },
        { 
            header: 'Contacto Principal', 
            accessor: 'name', 
            width: '200px',
            sortable: true,
            render: (row, options = {}) => {
                const { highlightedId } = options;
                return (
                <div className="flex justify-between items-center pr-2 group/cell">
                    <div className="min-w-0">
                         <p className="text-xs text-white/80 font-medium truncate">{row.name || row.contacto_comercial_nombre || 'Sin contacto'}</p>
                         <p className="text-[10px] text-white/40 truncate">{row.email || row.contacto_comercial_email || '-'}</p>
                    </div>
                    {/* Inline Actions - Visible on hover or selected */}
                    <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${highlightedId === row.id ? 'opacity-100' : ''}`}>
                         {row.email && (
                            <a href={`mailto:${row.email}`} onClick={e => e.stopPropagation()} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors" title="Enviar Email">
                                <Mail size={14}/>
                            </a>
                         )}
                         {row.phone && (
                            <a href={`https://wa.me/${row.phone.replace(/[^0-9]/g, '')}`} target="_blank" onClick={e => e.stopPropagation()} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-green-400 transition-colors" title="WhatsApp">
                                <Phone size={14}/>
                            </a>
                         )}
                    </div>
                </div>
            )},
        },
        { 
            header: <div className="text-right pr-4">Estado</div>, 
            accessor: 'status', 
            width: '100px',
            render: (row) => {
                const isFav = selectedContact && row.id === selectedContact.id
                    ? selectedContact.isFavorite
                    : row.isFavorite;
                return (
                <div className="flex justify-end pr-2 gap-2">
                     <button 
                        onClick={(e) => toggleFavorite(row, e)}
                        className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${isFav ? 'text-[#E8A631]' : 'text-white/10 hover:text-white/30'}`}
                     >
                        <Star size={16} className={isFav ? 'fill-[#E8A631]' : ''}/>
                     </button>
                </div>
            );
            }
        }
    ], [toggleFavorite, selectedContact]);

    return (
        <div className="h-full flex gap-6 relative" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
            
            {/* LEFT PANE: Navigation & List */}
            <div className={`w-1/2 flex flex-col ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300`}>
                
                {/* Search & Header */}
                <div className="p-5 border-b border-white/10 bg-black/10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Directorio</h2>
                        <div className="flex gap-2">
                             {/* Import (Hidden Input + Label) */}
                             <label className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-colors border border-white/5 cursor-pointer flex items-center gap-2">
                                Importar CSV
                                <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
                             </label>
                             <button onClick={handleExport} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-colors border border-white/5">
                                Exportar
                             </button>
                             <button onClick={openCreateModal} className="p-2 bg-[#E8A631] hover:bg-[#d69628] rounded-full transition-colors flex items-center justify-center text-black shadow-lg" title="Nuevo Contacto">
                                <UserPlus size={18} />
                             </button>
                        </div>
                    </div>
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 text-white/40" size={16} />
                            <input 
                                type="text" 
                                placeholder="Buscar contacto..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#E8A631]"
                            />
                        </div>
                        <button 
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={`px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1 text-xs font-bold ${
                                showFavoritesOnly ? 'bg-[#E8A631]/20 border-[#E8A631] text-[#E8A631]' : 'bg-black/20 border-white/10 text-white/40 hover:text-white'
                            }`}
                            title="Ver solo favoritos"
                        >
                            <Star size={14} className={showFavoritesOnly ? 'fill-[#E8A631]' : ''} />
                            <span>Favoritos</span>
                        </button>
                    </div>
                </div>

                {/* Groups Tabs */}
                <div className="flex items-center border-b border-white/5 bg-black/20 pr-2">
                    <div className="flex-1 flex overflow-x-auto p-2 gap-2 no-scrollbar">
                        <button 
                            onClick={() => setActiveGroup('Todos')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeGroup === 'Todos' ? 'bg-[#E8A631] text-black' : 'text-white/60 hover:bg-white/10'}`}
                        >
                            Todos
                        </button>
                        {providerGroups.map(g => (
                            <button 
                                key={g.id}
                                onClick={() => setActiveGroup(g.id)}
                                onContextMenu={(e) => handleContextMenu(e, 'group', g)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeGroup === g.id ? 'bg-[#E8A631] text-black' : 'text-white/60 hover:bg-white/10'}`}
                            >
                                {g.title}
                            </button>
                        ))}
                    </div>
                    {/* Add Category Button */}
                    <button onClick={() => setIsGroupModalOpen(true)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                        <Plus size={14} />
                    </button>
                </div>

                {/* Contact List via GlassTable */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Para evitar lag mientras se edita/crea un proveedor, no renderizamos la tabla debajo del modal */}
                    {!isContactModalOpen ? (
                        <>
                            <GlassTable 
                                tableName="directory-table"
                                enableSelection={true}
                                selectedIds={selectedIds}
                                onSelectionChange={setSelectedIds}
                                columns={columns}
                                data={contacts}
                                onRowClick={(contact) => setSelectedContact(contact)}
                                onRowContextMenu={(e, contact) => handleContextMenu(e, 'contact', contact)}
                                highlightedId={selectedContact?.id}
                            />

                            {/* Paginación simple */}
                            {totalContacts > pageSize && (
                                <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-black/20 text-xs text-white/60">
                                    <span>
                                        Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalContacts)} de {totalContacts}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className={`px-3 py-1 rounded-lg border border-white/10 ${
                                                page === 1 ? 'opacity-40 cursor-default' : 'hover:bg-white/10'
                                            }`}
                                        >
                                            Anterior
                                        </button>
                                        <button
                                            onClick={() => setPage((p) => (p * pageSize < totalContacts ? p + 1 : p))}
                                            disabled={page * pageSize >= totalContacts}
                                            className={`px-3 py-1 rounded-lg border border-white/10 ${
                                                page * pageSize >= totalContacts ? 'opacity-40 cursor-default' : 'hover:bg-white/10'
                                            }`}
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-white/30">
                            Editando proveedor…
                        </div>
                    )}
                </div>

                
                {/* Bulk Actions Overlay */}
                {selectedIds.length > 0 && (
                    <div className="absolute bottom-6 left-6 right-6 bg-[#E8A631] text-black p-3 rounded-xl shadow-2xl flex justify-between items-center animate-in slide-in-from-bottom-2 z-20 border border-black/10">
                        <span className="font-bold text-sm pl-2">{selectedIds.length} seleccionados</span>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setMoveModal({isOpen: true, contact: null, bulk: true})} 
                                className="px-3 py-1.5 bg-black/80 text-white hover:bg-black rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                             >
                                <Layers size={14}/> Mover a...
                             </button>
                             <button 
                                onClick={handleBulkDelete} 
                                className="px-3 py-1.5 bg-red-700/90 text-white hover:bg-red-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                             >
                                <Trash2 size={14}/> Eliminar
                             </button>
                             <button onClick={() => setSelectedIds([])} className="p-1.5 hover:bg-black/10 rounded-lg transition-colors">
                                <X size={16}/>
                             </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT PANE: Detail View */}
            <div className="flex-1 relative">
                {selectedContact ? (
                    <div className={`h-full ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-y-auto flex flex-col animate-in fade-in duration-500`}>
                        
                        {/* Header Card */}
                        <div className="text-center mb-6 relative">
                             <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#E8A631] to-orange-600 rounded-full flex items-center justify-center text-3xl font-bold text-black shadow-2xl mb-4 border-4 border-[#E8A631]/20">
                                {selectedContact.company.substring(0,2).toUpperCase()}
                             </div>
                             <h1 className="text-3xl font-bold text-white mb-1">{selectedContact.company}</h1>
                             <div className="flex items-center justify-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                    {selectedContact.groupTitle || 'General'}
                                </span>
                                <p className="text-[#E8A631] font-medium">{selectedContact.brand}</p>
                             </div>
                             
                             <button 
                                onClick={(e) => toggleFavorite(selectedContact, e)}
                                className={`absolute top-0 right-0 p-3 rounded-full border border-white/10 hover:bg-white/10 transition-colors ${selectedContact.isFavorite ? 'text-[#E8A631] fill-[#E8A631]' : 'text-white/30'}`}
                             >
                                <Star size={20} className={selectedContact.isFavorite ? 'fill-[#E8A631]' : ''}/>
                             </button>
                             
                             <button 
                                onClick={() => handleEditContact(selectedContact)}
                                className="absolute top-0 left-0 p-3 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-white/30 hover:text-white"
                                title="Editar Contacto"
                             >
                                <Edit size={20} />
                             </button>

                             {/* New: Create Quote & More Options */}
                             <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 flex gap-2 relative z-10">
                                {/* Create Quote Button */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Navigate to RateCard with Query Params to Open Wizard
                                        navigate(`/rate-card?openWizard=true&clientId=${selectedContact.id}&clientName=${encodeURIComponent(selectedContact.company || selectedContact.name)}`);
                                    }}
                                    className="px-4 py-2 bg-[#E8A631] hover:bg-[#d69628] text-black text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                                >
                                    <FileText size={14} />
                                    Crear Cotización
                                </button>
                                <button 
                                    onClick={(e) => {e.stopPropagation(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: selectedContact, type: 'contact' })}}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                                >
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Detail Tabs */}
                        <div className="flex justify-center mb-6 border-b border-white/10 pt-10">
                            <button 
                                onClick={() => setActiveDetailTab('profile')}
                                className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeDetailTab === 'profile' ? 'border-[#E8A631] text-white' : 'border-transparent text-white/40 hover:text-white'}`}
                            >
                                Perfil
                            </button>
                            <button 
                                onClick={() => setActiveDetailTab('history')}
                                className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeDetailTab === 'history' ? 'border-[#E8A631] text-white' : 'border-transparent text-white/40 hover:text-white'}`}
                            >
                                {activeDetailTab === 'history' ? <Layers size={14} className="text-[#E8A631]"/> : <Layers size={14}/>} Historial 360
                            </button>
                            <button 
                                onClick={() => setActiveDetailTab('activity')}
                                className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeDetailTab === 'activity' ? 'border-[#E8A631] text-white' : 'border-transparent text-white/40 hover:text-white'}`}
                            >
                                {activeDetailTab === 'activity' ? <Activity size={14} className="text-[#E8A631]"/> : <Activity size={14}/>} Actividad
                            </button>
                        </div>

                        {activeDetailTab === 'activity' && (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-6">
                                {/* Active Campaigns */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Megaphone size={18} className="text-[#E8A631]"/> Campañas Activas</h3>
                                        <button 
                                        onClick={() => setIsProjectModalOpen(true)}
                                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={12} /> Nueva Campaña
                                    </button>
                                    </div>
                                    
                                    {/* Real Campaign Filtering */}
                                    {contactCampaigns.length === 0 ? (
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                                <Megaphone size={24} className="text-white/20" />
                                            </div>
                                            <p className="text-white font-bold mb-1">Sin campañas activas</p>
                                            <p className="text-xs text-white/50 max-w-[200px] mb-4">Este proveedor no está participando en ningún proyecto actual.</p>
                                            <div className="relative group">
                                                <span className="text-xs text-[#E8A631] underline cursor-help">¿Qué debería ver aquí?</span>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-lg bg-black/90 border border-white/20 text-[10px] text-white/80 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    Aquí aparecerán los proyectos donde este proveedor tenga items asignados o facturas cargadas.
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-xs text-white/40 uppercase tracking-wider">
                                                        <th className="p-4 font-medium">Estado</th>
                                                        <th className="p-4 font-medium">Campaña</th>
                                                        <th className="p-4 font-medium">Fecha</th>
                                                        <th className="p-4 font-medium"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {contactCampaigns.map(project => (
                                                        <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                            <td className="p-4">
                                                                <div className={`w-2 h-2 rounded-full ${
                                                                    project.status === 'En Curso' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                                                                    project.status === 'Planificación' ? 'bg-yellow-500' :
                                                                    project.status === 'Finalizado' ? 'bg-blue-500' : 'bg-white/20'
                                                                }`}></div>
                                                            </td>
                                                            <td className="p-4">
                                                                <p className="text-sm font-bold text-white max-w-[200px] truncate">{project.name}</p>
                                                                <p className="text-[10px] text-white/40">{project.brand}</p>
                                                            </td>
                                                            <td className="p-4 text-xs text-white/60">
                                                                {project.date || 'Sin fecha'}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <button 
                                                                    onClick={() => navigate('/proyectos?openId=' + project.id)}
                                                                    className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Ver Proyecto"
                                                                >
                                                                    <ArrowRight size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Budget Simulations */}
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Activity size={18} className="text-blue-400"/> Presupuestos Recientes</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Empty State */}
                                        <div className="col-span-1 md:col-span-2 bg-white/5 border border-dashed border-white/10 rounded-xl p-6 flex items-center justify-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                                            <Activity size={20} className="text-white/40"/>
                                            <span className="text-sm text-white/40">No hay cotizaciones recientes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeDetailTab === 'profile' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                                    <a 
                                        href={`mailto:${selectedContact.email}?subject=Consulta 360 - ${selectedContact.company}&body=Hola ${selectedContact.name},\n\nTe contacto desde el Comando 360 para...`} 
                                        className="flex flex-col items-center gap-2 group p-3 rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#E8A631] group-hover:text-black transition-all shadow-lg">
                                            <Mail size={18} />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-white/40 group-hover:text-white">Email</span>
                                    </a>
                                    <a 
                                        href={`https://wa.me/${selectedContact.phone?.replace(/[^0-9]/g, '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex flex-col items-center gap-2 group p-3 rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-black transition-all shadow-lg">
                                            <Phone size={18} />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-white/40 group-hover:text-white">WhatsApp</span>
                                    </a>
                                    <a 
                                        href={`https://teams.microsoft.com/l/call/0/0?users=${selectedContact.email}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center gap-2 group p-3 rounded-xl hover:bg-white/5 transition-colors"
                                        title="Llamar por Teams"
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#5059C9] group-hover:text-white transition-all shadow-lg`}>
                                            <Phone size={18} className="rotate-45" />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-white/40 group-hover:text-white">Teams</span>
                                    </a>
                                    <button 
                                        onClick={() => {
                                            if (selectedContact.website) window.open(selectedContact.website, '_blank');
                                            else handleEditContact(selectedContact);
                                        }}
                                        className="flex flex-col items-center gap-2 group p-3 rounded-xl hover:bg-white/5 transition-colors"
                                        title={selectedContact.website || "Agregar Web"}
                                    >
                                        <div className={`w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center transition-all shadow-lg ${selectedContact.website ? 'bg-white/5 group-hover:bg-blue-500 group-hover:text-black' : 'bg-transparent border-dashed border-white/30 text-white/30 hover:text-white hover:border-white'}`}>
                                            <Globe size={18} />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-white/40 group-hover:text-white">Web</span>
                                    </button>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-3 mb-2 opacity-50">
                                            <User size={16} /> <span className="text-xs uppercase font-bold">Contacto</span>
                                        </div>
                                        <p className="text-lg font-medium text-white">{selectedContact.name}</p>
                                        <p className="text-sm text-white/50">{selectedContact.role}</p>
                                    </div>

                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-3 mb-2 opacity-50">
                                            <User size={16} /> <span className="text-xs uppercase font-bold">Comprador</span>
                                        </div>
                                        <p className="text-lg font-medium text-white">{selectedContact.buyer || 'N/A'}</p>
                                    </div>

                                    <div className="col-span-2 bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1 opacity-50">
                                                <Mail size={16} /> <span className="text-xs uppercase font-bold">Email Corporativo</span>
                                            </div>
                                            <p className="text-base text-white font-mono">{selectedContact.email}</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 text-xs bg-white/20 px-2 py-1 rounded">Copiar</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeDetailTab === 'history' && (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-6">
                                {/* Strategic Metrics (reales) */}
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                         <p className="text-[10px] uppercase font-bold text-white/40 mb-2">Performance Score</p>
                                         <div className="flex items-baseline gap-2">
                                             <span className="text-3xl font-bold text-white">{performanceScore}%</span>
                                             <div className="flex gap-1 h-2">
                                                 <div className={`w-2 rounded-sm ${performanceScore >= 70 ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
                                                 <div className={`w-2 rounded-sm ${performanceScore >= 40 ? 'bg-green-500' : 'bg-yellow-400/60'}`}></div>
                                                 <div className={`w-2 rounded-sm ${performanceScore >= 90 ? 'bg-green-500' : 'bg-green-500/30'}`}></div>
                                             </div>
                                         </div>
                                         <p className="text-xs mt-1">
                                             {performanceScore >= 80 && <span className="text-green-400">Nivel: Top Tier</span>}
                                             {performanceScore > 0 && performanceScore < 80 && <span className="text-yellow-300">Nivel: En Desarrollo</span>}
                                             {performanceScore === 0 && <span className="text-white/40">Sin historial de campañas finalizadas</span>}
                                         </p>
                                     </div>
                                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                         <p className="text-[10px] uppercase font-bold text-white/40 mb-2">Participación de Inversión</p>
                                         <div className="flex items-baseline gap-2">
                                             <span className="text-3xl font-bold text-white">{shareOfSpend}%</span>
                                             <span className="text-xs text-white/40">del presupuesto</span>
                                         </div>
                                          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-2">
                                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(shareOfSpend, 100)}%` }}></div>
                                          </div>
                                     </div>
                                </div>

                                {/* Timeline History */}
                                <div className="bg-black/20 rounded-2xl border border-white/5 p-6 space-y-6">
                                    {/* New Interaction Form */}
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <h4 className="text-xs font-bold uppercase text-white/50 mb-3">Registrar Interacción</h4>
                                        <div className="flex gap-2 mb-2">
                                            {['call', 'email', 'meeting', 'note'].map(t => (
                                                <button 
                                                    key={t}
                                                    onClick={() => setInteractionForm({...interactionForm, type: t})}
                                                    className={`p-2 rounded-lg border flex-1 flex justify-center ${interactionForm.type === t ? 'bg-[#E8A631] text-black border-[#E8A631]' : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5'}`}
                                                    title={t}
                                                >
                                                    {t === 'call' && <Phone size={16}/>}
                                                    {t === 'email' && <Mail size={16}/>}
                                                    {t === 'meeting' && <Calendar size={16}/>}
                                                    {t === 'note' && <MessageSquare size={16}/>}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            placeholder="Notas de la reunión o llamada..." 
                                            value={interactionForm.note}
                                            onChange={e => setInteractionForm({...interactionForm, note: e.target.value})}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#E8A631] mb-2 resize-none h-20"
                                        />
                                        <div className="flex justify-between items-center">
                                            <input 
                                                type="date" 
                                                value={interactionForm.date}
                                                onChange={e => setInteractionForm({...interactionForm, date: e.target.value})}
                                                className="bg-transparent text-xs text-white/50 focus:text-white outline-none"
                                            />
                                            <button onClick={handleAddInteraction} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors">
                                                Guardar
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Layers size={14} className="text-[#E8A631]"/> Historial Cronológico</h3>
                                    
                                    <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-0 before:w-[1px] before:bg-white/10">
                                        {/* Merged History: Campaigns + Manual Interactions */}
                                        {[
                                            ...(selectedContact.history || []).map(h => ({ ...h, category: 'interaction' })),
                                            ...campaigns.filter(c => (c.providerId === selectedContact.id) || (c.providers && c.providers.includes(selectedContact.id))).map(c => ({...c, category: 'campaign', date: c.startDate || c.date}))
                                        ]
                                        .sort((a,b) => new Date(b.date) - new Date(a.date))
                                        .map((item, i) => (
                                            <div key={i} className="pl-6 relative animate-in fade-in duration-300">
                                                <div className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#121212] flex items-center justify-center ${item.category === 'campaign' ? 'bg-green-500' : 'bg-[#E8A631]'}`}>
                                                    {item.type === 'call' && <Phone size={8} className="text-black"/>}
                                                    {item.type === 'email' && <Mail size={8} className="text-black"/>}
                                                </div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-bold text-white">
                                                        {item.category === 'campaign' ? item.name : (item.type === 'call' ? 'Llamada' : item.type === 'meeting' ? 'Reunión' : 'Nota')}
                                                    </h4>
                                                    <span className="text-[10px] text-white/40 font-mono">{item.date}</span>
                                                </div>
                                                <p className="text-xs text-white/60 leading-relaxed">
                                                    {item.category === 'campaign' ? (
                                                        <>Participación en proyecto con status <span className="text-green-400">{item.status}</span></>
                                                    ) : item.note}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className={`h-full ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-10 opacity-50`}>
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <User size={40} className="text-white/20" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Selecciona un Contacto</h3>
                        <p className="text-sm text-white/50 max-w-xs">Navega por la lista de proveedores para ver sus detalles, historial y métricas 360.</p>
                    </div>
                )}
            </div>

             {/* Create/Edit Contact Modal - Strict Schema Layout */}
             <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title={contactForm.id ? "Editar Proveedor" : "Nuevo Proveedor"}>
                 <div className="space-y-6">
                     <div className="bg-white/5 p-4 rounded-xl space-y-3">
                         <h4 className="text-xs font-bold text-white/50 uppercase">Datos Generales</h4>
                         {isInlineCreatingGroup ? (
                             <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                                 <input 
                                     type="text" 
                                     placeholder="Nombre nueva categoría..." 
                                     value={inlineGroupTitle} 
                                     onChange={e => setInlineGroupTitle(e.target.value)} 
                                     className={`flex-1 ${theme.inputBg} border border-[#E8A631] rounded-xl px-4 py-2 text-sm text-white focus:outline-none`}
                                     autoFocus
                                 />
                                 <button onClick={handleInlineCreateGroup} className="p-2 bg-[#E8A631] rounded-xl text-black font-bold text-xs">Crear</button>
                                 <button onClick={() => setIsInlineCreatingGroup(false)} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20"><X size={14}/></button>
                             </div>
                         ) : (
                             <div className="flex gap-2">
                                <select 
                                    value={contactForm.groupId} 
                                    onChange={e => setContactForm({...contactForm, groupId: e.target.value})}
                                    className={`flex-1 ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm text-white [&>option]:text-black focus:outline-none focus:border-[#E8A631] transition-colors`}
                                    // Disabled Removed to allow moving categories
                                >
                                    {providerGroups.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                                </select>
                                {!contactForm.id && (
                                    <button 
                                        onClick={() => setIsInlineCreatingGroup(true)}
                                        className="px-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/30 hover:text-[#E8A631] transition-all"
                                        title="Nueva Categoría"
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                             </div>
                         )}
                         <input type="text" placeholder="Proveedor / Razón Social" value={contactForm.proveedor} onChange={e => setContactForm({...contactForm, proveedor: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                         <input type="text" placeholder="Marca Asociada" value={contactForm.marca} onChange={e => setContactForm({...contactForm, marca: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                         
                         <div className="relative">
                            <Globe className="absolute left-3 top-2.5 text-white/30" size={14} />
                            <input type="url" placeholder="Website (Opcional)" value={contactForm.website} onChange={e => setContactForm({...contactForm, website: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                         </div>
                     </div>

                     {/* Commercial Contact */}
                     <div className="bg-blue-500/5 p-4 rounded-xl space-y-3 border border-blue-500/10">
                         <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-2"><Briefcase size={12}/> Contacto Comercial</h4>
                         <input type="text" placeholder="Nombre Completo" value={contactForm.contacto_comercial_nombre} onChange={e => setContactForm({...contactForm, contacto_comercial_nombre: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors`} />
                         <div className="grid grid-cols-2 gap-3">
                             <input type="email" placeholder="Email" value={contactForm.contacto_comercial_email} onChange={e => setContactForm({...contactForm, contacto_comercial_email: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors`} />
                             <input type="tel" placeholder="Celular" value={contactForm.contacto_comercial_cel} onChange={e => setContactForm({...contactForm, contacto_comercial_cel: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors`} />
                         </div>
                     </div>

                     {/* Marketing Contact */}
                     <div className="bg-purple-500/5 p-4 rounded-xl space-y-3 border border-purple-500/10">
                         <h4 className="text-xs font-bold text-purple-400 uppercase flex items-center gap-2"><Megaphone size={12}/> Contacto Marketing</h4>
                         <input type="text" placeholder="Nombre Completo" value={contactForm.contacto_mkt_nombre} onChange={e => setContactForm({...contactForm, contacto_mkt_nombre: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors`} />
                         <div className="grid grid-cols-2 gap-3">
                             <input type="email" placeholder="Email" value={contactForm.contacto_mkt_email} onChange={e => setContactForm({...contactForm, contacto_mkt_email: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors`} />
                             <input type="tel" placeholder="Celular" value={contactForm.contacto_mkt_cel} onChange={e => setContactForm({...contactForm, contacto_mkt_cel: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors`} />
                         </div>
                     </div>

                     <button onClick={handleSaveContact} className={`w-full ${theme.accentBg} text-black font-bold py-3 rounded-xl hover:opacity-90 mt-2 shadow-lg`}>
                        {contactForm.id ? "Actualizar Proveedor" : "Guardar Proveedor"}
                     </button>
                 </div>
             </Modal>

            {/* Create Group Modal */}
             <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Nueva Categoría">
                 <div className="flex flex-col gap-4">
                     <p className="text-sm text-white/60">Crea una nueva agrupación de proveedores (ej. Packaging, Logística, Marketing).</p>
                     <input 
                        type="text" 
                        placeholder="Nombre de la categoría" 
                        value={newGroupTitle} 
                        onChange={e => setNewGroupTitle(e.target.value)} 
                        className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`}
                        autoFocus
                    />
                     <button onClick={handleAddGroup} className={`w-full ${theme.accentBg} text-black font-bold py-3 rounded-xl hover:opacity-90`}>
                        Crear Categoría
                     </button>
                 </div>
             </Modal>

            {/* Context Menu logic */}
            {contextMenu.visible && (
                <ContextMenu 
                    position={{ x: contextMenu.x, y: contextMenu.y }} 
                    onClose={() => setContextMenu({ ...contextMenu, visible: false })}
                    options={
                        contextMenu.type === 'group' ? [
                            // Groups are derived, cannot move/delete cleanly yet
                             { label: 'Opciones de Grupo no disponibles', icon: <Trash2 size={14} />, action: () => {}, disabled: true }
                        ] : [
                            { label: 'Editar', icon: <Edit size={14} />, action: () => handleEditContact(contextMenu.item) },
                            { label: 'Mover a...', icon: <Layers size={14} />, action: () => handleMoveClick(contextMenu.item) }, 
                            { label: 'Eliminar', icon: <Trash2 size={14} />, action: () => handleDeleteClick(contextMenu.item), danger: true }
                        ]
                    }
                />
            )}

            {/* Move Contact Modal */}
            <Modal isOpen={moveModal.isOpen} onClose={() => setMoveModal({isOpen: false, contact: null})} title="Mover Contacto">
                 <div className="space-y-4">
                     <p className="text-sm text-white/70">Selecciona la nueva categoría para <b>{moveModal.contact?.company}</b>:</p>
                     <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                         {providerGroups.map(g => (
                             <button 
                                key={g.id}
                                onClick={() => confirmMove(g.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors text-left ${moveModal.contact?.groupId === g.id ? 'bg-white/10 opacity-50 cursor-default' : ''}`}
                                disabled={moveModal.contact?.groupId === g.id}
                             >
                                 <span className="text-sm font-bold text-white">{g.title}</span>
                                 {moveModal.contact?.groupId === g.id && !moveModal.bulk && <span className="text-xs text-white/30">Actual</span>}
                             </button>
                         ))}
                     </div>
                 </div>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            {/* Delete Confirmation Modal */}
            <ConfirmModal 
                isOpen={confirm.isOpen}
                onClose={() => setConfirm({ ...confirm, isOpen: false })}
                onConfirm={confirm.onConfirm}
                title={confirm.title}
                message={confirm.message}
            />
            {/* PROJECT CREATION MODAL */}
            {/* PROJECT CREATION MODAL */}
            <CreateCampaignModal 
                isOpen={isProjectModalOpen} 
                onClose={() => setIsProjectModalOpen(false)} 
                initialData={{ providers: selectedContact ? [selectedContact.id] : [] }}
            />
        </div>
    );
};


export default Directory;
