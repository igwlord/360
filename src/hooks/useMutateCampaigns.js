import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineMutation } from './useOfflineMutation';

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  const { mutate } = useOfflineMutation();

  const sanitizeCampaign = (campaign) => {
      // White-list fields that actually exist in DB
      // IMPORTANTE: dejamos que la BD genere el id (identity)
      const validFields = [
          'name', 'client', 'status', 'progress', 'date', 
          'budget', 'cost', 'providers', 'project_type', 
          'notes', 'kpi1', 'kpi2'
      ];
      
      const payload = {};
      validFields.forEach(field => {
          if (campaign[field] !== undefined && campaign[field] !== null) {
              payload[field] = campaign[field];
          }
      });

      // Special Mapping
      if (campaign.type) payload.project_type = campaign.type;
      
      // Handle extra fields by appending to Notes
      let extraInfo = '';
      if (campaign.venue) extraInfo += `\nSede: ${campaign.venue}`;
      if (campaign.capacity) extraInfo += `\nAforo: ${campaign.capacity}`;
      if (campaign.booth_type) extraInfo += `\nTipo Stand: ${campaign.booth_type}`;
      if (campaign.dimensions) extraInfo += `\nDimensiones: ${campaign.dimensions}`;
      if (campaign.retailer_id) extraInfo += `\nRetailerID: ${campaign.retailer_id}`;
      if (campaign.parent_id) extraInfo += `\nParentID: ${campaign.parent_id}`;
      
      // Handle Resources (Rate Card Items)
      if (campaign.resources && Array.isArray(campaign.resources)) {
          // If cost not manually set, calculate it
          if (!payload.cost) {
              payload.cost = campaign.resources.reduce((acc, curr) => acc + (curr.total || 0), 0);
          }
           try {
              extraInfo += `\nResources: ${JSON.stringify(campaign.resources)}`;
          } catch {
              // Error serializing resources - continue without extra info
          }
      }

      if (extraInfo) {
          payload.notes = (payload.notes || '') + `\n---\n${extraInfo}`;
      }

      return payload;
  };

  return useMutation({
    mutationFn: (newProject) => mutate({ 
        table: 'campaigns', 
        type: 'POST', 
        data: sanitizeCampaign(newProject)
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

  const sanitizeCampaign = (campaign) => {
      // Same sanitization but handling Updates
      const { 
            id, activeTab: _activeTab, transactions: _transactions, statusColor: _statusColor, 
            source: _source, destination: _destination, draggableId: _draggableId, mode: _mode,
            resources, booth_type: _booth_type, dimensions: _dimensions, retailer_id: _retailer_id, 
            venue: _venue, capacity: _capacity, parent_id: _parent_id,
            ...rest
      } = campaign;

      // Start with rest but filter only valid columns if possible.
      // For updates, we just want to avoid sending blocked keys.
      // But safer to whitelist again or just strip known junk.
      const payload = { ...rest, id }; // Keep ID!

      // Map Type
      if (campaign.type) { payload.project_type = campaign.type; delete payload.type; }

      // Handle Resources update in Notes logic
      if (resources && Array.isArray(resources)) {
             const calculatedCost = resources.reduce((acc, curr) => acc + (curr.total || 0), 0);
             payload.cost = calculatedCost;
             
             let currentNotes = payload.notes || ''; 
             const resourcesString = JSON.stringify(resources);
             const resourcesRegex = /Resources:\s*(\[.*\])/s;
             if (currentNotes.match(resourcesRegex)) {
                 payload.notes = currentNotes.replace(resourcesRegex, `Resources: ${resourcesString}`);
             } else {
                 payload.notes = currentNotes + `\n---\nResources: ${resourcesString}`;
             }
      }
      return payload;
  };

  return useMutation({
    mutationFn: (updatedProject) => mutate({ 
        table: 'campaigns', 
        type: 'PUT', 
        data: sanitizeCampaign(updatedProject)
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
