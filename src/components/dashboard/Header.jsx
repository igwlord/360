import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Activity, Briefcase, Sliders, Filter, Clock, Eye } from 'lucide-react';
import { FilterPill, VisibilityToggle } from './Widgets';

const Header = ({ 
    viewMode, 
    setViewMode, 
    isFilterMenuOpen, 
    setIsFilterMenuOpen, 
    campaignFilter, 
    setCampaignFilter, 
    dateFilter, 
    setDateFilter, 
    dashboardConfig, 
    setDashboardConfig,
    months 
}) => {
    const { theme } = useTheme();

    return (
      <>
      <header className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4 relative z-30">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme.text} drop-shadow-sm tracking-tight`}>Dashboard 2026</h1>
          <p className={`${theme.textSecondary} text-sm mt-1`}>Centro de Comando • {viewMode === 'strategic' ? 'Vista Estratégica' : 'Vista Operativa'}</p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* View Toggle - REMOVED (Obsolete with new Matrix Layout) */}
            {/* <div className="bg-black/20 p-1 rounded-xl border border-white/10 flex">...</div> */}

            {/* Legacy Filter Menu - REMOVED per UX Audit */}
        </div>
      </header>
      
      {/* Overlay to close menu */}
      
      </>
    );
};

export default Header;
