import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { importData, exportData } from '../utils/dataUtils';
import { Shield, Palette, Save, Upload } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const { theme, setTheme, currentThemeKey } = useTheme();
    const { addToast } = useToast();
    
    // Backup Logic
    const fileInputRef = React.useRef(null);
    const handleRestore = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = importData(event.target.result);
            addToast(result.message, result.success ? 'success' : 'error');
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto pr-2">
            <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Configuración</h1>
            <p className={`${theme.textSecondary} text-sm mb-6`}>Personaliza tu experiencia y preferencias de alerta.</p>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-20">
                
                {/* 1. Apparence & Theme */}
                <section className={`${theme.cardBg} backdrop-blur-md p-6 rounded-2xl border border-white/5`}>
                    <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                        <Palette size={20} className={theme.accent} /> Apariencia
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['tilo', 'deep', 'lirio'].map((tName) => (
                            <button
                                key={tName}
                                onClick={() => setTheme(tName)}
                                className={`relative p-4 rounded-xl border transition-all ${currentThemeKey === tName ? `border-${theme.accent.split('-')[1]} bg-white/5 shadow-lg` : 'border-white/10 hover:bg-white/5'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`font-bold capitalize ${theme.text}`}>{tName}</span>
                                    {currentThemeKey === tName && <div className={`w-3 h-3 rounded-full ${theme.accentBg}`}></div>}
                                </div>
                                <div className="flex gap-2">
                                    <div className={`w-6 h-6 rounded-full border border-white/20 theme-${tName}-bg`}></div> 
                                    <div className={`text-xs ${theme.textSecondary}`}>
                                        {tName === 'tilo' ? 'Verde Bosque' : tName === 'deep' ? 'Azul Noche' : 'Rojo Vino'}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 3. Security & Data - SIMPLIFIED */}
                <section className={`${theme.cardBg} backdrop-blur-md p-6 rounded-2xl border border-white/5`}>
                     <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                        <Shield size={20} className={theme.accent} /> Seguridad y Datos
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                             <p className={`text-sm font-bold ${theme.text}`}>Datos y Seguridad</p>
                             <p className="text-xs text-white/40">Gestiona tus copias de seguridad locales.</p>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleRestore} 
                                className="hidden" 
                                accept=".json"
                            />
                            <button 
                                onClick={() => fileInputRef.current.click()}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs font-bold ${theme.text}`}
                            >
                                <Upload size={14} /> Restaurar
                            </button>
                            <button 
                                onClick={() => { exportData(); addToast('Backup descargado', 'success'); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accentBg} text-black border border-transparent shadow-lg transition-all hover:scale-105 text-xs font-bold`}
                            >
                                <Save size={14} /> Descargar
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
