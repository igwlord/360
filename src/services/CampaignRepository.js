import { supabase } from '../supabase/client';

export const CampaignRepository = {
    async getAll() {
        try {
            const { data, error } = await supabase.from('campaigns').select('*');
            if (error) {
                // Handle 404 specifically if table missing
                if (error.code === 'PGRST205' || error.code === '42P01') {
                    console.warn("Table 'campaigns' not found. Returning empty list (or fallback).");
                    return { data: [], error, source: 'missing_table' };
                }
                throw error;
            }
            return { data, error: null, source: 'remote' };
        } catch (e) {
            console.error("CampaignRepository.getAll failed:", e);
            return { data: null, error: e, source: 'error' };
        }
    },

    async create(campaign) {
        // Sanitize Payload: Remove 'id' if it's a temp timestamp, and only send valid columns
        const { id, notes, activeTab, ...rest } = campaign;
        
        // Allowed columns (as per schema) + 'providers' & 'project_type'
        // If 'notes' is important, we should map it to 'kpi1' or add a column.
        // For now, let's map 'notes' -> 'kpi1' if kpi1 is empty? Or just drop to avoid 400.
        // User requested creating from Directory, which sets 'providers'.
        
        const payload = {
            name: rest.name,
            client: rest.client,
            status: rest.status,
            progress: rest.progress || 0,
            date: rest.date,
            budget: rest.budget || 0,
            cost: rest.cost || 0,
            providers: rest.providers, // Requires SQL fix
            project_type: rest.type || 'Campaña',
            kpi1: rest.kpi1 || (notes ? notes : null), // Map notes to kpi1 temp
            kpi2: rest.kpi2
        };

        const { data, error } = await supabase
            .from('campaigns')
            .insert([payload])
            .select();
        
        if (error) {
            console.error("Supabase Create Error:", error);
            throw error;
        }
        return data?.[0];
    },

    async update(campaign) {
        // Sanitize Payload: Remove 'id', 'activeTab', 'transactions', 'statusColor'
        // eslint-disable-next-line
        const { id, activeTab, transactions, statusColor, ...updates } = campaign;
        
        // Ensure mapped fields are handled if present in 'updates'
        const payload = { ...updates };
        if (updates.type) { payload.project_type = updates.type; delete payload.type; }
        if (updates.providers) { /* payload.providers = updates.providers; */ } // Send as is if schema allows

        const { error } = await supabase
            .from('campaigns')
            .update(payload)
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },

    async delete(id) {
        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
};
