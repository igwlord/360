import React, { memo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Activity, Briefcase, Sliders, Filter, Clock, Eye, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { FilterPill, VisibilityToggle } from './Widgets';
import { useSync } from '../../context/SyncContext';

const Header = memo(({ 
    viewMode, 
    setViewMode
}) => {
    const { theme } = useTheme();
    const { isOnline, isSyncing } = useSync();

    return (
      <>
      <header className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4 relative z-30">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme.text} drop-shadow-sm tracking-tight`}>Dashboard 2026</h1>
          <p className={`${theme.textSecondary} text-sm mt-1 flex items-center gap-2`}>
            Centro de Comando • {viewMode === 'strategic' ? 'Vista Estratégica' : 'Vista Operativa'}
            {/* Sync Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border transition-all ${
                !isOnline ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 
                isSyncing ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                'bg-green-500/10 border-green-500/30 text-green-400'
            }`}>
                {!isOnline && <><CloudOff size={10} /> OFFLINE</>}
                {isOnline && isSyncing && <><RefreshCw size={10} className="animate-spin" /> SYNCING</>}
                {isOnline && !isSyncing && <><CheckCircle2 size={10} /> ONLINE</>}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-black/20 p-1 rounded-xl border border-white/10 flex">
                <button 
                    onClick={() => setViewMode('strategic')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'strategic' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    <Eye size={14} />
                    <span className="hidden md:inline">Estratégica</span>
                </button>
                <button 
                    onClick={() => setViewMode('operational')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'operational' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                    <Activity size={14} />
                    <span className="hidden md:inline">Operativa</span>
                </button>
            </div>

            {/* Legacy Filter Menu - REMOVED per UX Audit */}
        </div>
      </header>
      
      {/* Overlay to close menu */}
      
      </>
    );
});

Header.displayName = 'Header';

export default Header;
