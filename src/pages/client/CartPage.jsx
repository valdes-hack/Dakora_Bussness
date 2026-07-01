import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../api/supabaseClient';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { rules } from '../../utils/validation';
import { 
  ShoppingBag, User, MapPin, Navigation,
  CreditCard, CheckCircle2, Loader2, MessageCircle, Printer, X, Plus, Minus
} from 'lucide-react';
import logo from '../../assets/logo.jpeg';

// Correction icône Marker Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── COMPOSANTS CARTE ────────────────────────────────────────────────────────

// Recentre la carte quand les coords changent (depuis geolocation)
const MapRecenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng]); // eslint-disable-line
  return null;
};

// Écoute les clics sur la carte → met à jour la position du marqueur
const MapClickHandler = ({ onMove }) => {
  useMapEvents({
    click(e) { onMove(e.latlng.lat, e.latlng.lng); }
  });
  return null;
};

// Reverse geocoding via OpenStreetMap Nominatim (gratuit, sans clé)
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
      { headers: { 'Accept-Language': 'fr' } }
    );
    const data = await res.json();
    if (data.display_name) {
      // Construire une adresse lisible : quartier + ville
      const a = data.address || {};
      const parts = [
        a.neighbourhood || a.suburb || a.quarter || a.village,
        a.road || a.street,
        a.city || a.town || a.municipality || a.county,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
    }
  } catch { /* silencieux */ }
  return '';
};

// ─── CHAMP FORMULAIRE avec étoile + erreur ────────────────────────────────────
const OrderField = ({ label, required, value, error, children, className = '' }) => {
  const isFilled = value !== '' && value !== null && String(value).trim() !== '';
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="flex items-center gap-1 text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">
        {label}
        {required && !isFilled && <span className="text-red-500 text-xs">★</span>}
        {required && isFilled && !error && <span className="text-dakora-green text-xs">✓</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-red-500 font-bold ml-4 flex items-center gap-1 animate-in slide-in-from-top-1 duration-150">
          ⚠ {error}
        </p>
      )}
    </div>
  );
};

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const { t, language } = useLanguage();
  const { settings, deliveryCities } = useSettings();
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const [errors, setErrors] = useState({});
  // Géolocalisation
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]   = useState(null);
  const [mapCenter, setMapCenter]  = useState([4.0511, 9.7679]); // Douala par défaut
  const addressFetchRef = useRef(false); // évite les appels multiples

  // --- ÉTAT ALIGNÉ SUR TA BD (100% RESPECTÉ) ---
  const [orderData, setOrderData] = useState({
    customer_first_name: '',
    customer_last_name: '',
    phone: '',
    email: '',
    delivery_mode: 'retrait',
    address: '',
    city: '',
    payment_mode: '',
    payment_ref: '',
    latitude: 4.0511,
    longitude: 9.7679
  });

  // Gestion clic sur la carte (déplace le marqueur + reverse geocoding)
  const handleMapMove = async (lat, lng) => {
    setOrderData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    setMapCenter([lat, lng]);
    // Reverse geocoding pour mettre à jour l'adresse texte
    if (!addressFetchRef.current) {
      addressFetchRef.current = true;
      const addr = await reverseGeocode(lat, lng);
      if (addr) setOrderData(prev => ({ ...prev, address: addr }));
      clearErr('address');
      addressFetchRef.current = false;
    }
  };

  // Géolocalisation du navigateur → centre la carte + remplit l'adresse
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError(language === 'fr' ? 'Géolocalisation non supportée' : 'Geolocation not supported');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setOrderData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        setMapCenter([lat, lng]);
        // Reverse geocoding
        const addr = await reverseGeocode(lat, lng);
        if (addr) {
          setOrderData(prev => ({ ...prev, address: addr }));
          clearErr('address');
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        const msgs = {
          1: language === 'fr' ? 'Accès refusé. Activez la localisation dans votre navigateur.' : 'Access denied. Enable location in your browser.',
          2: language === 'fr' ? 'Position indisponible.' : 'Position unavailable.',
          3: language === 'fr' ? 'Délai dépassé.' : 'Timeout.',
        };
        setGeoError(msgs[err.code] || (language === 'fr' ? 'Erreur de localisation' : 'Location error'));
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  // Quand le client choisit "domicile" → demande automatiquement la position
  const handleDeliveryModeChange = (mode) => {
    setOrderData(p => ({ ...p, delivery_mode: mode }));
    clearErr('delivery_mode');
    if (mode === 'domicile') {
      requestGeolocation();
    }
  };

  const handlePrint = () => window.print();

  // Validation avec les règles centralisées
  const validate = () => {
    const newErrors = {};
    const firstNameErr = rules.nameFr(orderData.customer_first_name);
    const lastNameErr  = rules.nameFr(orderData.customer_last_name);
    const phoneErr     = rules.phone(orderData.phone);
    const emailErr     = rules.email(orderData.email);
    if (firstNameErr) newErrors.customer_first_name = firstNameErr;
    if (lastNameErr)  newErrors.customer_last_name  = lastNameErr;
    if (phoneErr)     newErrors.phone               = phoneErr;
    if (emailErr)     newErrors.email               = emailErr;
    if (!orderData.delivery_mode) newErrors.delivery_mode = 'Choisissez un mode de livraison';
    if (!orderData.payment_mode)  newErrors.payment_mode  = 'Choisissez un mode de paiement';
    if (orderData.delivery_mode === 'domicile') {
      if (!orderData.city.trim()) newErrors.city = 'La ville est obligatoire pour la livraison à domicile';
      if (!orderData.address.trim()) newErrors.address = "L'adresse est obligatoire pour la livraison à domicile";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Effacement de l'erreur dès que le champ est modifié
  const clearErr = (field) => setErrors(p => ({ ...p, [field]: null }));
  const handleFinalizeOrder = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // 1. Générer l'ID de la commande (UUID) côté client pour éviter d'avoir à la relire (contourne la restriction RLS sur le SELECT)
      const orderId = (() => {
        if (window.crypto?.randomUUID) return window.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      })();

      const { error: orderErr } = await supabase.from('orders').insert([{
        id: orderId,
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
      }]);

      if (orderErr) throw orderErr;

      // 2. Insertion table 'order_items'
      const itemsToInsert = cart.map(item => ({
        order_id: orderId,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.price
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      const ref = orderId.slice(0, 8).toUpperCase();
      setOrderNum(ref);
      
      // WhatsApp — utilise le numéro configuré dans les settings
      const waNumber = settings.whatsapp_number || '237690000000';
      const whatsappMsg = `*NOUVELLE COMMANDE #${ref}*\nClient: ${orderData.customer_first_name} ${orderData.customer_last_name}\nTél: ${orderData.phone}\nLivraison: ${orderData.delivery_mode}\nPaiement: ${orderData.payment_mode}\nMontant: ${totalAmount.toLocaleString()} FCFA\nPosition: https://www.google.com/maps?q=${orderData.latitude},${orderData.longitude}`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
      
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
    <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-6 py-8 md:py-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Finalisation</h1>
        <button onClick={handlePrint} className="hidden md:flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 shadow-sm transition-all active:scale-95">
          <Printer size={16}/> Ouvrir dans le navigateur
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-12 items-start">
        
        {/* --- GAUCHE : LA FACTURE PRO-FORMA (LIVE UPDATE) --- */}
        <div id="invoice-capture" className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[3rem] p-3 md:p-4 lg:p-8 xl:p-12 border border-black/5 dark:border-white/10 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-12 lg:mb-16 gap-3 md:gap-4">
            <div>
              <img src={logo} alt="Logo" className="h-10 md:h-12 lg:h-16 mb-2 md:mb-4" />
              <h2 className="text-lg md:text-xl lg:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">DAKORA <span className="text-dakora-green">BUSINESS</span></h2>
              <p className="text-[8px] md:text-[9px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Expertise Agricole • Douala, CM</p>
            </div>
            <div className="text-right">
              <span className="px-2 md:px-3 py-1 md:py-1.5 lg:px-5 lg:py-2 bg-dakora-green text-white rounded-full text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]">Facture Pro-Forma</span>
              <p className="mt-1.5 md:mt-2 lg:mt-4 text-[9px] md:text-[10px] lg:text-xs font-bold text-gray-400">DATE: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-10 mb-6 md:mb-12 lg:mb-16 border-l-4 border-dakora-green pl-3 md:pl-4 lg:pl-8">
            <div className="space-y-1">
              <p className="text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase text-gray-400 tracking-widest">Facturé à :</p>
              <p className="text-sm md:text-base lg:text-xl font-black dark:text-white uppercase tracking-tighter">
                {orderData.customer_first_name || '...'} {orderData.customer_last_name || '...'}
              </p>
              <p className="text-[10px] md:text-xs lg:text-sm font-bold text-dakora-green">{orderData.phone || '6XXXXXXXX'}</p>
              <p className="text-[9px] md:text-[10px] lg:text-xs text-gray-400 italic">{orderData.email}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase text-gray-400 tracking-widest">Livraison :</p>
              <p className="text-[9px] md:text-[10px] lg:text-xs font-black dark:text-white uppercase">{orderData.delivery_mode}</p>
              <p className="text-[8px] md:text-[9px] lg:text-[10px] text-gray-400 italic">{orderData.address || 'Douala, Cameroun'}</p>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3 lg:space-y-4 mb-6 md:mb-12 lg:mb-16">
            <div className="hidden md:grid grid-cols-12 pb-3 md:pb-4 border-b-2 border-black/5 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
              <div className="col-span-7">Description du Matériel</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
            {cart.map(item => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 py-2 md:py-3 items-center border-b border-black/5 animate-in slide-in-from-left-2 gap-2 md:gap-0">
                <div className="col-span-1 md:col-span-7 flex items-center gap-2 md:gap-3">
                  {/* Miniature produit */}
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name_fr}
                      loading="lazy"
                      className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover flex-shrink-0 border border-black/5 print:hidden"
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gray-100 flex items-center justify-center text-sm md:text-lg flex-shrink-0 print:hidden">📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black dark:text-white uppercase text-[10px] md:text-xs lg:text-sm tracking-tight line-clamp-1">{language === 'fr' ? item.name_fr : item.name_en}</p>
                    <p className="text-[7px] md:text-[8px] lg:text-[9px] font-bold text-dakora-green uppercase tracking-widest">{language === 'fr' ? item.variant_label_fr : item.variant_label_en}</p>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 flex md:block justify-between items-center md:text-center">
                  <span className="text-[7px] md:hidden font-bold text-gray-400 uppercase">Qté:</span>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-dakora-green hover:text-white transition-all print:hidden"><Minus size={8}/></button>
                    <span className="font-bold dark:text-white text-[10px] md:text-xs lg:text-sm w-4 md:w-5 lg:w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-dakora-green hover:text-white transition-all print:hidden"><Plus size={8}/></button>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 flex md:block justify-between items-center md:text-right font-black dark:text-white text-[10px] md:text-xs lg:text-sm">
                  <span className="text-[7px] md:hidden font-bold text-gray-400 uppercase">Total:</span>
                  {(item.price * item.quantity).toLocaleString()}
                </div>
                <div className="col-span-1 flex justify-end print:hidden">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Supprimer l'article"
                    className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded-full bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                  >
                    <X size={10}/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 md:pt-6 lg:pt-8 border-t-4 border-double border-black/10">
            <div className="w-full md:w-56 lg:w-64 space-y-2 md:space-y-3 lg:space-y-4">
              <div className="flex justify-between text-[8px] md:text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase"><span>Sous-total</span><span>{totalAmount.toLocaleString()} FCFA</span></div>
              <div className="flex justify-between items-center p-3 md:p-4 lg:p-6 bg-gray-50 dark:bg-white/5 rounded-xl md:rounded-2xl lg:rounded-3xl border border-black/5 shadow-inner">
                <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase text-dakora-green">Total Net</span>
                <span className="text-lg md:text-xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{totalAmount.toLocaleString()} <span className="text-[9px] md:text-[10px] lg:text-xs">FCFA</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* --- DROITE : FORMULAIRE DE SAISIE PRO (STATIC LABELS) --- */}
        <div className="lg:col-span-5 space-y-4 md:space-y-6 lg:space-y-8 print:hidden">
          <form onSubmit={handleFinalizeOrder} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[3.5rem] p-4 md:p-6 lg:p-10 border border-white/20 shadow-xl space-y-4 md:space-y-6 lg:space-y-10 sticky top-20 md:top-28">
            
            {/* SECTION 1 : CLIENT */}
            <div className="space-y-3 md:space-y-4 lg:space-y-6">
              <div className="flex items-center gap-2 border-b border-dakora-green/10 pb-2 md:pb-3 lg:pb-4">
                <User size={14} className="text-dakora-green"/>
                <h3 className="text-[9px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white italic">Informations Client</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                <OrderField label="Prénom" required value={orderData.customer_first_name} error={errors.customer_first_name}>
                  <input type="text" value={orderData.customer_first_name}
                    onChange={e => { setOrderData({...orderData, customer_first_name: e.target.value}); clearErr('customer_first_name'); }}
                    className={`input-pro w-full ${errors.customer_first_name ? 'ring-2 ring-red-400 bg-red-50/50' : ''}`}
                    placeholder="Jean"/>
                </OrderField>
                <OrderField label="Nom" required value={orderData.customer_last_name} error={errors.customer_last_name}>
                  <input type="text" value={orderData.customer_last_name}
                    onChange={e => { setOrderData({...orderData, customer_last_name: e.target.value}); clearErr('customer_last_name'); }}
                    className={`input-pro w-full ${errors.customer_last_name ? 'ring-2 ring-red-400 bg-red-50/50' : ''}`}
                    placeholder="Dupont"/>
                </OrderField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                <OrderField label="Téléphone" required value={orderData.phone} error={errors.phone}>
                  <input type="tel" value={orderData.phone}
                    onChange={e => { setOrderData({...orderData, phone: e.target.value}); clearErr('phone'); }}
                    className={`input-pro w-full font-black ${errors.phone ? 'ring-2 ring-red-400 bg-red-50/50' : ''}`}
                    placeholder="690000000"/>
                </OrderField>
                <OrderField label="Email" value={orderData.email} error={errors.email}>
                  <input type="email" value={orderData.email}
                    onChange={e => { setOrderData({...orderData, email: e.target.value}); clearErr('email'); }}
                    className={`input-pro w-full ${errors.email ? 'ring-2 ring-red-400 bg-red-50/50' : ''}`}
                    placeholder="jean@email.com"/>
                </OrderField>
              </div>
            </div>

            {/* SECTION 2 : LIVRAISON + MAP */}
            <div className="space-y-3 md:space-y-4 lg:space-y-6">
              <div className="flex items-center gap-2 border-b border-dakora-green/10 pb-2 md:pb-3 lg:pb-4">
                <MapPin size={14} className="text-dakora-green"/>
                <h3 className="text-[9px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white italic">
                  Mode de Livraison <span className="text-red-500 text-[9px] md:text-[10px] lg:text-xs">★</span>
                </h3>
              </div>
              <div className="flex gap-2 md:gap-3">
                {[
                  { val: 'retrait', label: '🏪 Boutique' },
                  { val: 'domicile', label: '🏠 Domicile' }
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => handleDeliveryModeChange(opt.val)}
                    className={`flex-1 py-2 md:py-3 lg:py-4 rounded-lg md:rounded-xl lg:rounded-2xl border-2 text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase transition-all ${
                      orderData.delivery_mode === opt.val
                        ? 'border-dakora-green bg-dakora-green/5 text-dakora-green shadow-inner'
                        : errors.delivery_mode
                          ? 'border-red-300 bg-red-50/30 text-gray-400'
                          : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-400'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {errors.delivery_mode && (
                <p className="text-[8px] md:text-[9px] lg:text-[10px] text-red-500 font-bold ml-4 flex items-center gap-1">⚠ {errors.delivery_mode}</p>
              )}

              {orderData.delivery_mode === 'domicile' && (
                <div className="space-y-2 md:space-y-3 lg:space-y-4 animate-in slide-in-from-top-4 duration-500">
                  {/* Bandeau état géolocalisation */}
                  {geoLoading && (
                    <div className="flex items-center gap-2 px-2 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-3 bg-dakora-green/5 border border-dakora-green/20 rounded-lg md:rounded-xl lg:rounded-2xl animate-pulse">
                      <Loader2 size={12} className="animate-spin text-dakora-green flex-shrink-0"/>
                      <p className="text-[8px] md:text-[9px] lg:text-[10px] font-bold text-dakora-green">
                        {language === 'fr' ? 'Récupération de votre position GPS...' : 'Getting your GPS location...'}
                      </p>
                    </div>
                  )}
                  {geoError && (
                    <div className="flex items-center gap-2 px-2 md:px-3 lg:px-4 py-1.5 md:py-2 lg:py-3 bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-lg md:rounded-xl lg:rounded-2xl">
                      <MapPin size={12} className="text-orange-500 flex-shrink-0"/>
                      <p className="text-[8px] md:text-[9px] lg:text-[10px] font-bold text-orange-600">{geoError}</p>
                    </div>
                  )}

                  {/* Carte */}
                  <div className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <p className="text-[7px] md:text-[8px] lg:text-[9px] font-black uppercase text-gray-400 ml-1">
                        {language === 'fr' ? 'Cliquez sur la carte pour ajuster votre position exacte' : 'Click on the map to adjust your exact position'}
                      </p>
                      {/* Bouton "Ma position" */}
                      <button type="button" onClick={requestGeolocation} disabled={geoLoading}
                        className="flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-dakora-green/10 text-dakora-green hover:bg-dakora-green hover:text-white rounded-lg md:rounded-xl text-[7px] md:text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50">
                        <Navigation size={11} className={geoLoading ? 'animate-spin' : ''}/>
                        {language === 'fr' ? 'Ma position' : 'My location'}
                      </button>
                    </div>

                    <div className="h-40 md:h-48 lg:h-52 rounded-[1.2rem] md:rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border border-black/5 dark:border-white/10 shadow-xl relative z-0">
                      <MapContainer
                        center={mapCenter}
                        zoom={15}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                        <MapRecenter lat={mapCenter[0]} lng={mapCenter[1]}/>
                        <MapClickHandler onMove={handleMapMove}/>
                        <Marker
                          position={[orderData.latitude, orderData.longitude]}
                          draggable
                          eventHandlers={{
                            dragend: (e) => {
                              const { lat, lng } = e.target.getLatLng();
                              handleMapMove(lat, lng);
                            }
                          }}
                        />
                      </MapContainer>

                      {/* Badge GPS */}
                      <div className="absolute top-1.5 md:top-2 right-1.5 md:right-2 z-[400] bg-white/90 dark:bg-black/70 backdrop-blur-sm px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 lg:py-1.5 rounded-lg md:rounded-xl shadow-lg border border-black/5 flex items-center gap-1 md:gap-1.5">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 lg:w-2 lg:h-2 bg-dakora-green rounded-full animate-pulse flex-shrink-0"/>
                        <span className="text-[6px] md:text-[7px] lg:text-[8px] font-black uppercase text-dakora-green">
                          {orderData.latitude.toFixed(4)}, {orderData.longitude.toFixed(4)}
                        </span>
                      </div>

                      {/* Instruction clic */}
                      <div className="absolute bottom-1.5 md:bottom-2 left-1/2 -translate-x-1/2 z-[400] bg-black/60 text-white text-[6px] md:text-[7px] lg:text-[8px] font-bold px-1.5 md:px-2 lg:px-3 py-0.5 md:py-1 rounded-full">
                        {language === 'fr' ? '📍 Cliquez ou glissez le marqueur' : '📍 Click or drag the marker'}
                      </div>
                    </div>
                  </div>

                  {/* Champ ville — sélection depuis la liste admin */}
                  <OrderField
                    label={language === 'fr' ? 'Ville de livraison' : 'Delivery City'}
                    required
                    value={orderData.city}
                    error={errors.city}
                  >
                    <select
                      value={orderData.city}
                      onChange={e => { setOrderData(p => ({...p, city: e.target.value})); clearErr('city'); }}
                      className={`input-pro w-full ${errors.city ? 'ring-2 ring-red-400 bg-red-50/50 dark:bg-red-500/5' : ''}`}
                    >
                      <option value="">{language === 'fr' ? 'Sélectionnez une ville' : 'Select a city'}</option>
                      {deliveryCities.map(city => (
                        <option key={city.id} value={language === 'fr' ? city.name_fr : city.name_en}>
                          {language === 'fr' ? city.name_fr : city.name_en}
                        </option>
                      ))}
                    </select>
                  </OrderField>

                  {/* Champ adresse — pré-rempli par reverse geocoding, modifiable */}
                  <OrderField
                    label={language === 'fr' ? 'Adresse (quartier, porte, détails…)' : 'Address (neighborhood, door, details…)'}
                    required
                    value={orderData.address}
                    error={errors.address}
                  >
                    <input
                      type="text"
                      value={orderData.address}
                      onChange={e => { setOrderData(p => ({...p, address: e.target.value})); clearErr('address'); }}
                      placeholder={language === 'fr' ? 'ex: Akwa, Rue de la Joie, porte 12' : 'ex: Akwa, Rue de la Joie, door 12'}
                      className={`input-pro w-full ${errors.address ? 'ring-2 ring-red-400 bg-red-50/50 dark:bg-red-500/5' : ''}`}
                    />
                  </OrderField>

                  {/* Info récupération auto */}
                  {orderData.address && !geoLoading && (
                    <p className="text-[7px] md:text-[8px] lg:text-[9px] text-dakora-green font-bold ml-4 flex items-center gap-1">
                      ✓ {language === 'fr' ? 'Adresse détectée automatiquement — modifiable' : 'Address auto-detected — editable'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3 : PAIEMENT */}
            <div className="space-y-3 md:space-y-4 lg:space-y-6">
              <div className="flex items-center gap-2 border-b border-dakora-green/10 pb-2 md:pb-3 lg:pb-4">
                <CreditCard size={14} className="text-dakora-green"/>
                <h3 className="text-[9px] md:text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white italic">
                  Paiement <span className="text-red-500 text-[9px] md:text-[10px] lg:text-xs">★</span>
                </h3>
              </div>
              <div className="space-y-2 md:space-y-3 lg:space-y-4">
                <select
                  value={orderData.payment_mode}
                  onChange={e => { setOrderData(p => ({...p, payment_mode: e.target.value})); clearErr('payment_mode'); }}
                  className={`input-pro w-full font-black uppercase text-[9px] md:text-[10px] lg:text-xs ${errors.payment_mode ? 'ring-2 ring-red-400 bg-red-50/50' : ''}`}
                >
                  <option value="">— Choisir un mode de paiement —</option>
                  <option value="Cash">💵 Cash à la livraison</option>
                  <option value="WhatsApp">💬 Payer via WhatsApp</option>
                  <option value="MoMo">📱 MTN Mobile Money</option>
                  <option value="OM">🟠 Orange Money</option>
                </select>
                {errors.payment_mode && (
                  <p className="text-[8px] md:text-[9px] lg:text-[10px] text-red-500 font-bold ml-4 flex items-center gap-1">⚠ {errors.payment_mode}</p>
                )}
                {orderData.payment_mode && orderData.payment_mode !== 'Cash' && (
                  <input
                    type="text"
                    placeholder="Réf. transaction (optionnel)"
                    value={orderData.payment_ref}
                    onChange={e => setOrderData(p => ({...p, payment_ref: e.target.value}))}
                    className="input-pro w-full text-[8px] md:text-[9px] lg:text-[10px]"
                  />
                )}
              </div>
            </div>

            {/* BOUTON VALIDATION */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 md:py-4 lg:py-6 bg-dakora-green text-white rounded-[1.2rem] md:rounded-[1.5rem] lg:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] lg:text-xs shadow-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 md:gap-3 disabled:opacity-30 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={18}/> : <><MessageCircle size={16}/> Valider & WhatsApp</>}
            </button>

          </form>
        </div>
      </div>

      <style>{`
        .input-pro { @apply p-2 md:p-3 lg:p-5 rounded-[1rem] md:rounded-[1.2rem] lg:rounded-[1.5rem] bg-gray-50 dark:bg-black/20 border-none focus:ring-2 focus:ring-dakora-green text-[9px] md:text-[10px] lg:text-xs font-bold dark:text-white transition-all placeholder:text-gray-300; }
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