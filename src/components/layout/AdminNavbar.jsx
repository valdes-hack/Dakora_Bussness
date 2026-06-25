import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const AdminNavbar = ({ onMenuClick }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="h-16 bg-white/50 dark:bg-black/50 backdrop-blur-md border-b border-white/20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* BOUTON MENU MOBILE */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 bg-gray-100 dark:bg-white/10 rounded-xl text-gray-600 dark:text-white"
        >
          <Menu size={20} />
        </button>
        <h2 className="font-black text-dakora-green uppercase text-[10px] tracking-[0.2em] hidden sm:block">
          Tableau de Bord
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 bg-gray-100 dark:bg-white/10 rounded-full">
          <Bell size={18} className="text-gray-600 dark:text-gray-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
        </button>
        <button onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} className="text-xs font-black dark:text-white px-3 py-1 border border-gray-300 dark:border-white/20 rounded-lg">
          {language.toUpperCase()}
        </button>
      </div>
    </div>
  );
};

export default AdminNavbar;