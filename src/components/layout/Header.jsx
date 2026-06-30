import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { useDataCache } from '../../context/DataCacheContext';
import { useTheme } from '../../context/ThemeContext';
import { ShoppingCart, Moon, Sun, Menu, X, LayoutGrid, Search } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const { totalItems } = useCart();
  const { products, categories } = useDataCache();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  // Recherche globale
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], categories: [] });
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const siteName = settings.business_name || 'Dakora Business';

  // Focus automatique sur l'input quand la recherche s'ouvre
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
    if (!searchOpen) {
      setSearchQuery('');
      setSearchResults({ products: [], categories: [] });
    }
  }, [searchOpen]);

  // Fermer la recherche si clic en dehors
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('[data-search-container]')) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Recherche avec anti-rebond 300ms
  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSearchResults({ products: [], categories: [] });
      return;
    }
    debounceRef.current = setTimeout(() => {
      const lower = q.toLowerCase();
      const matchedProducts = products.filter(p =>
        (p.name_fr?.toLowerCase().includes(lower)) ||
        (p.name_en?.toLowerCase().includes(lower)) ||
        (p.description_fr?.toLowerCase().includes(lower)) ||
        (p.description_en?.toLowerCase().includes(lower)) ||
        (p.categories?.name_fr?.toLowerCase().includes(lower)) ||
        (p.categories?.name_en?.toLowerCase().includes(lower))
      ).slice(0, 5);
      const matchedCats = categories.filter(c =>
        (c.name_fr?.toLowerCase().includes(lower)) ||
        (c.name_en?.toLowerCase().includes(lower))
      ).slice(0, 3);
      setSearchResults({ products: matchedProducts, categories: matchedCats });
    }, 300);
  }, [products, categories]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-3 md:p-4">
      <nav className="w-full max-w-6xl flex flex-col items-center
                      bg-white/70 dark:bg-black/70 backdrop-blur-md 
                      border border-white/20 dark:border-white/10 
                      rounded-xl md:rounded-2xl shadow-xl transition-all duration-300">
        
        <div className="w-full flex items-center justify-between px-3 md:px-4 sm:px-6 py-2">
          
          {/* LOGO + NOM */}
          <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 md:gap-3">
            <img src={logo} alt="Logo" className="h-9 md:h-10 lg:h-12 w-auto object-contain" />
            <span className="font-black text-xs sm:text-base md:text-lg lg:text-xl tracking-tighter text-gray-900 dark:text-white uppercase italic">
              {siteName.split(' ')[0]} <span className="text-dakora-green">{siteName.split(' ').slice(1).join(' ') || ''}</span>
            </span>
          </Link>

          {/* NAV DESKTOP */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 font-bold text-[10px] md:text-xs uppercase tracking-widest">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-dakora-green transition-colors">{t('home')}</Link>
            <Link to="/boutique" className="text-gray-600 dark:text-gray-300 hover:text-dakora-green transition-colors">{t('shop')}</Link>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 sm:gap-3">

            {/* BOUTON LOUPE */}
            <button
              onClick={() => setSearchOpen(s => !s)}
              aria-label="Rechercher"
              className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${searchOpen ? 'bg-dakora-green text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-dakora-green/10'}`}
            >
              <Search size={18}/>
            </button>
            
            {/* PANIER (Badge dynamique) */}
            <Link to="/panier" className="relative p-1.5 md:p-2 text-gray-600 dark:text-gray-300 hover:bg-dakora-green/10 rounded-lg md:rounded-xl transition-all">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 bg-dakora-green text-white text-[8px] md:text-[10px] font-black w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-black animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* ZONE ADMIN SI CONNECTÉ */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 md:gap-4 border-l border-gray-200 dark:border-white/10 pl-2 md:pl-3">
                <Link 
                  to="/admin/dashboard" 
                  className="hidden lg:flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-dakora-green text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all"
                >
                  <LayoutGrid size={11} /> {t('manage_btn') || 'Gestion'}
                </Link>
                
                {profile ? (
                  <Link to="/admin/profil" className="flex items-center group">
                    <img 
                      src={profile.profile_photo_url} 
                      alt="Boss" 
                      className="w-7 h-7 md:w-9 md:h-9 rounded-full object-cover border-2 border-dakora-green group-hover:scale-110 transition-transform shadow-md"
                    />
                  </Link>
                ) : (
                  <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gray-200 animate-pulse border-2 border-dakora-green" />
                )}
              </div>
            )}

            {/* BOUTON LANGUE */}
            <button 
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')} 
              className="px-1.5 md:px-2 py-0.5 md:py-1 text-[8px] md:text-[10px] font-black rounded border dark:text-white border-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors uppercase"
            >
              {language}
            </button>

            {/* TOGGLE THÈME */}
            <button 
              onClick={toggleTheme}
              aria-label="Basculer le thème"
              className="p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-dakora-yellow transition-all"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            
            {/* BURGER MOBILE */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-1.5 md:p-2 dark:text-white">
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* BARRE DE RECHERCHE — overlay expandable */}
        {searchOpen && (
          <div data-search-container className="w-full px-3 md:px-4 pb-3 animate-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <Search size={15} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher un produit, catégorie...' : 'Search products, categories...'}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-gray-100 dark:bg-white/5 text-xs md:text-sm font-medium dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none transition-all"
              />
              {searchQuery && (
                <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={15}/>
                </button>
              )}
            </div>

            {/* RÉSULTATS */}
            {searchQuery && (searchResults.products.length > 0 || searchResults.categories.length > 0) && (
              <div className="mt-2 bg-white dark:bg-neutral-900 rounded-xl md:rounded-2xl border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden max-h-72 md:max-h-80 overflow-y-auto">
                {searchResults.categories.length > 0 && (
                  <div>
                    <p className="px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-white/5">{language === 'fr' ? 'Catégories' : 'Categories'}</p>
                    {searchResults.categories.map(cat => (
                      <Link
                        key={cat.id}
                        to={`/boutique`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 hover:bg-dakora-green/5 transition-colors border-b border-black/5 dark:border-white/5"
                      >
                        <span className="text-lg md:text-xl">{cat.icon_url}</span>
                        <span className="text-xs md:text-sm font-bold dark:text-white">{language === 'fr' ? cat.name_fr : cat.name_en}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.products.length > 0 && (
                  <div>
                    <p className="px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-white/5">{language === 'fr' ? 'Produits' : 'Products'}</p>
                    {searchResults.products.map(p => {
                      const imgUrl = p.product_images?.[0]?.url;
                      const name = language === 'fr' ? p.name_fr : p.name_en;
                      const minPrice = p.variants?.length ? Math.min(...p.variants.map(v => Number(v.price))) : 0;
                      return (
                        <Link
                          key={p.id}
                          to={`/produit/${p.id}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 hover:bg-dakora-green/5 transition-colors border-b border-black/5 dark:border-white/5 last:border-0"
                        >
                          {imgUrl ? (
                            <img src={imgUrl} alt={name} loading="lazy" className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-base md:text-lg flex-shrink-0">📦</div>
                          )}
                          <div className="flex-grow min-w-0">
                            <p className="text-xs md:text-sm font-black dark:text-white truncate">{name}</p>
                            <p className="text-[9px] md:text-[10px] text-dakora-green font-bold">{minPrice.toLocaleString()} FCFA</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {searchQuery && searchResults.products.length === 0 && searchResults.categories.length === 0 && (
              <div className="mt-2 bg-white dark:bg-neutral-900 rounded-xl md:rounded-2xl border border-black/5 dark:border-white/10 p-4 md:p-6 text-center shadow-lg">
                <p className="text-xs md:text-sm text-gray-400 font-medium italic">{language === 'fr' ? 'Aucun résultat pour' : 'No results for'} "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* MENU MOBILE */}
        <div className={`w-full overflow-hidden transition-all duration-300 md:hidden ${isOpen ? 'max-h-64 border-t border-white/10' : 'max-h-0'}`}>
          <div className="flex flex-col items-center gap-3 md:gap-4 py-4 md:py-6 font-bold uppercase tracking-widest text-xs md:text-sm">
            <Link to="/" onClick={() => setIsOpen(false)} className="dark:text-white py-2">{t('home')}</Link>
            <Link to="/boutique" onClick={() => setIsOpen(false)} className="dark:text-white py-2">{t('shop')}</Link>
            {user && (
              <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-dakora-green py-2 px-4 md:px-6 border border-dakora-green/30 rounded-full mt-2">
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