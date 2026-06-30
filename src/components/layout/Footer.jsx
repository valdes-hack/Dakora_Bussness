import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import logo from '../../assets/logo.jpeg';

const Footer = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSettings();
  const siteName = settings.business_name || 'Dakora Business';

  return (
    <footer className="mt-20 p-4 md:p-6 flex justify-center mb-10">
      <div className="w-full max-w-6xl bg-white/40 dark:bg-black/40 backdrop-blur-lg rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border border-white/20 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          
          <div className="text-center md:text-left space-y-3 md:space-y-4">
            <img src={logo} alt="Logo" className="h-12 md:h-16 mx-auto md:mx-0 drop-shadow-md" />
            <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('slogan')}
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4 md:gap-6">
            {!user ? (
              <Link 
                to="/admin/login" 
                className="px-4 py-2 md:px-6 md:py-2 bg-dakora-green/10 hover:bg-dakora-green text-dakora-green hover:text-white 
                           border border-dakora-green/20 rounded-full text-[10px] md:text-xs font-bold transition-all 
                           uppercase tracking-widest shadow-sm"
              >
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
  );
};

export default Footer;