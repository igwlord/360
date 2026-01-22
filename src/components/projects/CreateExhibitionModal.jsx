import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Layout, Maximize, Store, Link } from 'lucide-react';
import Modal from '../common/Modal';
import GlassSelect from '../common/GlassSelect'; // Re-use generic select
import ResourceSelector from '../common/ResourceSelector';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useCreateCampaign, useUpdateCampaign } from '../../hooks/useMutateCampaigns';

const CreateExhibitionModal = ({ isOpen, onClose, initialData = null }) => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const { data: providerGroups = [] } = useSuppliers();
    const { data: projects = [] } = useCampaigns();
    const campaigns = projects.filter(p => p.type === 'Campaña');
    const { mutateAsync: updateProject } = useUpdateCampaign();
    const { mutateAsync: createProject } = useCreateCampaign();

    const [isSubmitting, setIsSubmitting] = useState(false); // Fix duplicates

    // Flatten providers
    const allProviders = providerGroups.flatMap(g => g.contacts);
    const retailers = allProviders.filter(() => true); // Show all for now, filter by 'Retailer' later

    const [form, setForm] = useState({
        id: null,
        name: '',
        status: 'Planificación',
        type: 'Exhibiciones',
        date: new Date().toISOString().split('T')[0], // Fixed: Initialize with date string to avoid undefined
        booth_type: '',
        dimensions: '',
        retailer_id: '',
        notes: '',
        providers: [],
        resources: [] 
    });

    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'costs'

    useEffect(() => {
        if (isOpen) {
            setForm((prev) => {
                const safeDate = (dateStr) => {
                    if (!dateStr) return '';
                    try {
                        return new Date(dateStr).toISOString().split('T')[0];
                    } catch { return ''; }
                };

                if (initialData && initialData.id !== prev.id) {
                    return { 
                        ...initialData, 
                        type: 'Exhibiciones', 
                        date: safeDate(initialData.date), 
                        resources: initialData.resources || [] 
                    };
                }
                
                if (!initialData) {
                    return { 
                        id: null, 
                        name: '', 
                        status: 'Planificación', 
                        type: 'Exhibiciones', 
                        date: '', 
                        booth_type: '', 
                        dimensions: '', 
                        retailer_id: '', 
                        notes: '', 
                        providers: [], 
                        resources: [] 
                    };
                }
                return prev;
            });
            setActiveTab('details');
        }
    }, [isOpen, initialData]);

    const handleSave = async () => {
        if (!form.name.trim()) return addToast('Nombre de exhibición obligatorio', 'error');
        if (isSubmitting) return;

        setIsSubmitting(true);
        // Logic: Add selected retailer to providers list automatically
        let finalProviders = [...(form.providers || [])];
        if (form.retailer_id && !finalProviders.includes(form.retailer_id)) {
            finalProviders.push(form.retailer_id);
        }

        // Sanitize Payload (ensure no null/undefined in critical fields)
        // Schema Fix: Move booth_type and dimensions to notes as they don't exist in 'campaigns' table
        const extraDetails = `\n\n[Detalles Exhibición]\nTipo: ${form.booth_type || 'N/A'}\nDimensiones: ${form.dimensions || 'N/A'}`;
        
        const finalForm = { 
            name: form.name,
            status: form.status,
            type: 'Exhibiciones',
            date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
            notes: (form.notes || '') + extraDetails,
            retailer_id: form.retailer_id || '', 
            providers: finalProviders.filter(Boolean),
            id: form.id // Include ID for updates
        };

        try {
            if (form.id) {
                await updateProject(finalForm);
                addToast('Exhibición actualizada', 'success');
            } else {
                await createProject({ ...finalForm, progress: 0 });
                addToast('Exhibición creada', 'success');
            }
            onClose();
        } catch (error) {
            console.error(error);
            addToast('Error al guardar', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={form.id ? "Gestionar Exhibición" : "Nueva Exhibición"} size="lg">
            <div className="space-y-6 animate-in fade-in">
                
                {/* Header Info */}
                <div className="grid grid-cols-3 gap-4">
                     <div className="col-span-2">
                        <label className="text-xs text-white/50 mb-1 block">Nombre de la Implementación</label>
                        <input autoFocus type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none font-bold`} placeholder="Ej. Isla Samsung Alto Las Condes" />
                     </div>
                     <div>
                        <label className="text-xs text-white/50 mb-1 block">Estado</label>
                         <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none [&>option]:text-black`}>
                                <option>Planificación</option>
                                <option>En Curso</option>
                                <option>Pendiente</option>
                                <option>Finalizado</option>
                        </select>
                     </div>
                     <div className="col-span-3">
                        <label className="text-xs text-white/50 mb-1 block">Fecha de Implementación</label>
                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none`} />
                     </div>
                </div>

                <div className="flex gap-6 border-b border-white/10 mb-6">
                    <button onClick={() => setActiveTab('details')} className={`pb-2 text-sm font-bold ${activeTab === 'details' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/40'}`}>Ficha Técnica</button>
                    <button onClick={() => setActiveTab('costs')} className={`pb-2 text-sm font-bold ${activeTab === 'costs' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/40'}`}>Implementación (Tarifario)</button>
                </div>

                {/* DETAILS TAB */}
                {activeTab === 'details' && (
                  <div className="space-y-5 animate-in fade-in">
                    {/* Parent Link */}
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 space-y-3">
                         <div className="flex items-center gap-2 mb-2">
                            <Link size={16} className="text-purple-400"/>
                            <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">Vincular a Estrategia</span>
                         </div>
                         
                         <div>
                            <label className="text-xs text-purple-200/50 mb-1 block">Campaña Padre</label>
                            <GlassSelect 
                                options={campaigns.map(c => ({ value: c.id, label: c.name }))}
                                value={form.parent_id || ''}
                                onChange={(val) => setForm({...form, parent_id: val})}
                                placeholder="Seleccionar Campaña Principal..."
                                icon={<Link size={16}/>}
                            />
                         </div>
                    </div>

                    {/* Tech Specs */}
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-5">
                        <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <Layout size={12}/> Ficha Técnica
                        </h4>
                        
                        <div>
                             <label className="text-xs text-white/50 mb-1 block">Retailer / Cadena / Punto Venta</label>
                             <GlassSelect 
                                options={retailers.map(c => ({ value: c.id, label: c.company }))}
                                value={form.retailer_id || ''}
                                onChange={(val) => setForm({...form, retailer_id: val})}
                                placeholder="Buscar Retailer (ej. Falabella)"
                                icon={<Store size={16}/>}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="relative">
                                <label className="text-xs text-white/50 mb-1 block">Tipo de Soporte</label>
                                <select value={form.booth_type} onChange={e => setForm({...form, booth_type: e.target.value})} className={`w-full bg-black/20 border border-white/10 rounded-xl pl-3 pr-4 py-3 text-white text-sm focus:border-[#E8A631] outline-none appearance-none [&>option]:text-black [&>optgroup]:text-black [&>optgroup]:font-bold`}>
                                    <option value="" disabled>Seleccionar Tipo</option>
                                    <optgroup label="Exhibiciones de Piso">
                                        <option value="Isla">Isla (360° - 4 caras)</option>
                                        <option value="Cabecera">Cabecera de Góndola (Endcap)</option>
                                        <option value="Lineal">Mueble Lineal (Inline)</option>
                                        <option value="Corner">Corner (Esquina)</option>
                                        <option value="Pallet">Pallet / Botadero (Dump bin)</option>
                                        <option value="Chimenea">Chimenea (Vertical)</option>
                                        <option value="Sidekick">Sidekick / Arete</option>
                                    </optgroup>
                                    <optgroup label="Señalética y POP">
                                        <option value="Stopper">Rompetráfico (Stopper)</option>
                                        <option value="Cenefa">Cenefa / Regleta</option>
                                        <option value="Faldon">Faldón</option>
                                        <option value="FloorGraphic">Floor Graphic (Suelo)</option>
                                        <option value="Checkout">Caja / Check-out</option>
                                        <option value="Dangler">Colgante / Móvil (Dangler)</option>
                                    </optgroup>
                                </select>
                             </div>
                             <div>
                                <label className="text-xs text-white/50 mb-1 block">Dimensiones</label>
                                <div className="relative">
                                    <Maximize size={16} className="absolute left-3 top-3.5 text-white/40"/>
                                    <input type="text" value={form.dimensions} onChange={e => setForm({...form, dimensions: e.target.value})} className={`w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-[#E8A631] outline-none`} placeholder="Ej. 3x3 mts" />
                                </div>
                             </div>
                        </div>
                    </div>
                  </div>
                )}

                {/* COSTS TAB */}
                {activeTab === 'costs' && (
                    <div className="space-y-4 animate-in fade-in h-[400px] overflow-y-auto custom-scrollbar">
                        <ResourceSelector  
                            selectedResources={form.resources || []}
                            onChange={(newResources) => setForm({...form, resources: newResources})}
                            label="Materiales & Producción"
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white text-sm font-bold">Cancelar</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="bg-purple-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-purple-400 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Guardando...' : 'Guardar Exhibición'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateExhibitionModal;
