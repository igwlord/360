
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

const ContextMenu = ({ options, position, onClose }) => {
    const { theme } = useTheme();
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleScroll = () => {
             onClose();
        };
        
        // Slight delay to prevent the initial click that opened it from closing it immediately if bubbling issues occur
        // But usually "onContextMenu" prevents default.
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true); 
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose]);

    if (!position) return null;

    // Adjust position to not overflow viewport
    const style = {
        top: position.y,
        left: position.x,
    };
    
    // Logic to flip if close to edge could be added here, but keeping simple for now.

    return (
        <div 
            ref={menuRef}
            style={{ 
                top: position.y, 
                left: position.x, 
                zIndex: 9999 
            }}
            className={`fixed min-w-[180px] ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1`}
        >
            {options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => {
                        option.action();
                        onClose();
                    }}
                    className={`text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                        option.danger 
                        ? 'text-red-400 hover:bg-red-500/10' 
                        : `${theme.text} hover:bg-white/10`
                    }`}
                >
                    {option.icon && <span>{option.icon}</span>}
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ContextMenu;
