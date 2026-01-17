
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Search, Plus, Star, Phone, Mail, Globe, Share2, Edit, Trash2, ArrowLeft, ArrowRight, User, UserPlus, Layers, Briefcase, Activity, X, MessageSquare, Calendar, CheckSquare, AlertTriangle } from 'lucide-react';
import Modal from '../components/common/Modal';
import ContextMenu from '../components/common/ContextMenu';
import GlassTable from '../components/common/GlassTable';

const Directory = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const { providerGroups, actions, campaigns } = useData();
    const [selectedContact, setSelectedContact] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeGroup, setActiveGroup] = useState('Todos');
    const [activeDetailTab, setActiveDetailTab] = useState('profile'); // 'profile' | 'history'
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    
    
    // UI States
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [newGroupTitle, setNewGroupTitle] = useState('');

    // Navigation State Handling - Auto Open & Scroll
    React.useEffect(() => {
        if (location.state?.targetId) {
            const contactId = location.state.targetId;
            const contact = providerGroups.flatMap(g => g.contacts).find(c => c.id === contactId);
            
            if (contact) {
                // 1. Open Modal
                setSelectedContact(contact);
                
                // 2. Scroll and Flash
                setTimeout(() => {
                    const el = document.getElementById(`contact-${contactId}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-[#E8A631]', 'bg-white/20');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-[#E8A631]', 'bg-white/20'), 2000);
                    }
                }, 100);
            }
            // Clear state
            window.history.replaceState({}, document.title);
        }
    }, [location.state, providerGroups]);

    const [contactForm, setContactForm] = useState({ id: null, groupId: '', company: '', brand: '', name: '', role: '', email: '', phone: '', website: '', buyer: '', isFavorite: false });
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: null, item: null });

    const [moveModal, setMoveModal] = useState({ isOpen: false, contact: null, bulk: false });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, contact: null }); // NEW Delete Confirmation State
    const [selectedIds, setSelectedIds] = useState([]);
    const [interactionForm, setInteractionForm] = useState({ type: 'call', note: '', date: new Date().toISOString().split('T')[0] });

    // Flatten contacts for "All" view or filter by group
    const getAllContacts = () => {
         return providerGroups.flatMap(g => g.contacts.map(c => ({...c, groupTitle: g.title, groupId: g.id})));
    };



    const getDisplayContacts = () => {
        let contacts = activeGroup === 'Todos' 
            ? getAllContacts()
            : providerGroups.find(g => g.id === activeGroup)?.contacts.map(c => ({...c, groupTitle: providerGroups.find(g => g.id === activeGroup).title, groupId: activeGroup})) || [];
        
        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            contacts = contacts.filter(c => 
                c.company.toLowerCase().includes(q) || 
                c.name.toLowerCase().includes(q) ||
                c.brand.toLowerCase().includes(q)
            );
        }

        // Favorites Filter
        if (showFavoritesOnly) {
            contacts = contacts.filter(c => c.isFavorite);
        }

        return contacts;
    };

    const contacts = getDisplayContacts();

    // Move Logic
    const handleMoveClick = (contact) => {
        setMoveModal({ isOpen: true, contact });
        setContextMenu({ ...contextMenu, visible: false });
    };

    const confirmMove = (targetGroupId) => {
        if (moveModal.bulk) {
            actions.moveContacts(selectedIds, targetGroupId);
            setSelectedIds([]);
        } else {
            actions.moveContact(moveModal.contact.id, targetGroupId);
            // Optional: Update selected contact to reflect new group if needed
            if (selectedContact?.id === moveModal.contact.id) {
                const newGroupTitle = providerGroups.find(g => g.id === targetGroupId)?.title;
                setSelectedContact({ ...selectedContact, groupId: targetGroupId, groupTitle: newGroupTitle });
            }
        }
        setMoveModal({ isOpen: false, contact: null, bulk: false });
    };
    
    // Delete Logic
    const handleDeleteClick = (contact) => {
        setDeleteModal({ isOpen: true, contact });
        setContextMenu({ ...contextMenu, visible: false });
    };

    const confirmDelete = () => {
        if (deleteModal.contact) {
            actions.deleteContact(deleteModal.contact.id);
            if (selectedContact?.id === deleteModal.contact.id) {
                setSelectedContact(null);
            }
        }
        setDeleteModal({ isOpen: false, contact: null });
    };

    const handleAddInteraction = () => {
        if (!interactionForm.note) return;
        actions.addInteraction(selectedContact.id, interactionForm);
        setInteractionForm({ type: 'call', note: '', date: new Date().toISOString().split('T')[0] });
        // Force refresh selected contact to show new history
        const updated = providerGroups.flatMap(g=>g.contacts).find(c=>c.id === selectedContact.id);
        if(updated) setSelectedContact(updated);
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
        setContactForm({ id: null, groupId: providerGroups[0]?.id || '', company: '', brand: '', name: '', role: '', email: '', phone: '', website: '', buyer: '', isFavorite: false });
        setIsContactModalOpen(true);
    };

    const handleSaveContact = () => {
        if (!contactForm.company || !contactForm.name) return;
        actions.addContact(contactForm); // Handles both Add and Update based on ID
        if (selectedContact && selectedContact.id === contactForm.id) {
             setSelectedContact(contactForm); // Update view if currently selected
        }
        setIsContactModalOpen(false);
    };

    const handleAddGroup = () => {
        if (!newGroupTitle.trim()) return;
        const newGroup = actions.addProviderGroup(newGroupTitle);
        setNewGroupTitle('');
        setIsGroupModalOpen(false);
        setActiveGroup(newGroup.id); // Switch directly to new group
    };

    const toggleFavorite = (contact, e) => {
        if(e) e.stopPropagation();
        actions.toggleFavoriteContact(contact.id);
        // If viewed interactively, update local state immediately for responsiveness
        if (selectedContact && selectedContact.id === contact.id) {
            setSelectedContact({ ...selectedContact, isFavorite: !selectedContact.isFavorite });
        }
    };

    const columns = [
        {
            header: (
                <div className="flex justify-center">
                    <input 
                        type="checkbox" 
                        checked={contacts.length > 0 && contacts.every(c => selectedIds.includes(c.id))}
                        onChange={(e) => {
                            if (e.target.checked) {
                                // Select All Visible
                                const allVisibleIds = contacts.map(c => c.id);
                                setSelectedIds([...new Set([...selectedIds, ...allVisibleIds])]);
                            } else {
                                // Deselect All Visible
                                const visibleIds = contacts.map(c => c.id);
                                setSelectedIds(selectedIds.filter(id => !visibleIds.includes(id)));
                            }
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 cursor-pointer accent-[#E8A631]"
                    />
                </div>
            ),
            accessor: 'id',
            width: '40px',
            render: (row) => (
                <div onClick={e => e.stopPropagation()} className="flex justify-center">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, row.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== row.id));
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 cursor-pointer accent-[#E8A631]"
                    />
                </div>
            )
        },
        { 
            header: 'Empresa', 
            accessor: 'company', 
            width: '140px',
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-105 ${selectedContact?.id === row.id ? 'bg-[#E8A631] text-black shadow-lg' : 'bg-white/10 text-white/70'}`}>
                        {row.company.substring(0,1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${selectedContact?.id === row.id ? 'text-white' : 'text-white/90'}`}>{row.company}</p>
                    </div>
                </div>
            )
        },
        { 
            header: 'Detalle', 
            accessor: 'name', 
            width: '120px',
            sortable: true,
            render: (row) => (
                <div>
                     <p className="text-xs text-white/60 truncate">{row.name}</p>
                     <p className="text-[10px] text-white/30 truncate">{row.role || row.brand}</p>
                </div>
            )
        },
        { 
            header: (
                <div className="flex justify-end pr-3">
                    <button 
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`transition-all hover:scale-110 ${showFavoritesOnly ? 'text-[#E8A631] scale-110' : 'text-white/40 hover:text-[#E8A631]'}`}
                        title={showFavoritesOnly ? "Ver Todos" : "Ver Solo Favoritos"}
                    >
                        <Star size={16} fill={showFavoritesOnly ? "#E8A631" : "none"} />
                    </button>
                </div>
            ), 
            accessor: 'isFavorite', 
            width: '60px',
            render: (row) => (
                <div className="flex justify-end pr-2">
                     <button 
                        onClick={(e) => toggleFavorite(row, e)}
                        className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${row.isFavorite ? 'text-[#E8A631]' : 'text-white/20 hover:text-white/50'}`}
                     >
                        <Star size={16} className={row.isFavorite ? 'fill-[#E8A631]' : ''}/>
                     </button>
                </div>
            )
        }
    ];

    return (
        <div className="h-full flex gap-6 relative" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
            
            {/* LEFT PANE: Navigation & List */}
            <div className={`w-1/2 flex flex-col ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300`}>
                
                {/* Search & Header */}
                <div className="p-5 border-b border-white/10 bg-black/10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Directorio</h2>
                        <button onClick={openCreateModal} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center text-white/70 hover:text-white" title="Nuevo Contacto">
                            <UserPlus size={18} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-white/40" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar contacto..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#E8A631]"
                        />
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
                <div className="flex-1 overflow-hidden">
                    <GlassTable 
                        columns={columns}
                        data={contacts}
                        onRowClick={(contact) => setSelectedContact(contact)}
                        onRowContextMenu={(e, contact) => handleContextMenu(e, 'contact', contact)}
                    />
                </div>

                
                {/* Bulk Actions Overlay */}
                {selectedIds.length > 0 && (
                    <div className="absolute bottom-6 left-6 right-6 bg-[#E8A631] text-black p-3 rounded-xl shadow-2xl flex justify-between items-center animate-in slide-in-from-bottom-2 z-20 border border-black/10">
                        <span className="font-bold text-sm pl-2">{selectedIds.length} seleccionados</span>
                        <div className="flex gap-2">
                             <button onClick={() => setMoveModal({isOpen: true, contact: null, bulk: true})} className="px-3 py-1.5 bg-black/80 text-white hover:bg-black rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                                <Layers size={14}/> Mover a...
                             </button>
                             <button onClick={() => setSelectedIds([])} className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"><X size={16}/></button>
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
                        </div>

                        {/* Detail Tabs */}
                        <div className="flex justify-center mb-6 border-b border-white/10">
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
                        </div>

                        {activeDetailTab === 'profile' ? (
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
                        ) : (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-6">
                                {/* Strategic Metrics */}
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                         <p className="text-[10px] uppercase font-bold text-white/40 mb-2">Performance Score</p>
                                         <div className="flex items-baseline gap-2">
                                             <span className="text-3xl font-bold text-white">98%</span>
                                             <div className="flex gap-1 h-2">
                                                 <div className="w-2 bg-green-500 rounded-sm"></div>
                                                 <div className="w-2 bg-green-500 rounded-sm"></div>
                                                 <div className="w-2 bg-green-500/30 rounded-sm"></div>
                                             </div>
                                         </div>
                                         <p className="text-xs text-green-400 mt-1">Nivel: Top Tier</p>
                                     </div>
                                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                         <p className="text-[10px] uppercase font-bold text-white/40 mb-2">Participación de Inversión</p>
                                         <div className="flex items-baseline gap-2">
                                             <span className="text-3xl font-bold text-white">24%</span>
                                             <span className="text-xs text-white/40">del presupuesto</span>
                                         </div>
                                          <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-2">
                                              <div className="bg-blue-500 h-full w-[24%] rounded-full"></div>
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
                                                        <>Participación en campaña con status <span className="text-green-400">{item.status}</span></>
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

             {/* Create/Edit Contact Modal */}
             <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title={contactForm.id ? "Editar Contacto" : "Nuevo Contacto"}>
                 <div className="space-y-4">
                     <select 
                        value={contactForm.groupId} 
                        onChange={e => setContactForm({...contactForm, groupId: e.target.value})}
                        className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-sm text-white [&>option]:text-black focus:outline-none focus:border-[#E8A631] transition-colors`}
                        disabled={!!contactForm.id} // Disable group move for simplicity in edit, can enable if logic handles move in DataContext
                     >
                        {providerGroups.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                     </select>
                     <input type="text" placeholder="Empresa / Razón Social" value={contactForm.company} onChange={e => setContactForm({...contactForm, company: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                     <input type="text" placeholder="Marcas" value={contactForm.brand} onChange={e => setContactForm({...contactForm, brand: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                     
                     <div className="grid grid-cols-2 gap-3">
                         <input type="text" placeholder="Nombre Contacto" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                         <input type="text" placeholder="Cargo" value={contactForm.role} onChange={e => setContactForm({...contactForm, role: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                     </div>

                     <input type="email" placeholder="Email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                     
                     <div className="grid grid-cols-2 gap-3">
                         <input type="tel" placeholder="Teléfono" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                         <input type="text" placeholder="Comprador" value={contactForm.buyer} onChange={e => setContactForm({...contactForm, buyer: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                     </div>

                     {/* Website Field */}
                     <div className="relative">
                        <Globe className="absolute left-4 top-3.5 text-white/30" size={16} />
                        <input type="url" placeholder="https://www.ejemplo.com" value={contactForm.website} onChange={e => setContactForm({...contactForm, website: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#E8A631] transition-colors`} />
                     </div>

                     <button onClick={handleSaveContact} className={`w-full ${theme.accentBg} text-black font-bold py-3 rounded-xl hover:opacity-90`}>
                        {contactForm.id ? "Guardar Cambios" : "Guardar Contacto"}
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
                            { label: 'Anterior', icon: <ArrowLeft size={14} />, action: () => actions.moveGroup('up', contextMenu.item.id) },
                            { label: 'Siguiente', icon: <ArrowRight size={14} />, action: () => actions.moveGroup('down', contextMenu.item.id) },
                            { label: 'Eliminar', icon: <Trash2 size={14} />, action: () => actions.deleteGroup(contextMenu.item.id), danger: true }
                        ] : [
                            { label: 'Editar', icon: <Edit size={14} />, action: () => handleEditContact(contextMenu.item) },
                            { label: 'Mover a...', icon: <Layers size={14} />, action: () => handleMoveClick(contextMenu.item) }, // NEW Move Action
                            { label: 'Eliminar', icon: <Trash2 size={14} />, action: () => handleDeleteClick(contextMenu.item), danger: true } // MODIFIED to use custom hook
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
            <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({isOpen: false, contact: null})} title="¿Eliminar Contacto?">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-white text-lg font-bold">Estas por eliminar a {deleteModal.contact?.company}</p>
                        <p className="text-white/50 text-sm mt-1">Esta acción es irreversible y se perderá todo el historial.</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => setDeleteModal({isOpen: false, contact: null})} 
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-bold transition-colors"
                        >
                            Eliminar Definitivamente
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Directory;
