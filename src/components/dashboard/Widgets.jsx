
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

export const DonutChart = ({ percentage }) => {
  const { theme } = useTheme();
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Custom stroke color logic based on theme
  const strokeColor = theme.name === 'Lirio' ? '#D4AF37' : theme.name === 'Deep' ? '#FCA311' : '#EEA83B';

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx="64" cy="64" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="12" fill="transparent" />
        <circle 
          cx="64" cy="64" r={radius} 
          stroke={strokeColor} 
          strokeWidth="12" 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" 
        />
      </svg>
      <div className={`absolute ${theme.text} font-bold text-xl drop-shadow-md`}>{Math.round(percentage)}%</div>
    </div>
  );
};

export const FilterPill = ({ label, active, onClick }) => {
  const { theme } = useTheme();
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all w-full text-left flex items-center justify-between ${active ? `${theme.accentBg} text-black` : `bg-white/5 ${theme.textSecondary} hover:bg-white/10`}`}>
      {label} {active && <CheckCircle size={12} />}
    </button>
  );
};

export const VisibilityToggle = ({ label, isActive, onToggle }) => {
  const { theme } = useTheme();
  return (
    <button onClick={onToggle} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all w-full ${isActive ? 'bg-white/10 ' + theme.text : `bg-transparent ${theme.textSecondary} hover:bg-white/5`}`}>
      <span>{label}</span> {isActive ? <Eye size={14} className={theme.accent} /> : <EyeOff size={14} />}
    </button>
  );
};
