import { supabase } from '../supabase/client';

export const RateCardRepository = {
    async getAll() {
        try {
            const { data, error } = await supabase.from('rate_card').select('*');
             if (error) {
                if (error.code === 'PGRST205' || error.code === '42P01') {
                     console.warn("Table 'rate_card' not found.");
                     return { data: [], error, source: 'missing_table' };
                }
                throw error;
            }
            return { data, error: null, source: 'remote' };
        } catch (e) {
            console.error("RateCardRepository.getAll failed:", e);
            return { data: null, error: e, source: 'error' };
        }
    },

    async create(item) {
        // Ensure price is number
        const payload = { ...item, price: Number(item.price) };
        const { id, ...cleanPayload } = payload; // Remove temp ID if present

        const { data, error } = await supabase.from('rate_card').insert([cleanPayload]).select();
        if (error) throw error;
        return data?.[0];
    },

    async update(item) {
        const payload = { ...item, price: Number(item.price) };
        const { id, ...updates } = payload;
        
        const { error } = await supabase.from('rate_card').update(updates).eq('id', id);
        if (error) throw error;
        return true;
    },

    async delete(id) {
        const { error } = await supabase.from('rate_card').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};
