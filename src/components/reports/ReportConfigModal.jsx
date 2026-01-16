import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, CheckSquare, Sparkles, Copy, Download, Info, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

const ReportConfigModal = ({ isOpen, onClose, reportType, onGenerate }) => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    
    // Config States
    const [dateRange, setDateRange] = useState('this_month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [format, setFormat] = useState('pdf'); // 'pdf', 'excel', 'ai_prompt'

    // Reset when opening new report
    useEffect(() => {
        setDateRange('this_month');
        setFormat('pdf');
    }, [reportType]);

    if (!isOpen || !reportType) return null;

    const handleConfirm = () => {
        // Prepare config object
        const config = {
            dateRange,
            customRange: dateRange === 'custom' ? { start: customStart, end: customEnd } : null,
            format
        };
        onGenerate(config);
    };

    const isCustomDateInvalid = dateRange === 'custom' && (!customStart || !customEnd);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className={`relative w-full max-w-4xl ${theme.cardBg} backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] animate-in zoom-in-95 duration-200`}>
                
                {/* LEFT PANE: Context & Tips (Strategic Value) */}
                <div className={`w-full md:w-1/3 p-8 border-r border-white/5 bg-gradient-to-b from-white/5 to-transparent flex flex-col`}>
                    <div className={`p-3 rounded-2xl w-fit mb-6 ${reportType.color} text-white shadow-lg`}>
                        <reportType.icon size={32} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">{reportType.title}</h2>
                    <p className="text-sm text-white/60 mb-8 leading-relaxed">{reportType.desc}</p>

                    <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                        <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E8A631] mb-2">
                                <Info size={14} /> Objetivo
                            </h4>
                            <p className="text-xs text-white/70 leading-relaxed">
                                {getObjectiveText(reportType.id)}
                            </p>
                        </div>
                        <div>
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400 mb-2">
                                <Zap size={14} /> Tips de Presentación
                            </h4>
                            <div className="text-xs text-white/70 space-y-2 leading-relaxed">
                                {getPresentationTips(reportType.id).map((tip, i) => (
                                    <p key={i}>• {tip}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Configuration */}
                <div className="flex-1 p-8 flex flex-col bg-black/20">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white">Configuración del Reporte</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 space-y-8">
                        {/* 1. Date Range Selector */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-white/50 uppercase tracking-wider">Rango de Fechas</label>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                <RangeBtn label="Mensual" value="this_month" current={dateRange} set={setDateRange} />
                                <RangeBtn label="Trimestral" value="this_quarter" current={dateRange} set={setDateRange} />
                                <RangeBtn label="Semestral" value="last_6m" current={dateRange} set={setDateRange} />
                                <RangeBtn label="Anual" value="this_year" current={dateRange} set={setDateRange} />
                                <RangeBtn label="YTD" value="ytd" current={dateRange} set={setDateRange} />
                                <RangeBtn label="Personalizado" value="custom" current={dateRange} set={setDateRange} />
                            </div>

                            {/* Custom Date Inputs with Quick Select */}
                            {dateRange === 'custom' && (
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2 space-y-4">
                                    
                                    {/* Quick Month/Year Selector Helper */}
                                    <div className="flex gap-2 items-end pb-3 border-b border-white/5">
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold text-white/30 mb-1 block">Año</label>
                                            <select 
                                                className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-2 text-white text-sm focus:border-[#E8A631] outline-none"
                                                onChange={(e) => {
                                                    const y = e.target.value;
                                                    if(!y) return;
                                                    // Default to Jan 1st - Dec 31st of selected year if manually picking year
                                                    setCustomStart(`${y}-01-01`);
                                                    setCustomEnd(`${y}-12-31`);
                                                }}
                                            >
                                                <option value="">Seleccionar Año...</option>
                                                {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold text-white/30 mb-1 block">Mes Rápido</label>
                                            <select 
                                                className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-2 text-white text-sm focus:border-[#E8A631] outline-none"
                                                onChange={(e) => {
                                                    const m = e.target.value; // 0-11
                                                    if(m === "") return;
                                                    const now = new Date();
                                                    const y = customStart ? new Date(customStart).getFullYear() : now.getFullYear();
                                                    const firstDay = new Date(y, m, 1);
                                                    const lastDay = new Date(y, parseInt(m) + 1, 0);
                                                    
                                                    // Format YYYY-MM-DD
                                                    const fmt = d => d.toISOString().split('T')[0];
                                                    setCustomStart(fmt(firstDay));
                                                    setCustomEnd(fmt(lastDay));
                                                }}
                                            >
                                                <option value="">Seleccionar Mes...</option>
                                                {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                                                    <option key={i} value={i}>{m}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Precise Inputs */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-white/50 block mb-1">Desde</label>
                                            <input 
                                                type="date" 
                                                value={customStart} 
                                                onChange={e => setCustomStart(e.target.value)} 
                                                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-[#E8A631] outline-none relative" 
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-white/50 block mb-1">Hasta</label>
                                            <input 
                                                type="date" 
                                                value={customEnd} 
                                                onChange={e => setCustomEnd(e.target.value)} 
                                                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-[#E8A631] outline-none" 
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-white/30 text-center">
                                        * Usa los selectores superiores para saltos rápidos, o los inferiores para días específicos.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 2. Format Selector */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-white/50 uppercase tracking-wider">Formato de Salida</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FormatOption 
                                    id="pdf" 
                                    label="Documento PDF" 
                                    sub="Listo para imprimir"
                                    icon={FileText} 
                                    selected={format} 
                                    set={setFormat}
                                    color="text-red-400"
                                />
                                <FormatOption 
                                    id="excel" 
                                    label="Excel / CSV" 
                                    sub="Datos crudos"
                                    icon={CheckSquare} 
                                    selected={format} 
                                    set={setFormat}
                                    color="text-green-400"
                                />
                                <FormatOption 
                                    id="ai_prompt" 
                                    label="Exportar para IA" 
                                    sub="Canva / Gemini Prompt"
                                    icon={Sparkles} 
                                    selected={format} 
                                    set={setFormat}
                                    color="text-[#E8A631]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={handleConfirm}
                        disabled={isCustomDateInvalid}
                        className={`w-full py-4 rounded-xl font-bold text-black flex items-center justify-center gap-3 transition-all mt-6 shadow-xl ${isCustomDateInvalid ? 'bg-gray-600 cursor-not-allowed text-white/50' : `${theme.accentBg} hover:opacity-90 hover:scale-[1.01]`}`}
                    >
                        {format === 'ai_prompt' ? (
                            <> <Copy size={20} /> Generar Prompt Maestro </>
                        ) : (
                            <> <Download size={20} /> Generar Reporte </>
                        )}
                    </button>
                    
                    {format === 'ai_prompt' && (
                        <p className="text-center text-xs text-white/40 mt-3 animate-pulse">
                            Genera un código optimizado para crear dashboards visuales con IA.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Components
const RangeBtn = ({ label, value, current, set }) => (
    <button 
        onClick={() => set(value)}
        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${current === value ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/10 hover:border-white/30 hover:text-white'}`}
    >
        {label}
    </button>
);

const FormatOption = ({ id, label, sub, icon: Icon, selected, set, color }) => (
    <div 
        onClick={() => set(id)}
        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${selected === id ? 'bg-white/10 border-[#E8A631] shadow-lg ring-1 ring-[#E8A631]/50' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
    >
        <div className={`p-2 rounded-lg bg-black/40 ${selected === id ? color : 'text-white/30'}`}>
            <Icon size={20} />
        </div>
        <div>
            <p className={`font-bold text-sm ${selected === id ? 'text-white' : 'text-white/70'}`}>{label}</p>
            <p className="text-[10px] text-white/40">{sub}</p>
        </div>
    </div>
);

// Context Data Dictionaries
const getObjectiveText = (id) => {
    switch(id) {
        case 'exec': return "Proporcionar una visión macroscópica del estado financiero y operativo para la alta dirección. Ideal para revisiones mensuales de P&L.";
        case 'mkt': return "Analizar la saturación del calendario y el rendimiento de proveedores específicos. Útil para ajustar tácticas de Q4.";
        case 'finance': return "Auditoría detallada de costos vs. tarifario. Úselo para negociaciones anuales con proveedores.";
        case 'onepager': return "Resumen de alto impacto de una campaña individual. Perfecto para enviar al cliente final o marca.";
        default: return "";
    }
};

const getPresentationTips = (id) => {
    switch(id) {
        case 'exec': return ["Enfócate en el ROI Global y el % de Presupuesto Ejecutado.", "Si el ROI < 120%, explica las causas en 'Alertas'."];
        case 'mkt': return ["Destaca los días de mayor densidad en el calendario.", "Muestra la distribución de inversión por Categoría."];
        case 'finance': return ["Compara el precio de lista vs. precio pagado (Savings).", "Proyecta el cierre fiscal basado en el 'committed'."];
        case 'onepager': return ["Incluye siempre una captura visual del activo creativo.", "Resalta el KPI principal (Ventas o Awareness)."];
        default: return [];
    }
};

export default ReportConfigModal;
