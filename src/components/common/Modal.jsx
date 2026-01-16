
import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const { theme } = useTheme();

  const maxWidthClass = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4'
  }[size] || 'max-w-lg';

  React.useEffect(() => {
    const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full ${maxWidthClass} overflow-hidden rounded-2xl border border-white/10 shadow-2xl ${theme.cardBg} ${theme.text} animate-in zoom-in-95 duration-200 transition-all`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold">{title}</h3>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${theme.textSecondary} hover:text-white`}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className={`p-6 overflow-y-auto custom-scrollbar max-h-[80vh] overflow-x-visible`}>
            {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
