import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Bell, Shield, Palette, Save, Moon, Sun, Smartphone, Mail, AlertTriangle, Monitor, CheckCircle, Clock, ChevronDown, Upload, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useColorTheme } from '../context/ColorThemeContext';

const Settings = () => {
    const { theme, setTheme, currentThemeKey } = useTheme();
    const { notificationSettings, setNotificationSettings, exportData, importData } = useData();
    const { showToast: addToast } = useToast(); // Renamed to addToast as per instruction

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

    const toggleChannel = (key) => {
        setNotificationSettings(prev => ({
            ...prev,
            channels: { ...prev.channels, [key]: !prev.channels[key] }
        }));
    };

    const updateThreshold = (key, value) => {
         setNotificationSettings(prev => ({
            ...prev,
            thresholds: { ...prev.thresholds, [key]: Number(value) }
        }));
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
                                    {/* Note: In real CSS we'd use the vars, here just mocking squares or using logic not fully available. 
                                        Let's just use text description or generic circles based on known colors 
                                    */}
                                    <div className={`text-xs ${theme.textSecondary}`}>
                                        {tName === 'tilo' ? 'Verde Bosque' : tName === 'deep' ? 'Azul Noche' : 'Rojo Vino'}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 1. Visual Customization */}
                <section className={`${theme.cardBg} backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl relative z-30`}>
                    <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                        <Palette size={20} className={theme.accent} /> Personalización Visual
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ColorPicker category="campaign" label="Proyectos" />
                        <ColorPicker category="marketing" label="Marketing / Efemérides" />
                        <ColorPicker category="deadline" label="Deadlines (Urgente)" />
                        <ColorPicker category="meeting" label="Reuniones" />
                        <ColorPicker category="reminder" label="Recordatorios" />
                    </div>
                </section>

                {/* 2. Notifications Center (Refactored) */}
                <section className={`${theme.cardBg} backdrop-blur-md p-6 rounded-2xl border border-white/5 relative z-10`}>
                    <h2 className={`text-xl font-bold ${theme.text} mb-6 flex items-center gap-2`}>
                        <Bell size={20} className={theme.accent} /> Centro de Notificaciones
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Channels */}
                        <div>
                            <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textSecondary} mb-3`}>Canales de Envío</h3>
                            <div className="space-y-3">
                                {/* Email - DISABLED */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 opacity-50 cursor-not-allowed">
                                    <div className="flex items-center gap-3">
                                        <Mail size={18} className="text-blue-300" />
                                        <div>
                                            <p className={`text-sm font-bold ${theme.text}`}>Email Diario <span className="text-[10px] bg-white/10 px-1 rounded text-white/50 ml-1">PRONTO</span></p>
                                            <p className="text-xs text-white/40">Resumen y alertas críticas</p>
                                        </div>
                                    </div>
                                    <Toggle checked={false} onChange={() => {}} theme={theme} />
                                </div>
                                
                                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Monitor size={18} className="text-green-300" />
                                        <div>
                                            <p className={`text-sm font-bold ${theme.text}`}>In-App Toast</p>
                                            <p className="text-xs text-white/40">Avisos emergentes en pantalla</p>
                                        </div>
                                    </div>
                                    <Toggle checked={notificationSettings?.channels?.inApp} onChange={() => toggleChannel('inApp')} theme={theme} />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Smartphone size={18} className="text-purple-300" />
                                        <div>
                                            <p className={`text-sm font-bold ${theme.text}`}>Push Browser</p>
                                            <p className="text-xs text-white/40">Notificaciones nativas</p>
                                        </div>
                                    </div>
                                    <Toggle checked={notificationSettings?.channels?.push} onChange={() => toggleChannel('push')} theme={theme} />
                                </div>
                            </div>
                        </div>

                        {/* Thresholds & Triggers */}
                        <div>
                            <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textSecondary} mb-3`}>Disparadores de Alerta</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className={`text-sm ${theme.text} flex items-center gap-2`}><AlertTriangle size={14} className="text-yellow-500"/> Alerta de Presupuesto</span>
                                        <span className={`text-xs font-mono font-bold ${theme.accent}`}>{notificationSettings?.thresholds?.budgetPercent}%</span>
                                    </div>
                                    <input 
                                        type="range" min="50" max="100" step="5"
                                        value={notificationSettings?.thresholds?.budgetPercent || 90}
                                        onChange={(e) => updateThreshold('budgetPercent', e.target.value)}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                    <p className="text-[10px] text-white/40 mt-1">Avisar cuando una campaña consuma este % del total.</p>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className={`text-xs ${theme.textSecondary} block mb-1 flex items-center gap-1`}><Clock size={12}/> Aviso Deadline (Días)</label>
                                        <input 
                                            type="number" min="1" max="30"
                                            className={`w-full ${theme.inputBg} border border-white/10 rounded-lg px-2 py-1 text-sm ${theme.text} text-center`}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className={`text-xs ${theme.textSecondary} block mb-1 flex items-center gap-1`}><Calendar size={12}/> Aviso Efemérides</label>
                                        <input 
                                            type="number" min="1" max="90"
                                            value={notificationSettings?.thresholds?.ephemerisDays || 60}
                                            onChange={(e) => updateThreshold('ephemerisDays', e.target.value)}
                                            className={`w-full ${theme.inputBg} border border-white/10 rounded-lg px-2 py-1 text-sm ${theme.text} text-center`}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className={`text-xs ${theme.textSecondary} block mb-1 flex items-center gap-1`}><CheckCircle size={12}/> Aviso Inicio (Horas)</label>
                                        <input 
                                            type="number" min="1" max="48"
                                            value={notificationSettings?.thresholds?.startWarningHours || 24}
                                            onChange={(e) => updateThreshold('startWarningHours', e.target.value)}
                                            className={`w-full ${theme.inputBg} border border-white/10 rounded-lg px-2 py-1 text-sm ${theme.text} text-center`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
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

// Sub-components
function Toggle({ checked, onChange }) {
    return (
        <button 
            onClick={onChange}
            className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-green-500' : 'bg-white/10'}`}
        >
            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
}

function ColorPicker({ category, label }) {
    const { theme } = useTheme();
    const { categoryColors, updateCategoryColor, availableColors } = useColorTheme();
    const [isOpen, setIsOpen] = useState(false);

    const activeColorId = categoryColors[category];
    // Ensure availableColors is an array before finding
    const colorsList = Array.isArray(availableColors) ? availableColors : [];
    const currentColor = colorsList.find(c => c.id === activeColorId) || colorsList[0] || { bg: 'bg-gray-500', name: 'Default' };

    return (
        <div className="relative">
            <label className={`text-xs ${theme.textSecondary} block mb-2`}>{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between p-3 rounded-xl border border-white/10 cursor-pointer ${theme.cardBg} hover:bg-white/5`}
            >
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${currentColor.bg}`}></div>
                    <span className={`text-sm ${theme.text}`}>{currentColor.name}</span>
                </div>
                <ChevronDown size={14} className={theme.textSecondary} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 p-2 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl z-50 grid grid-cols-5 gap-2">
                    {colorsList.map(c => (
                        <button
                            key={c.id}
                            onClick={() => {
                                updateCategoryColor(category, c.id);
                                setIsOpen(false);
                            }}
                            className={`w-8 h-8 rounded-full ${c.bg} border-2 ${currentColor.id === c.id ? 'border-white' : 'border-transparent hover:border-white/50'}`}
                            title={c.name}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Settings;
