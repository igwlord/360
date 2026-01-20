import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEvent) => {
      // DataContext logic handled logic for 'id' generation differently for offline.
      // Here we assume online or queue.
      const payload = {
        title: newEvent.title,
        type: newEvent.type,
        date: newEvent.date,
        description: newEvent.description,
        color: newEvent.color,
        text_color: newEvent.textColor,
        // start_day, end_day if needed
      };
      
      const { data, error } = await supabase.from('global_events').insert([payload]).select();
      if (error) throw error;
      return data[0];
    },
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: ['calendarEvents'] });
      const previousEvents = queryClient.getQueryData(['calendarEvents']);

      const optimisticEvent = { 
        ...newEvent, 
        id: `temp-${Date.now()}` 
      };

      queryClient.setQueryData(['calendarEvents'], (old) => [...(old || []), optimisticEvent]);

      return { previousEvents };
    },
    onError: (err, newEvent, context) => {
      queryClient.setQueryData(['calendarEvents'], context.previousEvents);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedEvent) => {
      const payload = {
        title: updatedEvent.title,
        type: updatedEvent.type,
        date: updatedEvent.date,
        description: updatedEvent.description,
        color: updatedEvent.color,
        text_color: updatedEvent.textColor,
      };
      
      const { error } = await supabase.from('global_events').update(payload).eq('id', updatedEvent.id);
      if (error) throw error;
      return updatedEvent; // Return what we sent for simplicity
    },
    onMutate: async (updatedEvent) => {
      await queryClient.cancelQueries({ queryKey: ['calendarEvents'] });
      const previousEvents = queryClient.getQueryData(['calendarEvents']);

      queryClient.setQueryData(['calendarEvents'], (old) => 
        old.map(e => e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e)
      );

      return { previousEvents };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['calendarEvents'], context.previousEvents);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('global_events').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['calendarEvents'] });
      const previousEvents = queryClient.getQueryData(['calendarEvents']);

      queryClient.setQueryData(['calendarEvents'], (old) => 
        old.filter(e => e.id !== id)
      );

      return { previousEvents };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['calendarEvents'], context.previousEvents);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });
};
