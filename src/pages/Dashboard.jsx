import React, { useState } from 'react';
import { useCampaigns } from '../hooks/useCampaigns';
import { useTasks } from '../hooks/useTasks';
import { useRoiCalculator } from '../hooks/useRoiCalculator';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { isCampaignInPeriod } from '../utils/dataUtils';
// ... imports
// ... imports
import { LayoutDashboard, TrendingUp, AlertCircle, Activity } from 'lucide-react';

// Modular Components
import Header from '../components/dashboard/Header';
import StrategicView from '../components/dashboard/views/StrategicView';
import OperationalView from '../components/dashboard/views/OperationalView';

const Dashboard = () => {
  // -- DATA LAYER --
  const { data: campaigns = [] } = useCampaigns();
  const { data: calendarEvents = [] } = useCalendarEvents();
  const { addTask } = useTasks();

  // -- STATE LAYER --
  const [viewMode, setViewMode] = useState('strategic'); // 'strategic' | 'operational'
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('Todos'); 
  const [dateFilter, setDateFilter] = useState({ year: 'All', month: 'All' });
  const [isRoiExpanded, setIsRoiExpanded] = useState(false); // Strategy Card State
  
  // Dashboard Config Persistence
  const [dashboardConfig, setDashboardConfig] = useLocalStorage('dashboard-config-v2', {
      showPartners: true,
      showRecentActivity: true, 
      showObjectives: true
  });

  // -- CALCULATED METRICS --
  const metrics = useRoiCalculator(); 

  const filteredCampaigns = campaigns.filter(c => {
      if (campaignFilter !== 'Todos' && c.status !== campaignFilter) return false;
      return isCampaignInPeriod(c.date, dateFilter.year, dateFilter.month);
  });

  const months = ['All', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // -- HANDLERS --
  const handleAddQuickTask = () => {
      const text = prompt("Nueva Tarea Rápida:");
      if(text) addTask(text);
  };

  return (
    <div className="pb-10 space-y-8">
      {/* 1. HEADER (Global Context) */}
      <Header 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        isFilterMenuOpen={isFilterMenuOpen}
        setIsFilterMenuOpen={setIsFilterMenuOpen}
        campaignFilter={campaignFilter}
        setCampaignFilter={setCampaignFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        dashboardConfig={dashboardConfig}
        setDashboardConfig={setDashboardConfig}
        months={months}
      />

      {/* 2. DYNAMIC VIEW RENDER */}
      {viewMode === 'strategic' ? (
          <StrategicView 
              metrics={metrics}
              isRoiExpanded={isRoiExpanded}
              setIsRoiExpanded={setIsRoiExpanded}
              dashboardConfig={dashboardConfig}
          />
      ) : (
          <OperationalView 
              campaigns={campaigns}
              calendarEvents={calendarEvents}
              filteredCampaigns={filteredCampaigns}
              dashboardConfig={dashboardConfig}
              handleAddQuickTask={handleAddQuickTask}
          />
      )}
    </div>
  );
};

export default Dashboard;
