import { useQuery } from '@tanstack/react-query';
import { CampaignRepository } from '../services/CampaignRepository';
import { CAMPAIGNS_DATA } from '../data/initialData';
import { Campaign } from '../types/database.types';

export const useCampaigns = () => {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, source } = await CampaignRepository.getAll();
      
      // Fallback logic similar to DataContext
      if (source === 'remote' && data && data.length > 0) {
        return data as Campaign[];
      }
      
      // If we are strictly offline or DB is empty, use Mock Data or empty array
      if ((!data || data.length === 0) && source !== 'error') {
          return CAMPAIGNS_DATA as unknown as Campaign[]; 
      }
      
      return (data as Campaign[]) || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });
};
