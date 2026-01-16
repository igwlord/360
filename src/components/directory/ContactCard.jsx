
import React, { useState } from 'react';
import { Mail, Phone, Star } from 'lucide-react';

const ContactCard = ({ contact, groupId, onContextMenu, theme }) => {
  const [showPhone, setShowPhone] = useState(false);

  const togglePhone = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (contact.phone && contact.phone !== '-') {
      setShowPhone(!showPhone);
    }
  };

  return (
    <div 
      className={`${theme.cardBg} backdrop-blur-sm border border-white/10 hover:border-white/30 ${theme.cardHover} rounded-2xl p-5 transition-all group relative cursor-context-menu animate-in fade-in zoom-in duration-300 shadow-sm`}
      onContextMenu={(e) => onContextMenu(e, contact.id, groupId)}
    >
      {contact.isFavorite && (
        <div className={`absolute top-3 right-3 ${theme.accent}`}>
          <Star size={16} fill="currentColor" />
        </div>
      )}
      
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold ${theme.accent} border border-white/5 shadow-inner shrink-0`}>
          {contact.company.charAt(0)}
        </div>
        <div className="overflow-hidden min-w-0">
          <h3 className={`font-bold ${theme.text} text-sm truncate`} title={contact.company}>{contact.company}</h3>
          <p className={`text-xs ${theme.textSecondary} truncate`} title={contact.brand}>{contact.brand}</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-1 h-1 rounded-full ${theme.accentBg}`}></div>
          <p className={`text-sm font-medium ${theme.text} opacity-90 truncate`}>{contact.name}</p>
        </div>
        <p className={`text-xs ${theme.textSecondary} pl-3 truncate`}>{contact.role}</p>
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
        <a 
          href={`mailto:${contact.email}`} 
          className={`flex-1 flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-colors ${contact.email !== '-' ? `bg-white/5 ${theme.text} hover:${theme.accentBg} hover:text-black` : 'bg-black/5 text-white/20 cursor-not-allowed'}`}
          title={contact.email}
          onClick={(e) => e.stopPropagation()}
        >
          <Mail size={14} />
        </a>
        <button 
          onClick={togglePhone}
          className={`flex-1 flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all ${contact.phone !== '-' ? (showPhone ? `${theme.accentBg} text-black` : `bg-white/5 ${theme.text} hover:bg-green-500 hover:text-white`) : 'bg-black/5 text-white/20 cursor-not-allowed'}`}
          title={contact.phone !== '-' ? 'Ver teléfono' : 'No disponible'}
        >
          {showPhone ? <span className="text-[10px] font-bold tracking-tighter">{contact.phone}</span> : <Phone size={14} />}
        </button>
      </div>
    </div>
  );
};

export default ContactCard;
