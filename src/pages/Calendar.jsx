
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, Filter, Megaphone, ShoppingBag, CalendarCheck, Users } from 'lucide-react';
import DayDetailModal from '../components/calendar/DayDetailModal';

const Calendar = () => {
  const { theme } = useTheme();
  const { calendarEvents } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Filter States
  const [filters, setFilters] = useState({
      campaigns: true,
      marketing: true,
      deadlines: true,
      meetings: true
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

  const getEventsForDay = (day) => {
      const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
      return calendarEvents.filter(e => {
          if (e.type === 'campaign' && !filters.campaigns) return false;
          if (e.type === 'marketing' && !filters.marketing) return false;
          // Assuming 'deadline' or others fall into 'marketing' or a new cat, but let's stick to existing types
          // If e.type is campaign, check status if needed? For now just type.
          return true;
      }).filter(e => e.date === dateStr);
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
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                    {events.map((evt, idx) => (
                        <div key={idx} className={`text-[9px] px-1.5 py-0.5 rounded truncate border border-white/5 shadow-sm ${
                            evt.type === 'campaign' ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' :
                            'bg-blue-500/20 text-blue-200 border-blue-500/30'
                        }`}>
                            {evt.title}
                        </div>
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
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-2">
            <h1 className={`text-3xl font-bold ${theme.text} capitalize`}>
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h1>
            
            <div className="flex bg-black/20 rounded-xl p-1 border border-white/10 shadow-inner">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
                <button onClick={handleToday} className="px-4 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">HOY</button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"><ChevronRight size={20}/></button>
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
