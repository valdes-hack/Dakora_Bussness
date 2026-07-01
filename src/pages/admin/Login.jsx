import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logo from '../../assets/logos.png';

const Login = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-white/20 shadow-2xl animate-in zoom-in duration-500">
        
        <div className="text-center mb-6 md:mb-8">
          <img src={logo} alt="Logo" className="h-16 md:h-20 mx-auto mb-3 md:mb-4 drop-shadow-lg" />
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
            Dakora <span className="text-dakora-green">Admin</span>
          </h2>
          <p className="text-gray-500 text-xs md:text-sm mt-2 font-medium">{t('login_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {error && (
            <div className="p-2 md:p-3 text-[10px] md:text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg md:rounded-xl text-center font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-3 md:ml-4 mb-1.5 md:mb-2">
              {t('identifier_label')}
            </label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 md:px-6 py-3 md:py-4 bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all dark:text-white text-sm md:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-3 md:ml-4 mb-1.5 md:mb-2">
              {t('password_label')}
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 md:px-6 py-3 md:py-4 pr-10 md:pr-12 bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all dark:text-white text-sm md:text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 md:py-4 bg-dakora-green text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-green-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? '...' : t('login_btn')}
          </button>

          {/* Retour boutique */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 dark:text-gray-400 hover:text-dakora-green dark:hover:text-dakora-green font-bold text-[10px] md:text-xs uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14}/>
            {language === 'fr' ? 'Retour à la boutique' : 'Back to shop'}
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Login;