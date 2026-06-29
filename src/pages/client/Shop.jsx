import { useState, useCallback, memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useDataCache } from '../../context/DataCacheContext';
import { useSettings } from '../../context/SettingsContext';
import { ShoppingCart, Check, MessageSquare } from 'lucide-react';

// ─── SKELETON ────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-[3.5rem] bg-white/60 dark:bg-white/5 border border-white/20 overflow-hidden animate-pulse">
    <div className="aspect-[4/5] bg-gray-200 dark:bg-white/10" />
    <div className="p-6 space-y-3">
      <div className="h-2 w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
      <div className="h-5 w-3/4 bg-gray-200 dark:bg-white/10 rounded-full" />
      <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded-full" />
    </div>
  </div>
);

// ─── CARTE PRODUIT mémorisée ──────────────────────────────────────────────────
const ProductCard = memo(({ product, language, t, onAddToCart, onWhatsApp, isAdded }) => {
  const minPrice = useMemo(
    () => product.variants?.length
      ? Math.min(...product.variants.map(v => Number(v.price)))
      : 0,
    [product.variants]
  );
  const imageUrl = product.product_images?.[0]?.url;
  const name     = language === 'fr' ? product.name_fr : product.name_en;
  const category = language === 'fr' ? product.categories?.name_fr : product.categories?.name_en;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-[3.5rem] p-4 border border-white/20 shadow-xl hover:shadow-dakora-green/10 transition-shadow duration-200 flex flex-col will-change-auto">

      <Link to={`/produit/${product.id}`}
        className="relative aspect-[4/5] rounded-[2.8rem] overflow-hidden mb-5 bg-gray-100 dark:bg-black/40 block">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
            alt={name}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700">
            <span className="text-5xl">📦</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image indisponible</span>
          </div>
        )}
        {product.badge && (
          <span className="absolute top-5 left-5 px-3 py-1.5 bg-dakora-yellow text-yellow-900 text-[10px] font-black uppercase rounded-full shadow-lg">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="px-3 pb-3 flex flex-col flex-grow">
        {category && (
          <span className="text-[10px] font-black text-dakora-green uppercase tracking-[0.2em] mb-1">{category}</span>
        )}
        <Link to={`/produit/${product.id}`}>
          <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-4 tracking-tighter hover:text-dakora-green transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>
        <div className="mt-auto">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{t('price_from')}</p>
              <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                {minPrice.toLocaleString()} <span className="text-xs text-dakora-green">FCFA</span>
              </p>
            </div>
            <button
              onClick={e => { e.preventDefault(); onAddToCart(product); }}
              aria-label={t('add_to_cart')}
              className={`p-4 rounded-2xl shadow transition-all duration-150 active:scale-90 ${
                isAdded ? 'bg-green-500 text-white' : 'bg-dakora-green text-white hover:bg-green-700'
              }`}
            >
              {isAdded ? <Check size={20} /> : <ShoppingCart size={20} />}
            </button>
          </div>
          {/* Bouton WhatsApp direct */}
          <button
            onClick={e => { e.preventDefault(); onWhatsApp(product); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <MessageSquare size={14}/> Commander
          </button>
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';

// ─── PAGE ─────────────────────────────────────────────────────────────────────
const Shop = () => {
  const { t, language } = useLanguage();
  const { addToCart }   = useCart();
  const { settings }    = useSettings();
  const { products, categories, ready } = useDataCache();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addedId, setAddedId] = useState(null);

  const handleAddToCart = useCallback((product) => {
    if (!product.variants?.length) return;
    const variant = [...product.variants].sort((a, b) => a.price - b.price)[0];
    addToCart(product, variant, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  }, [addToCart]);

  const handleWhatsApp = useCallback((product) => {
    const waNumber = settings.whatsapp_number || '237690000000';
    const name = language === 'fr' ? product.name_fr : product.name_en;
    const minPrice = product.variants?.length
      ? Math.min(...product.variants.map(v => Number(v.price)))
      : 0;
    const msg = `Bonjour Dakora Business 👋\nJe suis intéressé(e) par :\n*${name}* — à partir de ${minPrice.toLocaleString()} FCFA\nPouvez-vous m'en dire plus ?`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  }, [settings.whatsapp_number, language]);

  // Filtrage mémorisé — ne recalcule que si la catégorie ou les produits changent
  const filteredProducts = useMemo(
    () => selectedCategory === 'all'
      ? products
      : products.filter(p => p.category_id === selectedCategory),
    [products, selectedCategory]
  );

  return (
    <div className="min-h-screen pb-20">

      {/* HEADER */}
      <section className="pt-10 pb-10 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-3">
          {t('shop_title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto">
          {t('shop_subtitle')}
        </p>
      </section>

      {/* FILTRES */}
      <div className="sticky top-24 z-40 px-4 mb-10">
        <div className="max-w-5xl mx-auto bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-white/20 p-2 rounded-[2rem] shadow-xl flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${
              selectedCategory === 'all' ? 'bg-dakora-green text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            {t('filter_all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${
                selectedCategory === cat.id ? 'bg-dakora-green text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              {cat.icon_url} {language === 'fr' ? cat.name_fr : cat.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {!ready ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, n) => <SkeletonCard key={n} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/20 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/10">
            <p className="text-gray-400 italic font-bold">{t('no_products')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                language={language}
                t={t}
                onAddToCart={handleAddToCart}
                onWhatsApp={handleWhatsApp}
                isAdded={addedId === product.id}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
    </div>
  );
};

export default Shop;
