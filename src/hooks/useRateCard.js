import { useQuery } from '@tanstack/react-query';
import { RateCardRepository } from '../services/RateCardRepository';
import { RATE_CARD_DATA } from '../data/initialData';

// ... existing imports
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Ensure imports

export const useRateCard = () => {
  return useQuery({
    queryKey: ['rateCard'],
    queryFn: async () => {
      const { data, source } = await RateCardRepository.getAll();
      if ((!data || data.length === 0) && source !== 'error') {
          return RATE_CARD_DATA;
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

export const useCreateRateItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (item) => RateCardRepository.create(item),
        onSuccess: () => queryClient.invalidateQueries(['rateCard'])
    });
};

export const useUpdateRateItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (item) => RateCardRepository.update(item),
        onSuccess: () => queryClient.invalidateQueries(['rateCard'])
    });
};

export const useDeleteRateItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => RateCardRepository.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['rateCard'])
    });
};
