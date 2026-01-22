import { openDB } from 'idb';

const DB_NAME = '360-offline-db';
const STORE_NAME = 'mutation_queue';

// Initialize DB
const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // keyPath: 'id' ensures each mutation has a unique ID
                // autoIncrement: false because we generate UUIDs
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp'); // Allow sorting by time
            }
        },
    });
};

export const OfflineQueue = {
    // Add mutation to queue
    async enqueue(mutation) {
        const db = await initDB();
        const item = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            status: 'pending', // pending | processing | failed
            retryCount: 0,
            ...mutation // Contains: type (POST/PUT), endpoint, body
        };
        await db.put(STORE_NAME, item);
        return item;
    },

    // Get all pending mutations sorted by time
    async getQueue() {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const index = tx.store.index('timestamp');
        return index.getAll();
    },

    // Remove item from queue (after success)
    async dequeue(id) {
        const db = await initDB();
        await db.delete(STORE_NAME, id);
    },

    // Update item status (e.g. for retry count)
    async update(id, updates) {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const item = await tx.store.get(id);
        if (item) {
            await tx.store.put({ ...item, ...updates });
        }
        await tx.done;
    },

    // Clear all (for debugging)
    async clear() {
        const db = await initDB();
        await db.clear(STORE_NAME);
    }
};
