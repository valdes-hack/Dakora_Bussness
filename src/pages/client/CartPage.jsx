import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, CreditCard } from 'lucide-react';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, totalAmount, totalItems } = useCart();
  const { t, language } = useLanguage();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-dakora-green/10 text-dakora-green rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-2">
          {t('cart_empty')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-xs font-medium">
          {t('empty_msg')}
        </p>
        <Link 
          to="/boutique" 
          className="px-8 py-4 bg-dakora-green text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-all"
        >
          {t('continue_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex items-center gap-4 mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none">
          {t('cart_title').split(' ')[0]} <span className="text-dakora-green">{t('cart_title').split(' ').slice(1).join(' ')}</span>
        </h1>
        <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-500 rounded-full text-xs font-bold">
          {totalItems} {t('items_count')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* LISTE DES ARTICLES (GAUCHE) */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div 
              key={item.id} 
              className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md rounded-[2.5rem] p-4 sm:p-6 border border-white/20 shadow-xl flex flex-col sm:flex-row items-center gap-6"
            >
              {/* IMAGE */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-gray-100 dark:bg-black/20 flex-shrink-0">
                <img src={item.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt={item.name_fr} />
              </div>

              {/* INFOS */}
              <div className="flex-grow text-center sm:text-left">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                  {language === 'fr' ? item.name_fr : item.name_en}
                </h3>
                <p className="text-dakora-green text-xs font-bold uppercase tracking-widest mt-1">
                  {language === 'fr' ? item.variant_label_fr : item.variant_label_en}
                </p>
                <p className="text-gray-400 text-sm font-black mt-2">
                  {item.price.toLocaleString()} <span className="text-[10px]">FCFA</span>
                </p>
              </div>

              {/* QUANTITÉ & SUPPRIMER */}
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-2xl p-1 border border-black/5">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-gray-500"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-black dark:text-white">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-gray-500"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}

          <Link to="/boutique" className="inline-flex items-center gap-2 text-gray-400 hover:text-dakora-green font-bold text-xs uppercase tracking-widest transition-colors mt-4">
            <ArrowLeft size={14} /> {t('continue_shopping')}
          </Link>
        </div>

        {/* RÉSUMÉ (DROITE) */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-[3rem] p-10 border border-white/20 shadow-2xl sticky top-32">
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-8 border-b border-black/5 dark:border-white/5 pb-4">
            {t('summary')}
          </h2>

          <div className="space-y-4 mb-10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">{t('subtotal')}</span>
              <span className="font-black dark:text-white">{totalAmount.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-start text-sm">
              <span className="text-gray-500 font-medium">{t('shipping')}</span>
              <span className="text-[10px] text-right text-gray-400 uppercase italic max-w-[120px] leading-tight">
                {t('shipping_note')}
              </span>
            </div>
            <div className="pt-4 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
              <span className="text-xs font-black uppercase text-dakora-green">Total</span>
              <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                {totalAmount.toLocaleString()} <span className="text-sm">FCFA</span>
              </span>
            </div>
          </div>

          <Link 
            to="/commande" 
            className="w-full py-5 bg-dakora-green text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <CreditCard size={20} />
            {t('cart_checkout')}
          </Link>
        </div>

      </div>
    </div>
  );
};

export default CartPage;