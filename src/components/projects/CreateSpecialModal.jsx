import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Star, Calendar, Flag, Loader2 } from 'lucide-react';
import Modal from '../common/Modal.tsx';
import { useCreateCampaign, useUpdateCampaign } from '../../hooks/useMutateCampaigns';

const getInitialForm = (initialData) => {
    if (initialData) {
        return { ...initialData, type: 'Especiales' };
    }
    return {
        id: null,
        name: '',
        status: 'Planificación',
        type: 'Especiales',
        date: '',
        notes: '',
        providers: []
    };
};

const CreateSpecialModal = ({ isOpen, onClose, initialData = null }) => {
    const { theme } = useTheme();
    const { addToast } = useToast();
    const { mutateAsync: createProject } = useCreateCampaign();
    const { mutateAsync: updateProject } = useUpdateCampaign();

    const initialForm = useMemo(() => getInitialForm(initialData), [initialData]);
    const [form, setForm] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens with new initialData
    React.useEffect(() => {
        if (isOpen) {
            const newForm = getInitialForm(initialData);
            setForm(newForm);
        }
    }, [isOpen, initialData]);

    const handleSave = async () => {
        if (!form.name.trim()) return addToast('Nombre obligatorio', 'error');
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (form.id) {
                await updateProject(form);
                addToast('Proyecto Especial actualizado', 'success');
            } else {
                await createProject({ ...form, progress: 0 });
                addToast('Proyecto Especial creado', 'success');
            }
            onClose();
        } catch {
            addToast('Error al guardar', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={form.id ? "Proyecto Especial" : "Nuevo Especial / Hito"} size="lg">
            <div className="space-y-6 animate-in fade-in">
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 items-start">
                    <Star className="text-yellow-500 mt-1" size={20} />
                    <div>
                         <h4 className="font-bold text-yellow-500 text-sm">Gestión de Hitos y Especiales</h4>
                         <p className="text-xs text-yellow-200/60 mt-1">Utiliza este módulo para cargar efemérides (CyberDay, Navidad) o proyectos coyunturales que no encajan en Campañas tradicionales.</p>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-white/50 mb-1 block">Nombre del Hito / Proyecto</label>
                    <input autoFocus type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none font-bold`} placeholder="Ej. Cyber Monday 2026" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs text-white/50 mb-1 block">Fecha Clave</label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-3.5 text-white/40"/>
                            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={`w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-[#E8A631] outline-none`} />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs text-white/50 mb-1 block">Prioridad / Estado</label>
                         <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none [&>option]:text-black`}>
                                <option>Planificación</option>
                                <option>En Curso</option>
                                <option>Pendiente</option>
                                <option>Finalizado</option>
                        </select>
                     </div>
                </div>

                <div>
                     <label className="text-xs text-white/50 mb-1 block">Notas / Observaciones</label>
                     <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={`w-full ${theme.inputBg} border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E8A631] outline-none h-24 resize-none`} placeholder="Detalles estratégicos..." />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="px-4 py-2 text-white/60 hover:text-white text-sm font-bold">Cancelar</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-yellow-400 shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[150px]">
                        {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : 'Guardar Especial'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateSpecialModal;
