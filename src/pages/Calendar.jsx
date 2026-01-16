
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, Filter, Megaphone, ShoppingBag, CalendarCheck, Users, Clock } from 'lucide-react';
import DayDetailModal from '../components/calendar/DayDetailModal';
import { useColorTheme } from '../context/ColorThemeContext';

const Calendar = () => {
  const { theme } = useTheme();
  const { calendarEvents, campaigns } = useData();
  const { getCategoryClasses, getCategoryStyle } = useColorTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filter States
  const [filters, setFilters] = useState({
      campaigns: true,
      marketing: true,
      deadlines: true,
      meetings: true,
      reminders: true
  });
  
  // Selected Date for Modal
  const [selectedDay, setSelectedDay] = useState(null);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday
  const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Helper to parse date string from Campaign format (e.g. "08 Ene - 11 Ene" or ISO)
  // For this MVP, we will try to parse ranges if valid, otherwise fallback to specific dates or "En Curso".
  // Since our mock data uses "08 Ene - 11 Ene", let's map that to current year/month for demo purposes if needed,
  // OR rely on the fact that new campaigns save ISO strings.
  // We'll prioritize ISO date handling for "real" campaigns.
  
  const getEventsForDay = (day) => {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      // FIX: Use local date generation avoiding UTC shift
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(targetDate.getDate()).padStart(2, '0');
      const targetDateStr = `${year}-${month}-${dayStr}`;

      // 1. Static Events
      const staticMatches = calendarEvents.filter(e => {
          if (!e.type) return false; // Safety check
          
          // Debug/Safety: Ensure types match filter keys (singular/plural conversion if needed)
          // Filters are: campaigns, marketing, deadlines, meetings
          // Event types are: campaign, marketing, deadline, meeting
          const typeMap = {
              'campaign': 'campaigns',
              'marketing': 'marketing',
              'deadline': 'deadlines',
              'meeting': 'meetings',
              'reminder': 'reminders'
          };
          
          const filterKey = typeMap[e.type];
          if (filterKey && !filters[filterKey]) return false;

          // Date Check - Robust Comparison
          // Ensure e.date exists and is string
          if (e.date && typeof e.date === 'string') {
               return e.date.trim() === targetDateStr;
          }
          
          // Legacy Range Check
          if (e.startDay && e.endDay) {
              return day >= e.startDay && day <= e.endDay;
          }
          return false; 
      });

      // 2. Real Campaigns (Mapped to Events)
      let campaignMatches = [];
      if (filters.campaigns) {
        campaignMatches = campaigns.map(c => {
             // Try to find status or date range
             // For simplicity in this "Live" connection without complex date parsing of "08 Ene",
             // We will assume campaigns created via UI might have standard dates or we use a simplified check.
             // If c.date is a string range "08 Ene - 11 Ene", we simulate it in current month for demo?
             // OR better: We rely on the fact the user just asked about "Vuelta al Cole" which has "Feb 2026".
             
             // VISUALIZATION LOGIC:
             // If we can't parse exact date, we won't show it to avoid bad UX.
             // But for the "test" case, let's look for "En Curso" and assume it covers TODAY if no specific date.
             // Ideally, campaigns need StartDate and EndDate fields. 
             // Let's assume for now we list them if they match a simple parsed guess or if they are active.
             
             // REFINEMENT: New campaigns should probably have start/end dates. 
             // Existing mock data is loose. Let's try to match:
             
             return {
                 title: c.name,
                 type: 'campaign',
                 brand: c.brand,
                 status: c.status,
                 original: c
             };
        }).filter(c => {
            // Display Logic:
            // If status is 'En Curso', show it every day? No, too clutter.
            // Let's rely on string matching or ISO.
            // If the user adds a NEW campaign, they might not set dates.
            // Let's check `c.original.date`. 
            
            // Hack for MVP Visualization of mixed data:
            // If date string contains the day number (e.g. "08"), show it.
            // If date is "Feb 2026" and current view is Feb 2026, show it on day 1 or across month?
            // Let's showing it on Day 1 for "Month" granular dates.
            
            const cDate = c.original.date || '';
            const currentMonthName = currentDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''); // ene, feb
            const currentMonthFull = currentDate.toLocaleDateString('es-ES', { month: 'long' }); // enero
            
            // Check for ISO match (YYYY-MM-DD)
            if (cDate.includes(targetDateStr)) return true;

            // Check for "Month Year" match (e.g. "Feb 2026")
            if (cDate.toLowerCase().includes(currentMonthName) || cDate.toLowerCase().includes(currentMonthFull)) {
                 // Show on representative days (e.g. start of month or if range)
                 // If "08 Ene", show on 8th.
                 if (cDate.includes(day.toString().padStart(2, '0')) || cDate.includes(` ${day} `)) return true;
                 
                 // If just "Feb 2026", show on day 1 to 5 to indicate "Month Long"
                 if (!cDate.match(/\d/g)?.length && day <= 5) return true; // Loose check if no specific day digits found
            }

            return false;
        });
      }

      return [...staticMatches, ...campaignMatches];
  };

  const onDayClick = (day) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDay(date);
  };

  // Render Grid
  const renderCalendarGrid = () => {
    const cells = [];
    const today = new Date();

    // Previous Month Fill
    for (let i = 0; i < firstDayOfMonth; i++) {
        cells.push(
            <div key={`prev-${i}`} className={`h-full min-h-[100px] border border-white/5 bg-white/5 opacity-10 rounded-2xl flex flex-col p-2 grayscale`}>
                <span className="text-sm font-bold opacity-50">{prevMonthDays - firstDayOfMonth + 1 + i}</span>
            </div>
        );
    }

    // Current Month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
        const events = getEventsForDay(day);

        cells.push(
            <div 
                key={day} 
                onClick={() => onDayClick(day)}
                className={`h-full min-h-[100px] border border-white/10 rounded-2xl flex flex-col p-2 relative group transition-all hover:scale-[1.02] hover:bg-white/5 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl ${isToday ? 'bg-white/5 border-white/30' : ''}`}
            >
                {/* Number */}
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 transition-colors ${isToday ? `${theme.accentBg} text-black shadow-lg shadow-orange-500/50` : 'text-white/70 group-hover:text-white group-hover:bg-white/10'}`}>
                    {day}
                </span>

                {/* Events Preview */}
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 relative z-10 hidden md:block">
                    {events.map((evt, idx) => {
                        // Dynamic Color Coding from Context
                        const styleClass = getCategoryClasses(evt.type, 'badge') || 'bg-white/10 text-white/50 border-white/10';
                        
                        return (
                            <div key={idx} className={`text-[9px] px-1.5 py-0.5 rounded truncate border shadow-sm ${styleClass}`}>
                                {evt.title}
                            </div>
                        );
                    })}
                </div>
                {/* Mobile Dot Indicators */}
                <div className="md:hidden flex gap-1 justify-center mt-1">
                     {events.map((evt, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getCategoryStyle(evt.type).bg}`}></div>
                     ))}
                </div>
                
                {/* Hover Effect: Add Button hint */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"><Plus size={14}/></div>
                </div>
            </div>
        );
    }
    return cells;
  };

  return (
    <div className="h-full flex gap-6 pb-4">
      
      {/* Sidebar Filter */}
      <div className={`w-64 flex-shrink-0 ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col`}>
          <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Calendario</h2>
              <p className="text-xs text-white/50">Filtros & Vistas</p>
          </div>

          <div className="space-y-2 mb-8">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Mostrar</label>
              
              {/* Campaigns Filter */}
              <button 
                onClick={() => setFilters({...filters, campaigns: !filters.campaigns})}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filters.campaigns ? 'bg-purple-500/20 border-purple-500/50 text-white' : 'bg-transparent border-white/10 text-white/50'}`}
              >
                  <div className="flex items-center gap-3">
                      <Megaphone size={16} className={filters.campaigns ? 'text-purple-400' : 'text-current'} />
                      <span className="text-sm font-medium">Campañas</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.campaigns ? 'bg-purple-500 border-purple-500' : 'border-white/20'}`}>
                      {filters.campaigns && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
              </button>

              {/* Marketing Filter */}
              <button 
                onClick={() => setFilters({...filters, marketing: !filters.marketing})}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filters.marketing ? 'bg-blue-500/20 border-blue-500/50 text-white' : 'bg-transparent border-white/10 text-white/50'}`}
              >
                  <div className="flex items-center gap-3">
                      <ShoppingBag size={16} className={filters.marketing ? 'text-blue-400' : 'text-current'} />
                      <span className="text-sm font-medium">Marketing</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.marketing ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                      {filters.marketing && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
              </button>

              {/* Deadlines Filter (Unified) */}
              <button 
                onClick={() => setFilters({...filters, deadlines: !filters.deadlines})}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filters.deadlines ? 'bg-yellow-500/20 border-yellow-500/50 text-white' : 'bg-transparent border-white/10 text-white/50'}`}
              >
                  <div className="flex items-center gap-3">
                      <CalendarCheck size={16} className={filters.deadlines ? 'text-yellow-400' : 'text-current'} />
                      <span className="text-sm font-medium">Deadlines</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.deadlines ? 'bg-yellow-500 border-yellow-500' : 'border-white/20'}`}>
                      {filters.deadlines && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
              </button>

              {/* Meetings Filter (New) */}
               <button 
                onClick={() => setFilters({...filters, meetings: !filters.meetings || false})} // Handle potential undefined init
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filters.meetings ? 'bg-green-500/20 border-green-500/50 text-white' : 'bg-transparent border-white/10 text-white/50'}`}
              >
                  <div className="flex items-center gap-3">
                      <Users size={16} className={filters.meetings ? 'text-green-400' : 'text-current'} />
                      <span className="text-sm font-medium">Reuniones</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.meetings ? 'bg-green-500 border-green-500' : 'border-white/20'}`}>
                      {filters.meetings && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
              </button>

              {/* Reminders Filter (New) */}
               <button 
                onClick={() => setFilters({...filters, reminders: !filters.reminders})}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filters.reminders ? 'bg-orange-500/20 border-orange-500/50 text-white' : 'bg-transparent border-white/10 text-white/50'}`}
              >
                  <div className="flex items-center gap-3">
                      <Clock size={16} className={filters.reminders ? 'text-orange-400' : 'text-current'} />
                      <span className="text-sm font-medium">Recordatorios</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.reminders ? 'bg-orange-500 border-orange-500' : 'border-white/20'}`}>
                      {filters.reminders && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
              </button>
          </div>

          <div className="mt-auto">
             <div className="bg-gradient-to-br from-white/5 to-transparent p-4 rounded-xl border border-white/5">
                <p className="text-xs text-white/60 mb-2">Evento Rápido</p>
                <button 
                    onClick={() => setSelectedDay(new Date())}
                    className={`w-full py-2 rounded-lg ${theme.accentBg} text-black font-bold text-xs shadow-lg hover:brightness-110 transition-all`}
                >
                    + Nuevo Evento
                </button>
             </div>
          </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Header - Professional Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-2">
            
            {/* Left: Date Navigation */}
            <div className="flex items-center gap-3 bg-black/20 p-1.5 rounded-xl border border-white/10 shadow-inner">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                    <ChevronLeft size={20}/>
                </button>
                
                <div className="flex items-center gap-2 px-2">
                    {/* Month Select */}
                    <div className="relative">
                        <select 
                            value={currentDate.getMonth()} 
                            onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1))}
                            className="appearance-none bg-transparent text-lg font-bold text-white cursor-pointer focus:outline-none capitalize pr-4"
                        >
                            {Array.from({length: 12}).map((_, i) => (
                                <option key={i} value={i} className="bg-slate-900 text-white">
                                    {new Date(2024, i, 1).toLocaleDateString('es-ES', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Year Select */}
                    <div className="relative">
                         <select 
                            value={currentDate.getFullYear()} 
                            onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1))}
                            className="appearance-none bg-transparent text-lg font-bold text-white/70 cursor-pointer focus:outline-none"
                        >
                            {[2025, 2026, 2027, 2028].map(year => (
                                <option key={year} value={year} className="bg-slate-900 text-white">{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                    <ChevronRight size={20}/>
                </button>

                <div className="w-px h-6 bg-white/10 mx-1"></div>
                
                <button onClick={handleToday} className="px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 rounded-lg transition-colors border border-white/5 uppercase tracking-wider">
                    Hoy
                </button>
            </div>

            {/* Center/Right: View Modes & Stats */}
            <div className="flex items-center gap-3">
                 {/* Debug / Stat Counter */}
                 <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Eventos Activos</span>
                    <span className="text-xs font-bold text-white">{calendarEvents.length}</span>
                 </div>

                 <div className="flex p-1 bg-black/20 rounded-lg border border-white/10">
                    <button className="px-3 py-1.5 text-xs font-medium text-black bg-white rounded shadow-sm">Mes</button>
                    <button className="px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white transition-colors">Semana</button>
                    <button className="px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white transition-colors">Lista</button>
                 </div>
            </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2 px-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-bold uppercase tracking-widest text-white/30 py-2">
                    {day}
                </div>
            ))}
        </div>

        {/* Calendar Grid */}
        <div className={`flex-1 grid grid-cols-7 grid-rows-5 gap-2 p-2 rounded-3xl overflow-hidden border border-white/10 ${theme.cardBg} backdrop-blur-xl shadow-2xl`}>
            {renderCalendarGrid()}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDay && (
          <DayDetailModal 
            isOpen={!!selectedDay} 
            onClose={() => setSelectedDay(null)} 
            date={selectedDay}
          />
      )}
    </div>
  );
};

export default Calendar;
