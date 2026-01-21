import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CampaignRepository } from '../services/CampaignRepository';

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newProject) => CampaignRepository.create(newProject),
    onMutate: async (newProject) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['campaigns'] });

      // Snapshot the previous value
      const previousCampaigns = queryClient.getQueryData(['campaigns']);

      // Optimistically update to the new value
      // Note: We need a temp ID for the UI key
      const tempId = `temp-${Date.now()}`;
      const optimisitcProject = { 
          ...newProject, 
          id: tempId, 
          status: newProject.status || 'Planificación',
          providers: newProject.providers || [],
          // Ensure calculated fields don't crash
          cost: newProject.cost || 0
      };

      queryClient.setQueryData(['campaigns'], (old) => [
        ...(old || []), 
        optimisitcProject
      ]);

      // Return a context object with the snapshotted value
      return { previousCampaigns };
    },
    onError: (err, newProject, context) => {
      // Rollback to the previous value
      queryClient.setQueryData(['campaigns'], context.previousCampaigns);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server sync
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedProject) => CampaignRepository.update(updatedProject),
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

  return useMutation({
    mutationFn: (id) => CampaignRepository.delete(id),
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
