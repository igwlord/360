
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", isDanger = false }) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative w-full max-w-md ${theme.cardBg} border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200`}>
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-500/20 text-red-500' : 'bg-[#E8A631]/20 text-[#E8A631]'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>
                </div>
                
                <p className="text-white/70 mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 ${isDanger ? 'bg-red-600 hover:bg-red-500' : `${theme.accentBg} text-black`}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
