
import extractedData from './extractedData.json';
import marketingEvents from './marketingEvents.json';

// --- DEFINICIÓN DE TEMAS VISUALES ---
export const THEMES = {
// ... themes logic starts later
// (Wait, replace_file_content replaces specific lines. I need to be careful with imports which are at the top)

  tilo: {
    name: 'Tilo', // Dark Botanical / Forest
    bg: 'bg-[#0f291e]', // Verde Selva Profundo
    cardBg: 'bg-[#18392b]/50', // Eucalipto Oscuro Vidriado
    cardHover: 'hover:bg-[#18392b]/70',
    text: 'text-[#eecfad]', // Arena Suave (contraste cálido)
    textSecondary: 'text-[#85a894]', // Salvia Apagado
    accent: 'text-[#4ade80]', // Verde Neón (Toque tecnológico)
    accentBg: 'bg-[#4ade80]',
    accentBorder: 'border-[#4ade80]',
    sidebarBg: 'bg-[#0a1f16]/90',
    inputBg: 'bg-[#05110c]/50',
    tooltipBg: 'bg-[#05110c]/95'
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
    name: 'Lirio', // Midnight Wine / Drama
    bg: 'bg-[#1a0508]', // Negro Cereza (Casi negro)
    cardBg: 'bg-[#450a12]/40', // Rubí Sangre Vidriado
    cardHover: 'hover:bg-[#450a12]/60',
    text: 'text-[#fff1f2]', // Rosa Hielo
    textSecondary: 'text-[#fda4af]/70', // Rosa Viejo
    accent: 'text-[#fbbf24]', // Ámbar Quemado (Dorado)
    accentBg: 'bg-[#fbbf24]',
    accentBorder: 'border-[#fbbf24]',
    sidebarBg: 'bg-[#2b080c]/90',
    inputBg: 'bg-[#150204]/60',
    tooltipBg: 'bg-[#150204]/95'
  }
};

// --- DATOS MOCK DASHBOARD ---
export const BUDGET_DATA = { executed: 13.5, total: 18.5, percentage: (13.5 / 18.5) * 100 };

export const CAMPAIGNS_DATA = [
  { id: 1, name: 'Campaña Mar del Plata', brand: 'Cif', status: 'En Curso', statusColor: 'bg-green-400', progress: 65, date: '08 Ene - 11 Ene', dept: 'Limpieza', cost: '$4,500,000' },
  { id: 2, name: 'Vuelta al Cole', brand: 'Nesquik', status: 'Planificación', statusColor: 'bg-blue-400', progress: 25, date: 'Feb 2026', dept: 'Alimentos', cost: '$2,100,000' },
  { id: 3, name: 'Mes de la Limpieza', brand: 'Unilever', status: 'Pendiente', statusColor: 'bg-gray-400', progress: 0, date: 'Mar 2026', dept: 'Limpieza', cost: '$3,800,000' },
  { id: 4, name: 'Lanzamiento Dove', brand: 'Dove', status: 'En Curso', statusColor: 'bg-green-400', progress: 40, date: '15 Ene - 30 Ene', dept: 'Cuidado Personal', cost: '$1,200,000' },
];

export const CALENDAR_EVENTS_DATA = [
  ...marketingEvents,
  { id: 'c1', title: 'Vuelta al Cole (Campaña)', type: 'campaign', startDay: 1, endDay: 28, color: 'bg-blue-500/80', textColor: 'text-white' }, 
  { id: 'c2', title: 'Mes de la Limpieza (Campaña)', type: 'campaign', startDay: 2, endDay: 28, color: 'bg-green-500/80', textColor: 'text-white' }, 
  { id: 'c3', title: 'Temporada Verano (Campaña)', type: 'campaign', startDay: 1, endDay: 15, color: 'bg-yellow-500/80', textColor: 'text-black' }
];

// --- DATOS REALES DE PROVEEDORES ---
// --- DATOS REALES DE PROVEEDORES ---
export const PROVIDER_GROUPS_DATA = extractedData.PROVIDER_GROUPS_DATA;

// --- DATOS TARIFARIO ---
// --- DATOS TARIFARIO ---
export const RATE_CARD_DATA = extractedData.RATE_CARD_DATA;
