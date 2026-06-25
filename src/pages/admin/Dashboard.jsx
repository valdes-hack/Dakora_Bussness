import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ShoppingBag, Users, Package, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { t } = useLanguage();

  const stats = [
    { title: t('stat_sales'), value: '1.250.000 FCFA', icon: <TrendingUp className="text-green-500" />, color: 'bg-green-100' },
    { title: t('stat_orders'), value: '24', icon: <ShoppingBag className="text-blue-500" />, color: 'bg-blue-100' },
    { title: t('stat_products'), value: '142', icon: <Package className="text-orange-500" />, color: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
          Dakora <span className="text-dakora-green">Insights</span>
        </h1>
        <p className="text-gray-500 font-medium">Bienvenue dans votre centre de commande, Valdes.</p>
      </div>

      {/* CARTES DE STATISTIQUES STYLE APPLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color} dark:bg-white/10`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temps réel</span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.title}</h3>
            <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ZONE POUR LE GRAPHIQUE OU LES DERNIÈRES COMMANDES */}
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/20 h-64 flex items-center justify-center border-dashed">
        <p className="text-gray-400 italic font-medium">Le graphique des ventes apparaîtra ici...</p>
      </div>
    </div>
  );
};

export default Dashboard;