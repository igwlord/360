import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCampaigns } from '../hooks/useCampaigns';
import { useTasks } from '../hooks/useTasks';
import { useRoiCalculator } from '../hooks/useRoiCalculator';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { isCampaignInPeriod } from '../utils/dataUtils';
import { LayoutDashboard, TrendingUp, AlertCircle, Activity } from 'lucide-react';

// Modular Components
import Header from '../components/dashboard/Header';
import FinancialPulse from '../components/dashboard/widgets/FinancialPulse';
import ProjectTimeline from '../components/dashboard/widgets/ProjectTimeline';
import QuickActions from '../components/dashboard/widgets/QuickActions';
import SmartAlerts from '../components/dashboard/widgets/SmartAlerts';
import RetailerShareWidget from '../components/dashboard/RetailerShareWidget';
import ObjectivesWidget from '../components/dashboard/ObjectivesWidget';

const Dashboard = () => {
  const { theme } = useTheme();
  
  // -- DATA LAYER --
  const { data: campaigns = [] } = useCampaigns();
  const { data: calendarEvents = [] } = useCalendarEvents();
  const { addTask } = useTasks();

  // -- STATE LAYER --
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
        viewMode="matrix" 
        setViewMode={() => {}} 
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

      {/* 2. CONTROL MATRIX (Unified High-Density Layout) */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          
          {/* ZONE 1: FINANCIAL HEALTH (The "Big Picture") */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2">
                   <FinancialPulse 
                      metrics={metrics} 
                      isExpanded={isRoiExpanded} 
                      setIsExpanded={setIsRoiExpanded} 
                   />
               </div>
               
               {/* Market Share / Intelligence */}
               <div className="flex flex-col gap-4">
                    <RetailerShareWidget data={metrics.retailerShare} />
                    
                    {/* Mini KPI Card: Burn Rate (Mockup for Phase 5 Plan) */}
                    <div className={`${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between`}>
                        <div>
                             <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Burn Rate (Est.)</p>
                             <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">$12.4k</span>
                                <span className="text-xs text-white/50">/día</span>
                             </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                             <TrendingUp size={18} />
                        </div>
                    </div>
               </div>
          </div>

          {/* ZONE 2: TACTICAL OPERATIONS (Execution) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
               
               {/* Column 1: Alerts (Critical) */}
               <div className="lg:col-span-1 h-full">
                    <div className="h-full min-h-[300px]">
                        <SmartAlerts campaigns={campaigns} events={calendarEvents} />
                    </div>
               </div>

               {/* Column 2 & 3: Timeline (Activity) */}
               <div className="lg:col-span-2 flex flex-col gap-6">
                   {dashboardConfig.showRecentActivity && (
                       <div className="flex-1 min-h-[250px]">
                           <ProjectTimeline campaigns={filteredCampaigns} showRecentActivity={true} />
                       </div>
                   )}
               </div>

               {/* Column 4: Quick Actions & Objectives */}
               <div className="lg:col-span-1 space-y-6">
                    <QuickActions onAddQuickTask={handleAddQuickTask}/>
                    {dashboardConfig.showObjectives && <ObjectivesWidget />}
               </div>
          </div>

      </div>
    </div>
  );
};

export default Dashboard;
