import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { OfflineQueue } from '../services/OfflineQueue';
import { useToast } from './ToastContext';
import { supabase } from '../supabase/client';
import { logError } from '../utils/logger';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const { addToast } = useToast();

    // Process Mutation
    const processMutation = useCallback(async (mutation) => {
        const { endpoint, type, body } = mutation;
        
        // Dynamic Supabase call based on endpoint string
        // Expects endpoint format: "table_name"
        // Example: type="POST", endpoint="campaigns", body={...}
        
        let query = supabase.from(endpoint);
        
        if (type === 'POST') {
            const { error } = await query.insert(body);
            if (error) throw error;
        } else if (type === 'PUT') {
            const { id, ...updates } = body;
            const { error } = await query.update(updates).eq('id', id);
            if (error) throw error;
        } else if (type === 'DELETE') {
             const { id } = body;
             const { error } = await query.delete().eq('id', id);
             if (error) throw error;
        }
    }, []);

    // Main Sync Logic - Defined BEFORE useEffect that uses it
    const syncQueue = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);

        try {
            const queue = await OfflineQueue.getQueue();
            if (queue.length === 0) {
                setIsSyncing(false);
                return;
            }

            for (const mutation of queue) {
                try {
                    await processMutation(mutation);
                    await OfflineQueue.dequeue(mutation.id); // Success! Remove from queue
                } catch (err) {
                    logError('Sync', err, { mutationId: mutation.id, endpoint: mutation.endpoint });
                    await OfflineQueue.update(mutation.id, { status: 'failed', lastError: err.message });
                }
            }
            
            addToast('Sincronización completada', 'success');
        } catch (err) {
            logError('Sync', err, { context: 'syncQueue' });
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, addToast, processMutation]);

    // Check internet connection
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            addToast('Conexión restaurada. Sincronizando...', 'info');
            syncQueue();
        };
        const handleOffline = () => {
            setIsOnline(false);
            addToast('Modo Offline: Los cambios se guardarán localmente', 'warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [addToast, syncQueue]);
    
    // Initial sync check on mount
    useEffect(() => {
        if (isOnline) {
             syncQueue();
        }
    }, [isOnline, syncQueue]); // Run when online status becomes true or mount

    return (
        <SyncContext.Provider value={{ isOnline, isSyncing, syncQueue }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) throw new Error('useSync must be used within SyncProvider');
    return context;
};
