import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { Download, X, Smartphone, Monitor, Share } from 'lucide-react';
import logo from '../../assets/logos.png';

// ─── DRAWER D'AIDE À L'INSTALLATION (Safari / Firefox) ───────────────────────
const InstallGuide = ({ onClose, language }) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS    = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-white/20">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dakora-green/10 rounded-2xl flex items-center justify-center">
              <Download size={18} className="text-dakora-green"/>
            </div>
            <div>
              <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">
                {language === 'fr' ? 'Installer l\'app' : 'Install App'}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">Dakora Business</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all">
            <X size={18}/>
          </button>
        </div>

        {/* Instructions */}
        <div className="p-6 space-y-4">
          {isIOS || isSafari ? (
            /* iOS Safari */
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {language === 'fr' ? 'Sur Safari (iPhone / iPad) :' : 'On Safari (iPhone / iPad):'}
              </p>
              <div className="space-y-3">
                {[
                  { icon: '1', text: language === 'fr' ? 'Appuyez sur le bouton Partager' : 'Tap the Share button', sub: language === 'fr' ? '(icône carré avec flèche en bas de l\'écran)' : '(square with arrow icon at bottom)' },
                  { icon: '2', text: language === 'fr' ? 'Faites défiler et appuyez sur' : 'Scroll down and tap', sub: language === 'fr' ? '"Ajouter à l\'écran d\'accueil"' : '"Add to Home Screen"' },
                  { icon: '3', text: language === 'fr' ? 'Appuyez sur "Ajouter"' : 'Tap "Add"', sub: language === 'fr' ? 'L\'icône apparaît sur votre écran' : 'The icon appears on your screen' },
                ].map(step => (
                  <div key={step.icon} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-dakora-green text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{step.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{step.text}</p>
                      <p className="text-[10px] text-gray-400">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : isMobile ? (
            /* Android Chrome */
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {language === 'fr' ? 'Sur Chrome (Android) :' : 'On Chrome (Android):'}
              </p>
              <div className="space-y-3">
                {[
                  { icon: '1', text: language === 'fr' ? 'Appuyez sur le menu ⋮' : 'Tap the ⋮ menu', sub: language === 'fr' ? '(en haut à droite de Chrome)' : '(top right of Chrome)' },
                  { icon: '2', text: language === 'fr' ? 'Sélectionnez "Ajouter à l\'écran d\'accueil"' : 'Select "Add to Home screen"', sub: '' },
                  { icon: '3', text: language === 'fr' ? 'Appuyez sur "Ajouter"' : 'Tap "Add"', sub: language === 'fr' ? 'L\'icône est installée !' : 'Icon is installed!' },
                ].map(step => (
                  <div key={step.icon} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-dakora-green text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{step.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{step.text}</p>
                      {step.sub && <p className="text-[10px] text-gray-400">{step.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Desktop Chrome / Edge */
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {language === 'fr' ? 'Sur Chrome / Edge (PC / Mac) :' : 'On Chrome / Edge (PC / Mac):'}
              </p>
              <div className="space-y-3">
                {[
                  { icon: '1', text: language === 'fr' ? 'Cliquez sur l\'icône d\'installation' : 'Click the install icon', sub: language === 'fr' ? '(dans la barre d\'adresse, à droite)' : '(in the address bar, on the right)' },
                  { icon: '2', text: language === 'fr' ? 'Cliquez sur "Installer"' : 'Click "Install"', sub: language === 'fr' ? 'L\'application s\'ouvre dans sa propre fenêtre' : 'The app opens in its own window' },
                ].map(step => (
                  <div key={step.icon} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-dakora-green text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{step.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{step.text}</p>
                      {step.sub && <p className="text-[10px] text-gray-400">{step.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full py-3.5 bg-dakora-green text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all">
            {language === 'fr' ? 'Compris !' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const Footer = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const siteName = settings.business_name || 'Dakora Business';

  // PWA Installation
  const [deferredPrompt, setDeferredPrompt]   = useState(null);
  const [isInstalled, setIsInstalled]         = useState(false);
  const [showGuide, setShowGuide]             = useState(false);

  useEffect(() => {
    // Déjà installée (mode standalone) → masquer le bouton
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Écoute l'événement natif du navigateur
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Si installée via l'événement appinstalled
    const installedHandler = () => setIsInstalled(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Navigateur supporte l'install native → déclenche directement
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      // Safari / Firefox → guide visuel dans la page (pas d'alert)
      setShowGuide(true);
    }
  };

  return (
    <>
      <footer className="mt-20 p-4 md:p-6 flex justify-center mb-10">
        <div className="w-full max-w-6xl bg-white/40 dark:bg-black/40 backdrop-blur-lg rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border border-white/20 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">

            <div className="text-center md:text-left space-y-3 md:space-y-4">
              <img src={logo} alt="Logo" className="h-12 md:h-16 mx-auto md:mx-0 drop-shadow-md"/>
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
                {settings.slogan_fr || t('slogan')}
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4 md:gap-6">
              {/* Bouton d'installation PWA — caché si déjà installée */}
              {!isInstalled && (
                <button onClick={handleInstallClick}
                  className="flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 bg-dakora-green hover:bg-green-700 text-white rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95">
                  <Download size={16} className="animate-pulse"/>
                  <span>{language === 'fr' ? 'Installer l\'app' : 'Install App'}</span>
                </button>
              )}

              {!user ? (
                <Link to="/admin/login"
                  className="px-4 py-2 md:px-6 md:py-2 bg-dakora-green/10 hover:bg-dakora-green text-dakora-green hover:text-white border border-dakora-green/20 rounded-full text-[10px] md:text-xs font-bold transition-all uppercase tracking-widest shadow-sm">
                  {t('admin_access')}
                </Link>
              ) : (
                <div className="px-4 py-2 md:px-6 md:py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[8px] md:text-[10px] font-black uppercase italic">
                  {t('boss_connected')}
                </div>
              )}

              <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-tighter">
                © {new Date().getFullYear()} {siteName}.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Guide d'installation (uniquement pour Safari/Firefox, sans alert) */}
      {showGuide && (
        <InstallGuide language={language} onClose={() => setShowGuide(false)}/>
      )}
    </>
  );
};

export default Footer;
