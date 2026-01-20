
/**
 * Utility functions for data manipulation, formatting and parsing.
 * Centralizes logic previously scattered in hooks and components.
 */

// --- Currency & Numbers ---

export const parseCurrency = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Remove '$', '.', and keep only numbers and maybe a decimal comma/point if needed
    // Assuming format $4.500.000 or $4,500,000. 
    // Basic approach: eliminate everything except digits.
    // WARNING: This assumes inputs are Integers for now as per common usage in this app ($4.500.000)
    return parseFloat(val.toString().replace(/[^0-9]/g, '')) || 0;
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
};

// --- Dates ---

export const MONTHS_MAP = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
};

/**
 * Parses a campaign date string like "08 Ene - 11 Ene" or "Feb 2026"
 * Returns an object with { year, monthIndex, isValid } for filtering.
 */
export const parseCampaignDate = (dateStr) => {
    if (!dateStr) return { year: new Date().getFullYear(), monthIndex: -1, isValid: false };
    
    const lower = dateStr.toLowerCase();
    
    // Check for explicit year
    const yearMatch = lower.match(/20[2-3][0-9]/);
    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear(); // Default to current year if not found
    
    // Check for month name
    let monthIndex = -1;
    for (const [key, val] of Object.entries(MONTHS_MAP)) {
        if (lower.includes(key)) {
            monthIndex = val;
            break; // Take the first matching month (e.g. Start month)
        }
    }
    
    return { year, monthIndex, isValid: monthIndex !== -1 };
};

/**
 * Checks if a campaign matches the selected filters (Year/Month)
 */
export const isCampaignInPeriod = (campaignDateStr, filterYear, filterMonthShort) => {
    const { year, monthIndex } = parseCampaignDate(campaignDateStr);
    
    // 1. Year Check
    if (filterYear !== 'All' && year !== filterYear) return false;
    
    // 2. Month Check
    if (filterMonthShort === 'All') return true;
    
    const targetMonthIndex = MONTHS_MAP[filterMonthShort.toLowerCase()];
    if (targetMonthIndex === undefined) return true; // Should not happen
    
    return monthIndex === targetMonthIndex;
};

// --- Backup & Restore ---

export const exportData = () => {
    try {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_360_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true, message: 'Copia de seguridad descargada' };
    } catch (error) {
        console.error('Export error:', error);
        return { success: false, message: 'Error al exportar datos' };
    }
};

export const importData = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        if (!data || typeof data !== 'object') throw new Error('Format Invalid');
        
        Object.keys(data).forEach(key => {
            localStorage.setItem(key, data[key]);
        });
        
        // Trigger a custom event or storage event if needed, but for now simple restore
        window.dispatchEvent(new Event('storage')); 
        
        return { success: true, message: 'Datos restaurados correctamente' };
    } catch (error) {
        console.error('Import error:', error);
        return { success: false, message: 'Error: Archivo de respaldo inválido' };
    }
};
