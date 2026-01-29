import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import holidaysData from '../data/holidays.json';
import { CALENDAR_EVENTS_DATA } from '../data/initialData';

export const useCalendarEvents = () => {
  return useQuery({
    queryKey: ['calendarEvents'],
    queryFn: async () => {
      // 1. Fetch Remote Events
      const { data: evtData, error } = await supabase
        .from("global_events")
        .select("*");
      
      if (error) {
        // Fallback to initial data if error (matching DataContext behavior roughly)
        // But in hook world, we might want to return throw or empty.
        // For now, let's return mock if empty only.
      }

      const remoteEvents = (evtData || []).map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        date: e.date,
        startDay: e.start_day,
        endDay: e.end_day,
        color: e.color,
        textColor: e.text_color,
        description: e.description,
      }));

      // 2. Merge Holidays (Local)
      const mappedHolidays = holidaysData.map((h, i) => ({
          id: `holiday-${i}`,
          title: h.name,
          type: h.type === 'marketing' ? 'marketing' : 'holiday',
          date: h.date,
          color: h.type === 'marketing' ? '#db2777' : '#ef4444', 
          isReadOnly: true
      }));

      const allEvents = [...remoteEvents, ...mappedHolidays];

      // Fallback if strictly empty and no error: datos de ejemplo (solo lectura en calendario)
      if (allEvents.length === mappedHolidays.length && !error) {
        const exampleEvents = CALENDAR_EVENTS_DATA.map((e) => ({
          ...e,
          isReadOnly: true,
          time: e.time || (e.date ? '09:00' : null),
        }));
        return [...exampleEvents, ...mappedHolidays];
      }

      return allEvents;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (events) => {
        // Optimization: Pre-calculate "Events by DateString" map here if needed
        // For now, returning array is fine, Calendar.jsx filters it.
        return events;
    }
  });
};
