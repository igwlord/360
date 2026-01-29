import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

const SWUpdatePrompt = () => {
  const {
    offlineReady: [, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      // Service Worker registered successfully
    },
    onRegisterError() {
      // Service Worker registration error - handled silently
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // UX Decision: Only show prompt if there is an UPDATE (`needRefresh`).
  // The 'offlineReady' state is confusing users ("Why does it say offline if I have internet?").
  // So we silently accept offline readiness.
  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom border border-[#E8A631] bg-black/80 backdrop-blur-md p-4 rounded-xl shadow-2xl max-w-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[#E8A631]/20 rounded-lg text-[#E8A631]">
            <RefreshCw size={20} className={needRefresh ? "animate-spin" : ""} />
        </div>
        <div className="flex-1">
            <h3 className="font-bold text-white text-sm mb-1">
                Nueva versión disponible
            </h3>
            <p className="text-xs text-white/60 mb-3">
                Hay una actualización pendiente con mejoras y correcciones.
            </p>
            
            <div className="flex gap-2">
                {needRefresh && (
                    <button 
                        onClick={() => updateServiceWorker(true)}
                        className="px-3 py-1.5 bg-[#E8A631] text-black text-xs font-bold rounded-lg hover:opacity-90"
                    >
                        Actualizar ahora
                    </button>
                )}
                <button 
                    onClick={close}
                    className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20"
                >
                    Cerrar
                </button>
            </div>
        </div>
        <button onClick={close} className="text-white/40 hover:text-white"><X size={16}/></button>
      </div>
    </div>
  );
};

export default SWUpdatePrompt;
