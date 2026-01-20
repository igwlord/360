import { useQuery } from '@tanstack/react-query';
import { CampaignRepository } from '../services/CampaignRepository';
import { CAMPAIGNS_DATA } from '../data/initialData';

export const useCampaigns = () => {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, source } = await CampaignRepository.getAll();
      
      // Fallback logic similar to DataContext
      if (source === 'remote' && data && data.length > 0) {
        return data;
      }
      
      // If we are strictly offline or DB is empty, use Mock Data or empty array
      // Note: DataContext logic used CAMPAIGNS_DATA as fallback if DB empty. 
      // We replicate this ensure consistency during migration.
      if ((!data || data.length === 0) && source !== 'error') {
          return CAMPAIGNS_DATA; 
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
};
