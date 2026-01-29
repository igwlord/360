import React from 'react';

const PrintLayout = ({ type, data, options }) => {
    // Current Date
    const dateStr = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Data Source (Filtered or Full)
    const displayCampaigns = options?.filteredCampaigns || data?.campaigns || [];
    
    // Recalculate Basic Totals for the view if filtered
    const totalBudget = displayCampaigns.reduce((sum, c) => sum + (parseFloat(c.cost?.replace(/[^0-9.]/g, '') || 0)), 0);

    return (
        <div id="printable-content" className="hidden print:block bg-white text-black p-8 max-w-[210mm] mx-auto min-h-[297mm]">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-black/10 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tight text-gray-900">Retail Media 360</h1>
                    <p className="text-sm text-gray-500 mt-1">Reporte Oficial • {type === 'exec' ? 'Ejecutivo' : type === 'mkt' ? 'Marketing' : 'Financiero'}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase">Fecha de Emisión</p>
                    <p className="text-lg font-medium">{dateStr}</p>
                </div>
            </div>

            {/* Content Switcher */}
            {type === 'exec' && (
                <div className="space-y-8">
                    {/* Executive Summary Section */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h2 className="text-sm font-bold uppercase text-gray-500 mb-4">Resumen de Performance (KPIs)</h2>
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Inversión (Selección)</p>
                                <p className="text-3xl font-bold text-gray-900">${totalBudget.toFixed(1)}M</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Total Global (YTD)</p>
                                <p className="text-3xl font-bold text-gray-900">${data.budget?.executed.toFixed(1)}M</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Campañas</p>
                                <p className="text-3xl font-bold text-green-600">{displayCampaigns.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Campaign Status Table */}
                    <div>
                        <h2 className="text-lg font-bold mb-4 border-l-4 border-orange-500 pl-3">Estado de Portafolio</h2>
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="py-2 font-bold text-gray-500">Campaña</th>
                                    <th className="py-2 font-bold text-gray-500">Marca</th>
                                    <th className="py-2 font-bold text-gray-500">Estado</th>
                                    <th className="py-2 font-bold text-gray-500 text-right">Inversión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayCampaigns.map(c => (
                                    <tr key={c.id}>
                                        <td className="py-3 font-medium">{c.name}</td>
                                        <td className="py-3 text-gray-500">{c.brand}</td>
                                        <td className="py-3"><span className="px-2 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-700">{c.status}</span></td>
                                        <td className="py-3 text-right font-mono">{c.cost}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="fixed bottom-0 left-0 w-full text-center py-4 border-t border-gray-100 mt-auto print:absolute print:bottom-8">
                <p className="text-xs text-gray-400">Generado automáticamente por Retail Media Hub 360 • Confidencial</p>
            </div>
            
            {/* CSS Print Rules Injection */}
            <style>{`
                @media print {
                    @page { margin: 10mm; size: A4; }
                    body * {
                        visibility: hidden;
                    }
                    #printable-content, #printable-content * {
                        visibility: visible;
                    }
                    #printable-content {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background: white;
                        z-index: 9999;
                    }
                }
            `}</style>
        </div>
    );
};

export default PrintLayout;
