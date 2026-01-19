/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useConnectivity } from "../hooks/useConnectivity";
import { useAuth } from "./AuthContext"; // Import Auth
import { supabase } from "../supabase/client";
import { CampaignRepository } from "../services/CampaignRepository";
import { SupplierRepository } from "../services/SupplierRepository";
import { RateCardRepository } from "../services/RateCardRepository";
import {
  CAMPAIGNS_DATA,
  PROVIDER_GROUPS_DATA,
  RATE_CARD_DATA,
  CALENDAR_EVENTS_DATA,
} from "../data/initialData";
import holidaysData from "../data/holidays.json";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // --- STATE ---
  const [campaigns, setCampaigns] = useState([]);
  const [calendarEvents, setCalendarEvents] = useLocalStorage("calendar-events", []);
  const [providerGroups, setProviderGroups] = useState([]);
  const [rateCardItems, setRateCardItems] = useState([]);
  const [transactions, setTransactions] = useState([]); // New Billing State
  const [loading, setLoading] = useState(true);

  // Fallback / Initial Load State Tracker
  const { isOffline } = useConnectivity();
  const { user } = useAuth();

  // --- SUPABASE FETCH ---
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Campaigns
      if (!isOffline) {
          const { data, source } = await CampaignRepository.getAll();
          if (source === 'remote' && data) {
              // Dev/Demo Mode: Fallback to Mock Data if DB is empty to prevent "blank app" shock.
              setCampaigns(data.length > 0 ? data : CAMPAIGNS_DATA);
          } else if (source === 'missing_table') {
              // Be silent or fallback
              console.warn("Supabase Campaigns table missing, using local/empty.");
          }
      }

      // 2. Suppliers Map
      let rawSuppliers = [];
      if (!isOffline) {
          const { data, source } = await SupplierRepository.getAll();
          if (source === 'remote' && data) rawSuppliers = data;
      }

      if (rawSuppliers.length === 0 && !isOffline) {
           // Fallback to Mock Data if DB empty
           setProviderGroups(PROVIDER_GROUPS_DATA);
      } else if (rawSuppliers.length > 0) {
        const groups = rawSuppliers.reduce((acc, curr) => {
          const cat = curr.category || "General";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push({
            id: curr.id,
            company: curr.name,
            brand: curr.brand,
            name: curr.contact_name,
            role: curr.contact_role,
            email: curr.contact_email,
            phone: curr.contact_phone,
            website: curr.website,
            isFavorite: curr.is_favorite,
            // Strict Schema: Separate Commercial vs Marketing Contacts
            contacto_comercial_nombre: curr.contact_name,
            contacto_comercial_email: curr.contact_email,
            contacto_comercial_cel: curr.contact_phone,
            contacto_mkt_nombre: curr.contact_mkt_name,
            contacto_mkt_email: curr.contact_mkt_email,
            contacto_mkt_cel: curr.contact_mkt_phone,
            history: curr.history || [],
            groupId: `g-${curr.category}` // Helper for updates
          });
          return acc;
        }, {});
        const formattedGroups = Object.keys(groups).map((key, idx) => ({
          id: `g-${idx}`,
          title: key,
          contacts: groups[key],
        }));
        setProviderGroups(formattedGroups);
      }

      // 3. Rate Card
      if (!isOffline) {
          const { data, source } = await RateCardRepository.getAll();
           if (source === 'remote' && data) {
               setRateCardItems(data.length > 0 ? data : RATE_CARD_DATA);
           }
      }

      // 4. Events
      const { data: evtData, error: evtError } = await supabase
        .from("global_events")
        .select("*");
      if (evtError) throw evtError;

      const mappedEvents = (evtData || []).map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        date: e.date,
        startDay: e.start_day,
        endDay: e.end_day,
        color: e.color,
        textColor: e.text_color,
        description: e.description,
      }));

      // Merge Holidays (Read-only for now, local source)
      const mappedHolidays = holidaysData.map((h, i) => ({
          id: `holiday-${i}`,
          title: h.name,
          type: h.type === 'marketing' ? 'marketing' : 'holiday', // Map to existing types or new 'holiday' type
          date: h.date,
          color: h.type === 'marketing' ? '#db2777' : '#ef4444', // Pink for Mkt, Red for Holidays
          isReadOnly: true
      }));

      setCalendarEvents([...mappedEvents, ...mappedHolidays]);

      // 5. Transactions (Billing)
      const { data: transData, error: transError } = await supabase
        .from("transactions")
        .select("*");
      if (transError && transError.code !== '42P01') { // Ignore if table doesn't exist yet
          console.error("Error fetching transactions:", transError);
      }
      setTransactions(transData || []);


    } catch (error) {
      console.error("Supabase Load Error (Falling back to local data):", error);
      
      // Fallback to Initial Data if empty state matches initialization
      // ONLY valid for Campaigns/Providers to avoid empty screen on first load if truly needed,
      // but for Calendar/RateCard we want strict truth.
      if (campaigns.length === 0) setCampaigns(CAMPAIGNS_DATA);
      if (providerGroups.length === 0) setProviderGroups(PROVIDER_GROUPS_DATA);
      if (rateCardItems.length === 0) setRateCardItems(RATE_CARD_DATA);
      if (calendarEvents.length === 0) setCalendarEvents(CALENDAR_EVENTS_DATA);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]); // Dependency on isOffline to retry

  // Reload data when User changes (Login)
  useEffect(() => {
      fetchData();
  }, [fetchData, user]);

  // --- ACTIONS (Supabase Mutators) ---
  const actions = {
    addProject: async (project) => {
      const newProject = { ...project, id: project.id || Date.now() };
      
      // Auto-Sync to Calendar
      const eventType = project.type ? project.type.toLowerCase() : 'campaign';
      // Normalize 'Campaña' -> 'campaign'
      const normalizedType = eventType === 'campaña' ? 'campaign' : eventType;

      const syncEvent = {
          title: `Project: ${project.name}`,
          type: normalizedType, 
          date: project.date, 
          description: `Linked to Project ID: ${newProject.id}`,
          color: '#3B82F6', // Fallback color (UI should prioritize Context)
          textColor: '#ffffff'
      };

      if (isOffline) {
        setCampaigns((prev) => [...prev, newProject]);
        // Sync Calendar Offline
        setCalendarEvents(prev => [...prev, { ...syncEvent, id: Date.now() }]);
        return;
      }

      // 1. Save Project
      try {
        const savedProject = await CampaignRepository.create(newProject);
        if (savedProject) {
            setCampaigns((prev) => [...prev, savedProject]);
            
            // 2. Sync Calendar (Create Event)
            const realId = savedProject.id;
            const eventPayload = {
                ...syncEvent,
                description: `Linked to Project ID: ${realId}`
            };
            await actions.addEvent(eventPayload);

            // 3. Save Transactions (if any)
            if (project.transactions && project.transactions.length > 0) {
                const transactionsToSave = project.transactions.map(t => ({
                    project_id: realId,
                    amount: t.amount,
                    type: t.type, // 'expense' or 'income'
                    concept: t.note,
                    date: t.date || new Date().toISOString()
                }));
                
                const { error: transError } = await supabase
                    .from('transactions')
                    .insert(transactionsToSave);

                if (transError) console.error("Error saving transactions:", transError);
                else fetchData(); // Refresh to get transactions in state
            }
        }
      } catch (error) {
        console.error("Error adding project:", error);
        throw error; // Rethrow to let UI handle it
      }
    },

    updateProject: async (project) => {
      if (isOffline) {
          setCampaigns(prev => prev.map(c => c.id === project.id ? project : c));
          // Update linked event if found (optimistically)
          setCalendarEvents(prev => prev.map(e => {
              if (e.description && e.description.includes(`Linked to Project ID: ${project.id}`)) {
                  return { ...e, title: `Project: ${project.name}`, date: project.date };
              }
              return e;
          }));
          return;
      }

      // 1. Update Project
      const { error } = await supabase
        .from("campaigns")
        .update(project)
        .eq("id", project.id);

      if (!error) {
          setCampaigns(prev => prev.map(c => c.id === project.id ? project : c));
          
          // 2. Sync Calendar
          // Find the event that links to this project
          const { data: linkedEvents } = await supabase
              .from("global_events")
              .select("*")
              .ilike('description', `%Linked to Project ID: ${project.id}%`);
          
          if (linkedEvents && linkedEvents.length > 0) {
              const eventToUpdate = linkedEvents[0];
              await actions.updateEvent({
                  ...eventToUpdate,
                  title: `Project: ${project.name}`,
                  date: project.date
              });
          }

          // 3. Sync Transactions
          if (project.transactions && project.transactions.length > 0) {
              for (const t of project.transactions) {
                  const transPayload = {
                      project_id: project.id,
                      amount: t.amount,
                      type: t.type,
                      concept: t.note,
                      date: t.date
                  };

                  if (t.id && !String(t.id).startsWith('temp-') && !String(t.id).startsWith('new-') && typeof t.id !== 'number') {
                       // Update existing (UUID) - Assuming number IDs are temp timestamps
                       await supabase.from('transactions').update(transPayload).eq('id', t.id);
                  } else {
                       // Create new
                       await supabase.from('transactions').insert([transPayload]);
                  }
              }
              // Ideally handle deletions too, but that's complex without tracking deleted IDs. 
              // For now, assume add/update. Project Modal "delete" button for transaction should call deleteTransaction directly?
              // The implementation in Projects.jsx removes from local array 'form.transactions'.
              // We need a way to reconcile.
              // Simpler approach for now:
              // The current 'handleSave' in Projects.jsx passes the whole array.
              // To handle deletions correctly without complex diffing:
              //   a) Delete all for this project and re-insert? (Risky for IDs/logs)
              //   b) Only insert/update, and expose a separate 'deleteTransaction' action which Projects.jsx calls immediately on trash click?
              // Let's stick to Insert/Update here. Deletion in Projects.jsx is local only.
              // We should fix Projects.jsx to call deleteTransaction immediately OR track deleted IDs.
              // DECISION: We will modify Projects.jsx to handle deletion immediately via action, and here we just handle manual adds/edits.
              fetchData(); 
          }

      } else {
          console.error("Error updating project:", error);
      }
    },

    deleteProject: async (id) => {
       if (isOffline) {
           setCampaigns(prev => prev.filter(c => c.id !== id));
           // Remove linked event
           setCalendarEvents(prev => prev.filter(e => !e.description?.includes(`Linked to Project ID: ${id}`)));
           return;
       }

       const { error } = await supabase
           .from("campaigns")
           .delete()
           .eq("id", id);
       
       if (!error) {
           setCampaigns(prev => prev.filter(c => c.id !== id));
           
           // Sync Calendar: Delete linked event
            const { data: linkedEvents } = await supabase
              .from("global_events")
              .select("id")
              .ilike('description', `%Linked to Project ID: ${id}%`);
            
            if (linkedEvents && linkedEvents.length > 0) {
                await actions.deleteEvent(linkedEvents[0].id);
            }
       } else {
           console.error("Error deleting project:", error);
       }
    },

    // Transactions Actions
    addTransaction: async (t) => {
        const newTrans = { ...t, id: t.id || Date.now() };
        if (isOffline) {
            setTransactions(prev => [...prev, newTrans]);
            return;
        }
        const { data, error } = await supabase.from('transactions').insert([newTrans]).select();
        if (!error && data) {
            setTransactions(prev => [...prev, data[0]]);
        } else {
            console.error("Error adding transaction:", error);
            // Optimistic
            setTransactions(prev => [...prev, newTrans]); 
        }
    },

    updateTransaction: async (t) => {
        if (isOffline) {
            setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
            return;
        }
        const { error } = await supabase.from('transactions').update(t).eq('id', t.id);
        if (!error) {
            setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
        } else {
             console.error("Error updating transaction:", error);
        }
    },

    deleteTransaction: async (id) => {
        if (isOffline) {
            setTransactions(prev => prev.filter(x => x.id !== id));
            return;
        }
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) {
            setTransactions(prev => prev.filter(x => x.id !== id));
        } else {
            console.error("Error deleting transaction:", error);
        }
    },

    // Alias for legacy support if needed (or remove if fully migrated)
    addCampaign: async (camp) => actions.addProject(camp),

    addContact: async (contactData) => {
      if (isOffline) {
          // Offline Fallback for Contact
           const newContact = {
                id: contactData.id || `new-${Date.now()}`,
                ...contactData,
                history: contactData.history || []
           };

           setProviderGroups(prev => prev.map(g => {
               if (g.id === contactData.groupId) {
                   // Check if update or add
                   const exists = g.contacts.find(c => c.id === contactData.id);
                   if (exists) {
                       return { ...g, contacts: g.contacts.map(c => c.id === contactData.id ? newContact : c) };
                   }
                   return { ...g, contacts: [...g.contacts, newContact] };
               }
               return g;
           }));
           return;
      }
      
      // ... Supabase logic ...
      const group = providerGroups.find((g) => g.id === contactData.groupId);
      const category = group ? group.title : "General";
      const dbPayload = {
        category,
        name: contactData.proveedor || contactData.company, 
        brand: contactData.marca || contactData.brand,
        // Contact Commercial
        contact_name: contactData.contacto_comercial_nombre || contactData.name, 
        contact_email: contactData.contacto_comercial_email || contactData.email,
        contact_phone: contactData.contacto_comercial_cel || contactData.phone,
        // Marketing 
        contact_mkt_name: contactData.contacto_mkt_nombre,
        contact_mkt_email: contactData.contacto_mkt_email,
        contact_mkt_phone: contactData.contacto_mkt_cel,
        
        website: contactData.website,
        is_favorite: contactData.isFavorite,
        history: contactData.history || [],
        // If updating, include ID
        ...(contactData.id && !String(contactData.id).startsWith("new-") ? { id: contactData.id } : {})
      };
      
      try {
          if (dbPayload.id) {
             await SupplierRepository.update(dbPayload);
          } else {
             await SupplierRepository.create(dbPayload);
          }
          fetchData();
      } catch (e) {
          console.error("Error saving contact:", e);
      }
    },

    deleteContact: async (id) => {
      await supabase.from("suppliers").delete().eq("id", id);
      fetchData();
    },

    addInteraction: async (contactId, interaction) => {
      const newEntry = {
            ...interaction,
            id: `int-${Date.now()}`,
            timestamp: new Date().toISOString(),
      };

      if (isOffline) {
          // Offline Fallback for Interaction
          setProviderGroups(prev => prev.map(g => ({
              ...g,
              contacts: g.contacts.map(c => {
                  if (c.id === contactId) {
                      return { ...c, history: [...(c.history || []), newEntry] };
                  }
                  return c;
              })
          })));
          return;
      }
      
      try {
        // First fetch the raw record to get current JSONB history
        const { data: supplier, error } = await supabase
          .from("suppliers")
          .select("history")
          .eq("id", contactId)
          .single();

        if (error) throw error;

        if (supplier) {
            // Append to existing history
          const updatedHistory = [...(supplier.history || []), newEntry];

          await supabase
            .from("suppliers")
            .update({ history: updatedHistory })
            .eq("id", contactId);
            
          fetchData(); // Refresh UI
        }
      } catch (e) {
        console.error("Interaction update failed", e);
      }
    },

    saveRateItem: async (item) => {
      try {
          if (item.id && !String(item.id).startsWith("t-")) {
             await RateCardRepository.update(item);
          } else {
             await RateCardRepository.create(item);
          }
          fetchData();
      } catch (e) {
          console.error("Error saving rate item:", e);
      }
    },

    deleteRateItem: async (id) => {
      await supabase.from("rate_card").delete().eq("id", id);
      fetchData();
    },

    // Events
    addEvent: async (evt) => {
      const newEvent = { ...evt, id: evt.id || Date.now() };
      
      if (isOffline) {
        setCalendarEvents((prev) => [...prev, newEvent]);
        return;
      }

      const dbPayload = {
        title: evt.title,
        type: evt.type,
        date: evt.date,
        start_day: evt.startDay,
        end_day: evt.endDay,
        color: evt.color,
        text_color: evt.textColor,
        description: evt.description,
      };

      const { data, error } = await supabase
        .from("global_events")
        .insert([dbPayload])
        .select();
        
      if (error) {
           console.error("Error adding event:", error);
           // Optimistic fallback on error
           setCalendarEvents((prev) => [...prev, newEvent]);
      } else if (data && data[0]) {
           const saved = data[0];
           const mapped = {
                id: saved.id,
                title: saved.title,
                type: saved.type,
                date: saved.date,
                startDay: saved.start_day,
                endDay: saved.end_day,
                color: saved.color,
                textColor: saved.text_color,
                description: saved.description
           };
           // Replace temp timestamp ID with real ID if we want, or just append mapped
           // Since we didn't add temp one before, just append.
           setCalendarEvents((prev) => [...prev, mapped]);
      }
    },

    updateEvent: async (evt) => {
        if (isOffline) {
            setCalendarEvents(prev => prev.map(e => e.id === evt.id ? evt : e));
            return;
        }

        const dbPayload = {
            title: evt.title,
            type: evt.type,
            date: evt.date,
            start_day: evt.startDay,
            end_day: evt.endDay,
            color: evt.color,
            text_color: evt.textColor,
            description: evt.description,
        };

        const { error } = await supabase
            .from("global_events")
            .update(dbPayload)
            .eq("id", evt.id);

        if (error) {
            console.error("Error updating event:", error);
             // Optimistic fallback
            setCalendarEvents(prev => prev.map(e => e.id === evt.id ? evt : e));
        } else {
            fetchData();
        }
    },

    deleteEvent: async (id) => {
        // 1. Optimistic Update (Immediate Feedback)
        const previousEvents = [...calendarEvents];
        setCalendarEvents(prev => prev.filter(e => e.id !== id));

        if (isOffline) return;

        const { error } = await supabase
            .from("global_events")
            .delete()
            .eq("id", id);

        if (error) {
             console.error("Error deleting event:", error);
             // Rollback
             setCalendarEvents(previousEvents);
             alert("Error al eliminar evento. Verifica tu conexión.");
        }
        // No fetchData() on success to prevent race conditions vs optimistic state
    },

    // Tasks - Local only for now (No table confirmed)
    addTask: (text) =>
      setTasks([
        ...tasks,
        { id: Date.now(), text, done: false, date: new Date().toISOString() },
      ]),
    toggleTask: (id) =>
      setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    updateTask: (id, updates) =>
      setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))),
    removeTask: (id) => setTasks(tasks.filter((t) => t.id !== id)),
    clearCompletedTasks: () => setTasks(tasks.filter((t) => !t.done)),
  };

  // --- HELPERS RESTORED ---

  // Dynamic Budget Calculation
  const budget = React.useMemo(() => {
    const parse = (val) => {
      if (typeof val === "number") return val;
      return parseFloat(val?.toString().replace(/[^0-9.-]+/g, "") || 0);
    };

    let total = 0;
    let executed = 0;

    campaigns.forEach((c) => {
      const cost = parse(c.cost || 0);
      total += cost;
      // Simple executed logic based on progress if transactions missing
      executed += (cost * (c.progress || 0)) / 100;
    });

    return {
      total: total / 1000000,
      executed: executed / 1000000,
      percentage: total > 0 ? (executed / total) * 100 : 0,
    };
  }, [campaigns]);

  // Tasks
  const [tasks, setTasks] = useLocalStorage("tasks-data", [
    {
      id: 1,
      text: "Aprobar Presupuesto Q2",
      done: false,
      date: new Date().toISOString(),
    },
  ]);

  // Notifications Logic
  const [notificationSettings, setNotificationSettings] = useLocalStorage(
    "notification-settings",
    {
      channels: { email: false, inApp: true, push: false },
      thresholds: { 
        budgetPercent: 90, 
        deadlineDays: 3, 
        ephemerisDays: 60, 
        startWarningHours: 24 
      },
      types: { campaign: true, marketing: true, deadline: true, meeting: true, reminder: true },
      enabled: true,
    }
  );
  const [notificationHistory, setNotificationHistory] = useLocalStorage(
    "notification-history",
    []
  );
  const [notifications, setNotifications] = useState([]);

  // Date Parser Helper
  const parseSpanishDate = (dateStr) => {
    if (!dateStr) return null;
    // Format "10 Ene" or "10 Ene - 15 Feb"
    const months = {
       'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
       'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    };
    
    try {
        const parts = dateStr.split('-')[0].trim().split(' '); // Take first date "10 Ene"
        if (parts.length < 2) return null;
        
        const day = parseInt(parts[0], 10);
        const monthKey = parts[1].toLowerCase().slice(0, 3);
        const month = months[monthKey];
        
        if (month === undefined) return null;
        
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, month, day);
        
        // Handle year crossover (e.g. It's Dec, date is Jan) -> Next Year
        // Or past dates? For notifications we usually look ahead.
        // Simple logic: if date is more than 6 months ago, assume next year?
        // Better: if date < today - 30 days, maybe it's next year? 
        // For "starts in N hours", we assume nearby future.
        
        return date;
    } catch {
        return null;
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!notificationSettings?.enabled) {
      setNotifications([]);
      return;
    }

    const generatedNotifications = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. PROJECT PROGRESS (Existing)
    campaigns.forEach((c) => {
      if (c.status === "En Curso" && c.progress < 20) {
        generatedNotifications.push({
          id: `warn-${c.id}`,
          title: `Bajo Progreso: ${c.name}`,
          type: "warning",
          category: 'campaign', // Add category for filtering/color
          msg: "La campaña está activa pero con poco avance.",
        });
      }
    });

    // 2. EPHEMERIS (60 Days Before)
    // Using generic threshold if not set, default 60
    const ephemerisDays = notificationSettings.thresholds?.ephemerisDays || 60;
    
    calendarEvents.forEach(evt => {
        if (['marketing', 'holiday'].includes(evt.type)) {
            const evtDate = new Date(evt.date); // Provided date is usually ISO YYYY-MM-DD from calendar/json
            if (isNaN(evtDate.getTime())) return;
            
            // Calc diff
            const diffTime = evtDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === ephemerisDays) {
                 generatedNotifications.push({
                    id: `eph-${evt.id}-${today.toISOString().split('T')[0]}`, // Unique per day
                    title: `Gestión Proveedor: ${evt.title}`,
                    type: "info",
                    category: 'marketing',
                    msg: `Faltan ${ephemerisDays} días. Es momento de contactar proveedores.`,
                 });
            }
        }
    });

    // 3. PROJECT START (N Hours/Days Before)
    // settings uses 'startWarningHours', usually 24, 48 etc.
    const startHours = notificationSettings.thresholds?.startWarningHours || 24;
    const startDaysThreshold = Math.ceil(startHours / 24); // e.g. 1 or 2 days

    campaigns.forEach(c => {
        if (c.status === 'Planificación') {
            const startDate = parseSpanishDate(c.date);
            if (startDate) {
                 const diffTime = startDate - today;
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                 if (diffDays >= 0 && diffDays <= startDaysThreshold) {
                      generatedNotifications.push({
                        id: `start-${c.id}-${today.toISOString().split('T')[0]}`,
                        title: `Inicio Próximo: ${c.name}`,
                        type: "alert",
                        category: 'deadline',
                        msg: `El proyecto inicia en ${diffDays === 0 ? 'menos de 24h' : diffDays + ' días'}.`,
                     });
                 }
            }
        }
    });

    // Merge with History
    const merged = generatedNotifications.map((n) => {
      const historyItem = notificationHistory.find((h) => h.id === n.id);
      return {
        ...n,
        read: historyItem ? historyItem.read : false,
        date: historyItem ? historyItem.timestamp : new Date().toISOString(),
      };
    });
    setNotifications(merged);
  }, [campaigns, calendarEvents, notificationSettings, notificationHistory]);

  const markAsRead = (id) => {
    setNotificationHistory((prev) => {
      const exists = prev.find((p) => p.id === id);
      if (exists)
        return prev.map((p) => (p.id === id ? { ...p, read: true } : p));
      return [...prev, { id, read: true, timestamp: new Date().toISOString() }];
    });
  };

  const markAllAsRead = () => {
    const updates = notifications.map((n) => ({
      id: n.id,
      read: true,
      timestamp: new Date().toISOString(),
    }));
    setNotificationHistory((prev) => {
      const newHistory = [...prev];
      updates.forEach((u) => {
        const idx = newHistory.findIndex((h) => h.id === u.id);
        if (idx >= 0) newHistory[idx].read = true;
        else newHistory.push(u);
      });
      return newHistory;
    });
  };

  const clearAllNotifications = markAllAsRead;

  // Utilities
  const formatCurrency = (value) => {
    if (!value) return "";
    const number = value.toString().replace(/\D/g, "");
    try {
      return new Intl.NumberFormat("es-AR").format(number);
    } catch {
      return value;
    }
  };

  const addEvent = actions.addEvent; // Use the action which handles offline/supabase

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      campaigns,
      calendarEvents,
      providerGroups,
      rateCardItems,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const importData = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        // Validations could go here
        // Ideally we would merge data + IDs
        console.warn("Import logic unimplemented for Cloud Mode, but preventing crash.");
        return { success: false, message: "La importación no está disponible en modo nube." };
    } catch (e) {
        return { success: false, message: "Archivo inválido." };
    }
  };

  return (
    <DataContext.Provider
      value={{
        campaigns, // Keep for legacy if needed, or remove if fully migrated. Safer to keep alias.
        projects: campaigns, // Alias for new UI
        setCampaigns,
        setProjects: setCampaigns,
        addProject: actions.addProject,
        updateProject: actions.updateProject,
        deleteProject: actions.deleteProject,
        addCampaign: actions.addProject, // Alias legacy
        calendarEvents,
        transactions,
        addTransaction: actions.addTransaction,
        updateTransaction: actions.updateTransaction,
        deleteTransaction: actions.deleteTransaction,
        addEvent,
        setCalendarEvents,
        providerGroups,
        rateCardItems,
        budget,
        tasks,
        setTasks,
        loading,
        isOffline,
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
        actions,
        fetchData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
