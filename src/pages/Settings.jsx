
import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Palette, CheckCircle, Bell, Clock, Shield, RotateCcw, Download, Upload, LogOut, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

const Settings = () => {
    const { theme, currentThemeKey, setTheme, availableThemes, showParticles, toggleParticles } = useTheme();
    const { notificationSettings, setNotificationSettings, exportData, importData } = useData();
    const { user, logout, verifyPin, resetPin } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    // PIN / Security States
    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [pinAction, setPinAction] = useState(null); // 'restore' | 'reset'
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    // Handlers
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleRestoreClick = () => {
        setPinAction('restore');
        setPinModalOpen(true);
    };

    const handleResetPinClick = () => {
        setPinAction('reset');
        setPinModalOpen(true);
    };

    const handleBackup = () => {
        const result = exportData();
        if (result) addToast('Backup descargado con éxito.', 'success');
        else addToast('Error creando backup.', 'error');
    };

    const onPinSubmit = () => {
        if (verifyPin(pinInput)) {
            setPinModalOpen(false);
            setPinInput('');
            setError('');
            
            if (pinAction === 'restore') {
                fileInputRef.current.click();
            } else if (pinAction === 'reset') {
                 resetPin();
                 handleLogout();
                 addToast('PIN reseteado. Por favor ingresa nuevamente.', 'warning');
            }
        } else {
            setError('PIN Incorrecto');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const result = importData(text);
            if (result.success) {
                addToast('Datos restaurados correctamente.', 'success');
            } else {
                addToast('Error al importar: ' + result.error, 'error');
            }
        } catch {
            addToast('Error leyendo el archivo.', 'error');
        }
    };

    return (
        <div className="h-full flex flex-col overflow-y-auto custom-scrollbar pr-2">
          <div className="mb-6">
            <h1 className={`text-3xl font-bold ${theme.text}`}>Configuración</h1>
            <p className={`${theme.textSecondary} text-sm mt-1`}>Personalización y Seguridad del Sistema</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* 1. Theme Selector */}
            <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-8 border border-white/10`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${theme.accentSecondary}`}>
                    <Palette className={theme.accent} size={24} />
                </div>
                <h2 className={`text-xl font-bold ${theme.text}`}>Tema Visual</h2>
              </div>
              
              <div className="space-y-4">
                {Object.keys(availableThemes).map((key) => {
                  const t = availableThemes[key];
                  const isActive = currentThemeKey === key;
                  return (
                    <button key={key} onClick={() => setTheme(key)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isActive ? `${theme.accentBorder} bg-white/10 ring-1 ring-${theme.accentBorder}` : 'border-white/10 hover:bg-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full shadow-lg border-2 border-white/20 overflow-hidden flex`}><div className={`w-1/2 h-full ${t.bg.replace('bg-', 'bg-')}`}></div><div className={`w-1/2 h-full ${t.cardBg.split(' ')[0]}`}></div></div>
                        <div className="text-left"><h3 className={`font-bold ${theme.text}`}>{t.name}</h3><p className="text-xs text-white/40 capitalize">{key === 'deep' ? 'Modo Oscuro' : key === 'lirio' ? 'Alto Contraste' : 'Original'}</p></div>
                      </div>
                      {isActive && <CheckCircle className={theme.accent} size={20} />}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500"><Star size={18}/></div>
                      <span className="font-bold text-white text-sm">Partículas & Estrellas</span>
                  </div>
                  <div 
                    onClick={toggleParticles}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors p-1 ${showParticles ? theme.accentBg : 'bg-white/10'}`}
                  >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${showParticles ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
              </div>
            </div>

            {/* 2. User & Data Management (NEW) */}
            <div className={`${theme.cardBg} backdrop-blur-md rounded-[24px] p-8 border border-white/10 flex flex-col`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-xl bg-blue-500/20`}>
                        <Shield className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${theme.text}`}>Administración</h2>
                        <p className={`text-xs ${theme.textSecondary}`}>Logueado como: <span className="text-white font-bold">{user?.username}</span></p>
                    </div>
                </div>

                <div className="space-y-4 flex-1">
                    {/* Backup Section */}
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                        <h3 className="text-sm font-bold text-white mb-2">Copias de Seguridad</h3>
                        <div className="flex gap-2">
                             <button onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors">
                                <Download size={14}/> Backup (JSON)
                             </button>
                             <button onClick={handleRestoreClick} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors">
                                <Upload size={14}/> Restaurar
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                        <h3 className="text-sm font-bold text-white mb-2">Seguridad</h3>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3 flex gap-3">
                             <Shield size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                             <p className="text-[10px] text-yellow-200 leading-snug">
                                 Advertencia: Si cambias tu PIN, asegúrate de generar un nuevo Backup inmediatamente, ya que los archivos anteriores podrían ser incompatibles.
                             </p>
                        </div>
                        <button onClick={handleResetPinClick} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-200 text-xs font-bold transition-colors mb-2">
                            <RotateCcw size={14}/> Resetear PIN
                        </button>
                    </div>
                </div>

                <button onClick={handleLogout} className="mt-6 w-full py-3 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 hover:text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    <LogOut size={16} /> Cerrar Sesión
                </button>
            </div>

            {/* 3. Notification Prefs */}
            <div className={`lg:col-span-2 ${theme.cardBg} backdrop-blur-md rounded-[24px] p-8 border border-white/10`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl bg-orange-500/20`}>
                    <Bell className="text-orange-400" size={24} />
                </div>
                <h2 className={`text-xl font-bold ${theme.text}`}>Notificaciones</h2>
              </div>
              
              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Activar Alertas</span>
                      <div 
                        onClick={() => setNotificationSettings({...notificationSettings, enabled: !notificationSettings.enabled})}
                        className={`w-12 h-6 rounded-full cursor-pointer transition-colors p-1 ${notificationSettings.enabled ? theme.accentBg : 'bg-white/10'}`}
                      >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${notificationSettings.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </div>
                  </div>

                  <div className={`p-4 rounded-xl border border-white/5 bg-black/10 ${!notificationSettings.enabled && 'opacity-50 pointer-events-none'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-white flex items-center gap-2"><Clock size={14}/> Preaviso</span>
                        <span className={`${theme.accent} font-bold`}>{notificationSettings.daysBeforeAlert} Días</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="7" 
                        value={notificationSettings.daysBeforeAlert} 
                        onChange={(e) => setNotificationSettings({...notificationSettings, daysBeforeAlert: parseInt(e.target.value)})}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E8A631]"
                      />
                      <p className="text-xs text-white/40 mt-2">Recibirás alertas {notificationSettings.daysBeforeAlert} días antes de la fecha de vencimiento.</p>
                  </div>
              </div>
            </div>

          </div>

          {/* Modal for PIN */}
          <Modal isOpen={pinModalOpen} onClose={() => setPinModalOpen(false)} title="Seguridad Requerida">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        <Shield size={24} className={theme.accent} />
                    </div>
                    <p className="text-sm text-center text-white/70">
                        {pinAction === 'restore' ? 'Ingresa tu PIN para restaurar datos.' : 'Ingresa tu PIN actual para resetearlo.'}
                    </p>
                    <input 
                        type="password" 
                        maxLength={4}
                        value={pinInput}
                        onChange={(e) => { setPinInput(e.target.value); setError(''); }}
                        className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] w-32 focus:outline-none focus:border-white/30 text-white"
                        autoFocus
                    />
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <button onClick={onPinSubmit} className={`w-full ${theme.accentBg} text-black font-bold py-3 rounded-xl hover:opacity-90`}>
                        Verificar
                    </button>
                </div>
          </Modal>
        </div>
    );
};

export default Settings;
