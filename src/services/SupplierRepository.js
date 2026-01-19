import { supabase } from '../supabase/client';

export const SupplierRepository = {
    async getAll() {
        try {
            const { data, error } = await supabase.from('suppliers').select('*');
            if (error) {
                if (error.code === 'PGRST205' || error.code === '42P01') {
                     console.warn("Table 'suppliers' not found.");
                     return { data: [], error, source: 'missing_table' };
                }
                throw error;
            }
            return { data, error: null, source: 'remote' };
        } catch (e) {
            console.error("SupplierRepository.getAll failed:", e);
            return { data: null, error: e, source: 'error' };
        }
    },

    async create(supplier) {
        const { data, error } = await supabase.from('suppliers').insert([supplier]).select();
        if (error) throw error;
        return data?.[0];
    },

    async update(supplier) {
        const { id, ...updates } = supplier;
        const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
        if (error) throw error;
        return true;
    },

    async delete(id) {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};
