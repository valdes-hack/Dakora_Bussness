import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Package, MapPin, Phone, Mail, User, 
  CheckCircle2, XCircle, Truck, Eye, X, FileText, Navigation, CreditCard
} from 'lucide-react';
import { createNotification } from '../../utils/notify';

const Orders = () => {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('invoice'); // 'invoice', 'client', 'map'

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

  const updateStatus = async (id, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    const order = orders.find(o => o.id === id);
    const ref = id.slice(0, 8).toUpperCase();
    const client = order ? `${order.customer_first_name} ${order.customer_last_name}` : '';
    createNotification(`Commande #${ref} → ${newStatus} (${client})`, 'order', '/admin/commandes');
    fetchOrders();
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Confirmée': return 'bg-blue-500';
      case 'Livrée': return 'bg-green-500';
      case 'Annulée': return 'bg-red-500';
      default: return 'bg-orange-500';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none">
            {t('orders_title')?.split(' ')[0]} <span className="text-dakora-green">{t('orders_title')?.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-gray-500 font-medium mt-2">{t('orders_subtitle')}</p>
        </div>
      </div>

      {/* LISTE DES COMMANDES (RESPONSIVE) */}
      {loading ? (
        <div className="p-20 text-center animate-pulse text-dakora-green font-black uppercase tracking-widest">{t('msg_loading')}</div>
      ) : orders.length === 0 ? (
        <div className="p-20 bg-white/40 dark:bg-white/5 rounded-[3rem] text-center border border-dashed border-gray-300 dark:border-white/10">
          <Package size={48} className="mx-auto text-gray-300 mb-4"/>
          <p className="text-gray-400 font-bold uppercase italic text-sm">{t('no_orders_found')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map(order => (
            <div key={order.id} className="group bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-white/20 shadow-xl hover:shadow-dakora-green/10 transition-all flex flex-col md:flex-row items-center gap-8">
              
              {/* STATUT & RÉF */}
              <div className="flex flex-col items-center md:items-start min-w-[120px]">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)} mb-2 shadow-lg animate-pulse`}/>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Référence</span>
                <p className="font-black dark:text-white text-sm">#{order.id.slice(0,8).toUpperCase()}</p>
              </div>

              {/* CLIENT */}
              <div className="flex-grow space-y-1 text-center md:text-left">
                <span className="text-[10px] font-black text-dakora-green uppercase tracking-widest">{t('order_client')}</span>
                <p className="font-black text-lg dark:text-white uppercase leading-none">{order.customer_first_name} {order.customer_last_name}</p>
                <p className="text-xs text-gray-500 font-bold flex items-center justify-center md:justify-start gap-2"><Phone size={12}/> {order.phone}</p>
              </div>

              {/* ARTICLES (VUE RAPIDE) */}
              <div className="hidden lg:block flex-grow max-w-xs">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('order_items')}</span>
                <p className="text-xs dark:text-gray-300 font-medium truncate mt-1">
                  {order.order_items?.map(i => i.variants?.products?.name_fr).join(', ')}
                </p>
              </div>

              {/* MONTANT */}
              <div className="text-center md:text-right min-w-[140px]">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('order_total')}</span>
                 <p className="text-xl font-black text-dakora-green">{order.total_amount?.toLocaleString()} <span className="text-[10px]">FCFA</span></p>
              </div>

              {/* ACTION */}
              <div className="flex gap-2">
                <a 
                  href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '').length === 9 ? '237' + order.phone.replace(/[^0-9]/g, '') : order.phone.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-4 bg-[#25D366] text-white rounded-2xl shadow-lg hover:scale-110 transition-all active:scale-95 flex items-center justify-center"
                  title="Discuter sur WhatsApp"
                >
                  <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current"><path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.46.643 4.867 1.864 6.99L2 30l7.228-1.895A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm6.27 19.878c-.343-.172-2.034-1.003-2.348-1.118-.314-.115-.544-.172-.773.172-.229.344-.887 1.118-1.088 1.348-.2.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.708-1.022-.913-1.713-2.04-1.913-2.383-.2-.344-.022-.53.15-.7.155-.154.344-.402.516-.603.172-.2.229-.344.344-.573.115-.23.057-.43-.029-.602-.086-.173-.773-1.862-1.059-2.551-.279-.67-.562-.579-.773-.59l-.657-.011a1.261 1.261 0 00-.916.43c-.314.343-1.203 1.175-1.203 2.866s1.23 3.322 1.402 3.552c.172.23 2.42 3.695 5.866 5.183.82.354 1.46.566 1.96.724.824.261 1.573.224 2.165.136.66-.099 2.034-.831 2.32-1.634.286-.802.286-1.49.2-1.634-.085-.143-.314-.229-.657-.4z"/></svg>
                </a>
                <button 
                  onClick={() => { setSelectedOrder(order); setActiveTab('invoice'); }}
                  className="p-4 bg-dakora-green text-white rounded-2xl shadow-lg hover:scale-110 transition-all active:scale-95"
                >
                  <Eye size={20} />
                </button>
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
            <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${getStatusColor(selectedOrder.status)} text-white shadow-lg`}>
                  <Package size={24}/>
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic dark:text-white">Commande #{selectedOrder.id.slice(0,8).toUpperCase()}</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{selectedOrder.status}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-3 bg-gray-100 dark:bg-white/10 rounded-full dark:text-white hover:rotate-90 transition-all"><X /></button>
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
            <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
              
              {/* TABS : FACTURE (ARTICLES & INFOS) */}
              {activeTab === 'invoice' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Résumé des informations saisies par le client */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 dark:bg-neutral-800/50 rounded-[2rem] border border-black/5 dark:border-white/5">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Facturé à (Client) :</p>
                      <p className="text-base font-black dark:text-white uppercase">
                        {selectedOrder.customer_first_name} {selectedOrder.customer_last_name}
                      </p>
                      <a href={`tel:${selectedOrder.phone}`} className="text-xs font-bold text-dakora-green hover:underline flex items-center gap-1.5">
                        <Phone size={12}/> {selectedOrder.phone}
                      </a>
                      {selectedOrder.email && (
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Mail size={12}/> {selectedOrder.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5 md:text-right flex flex-col md:items-end">
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Livraison & Paiement :</p>
                      <p className="text-xs font-black dark:text-white uppercase flex items-center gap-1.5">
                        <Truck size={12} className="text-dakora-green"/> {selectedOrder.delivery_mode === 'retrait' ? 'Retrait en boutique' : 'Livraison à domicile'}
                      </p>
                      <p className="text-[10px] text-gray-400 italic max-w-xs">{selectedOrder.address || 'Aucune adresse fournie'}</p>
                      <p className="text-xs font-bold text-dakora-green mt-1 flex items-center gap-1.5">
                        <CreditCard size={12}/> Mode : {selectedOrder.payment_mode}
                      </p>
                      {selectedOrder.payment_ref && (
                        <p className="text-[9px] font-mono bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-md">
                          RÉF: {selectedOrder.payment_ref}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Liste des articles */}
                  <div className="space-y-4">
                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      selectedOrder.order_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-black/5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-dakora-green text-white rounded-xl flex items-center justify-center font-black">{idx + 1}</div>
                            <div>
                              <p className="font-black dark:text-white uppercase text-sm">
                                {language === 'fr' ? item.variants?.products?.name_fr : item.variants?.products?.name_en}
                              </p>
                              <p className="text-[10px] font-bold text-dakora-green uppercase tracking-widest">
                                {language === 'fr' ? item.variants?.label_fr : item.variants?.label_en}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black dark:text-white">x{item.quantity}</p>
                            <p className="text-xs font-bold text-gray-400">{(item.unit_price * item.quantity).toLocaleString()} FCFA</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10 text-gray-400 italic text-xs">
                        Aucun article enregistré pour cette commande (RLS bloquant lors de l'achat).
                      </div>
                    )}
                  </div>

                  {/* Montant total */}
                  <div className="p-6 bg-dakora-green/10 rounded-[2rem] flex justify-between items-end border border-dakora-green/20">
                     <span className="text-xs font-black text-dakora-green uppercase tracking-widest">{t('order_total')}</span>
                     <span className="text-3xl font-black text-dakora-green tracking-tighter">{selectedOrder.total_amount?.toLocaleString()} FCFA</span>
                  </div>
                </div>
              )}

              {/* TABS : INFOS CLIENT */}
              {activeTab === 'client' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
                   <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Contact Direct</label>
                      <p className="text-xl font-black dark:text-white uppercase italic">{selectedOrder.customer_first_name} {selectedOrder.customer_last_name}</p>
                      <a href={`tel:${selectedOrder.phone}`} className="flex items-center gap-3 text-dakora-green font-bold hover:underline"><Phone size={16}/> {selectedOrder.phone}</a>
                      {selectedOrder.email && <p className="flex items-center gap-3 text-gray-500 text-sm"><Mail size={16}/> {selectedOrder.email}</p>}
                   </div>
                   <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Expédition & Paiement</label>
                      <p className="text-sm font-bold dark:text-white uppercase"><Truck className="inline mr-2 text-dakora-green" size={16}/> {selectedOrder.delivery_mode}</p>
                      <p className="text-xs text-gray-500 italic">{selectedOrder.address || 'Aucune adresse fournie'}</p>
                      <div className="pt-4 border-t border-black/5">
                        <p className="text-sm font-bold dark:text-white uppercase"><CreditCard className="inline mr-2 text-dakora-green" size={16}/> {selectedOrder.payment_mode}</p>
                        {selectedOrder.payment_ref && <p className="text-[10px] font-mono text-orange-500 mt-1">RÉF: {selectedOrder.payment_ref}</p>}
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

            {/* FOOTER ACTIONS : STATUS UPDATE */}
            <div className="p-6 md:p-8 bg-gray-50 dark:bg-black/20 border-t border-black/5 dark:border-white/5">
               <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] mb-4 block text-center">{t('order_status_update')}</label>
               <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => updateStatus(selectedOrder.id, 'Confirmée')} className="py-4 bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Confirmer</button>
                  <button onClick={() => updateStatus(selectedOrder.id, 'Livrée')} className="py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"><Truck size={16}/> Livrée</button>
                  <button onClick={() => updateStatus(selectedOrder.id, 'Annulée')} className="py-4 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><XCircle size={16}/> Annuler</button>
               </div>
            </div>

          </div>
        </div>
      )}
      
      {/* STYLE SCROLLBAR */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default Orders;