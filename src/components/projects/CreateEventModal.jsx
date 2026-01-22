import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { MapPin, Users, Calendar, Clock, Link, Music, Coffee, Truck } from 'lucide-react';
import Modal from '../common/Modal';
import { useCreateCampaign, useUpdateCampaign } from '../../hooks/useMutateCampaigns';
import { useCreateTransaction } from '../../hooks/useTransactions'; // Billing Integration

import GlassSelect from '../common/GlassSelect';
import ResourceSelector from '../common/ResourceSelector';
import { useCampaigns } from '../../hooks/useCampaigns';

const CreateEventModal = ({ isOpen, onClose, initialData = null }) => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const { data: projects = [] } = useCampaigns();
    const campaigns = projects.filter(p => p.type === 'Campaña');

    const { mutateAsync: createProject } = useCreateCampaign();
    const { mutateAsync: updateProject } = useUpdateCampaign();
    const { mutateAsync: createTransaction } = useCreateTransaction();

    const [isSubmitting, setIsSubmitting] = useState(false); // Fix: Prevent duplicates

    const [form, setForm] = useState({
        id: null,
        name: '',
        status: 'Planificación',
        type: 'Eventos',
        venue: '',
        capacity: '',
        start_date: '',
        end_date: '',
        parent_id: '', // Future: Link to Campaign
        notes: '',
        providers: [],
        resources: [] // New: Rate Card Items
    });

    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'costs'

    useEffect(() => {
        if (isOpen) {
                setForm((prev) => {
                    if (initialData) {
                        // Avoid unnecessary updates if id matches
                        if (prev.id === initialData.id && prev.name === initialData.name) return prev;
                        return { 
                            ...initialData, 
                            type: 'Eventos', 
                            resources: initialData.resources || [] 
                        };
                    }
                    // Reset if no initialData
                    return { id: null, name: '', status: 'Planificación', type: 'Eventos', venue: '', capacity: '', start_date: '', end_date: '', parent_id: '', notes: '', providers: [], resources: [] };
                });
                setActiveTab('details');
        }
    }, [isOpen, initialData]);

    const handleNumericChange = (field, e) => {
        const value = e.target.value.replace(/\D/g, '');
        const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        setForm({ ...form, [field]: formatted });
    };

    // Helper for datetime-local input
    const formatDateTimeLocal = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            // Format to yyyy-MM-ddThh:mm
            return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        } catch (e) {
            return '';
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) return addToast('Nombre del evento obligatorio', 'error');
        if (isSubmitting) return; 

        setIsSubmitting(true);
        
        // Ensure valid date format for DB (ISO)
        const finalForm = { 
            ...form, 
            date: form.start_date ? new Date(form.start_date).toISOString() : new Date().toISOString()
        };

        try {
            if (form.id) {
                await updateProject(finalForm);
                addToast('Evento actualizado', 'success');
            } else {
                const newProject = await createProject({ ...finalForm, progress: 0 });
                
                // BILLING INTEGRATION: Automate Rate Card -> Transactions
                if (newProject && newProject.id && form.resources?.length > 0) {
                    const promises = form.resources.map(res => {
                        return createTransaction({
                             project_id: newProject.id,
                             date: finalForm.date,
                             amount: res.total,
                             type: 'expense', // Gasto
                             // category: 'Producción', // REMOVED: Column does not exist
                             concept: `[Tarifario] ${res.category} - ${res.item || res.name}`,
                             status: 'Pendiente', 
                             supplier_id: null 
                        });
                    });
                    await Promise.all(promises);
                }
                
                addToast('Evento creado y proyección de costos generada', 'success');
            }
            onClose();
        } catch (err) {
            console.error(err);
            addToast('Error al guardar: ' + (err.message || ''), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={form.id ? "Gestionar Evento" : "Nuevo Evento Operativo"} size="lg">
            <div className="space-y-5 animate-in fade-in">
                
                {/* Header Info */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-white/50 mb-1 block">Nombre del Evento</label>
                        <input autoFocus type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none font-bold`} placeholder="Ej. Lanzamiento Producto X" />
                    </div>
                    <div className="w-1/3">
                        <label className="text-xs text-white/50 mb-1 block">Estado</label>
                         <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none [&>option]:text-black`}>
                                <option>Planificación</option>
                                <option>En Curso</option>
                                <option>Pendiente</option>
                                <option>Finalizado</option>
                        </select>
                    </div>
                </div>

                {/* Logistics Grid */}
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                        <MapPin size={12}/> Logística & Sede
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-3.5 text-white/40"/>
                            <input type="text" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className={`w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-[#E8A631] outline-none`} placeholder="Lugar / Sede" />
                        </div>
                        <div className="relative">
                            <Users size={16} className="absolute left-3 top-3.5 text-white/40"/>
                            <input type="text" value={form.capacity} onChange={e => handleNumericChange('capacity', e)} className={`w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-[#E8A631] outline-none`} placeholder="Aforo Estimado" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="text-[10px] text-white/50 mb-1 ml-1 block">Inicio</label>
                            <Calendar size={16} className="absolute left-3 top-8 text-white/40"/>
                            <input 
                                type="datetime-local" 
                                value={formatDateTimeLocal(form.start_date)} 
                                onChange={e => setForm({...form, start_date: e.target.value})} 
                                className={`w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-[#E8A631] outline-none`} 
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] text-white/50 mb-1 ml-1 block">Fin</label>
                            <Clock size={16} className="absolute left-3 top-8 text-white/40"/>
                            <input 
                                type="datetime-local" 
                                value={formatDateTimeLocal(form.end_date)} 
                                onChange={e => setForm({...form, end_date: e.target.value})} 
                                className={`w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-[#E8A631] outline-none`} 
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 border-b border-white/10 mb-6">
                    <button onClick={() => setActiveTab('details')} className={`pb-2 text-sm font-bold ${activeTab === 'details' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/40'}`}>Logística</button>
                    <button onClick={() => setActiveTab('costs')} className={`pb-2 text-sm font-bold ${activeTab === 'costs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/40'}`}>Costos (Tarifario)</button>
                </div>

                {/* DETAILS TAB */}
                {activeTab === 'details' && (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Parent Link */}
                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 space-y-3">
                         <div className="flex items-center gap-2 mb-2">
                            <Link size={16} className="text-blue-400"/>
                            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Vincular a Estrategia</span>
                         </div>
                         
                         <div>
                            <label className="text-xs text-blue-200/50 mb-1 block">Campaña Padre</label>
                            <GlassSelect 
                                options={campaigns.map(c => ({ value: c.id, label: c.name }))}
                                value={form.parent_id || ''}
                                onChange={(val) => setForm({...form, parent_id: val})}
                                placeholder="Seleccionar Campaña Principal..."
                                icon={<Link size={16}/>}
                            />
                            <p className="text-[10px] text-blue-300/60 mt-2">Al vincular, este evento sumará sus gastos al presupuesto global de la campaña seleccionada.</p>
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
                            label="Costos Operativos Estimados"
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white text-sm font-bold">Cancelar</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="bg-white text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? 'Guardando...' : 'Guardar Evento'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateEventModal;
