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
        
        // Sanitize: Allow-list known columns (based on typical schema + recently added)
        // If 'subcategory' or 'format_size' are missing in DB, we should put them in specs or notes?
        // For now, let's try to send them, but if it fails with specific code, fallback?
        // Actually, better to just wrap in try/catch and clean if needed.
        // Let's assume standard columns: item, category, price, unit, specs, notes
        // And optional: subcategory, format_size.
        
        const { id: _id, ...cleanPayload } = payload; // Remove temp ID
        
        // Attempt insert
        const { data, error } = await supabase.from('rate_card').insert([cleanPayload]).select();
        
        if (error) {
            // Check for missing column error
            if (error.code === '42703') { // Undefined column
                 console.warn("Schema mismatch in Rate Card. Retrying with minimal payload.");
                 // Fallback: Send only guaranteed columns
                 const minimalPayload = {
                     item: cleanPayload.item,
                     category: cleanPayload.category,
                     price: cleanPayload.price,
                     unit: cleanPayload.unit,
                     specs: cleanPayload.specs + (cleanPayload.subcategory ? `\nSub: ${cleanPayload.subcategory}` : '') + (cleanPayload.format_size ? `\nFormat: ${cleanPayload.format_size}` : ''),
                     notes: cleanPayload.notes
                 };
                 const { data: retryData, error: retryError } = await supabase.from('rate_card').insert([minimalPayload]).select();
                 if (retryError) throw retryError;
                 return retryData?.[0];
            }
            throw error;
        }
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
