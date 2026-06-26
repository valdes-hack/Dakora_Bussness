import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../api/supabaseClient';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Trash2, Plus, Minus, ArrowLeft, ShoppingBag, User, MapPin, 
  CreditCard, CheckCircle2, Loader2, MessageCircle, Printer, Phone, Mail, Navigation2
} from 'lucide-react';
import logo from '../../assets/logo.jpeg';

// Correction icône Marker Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { t, language } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNum, setOrderNum] = useState('');

  // --- ÉTAT ALIGNÉ SUR TA BD (100% RESPECTÉ) ---
  const [orderData, setOrderData] = useState({
    customer_first_name: '',
    customer_last_name: '',
    phone: '',
    email: '',
    delivery_mode: 'retrait',
    address: '',
    city: 'Douala',
    payment_mode: 'Cash',
    payment_ref: '',
    latitude: 4.0511, // Douala par défaut
    longitude: 9.7679
  });

  // Gestion clic sur la carte
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setOrderData(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
      },
    });
    return null;
  };

  const handlePrint = () => window.print();

  const handleFinalizeOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Insertion table 'orders'
      const { data: order, error: orderErr } = await supabase.from('orders').insert([{
        customer_first_name: orderData.customer_first_name,
        customer_last_name: orderData.customer_last_name,
        phone: orderData.phone,
        email: orderData.email,
        delivery_mode: orderData.delivery_mode,
        address: orderData.address,
        city: orderData.city,
        payment_mode: orderData.payment_mode,
        payment_ref: orderData.payment_ref,
        total_amount: totalAmount,
        latitude: orderData.latitude,
        longitude: orderData.longitude,
        status: 'En attente'
      }]).select().single();

      if (orderErr) throw orderErr;

      // 2. Insertion table 'order_items'
      const itemsToInsert = cart.map(item => ({
        order_id: order.id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.price
      }));
      await supabase.from('order_items').insert(itemsToInsert);

      const ref = order.id.slice(0, 8).toUpperCase();
      setOrderNum(ref);
      
      // WhatsApp
      const whatsappMsg = `*NOUVELLE COMMANDE #${ref}*\nClient: ${orderData.customer_first_name}\nPosition: https://www.google.com/maps?q=${orderData.latitude},${orderData.longitude}`;
      window.open(`https://wa.me/2376XXXXXXXX?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
      
      setIsSuccess(true);
      clearCart();
    } catch (err) { alert("Erreur: " + err.message); }
    finally { setLoading(false); }
  };

  if (cart.length === 0 && !isSuccess) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-10 animate-in fade-in text-center">
      <ShoppingBag size={64} className="text-gray-200 mb-4 mx-auto"/>
      <h2 className="text-2xl font-black uppercase italic dark:text-white">Votre panier est vide</h2>
      <Link to="/boutique" className="mt-6 px-10 py-4 bg-dakora-green text-white rounded-full font-black uppercase text-xs shadow-xl">Boutique</Link>
    </div>
  );

  if (isSuccess) return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-green-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl"><CheckCircle2 size={48}/></div>
      <h2 className="text-4xl font-black uppercase italic dark:text-white tracking-tighter">Commande Enregistrée !</h2>
      <p className="text-gray-500 font-medium">Référence : <span className="text-dakora-green font-black">#{orderNum}</span>. Redirection WhatsApp...</p>
      <Link to="/boutique" className="inline-block px-12 py-5 bg-dakora-green text-white rounded-full font-black uppercase text-xs shadow-xl">Retour Accueil</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-12">
        <h1 className="text-5xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Finalisation</h1>
        <button onClick={handlePrint} className="hidden md:flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 shadow-sm transition-all active:scale-95">
          <Printer size={16}/> Ouvrir dans le navigateur
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* --- GAUCHE : LA FACTURE PRO-FORMA (LIVE UPDATE) --- */}
        <div id="invoice-capture" className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-[3rem] p-8 md:p-12 border border-black/5 dark:border-white/10 shadow-2xl">
          <div className="flex justify-between items-start mb-16">
            <div>
              <img src={logo} alt="Logo" className="h-16 mb-4" />
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">DAKORA <span className="text-dakora-green">BUSINESS</span></h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Expertise Agricole • Douala, CM</p>
            </div>
            <div className="text-right">
              <span className="px-5 py-2 bg-dakora-green text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Facture Pro-Forma</span>
              <p className="mt-4 text-xs font-bold text-gray-400">DATE: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-16 border-l-4 border-dakora-green pl-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Facturé à :</p>
              <p className="text-xl font-black dark:text-white uppercase tracking-tighter">
                {orderData.customer_first_name || '...'} {orderData.customer_last_name || '...'}
              </p>
              <p className="text-sm font-bold text-dakora-green">{orderData.phone || '6XXXXXXXX'}</p>
              <p className="text-xs text-gray-400 italic">{orderData.email}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Livraison :</p>
              <p className="text-xs font-black dark:text-white uppercase">{orderData.delivery_mode}</p>
              <p className="text-[10px] text-gray-400 italic">{orderData.address || 'Douala, Cameroun'}</p>
            </div>
          </div>

          <div className="space-y-4 mb-16">
            <div className="grid grid-cols-12 pb-4 border-b-2 border-black/5 text-[10px] font-black uppercase text-gray-400">
              <div className="col-span-8">Description du Matériel</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            {cart.map(item => (
              <div key={item.id} className="grid grid-cols-12 py-3 items-center border-b border-black/5 animate-in slide-in-from-left-2">
                <div className="col-span-8">
                  <p className="font-black dark:text-white uppercase text-sm tracking-tight">{language === 'fr' ? item.name_fr : item.name_en}</p>
                  <p className="text-[9px] font-bold text-dakora-green uppercase tracking-widest">{language === 'fr' ? item.variant_label_fr : item.variant_label_en}</p>
                </div>
                <div className="col-span-2 text-center font-bold dark:text-white">x{item.quantity}</div>
                <div className="col-span-2 text-right font-black dark:text-white">{(item.price * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-8 border-t-4 border-double border-black/10">
            <div className="w-64 space-y-4">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase"><span>Sous-total</span><span>{totalAmount.toLocaleString()} FCFA</span></div>
              <div className="flex justify-between items-center p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-black/5 shadow-inner">
                <span className="text-[10px] font-black uppercase text-dakora-green">Total Net</span>
                <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{totalAmount.toLocaleString()} <span className="text-xs">FCFA</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* --- DROITE : FORMULAIRE DE SAISIE PRO (STATIC LABELS) --- */}
        <div className="lg:col-span-5 space-y-8 print:hidden">
          <form onSubmit={handleFinalizeOrder} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[3.5rem] p-10 border border-white/20 shadow-xl space-y-10 sticky top-28">
            
            {/* SECTION 1 : CLIENT */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-dakora-green/10 pb-4">
                <User size={18} className="text-dakora-green"/>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white italic">Informations Client</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Prénom *</label>
                  <input type="text" value={orderData.customer_first_name} onChange={e => setOrderData({...orderData, customer_first_name: e.target.value})} className="input-pro w-full" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Nom *</label>
                  <input type="text" value={orderData.customer_last_name} onChange={e => setOrderData({...orderData, customer_last_name: e.target.value})} className="input-pro w-full" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Téléphone *</label>
                  <input type="tel" value={orderData.phone} onChange={e => setOrderData({...orderData, phone: e.target.value})} className="input-pro w-full font-black" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Email</label>
                  <input type="email" value={orderData.email} onChange={e => setOrderData({...orderData, email: e.target.value})} className="input-pro w-full" />
                </div>
              </div>
            </div>

            {/* SECTION 2 : LIVRAISON + MAP */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-dakora-green/10 pb-4">
                <MapPin size={18} className="text-dakora-green"/>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white italic">Mode de Livraison</h3>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOrderData({...orderData, delivery_mode: 'retrait'})} className={`flex-1 py-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${orderData.delivery_mode === 'retrait' ? 'border-dakora-green bg-dakora-green/5 text-dakora-green shadow-inner' : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-400'}`}>Boutique</button>
                <button type="button" onClick={() => setOrderData({...orderData, delivery_mode: 'domicile'})} className={`flex-1 py-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all ${orderData.delivery_mode === 'domicile' ? 'border-dakora-green bg-dakora-green/5 text-dakora-green shadow-inner' : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-400'}`}>Domicile</button>
              </div>

              {orderData.delivery_mode === 'domicile' && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Pointer votre adresse sur la carte :</label>
                  <div className="h-48 rounded-[2rem] overflow-hidden border border-black/5 shadow-2xl relative z-0">
                    <MapContainer center={[4.0511, 9.7679]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapEvents />
                      <Marker position={[orderData.latitude, orderData.longitude]} />
                    </MapContainer>
                    <div className="absolute top-2 right-2 bg-white/80 p-2 rounded-lg text-[8px] font-bold z-[400] text-dakora-green shadow-sm">GPS OK</div>
                  </div>
                  <input type="text" placeholder="Quartier, porte, détails..." value={orderData.address} onChange={e => setOrderData({...orderData, address: e.target.value})} className="input-pro w-full" required />
                </div>
              )}
            </div>

            {/* SECTION 3 : PAIEMENT */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-dakora-green/10 pb-4">
                <CreditCard size={18} className="text-dakora-green"/>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white italic">Paiement</h3>
              </div>
              <div className="space-y-4">
                <select value={orderData.payment_mode} onChange={e => setOrderData({...orderData, payment_mode: e.target.value})} className="input-pro w-full font-black uppercase text-xs">
                  <option value="Cash">💵 Cash à la livraison</option>
                  <option value="WhatsApp">💬 Payer via WhatsApp</option>
                </select>
                {orderData.payment_mode !== 'Cash' && <input type="text" placeholder="Réf. transaction (optionnel)" value={orderData.payment_ref} onChange={e => setOrderData({...orderData, payment_ref: e.target.value})} className="input-pro w-full text-[10px]" />}
              </div>
            </div>

            {/* BOUTON VALIDATION */}
            <button 
              type="submit" 
              disabled={loading || !orderData.phone || !orderData.customer_first_name}
              className="w-full py-6 bg-dakora-green text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={24}/> : <><MessageCircle size={20}/> Valider & WhatsApp</>}
            </button>

          </form>
        </div>
      </div>

      <style>{`
        .input-pro { @apply p-5 rounded-[1.5rem] bg-gray-50 dark:bg-black/20 border-none focus:ring-2 focus:ring-dakora-green text-xs font-bold dark:text-white transition-all placeholder:text-gray-300; }
        @media print {
          body * { visibility: hidden; }
          #invoice-capture, #invoice-capture * { visibility: visible; }
          #invoice-capture { position: fixed; left: 0; top: 0; width: 100%; padding: 40px; }
          .print\\:hidden { display: none !important; }
        }
        .leaflet-container { cursor: crosshair; }
      `}</style>
    </div>
  );
};

export default CartPage;