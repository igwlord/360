import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from './useOfflineMutation';

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  const { mutate } = useOfflineMutation();

  return useMutation({
    mutationFn: (newProject) => mutate({ 
        table: 'campaigns', 
        type: 'POST', 
        data: newProject 
    }),
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ['campaigns'] });
      const previousCampaigns = queryClient.getQueryData(['campaigns']);

      const tempId = `temp-${Date.now()}`;
      const optimisitcProject = { 
          ...newProject, 
          id: tempId, 
          status: newProject.status || 'Planificación',
          providers: newProject.providers || [],
          cost: newProject.cost || 0
      };

      queryClient.setQueryData(['campaigns'], (old) => [
        ...(old || []), 
        optimisitcProject
      ]);

      return { previousCampaigns };
    },
    onError: (err, newProject, context) => {
      queryClient.setQueryData(['campaigns'], context.previousCampaigns);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  const { mutate } = useOfflineMutation();

  return useMutation({
    mutationFn: (updatedProject) => mutate({ 
        table: 'campaigns', 
        type: 'PUT', 
        data: updatedProject 
    }),
    onMutate: async (updatedProject) => {
      await queryClient.cancelQueries({ queryKey: ['campaigns'] });
      const previousCampaigns = queryClient.getQueryData(['campaigns']);

      queryClient.setQueryData(['campaigns'], (old) => 
        old.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p)
      );

      return { previousCampaigns };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['campaigns'], context.previousCampaigns);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  const { mutate } = useOfflineMutation();

  return useMutation({
    mutationFn: (id) => mutate({ 
        table: 'campaigns', 
        type: 'DELETE', 
        data: { id } 
    }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['campaigns'] });
      const previousCampaigns = queryClient.getQueryData(['campaigns']);

      queryClient.setQueryData(['campaigns'], (old) => 
        old.filter(p => p.id !== id)
      );

      return { previousCampaigns };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['campaigns'], context.previousCampaigns);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};
