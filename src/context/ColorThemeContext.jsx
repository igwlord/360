import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ColorThemeContext = createContext();

// Define available color palettes for selection
export const AVAILABLE_COLORS = {
    purple: { name: 'Violeta', bg: 'bg-purple-500', text: 'text-purple-200', border: 'border-purple-500', hex: '#a855f7' },
    blue:   { name: 'Azul',    bg: 'bg-blue-500',   text: 'text-blue-200',   border: 'border-blue-500',   hex: '#3b82f6' },
    green:  { name: 'Verde',   bg: 'bg-green-500',  text: 'text-green-200',  border: 'border-green-500',  hex: '#22c55e' },
    red:    { name: 'Rojo',    bg: 'bg-red-500',    text: 'text-red-200',    border: 'border-red-500',    hex: '#ef4444' },
    yellow: { name: 'Amarillo',bg: 'bg-yellow-500', text: 'text-yellow-800', border: 'border-yellow-500', hex: '#eab308' },
    orange: { name: 'Naranja', bg: 'bg-orange-500', text: 'text-orange-200', border: 'border-orange-500', hex: '#f97316' },
    pink:   { name: 'Rosa',    bg: 'bg-pink-500',   text: 'text-pink-200',   border: 'border-pink-500',   hex: '#ec4899' },
    teal:   { name: 'Turquesa',bg: 'bg-teal-500',   text: 'text-teal-200',   border: 'border-teal-500',   hex: '#14b8a6' },
    indigo: { name: 'Indigo',  bg: 'bg-indigo-500', text: 'text-indigo-200', border: 'border-indigo-500', hex: '#6366f1' },
    gray:   { name: 'Gris',    bg: 'bg-gray-500',   text: 'text-gray-200',   border: 'border-gray-500',   hex: '#6b7280' },
};

// Default mappings
const DEFAULT_CATEGORY_COLORS = {
    campaign: 'purple',
    marketing: 'blue',
    deadline: 'red',
    meeting: 'green',
    reminder: 'yellow',
    holiday: 'red',
    // New Project Types
    ongoing: 'teal',
    puntual: 'orange',
    interno: 'gray'
};

export const ColorThemeProvider = ({ children }) => {
    // Persist user choices
    const [categoryColors, setCategoryColors] = useLocalStorage('category-colors-v1', DEFAULT_CATEGORY_COLORS);

    // Helper to get full style object for a category
    const getCategoryStyle = (category) => {
        const colorKey = categoryColors[category] || 'gray';
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
