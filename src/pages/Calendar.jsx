
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Calculator, Calendar as CalIcon, Plus, Megaphone, ShoppingBag, CalendarCheck, Users, Clock } from 'lucide-react';
import DayDetailModal from '../components/calendar/DayDetailModal';
import { useColorTheme } from '../context/ColorThemeContext';

const Calendar = () => {
  const { theme } = useTheme();
  const { calendarEvents } = useData();
  const { getCategoryClasses, getCategoryStyle } = useColorTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'list'
  
  
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

  // FIX: Sync Modal Data with Global State (Fixes "Refresh required" bug)
  React.useEffect(() => {
      // Use functional update to access 'prev' (current selectedDay) without adding it to dependencies
      setSelectedDay(prev => {
          if (!prev) return null; // If modal closed, do nothing
          
          // Re-fetch events for the currently selected date
          // 'getEventsForDay' is now stable via useCallback or simply accessible in closure 
          // (but we added it to deps implicitly if we use it here... 
          // wait, getEventsForDay changes often. 
          // We only want to update if EVENTS changed really.
          // But getEventsForDay encapsulates that logic.)
          
          const updatedEvents = getEventsForDay(prev.date);
          return { ...prev, events: updatedEvents };
      });
  }, [getEventsForDay]); // Only run when getEventsForDay changes (which depends on calendarEvents/filters)

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday
  const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());
  
  const getEventsForDay = React.useCallback((dayOrDate) => {
      let targetDate;
      const isDateObject = dayOrDate instanceof Date;

      if (isDateObject) {
          targetDate = dayOrDate;
      } else {
          targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOrDate);
      }

      // FIX: Use local date generation avoiding UTC shift
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(targetDate.getDate()).padStart(2, '0');
      const targetDateStr = `${year}-${month}-${dayStr}`;

      // 1. Static Events
      const staticMatches = calendarEvents.filter(e => {
          if (!e.type) return false; // Safety check
          
          const typeMap = {
              'campaign': 'campaigns',
              'marketing': 'marketing',
              'holiday': 'marketing',
              'deadline': 'deadlines',
              'meeting': 'meetings',
              'reminder': 'reminders'
          };
          
          const filterKey = typeMap[e.type];
          if (filterKey && !filters[filterKey]) return false;

          // Date Check - Robust Comparison
          if (e.date && typeof e.date === 'string') {
               return e.date.trim() === targetDateStr;
          }
          
          // Legacy Range Check
          if (e.startDay && e.endDay) {
               // Extract day number whether input is Date or Number
               const dayToCheck = isDateObject ? targetDate.getDate() : dayOrDate;
               return dayToCheck >= e.startDay && dayToCheck <= e.endDay; 
          }
          return false; 
      });

      // 2. Remove Duplicates (Clean Frontend)
      const uniqueEvents = [];
      const seen = new Set();
      
      staticMatches.forEach(e => {
          // Create a unique key based on visible content
          // If multiple events share Title/Type on this day, show only one.
          const key = `${e.title}|${e.type}`;
          if (!seen.has(key)) {
              seen.add(key);
              uniqueEvents.push(e);
          }
      });

      return uniqueEvents;
  }, [calendarEvents, currentDate, filters]);

  const onDayClick = (day) => {
      // If we pass a number (month view), we construct date. If date (week view), use as is.
      const date = typeof day === 'number' 
        ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) 
        : day; 
      
      const events = getEventsForDay(typeof day === 'number' ? day : date);
      setSelectedDay({ date, events });
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
                            <div key={idx} className={`text-[9px] px-1.5 py-0.5 rounded truncate ${styleClass}`}>
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

  const renderWeekGrid = () => {
    // 1. Find Sunday of current week
    const dayOfWeek = currentDate.getDay();
    const sunday = new Date(currentDate);
    sunday.setDate(currentDate.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(sunday);
        day.setDate(sunday.getDate() + i);
        weekDays.push(day);
    }

    return (
        <div className="grid grid-cols-7 gap-2 h-full">
            {weekDays.map((date, i) => {
                const events = getEventsForDay(date); // Now passing full Date object
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                 <div 
                    key={i} 
                    onClick={() => onDayClick(date)}
                    className={`h-full border border-white/10 rounded-2xl p-2 flex flex-col relative group cursor-pointer hover:bg-white/5 transition-all ${isToday ? 'bg-white/5 border-white/30' : ''}`}
                 >
                    <div className="text-center mb-2">
                         <div className="text-[10px] uppercase text-white/50">{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][date.getDay()]}</div>
                         <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-white/70'}`}>{date.getDate()}</div>
                    </div>
                    <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
                        {events.map((evt, idx) => (
                             <div key={idx} className={`text-[10px] px-2 py-1.5 rounded truncate ${getCategoryClasses(evt.type, 'badge')}`}>
                                {evt.title}
                             </div>
                        ))}
                    </div>
                 </div>
                )
            })}
        </div>
    );
  };

  const renderListView = () => {
    // List View: Flat list of all events in the month
    const allEvents = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const evts = getEventsForDay(d);
        if (evts.length > 0) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            allEvents.push({ date, events: evts });
        }
    }

    return (
        <div className="flex-col gap-2 h-full overflow-y-auto custom-scrollbar p-2">
            {allEvents.length === 0 ? (
                <div className="text-center text-white/30 mt-10">No hay eventos este mes</div>
            ) : (
                allEvents.map((item, idx) => (
                    <div key={idx} className="mb-4">
                        <div className="sticky top-0 bg-[#121212] z-10 py-1 mb-2 border-b border-white/10 flex items-baseline gap-2">
                             <span className="text-xl font-bold text-white">{item.date.getDate()}</span>
                             <span className="text-xs uppercase text-white/50">{item.date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long' })}</span>
                             <button onClick={() => onDayClick(item.date)} className="ml-auto text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
                                Ver Detalles
                             </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {item.events.map((evt, eIdx) => (
                                <div onClick={() => onDayClick(item.date)} key={eIdx} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer hover:brightness-110 transition-all ${getCategoryClasses(evt.type, 'badge')}`}>
                                    <span className="font-bold text-sm">{evt.title}</span>
                                    <span className="text-[10px] opacity-70 uppercase tracking-widest">{evt.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
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
                      <span className="text-sm font-medium">Proyectos</span>
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
                    onClick={() => setSelectedDay({ date: new Date(), events: getEventsForDay(new Date()) })}
                    className={`w-full py-2 rounded-lg ${theme.accentBg} text-black font-bold text-xs shadow-lg hover:brightness-110 transition-all`}
                >
                    + Nuevo Evento
                </button>
             </div>
          </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Header - Professional Navigation (REFACTORED) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-2">
            
            {/* Left: Date Navigation */}
            <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/10 shadow-inner">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors">
                    <ChevronLeft size={24}/>
                </button>
                
                <div className="flex flex-col items-center min-w-[150px]">
                    <span className="text-xl font-bold text-white capitalize">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long' })}
                    </span>
                    <span className="text-xs text-white/50 font-mono tracking-widest">
                        {currentDate.getFullYear()}
                    </span>
                </div>

                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors">
                    <ChevronRight size={24}/>
                </button>

                <div className="w-px h-8 bg-white/10 mx-2"></div>
                
                <button onClick={handleToday} className="px-4 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors border border-white/5 uppercase tracking-wider">
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
                    <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'month' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}>Mes</button>
                    <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'week' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}>Semana</button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}>Lista</button>
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
        <div className={`flex-1 ${viewMode === 'list' ? 'block' : 'grid'} ${viewMode === 'month' ? 'grid-cols-7 grid-rows-5' : 'grid-cols-1'} gap-2 p-2 rounded-3xl overflow-hidden border border-white/10 ${theme.cardBg} backdrop-blur-xl shadow-2xl`}>
            {viewMode === 'month' && renderCalendarGrid()}
            {viewMode === 'week' && renderWeekGrid()}
            {viewMode === 'list' && renderListView()}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDay && (
          <DayDetailModal 
            isOpen={!!selectedDay} 
            onClose={() => setSelectedDay(null)} 
            date={selectedDay.date}
            events={selectedDay.events}
            onUpdate={() => { /* Trigger refetch or re-render if needed, though state is global */ }}
          />
      )}
    </div>
  );
};

export default Calendar;
