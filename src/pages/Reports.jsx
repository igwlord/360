
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { FileText, Download, PieChart, TrendingUp, DollarSign, Calendar, CheckSquare, Square } from 'lucide-react';

const Reports = () => {
    const { theme } = useTheme();
    const { campaigns, budget, rateCardItems } = useData();
    const { addToast } = useToast();
    
    // Mock Report Types
    const reportTypes = [
        { 
            id: 'exec', 
            title: 'Reporte Ejecutivo (Gerencia)', 
            desc: 'Resumen de alto nivel: Presupuesto vs Ejecutado, ROI estimado y Status de Campañas Activas.',
            icon: TrendingUp,
            color: 'bg-blue-500'
        },
        { 
            id: 'mkt', 
            title: 'Marketing & Retail Media', 
            desc: 'Detalle operativo: Calendario de activaciones, desglose por Marca/Categoría y Proveedores.',
            icon: PieChart,
            color: 'bg-purple-500'
        },
        { 
            id: 'finance', 
            title: 'Financiero & Ventas', 
            desc: 'Consolidado de costos, facturación proyectada y análisis de tarifario.',
            icon: DollarSign,
            color: 'bg-green-500'
        }
    ];

    const [selectedType, setSelectedType] = useState('exec');
    const [options, setOptions] = useState({ includeCharts: true, includeRawData: false, dateRange: 'this_month' });
    const [isGenerating, setIsGenerating] = useState(false);

    // --- CSV GENERATOR ---
    const generateCSV = (type) => {
        let headers = [];
        let rows = [];
        let fileName = 'reporte_generico.csv';

        if (type === 'mkt') {
            headers = ['ID', 'Nombre', 'Marca', 'Estado', 'Progreso (%)', 'Fecha', 'Costo'];
            rows = campaigns.map(c => [c.id, c.name, c.brand, c.status, c.progress, c.date, c.cost]);
            fileName = 'reporte_marketing_operaciones.csv';
        } else if (type === 'finance') {
            headers = ['Item', 'Categoría', 'Precio', 'Unidad'];
            rows = rateCardItems.map(r => [r.item, r.category, r.price, r.unit]);
            fileName = 'reporte_financiero_tarifario.csv';
        } else {
            // Exec Summary (Simple Mock Rows)
            headers = ['Métrica', 'Valor', 'Detalle'];
            rows = [
                ['Presupuesto Total', `${budget.total}M`, 'Anual 2026'],
                ['Ejecutado', `${budget.executed}M`, 'YTD'],
                ['Porcentaje Uso', `${budget.percentage.toFixed(1)}%`, 'Alert threshold set to 80%'],
                ['Campañas Activas', campaigns.filter(c => c.status === 'En Curso').length, 'Total en curso'],
            ];
            fileName = 'reporte_ejecutivo_management.csv';
        }

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        addToast('Generando reporte...', 'info');
        
        setTimeout(() => {
            generateCSV(selectedType);
            setIsGenerating(false);
            addToast(`Reporte "${reportTypes.find(t => t.id === selectedType).title}" generado con éxito.`, 'success');
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className={`text-3xl font-bold ${theme.text}`}>Centro de Reportes</h1>
                <p className={`${theme.textSecondary} text-sm mt-1`}>Generación de informes estratégicos y operativos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left: Type Selection */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Tipo de Reporte</h3>
                    {reportTypes.map(type => (
                        <div 
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedType === type.id ? `bg-white/10 border-[#E8A631] shadow-lg shadow-orange-900/10` : 'bg-transparent border-white/10 hover:bg-white/5 opacity-70 hover:opacity-100'}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${type.color} text-white`}>
                                    <type.icon size={18} />
                                </div>
                                <span className={`font-bold ${selectedType === type.id ? 'text-white' : 'text-white/80'}`}>{type.title.split(' ')[0]}</span>
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed">{type.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Center: Configuration */}
                <div className={`md:col-span-2 ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -z-10"></div>
                    
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <FileText className="text-[#E8A631]" />
                        Configuración de Exportación
                    </h2>

                    <div className="space-y-6 flex-1">
                        {/* Date Range */}
                        <div>
                             <label className="text-sm font-bold text-white/70 mb-3 block">Rango de Fechas</label>
                             <div className="grid grid-cols-3 gap-3">
                                 {['Este Mes', 'Último Q', 'Año en Curso'].map((range) => (
                                     <button 
                                        key={range}
                                        className={`px-4 py-2 rounded-xl text-sm border transition-all ${options.dateRange === range ? 'bg-white text-black border-transparent font-bold' : 'bg-black/20 border-white/10 text-white/60 hover:text-white'}`}
                                        onClick={() => setOptions({...options, dateRange: range})}
                                     >
                                         {range}
                                     </button>
                                 ))}
                             </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-white/70 mb-2 block">Contenido</label>
                            
                            <div 
                                onClick={() => setOptions({...options, includeCharts: !options.includeCharts})}
                                className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                {options.includeCharts ? <CheckSquare className="text-green-500" size={20} /> : <Square className="text-white/30" size={20} />}
                                <span className="text-white">Incluir Gráficos y Visualizaciones</span>
                            </div>

                            <div 
                                onClick={() => setOptions({...options, includeRawData: !options.includeRawData})}
                                className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                {options.includeRawData ? <CheckSquare className="text-green-500" size={20} /> : <Square className="text-white/30" size={20} />}
                                <span className="text-white">Anexar Datos Crudos (CSV/Excel)</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`mt-8 w-full py-4 rounded-xl font-bold text-black flex items-center justify-center gap-3 transition-all ${isGenerating ? 'bg-gray-500 cursor-not-allowed' : `${theme.accentBg} hover:opacity-90 hover:scale-[1.01] shadow-xl`}`}
                    >
                        {isGenerating ? (
                            <>Generando...</>
                        ) : (
                            <>
                                <Download size={20} /> Descargar Reporte (.csv)
                            </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default Reports;
