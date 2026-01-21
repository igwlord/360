
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronLeft, ChevronRight, Calculator, Calendar as CalIcon, Plus, Megaphone, ShoppingBag, CalendarCheck, Users, Clock, Star, Search, X, ArrowUpRight } from 'lucide-react';
import DayDetailModal from '../components/calendar/DayDetailModal';
import { useColorTheme } from '../context/ColorThemeContext';

import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { useCampaigns } from '../hooks/useCampaigns';

import { useLocation } from 'react-router-dom';

const Calendar = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const { data: calendarEvents = [] } = useCalendarEvents();
  const { data: projects = [] } = useCampaigns();
  
  const { getCategoryClasses, getCategoryStyle } = useColorTheme();
  
  const [currentDate, setCurrentDate] = useState(() => {
     return location.state?.focusDate ? new Date(location.state.focusDate) : new Date();
  });
  
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'list'

  React.useEffect(() => {
     if (location.state?.focusDate) {
         setCurrentDate(new Date(location.state.focusDate));
     }
  }, [location.state]);
  
  
  // Filter States
  const [filters, setFilters] = useState({
      campaigns: true,
      specials: true, // NEW
      marketing: true,
      deadlines: true,
      meetings: true,
      reminders: true
  });
  
  // Selected Date for Modal
  const [selectedDay, setSelectedDay] = useState(null);



    const [searchQuery, setSearchQuery] = useState('');
    
    // Derived State: Search Results
    const searchResults = React.useMemo(() => {
        if (!searchQuery.trim()) return [];
        
        // Flatten all possible events for searching
        // We'll scan a reasonable range (e.g., current year +/- 1) OR just rely on what we have loaded if they are all loaded.
        // Assuming 'calendarEvents' and 'projects' are ALL available data (not paginated by month in backend yet, which seems to be the case based on hooks).
        
        const term = searchQuery.toLowerCase();
        
        const all = [
             ...projects.map(p => ({
                id: p.id,
                title: p.name,
                type: p.type,
                date: new Date(p.date || p.start_date), // Ensure Date object
                _source: 'project'
             })),
             ...calendarEvents.map(e => ({
                id: e.id,
                title: e.title,
                type: e.type,
                date: new Date(e.date),
                _source: 'calendar'
             }))
        ];

        return all.filter(item => 
            (item.title && item.title.toLowerCase().includes(term)) ||
            (item.type && item.type.toLowerCase().includes(term))
        ).sort((a,b) => a.date - b.date);

    }, [calendarEvents, projects, searchQuery]);


  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday
  const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  // NEW: Year Navigation
  const handlePrevYear = () => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  const handleNextYear = () => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  
  const handleToday = () => {
      setCurrentDate(new Date());
      setSearchQuery(''); // Clear search on reset
  };
  
    // Helper: Safe Date Parsing (Noon Strategy to avoid Timezone shifts)
    const parseDate = (d) => {
        if (!d) return null;
        
        let dateObj = d;
        // Handle String inputs (ISO, YYYY-MM-DD, etc)
        if (typeof d === 'string') {
            // Extract YYYY-MM-DD part safely
            const ymd = d.substring(0, 10);
            // Verify structure roughly
            if (ymd.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Force Noon Local Time
                // Note: new Date("YYYY-MM-DDT12:00:00") creates local date at noon
                return new Date(`${ymd}T12:00:00`);
            }
            // Fallback for other strings
            dateObj = new Date(d);
        }
        
        // If it's a Date object (or became one), ensure it's not shifted by hours
        // actually, if we trust the string parsing above, we are good for strings.
        // For Objects, we can't easily "move" to noon without knowing if it was UTC or Local.
        // But usually data comes as string YYYY-MM-DD.
        
        if (dateObj instanceof Date && !isNaN(dateObj)) {
            // Force it to be treated as "That Day" by verifying hours? 
            // Better: just assume if it's parsed, we rely on getDate().
            return dateObj;
        }
        return null;
    };

    // Helper: Merge and Filter Events
    const getEventsForDay = (day) => {
        // Construct target date (Local Noon)
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0);
        
        // Merge Projects & Events
        const allItems = [
            ...projects.map(p => ({
                id: p.id,
                title: p.name,
                type: 'Proyectos', 
                normalizedType: 'campaigns', // internal for filter
                date: parseDate(p.date || p.start_date),
                original: p
            })),
            ...calendarEvents.map(e => ({
                id: e.id,
                title: e.title,
                type: e.type, // e.g. 'meeting', 'campaign'
                normalizedType: e.type, // internal
                date: parseDate(e.date),
                original: e
            }))
        ];

        return allItems.filter(item => {
            if (!item.date || isNaN(item.date.getTime())) return false;
            // Compare YYYY-MM-DD
            return item.date.getDate() === day && 
                   item.date.getMonth() === currentDate.getMonth() && 
                   item.date.getFullYear() === currentDate.getFullYear();
        }).filter(item => {
             // Apply Filters (Case Insensitive Mapped)
             const t = (item.normalizedType || '').toLowerCase();
             if (t === 'campaigns' || t === 'proyectos') return filters.campaigns;
             if (t === 'marketing') return filters.marketing;
             if (t === 'hitos' || t === 'campaign') return filters.specials; // 'campaign' tag in events = Hitos
             if (t === 'deadlines' || t === 'deadline') return filters.deadlines;
             if (t === 'meetings' || t === 'meeting') return filters.meetings;
             if (t === 'reminders' || t === 'reminder') return filters.reminders;
             return true; 
        });
    };

    const onDayClick = (dayOrDate) => {
        const date = typeof dayOrDate === 'number' 
            ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOrDate)
            : dayOrDate;
            
        // Use the same robust fetcher
        const dayNum = date.getDate();
        // Warn: if date is from previous/next month, getEventsForDay(day) might check current month.
        // But for MVP click, usually we click within the grid. 
        // If clicking search result (arbitrary date), we need specific fetch.
        
        let events = [];
        if (typeof dayOrDate === 'number') {
             events = getEventsForDay(dayOrDate);
        } else {
             // Date Object Click (Search Result or List View)
             // We need to fetch ALL and filter by this specific date
             const targetY = date.getFullYear();
             const targetM = date.getMonth();
             const targetD = date.getDate();

             events = [
                ...projects.map(p => ({
                    id: p.id, title: p.name, type: 'Proyectos', normalizedType: 'campaigns',
                    date: parseDate(p.date || p.start_date), time: '09:00', isReadOnly: true
                })),
                ...calendarEvents.map(e => ({
                     id: e.id, title: e.title, type: e.type, normalizedType: e.type,
                     date: parseDate(e.date), time: e.time || 'All Day'
                }))
             ].filter(item => 
                 item.date && 
                 item.date.getDate() === targetD && 
                 item.date.getMonth() === targetM && 
                 item.date.getFullYear() === targetY
             );
        }

        // Post-Filter for the Modal (Safety)
        const visibleEvents = events.filter(item => {
             const t = (item.normalizedType || '').toLowerCase();
             if (t === 'campaigns' || t === 'proyectos') return filters.campaigns;
             if (t === 'marketing') return filters.marketing;
             if (t === 'hitos' || t === 'campaign') return filters.specials;
             if (t === 'deadlines' || t === 'deadline') return filters.deadlines;
             if (t === 'meetings' || t === 'meeting') return filters.meetings;
             if (t === 'reminders' || t === 'reminder') return filters.reminders;
             return true; 
        });

        setSelectedDay({ date, events: visibleEvents });
    };

    const renderCalendarGrid = () => {
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        
        return (
            <>
                {blanks.map((_, i) => <div key={`blank-${i}`} className="h-24 md:h-32 bg-black/10 rounded-xl"></div>)}
                {days.map(day => {
                    const events = getEventsForDay(day);
                    const isToday = 
                        day === new Date().getDate() && 
                        currentDate.getMonth() === new Date().getMonth() && 
                        currentDate.getFullYear() === new Date().getFullYear();

                    return (
                        <div 
                            key={day} 
                            onClick={() => onDayClick(day)}
                            className={`h-24 md:h-32 p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 overflow-hidden relative group
                                ${isToday ? 'bg-[#E8A631]/10 border-[#E8A631]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
                        >
                            <span className={`text-xs font-bold mb-1 ${isToday ? 'text-[#E8A631]' : 'text-white/50'}`}>{day}</span>
                            
                            <div className="flex-1 flex flex-col gap-1 overflow-y-hidden">
                                {events.slice(0, 3).map((e, i) => (
                                    <div key={i} className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${getCategoryClasses(e.type, 'badge')}`}>
                                        {e.title}
                                    </div>
                                ))}
                                {events.length > 3 && (
                                    <span className="text-[9px] text-white/40 pl-1">+{events.length - 3} más</span>
                                )}
                            </div>
                            
                            {/* Hover Add Button */}
                            <button className="absolute bottom-2 right-2 p-1 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/20 text-white transition-opacity">
                                <Plus size={10}/>
                            </button>
                        </div>
                    );
                })}
            </>
        );
    };

    const renderWeekGrid = () => {
        // Simple 7 day view starting from current date or start of week?
        // For MVP, just show first 7 days of month or similar. 
        // Let's implement a 'start of current week' logic.
        // Assuming currentDate is anywhere in the month, let's find the start of that week.
        const currentWeekStart = new Date(currentDate);
        currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday start
        
        const weekDays = Array.from({length: 7}, (_, i) => {
            const d = new Date(currentWeekStart);
            d.setDate(currentWeekStart.getDate() + i);
            return d;
        });

        return (
            <div className="grid grid-cols-7 h-full gap-2">
                {weekDays.map((date, i) => {
                     const events = [
                        ...projects.map(p => ({...p, type: 'Proyectos', date: new Date(p.date)})), 
                        ...calendarEvents
                     ].filter(e => new Date(e.date).toDateString() === date.toDateString());

                     return (
                        <div key={i} onClick={() => onDayClick(date)} className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col gap-2 h-full hover:bg-white/10 cursor-pointer">
                            <div className="text-center pb-2 border-b border-white/5">
                                <span className="text-xs uppercase text-white/40 block mb-1">{date.toLocaleDateString('es-ES', {weekday: 'short'})}</span>
                                <span className="text-xl font-bold text-white">{date.getDate()}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                {events.map((e, idx) => (
                                    <div key={idx} className={`p-2 rounded-lg text-xs font-bold truncate ${getCategoryClasses(e.type, 'card')}`}>
                                        {e.title || e.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                     );
                })}
            </div>
        );
    };

    const renderListView = () => {
        // List all events in the month
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const eventsInMonth = days.flatMap(day => {
            const evts = getEventsForDay(day);
            return evts.map(e => ({...e, day}));
        });

        if (eventsInMonth.length === 0) return <div className="text-center text-white/30 italic p-10">No hay eventos este mes.</div>;

        return (
            <div className="flex flex-col gap-2 h-full overflow-y-auto custom-scrollbar p-2">
                {eventsInMonth.map((e, i) => (
                    <div key={i} onClick={() => onDayClick(e.day)} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer group">
                        <div className="flex-none w-12 text-center">
                            <span className="block text-xl font-bold text-white">{e.day}</span>
                            <span className="text-[10px] text-white/40 uppercase">{new Date(currentDate.getFullYear(), currentDate.getMonth(), e.day).toLocaleDateString('es-ES', {weekday: 'short'})}</span>
                        </div>
                        <div className={`w-1 h-10 rounded-full ${getCategoryClasses(e.type, 'border').replace('border', 'bg')}`}></div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white group-hover:text-[#E8A631] transition-colors">{e.title}</h4>
                            <p className="text-xs text-white/50">{e.type}</p>
                        </div>
                        <ArrowUpRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
                    </div>
                ))}
            </div>
        );
    };

    const renderSearchResults = () => {
        return (
            <div className="flex-col gap-2 h-full overflow-y-auto custom-scrollbar p-2">
                 <div className="mb-4 text-white/50 text-sm">
                    Resultados para "<span className="text-white font-bold">{searchQuery}</span>": {searchResults.length}
                 </div>
                {searchResults.length === 0 ? (
                    <div className="text-center text-white/30 mt-10">No se encontraron eventos.</div>
                ) : (
                    searchResults.map((item, idx) => (
                    <div key={idx} onClick={() => onDayClick(item.date)} className={`p-4 mb-2 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all flex justify-between items-center group`}>
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-white/50">{item.date.toLocaleDateString()}</span>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getCategoryClasses(item.type, 'badge')}`}>
                                    {item.type}
                                </span>
                            </div>
                            <h4 className="font-bold text-white">{item.title}</h4>
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 text-blue-400 text-xs flex items-center gap-1">
                            Ir a fecha <ArrowUpRight size={14}/>
                         </div>
                    </div>
                    ))
                )}
            </div>
        );
    };


  // ... (renderListView)

  return (
    <div className="h-full flex gap-6 pb-4">
      
      {/* Sidebar Filter */}
       {/* ... (Sidebar logic unchanged) ... */}
       <div className={`w-64 flex-shrink-0 ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col`}>
           {/* ... existing sidebar content ... */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Calendario</h2>
              <p className="text-xs text-white/50">Filtros & Vistas</p>
            </div>
             {/* ... Filters Buttons ... */}
             <div className="space-y-2 mb-8">
               {[
                   { id: 'campaigns', label: 'Proyectos', color: 'bg-purple-500' },
                   { id: 'specials', label: 'Hitos & Especiales', color: 'bg-yellow-500' },
                   { id: 'marketing', label: 'Marketing', color: 'bg-blue-500' },
                   { id: 'deadlines', label: 'Deadlines', color: 'bg-red-500' },
                   { id: 'meetings', label: 'Reuniones', color: 'bg-green-500' },
                   { id: 'reminders', label: 'Recordatorios', color: 'bg-orange-500' }
               ].map(filter => (
                   <button 
                       key={filter.id}
                       onClick={() => setFilters(prev => ({ ...prev, [filter.id]: !prev[filter.id] }))}
                       className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${filters[filter.id] ? 'bg-white/10 border-white/10' : 'bg-transparent border-transparent opacity-50 hover:bg-white/5'}`}
                   >
                       <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${filter.color} shadow-[0_0_8px_currentColor]`} />
                           <span className="text-sm font-medium text-white">{filter.label}</span>
                       </div>
                       {filters[filter.id] && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                   </button>
               ))}
             </div>
            {/* ... */}
       </div>


      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Header - Professional Navigation (REFACTORED) */}
        <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4 px-2">
            
            {/* Left: Date Navigation (Enhanced) */}
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded-2xl border border-white/10 shadow-inner">
                {/* Year Controls */}
                <div className="flex items-center">
                    <button onClick={handlePrevYear} className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors" title="Año Anterior">
                        <ChevronLeft size={16}/>
                    </button>
                    <span className="text-xs font-bold text-white/50 font-mono w-10 text-center">{currentDate.getFullYear()}</span>
                    <button onClick={handleNextYear} className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors" title="Próximo Año">
                        <ChevronRight size={16}/>
                    </button>
                </div>

                <div className="w-px h-6 bg-white/10 mx-1"></div>

                {/* Month Controls */}
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors">
                        <ChevronLeft size={24}/>
                    </button>
                    
                    <div className="flex flex-col items-center min-w-[120px]">
                        <span className="text-xl font-bold text-white capitalize">
                            {currentDate.toLocaleDateString('es-ES', { month: 'long' })}
                        </span>
                    </div>

                    <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors">
                        <ChevronRight size={24}/>
                    </button>
                </div>
                
                <div className="w-px h-8 bg-white/10 mx-2"></div>
                
                <button onClick={handleToday} className="px-4 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors border border-white/5 uppercase tracking-wider">
                    Hoy
                </button>
            </div>

            {/* Center: Search Bar (NEW) */}
             <div className="flex-1 w-full max-w-md relative group">
                <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`}/>
                <input 
                    type="text" 
                    placeholder="Buscar evento, campaña o hito..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl py-3 pl-10 pr-10 text-sm text-white focus:outline-none transition-all"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white">
                        <X size={14}/>
                    </button>
                )}
             </div>

            {/* Right: View Modes & Stats */}
            <div className="flex items-center gap-3">
                 <div className="flex p-1 bg-black/20 rounded-lg border border-white/10">
                    <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'month' && !searchQuery ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}>Mes</button>
                    <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'week' && !searchQuery ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}>Semana</button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${viewMode === 'list' && !searchQuery ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}>Lista</button>
                 </div>
            </div>
        </div>

        {/* Days Header (Only show if NOT searching) */}
        {!searchQuery && (
            <div className="grid grid-cols-7 mb-2 px-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-xs font-bold uppercase tracking-widest text-white/30 py-2">
                        {day}
                    </div>
                ))}
            </div>
        )}

        {/* Calendar Grid / Search Results */}
        <div className={`flex-1 ${viewMode === 'list' || searchQuery ? 'block' : 'grid'} ${viewMode === 'month' ? 'grid-cols-7 grid-rows-5' : 'grid-cols-1'} gap-2 p-2 rounded-3xl overflow-hidden border border-white/10 ${theme.cardBg} backdrop-blur-xl shadow-2xl relative`}>
             {/* If Searching, show results overlay. Else show normal grid */}
             {searchQuery ? renderSearchResults() : (
                 <>
                    {viewMode === 'month' && renderCalendarGrid()}
                    {viewMode === 'week' && renderWeekGrid()}
                    {viewMode === 'list' && renderListView()}
                 </>
             )}
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
