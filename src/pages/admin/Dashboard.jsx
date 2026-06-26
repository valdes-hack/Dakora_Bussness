import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Clock, 
  PlusCircle, 
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';

const Dashboard = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalSales: 0,
    ordersCount: 0,
    productsCount: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Récupérer le total des ventes et le nombre de commandes
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status');

      // 2. Récupérer le nombre de produits
      const { count: prodCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (orders) {
        const sales = orders
          .filter(o => o.status !== 'Annulée')
          .reduce((sum, current) => sum + (current.total_amount || 0), 0);
        
        const pending = orders.filter(o => o.status === 'En attente').length;

        setData({
          totalSales: sales,
          ordersCount: orders.length,
          productsCount: prodCount || 0,
          pendingOrders: pending
        });
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      title: t('stat_sales'), 
      value: `${data.totalSales.toLocaleString()} FCFA`, 
      icon: <TrendingUp size={24} />, 
      color: 'text-green-500', 
      bg: 'bg-green-500/10' 
    },
    { 
      title: t('stat_orders'), 
      value: data.ordersCount, 
      icon: <ShoppingBag size={24} />, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
    { 
      title: t('stat_pending'), 
      value: data.pendingOrders, 
      icon: <Clock size={24} />, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/10' 
    },
    { 
      title: t('stat_products'), 
      value: data.productsCount, 
      icon: <Package size={24} />, 
      color: 'text-dakora-green', 
      bg: 'bg-dakora-green/10' 
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* SECTION BIENVENUE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none">
            Dakora <span className="text-dakora-green">{t('dashboard_title')}</span>
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            {t('dashboard_subtitle')} <span className="text-gray-900 dark:text-white font-bold">{profile?.username || 'Boss'}</span>.
          </p>
        </div>

        {/* ACTIONS RAPIDES */}
        <div className="flex gap-3">
          <Link to="/admin/produits" className="flex items-center gap-2 px-5 py-3 bg-dakora-green text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 transition-all">
            <PlusCircle size={16}/> {t('action_new_product')}
          </Link>
          <Link to="/boutique" className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-black/5 dark:border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">
            <ExternalLink size={16}/> {t('action_view_shop')}
          </Link>
        </div>
      </div>

      {/* GRILLE DE STATISTIQUES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="group relative bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-dakora-green/10">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:rotate-12`}>
                {stat.icon}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-dakora-green uppercase tracking-[0.2em] bg-dakora-green/10 px-2 py-0.5 rounded-full mb-1">
                  {t('stat_realtime')}
                </span>
                <ArrowUpRight size={14} className="text-gray-300" />
              </div>
            </div>
            
            <h3 className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.title}</h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
              {loading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ZONE GRAPHIQUE ET RÉCENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Placeholder Graphique */}
        <div className="lg:col-span-2 bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[3rem] p-10 border border-white/20 shadow-inner flex flex-col items-center justify-center min-h-[350px] border-dashed">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-300">
            <TrendingUp size={32} />
          </div>
          <p className="text-gray-400 italic font-bold text-center max-w-xs">{t('dashboard_chart_placeholder')}</p>
        </div>

        {/* Sidebar Info - Dernières activités (Design Apple) */}
        <div className="bg-gradient-to-br from-dakora-green to-green-800 rounded-[3rem] p-10 text-white shadow-2xl flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Dakora Pro</h3>
            <p className="text-green-100 text-sm font-medium">Votre plateforme est à jour. 100% des services sont opérationnels.</p>
          </div>
          
          <div className="mt-10 space-y-4 relative z-10">
             <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"/>
                <p className="text-[10px] font-bold uppercase tracking-widest">{data.pendingOrders} {t('status_pending')}</p>
             </div>
          </div>

          {/* Décoration fond */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"/>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;