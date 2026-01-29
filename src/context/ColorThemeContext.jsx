import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AVAILABLE_COLORS } from '../constants/colorThemes';

const ColorThemeContext = createContext();

// Default mappings
// Default mappings
const DEFAULT_CATEGORY_COLORS = {
    // Audit Standards
    'Campaña': 'purple',
    'campaña': 'purple',
    'projects': 'purple',
    
    'Eventos': 'blue', // Marketing
    'eventos': 'blue',
    'marketing': 'blue',
    
    'deadline': 'red',
    'deadlines': 'red',
    
    'meeting': 'green',
    'meetings': 'green',
    'reuniones': 'green',
    
    'reminder': 'orange',
    'reminders': 'orange',
    'recordatorios': 'orange',
    
    'Especiales': 'yellow', // Hitos/Gold
    'especiales': 'yellow',
    'hitos': 'yellow',
    
    // Legacy/Fallbacks
    'holiday': 'red',
    'ongoing': 'teal',
    'puntual': 'orange',
    'interno': 'gray'
};

export const ColorThemeProvider = ({ children }) => {
    // Persist user choices
    const [categoryColors, setCategoryColors] = useLocalStorage('category-colors-v2', DEFAULT_CATEGORY_COLORS); // Bump version to force reset

    // Helper to get full style object for a category
    const getCategoryStyle = (category) => {
        // Normalize input
        const key = String(category).toLowerCase();
        
        // Direct match or search in keys
        let colorKey = 'gray';
        
        // 1. Try direct match in keys (case insensitive)
        const entries = Object.entries(categoryColors);
        const match = entries.find(([k]) => k.toLowerCase() === key);
        
        if (match) {
            colorKey = match[1];
        } else {
             // 2. Fallback logic for unmapped types
             if (key.includes('campaña')) colorKey = 'purple';
             else if (key.includes('evento')) colorKey = 'blue';
             else if (key.includes('reunión')) colorKey = 'green';
        }

        return AVAILABLE_COLORS[colorKey] || AVAILABLE_COLORS['gray'];
    };

    // Helper to get Tailwind classes string directly
    const getCategoryClasses = (category, variant = 'badge') => {
        const style = getCategoryStyle(category);
        if (variant === 'badge') {
            return `${style.bg}/20 ${style.text} ${style.border}/30`;
        }
        if (variant === 'solid') {
            return `${style.bg} text-white`; // Simplified text color for solid backgrounds
        }
        return '';
    };

    const updateCategoryColor = (category, colorKey) => {
        if (AVAILABLE_COLORS[colorKey]) {
            setCategoryColors(prev => ({ ...prev, [category]: colorKey }));
        }
    };

    return (
        <ColorThemeContext.Provider value={{
            categoryColors,
            updateCategoryColor,
            getCategoryStyle,
            getCategoryClasses,
            availableColors: Object.entries(AVAILABLE_COLORS).map(([k, v]) => ({ id: k, ...v }))
        }}>
            {children}
        </ColorThemeContext.Provider>
    );
};

export const useColorTheme = () => {
    const context = useContext(ColorThemeContext);
    if (!context) {
        throw new Error('useColorTheme must be used within a ColorThemeProvider');
    }
    return context;
};
