import React, { useState, useEffect, useRef } from 'react';
import { Home, Calendar, Users, FileText, Plus, X, Download, Edit3, TrendingUp, MapPin, DollarSign, Package, Filter, Eye, EyeOff, CheckCircle, Settings, Star, ChevronDown, ChevronRight, Sliders, Layers, Megaphone, MoreVertical, Trash2, FolderInput, UserPlus, Phone, Mail, Search, FolderPlus, Briefcase, Save, ArrowUp, ArrowDown, CreditCard, Palette, Monitor, ShoppingBag, Smartphone, Layout, Mic, StickyNote, MoveRight } from 'lucide-react';

// --- DEFINICIÓN DE TEMAS VISUALES ---
const THEMES = {
  tilo: {
    name: 'Tilo',
    bg: 'bg-[#AEB8A8]', // Salvia suave
    cardBg: 'bg-[#80917D]/40', // Oliva con transparencia
    cardHover: 'hover:bg-[#80917D]/60',
    text: 'text-white',
    textSecondary: 'text-white/60',
    accent: 'text-[#EEA83B]',
    accentBg: 'bg-[#EEA83B]',
    accentBorder: 'border-[#EEA83B]',
    sidebarBg: 'bg-[#80917D]/40',
    inputBg: 'bg-black/20',
    tooltipBg: 'bg-[#2a3029]/95'
  },
  deep: {
    name: 'Deep',
    bg: 'bg-[#0f172a]', // Azul noche profundo
    cardBg: 'bg-[#1e293b]/60', // Azul pizarra oscuro
    cardHover: 'hover:bg-[#1e293b]/80',
    text: 'text-white',
    textSecondary: 'text-blue-200/60',
    accent: 'text-[#FCA311]', // Dorado intenso
    accentBg: 'bg-[#FCA311]',
    accentBorder: 'border-[#FCA311]',
    sidebarBg: 'bg-[#1e293b]/40',
    inputBg: 'bg-[#0f172a]/50',
    tooltipBg: 'bg-[#0f172a]/95'
  },
  lirio: {
    name: 'Lirio',
    bg: 'bg-[#E6DCD3]', // Tierra pastel suave
    cardBg: 'bg-[#58181F]/80', // Rojo Borravino intenso
    cardHover: 'hover:bg-[#58181F]/90',
    text: 'text-[#FDFbf7]', // Blanco crema
    textSecondary: 'text-[#FDFbf7]/60',
    accent: 'text-[#D4AF37]', // Oro clásico
    accentBg: 'bg-[#D4AF37]',
    accentBorder: 'border-[#D4AF37]',
    sidebarBg: 'bg-[#58181F]/80',
    inputBg: 'bg-[#2b090c]/40',
    tooltipBg: 'bg-[#2b090c]/95'
  }
};

// Componente de Tarjeta de Contacto Independiente
const ContactCard = ({ contact, groupId, onContextMenu, theme }) => {
  const [showPhone, setShowPhone] = useState(false);

  const togglePhone = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (contact.phone && contact.phone !== '-') {
      setShowPhone(!showPhone);
    }
  };

  return (
    <div 
      className={`${theme.cardBg} backdrop-blur-sm border border-white/10 hover:border-white/30 ${theme.cardHover} rounded-2xl p-5 transition-all group relative cursor-context-menu animate-in fade-in zoom-in duration-300 shadow-sm`}
      onContextMenu={(e) => onContextMenu(e, contact.id, groupId)}
    >
      {contact.isFavorite && (
        <div className={`absolute top-3 right-3 ${theme.accent}`}>
          <Star size={16} fill="currentColor" />
        </div>
      )}
      
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold ${theme.accent} border border-white/5 shadow-inner shrink-0`}>
          {contact.company.charAt(0)}
        </div>
        <div className="overflow-hidden min-w-0">
          <h3 className={`font-bold ${theme.text} text-sm truncate`} title={contact.company}>{contact.company}</h3>
          <p className={`text-xs ${theme.textSecondary} truncate`} title={contact.brand}>{contact.brand}</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-1 h-1 rounded-full ${theme.accentBg}`}></div>
          <p className={`text-sm font-medium ${theme.text} opacity-90 truncate`}>{contact.name}</p>
        </div>
        <p className={`text-xs ${theme.textSecondary} pl-3 truncate`}>{contact.role}</p>
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
        <a 
          href={`mailto:${contact.email}`} 
          className={`flex-1 flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-colors ${contact.email !== '-' ? `bg-white/5 ${theme.text} hover:${theme.accentBg} hover:text-black` : 'bg-black/5 text-white/20 cursor-not-allowed'}`}
          title={contact.email}
          onClick={(e) => e.stopPropagation()}
        >
          <Mail size={14} />
        </a>
        <button 
          onClick={togglePhone}
          className={`flex-1 flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all ${contact.phone !== '-' ? (showPhone ? `${theme.accentBg} text-black` : `bg-white/5 ${theme.text} hover:bg-green-500 hover:text-white`) : 'bg-black/5 text-white/20 cursor-not-allowed'}`}
          title={contact.phone !== '-' ? 'Ver teléfono' : 'No disponible'}
        >
          {showPhone ? <span className="text-[10px] font-bold tracking-tighter">{contact.phone}</span> : <Phone size={14} />}
        </button>
      </div>
    </div>
  );
};

const App = () => {
  // --- Estados de Navegación e Interacción ---
  const [currentView, setCurrentView] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  
  // --- Estado de Tema Visual ---
  const [currentThemeKey, setCurrentThemeKey] = useState('tilo');
  const theme = THEMES[currentThemeKey];

  // --- Estados de Modales de Creación/Edición ---
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  
  // --- Estados de Formularios ---
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '', company: '', brand: '', role: '', email: '', phone: '', groupId: ''
  });
  const [rateForm, setRateForm] = useState({
    id: null, category: 'Espacios Preferenciales', item: '', specs: '', price: '', unit: '', notes: ''
  });

  // --- Estados de Filtros y Configuración ---
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('Todos'); 
  const [visibleWidgets, setVisibleWidgets] = useState({
    finance: true, partners: true, campaigns: true, quickAccess: true
  });
  const [showToast, setShowToast] = useState(false);

  // --- Estado del Calendario ---
  const [calendarFilter, setCalendarFilter] = useState('all'); 

  // --- Estados de Proveedores ---
  const [expandedGroups, setExpandedGroups] = useState({}); 

  // --- Estados de Tarifario ---
  const [rateCardCategory, setRateCardCategory] = useState('Todos');
  const [rateCardSearch, setRateCardSearch] = useState('');
  // Inicializar Tarifario como State para permitir edición
  const [rateCardItems, setRateCardItems] = useState([
    { id: 't1', category: 'Espacios Preferenciales', item: 'Puntera de Góndola', specs: 'Cabecera completa (1.20m x 2.10m)', price: 500000, unit: 'Quincenal', notes: 'Requiere validación de stock.' },
    { id: 't2', category: 'Espacios Preferenciales', item: 'Isla de Exhibición', specs: 'Isla central 4 pallets', price: 850000, unit: 'Mensual', notes: '' },
    { id: 't3', category: 'Línea de Caja', item: 'Check-out (Mueble)', specs: 'Frente de caja exclusivo', price: 300000, unit: 'Mensual', notes: 'Alta rotación.' },
    { id: 't4', category: 'Señalética', item: 'Stopper Destacado', specs: '30x15cm troquelado', price: 50000, unit: 'Por Unidad/Mes', notes: '' },
    { id: 't5', category: 'Señalética', item: 'Saliente de Góndola', specs: 'Banderola lateral pasillo', price: 75000, unit: 'Por Unidad/Mes', notes: '' },
    { id: 't6', category: 'Digital', item: 'Banner App Home', specs: 'Carrusel principal 1080x600px', price: 450000, unit: 'Semanal', notes: 'Incluye reporte de clicks.' },
    { id: 't7', category: 'Digital', item: 'Push Notification', specs: 'Segmentado por categoría', price: 120000, unit: 'Por Envío', notes: '' },
    { id: 't8', category: 'Activaciones', item: 'Stand con Promotora', specs: 'Jueves a Domingo (4hs)', price: 600000, unit: 'Fin de Semana', notes: 'Coordinar ingreso de personal.' },
  ]);

  // --- Estados para Menú Contextual (Click Derecho) ---
  const [contextMenu, setContextMenu] = useState({ 
    visible: false, x: 0, y: 0, type: null, itemId: null, parentId: null 
  });
  const contextMenuRef = useRef(null);

  // --- Datos Mock Dashboard ---
  const budgetData = { executed: 13.5, total: 18.5, percentage: (13.5 / 18.5) * 100 };

  const allCampaigns = [
    { id: 1, name: 'Campaña Mar del Plata', brand: 'Cif', status: 'En Curso', statusColor: 'bg-green-400', progress: 65, date: '08 Ene - 11 Ene', dept: 'Limpieza', cost: '$4,500,000' },
    { id: 2, name: 'Vuelta al Cole', brand: 'Nesquik', status: 'Planificación', statusColor: 'bg-blue-400', progress: 25, date: 'Feb 2026', dept: 'Alimentos', cost: '$2,100,000' },
    { id: 3, name: 'Mes de la Limpieza', brand: 'Unilever', status: 'Pendiente', statusColor: 'bg-gray-400', progress: 0, date: 'Mar 2026', dept: 'Limpieza', cost: '$3,800,000' },
    { id: 4, name: 'Lanzamiento Dove', brand: 'Dove', status: 'En Curso', statusColor: 'bg-green-400', progress: 40, date: '15 Ene - 30 Ene', dept: 'Cuidado Personal', cost: '$1,200,000' },
  ];

  const calendarEvents = [
    { id: 'c1', title: 'Vuelta al Cole', type: 'campaign', startDay: 1, endDay: 28, color: 'bg-blue-500/80', textColor: 'text-white' }, 
    { id: 'c2', title: 'Mes de la Limpieza', type: 'campaign', startDay: 2, endDay: 28, color: 'bg-green-500/80', textColor: 'text-white' }, 
    { id: 'c3', title: 'Temporada Verano', type: 'campaign', startDay: 1, endDay: 15, color: 'bg-yellow-500/80', textColor: 'text-black' },
    { id: 'm1', title: 'Día Mundial Nutella', type: 'marketing', day: 5, icon: '🍫' },
    { id: 'm2', title: 'Fin de Semana Pizza', type: 'marketing', day: 6, icon: '🍕' },
    { id: 'm3', title: 'Día de la Pizza', type: 'marketing', day: 9, icon: '🍕' },
    { id: 'm4', title: 'San Valentín', type: 'marketing', day: 14, icon: '💘' },
    { id: 'm5', title: 'Carnaval', type: 'marketing', day: 16, icon: '🎭' },
  ];

  // --- DATOS REALES DE PROVEEDORES ---
  const [providerGroups, setProviderGroups] = useState([
    {
      id: 'perfumeria',
      title: 'Perfumería & Limpieza',
      contacts: [
        { id: 'p1', company: 'UNILEVER', brand: 'CIF / SKIP', name: 'Micaela Ortielli', role: 'Marketing', email: '-', phone: '-', isFavorite: true },
        { id: 'p2', company: 'COLGATE', brand: 'COLGATE', name: 'Cecilia Alvarez', role: 'Comprador', email: '-', phone: '-', isFavorite: false },
        { id: 'p3', company: 'HALEON S.A.', brand: 'SENSODYNE', name: 'Florencia Croas', role: 'Marketing', email: 'florencia.m.croas@haleon.com', phone: '-', isFavorite: false },
      ]
    },
    {
      id: 'bebidas',
      title: 'Bebidas (Alcohol & Sin Alcohol)',
      contacts: [
        { id: 'b1', company: 'FEMSA', brand: 'COCA-COLA', name: 'Gabriela Viviloni', role: 'Gerente', email: 'gabriela.viviloni@kof.com', phone: '11 3824-2753', isFavorite: true },
        { id: 'b2', company: 'PEPSICO', brand: 'PEPSI / 7UP', name: 'Nazareno Cilento', role: 'Comercial', email: 'nazareno.cilento@pepsico.com', phone: '11 3321-4583', isFavorite: false },
        { id: 'b3', company: 'MONDELEZ', brand: 'TANG / CLIGHT', name: 'Mariano Vidal', role: 'Gerente', email: 'mariano.vidal@mdlz.com', phone: '11 6474-3560', isFavorite: false },
      ]
    },
  ]);

  // --- Helpers de Lógica ---
  const toggleGroup = (groupId) => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));

  // Contact Handlers
  const handleCreateGroup = () => {
    if (!newGroupTitle.trim()) return;
    const newGroup = { id: `group-${Date.now()}`, title: newGroupTitle, contacts: [] };
    setProviderGroups([...providerGroups, newGroup]);
    setExpandedGroups(prev => ({ ...prev, [newGroup.id]: true }));
    setNewGroupTitle('');
    setIsGroupModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleCreateContact = () => {
    if (!contactForm.name || !contactForm.groupId) return;
    const contactData = { id: `new-${Date.now()}`, ...contactForm, isFavorite: false };
    setProviderGroups(prev => prev.map(group => {
      if (group.id === contactForm.groupId) return { ...group, contacts: [...group.contacts, contactData] };
      return group;
    }));
    setExpandedGroups(prev => ({ ...prev, [contactForm.groupId]: true }));
    setContactForm({ name: '', company: '', brand: '', role: '', email: '', phone: '', groupId: '' });
    setIsContactModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Rate/Tarifario Handlers
  const openRateModal = (item = null) => {
    if (item) {
      setRateForm({ ...item }); // Cargar datos para editar
    } else {
      setRateForm({ id: null, category: 'Espacios Preferenciales', item: '', specs: '', price: '', unit: '', notes: '' }); // Limpiar para nuevo
    }
    setIsRateModalOpen(true);
  };

  const handleSaveRateItem = () => {
    if (!rateForm.item || !rateForm.price) return;
    
    if (rateForm.id) {
      // Editar existente
      setRateCardItems(prev => prev.map(item => item.id === rateForm.id ? { ...rateForm, price: Number(rateForm.price) } : item));
    } else {
      // Crear nuevo
      const newItem = { ...rateForm, id: `t-${Date.now()}`, price: Number(rateForm.price) };
      setRateCardItems(prev => [...prev, newItem]);
    }
    setIsRateModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleDeleteRateItem = (id) => {
    setRateCardItems(prev => prev.filter(item => item.id !== id));
    closeContextMenu();
    setShowToast(true);
  };

  const handleMoveRateItem = (id, newCategory) => {
    setRateCardItems(prev => prev.map(item => item.id === id ? { ...item, category: newCategory } : item));
    closeContextMenu();
    setShowToast(true);
  };

  // --- Context Menu Handlers ---
  const handleContextMenu = (e, type, itemId, parentId = null) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, type, itemId, parentId });
  };
  const closeContextMenu = () => setContextMenu({ ...contextMenu, visible: false });

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // --- Acciones de Context Menu (Generales) ---
  const handleToggleFavorite = () => {
    if (contextMenu.type !== 'contact' || !contextMenu.itemId) return;
    setProviderGroups(prev => prev.map(group => ({
      ...group, contacts: group.contacts.map(c => c.id === contextMenu.itemId ? { ...c, isFavorite: !c.isFavorite } : c)
    })));
    closeContextMenu();
  };
  const handleDeleteContact = () => {
    if (contextMenu.type !== 'contact' || !contextMenu.itemId) return;
    setProviderGroups(prev => prev.map(group => ({
      ...group, contacts: group.contacts.filter(c => c.id !== contextMenu.itemId)
    })));
    closeContextMenu();
    setShowToast(true);
  };
  const moveGroup = (direction) => {
    if (contextMenu.type !== 'group' || !contextMenu.itemId) return;
    const index = providerGroups.findIndex(g => g.id === contextMenu.itemId);
    if (index === -1 || (direction === 'up' && index === 0) || (direction === 'down' && index === providerGroups.length - 1)) return;
    const newGroups = [...providerGroups];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];
    setProviderGroups(newGroups);
    closeContextMenu();
  };
  const handleDeleteGroup = () => {
    if (contextMenu.type !== 'group' || !contextMenu.itemId) return;
    setProviderGroups(prev => prev.filter(g => g.id !== contextMenu.itemId));
    closeContextMenu();
    setShowToast(true);
  };

  // Filtrado de campañas dashboard
  const filteredCampaigns = campaignFilter === 'Todos' ? allCampaigns : allCampaigns.filter(c => c.status === campaignFilter);
  const dashboardPartners = providerGroups.flatMap(g => g.contacts).sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1)).slice(0, 5);

  const openModal = (campaign) => { setSelectedCampaign(campaign); setIsModalOpen(true); };
  const handleNewActivation = () => { setShowToast(true); setTimeout(() => setShowToast(false), 3000); };
  const toggleWidget = (widget) => setVisibleWidgets(prev => ({ ...prev, [widget]: !prev[widget] }));

  // --- Componentes UI Internos ---
  const DonutChart = ({ percentage }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full">
          <circle cx="64" cy="64" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="12" fill="transparent" />
          <circle cx="64" cy="64" r={radius} stroke={theme.accentBg.replace('bg-', '')} strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ stroke: theme.accent === 'text-[#EEA83B]' ? '#EEA83B' : theme.accent === 'text-[#FCA311]' ? '#FCA311' : '#D4AF37' }} />
        </svg>
        <div className={`absolute ${theme.text} font-bold text-xl drop-shadow-md`}>{Math.round(percentage)}%</div>
      </div>
    );
  };

  const FilterPill = ({ label, active, onClick }) => (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all w-full text-left flex items-center justify-between ${active ? `${theme.accentBg} text-black` : `bg-white/5 ${theme.textSecondary} hover:bg-white/10`}`}>
      {label} {active && <CheckCircle size={12} />}
    </button>
  );

  const VisibilityToggle = ({ label, isActive, onToggle }) => (
    <button onClick={onToggle} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all w-full ${isActive ? 'bg-white/10 ' + theme.text : `bg-transparent ${theme.textSecondary} hover:bg-white/5`}`}>
      <span>{label}</span> {isActive ? <Eye size={14} className={theme.accent} /> : <EyeOff size={14} />}
    </button>
  );

  const CalendarFilterButton = ({ label, active, onClick, icon: Icon }) => (
    <button onClick={onClick} className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${active ? `${theme.accentBg} text-black shadow-inner` : `${theme.textSecondary} hover:${theme.text} hover:bg-white/5`}`}>
      {Icon && <Icon size={14} />} {label}
    </button>
  );

  const NavIcon = ({ icon: Icon, active, onClick, tooltip }) => (
    <div onClick={onClick} className={`p-3 rounded-2xl transition-all cursor-pointer group relative ${active ? `bg-white text-black shadow-lg scale-110` : `hover:bg-white/10 ${theme.text}`}`}>
      <Icon size={22} className={active ? '' : 'opacity-70 group-hover:opacity-100'} />
      <span className="absolute left-14 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{tooltip}</span>
    </div>
  );

  const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
       <div className="flex items-center gap-2 mb-1"><Icon size={14} className={theme.accent} /><span className={`text-[10px] uppercase tracking-wider ${theme.textSecondary}`}>{label}</span></div>
       <p className={`text-sm font-medium ${theme.text} ml-5.5`}>{value}</p>
    </div>
  );

  // --- VISTAS ---

  const DashboardView = () => (
    <>
      <header className="mb-6 flex flex-row justify-between items-end gap-4 relative z-30">
        <div>
          <h1 className={`text-3xl font-bold ${theme.text} drop-shadow-sm tracking-tight`}>Dashboard 2026</h1>
          <p className={`${theme.textSecondary} text-sm mt-1`}>Hoja de ruta estratégica • Q1</p>
        </div>
        <div className="relative">
          <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`p-3 rounded-xl transition-all flex items-center gap-2 font-medium text-sm shadow-lg ${isFilterMenuOpen ? `${theme.accentBg} text-black` : `${theme.cardBg} ${theme.text} hover:bg-white/10 border border-white/20`}`}>
            <Sliders size={18} /> <span className="hidden md:inline">Vista & Filtros</span>
          </button>
          {isFilterMenuOpen && (
            <div className={`absolute right-0 top-full mt-2 w-64 ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 z-50`}>
              <div className="mb-4">
                <h4 className={`text-[10px] uppercase tracking-wider ${theme.textSecondary} mb-2 font-bold flex items-center gap-1`}><Filter size={10}/> Estado Campañas</h4>
                <div className="space-y-1">
                  <FilterPill label="Todas" active={campaignFilter === 'Todos'} onClick={() => setCampaignFilter('Todos')} />
                  <FilterPill label="En Curso" active={campaignFilter === 'En Curso'} onClick={() => setCampaignFilter('En Curso')} />
                  <FilterPill label="Planificación" active={campaignFilter === 'Planificación'} onClick={() => setCampaignFilter('Planificación')} />
                </div>
              </div>
              <div className="h-px bg-white/10 my-3"></div>
              <div>
                <h4 className={`text-[10px] uppercase tracking-wider ${theme.textSecondary} mb-2 font-bold flex items-center gap-1`}><Eye size={10}/> Visibilidad Widgets</h4>
                <div className="space-y-1">
                  <VisibilityToggle label="Finanzas" isActive={visibleWidgets.finance} onToggle={() => toggleWidget('finance')} />
                  <VisibilityToggle label="Top Partners" isActive={visibleWidgets.partners} onToggle={() => toggleWidget('partners')} />
                  <VisibilityToggle label="Timeline" isActive={visibleWidgets.campaigns} onToggle={() => toggleWidget('campaigns')} />
                  <VisibilityToggle label="Acceso Rápido" isActive={visibleWidgets.quickAccess} onToggle={() => toggleWidget('quickAccess')} />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      {isFilterMenuOpen && <div className="fixed inset-0 z-20" onClick={() => setIsFilterMenuOpen(false)}></div>}

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 auto-rows-min h-auto md:h-[calc(100vh-180px)]">
        {visibleWidgets.finance && (
          <div className={`md:col-span-2 md:row-span-2 ${theme.cardBg} backdrop-blur-md rounded-[24px] shadow-lg border border-white/10 p-6 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className={`text-lg font-medium ${theme.text} opacity-90`}>Presupuesto Ejecutado</h2>
                <p className={`text-xs ${theme.textSecondary} uppercase tracking-wider mt-1`}>Consolidado Vital 2026</p>
              </div>
              <div className="p-2 bg-white/10 rounded-full"><DollarSign size={20} className={theme.accent} /></div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8 mt-4">
              <DonutChart percentage={budgetData.percentage} />
              <div className="flex flex-col gap-2 text-center md:text-left">
                <div><span className={`text-4xl font-bold ${theme.text} tracking-tight`}>${budgetData.executed}M</span><span className={`text-sm ${theme.textSecondary} ml-2`}>Ejecutado</span></div>
                <div className="h-px w-full bg-white/20"></div>
                <div><span className={`text-xl font-medium ${theme.text} opacity-80`}>${budgetData.total}M</span><span className={`text-xs ${theme.textSecondary} ml-2`}>Total Presupuestado</span></div>
              </div>
            </div>
            <div className="mt-4 bg-black/10 rounded-xl p-3 flex items-center gap-3">
              <TrendingUp size={16} className={theme.accent} />
              <p className={`text-xs ${theme.text} opacity-80`}>Estás un <span className={`${theme.accent} font-bold`}>12%</span> por debajo del límite.</p>
            </div>
          </div>
        )}

        {visibleWidgets.partners && (
          <div className={`md:col-span-1 md:row-span-3 ${theme.cardBg} backdrop-blur-md rounded-[24px] shadow-lg border border-white/10 p-6 flex flex-col relative overflow-hidden`}>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg font-medium flex items-center gap-2 ${theme.text}`}><Users size={18} className={theme.accent}/> Top Partners</h2>
              <button onClick={() => setCurrentView('users')} className={`p-1.5 rounded-lg hover:bg-white/10 ${theme.textSecondary} hover:text-white transition-colors`} title="Gestionar Contactos">
                <Settings size={16} />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
              {dashboardPartners.map((partner) => (
                <div key={partner.id} className="group relative bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                     <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${theme.accentBg}/20 ${theme.accent} flex items-center justify-center font-bold text-xs`}>{partner.company.charAt(0)}</div>
                        <div className="overflow-hidden">
                           <p className={`text-sm font-bold truncate ${theme.text}`}>{partner.company}</p>
                           <p className={`text-[10px] ${theme.textSecondary} truncate`}>{partner.name}</p>
                        </div>
                     </div>
                     {partner.isFavorite && <Star size={12} className={`${theme.accent} fill-current`} />}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setCurrentView('users')} className={`mt-auto w-full py-3 text-xs font-bold ${theme.accent} hover:text-white hover:bg-white/10 rounded-xl transition-colors uppercase tracking-widest`}>
              Ver Directorio Completo
            </button>
          </div>
        )}

        {visibleWidgets.campaigns && (
        <div className={`${!visibleWidgets.finance ? 'md:row-span-3' : 'md:row-span-1'} md:col-span-2 ${theme.cardBg} backdrop-blur-md rounded-[24px] shadow-lg border border-white/10 p-6 flex flex-col justify-between transition-all duration-500`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-medium ${theme.text}`}>Timeline de Campañas</h2>
            <div className="flex gap-2"><span className="w-2 h-2 rounded-full bg-green-400"></span><span className="w-2 h-2 rounded-full bg-blue-400"></span><span className="w-2 h-2 rounded-full bg-gray-400"></span></div>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
            {filteredCampaigns.length === 0 ? <div className={`text-center py-8 ${theme.textSecondary} italic`}>No hay campañas en este estado.</div> : filteredCampaigns.map((camp) => (
              <div key={camp.id} className="group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2" onClick={() => openModal(camp)}>
                <div className="flex justify-between text-xs mb-1"><span className={`font-semibold ${theme.text} group-hover:${theme.accent} transition-colors`}>{camp.name}</span><span className={theme.textSecondary}>{camp.brand}</span></div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-black/20 h-1.5 rounded-full overflow-hidden"><div className={`h-full ${camp.statusColor} opacity-80`} style={{ width: `${camp.progress}%` }}></div></div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/10 ${camp.statusColor} bg-opacity-20 ${theme.text} min-w-[70px] text-center`}>{camp.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {visibleWidgets.quickAccess && (
        <div onClick={handleNewActivation} className={`md:col-span-1 md:row-span-1 ${theme.cardBg} backdrop-blur-md rounded-[24px] shadow-lg border border-white/10 p-6 flex flex-col items-center justify-center text-center relative group cursor-pointer overflow-hidden transition-all hover:scale-[1.02]`}>
          <div className={`absolute inset-0 ${theme.accentBg}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          <div className={`w-14 h-14 rounded-2xl ${theme.accentBg} flex items-center justify-center text-black mb-3 shadow-lg shadow-orange-900/20 group-hover:rotate-90 transition-transform duration-500`}><Plus size={32} strokeWidth={2.5} /></div>
          <h3 className={`font-bold ${theme.text}`}>Nueva Activación</h3>
          <p className={`text-xs ${theme.textSecondary} mt-1`}>Validar con Tarifario 2026</p>
        </div>
        )}
      </div>
    </>
  );

  const CalendarView = () => (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div><h1 className={`text-3xl font-bold ${theme.text}`}>Calendario de Activaciones</h1><p className={`${theme.textSecondary} text-sm mt-1`}>Febrero 2026 • Visión Integrada</p></div>
        <div className={`${theme.cardBg} p-1 rounded-xl flex border border-white/10 shadow-lg`}>
          <CalendarFilterButton label="Todo" active={calendarFilter === 'all'} onClick={() => setCalendarFilter('all')} icon={Layers}/>
          <CalendarFilterButton label="Campañas" active={calendarFilter === 'campaigns'} onClick={() => setCalendarFilter('campaigns')} icon={Megaphone}/>
          <CalendarFilterButton label="Marketing" active={calendarFilter === 'marketing'} onClick={() => setCalendarFilter('marketing')} icon={Calendar}/>
        </div>
      </div>
      <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-6 flex-1 border border-white/10 overflow-hidden flex flex-col shadow-2xl`}>
        <div className={`grid grid-cols-7 gap-2 mb-2 text-center ${theme.textSecondary} text-xs uppercase tracking-wider font-bold`}><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div></div>
        <div className="grid grid-cols-7 grid-rows-5 gap-2 flex-1 h-full">
          {Array.from({ length: 6 }).map((_, i) => <div key={`empty-${i}`} className="bg-transparent"></div>)}
          {Array.from({ length: 28 }).map((_, i) => {
            const day = i + 1;
            const daysEvents = calendarEvents.filter(event => {
              if (calendarFilter === 'campaigns' && event.type !== 'campaign') return false;
              if (calendarFilter === 'marketing' && event.type !== 'marketing') return false;
              if (event.type === 'campaign') return day >= event.startDay && day <= event.endDay;
              return event.day === day;
            });
            const hasCampaign = daysEvents.some(e => e.type === 'campaign');
            return (
              <div key={day} className={`bg-black/20 rounded-xl p-1 relative border border-white/5 hover:bg-white/5 transition-colors flex flex-col gap-1 overflow-hidden group ${hasCampaign ? 'bg-black/30' : ''}`}>
                <span className={`text-xs font-bold ml-1 mt-1 ${day === 5 || day === 9 || day === 14 ? theme.accent : theme.textSecondary}`}>{day}</span>
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                  {daysEvents.map((event) => {
                    if (event.type === 'campaign') {
                      const isStart = event.startDay === day;
                      return (<div key={`${event.id}-${day}`} className={`h-5 ${event.color} rounded flex items-center px-1 mx-0.5 shadow-sm text-[8px] whitespace-nowrap overflow-hidden text-white font-medium`} title={event.title}>{(isStart || day === 1 || day === 8 || day === 15 || day === 22) && event.title}</div>);
                    } else {
                      return (<div key={event.id} className="flex items-center gap-1 mx-1 text-[9px] text-white/90 bg-white/10 rounded px-1 py-0.5 border border-white/5"><span>{event.icon}</span><span className="truncate">{event.title}</span></div>);
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const UsersView = () => (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${theme.text}`}>Directorio de Proveedores</h1>
          <p className={`${theme.textSecondary} text-sm mt-1`}>Gestión de contactos comerciales y trade marketing</p>
        </div>
        <div className="flex gap-3">
            <div className="relative group">
                <input type="text" placeholder="Buscar contacto..." className={`${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder} w-64 pl-10`} />
                <Search className={`absolute left-3 top-2.5 ${theme.textSecondary}`} size={16} />
            </div>
            <button onClick={() => setIsGroupModalOpen(true)} className={`${theme.accentBg} text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-orange-900/10`}>
                <FolderPlus size={18} /> Nueva Categoría
            </button>
            <button onClick={() => setIsContactModalOpen(true)} className={`bg-white/10 ${theme.text} px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-white/20 transition-colors border border-white/5`}>
                <UserPlus size={18} /> Nuevo Contacto
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-10">
        {providerGroups.map((group) => {
          const isExpanded = expandedGroups[group.id];
          return (
            <div key={group.id} className={`${theme.cardBg} border border-white/10 rounded-2xl overflow-hidden transition-all duration-300`}>
              <button onClick={() => toggleGroup(group.id)} onContextMenu={(e) => handleContextMenu(e, 'group', group.id)} className={`w-full flex items-center gap-4 p-4 ${theme.cardBg} hover:bg-white/5 transition-colors text-left`}>
                <div className="p-1 rounded-full bg-white/10 text-white/80">{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
                <h2 className={`text-lg font-bold ${theme.accent} tracking-tight flex-1`}>{group.title}</h2>
                <span className={`text-xs font-medium ${theme.textSecondary} bg-black/20 px-3 py-1 rounded-full`}>{group.contacts.length} Contactos</span>
              </button>
              {isExpanded && (
                <div className="p-4 bg-black/10 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.contacts.map((contact) => <ContactCard key={contact.id} contact={contact} groupId={group.id} onContextMenu={(e) => handleContextMenu(e, 'contact', contact.id, group.id)} theme={theme} />)}
                    <div onClick={() => { setContactForm(prev => ({ ...prev, groupId: group.id })); setIsContactModalOpen(true); }} className={`border border-dashed border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center ${theme.textSecondary} hover:${theme.accent} hover:${theme.accentBorder}/50 hover:bg-white/5 transition-all cursor-pointer min-h-[160px]`}>
                      <Plus size={24} />
                      <span className="text-xs font-medium mt-2">Agregar a {group.title.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const ReportsView = () => (
    <div className="h-full flex flex-col">
      <h1 className={`text-3xl font-bold ${theme.text} mb-6`}>Reportes & Documentos</h1>
      <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-8 border border-white/10 flex-1 flex flex-col items-center justify-center text-center`}>
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse"><FileText size={40} className={theme.accent} /></div>
        <h2 className={`text-xl font-bold ${theme.text}`}>Generador de Reportes</h2>
        <p className={`${theme.textSecondary} max-w-md mt-2 mb-8`}>Selecciona un rango de fechas para exportar el consolidado.</p>
        <button className={`${theme.accentBg} text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-orange-900/20 flex items-center gap-2`}><Download size={18} /> Descargar Reporte Q1 2026</button>
      </div>
    </div>
  );

  // --- VISTA: TARIFARIO (EDITABLE) ---
  const TarifarioView = () => {
    const categories = ['Todos', ...new Set(rateCardItems.map(i => i.category))];
    
    const filteredItems = rateCardItems.filter(item => {
      const matchesCategory = rateCardCategory === 'Todos' || item.category === rateCardCategory;
      const matchesSearch = item.item.toLowerCase().includes(rateCardSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    const getIconForCategory = (cat) => {
      if (cat.includes('Digital')) return <Smartphone size={24} />;
      if (cat.includes('Activaciones')) return <Mic size={24} />;
      if (cat.includes('Espacios')) return <Layout size={24} />;
      if (cat.includes('Señalética')) return <MapPin size={24} />;
      return <ShoppingBag size={24} />;
    };

    return (
      <div className="h-full flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${theme.text}`}>Tarifario 2026</h1>
            <p className={`${theme.textSecondary} text-sm mt-1`}>Catálogo de activos y espacios comerciales</p>
          </div>
          <div className="flex gap-3 items-center">
             <div className="relative">
                <input 
                    type="text" 
                    placeholder="Buscar activo..." 
                    value={rateCardSearch}
                    onChange={(e) => setRateCardSearch(e.target.value)}
                    className={`${theme.inputBg} border border-white/10 rounded-xl px-4 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder} w-64 pl-10`} 
                />
                <Search className={`absolute left-3 top-2.5 ${theme.textSecondary}`} size={16} />
             </div>
             {/* Botón Crear Nueva Tarifa */}
             <button onClick={() => openRateModal()} className={`${theme.accentBg} text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-orange-900/10`}>
                <Plus size={18} /> Crear Item
             </button>
          </div>
        </div>

        {/* Pestañas de Categoría */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setRateCardCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${rateCardCategory === cat ? `${theme.accentBg} text-black shadow-lg` : `bg-white/5 ${theme.textSecondary} hover:bg-white/10 hover:${theme.text}`}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de Tarjetas Visuales */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
          {filteredItems.length === 0 ? (
             <div className={`text-center py-20 ${theme.textSecondary}`}>
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p>No se encontraron resultados para tu búsqueda.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div 
                    key={item.id} 
                    onClick={() => openRateModal(item)} // Click para Editar
                    onContextMenu={(e) => handleContextMenu(e, 'rate-card', item.id)}
                    className={`${theme.cardBg} border border-white/10 hover:border-white/30 rounded-2xl p-5 flex flex-col transition-all group hover:-translate-y-1 hover:shadow-xl cursor-pointer relative`}
                >
                  {/* Tooltip de Notas (Hover) */}
                  {item.notes && (
                    <div className={`absolute top-14 left-1/2 -translate-x-1/2 w-48 p-3 rounded-lg ${theme.tooltipBg} border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs ${theme.textSecondary}`}>
                        <div className="flex items-center gap-1 mb-1 font-bold text-[#EEA83B]"><StickyNote size={10} /> Nota:</div>
                        {item.notes}
                    </div>
                  )}

                  {/* Encabezado con Icono */}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${theme.accent} group-hover:scale-110 transition-transform`}>
                      {getIconForCategory(item.category)}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded bg-black/20 ${theme.textSecondary}`}>
                      {item.unit}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="mb-4 flex-1">
                    <h3 className={`font-bold text-lg ${theme.text} leading-tight mb-1`}>{item.item}</h3>
                    <p className={`text-xs ${theme.textSecondary}`}>{item.specs}</p>
                  </div>

                  {/* Precio y Acción */}
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase font-bold">Inversión</span>
                      <span className={`text-lg font-bold ${theme.accent}`}>${item.price.toLocaleString()}</span>
                    </div>
                    {/* Indicador visual de nota existente */}
                    {item.notes && <div className="text-white/20"><StickyNote size={14} /></div>}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const SettingsView = () => (
    <div className="h-full flex flex-col">
      <h1 className={`text-3xl font-bold ${theme.text} mb-6`}>Configuración</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-8 border border-white/10`}>
          <div className="flex items-center gap-3 mb-6">
            <Palette className={theme.accent} size={24} />
            <h2 className={`text-xl font-bold ${theme.text}`}>Tema Visual</h2>
          </div>
          <p className={`${theme.textSecondary} mb-8`}>Selecciona la apariencia que mejor se adapte a tu estilo de trabajo.</p>
          <div className="space-y-4">
            {Object.keys(THEMES).map((key) => {
              const t = THEMES[key];
              const isActive = currentThemeKey === key;
              return (
                <button key={key} onClick={() => setCurrentThemeKey(key)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isActive ? `${theme.accentBorder} bg-white/10 ring-1 ring-${theme.accentBorder}` : 'border-white/10 hover:bg-white/5'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full shadow-lg border-2 border-white/20 overflow-hidden flex`}><div className={`w-1/2 h-full ${t.bg.replace('bg-', 'bg-')}`}></div><div className={`w-1/2 h-full ${t.cardBg.split(' ')[0]}`}></div></div>
                    <div className="text-left"><h3 className={`font-bold ${theme.text}`}>{t.name}</h3><p className="text-xs text-white/40 capitalize">{key === 'deep' ? 'Modo Oscuro' : key === 'lirio' ? 'Alto Contraste' : 'Original'}</p></div>
                  </div>
                  {isActive && <CheckCircle className={theme.accent} size={20} />}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-8 border border-white/10 opacity-60 pointer-events-none`}>
          <div className="flex items-center gap-3 mb-6"><Monitor className={theme.text} size={24} /><h2 className={`text-xl font-bold ${theme.text}`}>Preferencias de Sistema</h2></div>
          <p className={`${theme.textSecondary} mb-8`}>Configuraciones de notificaciones y cuenta.</p>
          <div className="p-4 rounded-xl bg-black/10 text-center text-sm text-white/30">Próximamente disponible</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans selection:${theme.accentBg} selection:text-black p-4 md:p-8 flex gap-6 overflow-hidden relative transition-colors duration-500`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
      `}</style>

      {/* A. BARRA DE NAVEGACIÓN */}
      <nav className={`hidden md:flex flex-col items-center justify-between py-8 w-20 h-[90vh] sticky top-8 ${theme.sidebarBg} backdrop-blur-xl border border-white/20 rounded-[30px] shadow-2xl z-40`}>
        <div className="space-y-8 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4 cursor-pointer hover:rotate-180 transition-transform duration-700" onClick={() => setCurrentView('home')}>
            <span className={`font-bold ${theme.accent}`}>360</span>
          </div>
          <NavIcon icon={Home} active={currentView === 'home'} onClick={() => setCurrentView('home')} tooltip="Inicio" theme={theme} />
          <NavIcon icon={Calendar} active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} tooltip="Calendario" theme={theme} />
          <NavIcon icon={Users} active={currentView === 'users'} onClick={() => setCurrentView('users')} tooltip="Proveedores" theme={theme} />
          <NavIcon icon={DollarSign} active={currentView === 'tarifario'} onClick={() => setCurrentView('tarifario')} tooltip="Tarifario" theme={theme} />
          <NavIcon icon={FileText} active={currentView === 'reports'} onClick={() => setCurrentView('reports')} tooltip="Reportes" theme={theme} />
        </div>
        
        <div className="flex flex-col items-center gap-6">
           <NavIcon icon={Settings} active={currentView === 'settings'} onClick={() => setCurrentView('settings')} tooltip="Configuración" theme={theme} />
           <div className={`w-10 h-10 rounded-full bg-gradient-to-tr from-${theme.accentBg.replace('bg-', '')} to-white border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform`} />
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto pr-2 pb-20 md:pb-0 h-[calc(100vh-64px)] custom-scrollbar">
        {currentView === 'home' && <DashboardView />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'users' && <UsersView />}
        {currentView === 'tarifario' && <TarifarioView />}
        {currentView === 'reports' && <ReportsView />}
        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* MENÚ CONTEXTUAL DINÁMICO */}
      {contextMenu.visible && (
        <div 
            ref={contextMenuRef}
            className={`fixed z-50 w-48 ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden animate-in fade-in zoom-in duration-100 origin-top-left`}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            {contextMenu.type === 'contact' ? (
              <>
                <button onClick={handleToggleFavorite} className={`w-full text-left px-4 py-2.5 text-xs font-medium ${theme.text} hover:${theme.accentBg} hover:text-black flex items-center gap-2 transition-colors`}>
                    <Star size={14} /> Agregar a Favoritos
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button onClick={handleDeleteContact} className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2 transition-colors">
                    <Trash2 size={14} /> Eliminar Contacto
                </button>
              </>
            ) : contextMenu.type === 'group' ? (
              <>
                <button onClick={() => moveGroup('up')} className={`w-full text-left px-4 py-2.5 text-xs font-medium ${theme.text} hover:${theme.accentBg} hover:text-black flex items-center gap-2 transition-colors`}>
                    <ArrowUp size={14} /> Mover Arriba
                </button>
                <button onClick={() => moveGroup('down')} className={`w-full text-left px-4 py-2.5 text-xs font-medium ${theme.text} hover:${theme.accentBg} hover:text-black flex items-center gap-2 transition-colors`}>
                    <ArrowDown size={14} /> Mover Abajo
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <button onClick={handleDeleteGroup} className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2 transition-colors">
                    <Trash2 size={14} /> Eliminar Categoría
                </button>
              </>
            ) : contextMenu.type === 'rate-card' ? (
              // Menú para Tarjetas de Tarifario
              <>
                <button onClick={() => { openRateModal(rateCardItems.find(i => i.id === contextMenu.itemId)); closeContextMenu(); }} className={`w-full text-left px-4 py-2.5 text-xs font-medium ${theme.text} hover:${theme.accentBg} hover:text-black flex items-center gap-2 transition-colors`}>
                    <Edit3 size={14} /> Editar
                </button>
                <div className="h-px bg-white/10 my-1"></div>
                <div className="px-4 py-1 text-[10px] text-white/40 uppercase font-bold">Mover a...</div>
                {['Espacios Preferenciales', 'Línea de Caja', 'Señalética', 'Digital', 'Activaciones'].map(cat => (
                   <button key={cat} onClick={() => handleMoveRateItem(contextMenu.itemId, cat)} className={`w-full text-left px-4 py-2 text-xs font-medium ${theme.text} hover:bg-white/10 flex items-center gap-2 transition-colors`}>
                      <MoveRight size={12} /> {cat}
                   </button>
                ))}
                <div className="h-px bg-white/10 my-1"></div>
                <button onClick={() => handleDeleteRateItem(contextMenu.itemId)} className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2 transition-colors">
                    <Trash2 size={14} /> Eliminar
                </button>
              </>
            ) : null}
        </div>
      )}

      {/* TOAST */}
      {showToast && (
        <div className={`fixed bottom-10 right-10 bg-white ${theme.cardBg.replace('bg-', 'text-')} px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50`}>
          <CheckCircle className="text-green-500" size={24} />
          <div><h4 className="font-bold text-sm text-gray-800">¡Acción Registrada!</h4><p className="text-xs text-gray-500">Operación completada con éxito.</p></div>
        </div>
      )}

      {/* MODALES DE CREACIÓN Y EDICIÓN */}
      
      {/* 1. Modal Contactos (Existente) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsContactModalOpen(false)}></div>
          <div className={`relative ${theme.cardBg.replace('/40', '')} bg-opacity-100 w-full max-w-md rounded-[24px] p-6 border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-200`}>
            <h3 className={`text-xl font-bold ${theme.text} mb-4`}>Nuevo Contacto</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Nombre</label><input type="text" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} /></div>
                <div><label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Rol</label><input type="text" value={contactForm.role} onChange={e => setContactForm({...contactForm, role: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Empresa</label><input type="text" value={contactForm.company} onChange={e => setContactForm({...contactForm, company: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} /></div>
                <div><label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Marca</label><input type="text" value={contactForm.brand} onChange={e => setContactForm({...contactForm, brand: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} /></div>
              </div>
              <div>
                <label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Categoría</label>
                <select value={contactForm.groupId} onChange={e => setContactForm({...contactForm, groupId: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`}>
                  <option value="" className="bg-gray-800">Seleccionar Categoría...</option>
                  {providerGroups.map(g => <option key={g.id} value={g.id} className="bg-gray-800">{g.title}</option>)}
                </select>
              </div>
               <div className="grid grid-cols-2 gap-3">
                <div><label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Email</label><input type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} /></div>
                <div><label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Teléfono</label><input type="tel" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} /></div>
              </div>
              <button onClick={handleCreateContact} className={`w-full ${theme.accentBg} text-black font-bold py-3 rounded-xl hover:opacity-90 transition-colors mt-2`}>Guardar Contacto</button>
            </div>
            <button onClick={() => setIsContactModalOpen(false)} className={`absolute top-4 right-4 ${theme.textSecondary} hover:${theme.text}`}><X size={20}/></button>
          </div>
        </div>
      )}

      {/* 2. Modal Grupos (Existente) */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsGroupModalOpen(false)}></div>
          <div className={`relative ${theme.cardBg.replace('/40', '')} bg-opacity-100 w-full max-w-sm rounded-[24px] p-6 border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-200`}>
            <h3 className={`text-xl font-bold ${theme.text} mb-4`}>Nueva Categoría</h3>
            <div className="space-y-4">
              <div><label className={`text-xs ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Nombre del Grupo</label><input type="text" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 ${theme.text} focus:outline-none focus:${theme.accentBorder}`} /></div>
              <button onClick={handleCreateGroup} className={`w-full ${theme.accentBg} text-black font-bold py-3 rounded-xl hover:opacity-90 transition-colors`}>Crear Categoría</button>
            </div>
            <button onClick={() => setIsGroupModalOpen(false)} className={`absolute top-4 right-4 ${theme.textSecondary} hover:${theme.text}`}><X size={20}/></button>
          </div>
        </div>
      )}

      {/* 3. NUEVO MODAL: EDICIÓN DE TARIFAS */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRateModalOpen(false)}></div>
          <div className={`relative ${theme.cardBg.replace('/40', '')} bg-opacity-100 w-full max-w-lg rounded-[24px] p-6 border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-200`}>
            <h3 className={`text-xl font-bold ${theme.text} mb-4`}>{rateForm.id ? 'Editar Item' : 'Nuevo Item Tarifario'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Nombre del Activo</label>
                    <input type="text" value={rateForm.item} onChange={e => setRateForm({...rateForm, item: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} placeholder="Ej. Puntera" />
                 </div>
                 <div>
                    <label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Categoría</label>
                    <select value={rateForm.category} onChange={e => setRateForm({...rateForm, category: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`}>
                        {['Espacios Preferenciales', 'Línea de Caja', 'Señalética', 'Digital', 'Activaciones'].map(cat => <option key={cat} value={cat} className="bg-gray-800">{cat}</option>)}
                    </select>
                 </div>
              </div>
              
              <div>
                 <label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Especificaciones</label>
                 <input type="text" value={rateForm.specs} onChange={e => setRateForm({...rateForm, specs: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} placeholder="Medidas, ubicación, etc." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Precio (ARS)</label>
                    <input type="number" value={rateForm.price} onChange={e => setRateForm({...rateForm, price: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} placeholder="0.00" />
                 </div>
                 <div>
                    <label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block`}>Unidad / Periodo</label>
                    <input type="text" value={rateForm.unit} onChange={e => setRateForm({...rateForm, unit: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} placeholder="Mensual, Por Unidad..." />
                 </div>
              </div>

              <div>
                 <label className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-wider mb-1 block flex items-center gap-1`}><StickyNote size={10} /> Notas Internas</label>
                 <textarea rows="3" value={rateForm.notes} onChange={e => setRateForm({...rateForm, notes: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-3 py-2 text-sm ${theme.text} focus:outline-none focus:${theme.accentBorder}`} placeholder="Añade observaciones, restricciones o detalles importantes..." />
              </div>

              <button onClick={handleSaveRateItem} className={`w-full ${theme.accentBg} text-black font-bold py-3 rounded-xl hover:opacity-90 transition-colors mt-2`}>
                {rateForm.id ? 'Guardar Cambios' : 'Crear Item'}
              </button>
            </div>
            <button onClick={() => setIsRateModalOpen(false)} className={`absolute top-4 right-4 ${theme.textSecondary} hover:${theme.text}`}><X size={20}/></button>
          </div>
        </div>
      )}

      {/* MODAL DETALLE CAMPAÑA */}
      {isModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className={`relative ${theme.cardBg.replace('/40', '')} bg-opacity-100 w-full max-w-lg rounded-[32px] p-8 border border-white/20`}>
                <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>{selectedCampaign.name}</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <DetailItem icon={Package} label="Marca" value={selectedCampaign.brand} />
                    <DetailItem icon={Calendar} label="Fechas" value={selectedCampaign.date} />
                </div>
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 bg-white/10 p-2 rounded-full"><X size={16}/></button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;