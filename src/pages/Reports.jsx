
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCampaigns } from '../hooks/useCampaigns';
// import { useBudget } from '../hooks/useBudget';
// import { useRateCard } from '../hooks/useRateCard';
import { useToast } from '../context/ToastContext';
import { FileText, Download, PieChart, TrendingUp, DollarSign, Calendar, CheckSquare, Square, Sparkles } from 'lucide-react';
import ReportConfigModal from '../components/reports/ReportConfigModal';
import { generateAndPrintReport } from '../utils/reportGenerator';

const Reports = () => {
    const { theme } = useTheme();
    const { data: campaigns = [] } = useCampaigns();
    // const { budget } = useBudget(); // Reserved for future use
    // const { data: rateCardItems = [] } = useRateCard(); // Reserved for future use
    const { addToast } = useToast();
    
    // Mock Report Types
    const reportTypes = [
        { 
            id: 'exec', 
            title: 'Reporte Ejecutivo (Gerencia)', 
            desc: 'Resumen de alto nivel: Presupuesto vs Ejecutado, ROI estimado y Status de Proyectos.',
            icon: TrendingUp,
            color: 'bg-blue-500'
        },
        { 
            id: 'mkt', 
            title: 'Marketing & Retail Media', 
            desc: 'Operativo: Calendario de activaciones, desglose por Marca y Proveedores.',
            icon: PieChart,
            color: 'bg-purple-500'
        },
        { 
            id: 'finance', 
            title: 'Financiero & Ventas', 
            desc: 'Consolidado de costos, facturación proyectada y análisis de tarifario.',
            icon: DollarSign,
            color: 'bg-green-500'
        },
        { 
            id: 'onepager', 
            title: 'One-Pager (Proyecto)', 
            desc: 'Ficha técnica individual de un proyecto específico: KPIs y Creativos.',
            icon: FileText,
            color: 'bg-orange-500'
        }
    ];

    const [activeModalReport, setActiveModalReport] = useState(null); // The report currently being configured

    // --- DATA FILTERING LOGIC ---
    const filterDataByDate = (camps, range, custom) => {
        if (!range || range === 'all_time') return camps;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        let filtered = camps;

        // Helper to parse "YYYY-MM-DD" or similar
        // Assuming c.date is comparable or convert to Date object
        const getCampDate = (c) => new Date(c.startDate || c.date);

        if (range === 'this_month') {
            filtered = camps.filter(c => getCampDate(c) >= startOfMonth);
        } else if (range === 'ytd' || range === 'this_year') {
            filtered = camps.filter(c => getCampDate(c) >= startOfYear);
        } else if (range === 'last_6m') {
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            filtered = camps.filter(c => getCampDate(c) >= sixMonthsAgo);
        } else if (range === 'custom' && custom?.start && custom?.end) {
            const s = new Date(custom.start);
            const e = new Date(custom.end);
            filtered = camps.filter(c => {
                const d = getCampDate(c);
                return d >= s && d <= e;
            });
        }
        return filtered;
    };


    // --- AI PROMPT GENERATOR ---
    const generateAiPrompt = (reportType, config, filteredData) => {
        const dataset = {
            report_type: reportType.title,
            period: config.dateRange,
            generated_at: new Date().toISOString(),
            metrics: {
                total_campaigns: filteredData.length,
                total_budget_executed: filteredData.reduce((acc, c) => acc + (parseFloat(c.cost?.replace(/[^0-9.]/g,'')) || 0), 0),
                active_campaigns: filteredData.filter(c => c.status === 'En Curso').length
            },
            data_sample: filteredData.map(c => ({ 
                name: c.name, 
                brand: c.brand, 
                date: c.date, 
                cost: c.cost, 
                status: c.status 
            }))
        };

        const prompt = `
=== RETAIL MEDIA REPORT GENERATION PROMPT ===
CONTEXTO: Eres un experto Analista de Datos y Diseñador UX especializado en Retail Media.
OBJETIVO: Generar un reporte visual interactivo en HTML (single-file) basado en los datos proporcionados.

INSTRUCCIONES DE DISEÑO:
1. Crea un dashboard moderno, oscuro (Dark Mode), usando colores premium (#E8A631 para acentos).
2. Usa Chart.js o similar via CDN para graficar:
   - Distribución de Inversión por Marca (Pie Chart).
   - Cronograma de proyectos (Timeline/Gantt simplificado).
   - Progreso de Status (Bar Chart).
3. Incluye una sección de "Insights Ejecutivos" generada por ti basada en los datos (ej. detectar saturación).

DATOS (JSON):
${JSON.stringify(dataset, null, 2)}

SALIDA ESPERADA:
Un único bloque de código HTML completo con estilos CSS y scripts JS integrados, listo para abrir en navegador.
=============================================
`;
        return prompt;
    };


    // --- EXPORT HANDLER ---
    const handleGenerateReport = async (config) => {
        // 1. Filter Data
        const filteredCampaigns = filterDataByDate(campaigns, config.dateRange, config.customRange);
        
        // 2. Handle Format
        if (config.format === 'ai_prompt') {
            const prompt = generateAiPrompt(activeModalReport, config, filteredCampaigns);
            try {
                await navigator.clipboard.writeText(prompt);
                addToast('Prompt Maestro copiado al portapapeles. Pégalo en Gemini/ChatGPT.', 'success');
            } catch (err) {
                console.error(err);
                addToast('Error al copiar al portapapeles', 'error');
            }
        } else if (config.format === 'pdf') {
            addToast('Generando Reporte PDF...', 'info');
            generateAndPrintReport(activeModalReport, config, filteredCampaigns);
        } else if (config.format === 'excel') {
             generateCSV(activeModalReport.id, filteredCampaigns);
        }

        setActiveModalReport(null);
    };


    // --- CSV LOGIC (Updated to use filtered data) ---
    const generateCSV = (typeId, data) => {
        let headers = [];
        let rows = [];
        let fileName = `${typeId}_${new Date().toISOString().split('T')[0]}.csv`;

        if (typeId === 'mkt') {
            headers = ['ID', 'Nombre', 'Marca', 'Estado', 'Fecha', 'Costo'];
            rows = data.map(c => [c.id, c.name, c.brand, c.status, c.date, c.cost]);
        } else {
             // Fallback generic
            headers = ['KPI', 'Valor'];
            rows = [['Proyectos', data.length]];
        }

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('CSV descargado correctamente', 'success');
    };

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className={`text-4xl font-bold ${theme.text} mb-2`}>Centro de Inteligencia</h1>
                <p className={`${theme.textSecondary} text-lg max-w-2xl mx-auto`}>
                    Genera reportes estratégicos, analiza el rendimiento histórico o exporta datos para análisis avanzado con IA.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto w-full px-4">
                {reportTypes.map(type => (
                    <div 
                        key={type.id}
                        onClick={() => setActiveModalReport(type)}
                        className={`group relative ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl p-8 cursor-pointer hover:border-[#E8A631]/50 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-900/20`}
                    >
                         {/* Hover Effect Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`}></div>

                        <div className="flex items-start justify-between mb-6">
                            <div className={`p-4 rounded-2xl ${type.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <type.icon size={28} />
                            </div>
                            <div className="p-2 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Sparkles size={16} className="text-[#E8A631]" />
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#E8A631] transition-colors">{type.title}</h3>
                        <p className="text-white/60 text-sm leading-relaxed mb-6">{type.desc}</p>
                        
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 group-hover:text-white/80 transition-colors">
                            <span>Configurar & Exportar</span>
                            <span className="text-lg">→</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Config Modal */}
            <ReportConfigModal 
                isOpen={!!activeModalReport}
                onClose={() => setActiveModalReport(null)}
                reportType={activeModalReport}
                onGenerate={handleGenerateReport}
            />
        </div>
    );
};

export default Reports;
