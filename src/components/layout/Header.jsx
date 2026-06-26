import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Moon, Sun, Menu, X, LayoutGrid } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const { totalItems } = useCart();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
  const [isOpen, setIsOpen] = useState(false);

  const siteName = settings.business_name || 'Dakora Business';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <nav className="w-full max-w-6xl flex flex-col items-center
                      bg-white/70 dark:bg-black/70 backdrop-blur-md 
                      border border-white/20 dark:border-white/10 
                      rounded-2xl shadow-xl transition-all duration-300">
        
        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-2">
          
          {/* LOGO + NOM */}
          <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 sm:h-12 w-auto object-contain" />
            <span className="font-black text-lg sm:text-xl tracking-tighter text-gray-900 dark:text-white uppercase italic">
              {siteName.split(' ')[0]} <span className="text-dakora-green">{siteName.split(' ').slice(1).join(' ') || ''}</span>
            </span>
          </Link>

          {/* NAV DESKTOP */}
          <div className="hidden md:flex items-center gap-8 font-bold text-xs uppercase tracking-widest">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-dakora-green transition-colors">{t('home')}</Link>
            <Link to="/boutique" className="text-gray-600 dark:text-gray-300 hover:text-dakora-green transition-colors">{t('shop')}</Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* PANIER (Badge dynamique) */}
            <Link to="/panier" className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-dakora-green/10 rounded-xl transition-all">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-dakora-green text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-black animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* ZONE ADMIN SI CONNECTÉ */}
            {user && (
              <div className="flex items-center gap-2 sm:gap-4 border-l border-gray-200 dark:border-white/10 pl-2 sm:pl-3">
                <Link 
                  to="/admin/dashboard" 
                  className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-dakora-green text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all"
                >
                  <LayoutGrid size={12} /> {t('manage_btn') || 'Gestion'}
                </Link>
                
                {profile ? (
                  <Link to="/admin/profil" className="flex items-center group">
                    <img 
                      src={profile.profile_photo_url} 
                      alt="Boss" 
                      className="w-9 h-9 rounded-full object-cover border-2 border-dakora-green group-hover:scale-110 transition-transform shadow-md"
                    />
                  </Link>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse border-2 border-dakora-green" />
                )}
              </div>
            )}

            {/* BOUTON LANGUE */}
            <button 
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} 
              className="px-2 py-1 text-[10px] font-black rounded border dark:text-white border-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors uppercase"
            >
              {language}
            </button>

            {/* TOGGLE THÈME */}
            <button 
              onClick={() => setIsDark(!isDark)} 
              className="p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-dakora-yellow transition-all"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {/* BURGER MOBILE */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 dark:text-white">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MENU MOBILE */}
        <div className={`w-full overflow-hidden transition-all duration-300 md:hidden ${isOpen ? 'max-h-72 border-t border-white/10' : 'max-h-0'}`}>
          <div className="flex flex-col items-center gap-4 py-6 font-bold uppercase tracking-widest text-sm">
            <Link to="/" onClick={() => setIsOpen(false)} className="dark:text-white">{t('home')}</Link>
            <Link to="/boutique" onClick={() => setIsOpen(false)} className="dark:text-white">{t('shop')}</Link>
            {user && (
              <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-dakora-green py-2 px-6 border border-dakora-green/30 rounded-full mt-2">
                {t('manage_btn') || 'Gestion'}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;