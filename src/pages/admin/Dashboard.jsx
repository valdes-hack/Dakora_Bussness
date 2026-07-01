import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Package, TrendingUp, Clock,
  PlusCircle, ExternalLink, AlertTriangle,
  ArrowRight, Boxes, CheckCircle2, XCircle
} from 'lucide-react';

// ─── GRAPHIQUE BARRES SVG (sans librairie) ────────────────────────────────────
const SalesChart = ({ data, language }) => {
  if (!data.length) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-300">
      <TrendingUp size={40}/>
      <p className="text-sm font-bold italic">{language === 'fr' ? 'Aucune donnée de vente' : 'No sales data yet'}</p>
    </div>
  );

  const max = Math.max(...data.map(d => d.total), 1);
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-end gap-2 flex-1 pb-6 relative">
        {/* Lignes de grille */}
        {[0.25,0.5,0.75,1].map(ratio => (
          <div key={ratio} className="absolute left-0 right-0 border-t border-dashed border-black/5 dark:border-white/5 flex items-center"
            style={{ bottom: `${ratio * 100}%` }}>
            <span className="text-[8px] text-gray-300 font-bold pr-1 -mt-2 whitespace-nowrap">
              {Math.round(max * ratio / 1000)}k
            </span>
          </div>
        ))}
        <div className="flex items-end gap-1.5 flex-1 pl-6 h-full">
          {data.map((d, i) => {
            const pct = max > 0 ? (d.total / max) * 100 : 0;
            const isCurrentMonth = i === data.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                  <div
                    className={`w-full rounded-xl transition-all duration-700 ${isCurrentMonth ? 'bg-dakora-green shadow-lg shadow-dakora-green/20' : 'bg-dakora-green/30 group-hover:bg-dakora-green/50'}`}
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    title={`${d.total.toLocaleString()} FCFA`}
                  />
                  {/* Tooltip valeur */}
                  {d.total > 0 && (
                    <div className="absolute -top-7 bg-gray-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {d.total >= 1000 ? `${(d.total/1000).toFixed(0)}k` : d.total.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Labels mois */}
      <div className="flex gap-1.5 pl-6">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className={`text-[8px] font-bold uppercase ${i === data.length - 1 ? 'text-dakora-green' : 'text-gray-400'}`}>
              {language === 'fr' ? months[d.month - 1] : monthsEn[d.month - 1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DASHBOARD PRINCIPAL ─────────────────────────────────────────────────────
const Dashboard = () => {
  const { t, language } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0, ordersCount: 0, productsCount: 0, pendingOrders: 0
  });
  const [chartData, setChartData]       = useState([]);
  const [outOfStock, setOutOfStock]     = useState([]);
  const [lowStock, setLowStock]         = useState([]);
  const [pendingList, setPendingList]   = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1. Stats commandes
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, customer_first_name, customer_last_name, phone')
        .order('created_at', { ascending: false });

      if (orders) {
        const active   = orders.filter(o => o.status !== 'Annulée');
        const pending  = orders.filter(o => o.status === 'En attente');
        const totalSales = active.reduce((s, o) => s + (o.total_amount || 0), 0);
        setStats(prev => ({ ...prev, totalSales, ordersCount: orders.length, pendingOrders: pending.length }));
        setPendingList(pending.slice(0, 5));
        setRecentOrders(orders.slice(0, 5));

        // Graphique : regrouper par mois (12 derniers mois)
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({ year: d.getFullYear(), month: d.getMonth() + 1, total: 0 });
        }
        active.forEach(o => {
          const d = new Date(o.created_at);
          const idx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1);
          if (idx !== -1) months[idx].total += o.total_amount || 0;
        });
        setChartData(months);
      }

      // 2. Produits actifs
      const { count: prodCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      setStats(prev => ({ ...prev, productsCount: prodCount || 0 }));

      // 3. Stocks — variantes à 0 ou ≤ 5
      const { data: variants } = await supabase
        .from('variants')
        .select('id, label_fr, label_en, stock_quantity, products(id, name_fr, name_en, product_images(url, is_main))')
        .lte('stock_quantity', 5)
        .order('stock_quantity', { ascending: true });

      if (variants) {
        setOutOfStock(variants.filter(v => v.stock_quantity === 0).slice(0, 6));
        setLowStock(variants.filter(v => v.stock_quantity > 0 && v.stock_quantity <= 5).slice(0, 4));
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('stat_sales'), icon: <TrendingUp size={22}/>,
      value: loading ? '...' : `${stats.totalSales.toLocaleString()} FCFA`,
      color: 'text-dakora-green', bg: 'bg-dakora-green/10',
      link: '/admin/commandes', sub: language === 'fr' ? 'Hors commandes annulées' : 'Excl. cancelled orders'
    },
    {
      title: t('stat_orders'), icon: <ShoppingBag size={22}/>,
      value: loading ? '...' : stats.ordersCount,
      color: 'text-blue-500', bg: 'bg-blue-500/10',
      link: '/admin/commandes', sub: language === 'fr' ? 'Total toutes commandes' : 'All orders total'
    },
    {
      title: t('stat_pending'), icon: <Clock size={22}/>,
      value: loading ? '...' : stats.pendingOrders,
      color: 'text-orange-500', bg: 'bg-orange-500/10',
      link: '/admin/commandes', sub: language === 'fr' ? 'À traiter maintenant' : 'To handle now',
      alert: stats.pendingOrders > 0
    },
    {
      title: t('stat_products'), icon: <Package size={22}/>,
      value: loading ? '...' : stats.productsCount,
      color: 'text-purple-500', bg: 'bg-purple-500/10',
      link: '/admin/produits', sub: language === 'fr' ? 'Produits en ligne' : 'Active products'
    },
  ];

  const statusColor = (s) => ({
    'En attente': 'bg-orange-100 text-orange-600 dark:bg-orange-500/10',
    'Confirmée':  'bg-blue-100 text-blue-600 dark:bg-blue-500/10',
    'Livrée':     'bg-dakora-green/10 text-dakora-green',
    'Annulée':    'bg-red-100 text-red-500 dark:bg-red-500/10',
  }[s] || 'bg-gray-100 text-gray-400');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none">
            Dakora <span className="text-dakora-green">{t('dashboard_title')}</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {t('dashboard_subtitle')} <span className="text-gray-900 dark:text-white font-bold">{profile?.username || 'Boss'}</span> 👋
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/produits"
            className="flex items-center gap-2 px-5 py-3 bg-dakora-green text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-green-700 transition-all active:scale-95">
            <PlusCircle size={16}/> {t('action_new_product')}
          </Link>
          <Link to="/boutique"
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-white/5 text-gray-700 dark:text-white border border-black/5 dark:border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
            <ExternalLink size={16}/> {t('action_view_shop')}
          </Link>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {statCards.map((s, i) => (
          <Link key={i} to={s.link}
            className={`group relative bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl p-4 md:p-7 rounded-[1.5rem] md:rounded-[2.5rem] border shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${s.alert ? 'border-orange-200 dark:border-orange-500/20 shadow-orange-100 dark:shadow-orange-500/5' : 'border-white/20 dark:border-white/5'}`}>
            {s.alert && (
              <span className="absolute top-3 right-3 md:top-4 md:right-4 w-2 h-2 md:w-2.5 md:h-2.5 bg-orange-500 rounded-full animate-ping"/>
            )}
            <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-3 md:mb-5 group-hover:scale-110 transition-transform`}>
              {s.icon}
            </div>
            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{s.title}</p>
            <p className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-1">
              {loading ? <span className="inline-block w-16 md:w-20 h-5 md:h-7 bg-gray-100 dark:bg-white/10 rounded-xl animate-pulse"/> : s.value}
            </p>
            <p className="text-[8px] md:text-[9px] text-gray-400 font-medium hidden sm:block">{s.sub}</p>
            <ArrowRight size={12} className="absolute bottom-3 right-3 md:bottom-5 md:right-5 text-gray-200 group-hover:text-dakora-green group-hover:translate-x-1 transition-all"/>
          </Link>
        ))}
      </div>

      {/* GRAPHIQUE + COMMANDES EN ATTENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* GRAPHIQUE VENTES 12 MOIS */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-[3rem] p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-base flex items-center gap-2">
                <TrendingUp size={18} className="text-dakora-green"/> {language === 'fr' ? 'Ventes — 12 derniers mois' : 'Sales — last 12 months'}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                {language === 'fr' ? 'Chiffre d\'affaires en FCFA' : 'Revenue in FCFA'}
              </p>
            </div>
            <Link to="/admin/commandes"
              className="text-[10px] font-black uppercase text-dakora-green hover:underline flex items-center gap-1">
              {language === 'fr' ? 'Voir tout' : 'View all'} <ArrowRight size={12}/>
            </Link>
          </div>
          {/* Wrapper scrollable sur mobile */}
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="min-w-[340px] h-52">
              {loading
                ? <div className="h-full flex items-end gap-1.5 pl-6 pb-6">
                    {Array.from({length:12}).map((_,i) => (
                      <div key={i} className="flex-1 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" style={{height:`${20+Math.random()*60}%`}}/>
                    ))}
                  </div>
                : <SalesChart data={chartData} language={language}/>
              }
            </div>
          </div>
        </div>

        {/* COMMANDES EN ATTENTE */}
        <div className={`bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-[3rem] p-7 border shadow-xl flex flex-col ${stats.pendingOrders > 0 ? 'border-orange-200 dark:border-orange-500/20' : 'border-white/20'}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm flex items-center gap-2">
              <Clock size={16} className="text-orange-500"/>
              {language === 'fr' ? 'En attente' : 'Pending'}
              {stats.pendingOrders > 0 && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black rounded-full">{stats.pendingOrders}</span>
              )}
            </h3>
            <Link to="/admin/commandes"
              className="text-[10px] font-black uppercase text-dakora-green hover:underline flex items-center gap-1">
              Gérer <ArrowRight size={12}/>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(n => <div key={n} className="h-12 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"/>)}
            </div>
          ) : pendingList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <CheckCircle2 size={36} className="text-dakora-green"/>
              <p className="text-sm font-bold text-gray-400">{language === 'fr' ? 'Aucune commande en attente !' : 'No pending orders!'}</p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-hidden">
              {pendingList.map(order => (
                <Link key={order.id} to="/admin/commandes"
                  className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-500/5 rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-all border border-orange-100 dark:border-orange-500/10 group">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse flex-shrink-0"/>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                      {order.customer_first_name} {order.customer_last_name}
                    </p>
                    <p className="text-[9px] text-orange-600 font-bold">#{order.id.slice(0,8).toUpperCase()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-black text-gray-900 dark:text-white">{order.total_amount?.toLocaleString()}</p>
                    <p className="text-[8px] text-gray-400">FCFA</p>
                  </div>
                  <ArrowRight size={13} className="text-gray-300 group-hover:text-orange-500 transition-colors flex-shrink-0"/>
                </Link>
              ))}
              {stats.pendingOrders > 5 && (
                <Link to="/admin/commandes" className="block text-center text-[10px] font-black text-orange-500 hover:underline py-1">
                  +{stats.pendingOrders - 5} {language === 'fr' ? 'autres...' : 'more...'}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RUPTURES DE STOCK + STOCK FAIBLE + COMMANDES RÉCENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RUPTURES & STOCK FAIBLE */}
        <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-[3rem] p-7 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm flex items-center gap-2">
              <Boxes size={16} className="text-red-500"/>
              {language === 'fr' ? 'Alertes Stock' : 'Stock Alerts'}
            </h3>
            <Link to="/admin/inventaire"
              className="text-[10px] font-black uppercase text-dakora-green hover:underline flex items-center gap-1">
              {language === 'fr' ? 'Gérer le stock' : 'Manage stock'} <ArrowRight size={12}/>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(n => <div key={n} className="h-12 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"/>)}
            </div>
          ) : (outOfStock.length === 0 && lowStock.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <CheckCircle2 size={36} className="text-dakora-green"/>
              <p className="text-sm font-bold text-gray-400">{language === 'fr' ? 'Tous les stocks sont OK !' : 'All stocks are OK!'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Ruptures */}
              {outOfStock.map(v => {
                const name = language === 'fr' ? v.products?.name_fr : v.products?.name_en;
                const label = language === 'fr' ? v.label_fr : v.label_en;
                const img = v.products?.product_images?.find(i => i.is_main)?.url || v.products?.product_images?.[0]?.url;
                return (
                  <Link key={v.id} to="/admin/inventaire"
                    className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/10 transition-all group">
                    {img
                      ? <img src={img} loading="lazy" alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0"/>
                      : <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-base flex-shrink-0">📦</div>
                    }
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{name}</p>
                      <p className="text-[9px] text-gray-500 truncate">{label}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-500 text-white text-[9px] font-black rounded-full flex-shrink-0 flex items-center gap-1">
                      <AlertTriangle size={9}/> Rupture
                    </span>
                  </Link>
                );
              })}
              {/* Stock faible */}
              {lowStock.map(v => {
                const name = language === 'fr' ? v.products?.name_fr : v.products?.name_en;
                const label = language === 'fr' ? v.label_fr : v.label_en;
                const img = v.products?.product_images?.find(i => i.is_main)?.url || v.products?.product_images?.[0]?.url;
                return (
                  <Link key={v.id} to="/admin/inventaire"
                    className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-500/5 border border-yellow-100 dark:border-yellow-500/10 rounded-2xl hover:bg-yellow-100 dark:hover:bg-yellow-500/10 transition-all group">
                    {img
                      ? <img src={img} loading="lazy" alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0"/>
                      : <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center text-base flex-shrink-0">📦</div>
                    }
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{name}</p>
                      <p className="text-[9px] text-gray-500 truncate">{label}</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-[9px] font-black rounded-full flex-shrink-0 flex items-center gap-1">
                      <AlertTriangle size={9}/> {v.stock_quantity} restant{v.stock_quantity > 1 ? 's' : ''}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* COMMANDES RÉCENTES */}
        <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-[3rem] p-7 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm flex items-center gap-2">
              <ShoppingBag size={16} className="text-dakora-green"/>
              {language === 'fr' ? 'Commandes récentes' : 'Recent orders'}
            </h3>
            <Link to="/admin/commandes"
              className="text-[10px] font-black uppercase text-dakora-green hover:underline flex items-center gap-1">
              {language === 'fr' ? 'Tout voir' : 'View all'} <ArrowRight size={12}/>
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(n => <div key={n} className="h-12 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse"/>)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <ShoppingBag size={36} className="text-gray-200"/>
              <p className="text-sm font-bold text-gray-400">{language === 'fr' ? 'Aucune commande' : 'No orders yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <Link key={order.id} to="/admin/commandes"
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-black/5 group">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                        {order.customer_first_name} {order.customer_last_name}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex-shrink-0 ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold">
                      #{order.id.slice(0,8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {day:'2-digit',month:'short'})}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-gray-900 dark:text-white">{order.total_amount?.toLocaleString()}</p>
                    <p className="text-[8px] text-gray-400">FCFA</p>
                  </div>
                  <ArrowRight size={13} className="text-gray-200 group-hover:text-dakora-green transition-colors flex-shrink-0"/>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
