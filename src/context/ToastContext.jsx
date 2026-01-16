
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), duration);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div 
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] max-w-sm backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 ${
                            toast.type === 'success' ? 'bg-green-900/40 border-green-500/30' : 
                            toast.type === 'error' ? 'bg-red-900/40 border-red-500/30' : 
                            toast.type === 'warning' ? 'bg-yellow-900/40 border-yellow-500/30' : 
                            'bg-blue-900/40 border-blue-500/30'
                        }`}
                    >
                        <div className={`mt-0.5 ${
                            toast.type === 'success' ? 'text-green-400' : 
                            toast.type === 'error' ? 'text-red-400' : 
                            toast.type === 'warning' ? 'text-yellow-400' : 
                            'text-blue-400'
                        }`}>
                            {toast.type === 'success' && <CheckCircle size={18} />}
                            {toast.type === 'error' && <AlertCircle size={18} />}
                            {toast.type === 'warning' && <AlertTriangle size={18} />}
                            {toast.type === 'info' && <Info size={18} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="text-white/40 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
