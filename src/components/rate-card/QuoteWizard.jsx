import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { X, Calendar, User, Briefcase, Printer, Download, ArrowRight, Trash2, ArrowLeft, Percent, Clock, Hash, Plus, Copy, Monitor, Layers } from 'lucide-react';

const QuoteWizard = ({ isOpen, onClose, selectedItems = [], initialConfig = null }) => {
    const { theme } = useTheme();
    const { campaigns, providerGroups, actions, rateCardItems } = useData(); 


    const [step, setStep] = useState(1);
    
    // --- STATE MANAGEMENT ---

    // Config: Global settings for the quote
    const [config, setConfig] = useState(() => ({
        clientName: initialConfig?.clientName || '',
        clientId: initialConfig?.clientId || null,
        projectName: '', 
        projectId: null, // If linked to existing project
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
    }));

    // Update config if initialConfig changes (e.g. re-opening from Directory)
    useEffect(() => {
        if (initialConfig && isOpen) {
            setConfig(prev => ({
                ...prev,
                clientName: initialConfig.clientName || prev.clientName,
                clientId: initialConfig.clientId || prev.clientId
            }));
        }
    }, [initialConfig, isOpen]);

    // Versions: Array of quote versions. Each version has its own items.
    const [versions, setVersions] = useState([
        { id: 1, name: 'Opción 1', items: [] } 
    ]);
    const [activeVersionId, setActiveVersionId] = useState(1);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [addItemSearch, setAddItemSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false); // New Dropdown State

    // Initial Load
    // Initial Load / Sync with Selection
    useEffect(() => {
        if (isOpen && selectedItems.length > 0) {
            const transformItem = (item) => ({
                ...item,
                quantity: 1,
                days: 30,
                discount: 0,
                unitPrice: Number(item.price) || 0
            });

            setVersions(prevVersions => {
                // If clean slate (first open or reset), initialize
                const isClean = prevVersions.length === 1 && prevVersions[0].items.length === 0;
                
                if (isClean) {
                     return [{ id: 1, name: 'Opción 1', items: selectedItems.map(transformItem) }];
                }
                
                // If resuming, merge new selected items into Active Version
                // distinct by ID to avoid duplicates
                return prevVersions.map(v => {
                    if (v.id === activeVersionId) {
                        const existingIds = new Set(v.items.map(i => i.id));
                        const newItems = selectedItems
                            .filter(i => !existingIds.has(i.id))
                            .map(transformItem);
                        
                        if (newItems.length === 0) return v;
                        return { ...v, items: [...v.items, ...newItems] };
                    }
                    return v;
                });
            });
            
            // Only force steps/active if it's a fresh start
            setVersions(prev => {
                 if (prev.length === 1 && prev[0].items.length === 0) {
                     setActiveVersionId(1);
                     setStep(1);
                 }
                 return prev;
            });
        }
    }, [isOpen, selectedItems, activeVersionId]);

    // Safe Version Accessor to prevent Step 2 crash
    const safeActiveVersion = useMemo(() => {
        return versions.find(v => v.id === activeVersionId) || versions[0] || { id: 1, name: 'Fallback', items: [] };
    }, [versions, activeVersionId]);

    // Use safeActiveVersion instead of activeVersion direct find
    // const activeVersion = versions.find(v => v.id === activeVersionId) || versions[0];
    const activeVersion = safeActiveVersion;
    
    // Clients Autocomplete Data
    const availableClients = useMemo(() => {
        const clients = [];
        providerGroups.forEach(group => {
            group.contacts.forEach(contact => {
                const name = contact.company || contact.proveedor || contact.name || 'Sin Nombre';
                if (!clients.find(c => c.name === name)) {
                    clients.push({ name: name, id: contact.id, type: 'Directorio', contactData: contact });
                }
            });
        });
        return clients;
    }, [providerGroups]);

    // --- ACTIONS ---

    const handleAddVersion = () => {
        if (versions.length >= 3) return;
        const newId = versions.length + 1;
        // Clone items from active version as a starting point?? Or empty? User said "dame 2 propuestas de como harias...", report says "Clonar a v2".
        // Let's Clone current active version to new version
        const newVersion = {
            id: newId,
            name: `Opción ${newId}`,
            items: JSON.parse(JSON.stringify(activeVersion.items))
        };
        setVersions([...versions, newVersion]);
        setActiveVersionId(newId);
    };

    const handleRemoveVersion = (e, id) => {
        e.stopPropagation();
        if (versions.length === 1) return;
        const newVersions = versions.filter(v => v.id !== id);
        setVersions(newVersions);
        if (activeVersionId === id) setActiveVersionId(newVersions[0].id);
    };

    const updateActiveItems = (newItemList) => {
        setVersions(prev => prev.map(v => 
            v.id === activeVersionId ? { ...v, items: newItemList } : v
        ));
    };

    const handleRemoveItem = (itemId) => {
        const currentItems = activeVersion.items;
        const newItems = currentItems.filter(i => i.id !== itemId);
        updateActiveItems(newItems);
        // If no items left in this version, maybe warn? or just leave empty
    };

    const updateItem = (itemId, field, value) => {
        const currentItems = activeVersion.items;
        const newItems = currentItems.map(item => {
            if (item.id !== itemId) return item;
            return { ...item, [field]: value };
        });
        updateActiveItems(newItems);
    };

    const handleAddItem = (item) => {
        const currentItems = activeVersion.items;
        const newItem = {
            ...item,
            quantity: 1,
            days: 30,
            discount: 0,
            unitPrice: Number(item.price) || 0
        };
        // Avoid duplicates by ID? Or allow? Assuming allow but maybe warn users. 
        // User might want same item twice with different logic? Let's allow but maybe generic ID is collision risk if we rely on DB ID.
        // Rate Card Items are "Templates". In Quote they become "Instances".
        // Use a unique ID for the instance to allow duplicates.
        const instanceItem = { ...newItem, id: `${item.id}-${Date.now()}` }; 
        
        updateActiveItems([...currentItems, instanceItem]);
        setIsAddItemModalOpen(false);
        setAddItemSearch('');
    };

    const calculateTotals = (itemsToCalc) => {
        let subtotal = 0;
        let totalDiscount = 0;

        const processedItems = itemsToCalc.map(item => {
            const gross = item.unitPrice * item.quantity; 
            const discountAmount = (gross * (item.discount || 0)) / 100;
            const net = gross - discountAmount;
            
            subtotal += gross;
            totalDiscount += discountAmount;
            return { ...item, gross, net };
        });

        return { subtotal, totalDiscount, total: subtotal - totalDiscount, processedItems };
    };

    const currentTotals = calculateTotals(activeVersion.items);

    // --- INPUT HANDLERS ---
    
    const handleClientChange = (e) => {
        const val = e.target.value;
        setConfig(prev => {
            // Check match on write
            const match = availableClients.find(c => c.name.toLowerCase() === val.toLowerCase());
            return { 
                ...prev, 
                clientName: val,
                clientId: match ? match.id : null
            };
        });
        if (!showClientDropdown) setShowClientDropdown(true);
    };

    const selectClient = (client) => {
        setConfig(prev => ({
            ...prev,
            clientName: client.name,
            clientId: client.id
        }));
        setShowClientDropdown(false);
    };



    const handleProjectChange = (e) => {
        const val = e.target.value;
        setConfig(prev => ({ ...prev, projectName: val }));
        
        const match = campaigns.find(p => p.name.toLowerCase() === val.toLowerCase());
        if (match) setConfig(prev => ({ ...prev, projectId: match.id }));
        else setConfig(prev => ({ ...prev, projectId: null }));
    };

    const handleCreateProject = () => {
         // Logic to actually create project in DB could go here, for now just set it as "New Project" intent
         // In a real app we might pop a mini modal or just auto-create on Save.
         // Current requirement: "permite crear un nuevo proyecto dsde desde ahi"
         if (config.projectName && !config.projectId) {
             actions.addCampaign({ name: config.projectName }); // Optimistic creation
             // We'd ideally wait for ID but for UI feedback:
             // setConfig... projectId: 'temp...' 
         }
    };

    // --- PDF PRINTING ---

    const handlePrint = (printAll = false) => {
        const windowUrl = 'about:blank';
        const uniqueName = new Date();
        const windowName = 'Print' + uniqueName.getTime();
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

        const versionsToPrint = printAll ? versions : [activeVersion];

        // Generate HTML for each version
        const versionsHtml = versionsToPrint.map((v, index) => {
             const totals = calculateTotals(v.items);
             const isLast = index === versionsToPrint.length - 1;
             
             return `
                <div class="page-break">
                    <div class="header">
                        <div class="logo">360° Retail Media</div>
                        <div class="meta">
                            <p><strong>Cliente:</strong> ${config.clientName}</p>
                            <p><strong>Proyecto:</strong> ${config.projectName}</p>
                            <p class="version-tag">${v.name}</p>
                            <p><strong>Fecha:</strong> ${config.date}</p>
                        </div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Detalle</th>
                                <th>Cant.</th>
                                <th>Precio Unit.</th>
                                <th>Desc.</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${v.items.map(item => `
                                <tr>
                                    <td><strong>${item.item}</strong></td>
                                    <td style="font-size: 12px; color: #666;">${item.specs || ''} - ${item.format_size || ''}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${Number(item.unitPrice).toLocaleString('es-AR')}</td>
                                    <td>${item.discount > 0 ? item.discount + '%' : '-'}</td>
                                    <td style="text-align: right;">$${((item.unitPrice * item.quantity) * (1 - (item.discount || 0)/100)).toLocaleString('es-AR')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                     <div class="totals">
                        <div class="totals-box">
                            <div class="row"><span>Subtotal:</span> <span>$${totals.subtotal.toLocaleString('es-AR')}</span></div>
                             ${totals.totalDiscount > 0 ? `<div class="row" style="color: red;"><span>Descuento:</span> <span>-$${totals.totalDiscount.toLocaleString('es-AR')}</span></div>` : ''}
                            <div class="row total-row"><span>Total:</span> <span>$${totals.total.toLocaleString('es-AR')}</span></div>
                        </div>
                    </div>
                </div>
                ${!isLast ? '<div style="page-break-after: always;"></div>' : ''}
             `;
        }).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Cotización - ${config.projectName}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #000; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                        .logo { font-size: 24px; font-weight: bold; }
                        .meta { text-align: right; font-size: 14px; }
                        .version-tag { background: #000; color: #fff; display: inline-block; padding: 2px 8px; font-size: 12px; border-radius: 4px; margin: 4px 0; }
                        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        .table th { text-align: left; border-bottom: 1px solid #ccc; padding: 10px; font-size: 12px; text-transform: uppercase; }
                        .table td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
                        .totals { display: flex; justify-content: flex-end; }
                        .totals-box { width: 300px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .total-row { font-weight: bold; font-size: 18px; border-top: 1px solid #000; padding-top: 10px; margin-top: 10px; }
                        .page-break { position: relative; }
                        @media print {
                            .page-break { page-break-after: always; }
                            .page-break:last-child { page-break-after: auto; }
                        }
                    </style>
                </head>
                <body>
                    ${versionsHtml}
                    <div style="margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
                        <p><strong>Notas Globales:</strong> ${config.notes || 'Precios sujetos a disponibilidad.'}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handleDownloadPDF = async () => {
        try {
            // Lazy load jsPDF
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(22);
            doc.text("Cotización", 20, 20);
            
            doc.setFontSize(12);
            doc.text(`Cliente: ${config.clientName}`, 20, 30);
            doc.text(`Proyecto: ${config.projectName}`, 20, 36);
            doc.text(`Fecha: ${config.date}`, 20, 42);
            
            // Table Header
            let y = 60;
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Item", 20, y);
            doc.text("Cant.", 100, y);
            doc.text("Precio", 130, y);
            doc.text("Total", 160, y);
            doc.line(20, y+2, 190, y+2);
            doc.setTextColor(0);
            
            y += 10;
            
            // Items
            activeVersion.items.forEach(item => {
                const itemLabel = item.item.length > 40 ? item.item.substring(0, 37) + '...' : item.item;
                doc.text(itemLabel, 20, y);
                doc.text(String(item.quantity), 100, y);
                doc.text(`$${Number(item.unitPrice).toLocaleString('es-AR')}`, 130, y);
                
                const total = (item.unitPrice * item.quantity) * (1 - (item.discount/100));
                doc.text(`$${total.toLocaleString('es-AR')}`, 160, y);
                
                y += 8;
            });
            
            // Total
            y += 10;
            doc.setFontSize(14);
            doc.text(`Total: $${currentTotals.total.toLocaleString('es-AR')}`, 140, y);
            
            doc.save(`Cotizacion-${config.projectName || 'Draft'}.pdf`);
            
        } catch (error) {
            console.error("Failed to load jsPDF", error);
            alert("Funcionalidad en beta. Requiere instalar jspdf: npm install jspdf");
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isOpen ? '' : 'hidden'}`}>
             <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
             
             <div className={`relative w-full max-w-5xl ${theme.cardBg} backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300`}>
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20 rounded-t-2xl">
                    <div>
                        <h2 className={`text-xl font-bold ${theme.text}`}>Generar Cotización</h2>
                        <div className="flex items-center gap-2 mt-1">
                            {/* Simple Step Indicator */}
                            {[1, 2, 3].map(s => (
                                <React.Fragment key={s}>
                                    <button 
                                        onClick={() => setStep(s)}
                                        className={`cursor-pointer text-xs px-2 py-0.5 rounded-full transition-all border border-transparent ${step === s ? theme.accentBg + ' text-black font-bold' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:border-white/10'}`}
                                        disabled={step === 1 && s > 1 && !config.clientName} // Optional constraint
                                    >
                                        {s === 1 ? '1. Datos' : s === 2 ? '2. Propuesta' : '3. Exportar'}
                                    </button>
                                    {s < 3 && <div className="w-4 h-[1px] bg-white/10"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className={theme.text}/></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    {/* STEP 1: CONFIG */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cliente Smart Input */}
                                <div>
                                    <label className={`text-xs font-bold uppercase ${theme.textSecondary} mb-1 block`}>Cliente / Marca</label>
                                    <div className="relative group">
                                        <Briefcase className={`absolute left-3 top-2.5 opacity-50 ${theme.textSecondary}`} size={16} />
                                        <input 
                                            type="text" 
                                            value={config.clientName}
                                            onChange={handleClientChange}
                                            onFocus={() => setShowClientDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)} // Delay to allow click
                                            className={`w-full ${theme.inputBg} border border-white/10 rounded-xl pl-10 pr-4 py-2 ${theme.text} focus:outline-none focus:border-[#E8A631] transition-colors`}
                                            placeholder="Buscar o escribir nuevo..."
                                            autoFocus
                                        />
                                        
                                        {/* Custom Dropdown */}
                                        {showClientDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                {availableClients.filter(c => c.name.toLowerCase().includes(config.clientName.toLowerCase())).length > 0 ? (
                                                    availableClients
                                                    .filter(c => c.name.toLowerCase().includes(config.clientName.toLowerCase()))
                                                    .map((client, i) => (
                                                        <div 
                                                            key={i} 
                                                            onClick={() => selectClient(client)}
                                                            className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center justify-between border-b border-white/5 last:border-0 transition-colors"
                                                        >
                                                            <div>
                                                                <div className="font-bold text-sm text-white">{client.name}</div>
                                                                <div className="text-xs text-white/40">{client.type}</div>
                                                            </div>
                                                            {config.clientId === client.id && <Check size={14} className="text-[#E8A631]"/>}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-white/40">
                                                        No se encontraron resultados. <br/> Se usará "{config.clientName}" como texto libre.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {config.clientId && (
                                            <div className="absolute right-3 top-2.5 text-green-400 text-xs flex items-center gap-1 cursor-help pointer-events-none" title="Cliente vinculado exitosamente">
                                                <Monitor size={12}/> <span className="hidden sm:inline">Vinculado</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Project Smart Input */}
                                <div>
                                    <label className={`text-xs font-bold uppercase ${theme.textSecondary} mb-1 block`}>Proyecto</label>
                                    <div className="relative">
                                         <User className={`absolute left-3 top-2.5 opacity-50 ${theme.textSecondary}`} size={16} />
                                         <input 
                                            list="projects-list"
                                            type="text" 
                                            value={config.projectName}
                                            onChange={handleProjectChange}
                                            onBlur={handleCreateProject} 
                                            className={`w-full ${theme.inputBg} border border-white/10 rounded-xl pl-10 pr-4 py-2 ${theme.text} focus:outline-none focus:border-[${theme.accent}]`}
                                            placeholder="Seleccionar o Crear Nuevo..."
                                        />
                                        <datalist id="projects-list">
                                            {campaigns.map(p => <option key={p.id} value={p.name} />)}
                                        </datalist>
                                        {!config.projectId && config.projectName.length > 2 && (
                                            <div className="absolute right-3 top-2.5 text-yellow-400 text-xs flex items-center gap-1">
                                                <Plus size={12}/> Nuevo
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className={`text-xs font-bold uppercase ${theme.textSecondary} mb-1 block`}>Fecha Emisión</label>
                                    <div className="relative">
                                        <Calendar className={`absolute left-3 top-2.5 opacity-50 ${theme.textSecondary}`} size={16} />
                                        <input 
                                            type="date" 
                                            value={config.date}
                                            onChange={(e) => setConfig({...config, date: e.target.value})}
                                            className={`w-full ${theme.inputBg} border border-white/10 rounded-xl pl-10 pr-4 py-2 ${theme.text} h-[42px] color-scheme-dark`}
                                        />
                                    </div>
                                </div>
                                 <div>
                                    <label className={`text-xs font-bold uppercase ${theme.textSecondary} mb-1 block`}>Válido Hasta</label>
                                    <div className="relative">
                                        <Clock className={`absolute left-3 top-2.5 opacity-50 ${theme.textSecondary}`} size={16} />
                                        <input 
                                            type="date" 
                                            value={config.validUntil}
                                            onChange={(e) => setConfig({...config, validUntil: e.target.value})}
                                            className={`w-full ${theme.inputBg} border border-white/10 rounded-xl pl-10 pr-4 py-2 ${theme.text} h-[42px] color-scheme-dark`}
                                        />
                                    </div>
                                </div>
                             </div>
                             
                             <div>
                                <label className={`text-xs font-bold uppercase ${theme.textSecondary} mb-1 block`}>Notas Adicionales</label>
                                <textarea 
                                    value={config.notes}
                                    onChange={(e) => setConfig({...config, notes: e.target.value})}
                                    className={`w-full ${theme.inputBg} border border-white/10 rounded-xl p-4 ${theme.text} resize-none h-24 focus:outline-none focus:border-[${theme.accent}]`}
                                    placeholder="Condiciones de pago, aclaraciones, etc."
                                />
                             </div>
                        </div>
                    )}

                    {/* STEP 2: ITEMS REVIEW (VERSIONS) */}
                    {step === 2 && (
                        <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                            
                            {/* Version Tabs */}
                            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2 overflow-x-auto">
                                {versions.map(v => (
                                    <div 
                                        key={v.id}
                                        onClick={() => setActiveVersionId(v.id)}
                                        className={`group relative px-4 py-2 rounded-t-lg transition-all cursor-pointer flex items-center gap-2 ${activeVersionId === v.id ? 'bg-white/10 text-white border-b-2 border-[#E8A631]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <span className="text-sm font-medium whitespace-nowrap">{v.name}</span>
                                        {versions.length > 1 && (
                                            <button 
                                                onClick={(e) => handleRemoveVersion(e, v.id)}
                                                className={`opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded ${activeVersionId === v.id ? 'opacity-100' : ''}`}
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {versions.length < 3 && (
                                    <button 
                                        onClick={handleAddVersion}
                                        className="ml-2 px-3 py-1.5 rounded-full border border-dashed border-white/20 text-xs text-white/50 hover:text-white hover:border-white/50"
                                    >
                                        + Nueva Opción
                                    </button>
                                )}
                            </div>

                            {/* Table */}
                            <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5 mb-6 flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-black/20 text-xs text-white/50 uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                                        <tr>
                                            <th className="p-3 pl-4">Item</th>
                                            <th className="p-3 w-24 text-center">Cant.</th>
                                            <th className="p-3 w-24 text-center">Días</th>
                                            <th className="p-3 text-right">Precio Unit.</th>
                                            <th className="p-3 w-24 text-center">Desc. %</th>
                                            <th className="p-3 text-right pr-4">Subtotal</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-white/80">
                                        {activeVersion.items.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center text-white/30 italic">
                                                    No hay items en esta opción.
                                                </td>
                                            </tr>
                                        )}
                                        {activeVersion.items.map(item => (
                                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-3 pl-4">
                                                    <div className="font-bold">{item.item}</div>
                                                    <div className="text-xs text-white/40">{item.format_size}</div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                        className={`w-16 bg-transparent border-b border-white/20 text-center py-1 focus:outline-none focus:border-[#E8A631] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:border-white/50 transition-colors font-mono`}
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.days}
                                                        onChange={(e) => updateItem(item.id, 'days', parseInt(e.target.value) || 1)}
                                                        className={`w-16 bg-transparent border-b border-white/20 text-center py-1 focus:outline-none focus:border-[#E8A631] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:border-white/50 transition-colors font-mono`}
                                                    />
                                                </td>
                                                <td className="p-3 text-right font-mono">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <span className="text-white/40">$</span>
                                                        <input 
                                                            type="text" 
                                                            value={item.unitPrice}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                updateItem(item.id, 'unitPrice', val);
                                                            }}
                                                            className="w-24 bg-transparent border-b border-white/20 text-right py-1 focus:outline-none focus:border-[#E8A631] hover:border-white/50 transition-colors font-mono"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                     <input 
                                                        type="number" 
                                                        min="0" max="100"
                                                        value={item.discount}
                                                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                        className={`w-12 bg-transparent border-b border-white/20 text-center py-1 focus:outline-none focus:border-[#E8A631] text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:border-white/50 transition-colors font-mono`}
                                                    />
                                                </td>
                                                <td className="p-3 text-right font-mono font-bold text-white">
                                                    $ {((item.unitPrice * item.quantity) * (1 - (item.discount/100))).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => handleRemoveItem(item.id)} className="text-white/30 hover:text-red-400">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button 
                                    onClick={() => setIsAddItemModalOpen(true)}
                                    className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#E8A631] hover:bg-[#E8A631]/10 transition-colors border-t border-white/10"
                                >
                                    <Plus size={14}/> Agregar Item a {activeVersion.name}
                                </button>
                            </div>
                            
                            {/* Summary Bar */}
                            <div className="flex justify-end">
                                <div className="bg-black/30 p-4 rounded-xl border border-white/10 w-64 space-y-2">
                                    <div className="flex justify-between text-sm text-white/60">
                                        <span>Subtotal ({activeVersion.name})</span>
                                        <span>$ {currentTotals.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-400">
                                        <span>Descuentos</span>
                                        <span>- $ {currentTotals.totalDiscount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-white border-t border-white/10 pt-2 mt-2">
                                        <span>Total</span>
                                        <span className={theme.accent}>$ {currentTotals.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                     {/* STEP 3: PREVIEW */}
                    {step === 3 && (
                        <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col h-full items-center justify-center">
                             
                             <div className="grid grid-cols-1 gap-6 w-full max-w-2xl">
                                <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center space-y-4">
                                    <div className="bg-[#4ade80]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-[#4ade80]">
                                        <Layers size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">¡Cotización Lista!</h3>
                                    <p className="text-white/60">Has configurado <strong>{versions.length} versiones</strong> de presupuesto.</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <button 
                                            onClick={() => handlePrint(false)}
                                            className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Printer className="text-white/50 group-hover:text-white" />
                                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/60">Simple</span>
                                            </div>
                                            <div className="font-bold text-white">Versión Actual</div>
                                            <div className="text-xs text-white/50">Imprime solo "{activeVersion.name}"</div>
                                        </button>

                                        <button 
                                            onClick={() => handlePrint(true)}
                                            className={`p-4 ${theme.accentBg} text-black rounded-xl hover:opacity-90 transition-all text-left shadow-lg shadow-orange-500/10`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Copy className="opacity-60" />
                                                <span className="text-xs bg-black/10 px-2 py-0.5 rounded opacity-60">Recomendado</span>
                                            </div>
                                            <div className="font-bold">Todas las Versiones</div>
                                            <div className="text-xs opacity-60">Imprime {versions.length} opciones en un PDF</div>
                                        </button>
                                    </div>

                                    <button 
                                        onClick={handleDownloadPDF}
                                        className="mt-4 w-full py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2 transition-all font-medium text-sm"
                                    >
                                        <Download size={16} /> Descargar PDF (Generador Nativo)
                                    </button>
                                </div>
                             </div>
                        </div>
                    )}

                </div>

                {/* ADD ITEM MODAL */}
                 {isAddItemModalOpen && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-8 rounded-2xl animate-in fade-in duration-200">
                        <div className={`w-full max-w-2xl ${theme.cardBg} border border-white/10 rounded-2xl flex flex-col max-h-full shadow-2xl`}>
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-white">Agregar Item al Presupuesto</h3>
                                <button onClick={() => setIsAddItemModalOpen(false)}><X className="text-white/50 hover:text-white"/></button>
                            </div>
                            <div className="p-4 border-b border-white/10 bg-black/20">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Buscar en tarifario..."
                                    className="w-full bg-transparent text-white placeholder-white/30 outline-none text-lg"
                                    value={addItemSearch}
                                    onChange={e => setAddItemSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                {(rateCardItems || [])
                                    .filter(i => 
                                        i.item.toLowerCase().includes(addItemSearch.toLowerCase()) || 
                                        i.category.toLowerCase().includes(addItemSearch.toLowerCase()) ||
                                        (i.format_size || '').toLowerCase().includes(addItemSearch.toLowerCase())
                                    )
                                    .map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleAddItem(item)}
                                        className="p-3 hover:bg-white/10 rounded-xl cursor-pointer flex justify-between items-center group transition-colors border-b border-white/5 last:border-0"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-white">{item.item}</div>
                                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50 uppercase tracking-wide">{item.category}</span>
                                            </div>
                                            <div className="text-xs text-white/40 mt-1 flex gap-2">
                                                <span>{item.format_size || 'N/A'}</span>
                                                <span>•</span>
                                                <span className="font-mono text-white/60">$ {Number(item.price).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-[#E8A631] opacity-0 group-hover:opacity-100 font-bold text-xs transition-opacity bg-[#E8A631]/10 px-3 py-1.5 rounded-lg border border-[#E8A631]/20">
                                            + AGREGAR
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                 )}
                {/* Footer Controls */}
                <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between items-center rounded-b-2xl">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className={`px-6 py-2 rounded-xl border border-white/10 ${theme.textSecondary} hover:bg-white/5 flex items-center gap-2 font-bold transition-colors`}
                    >
                        {step === 1 ? 'Cancelar' : <><ArrowLeft size={18} /> Volver</>}
                    </button>

                    {step < 3 && (
                         <button 
                            onClick={() => setStep(step + 1)} 
                            className={`px-8 py-2 rounded-xl ${theme.accentBg} text-black font-bold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-orange-900/10 transition-all`}
                        >
                            Siguiente <ArrowRight size={18} />
                        </button>
                    )}
                </div>

             </div>
        </div>
    );
};

export default QuoteWizard;
