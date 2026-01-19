import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const InstallPrompt = () => {
    const { theme } = useTheme();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed


        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={handleInstallClick}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300
                animate-pulse hover:animate-none
                ${theme.accentBg} text-black shadow-lg hover:scale-105 active:scale-95
            `}
            title="Instalar Aplicación"
        >
            <Download size={14} />
            <span className="hidden md:inline">Instalar App</span>
        </button>
    );
};

export default InstallPrompt;
