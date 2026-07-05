import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { 
  Package, MapPin, Phone, Mail, User, 
  CheckCircle2, XCircle, Truck, Eye, X, FileText, Navigation, CreditCard,
  Calendar, Hash, Printer, Trash2, Search, SlidersHorizontal, ChevronDown
} from 'lucide-react';
import { createNotification } from '../../utils/notify';
import logo from '../../assets/logos.png';

const Orders = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('invoice');

  // ─── FILTRES ────────────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDelivery, setFilterDelivery] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');
  const [search, setSearch]                 = useState('');
  const [showFilters, setShowFilters]       = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, variants(label_fr, label_en, products(name_fr, name_en)))')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  // ─── FILTRAGE MÉMORISÉ ───────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // Statut
    if (filterStatus !== 'all') list = list.filter(o => o.status === filterStatus);

    // Livraison
    if (filterDelivery !== 'all') list = list.filter(o => o.delivery_mode === filterDelivery);

    // Paiement
    if (filterPayment !== 'all') list = list.filter(o => o.payment_mode === filterPayment);

    // Date début
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      from.setHours(0, 0, 0, 0);
      list = list.filter(o => new Date(o.created_at) >= from);
    }

    // Date fin
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter(o => new Date(o.created_at) <= to);
    }

    // Recherche texte
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.customer_first_name || '').toLowerCase().includes(q) ||
        (o.customer_last_name || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q) ||
        (o.id || '').slice(0, 8).toLowerCase().includes(q)
      );
    }

    return list;
  }, [orders, filterStatus, filterDelivery, filterPayment, filterDateFrom, filterDateTo, search]);

  const hasActiveFilters = filterStatus !== 'all' || filterDelivery !== 'all' ||
    filterPayment !== 'all' || filterDateFrom || filterDateTo || search.trim();

  const resetFilters = () => {
    setFilterStatus('all'); setFilterDelivery('all'); setFilterPayment('all');
    setFilterDateFrom(''); setFilterDateTo(''); setSearch('');
  };

  // Stats rapides pour les badges des filtres
  const countByStatus = (s) => orders.filter(o => o.status === s).length;

  const updateStatus = async (id, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    const order = orders.find(o => o.id === id);
    const ref = id.slice(0, 8).toUpperCase();
    const client = order ? `${order.customer_first_name} ${order.customer_last_name}` : '';
    createNotification(`Commande #${ref} → ${newStatus} (${client})`, 'order', '/admin/commandes');
    fetchOrders();
    setSelectedOrder(null);
  };

  // ─── SUPPRESSION + RESTITUTION DU STOCK ─────────────────────────────────────
  const [deleting, setDeleting] = useState(false);

  const deleteOrder = async (order) => {
    const ref = order.id.slice(0, 8).toUpperCase();
    const confirmed = window.confirm(
      language === 'fr'
        ? `Supprimer la commande #${ref} ?\n\nLe stock des articles sera automatiquement restitué.`
        : `Delete order #${ref}?\n\nStock for all items will be automatically restored.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      // 1. Récupérer les articles de la commande avec les quantités
      const { data: items, error: itemsErr } = await supabase
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', order.id);

      if (itemsErr) throw itemsErr;

      // 2. Restituer le stock pour chaque variante
      if (items && items.length > 0) {
        for (const item of items) {
          if (!item.variant_id) continue;
          // Lire le stock actuel
          const { data: variant } = await supabase
            .from('variants')
            .select('stock_quantity')
            .eq('id', item.variant_id)
            .single();

          if (variant) {
            const newQty = (variant.stock_quantity || 0) + item.quantity;
            await supabase
              .from('variants')
              .update({ stock_quantity: newQty })
              .eq('id', item.variant_id);
          }
        }
      }

      // 3. Supprimer la commande (cascade supprime order_items automatiquement)
      const { error: delErr } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (delErr) throw delErr;

      // 4. Notification
      createNotification(
        `Commande #${ref} supprimée — stock restitué (${order.customer_first_name} ${order.customer_last_name})`,
        'order', '/admin/commandes'
      );

      // 5. Mise à jour locale immédiate
      setOrders(prev => prev.filter(o => o.id !== order.id));
      setSelectedOrder(null);

    } catch (err) {
      alert((language === 'fr' ? 'Erreur : ' : 'Error: ') + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Confirmée': return 'bg-blue-500';
      case 'Livrée': return 'bg-green-500';
      case 'Annulée': return 'bg-red-500';
      default: return 'bg-orange-500';
    }
  };

  // Formate le numéro pour WhatsApp (ajoute 237 si numéro local camerounais)
  const formatWaNumber = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 9) return `237${digits}`;
    return digits;
  };

  // Message WhatsApp vers le client depuis l'admin
  const clientWaLink = (order) => {
    const num = formatWaNumber(order.phone);
    const ref = order.id.slice(0, 8).toUpperCase();
    const siteName = settings.business_name || 'Dakora Business';
    const msg = `Bonjour ${order.customer_first_name} 👋\nVotre commande *#${ref}* (${order.total_amount?.toLocaleString()} FCFA) est actuellement : *${order.status}*.\nMerci pour votre confiance — ${siteName} 🌿`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  };

  // Impression de la facture
  const printInvoice = () => window.print();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none">
            {t('orders_title')?.split(' ')[0]} <span className="text-dakora-green">{t('orders_title')?.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium mt-1 sm:mt-2">{t('orders_subtitle')}</p>
        </div>
        {/* Bouton toggle filtres */}
        <button onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all border ${
            hasActiveFilters
              ? 'bg-dakora-green text-white border-dakora-green shadow-lg'
              : showFilters
                ? 'bg-gray-100 dark:bg-white/10 border-transparent text-gray-600 dark:text-gray-300'
                : 'bg-white/70 dark:bg-white/5 border-white/20 text-gray-500'
          }`}>
          <SlidersHorizontal size={12} sm:size={14}/>
          <span className="hidden sm:inline">{language === 'fr' ? 'Filtres' : 'Filters'}</span>
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>}
          <ChevronDown size={11} sm:size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
        </button>
      </div>

      {/* BARRE DE FILTRES — collapsible */}
      {showFilters && (
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/20 shadow p-3 sm:p-5 animate-in slide-in-from-top-2 duration-200">

          {/* Ligne 1 : Recherche */}
          <div className="relative mb-3 sm:mb-4">
            <Search size={12} sm:size={14} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 rounded-xl bg-gray-50 dark:bg-neutral-800 text-[10px] sm:text-xs font-bold dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none"/>
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={11} sm:size={13}/></button>}
          </div>

          {/* Grille de filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

            {/* Statut */}
            <div>
              <p className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">
                {language === 'fr' ? 'Statut' : 'Status'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5">
                {[
                  { v: 'all', label: language === 'fr' ? 'Tous' : 'All', color: 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300' },
                  { v: 'En attente', label: language === 'fr' ? 'En attente' : 'Pending', color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10' },
                  { v: 'Confirmée', label: language === 'fr' ? 'Confirmée' : 'Confirmed', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10' },
                  { v: 'Livrée', label: language === 'fr' ? 'Livrée' : 'Delivered', color: 'bg-dakora-green/10 text-dakora-green' },
                  { v: 'Annulée', label: language === 'fr' ? 'Annulée' : 'Cancelled', color: 'bg-red-100 text-red-500 dark:bg-red-500/10' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setFilterStatus(opt.v)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[7px] sm:text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-0.5 sm:gap-1 ${
                      filterStatus === opt.v ? 'ring-2 ring-offset-1 ring-dakora-green ' + opt.color : opt.color + ' opacity-60 hover:opacity-100'
                    }`}>
                    {opt.label}
                    {opt.v !== 'all' && <span className="text-[6px] sm:text-[8px] font-bold">({countByStatus(opt.v)})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Livraison */}
            <div>
              <p className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">
                {language === 'fr' ? 'Livraison' : 'Delivery'}
              </p>
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                {[
                  { v: 'all', label: language === 'fr' ? 'Tous' : 'All' },
                  { v: 'retrait', label: '🏪 ' + (language === 'fr' ? 'Retrait' : 'Pickup') },
                  { v: 'domicile', label: '🏠 ' + (language === 'fr' ? 'Domicile' : 'Home') },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setFilterDelivery(opt.v)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[7px] sm:text-[9px] font-black uppercase transition-all ${
                      filterDelivery === opt.v
                        ? 'bg-dakora-green text-white shadow'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-dakora-green/10 hover:text-dakora-green'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paiement */}
            <div>
              <p className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">
                {language === 'fr' ? 'Paiement' : 'Payment'}
              </p>
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                {[
                  { v: 'all', label: language === 'fr' ? 'Tous' : 'All' },
                  { v: 'Cash', label: '💵 Cash' },
                  { v: 'WhatsApp', label: '💬 WhatsApp' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setFilterPayment(opt.v)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[7px] sm:text-[9px] font-black uppercase transition-all ${
                      filterPayment === opt.v
                        ? 'bg-dakora-green text-white shadow'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-dakora-green/10 hover:text-dakora-green'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ligne 3 : Filtre par date + actions */}
          <div className="flex flex-col sm:flex-row items-end gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-black/5 dark:border-white/5">
            <div className="space-y-1.5 w-full sm:w-auto">
              <p className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-widest">
                {language === 'fr' ? 'Date début' : 'From date'}
              </p>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-neutral-800 text-[10px] sm:text-xs font-bold dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none cursor-pointer"/>
            </div>
            <div className="space-y-1.5 w-full sm:w-auto">
              <p className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-widest">
                {language === 'fr' ? 'Date fin' : 'To date'}
              </p>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-neutral-800 text-[10px] sm:text-xs font-bold dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none cursor-pointer"/>
            </div>

            {/* Reset + compteur */}
            <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">
                {filteredOrders.length} / {orders.length} {language === 'fr' ? 'commande(s)' : 'order(s)'}
              </span>
              {hasActiveFilters && (
                <button onClick={resetFilters}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-50 dark:bg-red-500/10 text-red-400 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase hover:bg-red-100 transition-all">
                  <X size={10} sm:size={11}/> {language === 'fr' ? 'Réinitialiser' : 'Reset'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LISTE DES COMMANDES */}
      {loading ? (
        <div className="p-20 text-center animate-pulse text-dakora-green font-black uppercase tracking-widest">{t('msg_loading')}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-20 bg-white/40 dark:bg-white/5 rounded-[3rem] text-center border border-dashed border-gray-300 dark:border-white/10">
          <Package size={48} className="mx-auto text-gray-300 mb-4"/>
          <p className="text-gray-400 font-bold uppercase italic text-sm">
            {hasActiveFilters
              ? (language === 'fr' ? 'Aucune commande pour ces filtres.' : 'No orders match these filters.')
              : t('no_orders_found')
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="group bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-white/20 shadow hover:shadow-dakora-green/10 transition-all flex flex-col gap-1.5 sm:gap-2">
              
              {/* HEADER CARTE : STATUT & RÉF */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getStatusColor(order.status)} shadow animate-pulse flex-shrink-0`}/>
                  <div>
                    <span className="text-[6px] sm:text-[7px] font-black text-gray-400 uppercase tracking-widest block">Réf</span>
                    <p className="font-black dark:text-white text-[9px] sm:text-[10px]">#{order.id.slice(0,8).toUpperCase()}</p>
                  </div>
                </div>
                <span className={`px-1 sm:px-1.5 py-0.5 rounded text-[6px] sm:text-[7px] font-black uppercase ${getStatusColor(order.status).replace('bg-', 'bg-').replace('500', '500/10')} text-gray-700 dark:text-gray-300`}>
                  {order.status}
                </span>
              </div>

              {/* CLIENT */}
              <div className="space-y-0.5">
                <p className="font-black text-[10px] sm:text-xs dark:text-white uppercase leading-none truncate">{order.customer_first_name} {order.customer_last_name}</p>
                <p className="text-[7px] sm:text-[8px] text-gray-500 font-bold flex items-center gap-0.5"><Phone size={7} sm:size={8}/> {order.phone}</p>
              </div>

              {/* ARTICLES (VUE RAPIDE) */}
              <div>
                <p className="text-[7px] sm:text-[8px] dark:text-gray-300 font-medium truncate">
                  {order.order_items?.slice(0, 2).map(i => language === 'fr' ? i.variants?.products?.name_fr : i.variants?.products?.name_en).join(', ')}
                  {order.order_items?.length > 2 && ` +${order.order_items.length - 2}`}
                </p>
              </div>

              {/* LIVRAISON & PAIEMENT */}
              <div className="flex items-center gap-1 text-[6px] sm:text-[7px]">
                <span className={`px-1 sm:px-1.5 py-0.5 rounded font-bold uppercase ${order.delivery_mode === 'retrait' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600' : 'bg-purple-100 dark:bg-purple-500/10 text-purple-600'}`}>
                  {order.delivery_mode === 'retrait' ? '🏪' : '🏠'}
                </span>
                <span className={`px-1 sm:px-1.5 py-0.5 rounded font-bold uppercase ${order.payment_mode === 'Cash' ? 'bg-green-100 dark:bg-green-500/10 text-green-600' : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600'}`}>
                  {order.payment_mode === 'Cash' ? '💵' : '💬'}
                </span>
              </div>

              {/* FOOTER CARTE : MONTANT + ACTIONS */}
              <div className="flex items-center justify-between pt-1.5 border-t border-black/5 dark:border-white/5">
                <div>
                  <p className="text-xs sm:text-sm font-black text-dakora-green">{order.total_amount?.toLocaleString()} <span className="text-[6px] sm:text-[7px]">FCFA</span></p>
                </div>
                <div className="flex gap-1">
                  <a 
                    href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '').length === 9 ? '237' + order.phone.replace(/[^0-9]/g, '') : order.phone.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1 sm:p-1.5 bg-[#25D366] text-white rounded shadow hover:scale-110 transition-all active:scale-95 flex items-center justify-center"
                  >
                    <svg viewBox="0 0 32 32" className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current"><path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.46.643 4.867 1.864 6.99L2 30l7.228-1.895A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm6.27 19.878c-.343-.172-2.034-1.003-2.348-1.118-.314-.115-.544-.172-.773.172-.229.344-.887 1.118-1.088 1.348-.c-.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.708-1.022-.913-1.713-2.04-1.913-2.383-.c-.344-.022-.53.15-.7.155-.154.344-.402.516-.603.172-.2.229-.344.344-.573.115-.23.057-.43-.029-.602-.086-.173-.773-1.862-1.059-2.551-.279-.67-.562-.579-.773-.59l-.657-.011a1.261 1.261 0 00-.916.43c-.314.343-1.203 1.175-1.203 2.866s1.23 3.322 1.402 3.552c.172.23 2.42 3.695 5.866 5.183.82.354 1.46.566 1.96.724.824.261 1.573.224 2.165.136.66-.099 2.034-.831 2.32-1.634.286-.802.286-1.49.2-1.634-.085-.143-.314-.229-.657-.4z"/></svg>
                  </a>
                  <button 
                    onClick={() => { setSelectedOrder(order); setActiveTab('invoice'); }}
                    className="p-1 sm:p-1.5 bg-dakora-green text-white rounded shadow hover:scale-110 transition-all active:scale-95"
                  >
                    <Eye size={10} sm:size={12} />
                  </button>
                  <button
                    onClick={() => deleteOrder(order)}
                    disabled={deleting}
                    className="p-1 sm:p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-40"
                  >
                    <Trash2 size={10} sm:size={12}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALE DÉTAIL D'ÉLITE */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-white/95 dark:bg-neutral-900/95 w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] md:rounded-[3rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in zoom-in duration-300">
            
            {/* HEADER MODALE */}
            <div className="p-5 md:p-7 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className={`p-2.5 md:p-3 rounded-2xl ${getStatusColor(selectedOrder.status)} text-white shadow-lg flex-shrink-0`}>
                  <Package size={20}/>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-2xl font-black uppercase italic dark:text-white truncate">
                    Commande #{selectedOrder.id.slice(0,8).toUpperCase()}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{selectedOrder.status}</p>
                    <span className="text-gray-300 dark:text-white/20">·</span>
                    <p className="text-[10px] text-gray-400 font-bold">
                      {new Date(selectedOrder.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions header */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* WhatsApp client */}
                <a href={clientWaLink(selectedOrder)} target="_blank" rel="noopener noreferrer"
                  title={`Contacter ${selectedOrder.customer_first_name} sur WhatsApp`}
                  className="flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow hover:bg-[#1ebe5d] transition-all active:scale-95">
                  <svg viewBox="0 0 32 32" className="w-4 h-4 fill-current flex-shrink-0">
                    <path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.46.643 4.867 1.864 6.99L2 30l7.228-1.895A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm6.27 19.878c-.343-.172-2.034-1.003-2.348-1.118-.314-.115-.544-.172-.773.172-.229.344-.887 1.118-1.088 1.348-.2.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.708-1.022-.913-1.713-2.04-1.913-2.383-.2-.344-.022-.53.15-.7.155-.154.344-.402.516-.603.172-.2.229-.344.344-.573.115-.23.057-.43-.029-.602-.086-.173-.773-1.862-1.059-2.551-.279-.67-.562-.579-.773-.59l-.657-.011a1.261 1.261 0 00-.916.43c-.314.343-1.203 1.175-1.203 2.866s1.23 3.322 1.402 3.552c.172.23 2.42 3.695 5.866 5.183.82.354 1.46.566 1.96.724.824.261 1.573.224 2.165.136.66-.099 2.034-.831 2.32-1.634.286-.802.286-1.49.2-1.634-.085-.143-.314-.229-.657-.4z"/>
                  </svg>
                  <span className="hidden sm:inline">{selectedOrder.customer_first_name}</span>
                </a>
                {/* Imprimer */}
                <button onClick={printInvoice}
                  className="p-2.5 bg-gray-100 dark:bg-white/10 rounded-2xl text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all print:hidden"
                  title="Imprimer la facture">
                  <Printer size={18}/>
                </button>
                {/* Fermer */}
                <button onClick={() => setSelectedOrder(null)}
                  className="p-2.5 bg-gray-100 dark:bg-white/10 rounded-2xl dark:text-white hover:rotate-90 transition-all">
                  <X size={18}/>
                </button>
              </div>
            </div>

            {/* ONGLET DE NAVIGATION (TABS) */}
            <div className="flex gap-2 p-4 bg-gray-50 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
               <button onClick={() => setActiveTab('invoice')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === 'invoice' ? 'bg-white dark:bg-neutral-800 shadow-md text-dakora-green' : 'text-gray-400'}`}>
                 <FileText size={14}/> {t('order_details_btn')}
               </button>
               <button onClick={() => setActiveTab('client')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === 'client' ? 'bg-white dark:bg-neutral-800 shadow-md text-dakora-green' : 'text-gray-400'}`}>
                 <User size={14}/> {t('order_client_btn')}
               </button>
               <button onClick={() => setActiveTab('map')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === 'map' ? 'bg-white dark:bg-neutral-800 shadow-md text-dakora-green' : 'text-gray-400'}`}>
                 <Navigation size={14}/> {t('order_map_btn')}
               </button>
            </div>

            {/* CONTENU VARIABLE */}
            <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar">
              
              {/* ONGLET FACTURE */}
              {activeTab === 'invoice' && (
                <div className="animate-in fade-in duration-300" id="invoice-print">
                  
                  {/* EN-TÊTE FACTURE PRO-FORMA */}
                  <div className="flex justify-between items-start mb-8 pb-6 border-b border-black/5 dark:border-white/5">
                    <div>
                      <img src={logo} alt="Logo" className="h-14 mb-2"/>
                      <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-base">
                        {settings.business_name || 'Dakora Business'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Expertise Agricole · Douala, CM</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="inline-block px-4 py-1.5 bg-dakora-green text-white rounded-full text-[10px] font-black uppercase tracking-[0.15em]">
                        Facture Pro-Forma
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 justify-end mt-2">
                        <Hash size={10}/> {selectedOrder.id.slice(0,8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 justify-end">
                        <Calendar size={10}/>
                        {new Date(selectedOrder.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* BLOC CLIENT + LIVRAISON */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 p-5 bg-gray-50 dark:bg-white/5 rounded-[1.5rem] border border-black/5 dark:border-white/5 border-l-4 border-l-dakora-green">
                    {/* Client */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Facturé à :</p>
                      <p className="text-xl font-black dark:text-white uppercase tracking-tight leading-tight">
                        {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}
                      </p>
                      <a href={`tel:${selectedOrder.phone}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-dakora-green hover:underline">
                        <Phone size={14}/> {selectedOrder.phone}
                      </a>
                      {selectedOrder.email && (
                        <p className="flex items-center gap-2 text-xs text-gray-400">
                          <Mail size={12}/> {selectedOrder.email}
                        </p>
                      )}
                    </div>
                    {/* Livraison & Paiement */}
                    <div className="space-y-2 sm:border-l sm:border-black/5 sm:dark:border-white/5 sm:pl-5">
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Livraison & Paiement :</p>
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-dakora-green flex-shrink-0"/>
                        <span className="text-sm font-black dark:text-white uppercase">
                          {selectedOrder.delivery_mode === 'retrait' ? 'Retrait en boutique' : 'Livraison à domicile'}
                        </span>
                      </div>
                      {selectedOrder.address && (
                        <p className="text-xs text-gray-400 italic ml-5">{selectedOrder.address}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <CreditCard size={14} className="text-dakora-green flex-shrink-0"/>
                        <span className="text-sm font-bold dark:text-white">{selectedOrder.payment_mode}</span>
                        {selectedOrder.payment_ref && (
                          <span className="text-[9px] font-mono bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-md">
                            Réf: {selectedOrder.payment_ref}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TABLEAU DES ARTICLES */}
                  <div className="space-y-3 mb-6">
                    {/* En-têtes — desktop seulement */}
                    <div className="hidden sm:grid grid-cols-12 pb-2 border-b-2 border-black/5 dark:border-white/5 text-[9px] font-black uppercase text-gray-400 tracking-widest px-2">
                      <div className="col-span-6">Article / Variante</div>
                      <div className="col-span-2 text-center">P.U. (FCFA)</div>
                      <div className="col-span-2 text-center">Qté</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>

                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      selectedOrder.order_items.map((item, idx) => (
                        /* Desktop : ligne grid / Mobile : carte */
                        <div key={idx} className="border-b border-black/5 dark:border-white/5 last:border-0">
                          {/* Desktop */}
                          <div className="hidden sm:grid grid-cols-12 py-3 px-2 items-center hover:bg-gray-50/50 dark:hover:bg-white/5 rounded-xl transition-colors">
                            <div className="col-span-6 flex items-center gap-3">
                              <div className="w-8 h-8 bg-dakora-green/10 text-dakora-green rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0">{idx + 1}</div>
                              <div className="min-w-0">
                                <p className="font-black dark:text-white text-sm truncate">{language === 'fr' ? item.variants?.products?.name_fr : item.variants?.products?.name_en}</p>
                                <p className="text-[9px] font-bold text-dakora-green uppercase tracking-widest truncate">{language === 'fr' ? item.variants?.label_fr : item.variants?.label_en}</p>
                              </div>
                            </div>
                            <div className="col-span-2 text-center text-xs font-bold dark:text-white">{item.unit_price?.toLocaleString()}</div>
                            <div className="col-span-2 text-center"><span className="px-2.5 py-1 bg-gray-100 dark:bg-white/10 rounded-lg text-xs font-black dark:text-white">×{item.quantity}</span></div>
                            <div className="col-span-2 text-right font-black dark:text-white text-sm">{(item.unit_price * item.quantity).toLocaleString()}</div>
                          </div>
                          {/* Mobile */}
                          <div className="flex sm:hidden items-center gap-3 py-3 px-1">
                            <div className="w-7 h-7 bg-dakora-green/10 text-dakora-green rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0">{idx + 1}</div>
                            <div className="flex-grow min-w-0">
                              <p className="font-black dark:text-white text-xs truncate">{language === 'fr' ? item.variants?.products?.name_fr : item.variants?.products?.name_en}</p>
                              <p className="text-[9px] text-dakora-green font-bold truncate">{language === 'fr' ? item.variants?.label_fr : item.variants?.label_en}</p>
                              <p className="text-[9px] text-gray-400 font-bold">{item.unit_price?.toLocaleString()} × {item.quantity}</p>
                            </div>
                            <p className="font-black dark:text-white text-sm flex-shrink-0">{(item.unit_price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-400 italic text-xs bg-gray-50 dark:bg-white/5 rounded-2xl">
                        Aucun article enregistré pour cette commande.
                      </div>
                    )}
                  </div>

                  {/* TOTAL */}
                  <div className="flex justify-end">
                    <div className="w-full sm:w-64 space-y-3">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                        <span>Sous-total</span>
                        <span>{selectedOrder.total_amount?.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-dakora-green/10 rounded-2xl border border-dakora-green/20">
                        <span className="text-[10px] font-black uppercase text-dakora-green">Total Net</span>
                        <span className="text-2xl font-black text-dakora-green tracking-tighter">
                          {selectedOrder.total_amount?.toLocaleString()} <span className="text-xs">FCFA</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Signature / Note de bas */}
                  <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex justify-between items-end text-[9px] text-gray-300 dark:text-white/20 font-bold uppercase tracking-widest">
                    <span>{settings.business_name || 'Dakora Business'} — Douala, Cameroun</span>
                    <span>Merci de votre confiance 🌿</span>
                  </div>
                </div>
              )}

              {/* ONGLET INFOS CLIENT */}
              {activeTab === 'client' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                  {/* Contact */}
                  <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-[2rem] space-y-4 border border-black/5 dark:border-white/5">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Contact Direct</p>
                    <p className="text-2xl font-black dark:text-white uppercase italic tracking-tight">
                      {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a href={`tel:${selectedOrder.phone}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/10 rounded-2xl font-bold text-sm text-dakora-green border border-dakora-green/20 hover:bg-dakora-green hover:text-white transition-all shadow-sm">
                        <Phone size={15}/> {selectedOrder.phone}
                      </a>
                      <a href={clientWaLink(selectedOrder)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1ebe5d] transition-all shadow-sm">
                        <svg viewBox="0 0 32 32" className="w-4 h-4 fill-current"><path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.46.643 4.867 1.864 6.99L2 30l7.228-1.895A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm6.27 19.878c-.343-.172-2.034-1.003-2.348-1.118-.314-.115-.544-.172-.773.172-.229.344-.887 1.118-1.088 1.348-.2.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.708-1.022-.913-1.713-2.04-1.913-2.383-.2-.344-.022-.53.15-.7.155-.154.344-.402.516-.603.172-.2.229-.344.344-.573.115-.23.057-.43-.029-.602-.086-.173-.773-1.862-1.059-2.551-.279-.67-.562-.579-.773-.59l-.657-.011a1.261 1.261 0 00-.916.43c-.314.343-1.203 1.175-1.203 2.866s1.23 3.322 1.402 3.552c.172.23 2.42 3.695 5.866 5.183.82.354 1.46.566 1.96.724.824.261 1.573.224 2.165.136.66-.099 2.034-.831 2.32-1.634.286-.802.286-1.49.2-1.634-.085-.143-.314-.229-.657-.4z"/></svg>
                        WhatsApp
                      </a>
                      {selectedOrder.email && (
                        <a href={`mailto:${selectedOrder.email}`}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/10 rounded-2xl font-bold text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm">
                          <Mail size={14}/> {selectedOrder.email}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Livraison & Paiement */}
                  <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-[2rem] space-y-3 border border-black/5 dark:border-white/5">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Expédition & Paiement</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-dakora-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Truck size={16} className="text-dakora-green"/>
                      </div>
                      <div>
                        <p className="text-sm font-black dark:text-white uppercase">{selectedOrder.delivery_mode === 'retrait' ? 'Retrait en boutique' : 'Livraison à domicile'}</p>
                        {selectedOrder.address && <p className="text-xs text-gray-400 italic">{selectedOrder.address}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5">
                      <div className="w-9 h-9 bg-dakora-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CreditCard size={16} className="text-dakora-green"/>
                      </div>
                      <div>
                        <p className="text-sm font-black dark:text-white uppercase">{selectedOrder.payment_mode}</p>
                        {selectedOrder.payment_ref && (
                          <p className="text-[9px] font-mono text-orange-500">Réf: {selectedOrder.payment_ref}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TABS : MAP GPS */}
              {activeTab === 'map' && (
                <div className="h-[400px] rounded-[2.5rem] overflow-hidden border border-black/10 shadow-inner relative animate-in fade-in">
                   <div className="absolute top-4 left-4 z-[400] bg-white/90 p-3 rounded-2xl shadow-xl border border-black/5 flex items-center gap-3">
                      <MapPin className="text-dakora-green" size={20}/>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Position GPS</p>
                        <p className="text-xs font-bold">{selectedOrder.city}, Cameroon</p>
                      </div>
                   </div>
                   <MapContainer center={[selectedOrder.latitude || 4.05, selectedOrder.longitude || 9.76]} zoom={14} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedOrder.latitude || 4.05, selectedOrder.longitude || 9.76]} />
                   </MapContainer>
                </div>
              )}

            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-5 md:p-7 bg-gray-50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 space-y-3">
              {/* Statuts */}
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em] block text-center">
                {t('order_status_update')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => updateStatus(selectedOrder.id, 'Confirmée')}
                  className="py-3.5 bg-blue-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95">
                  <CheckCircle2 size={15}/> Confirmer
                </button>
                <button onClick={() => updateStatus(selectedOrder.id, 'Livrée')}
                  className="py-3.5 bg-green-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 active:scale-95">
                  <Truck size={15}/> Livrée
                </button>
                <button onClick={() => updateStatus(selectedOrder.id, 'Annulée')}
                  className="py-3.5 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95">
                  <XCircle size={15}/> Annuler
                </button>
              </div>

              {/* Ligne séparatrice + bouton supprimer */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <button
                  onClick={() => deleteOrder(selectedOrder)}
                  disabled={deleting}
                  className="w-full py-3.5 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 bg-red-50 dark:bg-red-500/5 text-red-500 border border-red-200 dark:border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500"
                >
                  {deleting
                    ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"/>
                    : <Trash2 size={15}/>
                  }
                  {language === 'fr' ? 'Supprimer la commande (stock restitué)' : 'Delete order (stock restored)'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
      
      {/* STYLE */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: fixed; left: 0; top: 0; width: 100%; padding: 40px; background: white; }
        }
      `}</style>
    </div>
  );
};

export default Orders;