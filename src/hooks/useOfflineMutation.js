import { useSync } from '../context/SyncContext';
import { OfflineQueue } from '../services/OfflineQueue';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabase/client';

export const useOfflineMutation = () => {
    const { isOnline } = useSync();
    const { addToast } = useToast();

    /**
     * Executes a mutation safely, queuing it if offline.
     * @param {Object} options
     * @param {string} options.table - The Supabase table to mutate.
     * @param {'POST'|'PUT'|'DELETE'} options.type - The type of mutation.
     * @param {Object} options.data - The data payload for the mutation.
     * @param {Function} [options.onSuccess] - Optional callback triggered on successful online execution.
     * @returns {Promise<Object|null>} Returns the result data if online, or null if queued offline.
     */
    const mutate = async ({ table, type, data, onSuccess }) => {
        if (!isOnline) {
            // OFFLINE: Queue it
            await OfflineQueue.enqueue({
                endpoint: table,
                type: type,
                body: data
            });
            addToast('Sin conexión. Cambio guardado localmente.', 'warning');
            return null; // Return null to indicate "queued"
        } else {
            // ONLINE: Execute directly
            try {
                let query = supabase.from(table);
                let result;

                if (type === 'POST') {
                    result = await query.insert(data).select().single();
                } else if (type === 'PUT') {
                    const { id, ...updates } = data;
                    result = await query.update(updates).eq('id', id).select().single();
                } else if (type === 'DELETE') {
                    const { id } = data;
                    await query.delete().eq('id', id);
                    result = { data: { id } };
                }

                if (result.error) throw result.error;
                
                if (onSuccess) onSuccess(result.data);
                return result.data;
            } catch (err) {
                addToast('Error al guardar: ' + err.message, 'error');
                throw err;
            }
        }
    };

    return { mutate };
};
