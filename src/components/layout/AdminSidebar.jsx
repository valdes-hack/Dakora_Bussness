import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { 
  LayoutDashboard, Boxes, Package, Settings, LogOut, 
  Store, X, Tag, ShoppingBag, ChevronLeft, Layers, Users, Zap
} from 'lucide-react';
import logo from '../../assets/logos.png';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const { profile, logout } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const siteName = settings.business_name || 'Dakora Business';

  // --- ÉTATS DESIGN ---
  const [width, setWidth] = useState(260);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // --- LOGIQUE DE SORTIE ---

  // Retourner à la boutique (Bascule sur le ClientLayout)
  const handleBackToShop = () => {
    if (setIsOpen) setIsOpen(false);
    navigate('/boutique');
  };

  // Déconnexion → retour à l'accueil (boutique)
  const handleLogout = async () => {
    if (setIsOpen) setIsOpen(false);
    await logout();
    navigate('/');
  };

  // --- LOGIQUE REDIMENSIONNEMENT ---
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e) => {
    if (isResizing && !isCollapsed) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 450) setWidth(newWidth);
    }
  }, [isResizing, isCollapsed]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // --- ÉLÉMENTS DU MENU ---
  const menuItems = [
    { name: t('nav_dashboard'), path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: t('nav_categories'), path: '/admin/categories', icon: <Tag size={20} /> },
    { name: t('nav_products'), path: '/admin/produits', icon: <ShoppingBag size={20} /> },
    { name: t('nav_inventory'), path: '/admin/inventaire', icon: <Boxes size={20} /> },
    { name: t('nav_orders'), path: '/admin/commandes', icon: <Package size={20} /> },
    { name: t('nav_stories') || 'Stories', path: '/admin/stories', icon: <Layers size={20} /> },
    { name: 'Promos', path: '/admin/promos', icon: <Zap size={20} /> },
    { name: 'Utilisateurs', path: '/admin/utilisateurs', icon: <Users size={20} /> },
    { name: t('nav_settings'), path: '/admin/profil', icon: <Settings size={20} /> },
  ];

  const currentWidth = isCollapsed ? 80 : width;

  return (
    <>
      {/* OVERLAY MOBILE AVEC FLOU */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* LA SIDEBAR */}
      <aside 
        style={{ width: window.innerWidth < 768 ? '280px' : `${currentWidth}px` }}
        className={`fixed md:sticky top-0 left-0 h-screen bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-r border-white/20 
                   flex flex-col transition-transform md:transition-all duration-300 ease-in-out z-[70] select-none
                   ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        
        {/* HEADER SIDEBAR (LOGO) */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5 h-20">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={logo} alt="Logo" className="min-w-[40px] h-10 object-contain rounded-lg" />
            {(!isCollapsed || window.innerWidth < 768) && (
              <span className="font-black text-xs tracking-tighter text-dakora-green uppercase whitespace-nowrap leading-tight">
                {siteName.split(' ')[0]} <br/>
                <span className="text-gray-900 dark:text-white text-sm font-bold">
                  {siteName.split(' ').slice(1).join(' ') || 'Control'}
                </span>
              </span>
            )}
          </div>
          
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-gray-500"><X size={20}/></button>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:block text-gray-400 hover:text-dakora-green">
            {isCollapsed ? <ChevronLeft className="rotate-180" size={18}/> : <ChevronLeft size={18}/>}
          </button>
        </div>

        {/* PROFIL ADMIN */}
        {(!isCollapsed || window.innerWidth < 768) && profile && (
          <div className="p-6 text-center animate-in fade-in duration-500 border-b border-gray-100 dark:border-white/5">
            <img src={profile.profile_photo_url || logo} alt="Boss" className="w-16 h-16 rounded-full mx-auto border-2 border-dakora-green mb-3 object-cover shadow-md" />
            <p className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-widest truncate">{profile.username || profile.full_name || 'Admin'}</p>
          </div>
        )}

        {/* NAVIGATION INTERNE */}
        <nav className="flex-grow p-3 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); if(window.innerWidth < 768) setIsOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                  ? 'bg-dakora-green text-white shadow-lg' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <div className="min-w-[20px]">{item.icon}</div>
              {(!isCollapsed || window.innerWidth < 768) && <span className="font-bold text-sm whitespace-nowrap">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* ACTIONS DE SORTIE (PIED DE PAGE) */}
        <div className="p-4 border-t border-gray-100 dark:border-white/5 space-y-2">
          {/* BOUTON RETOUR BOUTIQUE */}
          <button 
            onClick={handleBackToShop}
            className="w-full flex items-center gap-4 px-4 py-2 text-xs font-bold text-gray-400 hover:text-dakora-green transition-colors"
          >
            <Store size={18} />
            {(!isCollapsed || window.innerWidth < 768) && <span>{t('nav_back_shop')}</span>}
          </button>

          {/* BOUTON DÉCONNEXION */}
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-4 px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut size={18} />
            {(!isCollapsed || window.innerWidth < 768) && <span className="font-black text-[10px] uppercase tracking-widest">{t('logout')}</span>}
          </button>
        </div>

        {/* POIGNÉE DE REDIMENSIONNEMENT (Desktop uniquement) */}
        {!isCollapsed && (
          <div onMouseDown={startResizing} className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-dakora-green/30 z-50 hidden md:block" />
        )}
      </aside>

      {/* STYLE SCROLLBAR ÉLÉGANT */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </>
  );
};

export default AdminSidebar;