
import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  CAMPAIGNS_DATA, 
  PROVIDER_GROUPS_DATA, 
  RATE_CARD_DATA, 
  CALENDAR_EVENTS_DATA,
  BUDGET_DATA 
} from '../data/initialData';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // --- Global State with Persistence ---
  
  // Campaigns (with simple migration for new fields)
  const [campaigns, setCampaigns] = useLocalStorage('campaigns-data', CAMPAIGNS_DATA.map(c => ({
    ...c,
    providers: c.providers || (c.providerId ? [c.providerId] : []),
    transactions: c.transactions || [{ id: 'init', date: new Date().toISOString(), type: 'initial', amount: parseInt(typeof c.cost === 'string' ? c.cost.replace(/\D/g,'') : c.cost) || 0, note: 'Presupuesto Inicial' }]
  })));
  const [calendarEvents, setCalendarEvents] = useLocalStorage('calendar-events', CALENDAR_EVENTS_DATA);
  
  // Providers / Directory
  const [providerGroups, setProviderGroups] = useLocalStorage('provider-groups', PROVIDER_GROUPS_DATA);
  
  // Rate Card (Tarifario)
  const [rateCardItems, setRateCardItems] = useLocalStorage('rate-card-items', RATE_CARD_DATA);

  // Budget
  const budget = BUDGET_DATA;

  // --- Actions / Modifiers ---

  // Providers Actions
  const addProviderGroup = (title) => {
    const newGroup = { id: `group-${Date.now()}`, title, contacts: [] };
    setProviderGroups([...providerGroups, newGroup]);
    return newGroup;
  };

  const addContact = (contactData) => {
    setProviderGroups(prev => prev.map(group => {
      if (group.id === contactData.groupId) {
        if (contactData.id) {
           // Edit existing
           return { ...group, contacts: group.contacts.map(c => c.id === contactData.id ? contactData : c) };
        } else {
           // Add new
           return { ...group, contacts: [...group.contacts, { ...contactData, id: `new-${Date.now()}`, isFavorite: false }] };
        }
      }
      return group;
    }));
  };

  const toggleFavoriteContact = (contactId) => {
    setProviderGroups(prev => prev.map(group => ({
      ...group,
      contacts: group.contacts.map(c => c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c)
    })));
  };

  const deleteContact = (contactId) => {
    setProviderGroups(prev => prev.map(group => ({
      ...group,
      contacts: group.contacts.filter(c => c.id !== contactId)
    })));
  };

  const moveGroup = (direction, groupId) => {
    const index = providerGroups.findIndex(g => g.id === groupId);
    if (index === -1 || (direction === 'up' && index === 0) || (direction === 'down' && index === providerGroups.length - 1)) return;
    const newGroups = [...providerGroups];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];
    setProviderGroups(newGroups);
  };
  
  const deleteGroup = (groupId) => {
    setProviderGroups(prev => prev.filter(g => g.id !== groupId));
  };


  // Rate Card Actions
  const saveRateItem = (item) => {
    if (item.id) {
      // Edit
      setRateCardItems(prev => prev.map(i => i.id === item.id ? { ...item, price: Number(item.price) } : i));
    } else {
      // Create
      const newItem = { ...item, id: `t-${Date.now()}`, price: Number(item.price) };
      setRateCardItems(prev => [...prev, newItem]);
    }
  };

  const deleteRateItem = (id) => {
    setRateCardItems(prev => prev.filter(item => item.id !== id));
  };

  // --- Data Management (Backup/Restore) ---
  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      campaigns,
      calendarEvents,
      providerGroups,
      rateCardItems,
      budget // Budget is currently static constant, but if it were state we'd save it
    };
    
    // Create Blob and Link
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retail_media_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (jsonContent) => {
    try {
      const data = JSON.parse(jsonContent);
      
      // Basic Validation
      if (!data.campaigns || !data.providerGroups || !data.rateCardItems) {
        throw new Error('Formato de archivo inválido');
      }

      // Update State (and LocalStorage via hooks)
      if (data.campaigns) setCampaigns(data.campaigns);
      if (data.calendarEvents) setCalendarEvents(data.calendarEvents);
      if (data.providerGroups) setProviderGroups(data.providerGroups);
      if (data.rateCardItems) setRateCardItems(data.rateCardItems);
      
      return { success: true, message: 'Datos importados correctamente' };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, message: 'Error al importar datos: ' + error.message };
    }
  };

  // --- Notifications Logic ---
  const [notificationSettings, setNotificationSettings] = useLocalStorage('notification-settings', {
    daysBeforeAlert: 3, 
    enabled: true
  });
  
  // Persistent Read/History Store
  // Format: { id: string, read: boolean, timestamp: string }
  const [notificationHistory, setNotificationHistory] = useLocalStorage('notification-history', []);
  const [notifications, setNotifications] = React.useState([]);

  React.useEffect(() => {
    if (!notificationSettings.enabled) {
      setNotifications([]);
      return;
    }

    const today = new Date();
    // Logic: We generate ALERTS based on live data (campaigns/events).
    // Then we merge with HISTORY to see if they are 'read'.
    // We also keep 'stale' notifications in history if needed, but for simplicity, allow rebuilding live ones.
    
    let generatedNotifications = [];

    // 1. Check Campaigns
    campaigns.forEach(c => {
       if (c.status === 'En Curso' && c.progress < 20) {
           generatedNotifications.push({ id: `warn-${c.id}`, title: `Bajo Progreso: ${c.name}`, type: 'warning', msg: 'La campaña está activa pero con poco avance.' });
       }
    });

    // 2. Check Calendar Events
    calendarEvents.forEach(e => {
        if (e.type === 'deadline') {
            generatedNotifications.push({ id: `evt-${e.id}`, title: `Deadline Próximo: ${e.title}`, type: 'alert', msg: 'Vence en breve.' });
        }
    });
    
    // 3. Demo Welcome (Only if never seen?)
    if (generatedNotifications.length === 0 && notificationHistory.length === 0) {
        generatedNotifications.push({ id: 'demo-1', title: 'Bienvenido al Hub', type: 'info', msg: 'Todas las operaciones están normales.' });
    }

    // Merge with History to set 'read' status
    const merged = generatedNotifications.map(n => {
        const historyItem = notificationHistory.find(h => h.id === n.id);
        return {
            ...n,
            read: historyItem ? historyItem.read : false,
            date: historyItem ? historyItem.timestamp : new Date().toISOString()
        };
    });

    setNotifications(merged);

  }, [campaigns, calendarEvents, notificationSettings, notificationHistory]); // Dep include history to re-render when read status changes

  const markAsRead = (id) => {
      setNotificationHistory(prev => {
          const exists = prev.find(p => p.id === id);
          if (exists) return prev.map(p => p.id === id ? { ...p, read: true } : p);
          return [...prev, { id, read: true, timestamp: new Date().toISOString() }];
      });
  };

  const markAllAsRead = () => {
      const updates = notifications.map(n => ({ id: n.id, read: true, timestamp: new Date().toISOString() }));
      // Merge with existing history intelligently
      setNotificationHistory(prev => {
          const newHistory = [...prev];
          updates.forEach(u => {
              const idx = newHistory.findIndex(h => h.id === u.id);
              if (idx >= 0) newHistory[idx].read = true;
              else newHistory.push(u);
          });
          return newHistory;
      });
  };

  const clearAllNotifications = () => {
      // Logic: If user wants to "Delete" history. But live alerts might come back if condition persists?
      // For "System" notifications based on state, "Deleting" usually means "Ignore for now" or "Mark read".
      // But if user explicitly clears, maybe we should suppress them?
      // For now, let's just mark all read as the "Clear" action on the UI, or actually empty the history?
      // If we empty history, they come back as Unread because they are regenerated! 
      // So "Clear" strictly means "Hide from view" -> maybe a 'deleted' flag?
      // Let's implement 'deleted' status.
      // Simpler: Just map all current to 'read' for now as 'Clear' implies handling them.
      markAllAsRead();
  };

  // Utility to format currency with thousands separator (1.000.000)
  const formatCurrency = (value) => {
    if (!value) return '';
    // Remove non-digits
    const number = value.toString().replace(/\D/g, '');
    try {
        return new Intl.NumberFormat('es-AR').format(number);
    } catch(e) { return value; }
  };

  return (
    <DataContext.Provider value={{
      campaigns,
      setCampaigns, // Export setter if needed for future
      calendarEvents,
      setCalendarEvents, // Export setter
      providerGroups,
      rateCardItems,
      budget,
      notifications,
      setNotifications,
      notificationSettings,
      setNotificationSettings,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      formatCurrency,
      exportData,
      importData,
      actions: {
        addProviderGroup,
        addContact,
        toggleFavoriteContact,
        deleteContact,
        moveGroup,
        deleteGroup,
        saveRateItem,
        deleteRateItem
      }
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
