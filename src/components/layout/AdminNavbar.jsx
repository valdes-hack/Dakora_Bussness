import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Sun, Moon, Check, Trash2, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../api/supabaseClient';
import { useNavigate } from 'react-router-dom';

const AdminNavbar = ({ onMenuClick }) => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    // ÉCOUTE EN TEMPS RÉEL (REALTIME)
    const channel = supabase
      .channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        // Petit son de notification pro
        new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(()=>{});
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setNotifications(data || []);
  };

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? {...n, is_read: true} : n));
  };

  const clearAll = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    fetchNotifications();
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="h-16 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-b border-white/20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 bg-gray-100 dark:bg-white/10 rounded-xl text-gray-600 dark:text-white"><Menu size={20}/></button>
        <h2 className="font-black text-dakora-green uppercase text-[10px] tracking-[0.2em] hidden sm:block italic">Dakora Control</h2>
      </div>
      
      <div className="flex items-center gap-3 md:gap-5">
        
        {/* --- CENTRE DE NOTIFICATIONS --- */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className={`relative p-2.5 rounded-2xl transition-all active:scale-90 ${unreadCount > 0 ? 'bg-dakora-green/10 text-dakora-green' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
          >
            <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-neutral-900 animate-in zoom-in">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-4 w-80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-[2rem] border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                <h3 className="font-black uppercase text-[10px] tracking-widest text-gray-500">{t('notif_title')}</h3>
                {unreadCount > 0 && (
                  <button onClick={clearAll} className="text-[9px] font-bold text-dakora-green hover:underline uppercase">{t('notif_clear')}</button>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 italic text-xs">{t('notif_empty')}</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => { markAsRead(n.id); navigate('/admin/commandes'); setShowNotifs(false); }}
                      className={`p-4 border-b border-black/5 dark:border-white/5 cursor-pointer transition-all hover:bg-dakora-green/5 flex gap-4 items-start ${!n.is_read ? 'bg-dakora-green/[0.02]' : 'opacity-60'}`}
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-dakora-green shadow-[0_0_10px_rgba(45,90,39,0.5)]' : 'bg-gray-300'}`} />
                      <div className="space-y-1">
                        <p className={`text-xs leading-snug ${!n.is_read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 font-medium'}`}>
                          {n.message}
                        </p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">{new Date(n.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* REGLAGES RAPIDES */}
        <div className="flex items-center gap-2 border-l border-black/5 dark:border-white/10 pl-3 md:pl-5">
          <button onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} className="text-[10px] font-black dark:text-white px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-xl uppercase hover:bg-dakora-green hover:text-white transition-all">
            {language}
          </button>

          <button onClick={toggleTheme} className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-600 dark:text-dakora-yellow hover:scale-110 transition-all">
            {isDark ? <Sun size={18}/> : <Moon size={18}/>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes swing {
          0% { transform: rotate(0); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
          100% { transform: rotate(0); }
        }
        .animate-swing { animation: swing 0.6s ease-in-out; }
      `}</style>
    </div>
  );
};

export default AdminNavbar;