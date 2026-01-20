import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BUDGET_KEY = 'budget_v1';

const INITIAL_BUDGET = {
    total: 10, // Millions (default)
    executed: 0, 
    currency: 'ARS'
};

const getBudget = async () => {
    const stored = localStorage.getItem(BUDGET_KEY);
    return stored ? JSON.parse(stored) : INITIAL_BUDGET;
};

const saveBudget = (budget) => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
    return budget;
};

export const useBudget = () => {
    const queryClient = useQueryClient();

    const { data: budget = INITIAL_BUDGET } = useQuery({
        queryKey: ['budget'],
        queryFn: getBudget,
        staleTime: Infinity 
    });

    const updateBudgetMutation = useMutation({
        mutationFn: async (updates) => {
            const current = await getBudget();
            const updated = { ...current, ...updates };
            saveBudget(updated);
            return updated;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['budget'], updated);
        }
    });

    return {
        budget,
        updateBudget: updateBudgetMutation.mutate
    };
};
