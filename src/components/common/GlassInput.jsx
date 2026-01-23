import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const GlassInput = ({ 
    label, 
    icon, 
    multiline = false, 
    className = '', 
    error, 
    rows = 3,
    ...props 
}) => {
    const { theme } = useTheme();

    const baseClasses = `w-full ${theme.inputBg} border rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none transition-colors placeholder-white/30`;
    const borderClass = error ? 'border-red-400' : 'border-white/10';
    const paddingLeftClass = icon ? 'pl-10' : '';

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="text-xs text-white/50 mb-1 block uppercase tracking-wider font-medium">
                    {label}
                </label>
            )}
            
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                        {icon}
                    </div>
                )}
                
                {multiline ? (
                    <textarea
                        rows={rows}
                        className={`${baseClasses} ${borderClass} ${paddingLeftClass} resize-none`}
                        {...props}
                    />
                ) : (
                    <input
                        className={`${baseClasses} ${borderClass} ${paddingLeftClass}`}
                        {...props}
                    />
                )}
            </div>
            
            {error && <span className="text-xs text-red-400 mt-1 block">{error}</span>}
        </div>
    );
};

export default GlassInput;
