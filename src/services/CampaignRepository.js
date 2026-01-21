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

            // Transform Data for Frontend Compatibility (Map DB columns to UI state)
            // Transform Data for Frontend Compatibility (Map DB columns to UI state)
            const mappedData = data.map(item => {
                const notes = item.notes || '';
                // Fallback extraction from notes (REGEX)
                const parentIdMatch = notes.match(/ParentID:\s*(\S+)/); 
                const venueMatch = notes.match(/Sede:\s*([^\n]+)/); 
                const boothMatch = notes.match(/Tipo Stand:\s*([^\n]+)/);
                
                // Extract Resources (JSON in notes)
                let resources = [];
                const resourcesMatch = notes.match(/Resources:\s*(\[.*\])/s);
                if (resourcesMatch && resourcesMatch[1]) {
                    try {
                        resources = JSON.parse(resourcesMatch[1]);
                    } catch (e) {
                         console.warn('Failed to parse Resources JSON from notes', e);
                    }
                }

                return {
                    ...item,
                    type: item.project_type || 'Campaña', // CRITICAL FIX: Map DB 'project_type' to UI 'type'
                    parent_id: item.parent_id || (parentIdMatch ? parentIdMatch[1] : null), // Restore parent link
                    venue: item.venue || (venueMatch ? venueMatch[1].trim() : ''), // Restore Venue
                    booth_type: item.booth_type || (boothMatch ? boothMatch[1].trim() : ''), // Restore Stand
                    resources: resources, // Restore Resources
                    providers: item.providers || [] // Safety Fix
                };
            });

            return { data: mappedData, error: null, source: 'remote' };
        } catch (e) {
            console.error("CampaignRepository.getAll failed:", e);
            return { data: null, error: e, source: 'error' };
        }
    },

    async create(campaign) {
        // Sanitize Payload: Strict Allow-List to prevent schema errors
        const { id, activeTab, resources, ...rest } = campaign;
        
        // Calculate Cost from Resources if available
        let calculatedCost = 0;
        let resourcesString = '';
        if (resources && Array.isArray(resources)) {
            calculatedCost = resources.reduce((acc, curr) => acc + (curr.total || 0), 0);
            try {
                resourcesString = JSON.stringify(resources);
            } catch (e) {
                console.error("Failed to stringify resources", e);
            }
        }

        // Append extra info to notes since we lack columns for now
        let extraInfo = '';
        if (rest.venue) extraInfo += `\nSede: ${rest.venue}`;
        if (rest.capacity) extraInfo += `\nAforo: ${rest.capacity}`;
        if (rest.booth_type) extraInfo += `\nTipo Stand: ${rest.booth_type}`;
        if (rest.dimensions) extraInfo += `\nDimensiones: ${rest.dimensions}`;
        // Fallback for missing parent_id column
        if (rest.parent_id) extraInfo += `\nParentID: ${rest.parent_id}`;
        // Append Resources
        if (resourcesString) extraInfo += `\nResources: ${resourcesString}`;

        const finalNotes = (rest.notes || '') + (extraInfo ? `\n---\n${extraInfo}` : '');

        const payload = {
            name: rest.name,
            client: rest.client,
            status: rest.status,
            progress: rest.progress || 0,
            date: rest.date,
            budget: rest.budget || 0,
            cost: rest.cost || calculatedCost, // Use calculated cost if no explicit cost provided
            providers: rest.providers,
            project_type: rest.type || 'Campaña',
            // parent_id: rest.parent_id || null, // Column missing in DB
            notes: finalNotes, 
            kpi1: rest.kpi1, // Only if column exists
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
        // Sanitize Payload: Strict Filter
        // eslint-disable-next-line
        const { 
            id, activeTab, transactions, statusColor, 
            _source, source, destination, draggableId, mode, // explicitly exclude known junk
            resources, // extract resources to handle separately
            ...updates 
        } = campaign;
        
        // Final Safety Scrub of the payload object
        const payload = { ...updates };
        
        // List of keys we KNOW we want to strip if they snuck in
        const blockedKeys = ['_source', 'source', 'destination', 'draggableId', 'mode', 'description', 'venue', 'capacity', 'booth_type', 'dimensions', 'retailer_id', 'parent_id', 'brand'];
        blockedKeys.forEach(key => delete payload[key]);

        if (updates.type) { payload.project_type = updates.type; delete payload.type; }
        // if (updates.parent_id) { payload.parent_id = updates.parent_id; } // Column missing
        
        // Handle Resources & Cost in Update
        if (resources && Array.isArray(resources)) {
            const calculatedCost = resources.reduce((acc, curr) => acc + (curr.total || 0), 0);
            payload.cost = calculatedCost;

            // Handle Notes Injection for Resources
            // We need to safely update 'Resources: [...]' in the notes string
            let currentNotes = payload.notes || ''; 
            const resourcesString = JSON.stringify(resources);
            
            // Check if we already have a Resources block using Regex
            const resourcesRegex = /Resources:\s*(\[.*\])/s;
            if (currentNotes.match(resourcesRegex)) {
                // Replace existing block
                payload.notes = currentNotes.replace(resourcesRegex, `Resources: ${resourcesString}`);
            } else {
                // Append if not exists
                payload.notes = currentNotes + `\n---\nResources: ${resourcesString}`;
            }
        }

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
