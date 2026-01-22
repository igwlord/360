import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { Transaction } from '../types/database.types';

export const useTransactions = () => {
    return useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
             const { data, error } = await supabase.from('transactions').select('*');
             if (error) {
                 if (error.code !== '42P01') console.error("Error fetching transactions:", error);
                 return [];
             }
             return (data as Transaction[]) || [];
        },
        staleTime: 1000 * 60 * 5
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (t: Partial<Transaction>) => {
             const newTrans = { ...t };
             // ID handling: If offline, we might want to generate one, but Supabase generates uuid.
             const { data, error } = await supabase.from('transactions').insert([newTrans]).select();
             if (error) throw error;
             return data[0] as Transaction;
        },
        onMutate: async (newTrans) => {
            await queryClient.cancelQueries({ queryKey: ['transactions'] });
            const prev = queryClient.getQueryData<Transaction[]>(['transactions']);
            
            const optimistic = { ...newTrans, id: `temp-${Date.now()}` } as Transaction;
            queryClient.setQueryData<Transaction[]>(['transactions'], (old) => [...(old || []), optimistic]);
            
            return { prev };
        },
        onError: (err, vars, ctx) => queryClient.setQueryData(['transactions'], ctx?.prev),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (t: Partial<Transaction> & { id: string | number }) => {
             const { error } = await supabase.from('transactions').update(t).eq('id', t.id);
             if (error) throw error;
             return t;
        },
        onMutate: async (t) => {
            await queryClient.cancelQueries({ queryKey: ['transactions'] });
            const prev = queryClient.getQueryData<Transaction[]>(['transactions']);
            
            queryClient.setQueryData<Transaction[]>(['transactions'], (old) => old?.map(x => String(x.id) === String(t.id) ? { ...x, ...t } as Transaction : x));
            
            return { prev };
        },
        onError: (_err, _vars, ctx) => queryClient.setQueryData(['transactions'], ctx?.prev),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string | number) => {
             const { error } = await supabase.from('transactions').delete().eq('id', id);
             if (error) throw error;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['transactions'] });
            const prev = queryClient.getQueryData<Transaction[]>(['transactions']);
            
            queryClient.setQueryData<Transaction[]>(['transactions'], (old) => old?.filter(x => String(x.id) !== String(id)));
            
            return { prev };
        },
        onError: (_err, _vars, ctx) => queryClient.setQueryData(['transactions'], ctx?.prev),
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
    });
};
