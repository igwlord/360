export const generateAndPrintReport = (reportType, config, data) => {
    // 1. DATA CALCULATIONS
    const totalBudget = data.reduce((sum, c) => sum + (parseFloat(c.cost?.replace(/[^0-9.]/g, '') || 0)), 0);
    const activeCount = data.filter(c => c.status === 'En Curso').length;
    
    // Brand Distribution (Sorted Top 5)
    const brandMap = {};
    data.forEach(c => {
        const val = parseFloat(c.cost?.replace(/[^0-9.]/g, '') || 0);
        brandMap[c.brand] = (brandMap[c.brand] || 0) + val;
    });
    const topBrands = Object.entries(brandMap)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([k, v]) => ({ label: k, value: v, percent: (v/totalBudget)*100 }));

    // Status Distribution
    const statusMap = {};
    let maxCount = 0;
    data.forEach(c => {
        statusMap[c.status] = (statusMap[c.status] || 0) + 1;
        if(statusMap[c.status] > maxCount) maxCount = statusMap[c.status];
    });
    const statuses = Object.entries(statusMap).map(([k, v]) => ({ 
        label: k, 
        value: v, 
        height: maxCount > 0 ? (v/maxCount)*100 : 0 
    }));

    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    // 2. CSS-ONLY STYLES (No Canvas/JS Charts)
    const styles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');
            @page { margin: 0; size: A4; }
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; }
            
            .page-container { padding: 40px 50px; width: 210mm; margin: 0 auto; background: white; }
            
            /* Header */
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .title h1 { font-size: 24px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: -0.5px; }
            .title span { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #666; font-weight: 600; }
            .meta { text-align: right; font-size: 10px; color: #666; font-weight: 500; }
            .meta strong { color: #000; text-transform: uppercase; }

            /* KPIs Grid */
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 40px; }
            .kpi-card { background: #f8f8f8; padding: 15px; border-radius: 8px; border-left: 4px solid #E8A631; }
            .kpi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #888; margin-bottom: 4px; }
            .kpi-val { font-size: 20px; font-weight: 800; color: #000; }
            
            /* Visual Sections */
            .visuals-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 40px; margin-bottom: 40px; }
            
            /* CSS Bar Chart (Brands) */
            .chart-box { border: 1px solid #eee; padding: 20px; border-radius: 12px; }
            .chart-title { font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
            
            .bar-row { display: flex; align-items: center; margin-bottom: 12px; font-size: 10px; }
            .bar-label { width: 100px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .bar-track { flex: 1; background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; margin: 0 10px; }
            .bar-fill { height: 100%; background: #E8A631; border-radius: 4px; }
            .bar-val { width: 40px; text-align: right; font-family: monospace; color: #666; }

            /* CSS Column Chart (Status) */
            .col-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 120px; padding-top: 10px; }
            .col-item { width: 30%; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; }
            .col-bar { width: 80%; margin: 0 auto; background: #333; border-radius: 4px 4px 0 0; transition: height 0.3s; min-height: 2px; }
            .col-label { font-size: 9px; margin-top: 6px; font-weight: 600; text-transform: uppercase; color: #666; }
            .col-val { font-size: 10px; font-weight: 700; margin-bottom: 4px; }

            /* Table */
            .table-wrap {}
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { text-align: left; border-bottom: 2px solid #000; padding: 8px 5px; font-weight: 800; text-transform: uppercase; }
            td { border-bottom: 1px solid #f0f0f0; padding: 10px 5px; color: #333; }
            .badge { padding: 3px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            .bg-green { background: #dcfce7; color: #15803d; }
            .bg-yellow { background: #fef9c3; color: #a16207; }
            .bg-gray { background: #f3f4f6; color: #4b5563; }

            .footer { position: fixed; bottom: 20px; left: 0; width: 100%; text-align: center; font-size: 9px; color: #aaa; }
        </style>
    `;

    // 3. BUILD HTML
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte 360 - ${reportType.title}</title>
            ${styles}
        </head>
        <body>
            <div class="page-container">
                <div class="header">
                    <div class="title">
                        <span>Retail Media Intelligence</span>
                        <h1>${reportType.title}</h1>
                    </div>
                    <div class="meta">
                        Ref: ${config.dateRange.toUpperCase()}<br>
                        <strong>${dateStr}</strong>
                    </div>
                </div>

                <!-- KPIs -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-label">Inversión (Periodo)</div>
                        <div class="kpi-val">$${(totalBudget/1000000).toFixed(2)}M</div>
                    </div>
                    <div class="kpi-card" style="border-color: #22c55e">
                        <div class="kpi-label">Campañas Activas</div>
                        <div class="kpi-val">${activeCount}</div>
                    </div>
                    <div class="kpi-card" style="border-color: #3b82f6">
                        <div class="kpi-label">Top Marca</div>
                        <div class="kpi-val">${topBrands[0]?.label || '-'}</div>
                    </div>
                    <div class="kpi-card" style="border-color: #a855f7">
                        <div class="kpi-label">Total Campañas</div>
                        <div class="kpi-val">${data.length}</div>
                    </div>
                </div>

                <!-- Visuals (CSS Only) -->
                <div class="visuals-grid">
                    <div class="chart-box">
                        <div class="chart-title">Inversión por Marca (Top 5)</div>
                        ${topBrands.map(b => `
                            <div class="bar-row">
                                <div class="bar-label">${b.label}</div>
                                <div class="bar-track">
                                    <div class="bar-fill" style="width: ${b.percent}%"></div>
                                </div>
                                <div class="bar-val">$${(b.value/1000).toFixed(0)}k</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="chart-box">
                        <div class="chart-title">Estado de Portafolio</div>
                        <div class="col-chart">
                            ${statuses.map(s => `
                                <div class="col-item">
                                    <div class="col-val">${s.value}</div>
                                    <div class="col-bar" style="height: ${s.height}%; background: ${s.label === 'En Curso' ? '#22c55e' : '#333'}"></div>
                                    <div class="col-label">${s.label.substring(0, 8)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <div class="table-wrap">
                    <div class="chart-title" style="margin-bottom: 0; border: none;">Detalle Operativo</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Campaña</th>
                                <th>Marca</th>
                                <th>Inicio</th>
                                <th>Estado</th>
                                <th style="text-align: right">Inversión</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.slice(0, 20).map(c => `
                                <tr>
                                    <td style="font-weight: 600">${c.name}</td>
                                    <td>${c.brand}</td>
                                    <td>${c.startDate || c.date}</td>
                                    <td>
                                        <span class="badge ${c.status === 'En Curso' ? 'bg-green' : c.status === 'Pendiente' ? 'bg-yellow' : 'bg-gray'}">
                                            ${c.status}
                                        </span>
                                    </td>
                                    <td style="text-align: right; font-family: monospace">${c.cost}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${data.length > 20 ? `<p style="text-align: center; color: #999; font-size: 10px; margin-top: 15px;">...mostrando 20 de ${data.length} campañas.</p>` : ''}
                </div>

                <div class="footer">
                    Retail Media Hub 360 • Documento Confidencial • Generado automáticamente
                </div>
            </div>

            <script>
                // Instant Print - No complex loading waiting
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        // window.close();
                    }, 100);
                };
            </script>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1100,height=900');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    } else {
        alert('Por favor habilita pop-ups para imprimir.');
    }
};
