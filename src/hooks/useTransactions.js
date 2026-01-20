import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';

export const useTransactions = () => {
    return useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
             const { data, error } = await supabase.from('transactions').select('*');
             if (error) {
                 if (error.code !== '42P01') console.error("Error fetching transactions:", error);
                 return [];
             }
             return data || [];
        },
        staleTime: 1000 * 60 * 5
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (t) => {
             const newTrans = { ...t };
             // ID handling: If offline, we might want to generate one, but Supabase generates uuid.
             // If we rely on Optimistic UI, we generate temp ID.
             const { data, error } = await supabase.from('transactions').insert([newTrans]).select();
             if (error) throw error;
             return data[0];
        },
        onMutate: async (newTrans) => {
            await queryClient.cancelQueries({ queryKey: ['transactions'] });
            const prev = queryClient.getQueryData(['transactions']);
            
            const optimistic = { ...newTrans, id: `temp-${Date.now()}` };
            queryClient.setQueryData(['transactions'], (old) => [...(old || []), optimistic]);
            
            return { prev };
        },
        onError: (err, vars, ctx) => queryClient.setQueryData(['transactions'], ctx.prev),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (t) => {
             const { error } = await supabase.from('transactions').update(t).eq('id', t.id);
             if (error) throw error;
             return t;
        },
        onMutate: async (t) => {
            await queryClient.cancelQueries({ queryKey: ['transactions'] });
            const prev = queryClient.getQueryData(['transactions']);
            
            queryClient.setQueryData(['transactions'], (old) => old.map(x => x.id === t.id ? { ...x, ...t } : x));
            
            return { prev };
        },
        onError: (err, vars, ctx) => queryClient.setQueryData(['transactions'], ctx.prev),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
             const { error } = await supabase.from('transactions').delete().eq('id', id);
             if (error) throw error;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['transactions'] });
            const prev = queryClient.getQueryData(['transactions']);
            
            queryClient.setQueryData(['transactions'], (old) => old.filter(x => x.id !== id));
            
            return { prev };
        },
        onError: (err, vars, ctx) => queryClient.setQueryData(['transactions'], ctx.prev),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
    });
};
