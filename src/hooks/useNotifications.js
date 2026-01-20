import { useState } from 'react';

// Initially mock data/empty array. Can be connected to Supabase 'notifications' table later.
const INITIAL_NOTIFICATIONS = [
    { id: 1, title: 'Bienvenido', message: 'Bienvenido al sistema 360.', read: false, time: new Date().toISOString() }
];

export const useNotifications = () => {
    // For now, local state.
    // Ideally this would be useQuery call to 'notifications' table.
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    return {
        notifications,
        setNotifications,
        markAsRead,
        clearAllNotifications
    };
};
