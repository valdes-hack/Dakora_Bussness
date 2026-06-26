import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
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
      navigate('/admin/dashboard'); // Redirection vers le dashboard
    } catch (err) {
      setError(t('login_error'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/20 shadow-2xl animate-in zoom-in duration-500">
        
        <div className="text-center mb-8">
          <img src={logo} alt="Logo" className="h-20 mx-auto mb-4 drop-shadow-lg" />
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
            Dakora <span className="text-dakora-green">Admin</span>
          </h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">{t('login_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-4 mb-2">
              {t('identifier_label')}
            </label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-6 py-4 bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-4 mb-2">
              {t('password_label')}
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 pr-12 bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-dakora-green text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? '...' : t('login_btn')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;