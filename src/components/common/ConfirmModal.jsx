import React from 'react';
import { AlertCircle, Trash2, Info, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, variant = 'danger', confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    const variants = {
        danger: {
            icon: Trash2,
            iconColor: 'text-red-400',
            iconBg: 'bg-red-500/20',
            buttonBg: 'bg-red-500 hover:bg-red-600',
            buttonText: 'text-white'
        },
        warning: {
            icon: AlertCircle,
            iconColor: 'text-yellow-400',
            iconBg: 'bg-yellow-500/20',
            buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
            buttonText: 'text-black'
        },
        info: {
            icon: Info,
            iconColor: 'text-blue-400',
            iconBg: 'bg-blue-500/20',
            buttonBg: 'bg-blue-500 hover:bg-blue-600',
            buttonText: 'text-white'
        }
    };

    const style = variants[variant] || variants.danger;
    const Icon = style.icon;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 shadow-2xl ${theme.cardBg} ${theme.text} animate-in zoom-in-95 duration-200`} onClick={e => e.stopPropagation()}>
                
                <div className="p-6 text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center mb-4`}>
                        <Icon size={24} className={style.iconColor} />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className={`${theme.textSecondary} text-sm mb-6`}>{message}</p>
                    
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-bold border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg ${style.buttonBg} ${style.buttonText}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ConfirmModal;
